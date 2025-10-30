/**
 * ZOD VALIDATION SCHEMAS FOR CLOUDFLARE PAGES FUNCTIONS
 * Validation schemas for high-traffic API endpoints
 */

import { z } from 'zod';

// ==================== COMMON REUSABLE SCHEMAS ====================

const sportEnum = z.enum(['all', 'mlb', 'nfl', 'nba', 'ncaa', 'ncaa-baseball', 'baseball', 'football', 'basketball']);

const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine(
    (dateStr) => {
      const date = new Date(dateStr);
      return date instanceof Date && !isNaN(date.getTime());
    },
    { message: 'Invalid date value' }
  );

const weekNumberSchema = z.coerce
  .number()
  .int('Week must be an integer')
  .min(0, 'Week must be at least 0')
  .max(20, 'Week must be at most 20');

const seasonYearSchema = z
  .string()
  .regex(/^\d{4}$/, 'Season must be a 4-digit year')
  .refine(
    (year) => {
      const numYear = parseInt(year, 10);
      return numYear >= 1900 && numYear <= new Date().getFullYear() + 1;
    },
    { message: 'Season year must be between 1900 and next year' }
  );

const teamKeySchema = z
  .string()
  .min(1, 'Team key cannot be empty')
  .max(50, 'Team key must be at most 50 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Team key must contain only alphanumeric characters, hyphens, and underscores');

// ==================== LIVE SCORES ENDPOINT ====================

/**
 * GET /api/live-scores?sport=mlb&date=2025-01-15
 */
export const liveScoresQuerySchema = z.object({
  sport: sportEnum.default('all'),
  date: dateStringSchema.optional()
});

// ==================== FOOTBALL SCORES ENDPOINT ====================

/**
 * GET /api/football/scores?week=5&season=2025
 */
export const footballScoresQuerySchema = z.object({
  week: z.union([weekNumberSchema, z.literal('current')]).optional(),
  season: seasonYearSchema.optional(),
  team: teamKeySchema.optional(),
  conference: z.string().max(100).optional()
});

// ==================== BASKETBALL SCORES ENDPOINT ====================

/**
 * GET /api/basketball/scores?date=2025-01-15
 */
export const basketballScoresQuerySchema = z.object({
  date: dateStringSchema.optional(),
  conference: z.string().max(100).optional(),
  top25: z.enum(['true', 'false', '1', '0']).optional()
});

// ==================== COLLEGE BASEBALL ENDPOINTS ====================

/**
 * GET /api/college-baseball/games?date=2025-04-15&team=texas
 */
export const collegeBaseballGamesQuerySchema = z.object({
  date: dateStringSchema.optional(),
  team: teamKeySchema.optional(),
  conference: z.string().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional()
});

/**
 * GET /api/college-baseball/teams/:teamId
 */
export const collegeBaseballTeamParamsSchema = z.object({
  teamId: z.string().min(1).max(50)
});

// ==================== COPILOT ENDPOINTS ====================

/**
 * POST /api/copilot/enhanced-search
 */
export const copilotSearchBodySchema = z.object({
  query: z.string().min(1, 'Search query is required').max(500, 'Query must be at most 500 characters'),
  sport: sportEnum.optional(),
  limit: z.number().int().min(1).max(50).optional(),
  filters: z.object({
    date: dateStringSchema.optional(),
    team: teamKeySchema.optional(),
    conference: z.string().max(100).optional()
  }).optional()
});

/**
 * POST /api/copilot/enhanced-insights
 */
export const copilotInsightsBodySchema = z.object({
  gameId: z.string().min(1, 'Game ID is required').max(100),
  sport: sportEnum,
  includeProjections: z.boolean().optional(),
  includeHistorical: z.boolean().optional()
});

// ==================== MLB/NFL/NBA SCORES ENDPOINTS ====================

/**
 * GET /api/mlb/scores?date=2025-06-15&team=astros
 */
export const mlbScoresQuerySchema = z.object({
  date: dateStringSchema.optional(),
  team: teamKeySchema.optional(),
  includeLineScore: z.enum(['true', 'false', '1', '0']).optional()
});

/**
 * GET /api/nfl/scores?week=10&season=2025
 */
export const nflScoresQuerySchema = z.object({
  week: weekNumberSchema.optional(),
  season: seasonYearSchema.optional(),
  team: teamKeySchema.optional()
});

/**
 * GET /api/nba/scores?date=2025-02-15
 */
export const nbaScoresQuerySchema = z.object({
  date: dateStringSchema.optional(),
  team: teamKeySchema.optional()
});

// ==================== MONTE CARLO SIMULATION ====================

/**
 * POST /api/monte-carlo
 */
export const monteCarloBodySchema = z.object({
  sport: z.enum(['baseball', 'football', 'basketball']),
  homeTeam: z.string().min(1).max(100),
  awayTeam: z.string().min(1).max(100),
  simulations: z.number().int().min(1000).max(100000).default(10000),
  includeProbabilityCurve: z.boolean().optional()
});

// ==================== HEALTH & METRICS ====================

/**
 * GET /api/health - No validation needed, but included for completeness
 */
export const healthQuerySchema = z.object({});

/**
 * GET /api/metrics?service=api&timeRange=1h
 */
export const metricsQuerySchema = z.object({
  service: z.enum(['api', 'workers', 'database', 'cache']).optional(),
  timeRange: z.enum(['5m', '15m', '1h', '6h', '24h', '7d']).default('1h')
});

// ==================== EXPORTS ====================

export default {
  liveScoresQuerySchema,
  footballScoresQuerySchema,
  basketballScoresQuerySchema,
  collegeBaseballGamesQuerySchema,
  collegeBaseballTeamParamsSchema,
  copilotSearchBodySchema,
  copilotInsightsBodySchema,
  mlbScoresQuerySchema,
  nflScoresQuerySchema,
  nbaScoresQuerySchema,
  monteCarloBodySchema,
  healthQuerySchema,
  metricsQuerySchema
};
