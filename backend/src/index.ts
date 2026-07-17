import dotenv from 'dotenv';
import http from 'http';
import express from 'express';
import cors from 'cors';
import { pool } from './database/pool';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { initRealtime } from './realtime/socket';
import authRoutes from './routes/auth';
import inventoryRoutes from './routes/inventory';
import collectionRoutes from './routes/collections';
import customerRoutes from './routes/customers';
import climateRoutes from './routes/climate';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());

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

app.use(errorHandler);

const server = http.createServer(app);
initRealtime(server);

server.listen(PORT, () => {
  logger.info(`OeniVault API listening on http://localhost:${PORT}`);
});

export default app;
