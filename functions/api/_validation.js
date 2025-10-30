/**
 * CLOUDFLARE PAGES FUNCTIONS VALIDATION UTILITY
 * Zod validation helpers for Cloudflare Workers/Pages Functions
 *
 * Usage:
 * import { validateRequest } from './_validation.js';
 *
 * export async function onRequestGet({ request }) {
 *   const validation = await validateRequest(request, {
 *     query: myQuerySchema,
 *     params: myParamsSchema
 *   });
 *
 *   if (!validation.success) {
 *     return validation.errorResponse;
 *   }
 *
 *   const { query, params } = validation.data;
 *   // ... use validated data
 * }
 */

import { ZodError } from 'zod';

/**
 * Validates a Cloudflare Pages Functions request
 * @param {Request} request - The incoming request
 * @param {Object} schemas - Zod schemas for validation
 * @param {import('zod').ZodSchema} [schemas.query] - Query parameters schema
 * @param {import('zod').ZodSchema} [schemas.params] - Path parameters schema
 * @param {import('zod').ZodSchema} [schemas.body] - Request body schema
 * @returns {Promise<{success: boolean, data?: any, errorResponse?: Response}>}
 */
export async function validateRequest(request, schemas = {}) {
  try {
    const url = new URL(request.url);
    const validatedData = {};

    // Validate query parameters
    if (schemas.query) {
      const queryParams = Object.fromEntries(url.searchParams.entries());
      validatedData.query = await schemas.query.parseAsync(queryParams);
    }

    // Validate path parameters (if provided separately)
    if (schemas.params) {
      validatedData.params = await schemas.params.parseAsync(schemas.params);
    }

    // Validate request body (for POST/PUT/PATCH)
    if (schemas.body && request.method !== 'GET' && request.method !== 'HEAD') {
      try {
        const body = await request.json();
        validatedData.body = await schemas.body.parseAsync(body);
      } catch (error) {
        if (error instanceof SyntaxError) {
          return {
            success: false,
            errorResponse: createValidationErrorResponse({
              message: 'Invalid JSON in request body',
              details: [{ field: 'body', message: 'Request body must be valid JSON' }]
            })
          };
        }
        throw error;
      }
    }

    return {
      success: true,
      data: validatedData
    };
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedError = formatZodError(error);
      return {
        success: false,
        errorResponse: createValidationErrorResponse(formattedError)
      };
    }

    // Unexpected error
    return {
      success: false,
      errorResponse: new Response(
        JSON.stringify({
          success: false,
          error: 'Validation Error',
          message: 'An unexpected validation error occurred',
          details: error.message
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    };
  }
}

/**
 * Formats Zod validation errors into a user-friendly structure
 * @param {ZodError} zodError - The Zod validation error
 * @returns {Object} Formatted error object
 */
function formatZodError(zodError) {
  const details = zodError.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
    ...(err.expected && { expected: err.expected }),
    ...(err.received && { received: err.received })
  }));

  return {
    message: 'Request validation failed',
    details
  };
}

/**
 * Creates a standardized validation error response
 * @param {Object} error - The formatted error object
 * @param {number} status - HTTP status code (default: 400)
 * @returns {Response} Cloudflare Response object
 */
function createValidationErrorResponse(error, status = 400) {
  return new Response(
    JSON.stringify({
      success: false,
      error: 'Validation Error',
      message: error.message,
      details: error.details
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    }
  );
}

/**
 * Simple validation wrapper for quick inline validation
 * @param {any} data - Data to validate
 * @param {import('zod').ZodSchema} schema - Zod schema
 * @returns {{success: boolean, data?: any, error?: Object}}
 */
export function validate(data, schema) {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, error: formatZodError(error) };
    }
    return {
      success: false,
      error: {
        message: 'Validation failed',
        details: [{ field: 'unknown', message: error.message }]
      }
    };
  }
}

export default validateRequest;
