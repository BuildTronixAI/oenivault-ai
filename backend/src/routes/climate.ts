import { Router } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { requireAuth, requireRole } from '../middleware/auth';
import * as climateService from '../services/climateService';

const router = Router();

/** IoT ingest — authenticated via sensor API key, not JWT */
router.post(
  '/ingest',
  asyncHandler(async (req, res) => {
    const apiKey =
      (req.headers['x-sensor-key'] as string | undefined) ||
      (req.body?.apiKey as string | undefined);
    if (!apiKey) {
      throw new AppError('Sensor API key required', 401, 'UNAUTHORIZED');
    }
    const result = await climateService.ingestReading({
      apiKey,
      temperature: req.body?.temperature ?? null,
      humidity: req.body?.humidity ?? null,
      timestamp: req.body?.timestamp,
    });
    res.status(201).json(result);
  })
);

router.use(requireAuth);

router.get(
  '/sensors',
  asyncHandler(async (req, res) => {
    const sensors = await climateService.listSensors(req.user!);
    res.json({ sensors });
  })
);

router.get(
  '/latest',
  asyncHandler(async (req, res) => {
    const latest = await climateService.getLatestByFacility(req.user!);
    res.json({ latest });
  })
);

router.get(
  '/readings',
  asyncHandler(async (req, res) => {
    const hours = req.query.hours ? Number(req.query.hours) : 24;
    const readings = await climateService.listRecentReadings(req.user!, hours);
    res.json({ readings });
  })
);

router.get(
  '/readings/:sensorId',
  asyncHandler(async (req, res) => {
    const hours = req.query.hours ? Number(req.query.hours) : 24;
    const readings = await climateService.listSensorReadings(req.user!, req.params.sensorId, hours);
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
    const alert = await climateService.resolveAlert(req.params.id, req.user!);
    if (!alert) throw new AppError('Alert not found', 404, 'NOT_FOUND');
    res.json({ alert });
  })
);

router.get(
  '/thresholds',
  asyncHandler(async (_req, res) => {
    const { climateThresholds } = await import('../config/climateThresholds');
    res.json({ thresholds: climateThresholds, units: { temperature: '°F', humidity: '%' } });
  })
);

export default router;
