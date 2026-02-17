/**
 * NCAA Baseball Daily Bundle — Zod Schemas & Types
 *
 * Single source of truth for the daily bundle shape.
 * Used by:
 *   - tools/build-ncaa-baseball-daily-bundle.ts (write-side validation)
 *   - workers/index.ts (serve-side type safety)
 *   - app/college-baseball/daily/[date]/DailyClient.tsx (render-side types)
 */
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Betting odds — all nullable (lines publish inconsistently)
// ---------------------------------------------------------------------------

export const BettingOddsSchema = z.object({
  book: z.string().nullable(),
  as_of_local: z.string().nullable(),
  moneyline: z.object({
    away: z.number().nullable(),
    home: z.number().nullable(),
  }),
  spread: z.object({
    away: z.number().nullable(),
    home: z.number().nullable(),
    line: z.number().nullable(),
  }),
  total: z.object({
    runs: z.number().nullable(),
  }),
  odds_source_ids: z.array(z.string()).optional(),
});

// ---------------------------------------------------------------------------
// Probable pitcher
// ---------------------------------------------------------------------------

export const ProbablePitcherSchema = z.object({
  player: z.string().nullable(),
  hand: z.string().nullable(),
  season_stats: z.record(z.string(), z.unknown()),
  stat_sources: z.array(z.string()).optional(),
});

// ---------------------------------------------------------------------------
// Team within a game
// ---------------------------------------------------------------------------

export const GameTeamSchema = z.object({
  team: z.string(),
  record: z.string().nullable(),
  rank: z.string().nullable(),
  starting_lineup: z.array(z.unknown()).optional(),
  probable_pitcher: ProbablePitcherSchema,
  key_relievers_if_available: z.array(z.unknown()).optional(),
});

// ---------------------------------------------------------------------------
// Matchup notes
// ---------------------------------------------------------------------------

export const MatchupNotesSchema = z.object({
  injuries_or_availability_if_verified: z.array(z.string()).optional(),
  travel_or_rest_if_verified: z.array(z.string()),
  data_quality_flags: z.array(z.string()),
});

// ---------------------------------------------------------------------------
// Upcoming game (today's slate)
// ---------------------------------------------------------------------------

export const UpcomingGameSchema = z.object({
  game_key: z.string(),
  start_time_local: z.string(),
  venue: z.string().nullable(),
  broadcast: z.string().nullable(),
  away: GameTeamSchema,
  home: GameTeamSchema,
  betting_odds: BettingOddsSchema,
  matchup_notes: MatchupNotesSchema,
});

// ---------------------------------------------------------------------------
// Key event in a prior-night result
// ---------------------------------------------------------------------------

export const KeyEventSchema = z.object({
  inning: z.string().nullable(),
  description: z.string(),
  numbers: z.object({
    rbis: z.number().nullable(),
    hr: z.number().nullable(),
    pitch_count: z.number().nullable(),
  }),
  source_ids: z.array(z.string()),
});

// ---------------------------------------------------------------------------
// R/H/E line
// ---------------------------------------------------------------------------

export const RHESchema = z.object({
  r: z.number(),
  h: z.number(),
  e: z.number(),
});

// ---------------------------------------------------------------------------
// Prior-night result
// ---------------------------------------------------------------------------

export const PriorNightResultSchema = z.object({
  game_key: z.string(),
  final: z.object({
    away: z.string(),
    home: z.string(),
    score_away: z.number(),
    score_home: z.number(),
  }),
  rhe: z.object({
    away: RHESchema,
    home: RHESchema,
  }),
  box_score_url_ids: z.array(z.string()).optional(),
  key_events_verified: z.array(KeyEventSchema),
  team_stats_verified_if_available: z.record(z.string(), z.unknown()).optional(),
  highlights_if_available: z.array(z.unknown()).optional(),
});

// ---------------------------------------------------------------------------
// Source used
// ---------------------------------------------------------------------------

export const SourceUsedSchema = z.object({
  url: z.string(),
  source_type: z.string(),
  used_for: z.array(z.string()),
  notes: z.string(),
});

// ---------------------------------------------------------------------------
// Top-level daily bundle
// ---------------------------------------------------------------------------

export const DailyBundleSchema = z.object({
  run_date_local: z.string(),
  timezone: z.string(),
  lookback_date_local: z.string(),
  sources_used: z.array(SourceUsedSchema),
  search_queries_used: z.array(z.string()),
  upcoming_games: z.array(UpcomingGameSchema),
  prior_night_results: z.array(PriorNightResultSchema),
  narrative_pregame: z.string().nullable().optional(),
  narrative_recap: z.string().nullable().optional(),
  site_rendering_constraints: z.record(z.string(), z.unknown()).optional(),
  data_quality_notes: z.record(z.string(), z.unknown()).optional(),
});

// ---------------------------------------------------------------------------
// Inferred TypeScript types
// ---------------------------------------------------------------------------

export type BettingOdds = z.infer<typeof BettingOddsSchema>;
export type ProbablePitcher = z.infer<typeof ProbablePitcherSchema>;
export type GameTeam = z.infer<typeof GameTeamSchema>;
export type MatchupNotes = z.infer<typeof MatchupNotesSchema>;
export type UpcomingGame = z.infer<typeof UpcomingGameSchema>;
export type KeyEvent = z.infer<typeof KeyEventSchema>;
export type RHE = z.infer<typeof RHESchema>;
export type PriorNightResult = z.infer<typeof PriorNightResultSchema>;
export type SourceUsed = z.infer<typeof SourceUsedSchema>;
export type DailyBundle = z.infer<typeof DailyBundleSchema>;
