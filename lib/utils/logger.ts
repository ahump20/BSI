/**
 * Structured Logging System
 *
 * Provides production-ready logging with:
 * - JSON-formatted logs
 * - Log levels (debug, info, warn, error, fatal)
 * - Correlation IDs for request tracing
 * - Context enrichment
 * - Performance metrics
 * - Integration with Sentry/Datadog
 *
 * Usage:
 *   import { logger } from '@/lib/utils/logger';
 *
 *   logger.info({ userId: '123', action: 'login' }, 'User logged in');
 *   logger.error({ error: err }, 'Database connection failed');
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  [LogLevel.DEBUG]: 10,
  [LogLevel.INFO]: 20,
  [LogLevel.WARN]: 30,
  [LogLevel.ERROR]: 40,
  [LogLevel.FATAL]: 50,
};

export interface LogContext {
  [key: string]: any;
  correlationId?: string;
  userId?: string;
  requestId?: string;
  service?: string;
  environment?: string;
  version?: string;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    message: string;
    stack?: string;
    name?: string;
    code?: string;
  };
  performance?: {
    duration: number;
    unit: 'ms' | 's';
  };
}

/**
 * Logger Configuration
 */
export interface LoggerConfig {
  level: LogLevel;
  service?: string;
  version?: string;
  environment?: string;
  prettyPrint?: boolean;
  redact?: string[]; // Fields to redact from logs (e.g., passwords, tokens)
  sendToSentry?: boolean;
  sendToDatadog?: boolean;
}

// Helper to safely access process.env in both Node.js and Workers
const getProcessEnv = (key: string): string | undefined =>
  typeof process !== 'undefined' ? process.env?.[key] : undefined;

const DEFAULT_CONFIG: LoggerConfig = {
  level: (getProcessEnv('LOG_LEVEL') as LogLevel) || LogLevel.INFO,
  service: getProcessEnv('SERVICE_NAME') || 'bsi-api',
  version: getProcessEnv('APP_VERSION') || '1.0.0',
  environment: getProcessEnv('NODE_ENV') || 'development',
  prettyPrint: getProcessEnv('NODE_ENV') === 'development',
  redact: ['password', 'token', 'secret', 'apiKey', 'authorization'],
  sendToSentry: getProcessEnv('SENTRY_DSN') ? true : false,
  sendToDatadog: getProcessEnv('DD_API_KEY') ? true : false,
};

/**
 * Structured Logger
 */
