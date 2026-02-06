/**
 * Response Time Middleware
 * Tracks request processing time and appends it to all JSON responses
 * 
 * Note: For analysis results, aiProcessingTimeMs (AI processing time) is returned
 * separately from processingTimeMs (request handling time)
 */
import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Response {
      sendJson: (body: object) => void;
    }
  }
}

export function responseTimeMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  
  // Store original json method
  const originalJson = res.json.bind(res);
  
  // Override json method to inject processingTimeMs
  res.json = function(body: unknown): Response {
    if (body && typeof body === 'object' && !Array.isArray(body)) {
      const processingTimeMs = Date.now() - startTime;
      // Add request processing time (don't override if exists)
      return originalJson({ ...body, requestTimeMs: processingTimeMs });
    }
    return originalJson(body);
  } as Response['json'];
  
  next();
}
