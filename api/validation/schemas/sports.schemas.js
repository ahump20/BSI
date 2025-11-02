/**
 * SPORTS-SPECIFIC SCHEMAS
 * Validation schemas for sport-specific endpoints (MLB, NFL, NBA, etc.)
 */

import { z } from 'zod';
import {
    dateStringSchema,
    limitSchema,
    offsetSchema,
    booleanStringSchema,
    teamKeySchema
} from '../utils.js';

// ==================== MLB SCHEMAS ====================

/**
 * GET /api/mlb/scores
 * MLB scores endpoint
 */
export const mlbScoresSchema = z.object({
    query: z.object({
        date: dateStringSchema.optional(),
        team: teamKeySchema.optional(),
        includeLineScore: booleanStringSchema.optional(),
        includeBoxScore: booleanStringSchema.optional(),
        limit: limitSchema.optional()
    })
});

/**
 * GET /api/mlb/standings
 * MLB standings
 */
export const mlbStandingsSchema = z.object({
    query: z.object({
        season: z.string().regex(/^\d{4}$/, 'Season must be a 4-digit year').optional(),
        division: z.enum(['AL East', 'AL Central', 'AL West', 'NL East', 'NL Central', 'NL West']).optional()
    })
});

/**
 * GET /api/mlb/team/:teamId
 * MLB team details
 */
export const mlbTeamSchema = z.object({
    params: z.object({
        teamId: z.string().min(1).max(50)
    }),
    query: z.object({
        includeRoster: booleanStringSchema.optional(),
        includeStats: booleanStringSchema.optional()
    })
});

// ==================== NFL SCHEMAS ====================

/**
 * GET /api/nfl/scores
 * NFL scores endpoint
 */
export const nflScoresSchema = z.object({
    query: z.object({
        week: z.coerce.number().int().min(1).max(18).optional(),
        season: z.string().regex(/^\d{4}$/).optional(),
        date: dateStringSchema.optional(),
        team: teamKeySchema.optional(),
        includeStats: booleanStringSchema.optional()
    })
});

/**
 * GET /api/nfl/standings
 * NFL standings
 */
export const nflStandingsSchema = z.object({
    query: z.object({
        season: z.string().regex(/^\d{4}$/).optional(),
        conference: z.enum(['AFC', 'NFC']).optional(),
        division: z.enum(['East', 'West', 'North', 'South']).optional()
    })
});

/**
 * GET /api/nfl/team/:teamId
 * NFL team details
 */
export const nflTeamSchema = z.object({
    params: z.object({
        teamId: z.string().min(1).max(50)
    }),
    query: z.object({
        includeRoster: booleanStringSchema.optional(),
        includeDepthChart: booleanStringSchema.optional(),
        includeInjuries: booleanStringSchema.optional()
    })
});

// ==================== NBA SCHEMAS ====================

/**
 * GET /api/nba/scores
 * NBA scores endpoint
 */
export const nbaScoresSchema = z.object({
    query: z.object({
        date: dateStringSchema.optional(),
        team: teamKeySchema.optional(),
        includeBoxScore: booleanStringSchema.optional(),
        includePlayByPlay: booleanStringSchema.optional()
    })
});

/**
 * GET /api/nba/standings
 * NBA standings
 */
export const nbaStandingsSchema = z.object({
    query: z.object({
        season: z.string().regex(/^\d{4}$/).optional(),
        conference: z.enum(['Eastern', 'Western']).optional()
    })
});

/**
 * GET /api/nba/team/:teamId
 * NBA team details
 */
export const nbaTeamSchema = z.object({
    params: z.object({
        teamId: z.string().min(1).max(50)
    }),
    query: z.object({
        includeRoster: booleanStringSchema.optional(),
        includeStats: booleanStringSchema.optional(),
        includeSchedule: booleanStringSchema.optional()
    })
});

