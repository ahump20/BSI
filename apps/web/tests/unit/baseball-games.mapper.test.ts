import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/cache', () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => (...args: unknown[]) => fn(...args)
}));

const { findMany } = vi.hoisted(() => ({
  findMany: vi.fn()
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    game: {
      findMany
    }
  }
}));

import {
  buildFallbackGamesPayload,
  getD1BaseballGames,
  mapGameRecord,
  type BaseballGame
} from '@/lib/baseball/games';

const createRawGame = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'game-1',
  slug: 'game-1',
  startTime: new Date('2024-03-10T18:00:00Z'),
  status: 'LIVE',
  inning: 7,
  inningHalf: 'BOTTOM',
  outs: 2,
  leverageIndex: 3.2,
  subscriptionTier: 'diamond_pro',
  homeTeam: {
    id: 'home',
    name: 'Home Team',
    shortName: 'HOME',
    record: '20-5',
    logo: null,
    conference: 'SEC'
  },
  awayTeam: {
    id: 'away',
    name: 'Away Team',
    shortName: 'AWAY',
    record: '18-7',
    logo: null,
    conference: 'SEC'
  },
  teamStats: [
    {
      id: 'home-stat',
      teamId: 'home',
      runs: 4,
      hits: 7,
      errors: 0,
      leverageIndex: 2.8,
      bullpenWhip: 1.1,
      stolenBaseAttempts: 12,
      stolenBaseSuccess: 9,
      aggressionIndex: 1.15,
      recentForm: 'W5'
    },
    {
      id: 'away-stat',
      teamId: 'away',
      runs: 3,
      hits: 6,
      errors: 1,
      leverageIndex: 3.5,
      bullpenWhip: 1.25,
      aggressionIndex: 0.92,
      recentForm: '3-2'
    }
  ],
  plays: [
    {
      id: 'play-1',
      description: 'Doe doubles to left, Smith scores',
      createdAt: new Date('2024-03-10T19:05:00Z'),
      leverageIndex: 3.8
    }
  ],
  updatedAt: new Date('2024-03-10T19:10:00Z'),
  ...overrides
});

describe('mapGameRecord', () => {
  it('maps an in-progress game with leverage and inning state', () => {
    const game = mapGameRecord(createRawGame());

    expect(game.status).toBe('LIVE');
    expect(game.statusLabel).toBe('Bottom 7 · 2 outs');
    expect(game.leverageIndex).toBeCloseTo(3.2);
    expect(game.inningState).toEqual({ inning: 7, half: 'BOTTOM', outs: 2 });
    expect(game.home.tendencies.length).toBeGreaterThan(0);
    expect(game.plays).toHaveLength(1);
  });

  it('normalises final status and clears leverage when absent', () => {
    const raw = createRawGame({
      status: 'FINAL',
      leverageIndex: null,
      inning: null,
      inningHalf: null,
      plays: []
    });
    const game = mapGameRecord(raw);

    expect(game.status).toBe('FINAL');
    expect(game.statusLabel).toBe('Final');
    expect(game.leverageIndex).toBeCloseTo(2.8);
    expect(game.plays).toHaveLength(0);
  });

  it('maps postponed games with templated label', () => {
    const raw = createRawGame({ status: 'POSTPONED', statusText: undefined, inning: null, outs: null });
    const game = mapGameRecord(raw);

    expect(game.status).toBe('POSTPONED');
    expect(game.statusLabel).toBe('Postponed');
    expect(game.home.runs).toBe(4);
  });
});

describe('getD1BaseballGames', () => {
  beforeEach(() => {
    findMany.mockReset();
  });

  it('queries prisma within the rolling window and maps results', async () => {
    const raw = createRawGame();
    findMany.mockResolvedValueOnce([raw]);

    const response = await getD1BaseballGames({ referenceDate: new Date('2024-03-11T00:00:00Z') });

    expect(findMany).toHaveBeenCalledTimes(1);
    const args = findMany.mock.calls[0][0];
    expect(args.where).toMatchObject({ sport: 'BASEBALL', division: 'D1' });
    expect(response.games).toHaveLength(1);
    expect(response.games[0].id).toBe(raw.id);
  });
});

describe('buildFallbackGamesPayload', () => {
  it('generates templated live, final, and postponed payloads', () => {
    const payload = buildFallbackGamesPayload(new Date('2024-03-15T12:00:00Z'));
    const statuses = payload.games.map((game: BaseballGame) => game.status);

    expect(statuses).toEqual(['LIVE', 'FINAL', 'POSTPONED']);
    expect(payload.games[0].subscriptionTier).toBe('diamond_pro');
    expect(payload.games[2].statusLabel).toContain('Postponed');
  });
});
