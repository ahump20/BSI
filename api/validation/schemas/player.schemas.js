/**
 * PLAYER ANALYTICS SCHEMAS
 * Validation schemas for player-related endpoints
 */

import { z } from 'zod';
import {
    sportSchema,
    dateStringSchema,
    seasonSchema,
    limitSchema,
    offsetSchema,
    booleanStringSchema,
    sortOrderSchema
} from '../utils.js';

// Player ID schema
const playerIdSchema = z.string().min(1).max(100);

// ==================== PLAYER PREDICTIONS ====================

/**
 * POST /api/predict/player
 * Player performance prediction
 */
export const predictPlayerSchema = z.object({
    body: z.object({
        playerId: playerIdSchema,
        sport: sportSchema,
        gameContext: z.object({
            opponent: z.string().max(100).optional(),
            venue: z.string().max(200).optional(),
            date: dateStringSchema.optional(),
            weather: z.object({
                temperature: z.number().optional(),
                conditions: z.string().optional()
            }).optional()
        }).optional(),
        metrics: z.array(z.string()).optional(), // Metrics to predict
        includeConfidence: booleanStringSchema.optional(),
        includeHistoricalComparison: booleanStringSchema.optional()
    })
});

/**
 * POST /api/predict/player/batch
 * Batch player predictions
 */
export const batchPredictPlayerSchema = z.object({
    body: z.object({
        players: z.array(
            z.object({
                playerId: playerIdSchema,
                sport: sportSchema,
                gameContext: z.object({
                    opponent: z.string().optional(),
                    date: dateStringSchema.optional()
                }).optional()
            })
        ).min(1).max(50)
    })
});

// ==================== PLAYER INFORMATION ====================

/**
 * GET /api/player/:sport/:playerId
 * Get player information
 */
export const playerInfoSchema = z.object({
    params: z.object({
        sport: sportSchema,
        playerId: playerIdSchema
    }),
    query: z.object({
        season: seasonSchema.optional(),
        includeStats: booleanStringSchema.optional(),
        includeInjuries: booleanStringSchema.optional(),
        includeNews: booleanStringSchema.optional()
    })
});

/**
 * GET /api/player/:sport/:playerId/stats
 * Get player statistics
 */
export const playerStatsSchema = z.object({
    params: z.object({
        sport: sportSchema,
        playerId: playerIdSchema
    }),
    query: z.object({
        season: seasonSchema.optional(),
        statType: z.enum(['season', 'career', 'playoffs', 'gamelog']).default('season'),
        split: z.enum(['overall', 'home', 'away', 'vs-left', 'vs-right', 'day', 'night']).optional(),
        lastN: z.coerce.number().int().min(1).max(100).optional()
    })
});

/**
 * GET /api/player/:sport/:playerId/gamelog
 * Get player game log
 */
export const playerGameLogSchema = z.object({
    params: z.object({
        sport: sportSchema,
        playerId: playerIdSchema
    }),
    query: z.object({
        season: seasonSchema.optional(),
        startDate: dateStringSchema.optional(),
        endDate: dateStringSchema.optional(),
        limit: limitSchema.optional(),
        offset: offsetSchema.optional()
    })
});

// ==================== PLAYER COMPARISONS ====================

/**
 * GET /api/player/compare
 * Compare multiple players
 */
export const playerCompareSchema = z.object({
    query: z.object({
        players: z.string().min(1), // comma-separated player IDs
        sport: sportSchema,
        season: seasonSchema.optional(),
        metrics: z.string().optional(), // comma-separated metrics
        normalize: booleanStringSchema.optional() // Normalize by position
    })
});

// ==================== PLAYER RANKINGS ====================

/**
 * GET /api/players/rankings
 * Get player rankings
 */
export const playerRankingsSchema = z.object({
    query: z.object({
        sport: sportSchema,
        position: z.string().max(50).optional(),
        season: seasonSchema.optional(),
        metric: z.string().max(100).default('overall'),
        limit: limitSchema.optional(),
        offset: offsetSchema.optional()
    })
});

/**
 * GET /api/players
 * List players with filters
 */
export const playersListSchema = z.object({
    query: z.object({
        sport: sportSchema.optional(),
        team: z.string().max(100).optional(),
        position: z.string().max(50).optional(),
        status: z.enum(['active', 'inactive', 'injured', 'all']).default('active'),
        search: z.string().max(200).optional(),
        limit: limitSchema.optional(),
        offset: offsetSchema.optional(),
        sortBy: z.enum(['name', 'ranking', 'points', 'position']).default('name'),
        sortOrder: sortOrderSchema.optional()
    })
});

// ==================== PLAYER PROJECTIONS ====================

/**
 * GET /api/player/:sport/:playerId/projections
 * Get player projections
 */
export const playerProjectionsSchema = z.object({
    params: z.object({
        sport: sportSchema,
        playerId: playerIdSchema
    }),
    query: z.object({
        season: seasonSchema.optional(),
        projectionType: z.enum(['rest-of-season', 'next-game', 'season-end']).default('rest-of-season'),
        includeConfidence: booleanStringSchema.optional()
    })
});

// ==================== EXPORTS ====================

export default {
    predictPlayerSchema,
    batchPredictPlayerSchema,
    playerInfoSchema,
    playerStatsSchema,
    playerGameLogSchema,
    playerCompareSchema,
    playerRankingsSchema,
    playersListSchema,
    playerProjectionsSchema
};
