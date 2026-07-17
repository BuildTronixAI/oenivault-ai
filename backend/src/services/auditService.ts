import { pool } from '../database/pool';
import { AuthUser } from '../middleware/auth';

export async function writeAudit(input: {
  actorId?: string | null;
  facilityId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  meta?: unknown;
}) {
  await pool.query(
    `INSERT INTO audit_log (actor_id, facility_id, action, entity_type, entity_id, meta)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      input.actorId ?? null,
      input.facilityId ?? null,
      input.action,
      input.entityType,
      input.entityId ?? null,
      input.meta ? JSON.stringify(input.meta) : null,
    ]
  );
}

export async function listAudit(user: AuthUser, limit = 100) {
  if (user.role === 'admin') {
    const result = await pool.query(
      `SELECT a.*, u.email AS actor_email
       FROM audit_log a
       LEFT JOIN users u ON u.id = a.actor_id
       WHERE ($1::uuid IS NULL OR a.facility_id = $1 OR a.facility_id IS NULL)
       ORDER BY a.created_at DESC
       LIMIT $2`,
      [user.facilityId, limit]
    );
    return result.rows;
  }
  const result = await pool.query(
    `SELECT a.*, u.email AS actor_email
     FROM audit_log a
     LEFT JOIN users u ON u.id = a.actor_id
     WHERE a.actor_id = $1
     ORDER BY a.created_at DESC
     LIMIT $2`,
    [user.id, limit]
  );
  return result.rows;
}
