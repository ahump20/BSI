/**
 * NEXT.JS VALIDATION HELPERS
 * Validation utilities for Next.js API routes (App Router)
 * Compatible with Edge Runtime
 */

import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema, ZodError } from 'zod';

/**
 * Validation result type
 */
type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: NextResponse };

/**
 * Validates Next.js request query parameters
 * @param request - Next.js request object
 * @param schema - Zod schema for validation
 * @returns Validation result with typed data or error response
 */
export function validateQuery<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): ValidationResult<T> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryObject: Record<string, string | string[]> = {};

    // Convert URLSearchParams to object
    searchParams.forEach((value, key) => {
      const existing = queryObject[key];
      if (existing) {
        // Handle multiple values for same key
        if (Array.isArray(existing)) {
          existing.push(value);
        } else {
          queryObject[key] = [existing, value];
        }
      } else {
        queryObject[key] = value;
      }
    });

    const validated = schema.parse(queryObject);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedErrors = (error as any).errors.map((err: any) => ({
        field: err.path.join('.') || 'query',
        message: err.message,
        code: err.code
      }));

      return {
        success: false,
        error: NextResponse.json(
          {
            error: 'Validation Error',
            message: 'Invalid query parameters',
            details: formattedErrors
          },
          { status: 400 }
        )
      };
    }

    return {
      success: false,
      error: NextResponse.json(
        {
          error: 'Validation Error',
          message: 'An unexpected validation error occurred'
        },
        { status: 400 }
      )
    };
  }
}

/**
 * Validates Next.js request body
 * @param request - Next.js request object
 * @param schema - Zod schema for validation
 * @returns Validation result with typed data or error response
 */
export async function validateBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<ValidationResult<T>> {
  try {
    const body = await request.json();
    const validated = schema.parse(body);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedErrors = (error as any).errors.map((err: any) => ({
        field: err.path.join('.') || 'body',
        message: err.message,
        code: err.code
      }));

      return {
        success: false,
        error: NextResponse.json(
          {
            error: 'Validation Error',
            message: 'Invalid request body',
            details: formattedErrors
          },
          { status: 400 }
        )
      };
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return {
        success: false,
        error: NextResponse.json(
          {
            error: 'Validation Error',
            message: 'Invalid JSON in request body'
          },
          { status: 400 }
        )
      };
    }

    return {
      success: false,
      error: NextResponse.json(
        {
          error: 'Validation Error',
          message: 'An unexpected validation error occurred'
        },
        { status: 400 }
      )
    };
  }
}

/**
 * Validates path parameters from Next.js dynamic routes
 * @param params - Path parameters object
 * @param schema - Zod schema for validation
 * @returns Validation result with typed data or error response
 */
export function validateParams<T>(
  params: Record<string, string | string[]>,
  schema: ZodSchema<T>
): ValidationResult<T> {
  try {
    const validated = schema.parse(params);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedErrors = (error as any).errors.map((err: any) => ({
        field: err.path.join('.') || 'params',
        message: err.message,
        code: err.code
      }));

      return {
        success: false,
        error: NextResponse.json(
          {
            error: 'Validation Error',
            message: 'Invalid path parameters',
            details: formattedErrors
          },
          { status: 400 }
        )
      };
    }

    return {
      success: false,
      error: NextResponse.json(
        {
          error: 'Validation Error',
          message: 'An unexpected validation error occurred'
        },
        { status: 400 }
      )
    };
  }
}

/**
 * Validates complete request (query + body + params)
 * @param request - Next.js request object
 * @param params - Path parameters
 * @param schemas - Validation schemas
 * @returns Validation result with typed data or error response
 */
export async function validateRequest<
  TQuery = unknown,
  TBody = unknown,
  TParams = unknown
>(
  request: NextRequest,
  params: Record<string, string | string[]> | undefined,
  schemas: {
    query?: ZodSchema<TQuery>;
    body?: ZodSchema<TBody>;
    params?: ZodSchema<TParams>;
  }
): Promise<
  | { success: true; data: { query?: TQuery; body?: TBody; params?: TParams } }
  | { success: false; error: NextResponse }
> {
  const validated: { query?: TQuery; body?: TBody; params?: TParams } = {};

  // Validate query parameters
  if (schemas.query) {
    const queryResult = validateQuery(request, schemas.query);
    if (!queryResult.success) {
      return queryResult;
    }
    validated.query = queryResult.data;
  }

  // Validate request body
  if (schemas.body) {
    const bodyResult = await validateBody(request, schemas.body);
    if (!bodyResult.success) {
      return bodyResult;
    }
    validated.body = bodyResult.data;
  }

  // Validate path parameters
  if (schemas.params && params) {
    const paramsResult = validateParams(params, schemas.params);
    if (!paramsResult.success) {
      return paramsResult;
    }
    validated.params = paramsResult.data;
  }

  return { success: true, data: validated };
}

/**
 * Type guard to check if validation was successful
 */
export function isValidationSuccess<T>(
  result: ValidationResult<T>
): result is { success: true; data: T } {
  return result.success === true;
}

/**
 * Helper to create standardized error responses
 */
export function createValidationError(
  message: string,
  details?: Array<{ field: string; message: string }>
): NextResponse {
  return NextResponse.json(
    {
      error: 'Validation Error',
      message,
      details
    },
    { status: 400 }
  );
}

export default {
  validateQuery,
  validateBody,
  validateParams,
  validateRequest,
  isValidationSuccess,
  createValidationError
};
