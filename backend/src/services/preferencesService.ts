import { pool } from '../database/pool';
import { AuthUser } from '../middleware/auth';

export async function getPreferences(userId: string) {
  const result = await pool.query(
    `INSERT INTO notification_preferences (user_id)
     VALUES ($1)
     ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
     RETURNING *`,
    [userId]
  );
  return result.rows[0];
}

export async function updatePreferences(
  userId: string,
  input: { emailAlerts?: boolean; emailDigest?: boolean; inAppAlerts?: boolean }
) {
  await getPreferences(userId);
  const result = await pool.query(
    `UPDATE notification_preferences SET
       email_alerts = COALESCE($2, email_alerts),
       email_digest = COALESCE($3, email_digest),
       in_app_alerts = COALESCE($4, in_app_alerts),
       updated_at = NOW()
     WHERE user_id = $1
     RETURNING *`,
    [
      userId,
      input.emailAlerts ?? null,
      input.emailDigest ?? null,
      input.inAppAlerts ?? null,
    ]
  );
  return result.rows[0];
}

export async function listFacilities(user: AuthUser) {
  if (user.role === 'admin') {
    const result = await pool.query(
      `SELECT * FROM facilities
       WHERE ($1::uuid IS NULL OR id = $1 OR owner_id = $2)
       ORDER BY name`,
      [user.facilityId, user.id]
    );
    return result.rows;
  }
  if (!user.facilityId) return [];
  const result = await pool.query(`SELECT id, name, location FROM facilities WHERE id = $1`, [
    user.facilityId,
  ]);
  return result.rows;
}
