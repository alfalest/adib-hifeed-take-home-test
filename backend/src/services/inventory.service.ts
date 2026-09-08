import prisma from '../lib/prisma';
import { Prisma, BatchStatus, MutationType } from '@prisma/client';
import { createApiError } from '../middleware/errorHandler';
import type { InboundInput, ScanDispatchInput, MutationQuery, ItemsQuery, BatchesQuery } from '../validators/inventory.validator';

/**
 * Inventory Service
 * Handles all business logic for inventory management with atomic transactions.
 */
export class InventoryService {

  /**
   * GET /api/v1/inventory/items
   * Returns list of feed items with total active stock and is_low_stock flag.
   */
  async getItems(query: ItemsQuery) {
    const { search, category, low_stock_only, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.FeedItemWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (low_stock_only) {
      where.current_stock = { lte: prisma.feedItem.fields.min_stock as any };
      // Use raw query for this comparison
    }

    const [items, total] = await Promise.all([
      prisma.feedItem.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          batches: {
            where: { status: 'ACTIVE' },
            select: { id: true, batch_number: true, current_qty: true, expired_date: true },
          },
        },
      }),
      prisma.feedItem.count({ where }),
    ]);

    const result = items.map((item) => ({
      ...item,
      is_low_stock: item.current_stock <= item.min_stock,
      active_batches_count: item.batches.length,
      batches: undefined, // Remove batches from response
    }));

    // Filter low_stock_only in-memory if needed
    const filteredResult = low_stock_only
      ? result.filter((item) => item.is_low_stock)
      : result;

    return {
      data: filteredResult,
      pagination: {
        page,
        limit,
        total: low_stock_only ? filteredResult.length : total,
        total_pages: Math.ceil((low_stock_only ? filteredResult.length : total) / limit),
      },
    };
  }

  /**
   * GET /api/v1/inventory/batches
   * Returns list of batches with remaining qty and expiry status.
   */
  async getBatches(query: BatchesQuery) {
    const { feed_item_id, status, search, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.StockBatchWhereInput = {};

    if (feed_item_id) {
      where.feed_item_id = feed_item_id;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { batch_number: { contains: search } },
        { qr_payload: { contains: search } },
        { feed_item: { name: { contains: search } } },
        { feed_item: { sku: { contains: search } } },
      ];
    }

    const [batches, total] = await Promise.all([
      prisma.stockBatch.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          feed_item: {
            select: { id: true, sku: true, name: true, category: true, unit: true },
          },
        },
      }),
      prisma.stockBatch.count({ where }),
    ]);

    const now = new Date();
    const result = batches.map((batch) => {
      const daysUntilExpiry = Math.ceil(
        (batch.expired_date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        ...batch,
        is_expired: daysUntilExpiry <= 0,
        is_near_expiry: daysUntilExpiry > 0 && daysUntilExpiry <= 30,
        days_until_expiry: daysUntilExpiry,
      };
    });

    return {
      data: result,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * POST /api/v1/inventory/inbound
   * Adds a new batch or adds stock to an existing batch.
   * Uses atomic transaction to ensure data integrity.
   */
  async processInbound(input: InboundInput, createdBy: string) {
    const { batch_number, feed_item_id, sku, quantity, expired_date, notes } = input;

    return await prisma.$transaction(async (tx) => {
      // 1. Find the feed item
      let feedItem;
      if (feed_item_id) {
        feedItem = await tx.feedItem.findUnique({ where: { id: feed_item_id } });
      } else if (sku) {
        feedItem = await tx.feedItem.findUnique({ where: { sku } });
      }

      if (!feedItem) {
        throw createApiError(404, 'Feed item not found');
      }

      // 2. Check if batch already exists
      let batch = await tx.stockBatch.findUnique({
        where: { batch_number },
      });

      if (batch) {
        // Add to existing batch
        if (batch.feed_item_id !== feedItem.id) {
          throw createApiError(400, 'Batch belongs to a different feed item');
        }

        batch = await tx.stockBatch.update({
          where: { id: batch.id },
          data: {
            current_qty: { increment: quantity },
            initial_qty: { increment: quantity },
            status: 'ACTIVE',
          },
        });
      } else {
        // Create new batch
        const qrPayload = JSON.stringify({
          batch_number,
          sku: feedItem.sku,
          feed_item_id: feedItem.id,
        });

        batch = await tx.stockBatch.create({
          data: {
            batch_number,
            feed_item_id: feedItem.id,
            expired_date: new Date(expired_date),
            initial_qty: quantity,
            current_qty: quantity,
            qr_payload: qrPayload,
            status: 'ACTIVE',
          },
        });
      }

      // 3. Update feed item current_stock
      const updatedFeedItem = await tx.feedItem.update({
        where: { id: feedItem.id },
        data: {
          current_stock: { increment: quantity },
        },
      });

      // 4. Create mutation record (audit log)
      const mutation = await tx.stockMutation.create({
        data: {
          batch_id: batch.id,
          feed_item_id: feedItem.id,
          type: 'INBOUND',
          quantity,
          notes: notes || `Inbound ${quantity} units to batch ${batch_number}`,
          created_by: createdBy,
        },
      });

      return {
        mutation,
        batch,
        feed_item: updatedFeedItem,
      };
    });
  }

  /**
   * POST /api/v1/inventory/scan-dispatch
   * Reduces batch qty based on QR/Barcode scan payload.
   * Uses atomic transaction to prevent race conditions.
   */
  async processDispatch(input: ScanDispatchInput, createdBy: string) {
    const { qr_payload, batch_id, quantity, notes } = input;

    return await prisma.$transaction(async (tx) => {
      // 1. Find the batch
      let batch;
      if (batch_id) {
        batch = await tx.stockBatch.findUnique({
          where: { id: batch_id },
          include: { feed_item: true },
        });
      } else if (qr_payload) {
        // 1. Try exact match on qr_payload
        batch = await tx.stockBatch.findFirst({
          where: { qr_payload },
          include: { feed_item: true },
        });

        // 2. Try match on batch_number directly
        if (!batch) {
          batch = await tx.stockBatch.findUnique({
            where: { batch_number: qr_payload },
            include: { feed_item: true },
          });
        }

        // 3. Try parsing JSON payload (e.g. {"batch_number": "...", "sku": "..."})
        if (!batch) {
          try {
            const parsed = JSON.parse(qr_payload);
            const targetBatchNo = parsed.batch_number || parsed.batch_no;
            if (targetBatchNo) {
              batch = await tx.stockBatch.findUnique({
                where: { batch_number: targetBatchNo },
                include: { feed_item: true },
              });
            }
          } catch {
            // Not a valid JSON payload string, ignore
          }
        }
      }

      if (!batch) {
        throw createApiError(404, 'Batch not found. Please check the QR code or batch ID.');
      }

      // 2. Validate batch status
      if (batch.status === 'DEPLETED') {
        throw createApiError(400, `Batch ${batch.batch_number} is depleted. No stock available.`);
      }

      if (batch.status === 'EXPIRED') {
        throw createApiError(400, `Batch ${batch.batch_number} is expired. Cannot dispatch expired stock.`);
      }

      // 3. Validate quantity
      if (quantity > batch.current_qty) {
        throw createApiError(
          400,
          `Insufficient stock. Batch ${batch.batch_number} only has ${batch.current_qty} units remaining. Requested: ${quantity}.`
        );
      }

      // 4. Update batch qty
      const newQty = batch.current_qty - quantity;
      const updatedBatch = await tx.stockBatch.update({
        where: { id: batch.id },
        data: {
          current_qty: newQty,
          status: newQty === 0 ? 'DEPLETED' : 'ACTIVE',
        },
      });

      // 5. Update feed item current_stock
      const updatedFeedItem = await tx.feedItem.update({
        where: { id: batch.feed_item_id },
        data: {
          current_stock: { decrement: quantity },
        },
      });

      // 6. Create mutation record (audit log)
      const mutation = await tx.stockMutation.create({
        data: {
          batch_id: batch.id,
          feed_item_id: batch.feed_item_id,
          type: 'DISPATCH',
          quantity,
          notes: notes || `Dispatch ${quantity} units from batch ${batch.batch_number}`,
          created_by: createdBy,
        },
      });

      return {
        mutation,
        batch: updatedBatch,
        feed_item: updatedFeedItem,
      };
    });
  }

  /**
   * GET /api/v1/inventory/mutations
   * Returns mutation history (audit log) ordered by most recent first.
   */
  async getMutations(query: MutationQuery) {
    const { type, feed_item_id, search, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.StockMutationWhereInput = {};

    if (type) {
      where.type = type;
    }

    if (feed_item_id) {
      where.feed_item_id = feed_item_id;
    }

    if (search) {
      where.feed_item = {
        OR: [
          { name: { contains: search } },
          { sku: { contains: search } },
        ],
      };
    }

    const [mutations, total] = await Promise.all([
      prisma.stockMutation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          feed_item: {
            select: { id: true, sku: true, name: true, category: true, unit: true },
          },
          batch: {
            select: { id: true, batch_number: true, current_qty: true, status: true },
          },
        },
      }),
      prisma.stockMutation.count({ where }),
    ]);

    return {
      data: mutations,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }
}

export const inventoryService = new InventoryService();
