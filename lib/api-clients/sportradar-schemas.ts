/**
 * Sportradar MLB v8 — Zod Validation Schemas
 *
 * Validates the fields BSI actually uses from Sportradar responses.
 * .passthrough() preserves unknown fields for forward compatibility —
 * new fields from upstream won't break parsing.
 *
 * Pattern matches lib/api-clients/schemas.ts
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Team Reference
// ---------------------------------------------------------------------------

export const SportradarTeamRefSchema = z.object({
  id: z.string(),
  name: z.string(),
  market: z.string(),
  abbr: z.string(),
  runs: z.number().optional(),
  hits: z.number().optional(),
  errors: z.number().optional(),
  win: z.number().optional(),
  loss: z.number().optional(),
}).passthrough();

// ---------------------------------------------------------------------------
// Venue
// ---------------------------------------------------------------------------

export const SportradarVenueSchema = z.object({
  id: z.string(),
  name: z.string(),
  market: z.string().optional(),
  capacity: z.number().optional(),
  surface: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
}).passthrough();

// ---------------------------------------------------------------------------
// Game
// ---------------------------------------------------------------------------

export const SportradarGameSchema = z.object({
  id: z.string(),
  status: z.string(),
  coverage: z.string().optional(),
  scheduled: z.string(),
  home_team: z.string().optional(),
  away_team: z.string().optional(),
  home: SportradarTeamRefSchema.optional(),
  away: SportradarTeamRefSchema.optional(),
  venue: SportradarVenueSchema.optional(),
}).passthrough();

// ---------------------------------------------------------------------------
// Daily Schedule
// ---------------------------------------------------------------------------

export const SportradarDailyScheduleSchema = z.object({
  date: z.string(),
  games: z.array(SportradarGameSchema),
}).passthrough();

// ---------------------------------------------------------------------------
// Pitch Event (within PBP)
// ---------------------------------------------------------------------------

export const SportradarPitchEventSchema = z.object({
  id: z.string(),
  sequence: z.number().optional(),
  outcome_id: z.string(),
  outcome_desc: z.string(),
  type: z.string().optional(),
  status: z.string().optional(),
  count: z.object({
    balls: z.number(),
    strikes: z.number(),
    outs: z.number(),
    pitch_count: z.number(),
  }).passthrough().optional(),
  flags: z.object({}).passthrough().optional(),
  pitcher: z.object({ id: z.string(), full_name: z.string().optional() }).passthrough().optional(),
  hitter: z.object({ id: z.string(), full_name: z.string().optional() }).passthrough().optional(),
  mlb_pitch_data: z.object({
    speed: z.number().optional(),
    type: z.string().optional(),
    type_desc: z.string().optional(),
    zone: z.number().optional(),
    x: z.number().optional(),
    y: z.number().optional(),
    spin_rate: z.number().optional(),
    spin_direction: z.number().optional(),
    break_angle: z.number().optional(),
    break_length: z.number().optional(),
  }).passthrough().optional(),
}).passthrough();

// ---------------------------------------------------------------------------
// At-Bat
// ---------------------------------------------------------------------------

export const SportradarAtBatSchema = z.object({
  id: z.string(),
  hitter_id: z.string(),
  pitcher_id: z.string(),
  events: z.array(SportradarPitchEventSchema).optional(),
  description: z.string().optional(),
}).passthrough();

// ---------------------------------------------------------------------------
// PBP Inning / Half
// ---------------------------------------------------------------------------

export const SportradarHalfSchema = z.object({
  half: z.enum(['T', 'B']),
  events: z.array(z.object({
    id: z.string(),
    type: z.string(),
    at_bat: SportradarAtBatSchema.optional(),
    wall_clock: z.object({ value: z.string() }).passthrough().optional(),
  }).passthrough()),
}).passthrough();

export const SportradarInningSchema = z.object({
  number: z.number(),
  sequence: z.number(),
  halfs: z.array(SportradarHalfSchema),
}).passthrough();

// ---------------------------------------------------------------------------
// Play-by-Play Response
// ---------------------------------------------------------------------------

export const SportradarPBPResponseSchema = z.object({
  game: SportradarGameSchema,
  innings: z.array(SportradarInningSchema).optional(),
}).passthrough();

// ---------------------------------------------------------------------------
// Changes / Delta Detection
// ---------------------------------------------------------------------------

export const SportradarChangeSchema = z.object({
  game_id: z.string(),
  updated: z.string(),
  endpoints: z.array(z.string()).optional(),
}).passthrough();

export const SportradarChangesResponseSchema = z.object({
  league: z.object({ id: z.string(), name: z.string() }).passthrough().optional(),
  changes: z.array(SportradarChangeSchema),
}).passthrough();

// ---------------------------------------------------------------------------
// BSI ABS Response (served by Pages Function)
// ---------------------------------------------------------------------------

export const BSIABSRoleStatsSchema = z.object({
  role: z.enum(['catcher', 'hitter', 'pitcher']),
  challenges: z.number(),
  overturned: z.number(),
  successRate: z.number(),
});

export const BSIABSGameLogSchema = z.object({
  gameId: z.string(),
  date: z.string(),
  away: z.string(),
  home: z.string(),
  totalChallenges: z.number(),
  overturned: z.number(),
  avgChallengeTime: z.number(),
});

export const BSIABSResponseSchema = z.object({
  challengesByRole: z.array(BSIABSRoleStatsSchema),
  recentGames: z.array(BSIABSGameLogSchema),
  umpireAccuracy: z.array(z.object({
    label: z.string(),
    accuracy: z.number(),
    totalCalls: z.number(),
    source: z.string(),
  })),
  meta: z.object({
    source: z.string(),
    fetched_at: z.string(),
    timezone: z.literal('America/Chicago'),
  }),
});
