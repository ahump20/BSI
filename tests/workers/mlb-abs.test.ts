import { describe, expect, it, vi } from 'vitest';

import { handleMLBAbs } from '../../workers/handlers/mlb';

function createMockEnv() {
  return {
    KV: {
      get: vi.fn(async () => null),
    },
    DB: {
      prepare: vi.fn((sql: string) => ({
        all: vi.fn(async () => {
          if (sql.includes('challenge_role as role')) {
            return {
              results: [
                { role: 'manager', challenges: 10, overturned: 4 },
                { role: 'batter', challenges: 5, overturned: 2 },
              ],
            };
          }

          return {
            results: [
              {
                game_id: 'game-1',
                date: '2026-03-13T02:00:00Z',
                away: 'Texas',
                home: 'LSU',
                totalChallenges: 3,
                overturned: 1,
              },
            ],
          };
        }),
      })),
    },
  };
}

describe('/api/mlb/abs', () => {
  it('returns aggregated ABS challenge data with sportradar attribution', async () => {
    const response = await handleMLBAbs(createMockEnv() as any);
    const body = await response.json() as {
      challengesByRole: Array<{ role: string; successRate: number }>;
      recentGames: Array<{ gameId: string; away: string; home: string }>;
      umpireAccuracy: Array<{ label: string; accuracy: number }>;
      meta: { source: string; timezone: string };
    };

    expect(response.status).toBe(200);
    expect(body.challengesByRole).toMatchObject([
      { role: 'manager', successRate: 40 },
      { role: 'batter', successRate: 40 },
    ]);
    expect(body.recentGames).toMatchObject([
      { gameId: 'game-1', away: 'Texas', home: 'LSU' },
    ]);
    expect(body.umpireAccuracy[2].accuracy).toBeGreaterThan(94);
    expect(body.meta).toMatchObject({
      source: 'sportradar',
      timezone: 'America/Chicago',
    });
  });
});