// ==================== COLLEGE SPORTS (NCAAB/NCAAF) ====================

/**
 * GET /api/ncaab/scores
 * College basketball scores
 */
export const ncaabScoresSchema = z.object({
    query: z.object({
        date: dateStringSchema.optional(),
        conference: z.string().max(100).optional(),
        division: z.enum(['D1', 'D2', 'D3']).optional(),
        top25: booleanStringSchema.optional(),
        limit: limitSchema.optional()
    })
});

/**
 * GET /api/ncaaf/scores
 * College football scores
 */
export const ncaafScoresSchema = z.object({
    query: z.object({
        week: z.coerce.number().int().min(0).max(17).optional(), // Week 0 to 17
        season: z.string().regex(/^\d{4}$/).optional(),
        date: dateStringSchema.optional(),
        conference: z.string().max(100).optional(),
        division: z.enum(['fbs', 'fcs', 'FBS', 'FCS']).optional(),
        top25: booleanStringSchema.optional()
    })
});

/**
 * GET /api/ncaab|ncaaf/rankings
 * College rankings
 */
export const collegeRankingsSchema = z.object({
    query: z.object({
        poll: z.enum(['ap', 'coaches', 'cfp', 'bcs', 'net']).optional(),
        week: z.coerce.number().int().min(1).max(20).optional(),
        season: z.string().regex(/^\d{4}$/).optional()
    })
});

// ==================== PLAYER ENDPOINTS ====================

/**
 * GET /api/:sport/player/:playerId
 * Generic player details
 */
export const playerDetailsSchema = z.object({
    params: z.object({
        sport: z.enum(['mlb', 'nfl', 'nba', 'nhl', 'ncaab', 'ncaaf']),
        playerId: z.string().min(1).max(100)
    }),
    query: z.object({
        season: z.string().optional(),
        includeStats: booleanStringSchema.optional(),
        includeGameLog: booleanStringSchema.optional(),
        includeProjections: booleanStringSchema.optional()
    })
});

/**
 * GET /api/:sport/player/:playerId/stats
 * Player statistics
 */
export const playerStatsSchema = z.object({
    params: z.object({
        sport: z.enum(['mlb', 'nfl', 'nba', 'nhl', 'ncaab', 'ncaaf']),
        playerId: z.string().min(1).max(100)
    }),
    query: z.object({
        season: z.string().optional(),
        statType: z.enum(['season', 'career', 'playoffs', 'gamelog']).default('season'),
        split: z.enum(['overall', 'home', 'away', 'vs-left', 'vs-right']).optional(),
        lastN: z.coerce.number().int().min(1).max(50).optional()
    })
});

// ==================== SCHEDULE ENDPOINTS ====================

/**
 * GET /api/:sport/schedule
 * Sport schedule
 */
export const sportScheduleSchema = z.object({
    params: z.object({
        sport: z.enum(['mlb', 'nfl', 'nba', 'nhl', 'ncaab', 'ncaaf'])
    }),
    query: z.object({
        date: dateStringSchema.optional(),
        startDate: dateStringSchema.optional(),
        endDate: dateStringSchema.optional(),
        team: teamKeySchema.optional(),
        week: z.coerce.number().int().min(1).max(20).optional(),
        limit: limitSchema.optional(),
        offset: offsetSchema.optional()
    })
});

// ==================== EXPORTS ====================

export default {
    // MLB
    mlbScoresSchema,
    mlbStandingsSchema,
    mlbTeamSchema,

    // NFL
    nflScoresSchema,
    nflStandingsSchema,
    nflTeamSchema,

    // NBA
    nbaScoresSchema,
    nbaStandingsSchema,
    nbaTeamSchema,

    // College
    ncaabScoresSchema,
    ncaafScoresSchema,
    collegeRankingsSchema,

    // Player
    playerDetailsSchema,
    playerStatsSchema,

    // Schedule
    sportScheduleSchema
};
