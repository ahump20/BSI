/**
 * VALIDATION SCHEMAS INDEX
 * Central export point for all validation schemas
 */

import gameSchemas from './game.schemas.js';
import teamSchemas from './team.schemas.js';
import sportsSchemas from './sports.schemas.js';

// Re-export all schemas
export * from './game.schemas.js';
export * from './team.schemas.js';
export * from './sports.schemas.js';

// Default export with organized structure
export default {
    game: gameSchemas,
    team: teamSchemas,
    sports: sportsSchemas
};

/**
 * Quick reference for commonly used schemas
 */
export const commonSchemas = {
    // Game prediction
    predictGame: gameSchemas.predictGameSchema,
    predictSeason: gameSchemas.predictSeasonSchema,
    batchPredict: gameSchemas.batchPredictSchema,

    // Live data
    liveScores: gameSchemas.liveScoresSchema,
    gamesList: gameSchemas.gamesListSchema,
    gameDetails: gameSchemas.gameDetailsSchema,

    // Team endpoints
    teamInfo: teamSchemas.teamInfoSchema,
    teamAnalytics: teamSchemas.teamAnalyticsSchema,
    teamStats: teamSchemas.teamStatsSchema,

    // Sports-specific
    mlbScores: sportsSchemas.mlbScoresSchema,
    nflScores: sportsSchemas.nflScoresSchema,
    nbaScores: sportsSchemas.nbaScoresSchema,
    ncaabScores: sportsSchemas.ncaabScoresSchema,
    ncaafScores: sportsSchemas.ncaafScoresSchema
};
