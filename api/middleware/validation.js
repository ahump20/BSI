/**
 * VALIDATION MIDDLEWARE
 * Production-grade request validation using Zod schemas
 *
 * Provides comprehensive validation for:
 * - Request body
 * - Query parameters
 * - Path parameters
 * - Headers
 */

import { ZodError } from 'zod';
import { ValidationError, formatZodError } from '../validation/errors.js';
import LoggerService from '../services/logger-service.js';

const logger = new LoggerService({
    service: 'validation-middleware',
    level: process.env.LOG_LEVEL || 'info'
});

/**
 * Creates validation middleware for Express routes
 * @param {Object} schemas - Zod schemas for validation
 * @param {import('zod').ZodSchema} [schemas.body] - Request body schema
 * @param {import('zod').ZodSchema} [schemas.query] - Query parameters schema
 * @param {import('zod').ZodSchema} [schemas.params] - Path parameters schema
 * @param {import('zod').ZodSchema} [schemas.headers] - Headers schema
 * @returns {Function} Express middleware function
 */
export function validate(schemas) {
    return async (req, res, next) => {
        try {
            const validatedData = {};

            // Validate request body
            if (schemas.body) {
                try {
                    validatedData.body = await schemas.body.parseAsync(req.body);
                    req.body = validatedData.body; // Replace with validated data
                } catch (error) {
                    if (error instanceof ZodError) {
                        const formattedError = formatZodError(error, 'body');
                        logger.warn('Request body validation failed', {
                            path: req.path,
                            method: req.method,
                            errors: formattedError.details
                        });
                        return res.status(400).json({
                            success: false,
                            error: 'Validation Error',
                            message: formattedError.message,
                            details: formattedError.details
                        });
                    }
                    throw error;
                }
            }

            // Validate query parameters
            if (schemas.query) {
                try {
                    validatedData.query = await schemas.query.parseAsync(req.query);
                    req.query = validatedData.query;
                } catch (error) {
                    if (error instanceof ZodError) {
                        const formattedError = formatZodError(error, 'query');
                        logger.warn('Query parameters validation failed', {
                            path: req.path,
                            method: req.method,
                            errors: formattedError.details
                        });
                        return res.status(400).json({
                            success: false,
                            error: 'Validation Error',
                            message: formattedError.message,
                            details: formattedError.details
                        });
                    }
                    throw error;
                }
            }

            // Validate path parameters
            if (schemas.params) {
                try {
                    validatedData.params = await schemas.params.parseAsync(req.params);
                    req.params = validatedData.params;
                } catch (error) {
                    if (error instanceof ZodError) {
                        const formattedError = formatZodError(error, 'params');
                        logger.warn('Path parameters validation failed', {
                            path: req.path,
                            method: req.method,
                            errors: formattedError.details
                        });
                        return res.status(400).json({
                            success: false,
                            error: 'Validation Error',
                            message: formattedError.message,
                            details: formattedError.details
                        });
                    }
                    throw error;
                }
            }

            // Validate headers
            if (schemas.headers) {
                try {
                    validatedData.headers = await schemas.headers.parseAsync(req.headers);
                    // Don't replace headers, just validate
                } catch (error) {
                    if (error instanceof ZodError) {
                        const formattedError = formatZodError(error, 'headers');
                        logger.warn('Headers validation failed', {
                            path: req.path,
                            method: req.method,
                            errors: formattedError.details
                        });
                        return res.status(400).json({
                            success: false,
                            error: 'Validation Error',
                            message: formattedError.message,
                            details: formattedError.details
                        });
                    }
                    throw error;
                }
            }

            // Log successful validation in debug mode
            logger.debug('Request validation successful', {
                path: req.path,
                method: req.method,
                validated: Object.keys(validatedData)
            });

            next();
        } catch (error) {
            logger.error('Unexpected error during validation', {
                error: error.message,
                stack: error.stack,
                path: req.path,
                method: req.method
            });
            res.status(500).json({
                success: false,
                error: 'Internal Server Error',
                message: 'An unexpected error occurred during validation'
            });
        }
    };
}

/**
 * Global error handler for validation errors
 * Should be used as the last middleware in Express app
 */
export function validationErrorHandler(err, req, res, next) {
    if (err instanceof ValidationError) {
        logger.warn('Validation error caught by error handler', {
            path: req.path,
            method: req.method,
            error: err.message
        });
        return res.status(400).json({
            success: false,
            error: 'Validation Error',
            message: err.message,
            details: err.details
        });
    }

    if (err instanceof ZodError) {
        const formattedError = formatZodError(err);
        logger.warn('Zod error caught by error handler', {
            path: req.path,
            method: req.method,
            errors: formattedError.details
        });
        return res.status(400).json({
            success: false,
            error: 'Validation Error',
            message: formattedError.message,
            details: formattedError.details
        });
    }

    // Pass to next error handler if not a validation error
    next(err);
}

/**
 * Creates a safe validation wrapper for async route handlers
 * Catches validation errors and properly formats responses
 */
export function validateAsync(schema) {
    return (handler) => {
        return async (req, res, next) => {
            try {
                if (schema) {
                    const validated = await schema.parseAsync({
                        body: req.body,
                        query: req.query,
                        params: req.params
                    });
                    req.validated = validated;
                }
                await handler(req, res, next);
            } catch (error) {
                if (error instanceof ZodError) {
                    const formattedError = formatZodError(error);
                    return res.status(400).json({
                        success: false,
                        error: 'Validation Error',
                        message: formattedError.message,
                        details: formattedError.details
                    });
                }
                next(error);
            }
        };
    };
}

export default validate;
