/**
 * Server Entry Point
 * Starts Express server and BullMQ worker
 */
import 'dotenv/config';

import { createApp } from './app.js';
import { analysisWorker } from './workers/analysis.worker.js';
import { closePool } from './db/index.js';
import { analysisCache } from './cache/analysis.cache.js';
import logger from './utils/logger.js';

const PORT = parseInt(process.env.PORT || '3001', 10);

async function startServer(): Promise<void> {
  const app = createApp();

  const server = app.listen(PORT, () => {
    logger.info('🚀 Server started', { port: PORT, url: `http://localhost:${PORT}` });
    logger.info('📊 Health check available', { endpoint: `/health` });
    logger.info('🔄 Worker started processing jobs');
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.warn('Shutdown signal received', { signal });

    // Stop accepting new connections
    server.close(() => {
      logger.info('HTTP server closed');
    });

    // Close worker
    await analysisWorker.close();
    logger.info('Worker closed');

    // Close database pool
    await closePool();
    logger.info('Database pool closed');

    // Close Redis cache
    await analysisCache.close();
    logger.info('Redis connection closed');

    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle unhandled rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', { reason: String(reason), promise: String(promise) });
  });
}

startServer().catch((error) => {
  logger.error('Failed to start server', { error: error.message, stack: error.stack });
  process.exit(1);
});
