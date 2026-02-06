/**
 * Redis Connection Configuration
 */
import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const createRedisConnection = (): Redis => {
  return new Redis(redisUrl, {
    maxRetriesPerRequest: null, // Required for BullMQ
    enableReadyCheck: false
  });
};

// Shared connection for BullMQ
export const redisConnection = createRedisConnection();
