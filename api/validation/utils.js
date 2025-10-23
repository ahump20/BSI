/**
 * VALIDATION UTILITIES
 * Common validation helpers and custom validators
 */

import { z } from 'zod';

// ==================== COMMON SCHEMAS ====================

/**
 * Sport enum schema
 */
export const sportSchema = z.enum([
    'baseball',
    'football',
    'basketball',
    'hockey',
    'soccer',
    'mlb',
    'nfl',
    'nba',
    'nhl',
    'mls',
    'ncaab',
    'ncaaf',
    'ncaam',
    'ncaaw'
], {
    errorMap: () => ({ message: 'Invalid sport. Must be a valid sport code.' })
});

/**
 * League enum schema
 */
export const leagueSchema = z.enum([
    'mlb',
    'nfl',
    'nba',
    'nhl',
    'mls',
    'ncaab',
    'ncaaf',
    'ncaam',
    'ncaaw'
], {
    errorMap: () => ({ message: 'Invalid league code' })
});

/**
 * Date string schema (YYYY-MM-DD format)
 */
export const dateStringSchema = z.string().regex(
    /^\d{4}-\d{2}-\d{2}$/,
    'Date must be in YYYY-MM-DD format'
).refine(
    (date) => {
        const parsed = new Date(date);
        return !isNaN(parsed.getTime());
    },
    'Invalid date value'
);

/**
 * ISO 8601 datetime schema
 */
export const isoDateTimeSchema = z.string().datetime({
    message: 'Must be a valid ISO 8601 datetime'
});

/**
 * Team key/ID schema
 */
export const teamKeySchema = z.string().min(1).max(100).regex(
    /^[a-zA-Z0-9_-]+$/,
    'Team key must contain only alphanumeric characters, hyphens, and underscores'
);

/**
 * Season schema (year or year range)
 */
export const seasonSchema = z.string().regex(
    /^\d{4}(-\d{4})?$/,
    'Season must be a year (2024) or year range (2023-2024)'
);

/**
 * Pagination limit schema
 */
export const limitSchema = z.coerce.number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(20);

/**
 * Pagination offset schema
 */
export const offsetSchema = z.coerce.number()
    .int()
    .min(0, 'Offset must be non-negative')
    .default(0);

/**
 * Sort order schema
 */
export const sortOrderSchema = z.enum(['asc', 'desc', 'ASC', 'DESC'])
    .transform(val => val.toLowerCase())
    .default('asc');

/**
 * Boolean-like string schema
 */
export const booleanStringSchema = z.enum(['true', 'false', 'yes', 'no', '1', '0', 'on', 'off'])
    .transform(val => ['true', 'yes', '1', 'on'].includes(val.toLowerCase()));

/**
 * Positive integer schema
 */
export const positiveIntSchema = z.coerce.number().int().positive();

/**
 * Non-negative integer schema
 */
export const nonNegativeIntSchema = z.coerce.number().int().min(0);

/**
 * Probability schema (0-1)
 */
export const probabilitySchema = z.coerce.number().min(0).max(1);

/**
 * Percentage schema (0-100)
 */
export const percentageSchema = z.coerce.number().min(0).max(100);

/**
 * Comma-separated list schema
 */
