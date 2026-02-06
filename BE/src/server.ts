/**
 * Server Entry Point
 * Starts Express server and BullMQ worker
 */
import 'dotenv/config';

import { createApp } from './app.js';
import { analysisWorker } from './workers/analysis.worker.js';
import { closePool } from './db/index.js';
import { analysisCache } from './cache/analysis.cache.js';

const PORT = parseInt(process.env.PORT || '3001', 10);

async function startServer(): Promise<void> {
  const app = createApp();

  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔄 Worker processing jobs...`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);

    // Stop accepting new connections
    server.close(() => {
      console.log('HTTP server closed');
    });

    // Close worker
    await analysisWorker.close();
    console.log('Worker closed');

    // Close database pool
    await closePool();
    console.log('Database pool closed');

    // Close Redis cache
    await analysisCache.close();
    console.log('Redis connection closed');

    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle unhandled rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
