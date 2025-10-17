import { z } from 'zod';

export const PlayerSchema = z.object({
  id: z.string().min(1, 'player id is required'),
  teamId: z.string().min(1, 'team id is required'),
  provider: z.enum(['highlightly', 'sportsradar']).optional(),
  firstName: z.string().min(1, 'first name is required'),
  lastName: z.string().min(1, 'last name is required'),
  fullName: z.string().optional(),
  position: z.string().optional(),
  jerseyNumber: z.string().optional(),
  bats: z.enum(['L', 'R', 'S']).optional(),
  throws: z.enum(['L', 'R']).optional(),
  metadata: z.record(z.any()).optional(),
});

export type Player = z.infer<typeof PlayerSchema>;
