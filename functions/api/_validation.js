/**
 * CLOUDFLARE FUNCTIONS VALIDATION MIDDLEWARE
 * Validation utilities for Cloudflare Pages Functions (Edge Runtime)
 */

import { z, ZodSchema, ZodError } from 'zod';

/**
 * Validates query parameters from Cloudflare Functions request
 * @param {Request} request - Cloudflare Functions request
 * @param {ZodSchema} schema - Zod validation schema
 * @returns {Object} Validation result with data or error
 */
export function validateQueryParams(request, schema) {
    try {
        const url = new URL(request.url);
        const queryObject = {};

        // Convert URLSearchParams to object
        for (const [key, value] of url.searchParams.entries()) {
            if (queryObject[key]) {
                // Handle multiple values
                if (Array.isArray(queryObject[key])) {
                    queryObject[key].push(value);
                } else {
                    queryObject[key] = [queryObject[key], value];
                }
            } else {
                queryObject[key] = value;
            }
        }

        const validated = schema.parse(queryObject);
        return { success: true, data: validated };
    } catch (error) {
        if (error instanceof ZodError) {
            const formattedErrors = error.errors.map(err => ({
                field: err.path.join('.') || 'query',
                message: err.message,
                code: err.code
            }));

            return {
                success: false,
                error: {
                    status: 400,
                    body: {
                        error: 'Validation Error',
                        message: 'Invalid query parameters',
                        details: formattedErrors
                    }
                }
            };
        }

        return {
            success: false,
            error: {
                status: 400,
                body: {
                    error: 'Validation Error',
                    message: 'An unexpected validation error occurred'
                }
            }
        };
    }
}

/**
 * Validates request body from Cloudflare Functions request
 * @param {Request} request - Cloudflare Functions request
 * @param {ZodSchema} schema - Zod validation schema
 * @returns {Promise<Object>} Validation result with data or error
 */
export async function validateBody(request, schema) {
    try {
        const body = await request.json();
        const validated = schema.parse(body);
        return { success: true, data: validated };
    } catch (error) {
        if (error instanceof ZodError) {
            const formattedErrors = error.errors.map(err => ({
                field: err.path.join('.') || 'body',
                message: err.message,
                code: err.code
            }));

            return {
                success: false,
                error: {
                    status: 400,
                    body: {
                        error: 'Validation Error',
                        message: 'Invalid request body',
                        details: formattedErrors
                    }
                }
            };
        }

        // Handle JSON parsing errors
        if (error instanceof SyntaxError) {
            return {
                success: false,
                error: {
                    status: 400,
                    body: {
                        error: 'Validation Error',
                        message: 'Invalid JSON in request body'
                    }
                }
            };
        }

        return {
            success: false,
            error: {
                status: 400,
                body: {
                    error: 'Validation Error',
                    message: 'An unexpected validation error occurred'
                }
            }
        };
    }
}

/**
 * Validates path parameters from Cloudflare Functions context
 * @param {Object} params - Path parameters from context.params
 * @param {ZodSchema} schema - Zod validation schema
 * @returns {Object} Validation result with data or error
 */
export function validateParams(params, schema) {
    try {
        const validated = schema.parse(params);
        return { success: true, data: validated };
    } catch (error) {
        if (error instanceof ZodError) {
            const formattedErrors = error.errors.map(err => ({
                field: err.path.join('.') || 'params',
                message: err.message,
                code: err.code
            }));

            return {
                success: false,
                error: {
                    status: 400,
                    body: {
                        error: 'Validation Error',
                        message: 'Invalid path parameters',
                        details: formattedErrors
                    }
                }
            };
        }

        return {
            success: false,
            error: {
                status: 400,
                body: {
                    error: 'Validation Error',
                    message: 'An unexpected validation error occurred'
                }
            }
        };
    }
}

/**
 * Creates a standardized error response
 * @param {Object} error - Error object with status and body
 * @returns {Response} Cloudflare Response object
 */
export function createErrorResponse(error) {
    return new Response(JSON.stringify(error.body), {
        status: error.status,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store'
        }
    });
}

/**
 * Creates a standardized success response
 * @param {any} data - Response data
 * @param {Object} options - Additional response options
 * @returns {Response} Cloudflare Response object
 */
export function createSuccessResponse(data, options = {}) {
    const {
        status = 200,
        headers = {},
        cache = 'no-store'
    } = options;

    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': cache,
            ...headers
        }
    });
}

