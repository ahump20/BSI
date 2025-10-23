/**
 * BASEBALL API VALIDATION SCHEMAS
 * Validation schemas for baseball-specific Next.js API routes
 */

import { z } from 'zod';

/**
 * Baseball leagues enum
 */
const baseballLeagueSchema = z.enum(['mlb', 'ncaab', 'milb'], {
  errorMap: () => ({ message: 'League must be one of: mlb, ncaab, milb' })
});

/**
 * Date string schema (YYYY-MM-DD format)
 */
const dateStringSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}$/,
  'Date must be in YYYY-MM-DD format'
).refine(
  (date) => {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  },
  'Invalid date value'
).optional();

/**
 * Conference schema (for college baseball)
 */
const conferenceSchema = z.string()
  .min(1)
  .max(100)
  .regex(/^[a-zA-Z0-9\s-]+$/, 'Conference must contain only alphanumeric characters, spaces, and hyphens')
  .optional();

/**
 * GET /api/v1/baseball/games
 * Query parameters for baseball games endpoint
 */
export const baseballGamesQuerySchema = z.object({
  league: baseballLeagueSchema.default('ncaab'),
  date: dateStringSchema,
  conference: conferenceSchema
});

/**
 * Type export for TypeScript
 */
export type BaseballGamesQuery = z.infer<typeof baseballGamesQuerySchema>;

/**
 * Validation schema for baseball game response
 */
export const baseballGameSchema = z.object({
  id: z.string(),
  homeTeam: z.object({
    id: z.string(),
    name: z.string(),
    abbreviation: z.string().optional(),
    score: z.number().int().min(0).optional()
  }),
  awayTeam: z.object({
    id: z.string(),
    name: z.string(),
    abbreviation: z.string().optional(),
    score: z.number().int().min(0).optional()
  }),
  status: z.enum(['scheduled', 'inProgress', 'final', 'postponed', 'cancelled']),
  startTime: z.string().datetime(),
  venue: z.string().optional(),
  conference: z.string().optional()
});

/**
 * Validation schema for baseball games response
 */
export const baseballGamesResponseSchema = z.object({
  games: z.array(baseballGameSchema),
  fetchedAt: z.string().datetime(),
  ttlSeconds: z.number().int().min(15).max(60),
  source: z.string()
});

export default {
  baseballGamesQuerySchema,
  baseballGameSchema,
  baseballGamesResponseSchema,
  baseballLeagueSchema
};
