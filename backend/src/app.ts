import express from 'express';
import cors from 'cors';
import { pool } from './database/pool';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import inventoryRoutes from './routes/inventory';
import collectionRoutes from './routes/collections';
import customerRoutes from './routes/customers';
import climateRoutes from './routes/climate';
import reportRoutes from './routes/reports';
import preferencesRoutes from './routes/preferences';

export function createApp() {
  const app = express();
  const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
    }
    next();
  });

  app.use(
    cors({
      origin: CORS_ORIGIN,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', async (_req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({
        status: 'ok',
        database: 'connected',
        realtime: true,
        timestamp: new Date().toISOString(),
      });
    } catch {
      res.status(503).json({
        status: 'degraded',
        database: 'disconnected',
        realtime: true,
        timestamp: new Date().toISOString(),
      });
    }
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/inventory', inventoryRoutes);
  app.use('/api/collections', collectionRoutes);
  app.use('/api/customers', customerRoutes);
  app.use('/api/climate', climateRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/preferences', preferencesRoutes);

  app.use(errorHandler);
  return app;
}
