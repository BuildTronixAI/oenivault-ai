import bcrypt from 'bcryptjs';
import { pool } from '../database/pool';
import { AppError } from '../middleware/errorHandler';
import { User, toPublicUser } from '../models/User';

export async function listCustomers(user?: { facilityId: string | null; role: string }) {
  const facilityId = user?.facilityId ?? null;
  const result = await pool.query(
    `SELECT u.id, u.email, u.full_name, u.role, u.facility_id, u.created_at, u.updated_at,
            (SELECT COUNT(*)::int FROM collections c WHERE c.customer_id = u.id) AS collection_count,
            (SELECT COUNT(*)::int FROM wines w
               JOIN collections c ON c.id = w.collection_id
               WHERE c.customer_id = u.id AND w.deleted_at IS NULL) AS wine_count
     FROM users u
     WHERE u.role = 'customer'
       AND ($1::uuid IS NULL OR u.facility_id = $1)
     ORDER BY u.created_at DESC`,
    [facilityId]
  );
  return result.rows;
}

export async function getCustomer(id: string) {
  const result = await pool.query<User>(
    `SELECT * FROM users WHERE id = $1 AND role = 'customer'`,
    [id]
  );
  const user = result.rows[0];
  if (!user) throw new AppError('Customer not found', 404, 'NOT_FOUND');

  const collections = await pool.query(
    `SELECT c.*,
            (SELECT COUNT(*)::int FROM wines w WHERE w.collection_id = c.id) AS wine_count
     FROM collections c
     WHERE c.customer_id = $1
     ORDER BY c.created_at DESC`,
    [id]
  );

  return { ...toPublicUser(user), collections: collections.rows };
}

export async function createCustomer(input: {
  email: string;
  password: string;
  fullName: string;
  facilityId?: string | null;
}) {
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [input.email.toLowerCase()]);
  if (existing.rowCount && existing.rowCount > 0) {
    throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const result = await pool.query<User>(
    `INSERT INTO users (email, password_hash, full_name, role, facility_id)
     VALUES ($1, $2, $3, 'customer', $4)
     RETURNING *`,
    [input.email.toLowerCase(), passwordHash, input.fullName, input.facilityId ?? null]
  );
  return toPublicUser(result.rows[0]);
}

export async function updateCustomer(
  id: string,
  input: {
    email?: string;
    fullName?: string;
    facilityId?: string | null;
    password?: string;
  }
) {
  const existing = await pool.query<User>(`SELECT * FROM users WHERE id = $1 AND role = 'customer'`, [id]);
  if (!existing.rows[0]) throw new AppError('Customer not found', 404, 'NOT_FOUND');

  let passwordHash: string | null = null;
  if (input.password) {
    passwordHash = await bcrypt.hash(input.password, 10);
  }

  const result = await pool.query<User>(
    `UPDATE users SET
       email = COALESCE($2, email),
       full_name = COALESCE($3, full_name),
       facility_id = COALESCE($4, facility_id),
       password_hash = COALESCE($5, password_hash)
     WHERE id = $1
     RETURNING *`,
    [
      id,
      input.email?.toLowerCase() ?? null,
      input.fullName ?? null,
      input.facilityId !== undefined ? input.facilityId : null,
      passwordHash,
    ]
  );
  return toPublicUser(result.rows[0]);
}
