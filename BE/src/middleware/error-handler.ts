/**
 * Centralized Error Handler Middleware
 */
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import logger from '../utils/logger.js';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

/**
 * Custom error class for API errors
 */
export class APIError extends Error implements AppError {
  statusCode: number;
  code: string;
  details?: unknown;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: unknown
  ) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

/**
 * Common error factory functions
 */
export const Errors = {
  badRequest: (message: string, details?: unknown) => 
    new APIError(message, 400, 'BAD_REQUEST', details),
  
  notFound: (resource: string) => 
    new APIError(`${resource} not found`, 404, 'NOT_FOUND'),
  
  validation: (message: string, details?: unknown) => 
    new APIError(message, 400, 'VALIDATION_ERROR', details),
  
  rateLimit: () => 
    new APIError('Rate limit exceeded', 429, 'RATE_LIMIT'),
  
  internal: (message: string = 'Internal server error') => 
    new APIError(message, 500, 'INTERNAL_ERROR')
};

/**
 * Error handler middleware
 */
export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error (but not in test environment)
  if (process.env.NODE_ENV !== 'test') {
    logger.error('Request error', {
      message: err.message,
      code: err.code,
      path: req.path,
      method: req.method,
      statusCode: err.statusCode || 500
    });
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const validationErrors = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message
    }));

    res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: validationErrors
    });
    return;
  }

  // Handle custom API errors
  if (err instanceof APIError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
      details: err.details
    });
    return;
  }

  // Handle unknown errors
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    code: err.code || 'INTERNAL_ERROR'
  });
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
    code: 'NOT_FOUND'
  });
}
