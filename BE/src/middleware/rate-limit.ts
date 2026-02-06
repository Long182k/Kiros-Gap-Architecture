/**
 * Rate Limiting Middleware
 * 10 analyses per hour per session
 */
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redisConnection } from '../cache/redis.js';
import type { Request, Response } from 'express';

const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '3600000', 10); // 1 hour
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 100);

/**
 * Rate limiter for analysis endpoints
 */
export const analysisRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: MAX_REQUESTS,
  message: {
    error: 'Too many analysis requests',
    message: `You can only submit ${MAX_REQUESTS} analyses per hour. Please try again later.`,
    retryAfter: Math.ceil(WINDOW_MS / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  
  // Use session ID as key (from cookie)
  keyGenerator: (req: Request): string => {
    return req.sessionId || req.ip || 'anonymous';
  },

  // Use Redis store for distributed rate limiting
  store: new RedisStore({
    // @ts-expect-error - Type mismatch between ioredis and rate-limit-redis
    sendCommand: (...args: string[]) => redisConnection.call(...args),
    prefix: 'rl:analysis:'
  }),

  // Skip rate limiting for GET requests
  skip: (req: Request): boolean => {
    return req.method === 'GET';
  },

  // Handler for rate limit exceeded
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many requests',
      message: `Rate limit exceeded. Maximum ${MAX_REQUESTS} analyses per hour.`,
      retryAfter: Math.ceil(WINDOW_MS / 1000)
    });
  }
});

/**
 * Global rate limiter (for all endpoints)
 */
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: {
    error: 'Too many requests',
    message: 'Please slow down. Try again in a few minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    return req.ip || 'anonymous';
  }
});
