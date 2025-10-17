import { z } from 'zod';

export const GameStatusSchema = z.enum([
  'scheduled',
  'in_progress',
  'delayed',
  'final',
  'postponed',
  'cancelled',
]);

export const GameSchema = z.object({
  id: z.string().min(1, 'game id is required'),
  provider: z.enum(['highlightly', 'sportsradar']),
  sport: z.literal('baseball'),
  league: z.string().min(1, 'league is required'),
  season: z.string().min(1, 'season is required'),
  scheduled: z.string().datetime(),
  status: GameStatusSchema,
  homeTeamId: z.string().min(1),
  awayTeamId: z.string().min(1),
  venue: z
    .object({
      name: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
    })
    .optional(),
  metadata: z.record(z.any()).optional(),
});

export type Game = z.infer<typeof GameSchema>;
export type GameStatus = z.infer<typeof GameStatusSchema>;
