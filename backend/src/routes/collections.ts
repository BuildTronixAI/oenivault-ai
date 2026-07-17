import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { requireAuth } from '../middleware/auth';
import { parseBody, collectionSchema } from '../utils/validation';
import * as inventoryService from '../services/inventoryService';

const router = Router();

router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const collections = await inventoryService.listCollections(req.user!);
    res.json({ collections });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = parseBody(collectionSchema, req.body);
    const collection = await inventoryService.createCollection(req.user!, body);
    res.status(201).json({ collection });
  })
);

export default router;
