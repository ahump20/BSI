/**
 * Shared TypeScript types for sports data entities
 * 
 * Purpose: Standardize data structures across all adapters
 * Pattern: Use Zod for runtime validation + type inference
 * 
 * Sources:
 * - BSI existing adapters (lib/adapters/*)
 * - TypeScript best practices for sports APIs
 */

import { z } from 'zod';

/**
 * Game status enum
 * Used across all sports (MLB, NFL, college baseball, etc.)
 */
export const GameStatus = z.enum([
  'scheduled',
  'delayed',
  'in_progress',
  'final',
  'postponed',
  'cancelled',
  'suspended',
]);

export type GameStatus = z.infer<typeof GameStatus>;

/**
 * Base game structure
 * Minimal fields common to all sports
 */
export const BaseGameSchema = z.object({
  id: z.string(),
  homeTeam: z.string(),
  awayTeam: z.string(),
  homeScore: z.number().nullable(),
  awayScore: z.number().nullable(),
  status: GameStatus,
  scheduledTime: z.string().datetime(),
  venue: z.string().optional(),
  sport: z.enum(['mlb', 'nfl', 'nba', 'ncaa_baseball', 'ncaa_football']),
});

export type BaseGame = z.infer<typeof BaseGameSchema>;

/**
 * Extended game with live details
 * Adds period/inning information
 */
export const LiveGameSchema = BaseGameSchema.extend({
  period: z.string().optional(), // "Top 3rd", "Q2", etc.
  timeRemaining: z.string().optional(), // "12:45", "2 outs"
  lastPlay: z.string().optional(),
});

export type LiveGame = z.infer<typeof LiveGameSchema>;

/**
 * Team structure
 */
export const TeamSchema = z.object({
  id: z.string(),
  name: z.string(),
  abbreviation: z.string(),
  conference: z.string().optional(),
  division: z.string().optional(),
  logo: z.string().url().optional(),
  wins: z.number().optional(),
  losses: z.number().optional(),
});

export type Team = z.infer<typeof TeamSchema>;

/**
 * Player base structure
 */
export const PlayerSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  position: z.string(),
  jerseyNumber: z.number().optional(),
  teamId: z.string(),
  height: z.string().optional(),
  weight: z.number().optional(),
  year: z.enum(['FR', 'SO', 'JR', 'SR', 'GR']).optional(), // College only
});

export type Player = z.infer<typeof PlayerSchema>;

/**
 * Baseball-specific batting stats
 */
export const BattingStatsSchema = z.object({
  playerId: z.string(),
  atBats: z.number(),
  hits: z.number(),
  runs: z.number(),
  rbi: z.number(),
  homeRuns: z.number(),
  strikeouts: z.number(),
  walks: z.number(),
  average: z.number(),
  obp: z.number().optional(),
  slg: z.number().optional(),
  ops: z.number().optional(),
});

export type BattingStats = z.infer<typeof BattingStatsSchema>;

/**
 * Baseball-specific pitching stats
 */
export const PitchingStatsSchema = z.object({
  playerId: z.string(),
  inningsPitched: z.number(),
  hits: z.number(),
  runs: z.number(),
  earnedRuns: z.number(),
  walks: z.number(),
  strikeouts: z.number(),
  era: z.number(),
  whip: z.number().optional(),
  wins: z.number().optional(),
  losses: z.number().optional(),
  saves: z.number().optional(),
});

export type PitchingStats = z.infer<typeof PitchingStatsSchema>;

/**
 * Standing/ranking entry
 */
export const StandingSchema = z.object({
  teamId: z.string(),
  rank: z.number(),
  wins: z.number(),
  losses: z.number(),
  winPercentage: z.number(),
  gamesBack: z.number().optional(),
  streak: z.string().optional(), // "W3", "L2"
  conferenceWins: z.number().optional(),
  conferenceLosses: z.number().optional(),
});

export type Standing = z.infer<typeof StandingSchema>;

/**
 * API response wrapper
 * Standardizes all API responses with metadata
 */
export const createAPIResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    timestamp: z.string().datetime(),
    source: z.string(),
    cacheHit: z.boolean().optional(),
  });

export type APIResponse<T> = z.infer<ReturnType<typeof createAPIResponseSchema<z.ZodType<T>>>>;

/**
 * Error response structure
 */
export const APIErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number(),
  timestamp: z.string().datetime(),
});

export type APIError = z.infer<typeof APIErrorSchema>;

/**
 * NIL valuation data
 * BSI-specific for Fair Market NIL Value (FMNV)
 */
export const NILValuationSchema = z.object({
  playerId: z.string(),
  fmnv: z.number(), // Fair Market NIL Value in USD
  marketTier: z.enum(['elite', 'high', 'medium', 'low']),
  factors: z.object({
    performance: z.number(), // 0-100 score
    socialMedia: z.number(), // 0-100 score
    marketSize: z.number(), // 0-100 score
    positionScarcity: z.number(), // 0-100 score
  }),
  lastUpdated: z.string().datetime(),
  source: z.string(),
});

export type NILValuation = z.infer<typeof NILValuationSchema>;

/**
 * Utility: Validate data against schema
 * @throws ZodError if validation fails
 */
export function validateData<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): z.infer<T> {
  return schema.parse(data);
}

/**
 * Utility: Safe validation (returns null on error)
 */
export function safeValidateData<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): z.infer<T> | null {
  const result = schema.safeParse(data);
  return result.success ? result.data : null;
}
