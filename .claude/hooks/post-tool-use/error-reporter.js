#!/usr/bin/env node

/**
 * PostToolUse Hook: Error Reporter
 *
 * Reports errors to monitoring system with context and stack traces.
 * Tracks error patterns and suggests fixes.
 *
 * Reports include:
 * - Error type and message
 * - Stack trace
 * - Tool context (name, arguments)
 * - System state
 * - Suggested remediation
 *
 * Triggers: After failed tool operations
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ERROR_LOG = '/Users/AustinHumphrey/.claude/logs/errors.log';
const ERROR_DB = '/Users/AustinHumphrey/.claude/data/errors.json';
const MAX_ERRORS_STORED = 1000;

/**
 * Ensure error logging infrastructure exists
 */
function ensureErrorInfrastructure() {
  [path.dirname(ERROR_LOG), path.dirname(ERROR_DB)].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  if (!fs.existsSync(ERROR_DB)) {
    fs.writeFileSync(ERROR_DB, JSON.stringify({ errors: [] }, null, 2));
  }
}

/**
 * Get current timestamp
 */
function getCurrentTimestamp() {
  return new Date().toISOString();
}

/**
 * Generate error fingerprint for deduplication
 */
function generateErrorFingerprint(error, toolName) {
  const errorString = `${toolName}:${error.name}:${error.message}`;
  return crypto.createHash('md5').update(errorString).digest('hex').substring(0, 8);
}

/**
 * Classify error type
 */
function classifyError(error, args) {
  // File operation errors
  if (error.code === 'ENOENT') {
    return {
      category: 'file_not_found',
      severity: 'medium',
      suggestion: `File not found: ${args.file_path || 'unknown'}. Check path and try again.`
    };
  }

  if (error.code === 'EACCES' || error.code === 'EPERM') {
    return {
      category: 'permission_denied',
      severity: 'high',
      suggestion: 'Permission denied. Check file permissions or run with appropriate access.'
    };
  }

  // Network errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    return {
      category: 'network_error',
      severity: 'high',
      suggestion: 'Network connection failed. Check internet connectivity and API endpoints.'
    };
  }

  if (error.message?.includes('rate limit') || error.message?.includes('429')) {
    return {
      category: 'rate_limit',
      severity: 'medium',
      suggestion: 'Rate limit exceeded. Wait before retrying or implement exponential backoff.'
    };
  }

  // API errors
  if (error.status === 401 || error.message?.includes('unauthorized')) {
    return {
      category: 'authentication_error',
      severity: 'high',
      suggestion: 'Authentication failed. Check API keys and credentials.'
    };
  }

  if (error.status === 404) {
    return {
      category: 'resource_not_found',
      severity: 'medium',
      suggestion: 'API resource not found. Verify endpoint URL and resource ID.'
    };
  }

  // Validation errors
  if (error.name === 'ValidationError' || error.message?.includes('validation')) {
    return {
      category: 'validation_error',
      severity: 'medium',
      suggestion: 'Data validation failed. Check input format and required fields.'
    };
  }

  // Parse errors
  if (error.name === 'SyntaxError' || error.message?.includes('JSON.parse')) {
    return {
      category: 'parse_error',
      severity: 'medium',
      suggestion: 'Failed to parse data. Check data format and encoding.'
    };
  }

  // Memory errors
  if (error.message?.includes('heap') || error.message?.includes('memory')) {
    return {
      category: 'memory_error',
      severity: 'critical',
      suggestion: 'Out of memory. Reduce data size or optimize memory usage.'
    };
  }

  // Default classification
  return {
    category: 'unknown_error',
    severity: 'medium',
    suggestion: 'An unexpected error occurred. Review error details and try again.'
  };
}

/**
 * Load error database
 */
function loadErrorDB() {
  try {
    ensureErrorInfrastructure();
    return JSON.parse(fs.readFileSync(ERROR_DB, 'utf8'));
  } catch (error) {
    return { errors: [] };
  }
}

/**
 * Save error database
 */
function saveErrorDB(db) {
  try {
    // Keep only last MAX_ERRORS_STORED errors
    if (db.errors.length > MAX_ERRORS_STORED) {
      db.errors = db.errors.slice(-MAX_ERRORS_STORED);
    }

    fs.writeFileSync(ERROR_DB, JSON.stringify(db, null, 2));
  } catch (error) {
    console.error(`Error saving error database: ${error.message}`);
  }
}

/**
 * Report error
 */
