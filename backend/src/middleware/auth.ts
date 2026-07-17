import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';

export type UserRole = 'admin' | 'customer';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  facilityId: string | null;
  fullName: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  facilityId: string | null;
  fullName: string | null;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError('JWT_SECRET is not configured', 500, 'CONFIG_ERROR');
  }
  return secret;
}

export function signAccessToken(user: AuthUser): string {
  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    facilityId: user.facilityId,
    fullName: user.fullName,
  };
  return jwt.sign(payload, getSecret(), {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'],
  });
}

export function signRefreshToken(user: AuthUser): string {
  return jwt.sign({ sub: user.id, type: 'refresh' }, getSecret(), {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '30d') as jwt.SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, getSecret()) as JwtPayload & { type?: string };
  if (decoded.type === 'refresh') {
    throw new AppError('Invalid access token', 401, 'INVALID_TOKEN');
  }
  return decoded;
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
  }
  try {
    const payload = verifyToken(header.slice(7));
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      facilityId: payload.facilityId,
      fullName: payload.fullName,
    };
    next();
  } catch {
    next(new AppError('Invalid or expired token', 401, 'INVALID_TOKEN'));
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403, 'FORBIDDEN'));
    }
    next();
  };
}
