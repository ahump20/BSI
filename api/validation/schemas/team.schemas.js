/**
 * TEAM ANALYTICS SCHEMAS
 * Validation schemas for team-related endpoints
 */

import { z } from 'zod';
import {
    sportSchema,
    leagueSchema,
    teamKeySchema,
    seasonSchema,
    limitSchema,
    offsetSchema,
    booleanStringSchema,
    sortOrderSchema
} from '../utils.js';

// ==================== TEAM INFORMATION ====================

/**
 * GET /api/team/:sport/:teamKey
 * Get team information
 */
export const teamInfoSchema = z.object({
    params: z.object({
        sport: sportSchema,
        teamKey: teamKeySchema
    }),
    query: z.object({
        season: seasonSchema.optional(),
        includeRoster: booleanStringSchema.optional(),
        includeStats: booleanStringSchema.optional(),
        includeSchedule: booleanStringSchema.optional()
    })
});

/**
 * GET /api/team/:sport/:teamKey/analytics
 * Get comprehensive team analytics
 */
export const teamAnalyticsSchema = z.object({
    params: z.object({
        sport: sportSchema,
        teamKey: teamKeySchema
    }),
    query: z.object({
        season: seasonSchema.optional(),
        metrics: z.string().optional(), // comma-separated: offense,defense,special
        timeframe: z.enum(['season', 'last10', 'last20', 'home', 'away']).optional(),
        includeAdvanced: booleanStringSchema.optional(),
        includeTrends: booleanStringSchema.optional(),
        compareToLeague: booleanStringSchema.optional()
    })
});

/**
 * GET /api/team/:sport/:teamKey/stats
 * Get team statistics
 */
export const teamStatsSchema = z.object({
    params: z.object({
        sport: sportSchema,
        teamKey: teamKeySchema
    }),
    query: z.object({
        season: seasonSchema.optional(),
        category: z.enum(['batting', 'pitching', 'fielding', 'offense', 'defense', 'special']).optional(),
        split: z.enum(['overall', 'home', 'away', 'conference', 'nonconference']).optional()
    })
});

/**
 * GET /api/team/:sport/:teamKey/roster
 * Get team roster
 */
export const teamRosterSchema = z.object({
    params: z.object({
        sport: sportSchema,
        teamKey: teamKeySchema
    }),
    query: z.object({
        season: seasonSchema.optional(),
        position: z.string().max(50).optional(),
        status: z.enum(['active', 'injured', 'suspended', 'all']).default('active'),
        includeStats: booleanStringSchema.optional()
    })
});

/**
 * GET /api/team/:sport/:teamKey/schedule
 * Get team schedule
 */
export const teamScheduleSchema = z.object({
    params: z.object({
        sport: sportSchema,
        teamKey: teamKeySchema
    }),
    query: z.object({
        season: seasonSchema.optional(),
        status: z.enum(['upcoming', 'completed', 'all']).default('all'),
        limit: limitSchema.optional(),
        includeResults: booleanStringSchema.optional(),
        includeProjections: booleanStringSchema.optional()
    })
});

// ==================== TEAM COMPARISONS ====================

/**
 * GET /api/team/compare
 * Compare multiple teams
 */
export const teamCompareSchema = z.object({
    query: z.object({
        teams: z.string().min(1), // comma-separated team keys
        sport: sportSchema,
        season: seasonSchema.optional(),
        metrics: z.string().optional(), // comma-separated metrics
        includeHeadToHead: booleanStringSchema.optional()
    })
});

/**
 * GET /api/team/:sport/:teamKey/matchup
 * Head-to-head matchup analysis
 */
export const teamMatchupSchema = z.object({
    params: z.object({
        sport: sportSchema,
        teamKey: teamKeySchema
    }),
    query: z.object({
        opponent: teamKeySchema,
        season: seasonSchema.optional(),
        includeHistory: booleanStringSchema.optional(),
        includePrediction: booleanStringSchema.optional()
    })
});

// ==================== TEAM RANKINGS ====================

/**
 * GET /api/teams/rankings
 * Get team rankings
 */
export const teamRankingsSchema = z.object({
    query: z.object({
        sport: sportSchema,
        league: leagueSchema.optional(),
        season: seasonSchema.optional(),
        rankingType: z.enum(['overall', 'offense', 'defense', 'conference', 'division']).default('overall'),
        limit: limitSchema.optional(),
        offset: offsetSchema.optional()
    })
});

/**
 * GET /api/teams
 * List teams with filters
 */
export const teamsListSchema = z.object({
    query: z.object({
        sport: sportSchema.optional(),
        league: leagueSchema.optional(),
        conference: z.string().max(100).optional(),
        division: z.string().max(100).optional(),
        state: z.string().length(2).optional(), // US state code
        search: z.string().max(200).optional(),
        limit: limitSchema.optional(),
        offset: offsetSchema.optional(),
        sortBy: z.enum(['name', 'ranking', 'winPct', 'conference']).default('name'),
        sortOrder: sortOrderSchema.optional()
    })
});

// ==================== TEAM TRENDS ====================

/**
 * GET /api/team/:sport/:teamKey/trends
 * Get team performance trends
 */
export const teamTrendsSchema = z.object({
    params: z.object({
        sport: sportSchema,
        teamKey: teamKeySchema
    }),
    query: z.object({
        season: seasonSchema.optional(),
        metric: z.enum([
            'winPct',
            'pointsScored',
            'pointsAllowed',
            'margin',
            'rank',
            'strength'
        ]).optional(),
        period: z.enum(['game', 'week', 'month']).default('game'),
        lastN: z.coerce.number().int().min(1).max(50).optional()
    })
});

/**
 * GET /api/team/:sport/:teamKey/strengths
 * Get team strengths and weaknesses
 */
export const teamStrengthsSchema = z.object({
    params: z.object({
        sport: sportSchema,
        teamKey: teamKeySchema
    }),
    query: z.object({
        season: seasonSchema.optional(),
        includeComparison: booleanStringSchema.optional(),
        includeRecommendations: booleanStringSchema.optional()
    })
});

// ==================== EXPORTS ====================

export default {
    teamInfoSchema,
    teamAnalyticsSchema,
    teamStatsSchema,
    teamRosterSchema,
    teamScheduleSchema,
    teamCompareSchema,
    teamMatchupSchema,
    teamRankingsSchema,
    teamsListSchema,
    teamTrendsSchema,
    teamStrengthsSchema
};
