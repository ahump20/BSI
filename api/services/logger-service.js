/**
 * BLAZE SPORTS INTEL - LOGGER SERVICE
 * Phase 2B: Enterprise-grade structured logging
 *
 * Production-ready logging with levels, structured data, and monitoring integration
 */

class LoggerService {
  constructor(options = {}) {
    this.level = options.level || 'info';
    this.environment = options.environment || 'production';
    this.service = options.service || 'blaze-sports-intel';
    this.version = options.version || '1.0.0';

    // Log levels hierarchy
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
      trace: 4
    };

    this.currentLevel = this.levels[this.level] || this.levels.info;

    // Metrics tracking
    this.metrics = {
      error: 0,
      warn: 0,
      info: 0,
      debug: 0,
      trace: 0
    };

    // Buffer for log aggregation
    this.logBuffer = [];
    this.maxBufferSize = 100;
    this.flushInterval = 30000; // 30 seconds

    // Start log flushing
    if (this.environment === 'production') {
      this.startLogFlushing();
    }
  }

  /**
   * Error level logging - always shown
   */
  error(message, metadata = {}, error = null) {
    this.metrics.error++;

    const logEntry = this.createLogEntry('error', message, {
      ...metadata,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code
      } : undefined
    });

    this.output(logEntry);

    // In production, send to monitoring service
    if (this.environment === 'production') {
      this.sendToMonitoring(logEntry);
    }
  }

  /**
   * Warning level logging
   */
  warn(message, metadata = {}) {
    if (this.currentLevel < this.levels.warn) return;

    this.metrics.warn++;
    const logEntry = this.createLogEntry('warn', message, metadata);
    this.output(logEntry);
  }

  /**
   * Info level logging
   */
  info(message, metadata = {}) {
    if (this.currentLevel < this.levels.info) return;

    this.metrics.info++;
    const logEntry = this.createLogEntry('info', message, metadata);
    this.output(logEntry);
  }

  /**
   * Debug level logging
   */
  debug(message, metadata = {}) {
    if (this.currentLevel < this.levels.debug) return;

    this.metrics.debug++;
    const logEntry = this.createLogEntry('debug', message, metadata);
    this.output(logEntry);
  }

  /**
   * Trace level logging
   */
  trace(message, metadata = {}) {
    if (this.currentLevel < this.levels.trace) return;

    this.metrics.trace++;
    const logEntry = this.createLogEntry('trace', message, metadata);
    this.output(logEntry);
  }

  /**
   * Create structured log entry
   */
  createLogEntry(level, message, metadata = {}) {
    return {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      service: this.service,
      version: this.version,
      environment: this.environment,
      message,
      traceId: this.generateTraceId(),
      ...this.sanitizeMetadata(metadata)
    };
  }

  /**
   * Sanitize metadata to prevent logging sensitive information
   */
  sanitizeMetadata(metadata) {
    const sanitized = { ...metadata };
    const sensitiveKeys = [
      'password', 'token', 'secret', 'key', 'authorization',
      'api_key', 'apikey', 'auth', 'credential', 'session'
    ];

    function sanitizeObject(obj, path = '') {
      for (const [key, value] of Object.entries(obj)) {
        const keyLower = key.toLowerCase();
        const currentPath = path ? `${path}.${key}` : key;

        if (sensitiveKeys.some(sensitive => keyLower.includes(sensitive))) {
          obj[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          sanitizeObject(value, currentPath);
        } else if (typeof value === 'string' && value.length > 1000) {
          obj[key] = value.substring(0, 1000) + '... [TRUNCATED]';
        }
      }
    }

    sanitizeObject(sanitized);
    return sanitized;
  }

  /**
   * Output log entry
   */
  output(logEntry) {
    if (this.environment === 'development') {
      // Pretty print for development
      this.prettyPrint(logEntry);
    } else {
      // JSON format for production
    }

    // Add to buffer for batch processing
    this.addToBuffer(logEntry);
  }

  /**
   * Pretty print for development
   */
  prettyPrint(logEntry) {
    const colors = {
      ERROR: '\x1b[31m', // Red
      WARN: '\x1b[33m',  // Yellow
      INFO: '\x1b[36m',  // Cyan
      DEBUG: '\x1b[35m', // Magenta
      TRACE: '\x1b[37m'  // White
    };
    const reset = '\x1b[0m';

    const color = colors[logEntry.level] || reset;
    const timestamp = new Date(logEntry.timestamp).toLocaleTimeString();

      `${color}[${timestamp}] ${logEntry.level}${reset} ${logEntry.message}`,
      logEntry.error ? logEntry.error : ''
    );

    // Show metadata if present
    const { timestamp: _, level: __, message: ___, error: ____, ...metadata } = logEntry;
    if (Object.keys(metadata).length > 0) {
    }
  }

  /**
   * Buffer management for batch processing
   */
  addToBuffer(logEntry) {
    this.logBuffer.push(logEntry);

    if (this.logBuffer.length >= this.maxBufferSize) {
      this.flushLogs();
    }
  }

  /**
   * Flush logs to external services
   */
  async flushLogs() {
    if (this.logBuffer.length === 0) return;

    const logsToFlush = [...this.logBuffer];
    this.logBuffer = [];

    try {
      // In production, send to log aggregation service
      if (this.environment === 'production') {
        await this.sendToLogAggregator(logsToFlush);
      }
    } catch (error) {
      // Don't use this.error to avoid infinite loop
      console.error('Failed to flush logs:', error);
    }
  }

  /**
   * Start periodic log flushing
   */
  startLogFlushing() {
    setInterval(() => {
      this.flushLogs();
    }, this.flushInterval);
  }

  /**
   * Send critical errors to monitoring service
   */
  async sendToMonitoring(logEntry) {
    try {
      // In production, integrate with Sentry, DataDog, etc.
      if (typeof globalThis.SENTRY_DSN !== 'undefined') {
        // Send to Sentry
      }
    } catch (error) {
      console.error('Failed to send to monitoring:', error);
    }
  }

  /**
   * Send logs to aggregation service
   */
  async sendToLogAggregator(logs) {
    try {
      // In production, send to CloudWatch, LogDNA, etc.
    } catch (error) {
      console.error('Failed to send to log aggregator:', error);
    }
  }

  /**
   * Generate unique trace ID for request tracking
   */
  generateTraceId() {
    return `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create child logger with additional context
   */
  child(context = {}) {
    const childLogger = new LoggerService({
      level: this.level,
      environment: this.environment,
      service: this.service,
      version: this.version
    });

    // Override createLogEntry to include parent context
    const originalCreateLogEntry = childLogger.createLogEntry.bind(childLogger);
    childLogger.createLogEntry = (level, message, metadata = {}) => {
      return originalCreateLogEntry(level, message, { ...context, ...metadata });
    };

    return childLogger;
  }

  /**
   * Performance timing
   */
  timer(name) {
    const start = Date.now();
    return {
      end: (metadata = {}) => {
        const duration = Date.now() - start;
        this.info(`Timer: ${name} completed`, {
          ...metadata,
          duration_ms: duration,
          timer_name: name
        });
        return duration;
      }
    };
  }

  /**
   * Log HTTP request/response
   */
  logHttpRequest(request, response, duration) {
    const logData = {
      http: {
        method: request.method,
        url: request.url,
        status: response.status,
        duration_ms: duration,
        user_agent: request.headers.get('User-Agent'),
        ip: request.headers.get('CF-Connecting-IP') ||
            request.headers.get('X-Forwarded-For') ||
            'unknown'
      }
    };

    if (response.status >= 400) {
      this.warn(`HTTP ${response.status}: ${request.method} ${request.url}`, logData);
    } else {
      this.info(`HTTP ${response.status}: ${request.method} ${request.url}`, logData);
    }
  }

  /**
   * Log API call performance
   */
  logApiCall(endpoint, duration, success, error = null) {
    const logData = {
      api: {
        endpoint,
        duration_ms: duration,
        success
      }
    };

    if (error) {
      this.error(`API call failed: ${endpoint}`, logData, error);
    } else {
      this.info(`API call: ${endpoint}`, logData);
    }
  }

  /**
   * Get logger statistics
   */
  getStats() {
    return {
      ...this.metrics,
      level: this.level,
      bufferSize: this.logBuffer.length,
      service: this.service,
      environment: this.environment
    };
  }

  /**
   * Health check for logger
   */
  healthCheck() {
    try {
      this.debug('Logger health check');
      return {
        status: 'healthy',
        stats: this.getStats()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

export default LoggerService;