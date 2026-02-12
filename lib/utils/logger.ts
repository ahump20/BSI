/**
 * Simple logger utility for client-side logging
 * Provides structured logging with levels
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private log(level: LogLevel, contextOrMessage: LogContext | string, message?: string) {
    if (!this.isDevelopment && level === 'debug') {
      return; // Skip debug logs in production
    }

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    if (typeof contextOrMessage === 'string') {
      // Simple message
      console[level](prefix, contextOrMessage);
    } else {
      // Structured log with context
      console[level](prefix, message, contextOrMessage);
    }
  }

  debug(contextOrMessage: LogContext | string, message?: string) {
    this.log('debug', contextOrMessage, message);
  }

  info(contextOrMessage: LogContext | string, message?: string) {
    this.log('info', contextOrMessage, message);
  }

  warn(contextOrMessage: LogContext | string, message?: string) {
    this.log('warn', contextOrMessage, message);
  }

  error(contextOrMessage: LogContext | string, message?: string) {
    this.log('error', contextOrMessage, message);
  }
}

export const logger = new Logger();
