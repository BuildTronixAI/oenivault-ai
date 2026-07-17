import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { requireAuth } from '../middleware/auth';
import { parseBody, wineSchema, wineUpdateSchema } from '../utils/validation';
import * as inventoryService from '../services/inventoryService';

const router = Router();

router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const wines = await inventoryService.listWines(req.user!);
    res.json({ wines });
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
