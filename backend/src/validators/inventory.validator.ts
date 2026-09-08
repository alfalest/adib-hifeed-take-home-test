import { z } from 'zod';

/**
 * Validator for POST /api/v1/inventory/inbound
 * Supports both creating new batch and adding to existing batch.
 */
export const inboundSchema = z.object({
  batch_number: z.string().min(1, 'Batch number is required'),
  feed_item_id: z.string().uuid('Invalid feed item ID').optional(),
  sku: z.string().min(1).optional(),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  expired_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }),
  notes: z.string().optional(),
}).refine((data) => data.feed_item_id || data.sku, {
  message: 'Either feed_item_id or sku must be provided',
  path: ['feed_item_id'],
});

/**
 * Validator for POST /api/v1/inventory/scan-dispatch
 * Supports dispatch by qr_payload or batch_id.
 */
export const scanDispatchSchema = z.object({
  qr_payload: z.string().optional(),
  batch_id: z.string().uuid('Invalid batch ID').optional(),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  notes: z.string().optional(),
}).refine((data) => data.qr_payload || data.batch_id, {
  message: 'Either qr_payload or batch_id must be provided',
  path: ['qr_payload'],
});

/**
 * Validator for GET /api/v1/inventory/mutations query params
 */
export const mutationQuerySchema = z.object({
  type: z.enum(['INBOUND', 'DISPATCH']).optional(),
  feed_item_id: z.string().uuid().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

/**
 * Validator for GET /api/v1/inventory/items query params
 */
export const itemsQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  low_stock_only: z.coerce.boolean().optional().default(false),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

/**
 * Validator for GET /api/v1/inventory/batches query params
 */
export const batchesQuerySchema = z.object({
  feed_item_id: z.string().uuid().optional(),
  status: z.enum(['ACTIVE', 'DEPLETED', 'EXPIRED']).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type InboundInput = z.infer<typeof inboundSchema>;
export type ScanDispatchInput = z.infer<typeof scanDispatchSchema>;
export type MutationQuery = z.infer<typeof mutationQuerySchema>;
export type ItemsQuery = z.infer<typeof itemsQuerySchema>;
export type BatchesQuery = z.infer<typeof batchesQuerySchema>;
