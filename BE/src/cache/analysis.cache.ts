/**
 * Redis Cache Service for Analysis Results
 */
import Redis from 'ioredis';

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
      console.error('Redis connection error:', err);
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
      console.error('Cache get error:', error);
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
      console.error('Cache set error:', error);
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
      console.error('Cache delete error:', error);
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
      console.error('Cache exists error:', error);
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
