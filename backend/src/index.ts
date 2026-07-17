import dotenv from 'dotenv';
import http from 'http';
import { createApp } from './app';
import { logger } from './utils/logger';
import { initRealtime } from './realtime/socket';

dotenv.config();

const app = createApp();
const PORT = Number(process.env.PORT) || 4000;

const server = http.createServer(app);
initRealtime(server);

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    logger.info(`OeniVault API listening on http://localhost:${PORT}`);
  });
}

export { app, server };
export default app;
