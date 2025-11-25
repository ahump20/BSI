/**
 * Comprehensive Input Validation System
 *
 * Provides validation for all API endpoints using Zod schemas
 *
 * Features:
 * - Type-safe validation
 * - Automatic sanitization
 * - Custom error messages
 * - Request body, query params, and headers validation
 * - File upload validation
 * - SQL injection prevention
 * - XSS prevention
 */

import { z } from 'zod';

// ==================== COMMON VALIDATION SCHEMAS ====================

// ID validation
export const idSchema = z.number().int().positive().or(z.string().regex(/^\d+$/));

// UUID validation
export const uuidSchema = z.string().uuid();

// Email validation
export const emailSchema = z.string().email().max(255);

// Phone validation (international format)
export const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/);

// URL validation
export const urlSchema = z.string().url().max(2048);

// Date validation
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

// Pagination
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().nonnegative().optional(),
});

// Sorting
export const sortSchema = z.object({
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// ==================== SPORTS DATA SCHEMAS ====================

// Team ID
export const teamIdSchema = z.object({
  teamId: z.number().int().positive(),
});

// Game ID
export const gameIdSchema = z.object({
  gameId: z.number().int().positive(),
});

// Player ID
export const playerIdSchema = z.object({
  playerId: z.number().int().positive(),
});

// Season validation
export const seasonSchema = z.object({
  season: z
    .number()
    .int()
    .min(2000)
    .max(new Date().getFullYear() + 1),
});

// Sport type
export const sportSchema = z.enum(['baseball', 'football', 'basketball', 'hockey']);

// ==================== API ENDPOINT SCHEMAS ====================

// MLB Team endpoint
export const mlbTeamQuerySchema = z.object({
  teamId: z.number().int().positive(),
  season: z.number().int().min(1900).max(2100).optional(),
  includeStats: z.boolean().default(false),
});

// NFL Game endpoint
export const nflGameQuerySchema = z.object({
  gameId: z.string().regex(/^\d{10}$/), // NFL game IDs are 10 digits
  includePlayByPlay: z.boolean().default(false),
  includeBoxScore: z.boolean().default(true),
});

// Live game monitoring
export const liveGameRequestSchema = z.object({
  sport: sportSchema,
  gamePk: z.number().int().positive(),
  pollingInterval: z.number().int().min(1000).max(60000).default(5000),
});

// Player statistics query
export const playerStatsQuerySchema = z.object({
  playerId: z.number().int().positive(),
  season: z
    .number()
    .int()
    .min(2000)
    .max(new Date().getFullYear() + 1),
  statType: z.enum(['batting', 'pitching', 'fielding', 'rushing', 'passing', 'receiving']),
  gameType: z.enum(['R', 'P', 'S', 'A']).optional(), // Regular, Playoffs, Spring, All-Star
});

// Conference standings
export const conferenceStandingsSchema = z.object({
  conferenceId: z.number().int().positive(),
  season: z
    .number()
    .int()
    .min(2000)
    .max(new Date().getFullYear() + 1),
  division: z.string().max(50).optional(),
});

// ==================== USER INPUT SCHEMAS ====================

// User registration
export const userRegistrationSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: phoneSchema.optional(),
});

// User login
export const userLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
  rememberMe: z.boolean().default(false),
});

// API key creation
export const apiKeyCreateSchema = z.object({
  name: z.string().min(1).max(100),
  permissions: z.array(z.string()).max(50),
  expiresAt: z.string().datetime().optional(),
  rateLimitPerMinute: z.number().int().positive().max(1000).default(100),
});

// ==================== FILE UPLOAD VALIDATION ====================

export const fileUploadSchema = z.object({
  fileName: z.string().max(255),
  fileSize: z
    .number()
    .int()
    .positive()
    .max(100 * 1024 * 1024), // 100MB max
  mimeType: z.enum([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'application/pdf',
    'text/csv',
  ]),
});

// ==================== WEBHOOK VALIDATION ====================

export const webhookPayloadSchema = z.object({
  event: z.string().max(100),
  timestamp: z.string().datetime(),
  data: z.record(z.any()),
  signature: z.string().max(255),
});

// ==================== VALIDATION UTILITIES ====================

/**
 * Sanitize string input (prevent XSS)
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate and sanitize SQL input (prevent SQL injection)
 */
export function sanitizeSqlInput(input: string): string {
  // Remove common SQL injection patterns
  return input
    .replace(/['";\\]/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '')
    .trim();
}

/**
 * Validate request body against schema
 */
export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ valid: boolean; data?: T; errors?: z.ZodError }> {
  try {
    const body = await request.json();
    const data = schema.parse(body);

    return {
      valid: true,
      data,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error,
      };
    }

    return {
      valid: false,
      errors: new z.ZodError([
        {
          code: 'custom',
          message: 'Invalid request body',
          path: [],
        },
      ]),
    };
  }
}

/**
 * Validate query parameters against schema
 */
export function validateQueryParams<T>(
  url: URL,
  schema: z.ZodSchema<T>
): { valid: boolean; data?: T; errors?: z.ZodError } {
  try {
    const params: Record<string, any> = {};

    url.searchParams.forEach((value, key) => {
      // Try to parse numbers and booleans
      if (value === 'true') {
        params[key] = true;
      } else if (value === 'false') {
        params[key] = false;
      } else if (!isNaN(Number(value))) {
        params[key] = Number(value);
      } else {
        params[key] = value;
      }
    });

    const data = schema.parse(params);

    return {
      valid: true,
      data,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error,
      };
    }

    return {
      valid: false,
      errors: new z.ZodError([
        {
          code: 'custom',
          message: 'Invalid query parameters',
          path: [],
        },
      ]),
    };
  }
}

/**
 * Create validation error response
 */
export function createValidationErrorResponse(errors: z.ZodError): Response {
  const formattedErrors = errors.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));

  return new Response(
    JSON.stringify({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: formattedErrors,
    }),
    {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * Middleware to validate request
 */
export function withValidation<T>(
  schema: z.ZodSchema<T>,
  handler: (request: Request, env: any, ctx: any, data: T) => Promise<Response>
) {
  return async (request: Request, env: any, ctx: any): Promise<Response> => {
    // Validate based on request method
    let validation: { valid: boolean; data?: T; errors?: z.ZodError };

    if (request.method === 'GET' || request.method === 'DELETE') {
      const url = new URL(request.url);
      validation = validateQueryParams(url, schema);
    } else {
      validation = await validateRequestBody(request, schema);
    }

    if (!validation.valid || !validation.data) {
      return createValidationErrorResponse(validation.errors || new z.ZodError([]));
    }

    return handler(request, env, ctx, validation.data);
  };
}

/**
 * Validate file upload
 */
export function validateFileUpload(
  file: File,
  maxSize: number = 10 * 1024 * 1024 // 10MB default
): { valid: boolean; error?: string } {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'application/pdf',
    'text/csv',
  ];

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`,
    };
  }

  if (!allowedMimeTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`,
    };
  }

  // Validate file extension matches MIME type
  const extension = file.name.split('.').pop()?.toLowerCase();
  const mimeToExt: Record<string, string[]> = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/gif': ['gif'],
    'image/webp': ['webp'],
    'video/mp4': ['mp4'],
    'video/webm': ['webm'],
    'application/pdf': ['pdf'],
    'text/csv': ['csv'],
  };

  const expectedExtensions = mimeToExt[file.type] || [];
  if (extension && !expectedExtensions.includes(extension)) {
    return {
      valid: false,
      error: 'File extension does not match file type',
    };
  }

  return { valid: true };
}
