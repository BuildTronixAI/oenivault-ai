import { pool } from '../database/pool';
import { AuthUser } from '../middleware/auth';
import { ClimateReading } from '../models/ClimateReading';

export async function listRecentReadings(user: AuthUser, hours = 24) {
  const facilityFilter = user.role === 'admin' ? null : user.facilityId;

  const result = await pool.query<
    ClimateReading & { sensor_name: string | null; facility_id: string }
  >(
    `SELECT r.*, s.sensor_name, s.facility_id
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

export async function resolveAlert(id: string) {
  const result = await pool.query(
    `UPDATE alerts SET resolved = TRUE, resolved_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id]
  );
  return result.rows[0] ?? null;
}
