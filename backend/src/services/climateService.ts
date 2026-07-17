import { pool } from '../database/pool';
import { AppError } from '../middleware/errorHandler';
import { AuthUser } from '../middleware/auth';
import { ClimateReading } from '../models/ClimateReading';
import { climateThresholds as T } from '../config/climateThresholds';
import { emitAlert, emitClimateReading } from '../realtime/socket';
import { notifyAlertEmail } from './notificationService';
import { logger } from '../utils/logger';

export interface SensorRow {
  id: string;
  facility_id: string;
  sensor_name: string | null;
  sensor_type: string | null;
  api_key: string | null;
  location: string | null;
  active: boolean;
  created_at: Date;
}

export async function listSensors(user: AuthUser) {
  const facilityFilter = user.role === 'admin' ? null : user.facilityId;
  const result = await pool.query<SensorRow>(
    `SELECT id, facility_id, sensor_name, sensor_type, location, active, created_at, api_key
     FROM climate_sensors
     WHERE active = TRUE
       AND ($1::uuid IS NULL OR facility_id = $1)
     ORDER BY sensor_name`,
    [facilityFilter]
  );
  // Never expose api_key to non-admin
  return result.rows.map((s) => ({
    id: s.id,
    facility_id: s.facility_id,
    sensor_name: s.sensor_name,
    sensor_type: s.sensor_type,
    location: s.location,
    active: s.active,
    created_at: s.created_at,
    ...(user.role === 'admin' ? { api_key: s.api_key } : {}),
  }));
}

export async function listRecentReadings(user: AuthUser, hours = 24) {
  const facilityFilter = user.role === 'admin' ? null : user.facilityId;

  const result = await pool.query<
    ClimateReading & { sensor_name: string | null; facility_id: string; location: string | null }
  >(
    `SELECT r.*, s.sensor_name, s.facility_id, s.location
     FROM climate_readings r
     JOIN climate_sensors s ON s.id = r.sensor_id
     WHERE r.timestamp >= NOW() - ($1 || ' hours')::interval
       AND ($2::uuid IS NULL OR s.facility_id = $2)
     ORDER BY r.timestamp DESC
     LIMIT 500`,
    [String(hours), facilityFilter]
  );
  return result.rows;
}

export async function listSensorReadings(user: AuthUser, sensorId: string, hours = 24) {
  const sensors = await listSensors(user);
  if (!sensors.some((s) => s.id === sensorId)) {
    throw new AppError('Sensor not found', 404, 'NOT_FOUND');
  }

  const result = await pool.query<ClimateReading>(
    `SELECT * FROM climate_readings
     WHERE sensor_id = $1
       AND timestamp >= NOW() - ($2 || ' hours')::interval
     ORDER BY timestamp DESC
     LIMIT 500`,
    [sensorId, String(hours)]
  );
  return result.rows;
}

export async function getLatestByFacility(user: AuthUser) {
  const facilityFilter = user.role === 'admin' ? null : user.facilityId;
  const result = await pool.query(
    `SELECT DISTINCT ON (s.id)
       s.id AS sensor_id,
       s.sensor_name,
       s.sensor_type,
       s.location,
       s.facility_id,
       r.temperature,
       r.humidity,
       r.timestamp,
       r.alert_triggered
     FROM climate_sensors s
     LEFT JOIN climate_readings r ON r.sensor_id = s.id
     WHERE s.active = TRUE
       AND ($1::uuid IS NULL OR s.facility_id = $1)
     ORDER BY s.id, r.timestamp DESC NULLS LAST`,
    [facilityFilter]
  );
  return result.rows;
}

export async function listActiveAlerts(user: AuthUser) {
  const facilityFilter = user.role === 'admin' ? null : user.facilityId;
  const result = await pool.query(
    `SELECT * FROM alerts
     WHERE resolved = FALSE
       AND ($1::uuid IS NULL OR facility_id = $1)
     ORDER BY created_at DESC`,
    [facilityFilter]
  );
  return result.rows;
}

export async function resolveAlert(id: string, user: AuthUser) {
  const result = await pool.query(
    `UPDATE alerts SET resolved = TRUE, resolved_at = NOW()
     WHERE id = $1
       AND ($2::text = 'admin')
     RETURNING *`,
    [id, user.role]
  );
  return result.rows[0] ?? null;
}

export async function findSensorByApiKey(apiKey: string) {
  const result = await pool.query<SensorRow>(
    `SELECT * FROM climate_sensors WHERE api_key = $1 AND active = TRUE`,
    [apiKey]
  );
  return result.rows[0] ?? null;
}