export class Logger {
  private config: LoggerConfig;
  private globalContext: LogContext = {};

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.globalContext = {
      service: this.config.service,
      version: this.config.version,
      environment: this.config.environment,
    };
  }

  /**
   * Add global context to all logs
   */
  setGlobalContext(context: LogContext): void {
    this.globalContext = { ...this.globalContext, ...context };
  }

  /**
   * Create child logger with additional context
   */
  child(context: LogContext): Logger {
    const child = new Logger(this.config);
    child.globalContext = { ...this.globalContext, ...context };
    return child;
  }

  /**
   * Log debug message
   */
  debug(contextOrMessage: LogContext | string, message?: string): void {
    this.log(LogLevel.DEBUG, contextOrMessage, message);
  }

  /**
   * Log info message
   */
  info(contextOrMessage: LogContext | string, message?: string): void {
    this.log(LogLevel.INFO, contextOrMessage, message);
  }

  /**
   * Log warning message
   */
  warn(contextOrMessage: LogContext | string, message?: string): void {
    this.log(LogLevel.WARN, contextOrMessage, message);
  }

  /**
   * Log error message
   */
  error(contextOrMessage: LogContext | string, messageOrError?: string | Error): void {
    let context: LogContext = {};
    let message: string;
    let error: Error | undefined;

    if (typeof contextOrMessage === 'string') {
      message = contextOrMessage;
      if (messageOrError instanceof Error) {
        error = messageOrError;
      } else if (typeof messageOrError === 'string') {
        message = messageOrError;
      }
    } else {
      context = contextOrMessage;
      if (messageOrError instanceof Error) {
        error = messageOrError;
        message = error.message;
      } else {
        message = messageOrError || 'Error occurred';
      }
    }

    this.log(LogLevel.ERROR, context, message, error);
  }

  /**
   * Log fatal error (application crash)
   */
  fatal(contextOrMessage: LogContext | string, messageOrError?: string | Error): void {
    this.error(contextOrMessage, messageOrError);

    // In production, consider notifying on-call team
    if (this.config.environment === 'production') {
      // Send alert
    }
  }

  /**
   * Log with performance timing
   */
  timed(context: LogContext, message: string, durationMs: number): void {
    this.log(LogLevel.INFO, context, message, undefined, durationMs);
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    contextOrMessage: LogContext | string,
    message?: string,
    error?: Error,
    durationMs?: number
  ): void {
    // Check log level
    if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[this.config.level]) {
      return;
    }

    let context: LogContext = {};
    let msg: string;

    if (typeof contextOrMessage === 'string') {
      msg = contextOrMessage;
    } else {
      context = contextOrMessage;
      msg = message || '';
    }

    // Build log entry
    const entry: LogEntry = {
      level,
      message: msg,
      timestamp: new Date().toISOString(),
      context: this.redactSensitiveData({
        ...this.globalContext,
        ...context,
      }),
    };

    // Add error details
    if (error) {
      entry.error = {
        message: error.message,
        name: error.name,
        stack: error.stack,
        code: (error as any).code,
      };
    }

    // Add performance metrics
    if (durationMs !== undefined) {
      entry.performance = {
        duration: durationMs,
        unit: 'ms',
      };
    }

    // Output log
    this.output(entry);

    // Send to external services
    if (level === LogLevel.ERROR || level === LogLevel.FATAL) {
      this.sendToExternalServices(entry, error);
    }
  }

  /**
   * Output log entry
   */
  private output(entry: LogEntry): void {
    if (this.config.prettyPrint) {
      this.prettyPrint(entry);
    } else {
      console.log(JSON.stringify(entry));
    }
  }

  /**
   * Pretty print log entry (development)
   */
  private prettyPrint(entry: LogEntry): void {
    const colors = {
      [LogLevel.DEBUG]: '\x1b[36m', // Cyan
      [LogLevel.INFO]: '\x1b[32m', // Green
      [LogLevel.WARN]: '\x1b[33m', // Yellow
      [LogLevel.ERROR]: '\x1b[31m', // Red
      [LogLevel.FATAL]: '\x1b[35m', // Magenta
    };

    const reset = '\x1b[0m';
    const color = colors[entry.level];

    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const level = entry.level.toUpperCase().padEnd(5);

    let output = `${color}[${timestamp}] ${level}${reset} ${entry.message}`;

    if (entry.context && Object.keys(entry.context).length > 0) {
      output += `\n  Context: ${JSON.stringify(entry.context, null, 2)}`;
    }

    if (entry.error) {
      output += `\n  Error: ${entry.error.message}`;
      if (entry.error.stack) {
        output += `\n${entry.error.stack}`;
      }
    }

    if (entry.performance) {
      output += `\n  Duration: ${entry.performance.duration}${entry.performance.unit}`;
    }

    console.log(output);
  }

  /**
   * Redact sensitive data from logs
   */
  private redactSensitiveData(context: LogContext): LogContext {
    const redacted = { ...context };

    for (const field of this.config.redact || []) {
      if (field in redacted) {
        redacted[field] = '[REDACTED]';
      }
    }

    return redacted;
  }

  /**
   * Send errors to external monitoring services
   */
  private sendToExternalServices(entry: LogEntry, error?: Error): void {
    // Send to Sentry
    if (
      this.config.sendToSentry &&
      typeof globalThis !== 'undefined' &&
      (globalThis as any).Sentry
    ) {
      try {
        (globalThis as any).Sentry.captureException(error || new Error(entry.message), {
          level: entry.level === LogLevel.FATAL ? 'fatal' : 'error',
          contexts: {
            log: entry.context,
          },
        });
      } catch (err) {
        console.error('Failed to send error to Sentry:', err);
      }
    }

    // Send to Datadog (via RUM or logs API)
    if (this.config.sendToDatadog) {
      try {
        // Datadog logs can be sent via their API or browser SDK
        // For Cloudflare Workers, use fetch to send to logs API
        this.sendToDatadog(entry);
      } catch (err) {
        console.error('Failed to send error to Datadog:', err);
      }
    }
  }

  /**
   * Send log to Datadog
   */
  private async sendToDatadog(entry: LogEntry): Promise<void> {
    const apiKey = typeof process !== 'undefined' ? process.env?.DD_API_KEY : undefined;
    if (!apiKey) return;

    try {
      await fetch('https://http-intake.logs.datadoghq.com/v1/input', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'DD-API-KEY': apiKey,
        },
        body: JSON.stringify({
          ddsource: 'bsi',
          ddtags: `env:${this.config.environment},service:${this.config.service}`,
          message: entry.message,
          level: entry.level,
          ...entry.context,
        }),
      });
    } catch (err) {
      // Don't throw - logging should never crash the app
      console.error('Failed to send log to Datadog:', err);
    }
  }

  /**
   * Create timer for performance logging
   */
  startTimer(context: LogContext, message: string): () => void {
    const start = Date.now();

    return () => {
      const duration = Date.now() - start;
      this.timed(context, message, duration);
    };
  }
}

/**
 * Global logger instance
 */
export const logger = new Logger();

/**
 * Create correlation ID for request tracing
 */
export function createCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Create request logger with correlation ID
 */
export function createRequestLogger(request: Request): Logger {
  const correlationId = request.headers.get('X-Correlation-ID') || createCorrelationId();

  return logger.child({
    correlationId,
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('User-Agent') || undefined,
  });
}

/**
 * Middleware to add logging to requests
 */
export function withLogging(
  handler: (request: Request, env: any, ctx: any, logger: Logger) => Promise<Response>
) {
  return async (request: Request, env: any, ctx: any): Promise<Response> => {
    const requestLogger = createRequestLogger(request);
    const stopTimer = requestLogger.startTimer(
      {
        endpoint: new URL(request.url).pathname,
      },
      'Request completed'
    );

    try {
      requestLogger.info('Request started');
      const response = await handler(request, env, ctx, requestLogger);

      requestLogger.info(
        {
          status: response.status,
          statusText: response.statusText,
        },
        'Request completed'
      );

      stopTimer();

      return response;
    } catch (error) {
      requestLogger.error({ error }, 'Request failed');
      stopTimer();
      throw error;
    }
  };
}