/**
 * Wrapper for Cloudflare Functions handlers with validation
 * @param {Function} handler - The actual handler function
 * @param {Object} schemas - Validation schemas
 * @returns {Function} Wrapped handler with validation
 */
export function withValidation(handler, schemas = {}) {
    return async (context) => {
        const { request, env, params: contextParams } = context;
        const validated = {};

        try {
            // Validate query parameters
            if (schemas.query) {
                const result = validateQueryParams(request, schemas.query);
                if (!result.success) {
                    return createErrorResponse(result.error);
                }
                validated.query = result.data;
            }

            // Validate request body (only for POST, PUT, PATCH)
            if (schemas.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
                const result = await validateBody(request, schemas.body);
                if (!result.success) {
                    return createErrorResponse(result.error);
                }
                validated.body = result.data;
            }

            // Validate path parameters
            if (schemas.params && contextParams) {
                const result = validateParams(contextParams, schemas.params);
                if (!result.success) {
                    return createErrorResponse(result.error);
                }
                validated.params = result.data;
            }

            // Call the actual handler with validated data
            return await handler({
                ...context,
                validated
            });

        } catch (error) {
            console.error('Validation middleware error:', error);
            return createErrorResponse({
                status: 500,
                body: {
                    error: 'Internal Server Error',
                    message: 'An unexpected error occurred during request processing'
                }
            });
        }
    };
}

/**
 * Rate limiting for Cloudflare Functions
 * @param {Object} env - Cloudflare environment bindings
 * @param {string} key - Rate limit key (e.g., IP address)
 * @param {Object} options - Rate limit options
 * @returns {Promise<boolean>} True if request is allowed, false if rate limited
 */
export async function checkRateLimit(env, key, options = {}) {
    const {
        maxRequests = 100,
        windowSeconds = 60,
        namespace = 'rate_limit'
    } = options;

    if (!env.RATE_LIMIT_KV) {
        console.warn('RATE_LIMIT_KV binding not found, skipping rate limiting');
        return true; // Allow if KV is not configured
    }

    const rateLimitKey = `${namespace}:${key}`;
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - windowSeconds;

    try {
        // Get current request count
        const data = await env.RATE_LIMIT_KV.get(rateLimitKey, 'json');

        if (!data) {
            // First request in window
            await env.RATE_LIMIT_KV.put(
                rateLimitKey,
                JSON.stringify({ count: 1, firstRequest: now }),
                { expirationTtl: windowSeconds }
            );
            return true;
        }

        // Check if we're still in the same window
        if (data.firstRequest > windowStart) {
            if (data.count >= maxRequests) {
                return false; // Rate limited
            }

            // Increment count
            await env.RATE_LIMIT_KV.put(
                rateLimitKey,
                JSON.stringify({ count: data.count + 1, firstRequest: data.firstRequest }),
                { expirationTtl: windowSeconds }
            );
            return true;
        }

        // New window
        await env.RATE_LIMIT_KV.put(
            rateLimitKey,
            JSON.stringify({ count: 1, firstRequest: now }),
            { expirationTtl: windowSeconds }
        );
        return true;

    } catch (error) {
        console.error('Rate limit check error:', error);
        return true; // Allow on error to prevent blocking legitimate traffic
    }
}

/**
 * Creates a rate-limited handler wrapper
 * @param {Function} handler - The handler function
 * @param {Object} rateLimitOptions - Rate limit configuration
 * @returns {Function} Wrapped handler with rate limiting
 */
export function withRateLimit(handler, rateLimitOptions = {}) {
    return async (context) => {
        const { request, env } = context;

        // Extract IP address for rate limiting
        const ip = request.headers.get('CF-Connecting-IP') ||
                   request.headers.get('X-Forwarded-For')?.split(',')[0] ||
                   'unknown';

        const allowed = await checkRateLimit(env, ip, rateLimitOptions);

        if (!allowed) {
            return new Response(JSON.stringify({
                error: 'Rate Limit Exceeded',
                message: `Too many requests. Maximum ${rateLimitOptions.maxRequests || 100} requests per ${rateLimitOptions.windowSeconds || 60} seconds.`,
                retryAfter: rateLimitOptions.windowSeconds || 60
            }), {
                status: 429,
                headers: {
                    'Content-Type': 'application/json',
                    'Retry-After': String(rateLimitOptions.windowSeconds || 60)
                }
            });
        }

        return await handler(context);
    };
}

export default {
    validateQueryParams,
    validateBody,
    validateParams,
    createErrorResponse,
    createSuccessResponse,
    withValidation,
    withRateLimit,
    checkRateLimit
};