type EvalResult = { alertTriggered: boolean; alerts: Array<{ type: string; severity: string; message: string }> };

function evaluateReading(temperature: number | null, humidity: number | null): EvalResult {
  const alerts: EvalResult['alerts'] = [];

  if (temperature != null) {
    if (temperature < T.tempCritMin || temperature > T.tempCritMax) {
      alerts.push({
        type: temperature < T.tempCritMin ? 'temperature_low' : 'temperature_high',
        severity: 'critical',
        message: `Critical temperature ${temperature}°F (safe ${T.tempCritMin}–${T.tempCritMax}°F)`,
      });
    } else if (temperature < T.tempWarnMin || temperature > T.tempWarnMax) {
      alerts.push({
        type: temperature < T.tempWarnMin ? 'temperature_low' : 'temperature_high',
        severity: 'warning',
        message: `Temperature ${temperature}°F outside ideal ${T.tempWarnMin}–${T.tempWarnMax}°F`,
      });
    }
  }

  if (humidity != null) {
    if (humidity < T.humidityCritMin || humidity > T.humidityCritMax) {
      alerts.push({
        type: humidity < T.humidityCritMin ? 'humidity_low' : 'humidity_high',
        severity: 'critical',
        message: `Critical humidity ${humidity}% (safe ${T.humidityCritMin}–${T.humidityCritMax}%)`,
      });
    } else if (humidity < T.humidityWarnMin || humidity > T.humidityWarnMax) {
      alerts.push({
        type: humidity < T.humidityWarnMin ? 'humidity_low' : 'humidity_high',
        severity: 'warning',
        message: `Humidity ${humidity}% outside ideal ${T.humidityWarnMin}–${T.humidityWarnMax}%`,
      });
    }
  }

  return { alertTriggered: alerts.length > 0, alerts };
}

async function suppressDuplicate(facilityId: string, alertType: string, windowMinutes = 30) {
  const existing = await pool.query(
    `SELECT id FROM alerts
     WHERE facility_id = $1
       AND alert_type = $2
       AND resolved = FALSE
       AND created_at >= NOW() - ($3 || ' minutes')::interval
     LIMIT 1`,
    [facilityId, alertType, String(windowMinutes)]
  );
  return (existing.rowCount ?? 0) > 0;
}

export async function ingestReading(input: {
  apiKey: string;
  temperature?: number | null;
  humidity?: number | null;
  timestamp?: string;
}) {
  const sensor = await findSensorByApiKey(input.apiKey);
  if (!sensor) throw new AppError('Invalid sensor API key', 401, 'INVALID_API_KEY');

  const temperature = input.temperature ?? null;
  const humidity = input.humidity ?? null;
  if (temperature == null && humidity == null) {
    throw new AppError('temperature or humidity required', 400, 'VALIDATION_ERROR');
  }

  const evaluation = evaluateReading(temperature, humidity);

  const readingResult = await pool.query<ClimateReading>(
    `INSERT INTO climate_readings (sensor_id, temperature, humidity, timestamp, alert_triggered)
     VALUES ($1, $2, $3, COALESCE($4::timestamptz, NOW()), $5)
     RETURNING *`,
    [sensor.id, temperature, humidity, input.timestamp ?? null, evaluation.alertTriggered]
  );
  const reading = readingResult.rows[0];

  const payload = {
    reading,
    sensor: {
      id: sensor.id,
      sensor_name: sensor.sensor_name,
      location: sensor.location,
      facility_id: sensor.facility_id,
    },
  };

  try {
    emitClimateReading(sensor.facility_id, payload);
  } catch (err) {
    logger.debug('Realtime emit skipped', err instanceof Error ? err.message : err);
  }

  const createdAlerts = [];
  for (const a of evaluation.alerts) {
    if (await suppressDuplicate(sensor.facility_id, a.type)) continue;

    const alertRes = await pool.query(
      `INSERT INTO alerts (facility_id, alert_type, severity, message)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [sensor.facility_id, a.type, a.severity, a.message]
    );
    const alert = alertRes.rows[0];
    createdAlerts.push(alert);

    try {
      emitAlert(sensor.facility_id, alert);
    } catch {
      /* socket may not be up in scripts */
    }

    void notifyAlertEmail({
      facilityId: sensor.facility_id,
      alertType: a.type,
      severity: a.severity,
      message: a.message,
    });
  }

  return { reading, alerts: createdAlerts, sensor };
}
