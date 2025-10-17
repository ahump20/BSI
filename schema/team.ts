import { z } from 'zod';

export const TeamSchema = z.object({
  id: z.string().min(1, 'team id is required'),
  provider: z.enum(['highlightly', 'sportsradar']).optional(),
  sport: z.literal('baseball'),
  league: z.string().min(1, 'league is required'),
  name: z.string().min(1, 'team name is required'),
  market: z.string().optional(),
  nickname: z.string().optional(),
  abbreviation: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export type Team = z.infer<typeof TeamSchema>;
