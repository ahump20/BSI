/**
 * VALIDATION ERROR HANDLING
 * Custom error classes and utilities for validation failures
 */

import { ZodError } from 'zod';

/**
 * Custom validation error class
 * Extends Error with structured validation details
 */
export class ValidationError extends Error {
    constructor(message, details = []) {
        super(message);
        this.name = 'ValidationError';
        this.details = details;
        this.statusCode = 400;
        Error.captureStackTrace(this, this.constructor);
    }

    toJSON() {
        return {
            error: this.name,
            message: this.message,
            details: this.details,
            statusCode: this.statusCode
        };
    }
}

/**
 * Environment validation error - thrown on startup
 */
export class EnvironmentValidationError extends ValidationError {
    constructor(message, details = []) {
        super(message, details);
        this.name = 'EnvironmentValidationError';
        this.statusCode = 500;
    }
}

/**
 * Formats Zod validation errors into user-friendly structure
 * @param {ZodError} zodError - The Zod validation error
 * @param {string} [source='request'] - Source of the validation (body, query, params, headers)
 * @returns {Object} Formatted error with message and details
 */
export function formatZodError(zodError, source = 'request') {
    const details = zodError.errors.map(err => {
        const field = err.path.join('.');
        const message = err.message;
        const code = err.code;

        return {
            field: field || source,
            message,
            code,
            received: err.received,
            expected: err.expected
        };
    });

    // Create a concise summary message
    const fieldCount = new Set(details.map(d => d.field)).size;
    const summary = fieldCount === 1
        ? `Invalid ${source}: ${details[0].field} - ${details[0].message}`
        : `Invalid ${source}: ${fieldCount} validation errors found`;

    return {
        message: summary,
        details
    };
}

/**
 * Formats environment validation errors for startup
 * @param {ZodError} zodError - The Zod validation error
 * @returns {string} Formatted error message
 */
export function formatEnvError(zodError) {
    const errors = zodError.errors.map(err => {
        const varName = err.path.join('.');
        return `  - ${varName}: ${err.message}`;
    });

    return `Environment validation failed:\n${errors.join('\n')}`;
}

/**
 * Creates a validation error from field-level errors
 * @param {Array} fieldErrors - Array of {field, message} objects
 * @returns {ValidationError}
 */
export function createValidationError(fieldErrors) {
    const details = fieldErrors.map(err => ({
        field: err.field,
        message: err.message,
        code: 'custom'
    }));

    const summary = details.length === 1
        ? `Invalid ${details[0].field}: ${details[0].message}`
        : `Validation failed: ${details.length} errors found`;

    return new ValidationError(summary, details);
}

/**
 * Checks if an error is a validation error
 * @param {Error} error - The error to check
 * @returns {boolean}
 */
export function isValidationError(error) {
    return error instanceof ValidationError ||
           error instanceof ZodError ||
           error.name === 'ValidationError' ||
           error.name === 'ZodError';
}

/**
 * Safe error response helper
 * Ensures validation errors are properly formatted in responses
 */
export function sendValidationError(res, error) {
    if (error instanceof ValidationError) {
        return res.status(error.statusCode).json({
            success: false,
            error: error.name,
            message: error.message,
            details: error.details
        });
    }

    if (error instanceof ZodError) {
        const formatted = formatZodError(error);
        return res.status(400).json({
            success: false,
            error: 'ValidationError',
            message: formatted.message,
            details: formatted.details
        });
    }

    // Fallback for unknown errors
    return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: error.message || 'Validation failed'
    });
}

export default {
    ValidationError,
    EnvironmentValidationError,
    formatZodError,
    formatEnvError,
    createValidationError,
    isValidationError,
    sendValidationError
};
