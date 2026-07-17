import bcrypt from 'bcryptjs';
import { pool } from '../database/pool';
import { AppError } from '../middleware/errorHandler';
import {
  AuthUser,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../middleware/auth';
import { User, toPublicUser } from '../models/User';
import { randomToken, sha256 } from '../utils/crypto';
import { logger } from '../utils/logger';
import nodemailer from 'nodemailer';

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

async function sendMail(to: string, subject: string, text: string) {
  const host = process.env.SMTP_HOST;
  if (!host) {
    logger.info('SMTP not configured — email logged', { to, subject, text });
    return { delivered: false as const };
  }
  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@oenivault.ai',
    to,
    subject,
    text,
  });
  return { delivered: true as const };
}

export async function signup(input: {
  email: string;
  password: string;
  fullName: string;
  role?: 'admin' | 'customer';
  facilityId?: string;
}) {
  if (process.env.ALLOW_PUBLIC_SIGNUP === 'false') {
    throw new AppError('Public signup disabled — ask an admin for an invite', 403, 'SIGNUP_DISABLED');
  }

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
  await pool.query(
    `INSERT INTO notification_preferences (user_id) VALUES ($1) ON CONFLICT DO NOTHING`,
    [user.id]
  );
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
  const decoded = verifyRefreshToken(refreshToken);
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

export async function forgotPassword(email: string) {
  const result = await pool.query<User>('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
  const user = result.rows[0];
  // Always return ok to avoid email enumeration
  if (!user) {
    return { ok: true, message: 'If that email exists, a reset link was sent.' };
  }

  const token = randomToken();
  const tokenHash = sha256(token);
  const hours = Number(process.env.RESET_TOKEN_HOURS || 1);
  await pool.query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, NOW() + ($3 || ' hours')::interval)`,
    [user.id, tokenHash, String(hours)]
  );

  const appUrl = process.env.APP_URL || process.env.CORS_ORIGIN || 'http://localhost:5173';
  const link = `${appUrl}/reset-password?token=${token}`;
  await sendMail(user.email, 'OeniVault password reset', `Reset your password:\n\n${link}\n\nExpires in ${hours}h.`);

  const includeToken = process.env.NODE_ENV !== 'production' && !process.env.SMTP_HOST;
  return {
    ok: true,
    message: 'If that email exists, a reset link was sent.',
    ...(includeToken ? { resetToken: token, resetLink: link } : {}),
  };
}

export async function resetPassword(token: string, newPassword: string) {
  const tokenHash = sha256(token);
  const result = await pool.query<{ id: string; user_id: string }>(
    `SELECT id, user_id FROM password_reset_tokens
     WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()`,
    [tokenHash]
  );
  const row = result.rows[0];
  if (!row) throw new AppError('Invalid or expired reset token', 400, 'INVALID_TOKEN');

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await pool.query('UPDATE users SET password_hash = $2 WHERE id = $1', [row.user_id, passwordHash]);
  await pool.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1', [row.id]);
  return { ok: true };
}

export async function createInvite(input: {
  email: string;
  fullName: string;
  facilityId?: string | null;
  invitedBy: string;
  role?: 'admin' | 'customer';
}) {
  const email = input.email.toLowerCase();
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rowCount && existing.rowCount > 0) {
    throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');
  }

  const token = randomToken();
  const tokenHash = sha256(token);
  const days = Number(process.env.INVITE_DAYS || 7);
  const result = await pool.query(
    `INSERT INTO invites (email, full_name, facility_id, role, token_hash, invited_by, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW() + ($7 || ' days')::interval)
     RETURNING id, email, full_name, facility_id, role, expires_at`,
    [email, input.fullName, input.facilityId ?? null, input.role ?? 'customer', tokenHash, input.invitedBy, String(days)]
  );

  const appUrl = process.env.APP_URL || process.env.CORS_ORIGIN || 'http://localhost:5173';
  const link = `${appUrl}/accept-invite?token=${token}`;
  await sendMail(email, 'You are invited to OeniVault', `Hi ${input.fullName},\n\nAccept your invite:\n${link}\n`);

  const includeToken = process.env.NODE_ENV !== 'production' && !process.env.SMTP_HOST;
  return {
    invite: result.rows[0],
    ...(includeToken ? { inviteToken: token, inviteLink: link } : {}),
  };
}

export async function acceptInvite(token: string, password: string) {
  const tokenHash = sha256(token);
  const result = await pool.query<{
    id: string;
    email: string;
    full_name: string | null;
    facility_id: string | null;
    role: 'admin' | 'customer';
  }>(
    `SELECT id, email, full_name, facility_id, role FROM invites
     WHERE token_hash = $1 AND accepted_at IS NULL AND expires_at > NOW()`,
    [tokenHash]
  );
  const invite = result.rows[0];
  if (!invite) throw new AppError('Invalid or expired invite', 400, 'INVALID_TOKEN');

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const userRes = await pool.query<User>(
    `INSERT INTO users (email, password_hash, full_name, role, facility_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [invite.email, passwordHash, invite.full_name, invite.role, invite.facility_id]
  );
  await pool.query('UPDATE invites SET accepted_at = NOW() WHERE id = $1', [invite.id]);
  await pool.query(
    `INSERT INTO notification_preferences (user_id) VALUES ($1) ON CONFLICT DO NOTHING`,
    [userRes.rows[0].id]
  );

  const user = userRes.rows[0];
  const authUser = rowToAuthUser(user);
  return {
    user: toPublicUser(user),
    accessToken: signAccessToken(authUser),
    refreshToken: signRefreshToken(authUser),
  };
}
