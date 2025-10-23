/**
 * GAME PREDICTION & ANALYTICS SCHEMAS
 * Validation schemas for game-related endpoints
 */

import { z } from 'zod';
import {
    sportSchema,
    leagueSchema,
    dateStringSchema,
    teamKeySchema,
    seasonSchema,
    limitSchema,
    offsetSchema,
    booleanStringSchema,
    probabilitySchema
} from '../utils.js';

// ==================== GAME PREDICTION ====================

/**
 * POST /api/predict/game
 * Single game prediction request
 */
export const predictGameSchema = z.object({
    body: z.object({
        homeTeam: teamKeySchema,
        awayTeam: teamKeySchema,
        sport: sportSchema,
        gameDate: dateStringSchema.optional(),
        venue: z.string().max(200).optional(),
        weather: z.object({
            temperature: z.number().optional(),
            conditions: z.string().optional(),
            windSpeed: z.number().optional()
        }).optional(),
        includePlayerStats: booleanStringSchema.optional(),
        includeHistoricalMatchups: booleanStringSchema.optional()
    })
});

/**
 * POST /api/predict/season
 * Season prediction request
 */
export const predictSeasonSchema = z.object({
    body: z.object({
        teamKey: teamKeySchema,
        sport: sportSchema,
        season: seasonSchema,
        includePlayoffProbability: booleanStringSchema.optional(),
        includeScheduleStrength: booleanStringSchema.optional()
    })
});

/**
 * POST /api/predict/batch
 * Batch game predictions
 */
export const batchPredictSchema = z.object({
    body: z.object({
        games: z.array(
            z.object({
                homeTeam: teamKeySchema,
                awayTeam: teamKeySchema,
                sport: sportSchema,
                gameDate: dateStringSchema.optional()
            })
        ).min(1).max(50) // Limit batch size
    })
});

// ==================== LIVE GAMES ====================

/**
 * GET /api/live-scores
 * Live scores and updates
 */
export const liveScoresSchema = z.object({
    query: z.object({
        sport: sportSchema.optional(),
        league: leagueSchema.optional(),
        includeCompleted: booleanStringSchema.optional(),
        limit: limitSchema.optional()
    })
});

/**
 * GET /api/games
 * Games list with filters
 */
export const gamesListSchema = z.object({
    query: z.object({
        sport: sportSchema.optional(),
        league: leagueSchema.optional(),
        date: dateStringSchema.optional(),
        team: teamKeySchema.optional(),
        status: z.enum(['scheduled', 'live', 'completed', 'postponed', 'cancelled']).optional(),
        limit: limitSchema.optional(),
        offset: offsetSchema.optional()
    })
});

/**
 * GET /api/games/:gameId
 * Single game details
 */
export const gameDetailsSchema = z.object({
    params: z.object({
        gameId: z.string().min(1).max(100)
    }),
    query: z.object({
        includeBoxScore: booleanStringSchema.optional(),
        includePlayByPlay: booleanStringSchema.optional(),
        includeStats: booleanStringSchema.optional()
    })
});

// ==================== GAME ANALYTICS ====================

/**
 * GET /api/game/:gameId/analytics
 * Game-level analytics
 */
export const gameAnalyticsSchema = z.object({
    params: z.object({
        gameId: z.string().min(1).max(100)
    }),
    query: z.object({
        metrics: z.string().optional(), // comma-separated list
        includeAdvanced: booleanStringSchema.optional(),
        includeProjections: booleanStringSchema.optional()
    })
});

/**
 * POST /api/copilot/games
 * AI copilot game queries
 */
export const copilotGamesSchema = z.object({
    body: z.object({
        query: z.string().min(1).max(1000),
        sport: sportSchema.optional(),
        league: leagueSchema.optional(),
        date: dateStringSchema.optional(),
        context: z.array(z.string()).optional(),
        maxResults: z.coerce.number().int().min(1).max(50).default(10)
    })
});

// ==================== GAME OUTCOMES ====================

/**
 * Confidence level schema
 */
export const confidenceSchema = z.enum(['low', 'medium', 'high', 'very_high']);

/**
 * Game prediction result schema (for responses)
 */
export const gamePredictionResultSchema = z.object({
    gameId: z.string().optional(),
    homeTeam: teamKeySchema,
    awayTeam: teamKeySchema,
    sport: sportSchema,
    predictedWinner: teamKeySchema,
    winProbability: probabilitySchema,
    confidence: confidenceSchema,
    predictedScore: z.object({
        home: z.number().int().min(0),
        away: z.number().int().min(0)
    }).optional(),
    factors: z.array(
        z.object({
            factor: z.string(),
            impact: z.number(),
            description: z.string().optional()
        })
    ).optional(),
    timestamp: z.string().datetime()
});

// ==================== EXPORTS ====================

export default {
    predictGameSchema,
    predictSeasonSchema,
    batchPredictSchema,
    liveScoresSchema,
    gamesListSchema,
    gameDetailsSchema,
    gameAnalyticsSchema,
    copilotGamesSchema,
    gamePredictionResultSchema,
    confidenceSchema
};
