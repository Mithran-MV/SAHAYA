import 'dotenv/config';
import { createServer } from './server';
import { config } from './lib/config';
import { logger } from './lib/logger';
import { seedInMemoryStore } from './lib/seedRunner';

// Seed the in-memory store on startup so the dashboard always has data
// even on a fresh Cloud Run cold start.
seedInMemoryStore();

const app = createServer();

const server = app.listen(config.port, () => {
  logger.info(
    { port: config.port, env: config.nodeEnv },
    'sahaya backend listening',
  );
});

const shutdown = (signal: string) => {
  logger.info({ signal }, 'shutting down');
  server.close(() => {
    logger.info('server closed cleanly');
    process.exit(0);
  });
  setTimeout(() => {
    logger.warn('forced exit after 10s');
    process.exit(1);
  }, 10_000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
