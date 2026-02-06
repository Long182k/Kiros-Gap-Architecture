/**
 * Anonymous Session Middleware
 * Manages signed cookies for anonymous user tracking
 */
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

const COOKIE_NAME = 'gap_session';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      sessionId: string;
    }
  }
}

/**
 * Middleware to manage anonymous user sessions via cookies
 */
export function anonymousSessionMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Try to get existing session from signed cookie
  let sessionId = req.signedCookies[COOKIE_NAME];

  if (!sessionId) {
    // Generate new session ID
    sessionId = uuidv4();

    // Set signed cookie
    res.cookie(COOKIE_NAME, sessionId, {
      signed: true,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: COOKIE_MAX_AGE,
      sameSite: 'lax'
    });
  }

  // Attach session ID to request
  req.sessionId = sessionId;

  next();
}
