/**
 * Structured JSON Logger
 *
 * Outputs machine-parseable JSON for Cloudflare Tail Workers and log tooling.
 * Falls back to human-readable console output in development.
 *
 * Usage:
 *   import { logger, createRequestLogger } from '@/lib/utils/logger';
 *
 *   logger.info('Server started', { port: 8787 });
 *   logger.error('Fetch failed', { url, status: 500 });
 *
 *   // Request-scoped logging in Workers:
 *   const log = createRequestLogger('abc-123', 'GET', '/api/scores');
 *   log.info('Cache hit', { key: 'scores:mlb' });
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  timezone: 'America/Chicago';
  service: string;
  [key: string]: unknown;
}

const TIMEZONE = 'America/Chicago' as const;
const SERVICE = 'bsi';

function isDev(): boolean {
  try {
    return typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';
  } catch {
    return false;
  }
}

function formatEntry(level: LogLevel, message: string, context: Record<string, unknown> = {}): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    timezone: TIMEZONE,
    service: SERVICE,
    ...context,
  };
}

function emit(level: LogLevel, message: string, context: Record<string, unknown> = {}): void {
  const entry = formatEntry(level, message, context);

  if (isDev()) {
    // Human-readable in development
    const prefix = `[BSI:${level.toUpperCase()}]`;
    const contextStr = Object.keys(context).length > 0 ? ` ${JSON.stringify(context)}` : '';
    const fn = level === 'error' ? console.error
      : level === 'warn' ? console.warn
      : level === 'debug' ? console.debug
      : console.log;
    fn(`${prefix} ${message}${contextStr}`);
    return;
  }

  // Structured JSON in production — consumed by Tail Workers
  const fn = level === 'error' ? console.error
    : level === 'warn' ? console.warn
    : console.log;
  fn(JSON.stringify(entry));
}

export const logger = {
  info:  (message: string, context?: Record<string, unknown>) => emit('info', message, context),
  warn:  (message: string, context?: Record<string, unknown>) => emit('warn', message, context),
  error: (message: string, context?: Record<string, unknown>) => emit('error', message, context),
  debug: (message: string, context?: Record<string, unknown>) => {
    if (isDev()) emit('debug', message, context);
  },
};

/**
 * Create a request-scoped logger that auto-includes request ID, method, and path.
 * Use at the top of a Worker's fetch() handler for correlated log lines.
 */
export function createRequestLogger(requestId: string, method: string, pathname: string) {
  const base = { requestId, method, pathname };

  return {
    info:  (message: string, context?: Record<string, unknown>) => emit('info', message, { ...base, ...context }),
    warn:  (message: string, context?: Record<string, unknown>) => emit('warn', message, { ...base, ...context }),
    error: (message: string, context?: Record<string, unknown>) => emit('error', message, { ...base, ...context }),
    debug: (message: string, context?: Record<string, unknown>) => {
      if (isDev()) emit('debug', message, { ...base, ...context });
    },
  };
}
