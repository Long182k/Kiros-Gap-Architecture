/**
 * Redis Cache Service for Analysis Results
 */
import Redis from 'ioredis';
import logger from '../utils/logger.js';

const CACHE_TTL = parseInt(process.env.CACHE_TTL_SECONDS || '86400', 10); // 24 hours default

class AnalysisCache {
  private redis: Redis;
  private keyPrefix = 'analysis:';

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 100, 3000);
      }
    });

    this.redis.on('error', (err) => {
      logger.error('Redis connection error', { error: err.message });
    });
  }

  /**
   * Get cached analysis result by content hash
   */
  async get<T>(hash: string): Promise<T | null> {
    try {
      const key = this.keyPrefix + hash;
      const cached = await this.redis.get(key);
      
      if (!cached) return null;
      
      return JSON.parse(cached) as T;
    } catch (error) {
      logger.error('Cache get error', { error: (error as Error).message, hash });
      return null;
    }
  }

  /**
   * Set analysis result in cache
   */
  async set<T>(hash: string, data: T, ttlSeconds?: number): Promise<void> {
    try {
      const key = this.keyPrefix + hash;
      const ttl = ttlSeconds || CACHE_TTL;
      
      await this.redis.setex(key, ttl, JSON.stringify(data));
    } catch (error) {
      logger.error('Cache set error', { error: (error as Error).message, hash });
    }
  }

  /**
   * Delete cached result
   */
  async delete(hash: string): Promise<void> {
    try {
      const key = this.keyPrefix + hash;
      await this.redis.del(key);
    } catch (error) {
      logger.error('Cache delete error', { error: (error as Error).message, hash });
    }
  }

  /**
   * Check if key exists
   */
  async exists(hash: string): Promise<boolean> {
    try {
      const key = this.keyPrefix + hash;
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error', { error: (error as Error).message, hash });
      return false;
    }
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    await this.redis.quit();
  }

  /**
   * Get Redis instance for queue usage
   */
  getRedisInstance(): Redis {
    return this.redis;
  }
}

// Export singleton
export const analysisCache = new AnalysisCache();
export { AnalysisCache };
