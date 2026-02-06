/**
 * Express Application Configuration
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { analysisRouter } from './controllers/analysis.controller.js';
import { anonymousSessionMiddleware } from './middleware/anonymous-session.js';
import { globalRateLimiter } from './middleware/rate-limit.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { responseTimeMiddleware } from './middleware/response-time.js';

export function createApp(): express.Application {
  const app = express();

  // ======================================
  // Security Middleware
  // ======================================
  app.use(helmet());
  app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true // Allow cookies
  }));

  // ======================================
  // Body Parsing
  // ======================================
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // ======================================
  // Cookie Parser (for signed cookies)
  // ======================================
  const cookieSecret = process.env.COOKIE_SECRET || 'default-secret-change-in-production';
  app.use(cookieParser(cookieSecret));

  // ======================================
  // Global Middleware
  // ======================================
  app.use(responseTimeMiddleware);  // Track processing time for all responses
  app.use(globalRateLimiter);
  app.use(anonymousSessionMiddleware);

  // ======================================
  // Health Check
  // ======================================
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // ======================================
  // API Routes
  // ======================================
  app.use('/api/v1/analysis', analysisRouter);

  // ======================================
  // Error Handling
  // ======================================
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
