import { Router } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { requireAuth, requireRole } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';
import * as climateService from '../services/climateService';

const router = Router();

router.post(
  '/ingest',
  rateLimit({ windowMs: 60_000, max: 120, keyPrefix: 'ingest' }),
  asyncHandler(async (req, res) => {
    const apiKey =
      (req.headers['x-sensor-key'] as string | undefined) ||
      (req.body?.apiKey as string | undefined);
    if (!apiKey) throw new AppError('Sensor API key required', 401, 'UNAUTHORIZED');
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

router.post(
  '/sensors',
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const sensorName = String(req.body?.sensorName ?? '').trim();
    if (!sensorName) throw new AppError('sensorName required', 400, 'VALIDATION_ERROR');
    const sensor = await climateService.createSensor(req.user!, {
      sensorName,
      sensorType: req.body?.sensorType,
      location: req.body?.location,
      facilityId: req.body?.facilityId,
    });
    res.status(201).json({ sensor });
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

router.patch(
  '/alerts/:id/ack',
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const alert = await climateService.acknowledgeAlert(req.params.id, req.user!);
    if (!alert) throw new AppError('Alert not found', 404, 'NOT_FOUND');
    res.json({ alert });
  })
);

router.get(
  '/thresholds',
  asyncHandler(async (req, res) => {
    const thresholds = await climateService.getThresholds(req.user!);
    res.json({ thresholds, units: { temperature: '°F', humidity: '%' } });
  })
);

router.put(
  '/thresholds',
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const thresholds = await climateService.upsertThresholds(req.user!, {
      tempWarnMin: Number(req.body?.tempWarnMin),
      tempWarnMax: Number(req.body?.tempWarnMax),
      tempCritMin: Number(req.body?.tempCritMin),
      tempCritMax: Number(req.body?.tempCritMax),
      humidityWarnMin: Number(req.body?.humidityWarnMin),
      humidityWarnMax: Number(req.body?.humidityWarnMax),
      humidityCritMin: Number(req.body?.humidityCritMin),
      humidityCritMax: Number(req.body?.humidityCritMax),
    });
    res.json({ thresholds });
  })
);

router.post(
  '/mutes',
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const hours = Number(req.body?.hours ?? 1);
    const mute = await climateService.muteAlerts(req.user!, hours, req.body?.alertType);
    res.status(201).json({ mute });
  })
);

export default router;
