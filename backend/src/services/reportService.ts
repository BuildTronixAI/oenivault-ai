import { pool } from '../database/pool';
import { AuthUser } from '../middleware/auth';

function scopeJoin(user: AuthUser): { join: string; where: string; params: unknown[] } {
  if (user.role === 'admin') {
    return { join: '', where: 'WHERE w.deleted_at IS NULL', params: [] };
  }
  return {
    join: 'JOIN collections c ON c.id = w.collection_id',
    where: 'WHERE c.customer_id = $1 AND w.deleted_at IS NULL',
    params: [user.id],
  };
}

export async function inventorySummary(user: AuthUser) {
  const { join, where, params } = scopeJoin(user);

  const totals = await pool.query(
    `SELECT
       COUNT(*)::int AS wine_count,
       COALESCE(SUM(w.quantity), 0)::int AS bottle_count,
       COALESCE(SUM(w.estimated_value * w.quantity), 0) AS total_value,
       COUNT(DISTINCT w.region) FILTER (WHERE w.region IS NOT NULL AND w.region <> '')::int AS region_count,
       COUNT(DISTINCT w.varietal) FILTER (WHERE w.varietal IS NOT NULL AND w.varietal <> '')::int AS varietal_count
     FROM wines w
     ${join}
     ${where}`,
    params
  );

  const byRegion = await pool.query(
    `SELECT COALESCE(w.region, 'Unknown') AS region,
            COUNT(*)::int AS wines,
            COALESCE(SUM(w.quantity), 0)::int AS bottles,
            COALESCE(SUM(w.estimated_value * w.quantity), 0) AS value
     FROM wines w
     ${join}
     ${where}
     GROUP BY COALESCE(w.region, 'Unknown')
     ORDER BY value DESC`,
    params
  );

  const byVarietal = await pool.query(
    `SELECT COALESCE(w.varietal, 'Unknown') AS varietal,
            COUNT(*)::int AS wines,
            COALESCE(SUM(w.quantity), 0)::int AS bottles,
            COALESCE(SUM(w.estimated_value * w.quantity), 0) AS value
     FROM wines w
     ${join}
     ${where}
     GROUP BY COALESCE(w.varietal, 'Unknown')
     ORDER BY value DESC`,
    params
  );

  const byVintage = await pool.query(
    `SELECT w.vintage,
            COUNT(*)::int AS wines,
            COALESCE(SUM(w.quantity), 0)::int AS bottles,
            COALESCE(SUM(w.estimated_value * w.quantity), 0) AS value
     FROM wines w
     ${join}
     ${where}
     GROUP BY w.vintage
     ORDER BY w.vintage DESC NULLS LAST`,
    params
  );

  return {
    totals: totals.rows[0],
    byRegion: byRegion.rows,
    byVarietal: byVarietal.rows,
    byVintage: byVintage.rows,
  };
}

export async function valueReport(user: AuthUser) {
  const params = user.role === 'admin' ? [] : [user.id];
  const whereCustomer = user.role === 'admin' ? '' : 'WHERE c.customer_id = $1';

  const collections = await pool.query(
    `SELECT c.id, c.name, u.full_name AS customer_name,
            COUNT(w.id)::int AS wine_count,
            COALESCE(SUM(w.quantity), 0)::int AS bottle_count,
            COALESCE(SUM(w.estimated_value * w.quantity), 0) AS total_value
     FROM collections c
     JOIN users u ON u.id = c.customer_id
     LEFT JOIN wines w ON w.collection_id = c.id AND w.deleted_at IS NULL
     ${whereCustomer}
     GROUP BY c.id, c.name, u.full_name
     ORDER BY total_value DESC`,
    params
  );

  const topWines = await pool.query(
    `SELECT w.id, w.name, w.vintage, w.region, w.varietal, w.quantity, w.estimated_value,
            (w.estimated_value * w.quantity) AS line_value,
            c.name AS collection_name
     FROM wines w
     JOIN collections c ON c.id = w.collection_id
     ${user.role === 'admin' ? '' : 'WHERE c.customer_id = $1'}
     ORDER BY line_value DESC NULLS LAST
     LIMIT 10`,
    params
  );

  const grandTotal = collections.rows.reduce(
    (sum, row) => sum + Number(row.total_value ?? 0),
    0
  );

  return {
    grandTotal,
    collections: collections.rows,
    topWines: topWines.rows,
  };
}

export async function climateReport(user: AuthUser, days = 7) {
  const facilityFilter = user.role === 'admin' ? null : user.facilityId;

  const trends = await pool.query(
    `SELECT date_trunc('hour', r.timestamp) AS bucket,
            AVG(r.temperature)::numeric(5,2) AS avg_temp,
            AVG(r.humidity)::numeric(5,2) AS avg_humidity,
            MIN(r.temperature)::numeric(5,2) AS min_temp,
            MAX(r.temperature)::numeric(5,2) AS max_temp,
            COUNT(*) FILTER (WHERE r.alert_triggered)::int AS alert_readings
     FROM climate_readings r
     JOIN climate_sensors s ON s.id = r.sensor_id
     WHERE r.timestamp >= NOW() - ($1 || ' days')::interval
       AND ($2::uuid IS NULL OR s.facility_id = $2)
     GROUP BY 1
     ORDER BY 1 ASC`,
    [String(days), facilityFilter]
  );

  const alertStats = await pool.query(
    `SELECT severity, COUNT(*)::int AS count
     FROM alerts
     WHERE created_at >= NOW() - ($1 || ' days')::interval
       AND ($2::uuid IS NULL OR facility_id = $2)
     GROUP BY severity
     ORDER BY count DESC`,
    [String(days), facilityFilter]
  );

  const latest = await pool.query(
    `SELECT DISTINCT ON (s.id)
       s.sensor_name, s.location, r.temperature, r.humidity, r.timestamp, r.alert_triggered
     FROM climate_sensors s
     LEFT JOIN climate_readings r ON r.sensor_id = s.id
     WHERE s.active = TRUE
       AND ($1::uuid IS NULL OR s.facility_id = $1)
     ORDER BY s.id, r.timestamp DESC NULLS LAST`,
    [facilityFilter]
  );

  return {
    days,
    trends: trends.rows,
    alertStats: alertStats.rows,
    latest: latest.rows,
  };
}
