import { pool } from '../database/pool';
import { AppError } from '../middleware/errorHandler';
import { AuthUser } from '../middleware/auth';
import { ClimateReading } from '../models/ClimateReading';
import { climateThresholds as DEFAULTS } from '../config/climateThresholds';
import { emitAlert, emitClimateReading } from '../realtime/socket';
import { notifyAlertEmail } from './notificationService';
import { logger } from '../utils/logger';
import { randomToken } from '../utils/crypto';

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

export interface Thresholds {
  tempWarnMin: number;
  tempWarnMax: number;
  tempCritMin: number;
  tempCritMax: number;
  humidityWarnMin: number;
  humidityWarnMax: number;
  humidityCritMin: number;
  humidityCritMax: number;
}

function rowToThresholds(row?: Record<string, unknown> | null): Thresholds {
  if (!row) return { ...DEFAULTS };
  return {
    tempWarnMin: Number(row.temp_warn_min ?? DEFAULTS.tempWarnMin),
    tempWarnMax: Number(row.temp_warn_max ?? DEFAULTS.tempWarnMax),
    tempCritMin: Number(row.temp_crit_min ?? DEFAULTS.tempCritMin),
    tempCritMax: Number(row.temp_crit_max ?? DEFAULTS.tempCritMax),
    humidityWarnMin: Number(row.humidity_warn_min ?? DEFAULTS.humidityWarnMin),
    humidityWarnMax: Number(row.humidity_warn_max ?? DEFAULTS.humidityWarnMax),
    humidityCritMin: Number(row.humidity_crit_min ?? DEFAULTS.humidityCritMin),
    humidityCritMax: Number(row.humidity_crit_max ?? DEFAULTS.humidityCritMax),
  };
}

export async function getThresholdsForFacility(facilityId: string | null): Promise<Thresholds> {
  if (!facilityId) return { ...DEFAULTS };
  const result = await pool.query(`SELECT * FROM facility_thresholds WHERE facility_id = $1`, [facilityId]);
  return rowToThresholds(result.rows[0]);
}

export async function getThresholds(user: AuthUser) {
  return getThresholdsForFacility(user.facilityId);
}

export async function upsertThresholds(user: AuthUser, input: Thresholds) {
  if (user.role !== 'admin') throw new AppError('Insufficient permissions', 403, 'FORBIDDEN');
  if (!user.facilityId) throw new AppError('Admin has no facility assigned', 400, 'NO_FACILITY');

  const result = await pool.query(
    `INSERT INTO facility_thresholds (
       facility_id, temp_warn_min, temp_warn_max, temp_crit_min, temp_crit_max,
       humidity_warn_min, humidity_warn_max, humidity_crit_min, humidity_crit_max
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT (facility_id) DO UPDATE SET
       temp_warn_min = EXCLUDED.temp_warn_min,
       temp_warn_max = EXCLUDED.temp_warn_max,
       temp_crit_min = EXCLUDED.temp_crit_min,
       temp_crit_max = EXCLUDED.temp_crit_max,
       humidity_warn_min = EXCLUDED.humidity_warn_min,
       humidity_warn_max = EXCLUDED.humidity_warn_max,
       humidity_crit_min = EXCLUDED.humidity_crit_min,
       humidity_crit_max = EXCLUDED.humidity_crit_max,
       updated_at = NOW()
     RETURNING *`,
    [
      user.facilityId,
      input.tempWarnMin,
      input.tempWarnMax,
      input.tempCritMin,
      input.tempCritMax,
      input.humidityWarnMin,
      input.humidityWarnMax,
      input.humidityCritMin,
      input.humidityCritMax,
    ]
  );
  return rowToThresholds(result.rows[0]);
}