async function reportError(toolName, args, result) {
  try {
    // Only process if result indicates an error
    if (result !== null && !result?.error) {
      return; // Not an error
    }

    const error = result?.error || result || { message: 'Unknown error' };
    const timestamp = getCurrentTimestamp();
    const fingerprint = generateErrorFingerprint(error, toolName);
    const classification = classifyError(error, args);

    const errorReport = {
      id: crypto.randomUUID(),
      fingerprint,
      timestamp,
      tool: toolName,
      args: sanitizeArgs(args),
      error: {
        name: error.name || 'Error',
        message: error.message || String(error),
        stack: error.stack || null,
        code: error.code || null,
        status: error.status || null
      },
      classification,
      system: {
        node: process.version,
        platform: process.platform,
        memory: process.memoryUsage()
      }
    };

    // Load error database and check for duplicates
    const db = loadErrorDB();

    const recentDuplicate = db.errors.find(e =>
      e.fingerprint === fingerprint &&
      Date.now() - new Date(e.timestamp).getTime() < 60000 // Within 1 minute
    );

    if (recentDuplicate) {
      // Update occurrence count
      recentDuplicate.occurrences = (recentDuplicate.occurrences || 1) + 1;
      recentDuplicate.lastOccurrence = timestamp;
      saveErrorDB(db);

      console.error(`🔴 ERROR (duplicate #${recentDuplicate.occurrences}): ${classification.category}`);
      return;
    }

    // Add new error
    errorReport.occurrences = 1;
    db.errors.push(errorReport);
    saveErrorDB(db);

    // Log to file
    const logEntry = `\n[${timestamp}] ${classification.severity.toUpperCase()}: ${classification.category}\n` +
      `Tool: ${toolName}\n` +
      `Error: ${error.message}\n` +
      `Suggestion: ${classification.suggestion}\n` +
      `Fingerprint: ${fingerprint}\n` +
      `---\n`;

    ensureErrorInfrastructure();
    fs.appendFileSync(ERROR_LOG, logEntry);

    // Console output
    const emoji = classification.severity === 'critical' ? '🔴' : classification.severity === 'high' ? '🟠' : '🟡';
    console.error(`\n${emoji} ERROR DETECTED: ${classification.category}`);
    console.error(`   Tool: ${toolName}`);
    console.error(`   Message: ${error.message}`);
    console.error(`   Severity: ${classification.severity}`);
    console.error(`   Suggestion: ${classification.suggestion}`);
    console.error(`   Fingerprint: ${fingerprint}\n`);

  } catch (error) {
    console.error(`Error reporting failed: ${error.message}`);
  }
}

/**
 * Sanitize arguments (remove sensitive data)
 */
function sanitizeArgs(args) {
  const sanitized = { ...args };

  const sensitiveFields = ['api_key', 'apiKey', 'token', 'password', 'secret', 'authorization'];

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * Get error statistics
 */
function getErrorStats(hours = 24) {
  try {
    const db = loadErrorDB();
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);

    const recentErrors = db.errors.filter(e => {
      const timestamp = new Date(e.timestamp).getTime();
      return timestamp > cutoff;
    });

    const stats = {
      total: recentErrors.length,
      bySeverity: {},
      byCategory: {},
      byTool: {},
      mostCommon: null
    };

    // Group by severity
    recentErrors.forEach(e => {
      const severity = e.classification.severity;
      stats.bySeverity[severity] = (stats.bySeverity[severity] || 0) + (e.occurrences || 1);
    });

    // Group by category
    recentErrors.forEach(e => {
      const category = e.classification.category;
      stats.byCategory[category] = (stats.byCategory[category] || 0) + (e.occurrences || 1);
    });

    // Group by tool
    recentErrors.forEach(e => {
      stats.byTool[e.tool] = (stats.byTool[e.tool] || 0) + (e.occurrences || 1);
    });

    // Find most common error
    const sortedByCategory = Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1]);
    if (sortedByCategory.length > 0) {
      stats.mostCommon = {
        category: sortedByCategory[0][0],
        count: sortedByCategory[0][1]
      };
    }

    return stats;
  } catch (error) {
    return { error: error.message };
  }
}

// Handle CLI invocation
if (require.main === module) {
  const args = JSON.parse(process.argv[2] || '{}');
  const toolName = process.argv[3] || '';
  const result = JSON.parse(process.argv[4] || 'null');

  // Check for stats request
  if (args.stats) {
    const stats = getErrorStats(args.hours || 24);
    console.log(JSON.stringify(stats, null, 2));
    process.exit(0);
  }

  reportError(toolName, args, result)
    .then(() => process.exit(0))
    .catch(error => {
      console.error(`Error reporting failed: ${error.message}`);
      process.exit(0); // Don't fail on error reporting errors
    });
}

module.exports = { reportError, getErrorStats };
