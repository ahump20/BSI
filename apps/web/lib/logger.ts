/**
 * Winston Logger Integration for Next.js
 *
 * Provides structured logging with Winston for server-side Next.js operations
 *
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.info('User logged in', { userId: '123' });
 *   logger.error('Database error', { error: err });
 */

import winston from 'winston';

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Development format with colors
const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// Determine log level from environment
const logLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

// Create logger instance
export const logger = winston.createLogger({
  level: logLevel,
  format: process.env.NODE_ENV === 'production' ? logFormat : devFormat,
  defaultMeta: {
    service: 'bsi-web',
    version: process.env.APP_VERSION || '2.0.0',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    // Console transport for all environments
    new winston.transports.Console({
      stderrLevels: ['error'],
    }),
  ],
  // Don't exit on handled exceptions
  exitOnError: false,
});

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
  // Error log file
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  // Combined log file
  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Stream for Morgan or other middleware
export const loggerStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

/**
 * Create child logger with additional context
 */
export function createChildLogger(context: Record<string, any>) {
  return logger.child(context);
}

/**
 * Log HTTP request
 */
export function logHttpRequest(
  method: string,
  url: string,
  statusCode: number,
  duration: number,
  meta?: Record<string, any>
) {
  const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

  logger.log(level, `HTTP ${method} ${url} ${statusCode}`, {
    http: {
      method,
      url,
      statusCode,
      duration: `${duration}ms`,
    },
    ...meta,
  });
}

/**
 * Log API call
 */
export function logApiCall(
  endpoint: string,
  duration: number,
  success: boolean,
  error?: Error,
  meta?: Record<string, any>
) {
  if (error) {
    logger.error(`API call failed: ${endpoint}`, {
      api: { endpoint, duration: `${duration}ms`, success },
      error: {
        message: error.message,
        stack: error.stack,
      },
      ...meta,
    });
  } else {
    logger.info(`API call: ${endpoint}`, {
      api: { endpoint, duration: `${duration}ms`, success },
      ...meta,
    });
  }
}

/**
 * Log with performance timing
 */
export function logWithTiming(message: string, startTime: number, meta?: Record<string, any>) {
  const duration = Date.now() - startTime;
  logger.info(message, {
    performance: {
      duration: `${duration}ms`,
    },
    ...meta,
  });
}

/**
 * Create timer for measuring performance
 */
export function startTimer(label: string) {
  const start = Date.now();

  return {
    end: (meta?: Record<string, any>) => {
      const duration = Date.now() - start;
      logger.info(`Timer: ${label}`, {
        performance: {
          label,
          duration: `${duration}ms`,
        },
        ...meta,
      });
      return duration;
    },
  };
}

/**
 * Log database query
 */
export function logDatabaseQuery(
  query: string,
  duration: number,
  rowCount?: number,
  error?: Error
) {
  if (error) {
    logger.error('Database query failed', {
      database: {
        query: query.substring(0, 100), // Truncate long queries
        duration: `${duration}ms`,
        error: error.message,
      },
    });
  } else {
    logger.debug('Database query executed', {
      database: {
        query: query.substring(0, 100),
        duration: `${duration}ms`,
        rowCount,
      },
    });
  }
}

/**
 * Log cache operation
 */
export function logCacheOperation(
  operation: 'get' | 'set' | 'delete',
  key: string,
  hit: boolean,
  duration?: number
) {
  logger.debug(`Cache ${operation}: ${key}`, {
    cache: {
      operation,
      key,
      hit,
      duration: duration ? `${duration}ms` : undefined,
    },
  });
}

/**
 * Log user action
 */
export function logUserAction(
  userId: string,
  action: string,
  meta?: Record<string, any>
) {
  logger.info(`User action: ${action}`, {
    user: {
      userId,
      action,
    },
    ...meta,
  });
}

/**
 * Middleware to log all errors to Sentry
 */
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  logger.on('error', (error) => {
    // Sentry integration would go here
    console.error('Logger error:', error);
  });
}

// Log unhandled rejections
process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled Rejection', {
    error: {
      message: reason?.message || String(reason),
      stack: reason?.stack,
    },
  });
});

// Log uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', {
    error: {
      message: error.message,
      stack: error.stack,
    },
  });
});

export default logger;