export async function listSensors(user: AuthUser) {
  const params: unknown[] = [];
  let where = 'WHERE active = TRUE';
  if (user.facilityId) {
    params.push(user.facilityId);
    where += ` AND facility_id = $${params.length}`;
  } else if (user.role !== 'admin') {
    return [];
  }

  const result = await pool.query<SensorRow>(
    `SELECT id, facility_id, sensor_name, sensor_type, location, active, created_at, api_key
     FROM climate_sensors
     ${where}
     ORDER BY sensor_name`,
    params
  );

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

export async function createSensor(
  user: AuthUser,
  input: { sensorName: string; sensorType?: string; location?: string; facilityId?: string }
) {
  if (user.role !== 'admin') throw new AppError('Insufficient permissions', 403, 'FORBIDDEN');
  const facilityId = input.facilityId || user.facilityId;
  if (!facilityId) throw new AppError('facilityId required', 400, 'VALIDATION_ERROR');

  const apiKey = `sensor_${randomToken(16)}`;
  const result = await pool.query<SensorRow>(
    `INSERT INTO climate_sensors (facility_id, sensor_name, sensor_type, api_key, location, active)
     VALUES ($1, $2, $3, $4, $5, TRUE)
     RETURNING *`,
    [facilityId, input.sensorName, input.sensorType || 'combined', apiKey, input.location || null]
  );
  return { ...result.rows[0], api_key: apiKey };
}

export async function listRecentReadings(user: AuthUser, hours = 24) {
  const facilityFilter = user.role === 'admin' && !user.facilityId ? null : user.facilityId;
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
  const facilityFilter = user.role === 'admin' && !user.facilityId ? null : user.facilityId;
  const result = await pool.query(
    `SELECT DISTINCT ON (s.id)
       s.id AS sensor_id, s.sensor_name, s.sensor_type, s.location, s.facility_id,
       r.temperature, r.humidity, r.timestamp, r.alert_triggered
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
  const facilityFilter = user.role === 'admin' && !user.facilityId ? null : user.facilityId;
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
  if (user.role !== 'admin') throw new AppError('Insufficient permissions', 403, 'FORBIDDEN');
  const result = await pool.query(
    `UPDATE alerts SET resolved = TRUE, resolved_at = NOW() WHERE id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function acknowledgeAlert(id: string, user: AuthUser) {
  if (user.role !== 'admin') throw new AppError('Insufficient permissions', 403, 'FORBIDDEN');
  const result = await pool.query(
    `UPDATE alerts SET acknowledged_at = NOW(), acknowledged_by = $2 WHERE id = $1 RETURNING *`,
    [id, user.id]
  );
  return result.rows[0] ?? null;
}

export async function muteAlerts(user: AuthUser, hours: number, alertType?: string | null) {
  if (user.role !== 'admin') throw new AppError('Insufficient permissions', 403, 'FORBIDDEN');
  if (!user.facilityId) throw new AppError('Admin has no facility assigned', 400, 'NO_FACILITY');
  const result = await pool.query(
    `INSERT INTO alert_mutes (facility_id, alert_type, muted_until, created_by)
     VALUES ($1, $2, NOW() + ($3 || ' hours')::interval, $4)
     RETURNING *`,
    [user.facilityId, alertType ?? null, String(hours), user.id]
  );
  return result.rows[0];
}

async function isMuted(facilityId: string, alertType: string) {
  const result = await pool.query(
    `SELECT id FROM alert_mutes
     WHERE facility_id = $1
       AND muted_until > NOW()
       AND (alert_type IS NULL OR alert_type = $2)
     LIMIT 1`,
    [facilityId, alertType]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function findSensorByApiKey(apiKey: string) {
  const result = await pool.query<SensorRow>(
    `SELECT * FROM climate_sensors WHERE api_key = $1 AND active = TRUE`,
    [apiKey]
  );
  return result.rows[0] ?? null;
}

type EvalResult = { alertTriggered: boolean; alerts: Array<{ type: string; severity: string; message: string }> };

function evaluateReading(temperature: number | null, humidity: number | null, T: Thresholds): EvalResult {
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
     WHERE facility_id = $1 AND alert_type = $2 AND resolved = FALSE
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

  const thresholds = await getThresholdsForFacility(sensor.facility_id);
  const evaluation = evaluateReading(temperature, humidity, thresholds);

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
    if (await isMuted(sensor.facility_id, a.type)) continue;
    if (await suppressDuplicate(sensor.facility_id, a.type)) continue;

    const alertRes = await pool.query(
      `INSERT INTO alerts (facility_id, alert_type, severity, message)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [sensor.facility_id, a.type, a.severity, a.message]
    );
    const alert = alertRes.rows[0];
    createdAlerts.push(alert);
    try {
      emitAlert(sensor.facility_id, alert);
    } catch {
      /* ignore */
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

export async function purgeOldReadings(days = 90) {
  const result = await pool.query(
    `DELETE FROM climate_readings WHERE timestamp < NOW() - ($1 || ' days')::interval`,
    [String(days)]
  );
  return { deleted: result.rowCount ?? 0 };
}
