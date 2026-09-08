import { Router, Request, Response, NextFunction } from 'express';
import { inventoryService } from '../services/inventory.service';
import {
  inboundSchema,
  scanDispatchSchema,
  mutationQuerySchema,
  itemsQuerySchema,
  batchesQuerySchema,
} from '../validators/inventory.validator';

const router = Router();

/**
 * GET /api/v1/inventory/items
 * Returns list of feed items with total active stock and is_low_stock flag.
 */
router.get('/items', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = itemsQuerySchema.parse(req.query);
    const result = await inventoryService.getItems(query);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/inventory/batches
 * Returns list of batches with remaining qty and expiry status.
 */
router.get('/batches', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = batchesQuerySchema.parse(req.query);
    const result = await inventoryService.getBatches(query);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/inventory/inbound
 * Adds a new batch or adds stock to an existing batch.
 */
router.post('/inbound', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = inboundSchema.parse(req.body);
    const createdBy = req.user?.userId || 'unknown';
    const result = await inventoryService.processInbound(input, createdBy);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/inventory/scan-dispatch
 * Reduces batch qty based on QR/Barcode scan payload.
 */
router.post('/scan-dispatch', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = scanDispatchSchema.parse(req.body);
    const createdBy = req.user?.userId || 'unknown';
    const result = await inventoryService.processDispatch(input, createdBy);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/inventory/mutations
 * Returns mutation history (audit log) ordered by most recent first.
 */
router.get('/mutations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = mutationQuerySchema.parse(req.query);
    const result = await inventoryService.getMutations(query);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

export default router;
