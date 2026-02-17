/**
 * Zod Runtime Validation Schemas for External API Responses
 *
 * These schemas validate the fields BSI actually uses from each API source.
 * .passthrough() preserves unknown fields for forward compatibility —
 * new fields from upstream won't break parsing.
 *
 * Validation errors trigger the data-fetcher fallback chain naturally:
 * SportsDataIO fails validation → ESPN fallback → stale cache.
 */

import { z } from 'zod';
import { logger } from '../utils/logger';

// ---------------------------------------------------------------------------
// ESPN Schemas
// ---------------------------------------------------------------------------

/** ESPN scoreboard event competitor (team in a game) */
const EspnCompetitorSchema = z.object({
  id: z.string().optional(),
  team: z.object({
    id: z.string().optional(),
    displayName: z.string().optional(),
    name: z.string().optional(),
    abbreviation: z.string().optional(),
    shortDisplayName: z.string().optional(),
    logo: z.string().optional(),
    logos: z.array(z.object({ href: z.string() }).passthrough()).optional(),
    color: z.string().optional(),
  }).passthrough().optional(),
  score: z.union([z.string(), z.number()]).optional(),
  homeAway: z.string().optional(),
  winner: z.boolean().optional(),
  records: z.array(z.object({ summary: z.string().optional() }).passthrough()).optional(),
}).passthrough();

/** ESPN scoreboard competition */
const EspnCompetitionSchema = z.object({
  competitors: z.array(EspnCompetitorSchema).optional(),
  status: z.object({}).passthrough().optional(),
  venue: z.object({}).passthrough().optional(),
  broadcasts: z.array(z.object({}).passthrough()).optional(),
  odds: z.array(z.object({}).passthrough()).optional(),
}).passthrough();

/** ESPN scoreboard event (a single game) */
const EspnEventSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  shortName: z.string().optional(),
  date: z.string().optional(),
  competitions: z.array(EspnCompetitionSchema).optional(),
  status: z.object({}).passthrough().optional(),
}).passthrough();

/** ESPN scoreboard top-level response */
export const EspnScoreboardSchema = z.object({
  events: z.array(EspnEventSchema).optional(),
  day: z.object({ date: z.string().optional() }).passthrough().optional(),
}).passthrough();

/** ESPN standings response — loosely typed because it varies by sport */
export const EspnStandingsSchema = z.object({
  children: z.array(z.object({
    name: z.string().optional(),
    standings: z.object({
      entries: z.array(z.object({
        team: z.object({
          id: z.string().optional(),
          displayName: z.string().optional(),
          name: z.string().optional(),
          abbreviation: z.string().optional(),
          logos: z.array(z.object({ href: z.string() }).passthrough()).optional(),
        }).passthrough().optional(),
        stats: z.array(z.object({
          name: z.string().optional(),
          abbreviation: z.string().optional(),
          displayValue: z.string().optional(),
          value: z.number().optional(),
        }).passthrough()).optional(),
      }).passthrough()).optional(),
    }).passthrough().optional(),
  }).passthrough()).optional(),
}).passthrough();

// ---------------------------------------------------------------------------
// Highlightly Schemas (college baseball)
// ---------------------------------------------------------------------------

const HighlightlyTeamSchema = z.object({
  id: z.number(),
  name: z.string(),
  shortName: z.string().optional(),
  slug: z.string().optional(),
  logo: z.string().optional(),
  conference: z.object({
    id: z.number(),
    name: z.string(),
  }).passthrough().optional(),
  ranking: z.number().optional(),
  record: z.object({
    wins: z.number(),
    losses: z.number(),
  }).passthrough().optional(),
}).passthrough();

const HighlightlyMatchStatusSchema = z.object({
  code: z.number(),
  type: z.enum(['notstarted', 'inprogress', 'finished', 'postponed', 'cancelled']),
}).passthrough();

export const HighlightlyMatchSchema = z.object({
  id: z.number(),
  homeTeam: HighlightlyTeamSchema,
  awayTeam: HighlightlyTeamSchema,
  homeScore: z.number(),
  awayScore: z.number(),
  status: HighlightlyMatchStatusSchema,
  startTimestamp: z.number(),
}).passthrough();

/** Highlightly response wrapping an array of matches */
export const HighlightlyMatchesResponseSchema = z.object({
  events: z.array(HighlightlyMatchSchema),
}).passthrough();

// ---------------------------------------------------------------------------
// SportsDataIO Schemas (minimal — validates core game shape)
// ---------------------------------------------------------------------------

export const SDIOGameSchema = z.object({
  GameID: z.number(),
  Season: z.number().optional(),
  Status: z.string().optional(),
  DateTime: z.string().nullable().optional(),
  HomeTeam: z.string().optional(),
  AwayTeam: z.string().optional(),
  HomeTeamScore: z.number().nullable().optional(),
  AwayTeamScore: z.number().nullable().optional(),
}).passthrough();

export const SDIOGamesArraySchema = z.array(SDIOGameSchema);

export const SDIOStandingSchema = z.object({
  TeamID: z.number(),
  Team: z.string().optional(),
  Wins: z.number().optional(),
  Losses: z.number().optional(),
  Percentage: z.number().optional(),
}).passthrough();

export const SDIOStandingsArraySchema = z.array(SDIOStandingSchema);

// ---------------------------------------------------------------------------
// Validation Helper
// ---------------------------------------------------------------------------

/**
 * Validate an API response against a Zod schema.
 * On success, returns the parsed data. On failure, logs the error and throws
 * so the data-fetcher fallback chain can catch and try the next source.
 */
export function validateApiResponse<T>(
  schema: z.ZodType<T>,
  data: unknown,
  source: string,
  endpoint: string,
): T {
  const result = schema.safeParse(data);

  if (result.success) {
    return result.data;
  }

  const issues = result.error.issues.slice(0, 5).map(i => ({
    path: i.path.join('.'),
    message: i.message,
  }));

  logger.warn('API response validation failed', {
    source,
    endpoint,
    issueCount: result.error.issues.length,
    issues,
  });

  throw new Error(
    `[${source}] ${endpoint} response validation failed: ${issues.map(i => `${i.path}: ${i.message}`).join('; ')}`,
  );
}
