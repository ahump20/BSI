/**
 * SCHEDULING & OPTIMIZATION SCHEMAS
 * Validation schemas for scheduling and Monte Carlo optimization endpoints
 */

import { z } from 'zod';
import {
    teamKeySchema,
    positiveIntSchema,
    nonNegativeIntSchema,
    booleanStringSchema,
    probabilitySchema
} from '../utils.js';

// ==================== SCHEDULING OPTIMIZER ====================

/**
 * Opponent schema for scheduling
 */
const opponentSchema = z.object({
    teamId: teamKeySchema,
    teamName: z.string().max(200).optional(),
    rank: z.coerce.number().int().min(1).optional(),
    winPct: probabilitySchema.optional(),
    strength: z.coerce.number().optional(),
    location: z.enum(['home', 'away', 'neutral']).optional()
});

/**
 * Current metrics schema
 */
const currentMetricsSchema = z.object({
    wins: nonNegativeIntSchema.optional(),
    losses: nonNegativeIntSchema.optional(),
    rpi: z.coerce.number().min(0).max(1).optional(),
    sor: z.coerce.number().optional(),
    kenpom: z.coerce.number().optional(),
    netRanking: z.coerce.number().int().optional(),
    conferenceWins: nonNegativeIntSchema.optional(),
    conferenceLosses: nonNegativeIntSchema.optional()
});

/**
 * POST /api/v1/scheduling/optimizer
 * Schedule optimization with Monte Carlo simulation
 */
export const schedulingOptimizerSchema = z.object({
    body: z.object({
        teamId: teamKeySchema,
        conference: z.string().max(100).optional(),
        currentMetrics: currentMetricsSchema.optional(),
        futureOpponents: z.array(opponentSchema)
            .min(1, 'At least one future opponent is required')
            .max(50, 'Maximum 50 opponents allowed'),
        userTier: z.enum(['free', 'basic', 'pro', 'diamond']).default('free'),
        iterations: positiveIntSchema
            .max(10000, 'Maximum 10000 iterations allowed')
            .default(100),
        deterministic: booleanStringSchema.default('false')
    })
});

/**
 * GET /api/v1/scheduling/projection/:teamId
 * Get scheduling projection for a team
 */
export const schedulingProjectionSchema = z.object({
    params: z.object({
        teamId: teamKeySchema
    }),
    query: z.object({
        season: z.string().regex(/^\d{4}$/).optional(),
        includeHistory: booleanStringSchema.optional(),
        includeProjections: booleanStringSchema.optional()
    })
});

/**
 * POST /api/v1/scheduling/compare
 * Compare multiple schedule scenarios
 */
export const schedulingCompareSchema = z.object({
    body: z.object({
        scenarios: z.array(
            z.object({
                name: z.string().max(100),
                teamId: teamKeySchema,
                futureOpponents: z.array(opponentSchema).min(1).max(50)
            })
        ).min(2).max(5) // Compare 2-5 scenarios
    })
});

// ==================== RPI/SOR CALCULATIONS ====================

/**
 * POST /api/v1/metrics/rpi
 * Calculate RPI for a team
 */
export const rpiCalculationSchema = z.object({
    body: z.object({
        teamId: teamKeySchema,
        wins: nonNegativeIntSchema,
        losses: nonNegativeIntSchema,
        opponentWins: nonNegativeIntSchema.optional(),
        opponentLosses: nonNegativeIntSchema.optional(),
        opponentOpponentWins: nonNegativeIntSchema.optional(),
        opponentOpponentLosses: nonNegativeIntSchema.optional()
    })
});

// ==================== EXPORTS ====================

export default {
    schedulingOptimizerSchema,
    schedulingProjectionSchema,
    schedulingCompareSchema,
    rpiCalculationSchema,
    opponentSchema,
    currentMetricsSchema
};
