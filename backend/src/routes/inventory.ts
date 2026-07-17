import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { requireAuth } from '../middleware/auth';
import { parseBody, wineSchema, wineUpdateSchema } from '../utils/validation';
import { parseWineFilters } from '../utils/wineFilters';
import * as inventoryService from '../services/inventoryService';
import { estimateValue } from '../services/valuationService';

const router = Router();

router.use(requireAuth);

router.get(
  '/filters/options',
  asyncHandler(async (req, res) => {
    const options = await inventoryService.getFilterOptions(req.user!);
    res.json(options);
  })
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const filters = parseWineFilters(req.query as Record<string, unknown>);
    const wines = await inventoryService.listWines(req.user!, filters);
    res.json({ wines, filters });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = parseBody(wineSchema, req.body);
    const wine = await inventoryService.createWine(req.user!, {
      ...body,
      quantity: body.quantity ?? 1,
    });
    res.status(201).json({ wine });
  })
);

router.post(
  '/valuate',
  asyncHandler(async (req, res) => {
    const valuation = await estimateValue({
      name: String(req.body?.name ?? ''),
      vintage: req.body?.vintage ?? null,
      region: req.body?.region ?? null,
      varietal: req.body?.varietal ?? null,
    });
    res.json({ valuation });
  })
);

router.post(
  '/:id/valuate',
  asyncHandler(async (req, res) => {
    const persist = req.body?.persist !== false;
    const result = await inventoryService.applyValuation(req.params.id, req.user!, persist);
    res.json(result);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const wine = await inventoryService.getWine(req.params.id, req.user!);
    res.json({ wine });
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const body = parseBody(wineUpdateSchema, req.body);
    const wine = await inventoryService.updateWine(req.params.id, req.user!, body);
    res.json({ wine });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await inventoryService.deleteWine(req.params.id, req.user!);
    res.status(204).send();
  })
);

export default router;
