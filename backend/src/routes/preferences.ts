import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { requireAuth, requireRole } from '../middleware/auth';
import * as preferencesService from '../services/preferencesService';
import * as auditService from '../services/auditService';

const router = Router();

router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const preferences = await preferencesService.getPreferences(req.user!.id);
    res.json({ preferences });
  })
);

router.patch(
  '/',
  asyncHandler(async (req, res) => {
    const preferences = await preferencesService.updatePreferences(req.user!.id, {
      emailAlerts: req.body?.email_alerts ?? req.body?.emailAlerts,
      emailDigest: req.body?.email_digest ?? req.body?.emailDigest,
      inAppAlerts: req.body?.in_app_alerts ?? req.body?.inAppAlerts,
    });
    res.json({ preferences });
  })
);

router.get(
  '/facilities',
  asyncHandler(async (req, res) => {
    const facilities = await preferencesService.listFacilities(req.user!);
    res.json({ facilities });
  })
);

router.get(
  '/audit',
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const entries = await auditService.listAudit(req.user!);
    res.json({ entries });
  })
);

export default router;
