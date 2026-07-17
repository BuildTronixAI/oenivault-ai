import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import type { AuthUser, UserRole } from '../middleware/auth';

let io: Server | null = null;

interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  facilityId: string | null;
  fullName: string | null;
  type?: string;
}

export function initRealtime(httpServer: HttpServer) {
  const origin = process.env.CORS_ORIGIN || 'http://localhost:5173';
  io = new Server(httpServer, {
    cors: { origin, credentials: true },
    path: '/socket.io',
  });

  io.use((socket, next) => {
    const token =
      (socket.handshake.auth?.token as string | undefined) ||
      (socket.handshake.headers.authorization?.startsWith('Bearer ')
        ? socket.handshake.headers.authorization.slice(7)
        : undefined);

    if (!token) {
      return next(new Error('Authentication required'));
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) return next(new Error('Server misconfigured'));

    try {
      const payload = jwt.verify(token, secret) as JwtPayload;
      if (payload.type === 'refresh') return next(new Error('Invalid token'));
      const user: AuthUser = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        facilityId: payload.facilityId,
        fullName: payload.fullName,
      };
      socket.data.user = user;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as AuthUser;
    if (user.facilityId) {
      socket.join(`facility:${user.facilityId}`);
    }
    if (user.role === 'admin') {
      socket.join('role:admin');
    }
    logger.info('Socket connected', { userId: user.id, role: user.role });
    socket.on('disconnect', () => {
      logger.debug('Socket disconnected', { userId: user.id });
    });
  });

  logger.info('Socket.io realtime ready');
  return io;
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

export function emitClimateReading(facilityId: string, payload: unknown) {
  if (!io) return;
  io.to(`facility:${facilityId}`).emit('climate:reading', payload);
  io.to('role:admin').emit('climate:reading', payload);
}

export function emitAlert(facilityId: string, payload: unknown) {
  if (!io) return;
  io.to(`facility:${facilityId}`).emit('climate:alert', payload);
  io.to('role:admin').emit('climate:alert', payload);
}
