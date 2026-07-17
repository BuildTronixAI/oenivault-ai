import { Router } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { requireAuth, requireRole } from '../middleware/auth';
import * as climateService from '../services/climateService';

const router = Router();

router.use(requireAuth);

router.get(
  '/readings',
  asyncHandler(async (req, res) => {
    const readings = await climateService.listRecentReadings(req.user!);
    res.json({ readings });
  })
);

router.get(
  '/alerts',
  asyncHandler(async (req, res) => {
    const alerts = await climateService.listActiveAlerts(req.user!);
    res.json({ alerts });
  })
);

// Spec lists POST for listing alerts; support both
router.post(
  '/alerts',
  asyncHandler(async (req, res) => {
    const alerts = await climateService.listActiveAlerts(req.user!);
    res.json({ alerts });
  })
);

router.patch(
  '/alerts/:id',
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const alert = await climateService.resolveAlert(req.params.id);
    if (!alert) throw new AppError('Alert not found', 404, 'NOT_FOUND');
    res.json({ alert });
  })
);

export default router;
