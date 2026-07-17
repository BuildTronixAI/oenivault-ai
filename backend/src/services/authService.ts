import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../database/pool';
import { AppError } from '../middleware/errorHandler';
import { AuthUser, signAccessToken, signRefreshToken } from '../middleware/auth';
import { User, toPublicUser } from '../models/User';

const SALT_ROUNDS = 10;

function rowToAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    facilityId: user.facility_id,
    fullName: user.full_name,
  };
}

export async function signup(input: {
  email: string;
  password: string;
  fullName: string;
  role?: 'admin' | 'customer';
  facilityId?: string;
}) {
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [input.email.toLowerCase()]);
  if (existing.rowCount && existing.rowCount > 0) {
    throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const role = input.role ?? 'customer';

  const result = await pool.query<User>(
    `INSERT INTO users (email, password_hash, full_name, role, facility_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [input.email.toLowerCase(), passwordHash, input.fullName, role, input.facilityId ?? null]
  );

  const user = result.rows[0];
  const authUser = rowToAuthUser(user);
  return {
    user: toPublicUser(user),
    accessToken: signAccessToken(authUser),
    refreshToken: signRefreshToken(authUser),
  };
}

export async function login(email: string, password: string) {
  const result = await pool.query<User>('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
  const user = result.rows[0];
  if (!user) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const authUser = rowToAuthUser(user);
  return {
    user: toPublicUser(user),
    accessToken: signAccessToken(authUser),
    refreshToken: signRefreshToken(authUser),
  };
}

export async function refresh(refreshToken: string) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new AppError('JWT_SECRET is not configured', 500, 'CONFIG_ERROR');

  let decoded: { sub: string; type?: string };
  try {
    decoded = jwt.verify(refreshToken, secret) as { sub: string; type?: string };
  } catch {
    throw new AppError('Invalid refresh token', 401, 'INVALID_TOKEN');
  }

  if (decoded.type !== 'refresh') {
    throw new AppError('Invalid refresh token', 401, 'INVALID_TOKEN');
  }

  const result = await pool.query<User>('SELECT * FROM users WHERE id = $1', [decoded.sub]);
  const user = result.rows[0];
  if (!user) {
    throw new AppError('User not found', 401, 'INVALID_TOKEN');
  }

  const authUser = rowToAuthUser(user);
  return {
    user: toPublicUser(user),
    accessToken: signAccessToken(authUser),
    refreshToken: signRefreshToken(authUser),
  };
}

export async function getUserById(id: string) {
  const result = await pool.query<User>('SELECT * FROM users WHERE id = $1', [id]);
  const user = result.rows[0];
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
  return toPublicUser(user);
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const result = await pool.query<User>('SELECT * FROM users WHERE id = $1', [userId]);
  const user = result.rows[0];
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

  const ok = await bcrypt.compare(currentPassword, user.password_hash);
  if (!ok) throw new AppError('Current password is incorrect', 401, 'INVALID_CREDENTIALS');

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await pool.query('UPDATE users SET password_hash = $2 WHERE id = $1', [userId, passwordHash]);
  return { ok: true };
}
