import { Request, Response, NextFunction } from 'express';
import { requestId as makeRequestId } from '../utils/crypto';
import { logger } from '../utils/logger';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

export function requestContext(req: Request, res: Response, next: NextFunction) {
  const incoming = req.header('x-request-id');
  const id = incoming && incoming.trim() ? incoming.trim().slice(0, 128) : makeRequestId();
  req.requestId = id;
  res.setHeader('X-Request-Id', id);

  const started = Date.now();
  res.on('finish', () => {
    logger.info('http', {
      requestId: id,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      ms: Date.now() - started,
      userId: req.user?.id,
    });
  });

  next();
}
