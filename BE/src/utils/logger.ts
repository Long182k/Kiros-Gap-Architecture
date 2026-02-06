import winston from 'winston';

const { combine, timestamp, json, printf, colorize } = winston.format;

// Custom format for development (readable)
const devFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

// Determine if running in production
const isProduction = process.env.NODE_ENV === 'production';

// Create Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    // In production, use JSON for Loki/Grafana
    isProduction ? json() : combine(colorize(), devFormat)
  ),
  defaultMeta: { service: 'gapanalyzer-backend' },
  transports: [
    new winston.transports.Console({
      // Ensure all logs go to stdout (not stderr) for Docker
      stderrLevels: [],
    }),
  ],
});

// Export convenience methods that match console.log signature
export const log = {
  info: (message: string, meta?: Record<string, unknown>) => logger.info(message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => logger.warn(message, meta),
  error: (message: string, meta?: Record<string, unknown>) => logger.error(message, meta),
  debug: (message: string, meta?: Record<string, unknown>) => logger.debug(message, meta),
  http: (message: string, meta?: Record<string, unknown>) => logger.http(message, meta),
};

export default logger;
