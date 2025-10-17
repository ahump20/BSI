import { z } from 'zod';
import { GameSchema } from './game.js';
import { TeamSchema } from './team.js';
import { PlayerSchema } from './player.js';

export const PlayerBattingLineSchema = z.object({
  atBats: z.number().int().nonnegative().optional(),
  runs: z.number().int().nonnegative().optional(),
  hits: z.number().int().nonnegative().optional(),
  doubles: z.number().int().nonnegative().optional(),
  triples: z.number().int().nonnegative().optional(),
  homeRuns: z.number().int().nonnegative().optional(),
  rbi: z.number().int().nonnegative().optional(),
  walks: z.number().int().nonnegative().optional(),
  strikeOuts: z.number().int().nonnegative().optional(),
  stolenBases: z.number().int().nonnegative().optional(),
});

export const PlayerPitchingLineSchema = z.object({
  inningsPitched: z.number().nonnegative().optional(),
  hits: z.number().int().nonnegative().optional(),
  runs: z.number().int().nonnegative().optional(),
  earnedRuns: z.number().int().nonnegative().optional(),
  walks: z.number().int().nonnegative().optional(),
  strikeOuts: z.number().int().nonnegative().optional(),
  pitches: z.number().int().nonnegative().optional(),
});

export const PlayerFieldingLineSchema = z.object({
  assists: z.number().int().nonnegative().optional(),
  putOuts: z.number().int().nonnegative().optional(),
  errors: z.number().int().nonnegative().optional(),
});

export const PlayerStatLineSchema = z.object({
  player: PlayerSchema,
  batting: PlayerBattingLineSchema.optional(),
  pitching: PlayerPitchingLineSchema.optional(),
  fielding: PlayerFieldingLineSchema.optional(),
});

export const TeamBoxScoreSchema = z.object({
  team: TeamSchema,
  scoreByInning: z.array(z.number().int().nonnegative()).optional(),
  totals: z
    .object({
      runs: z.number().int().nonnegative().optional(),
      hits: z.number().int().nonnegative().optional(),
      errors: z.number().int().nonnegative().optional(),
    })
    .optional(),
  batters: z.array(PlayerStatLineSchema).optional(),
  pitchers: z.array(PlayerStatLineSchema).optional(),
  lastUpdated: z.string().datetime().optional(),
});

export const BoxScoreSchema = z.object({
  game: GameSchema,
  teams: z.object({
    home: TeamBoxScoreSchema,
    away: TeamBoxScoreSchema,
  }),
  source: z.enum(['highlightly', 'sportsradar']),
  lastUpdated: z.string().datetime(),
});

export type PlayerBattingLine = z.infer<typeof PlayerBattingLineSchema>;
export type PlayerPitchingLine = z.infer<typeof PlayerPitchingLineSchema>;
export type PlayerFieldingLine = z.infer<typeof PlayerFieldingLineSchema>;
export type PlayerStatLine = z.infer<typeof PlayerStatLineSchema>;
export type TeamBoxScore = z.infer<typeof TeamBoxScoreSchema>;
export type BoxScore = z.infer<typeof BoxScoreSchema>;
