/**
 * CLOUDFLARE FUNCTIONS VALIDATION SCHEMAS
 * Reusable validation schemas for Cloudflare Pages Functions
 */

import { z } from 'zod';

// ==================== COMMON SCHEMAS ====================

export const sportSchema = z.enum(['baseball', 'football', 'basketball', 'hockey', 'mlb', 'nfl', 'nba', 'nhl', 'ncaab', 'ncaaf']);
export const leagueSchema = z.enum(['mlb', 'nfl', 'nba', 'nhl', 'ncaab', 'ncaaf', 'ncaam', 'ncaaw']);
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');
export const teamIdSchema = z.string().min(1).max(100);
export const seasonSchema = z.string().regex(/^\d{4}(-\d{4})?$/, 'Season must be a year or year range');

export const paginationSchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0)
});

// ==================== SCORES ENDPOINTS ====================

export const scoresQuerySchema = z.object({
    date: dateSchema.optional(),
    sport: sportSchema.optional(),
    league: leagueSchema.optional(),
    team: teamIdSchema.optional(),
    status: z.enum(['scheduled', 'live', 'final', 'all']).default('all'),
    limit: z.coerce.number().int().min(1).max(100).default(20)
});

// ==================== STANDINGS ENDPOINTS ====================

export const standingsQuerySchema = z.object({
    season: seasonSchema.optional(),
    league: leagueSchema.optional(),
    conference: z.string().max(100).optional(),
    division: z.string().max(100).optional()
});

// ==================== TEAM ENDPOINTS ====================

export const teamQuerySchema = z.object({
    season: seasonSchema.optional(),
    includeRoster: z.enum(['true', 'false', '1', '0']).transform(v => v === 'true' || v === '1').optional(),
    includeStats: z.enum(['true', 'false', '1', '0']).transform(v => v === 'true' || v === '1').optional(),
    includeSchedule: z.enum(['true', 'false', '1', '0']).transform(v => v === 'true' || v === '1').optional()
});

export const teamParamsSchema = z.object({
    teamId: teamIdSchema
});

// ==================== ANALYTICS ENDPOINTS ====================

export const analyticsQuerySchema = z.object({
    startDate: dateSchema.optional(),
    endDate: dateSchema.optional(),
    metrics: z.string().optional(), // comma-separated list
    aggregation: z.enum(['daily', 'weekly', 'monthly', 'season']).default('daily')
});

// ==================== LIVE SCORES ====================

export const liveScoresQuerySchema = z.object({
    sport: sportSchema.optional(),
    league: leagueSchema.optional(),
    includeCompleted: z.enum(['true', 'false']).transform(v => v === 'true').default('false'),
    limit: z.coerce.number().int().min(1).max(50).default(20)
});

// ==================== COPILOT/AI ENDPOINTS ====================

export const copilotSearchQuerySchema = z.object({
    q: z.string().min(1).max(500),
    sport: sportSchema.optional(),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    context: z.string().optional()
});

export const copilotInsightBodySchema = z.object({
    query: z.string().min(1).max(1000),
    sport: sportSchema.optional(),
    teamId: teamIdSchema.optional(),
    includeStats: z.boolean().default(true),
    includeHistory: z.boolean().default(true)
});

// ==================== MONTE CARLO SIMULATION ====================

export const monteCarloBodySchema = z.object({
    teamId: teamIdSchema,
    opponents: z.array(z.object({
        teamId: teamIdSchema,
        homeAway: z.enum(['home', 'away', 'neutral']),
        date: dateSchema.optional()
    })).min(1).max(50),
    iterations: z.coerce.number().int().min(100).max(10000).default(1000),
    metrics: z.array(z.string()).optional()
});

// ==================== CHAMPIONSHIP ENDPOINTS ====================

export const championshipQuerySchema = z.object({
    sport: sportSchema,
    season: seasonSchema.optional(),
    includeHistory: z.enum(['true', 'false']).transform(v => v === 'true').default('false'),
    includeProjections: z.enum(['true', 'false']).transform(v => v === 'true').default('true')
});

// ==================== COLLEGE BASEBALL ====================

export const collegeBaseballGamesQuerySchema = z.object({
    date: dateSchema.optional(),
    conference: z.string().max(100).optional(),
    division: z.enum(['d1', 'd2', 'd3', 'D1', 'D2', 'D3']).optional(),
    status: z.enum(['scheduled', 'inprogress', 'final', 'all']).default('all'),
    limit: z.coerce.number().int().min(1).max(100).default(25)
});

export const collegeBaseballTeamsQuerySchema = z.object({
    conference: z.string().max(100).optional(),
    division: z.enum(['d1', 'd2', 'd3', 'D1', 'D2', 'D3']).default('d1'),
    state: z.string().length(2).optional(), // US state code
    search: z.string().max(200).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50)
});

export const collegeBaseballStandingsQuerySchema = z.object({
    conference: z.string().max(100).optional(),
    division: z.enum(['d1', 'd2', 'd3', 'D1', 'D2', 'D3']).default('d1'),
    season: seasonSchema.optional()
});

// ==================== HEALTH/STATUS ====================

export const healthQuerySchema = z.object({
    detailed: z.enum(['true', 'false']).transform(v => v === 'true').default('false')
});

// ==================== YOUTH RANKINGS ====================

export const youthRankingsQuerySchema = z.object({
    sport: sportSchema,
    age: z.coerce.number().int().min(5).max(18).optional(),
    state: z.string().length(2).optional(),
    position: z.string().max(50).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50)
});

// ==================== SIMULATIONS ====================

export const simulationParamsSchema = z.object({
    sport: sportSchema
});

export const simulationBodySchema = z.object({
    teamId: teamIdSchema,
    opponentId: teamIdSchema,
    venue: z.enum(['home', 'away', 'neutral']).default('neutral'),
    date: dateSchema.optional(),
    iterations: z.coerce.number().int().min(100).max(5000).default(1000),
    includePlayerImpact: z.boolean().default(false)
});

// ==================== EXPORTS ====================

export default {
    // Common
    sportSchema,
    leagueSchema,
    dateSchema,
    teamIdSchema,
    seasonSchema,
    paginationSchema,

    // Endpoints
    scoresQuerySchema,
    standingsQuerySchema,
    teamQuerySchema,
    teamParamsSchema,
    analyticsQuerySchema,
    liveScoresQuerySchema,
    copilotSearchQuerySchema,
    copilotInsightBodySchema,
    monteCarloBodySchema,
    championshipQuerySchema,
    collegeBaseballGamesQuerySchema,
    collegeBaseballTeamsQuerySchema,
    collegeBaseballStandingsQuerySchema,
    healthQuerySchema,
    youthRankingsQuerySchema,
    simulationParamsSchema,
    simulationBodySchema
};