export const commaSeparatedSchema = (itemSchema = z.string()) => {
    return z.string().transform((val, ctx) => {
        const items = val.split(',').map(s => s.trim()).filter(Boolean);
        const results = [];

        for (const item of items) {
            const result = itemSchema.safeParse(item);
            if (!result.success) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Invalid item in list: ${item}`,
                    path: []
                });
                return z.NEVER;
            }
            results.push(result.data);
        }

        return results;
    });
};

// ==================== CUSTOM VALIDATORS ====================

/**
 * Validates that a date is not in the future
 */
export function dateNotFuture() {
    return z.string().refine(
        (date) => {
            const parsed = new Date(date);
            return parsed <= new Date();
        },
        'Date cannot be in the future'
    );
}

/**
 * Validates that a date is within a range
 */
export function dateInRange(minDate, maxDate) {
    return z.string().refine(
        (date) => {
            const parsed = new Date(date);
            const min = new Date(minDate);
            const max = new Date(maxDate);
            return parsed >= min && parsed <= max;
        },
        `Date must be between ${minDate} and ${maxDate}`
    );
}

/**
 * Validates email address
 */
export const emailSchema = z.string().email('Invalid email address');

/**
 * Validates URL
 */
export const urlSchema = z.string().url('Invalid URL');

/**
 * Validates UUID
 */
export const uuidSchema = z.string().uuid('Invalid UUID');

/**
 * Validates hex color code
 */
export const hexColorSchema = z.string().regex(
    /^#[0-9A-Fa-f]{6}$/,
    'Must be a valid hex color code (e.g., #FF5733)'
);

/**
 * Validates phone number (basic)
 */
export const phoneSchema = z.string().regex(
    /^\+?[\d\s\-()]+$/,
    'Invalid phone number format'
);

/**
 * Validates US ZIP code
 */
export const zipCodeSchema = z.string().regex(
    /^\d{5}(-\d{4})?$/,
    'Invalid ZIP code format'
);

// ==================== VALIDATION HELPERS ====================

/**
 * Creates a required string schema with min/max length
 */
export function requiredString(min = 1, max = 255) {
    return z.string()
        .min(min, `Must be at least ${min} characters`)
        .max(max, `Must be at most ${max} characters`);
}

/**
 * Creates an optional string schema with min/max length
 */
export function optionalString(min = 0, max = 255) {
    if (min === 0) {
        return z.string().max(max, `Must be at most ${max} characters`).optional();
    }
    return z.string()
        .min(min, `Must be at least ${min} characters`)
        .max(max, `Must be at most ${max} characters`)
        .optional();
}

/**
 * Creates a required number schema with min/max
 */
export function requiredNumber(min = -Infinity, max = Infinity) {
    let schema = z.coerce.number();
    if (min !== -Infinity) {
        schema = schema.min(min, `Must be at least ${min}`);
    }
    if (max !== Infinity) {
        schema = schema.max(max, `Must be at most ${max}`);
    }
    return schema;
}

/**
 * Sanitizes string input (trim, remove extra spaces)
 */
export const sanitizedString = z.string()
    .transform(val => val.trim().replace(/\s+/g, ' '));

/**
 * Creates a schema that validates JSON string
 */
export function jsonStringSchema(schema) {
    return z.string().transform((val, ctx) => {
        try {
            const parsed = JSON.parse(val);
            if (schema) {
                const result = schema.safeParse(parsed);
                if (!result.success) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: 'Invalid JSON structure',
                        path: []
                    });
                    return z.NEVER;
                }
                return result.data;
            }
            return parsed;
        } catch (error) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Invalid JSON string',
                path: []
            });
            return z.NEVER;
        }
    });
}

/**
 * Validation result wrapper
 */
export function createValidationResult(isValid, errors = []) {
    return {
        isValid,
        errors,
        hasErrors: errors.length > 0
    };
}

/**
 * Validates multiple schemas and collects all errors
 */
export async function validateMultiple(validations) {
    const results = await Promise.allSettled(validations);
    const errors = results
        .filter(r => r.status === 'rejected')
        .map(r => r.reason);

    return {
        isValid: errors.length === 0,
        errors,
        hasErrors: errors.length > 0
    };
}

// ==================== TYPE GUARDS ====================

/**
 * Type guard for checking if value is a valid date
 */
export function isValidDate(date) {
    return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Type guard for checking if value is a non-empty string
 */
export function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Type guard for checking if value is a positive number
 */
export function isPositiveNumber(value) {
    return typeof value === 'number' && value > 0 && !isNaN(value);
}

export default {
    // Schemas
    sportSchema,
    leagueSchema,
    dateStringSchema,
    isoDateTimeSchema,
    teamKeySchema,
    seasonSchema,
    limitSchema,
    offsetSchema,
    sortOrderSchema,
    booleanStringSchema,
    positiveIntSchema,
    nonNegativeIntSchema,
    probabilitySchema,
    percentageSchema,
    emailSchema,
    urlSchema,
    uuidSchema,
    hexColorSchema,
    phoneSchema,
    zipCodeSchema,

    // Helpers
    requiredString,
    optionalString,
    requiredNumber,
    sanitizedString,
    jsonStringSchema,
    commaSeparatedSchema,
    dateNotFuture,
    dateInRange,
    createValidationResult,
    validateMultiple,

    // Type guards
    isValidDate,
    isNonEmptyString,
    isPositiveNumber
};
