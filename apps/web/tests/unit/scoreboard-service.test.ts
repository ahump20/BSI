import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  SCOREBOARD_TTL_SECONDS,
  buildCacheKey,
  getScoreboardData,
  normalizeEspnScoreboard,
  ScoreboardProviderError,
  ScoreboardValidationError,
} from '../../app/api/v1/baseball/scoreboard/service';

class MockRedis {
  public store = new Map<string, unknown>();
  public set = vi.fn(async (key: string, value: unknown, _opts: { ex: number }) => {
    this.store.set(key, value);
  });
  public get = vi.fn(async <T,>(key: string): Promise<T | null> => {
    return (this.store.get(key) as T) ?? null;
  });
}

const sampleEspnScoreboard = {
  events: [
    {
      id: '401778104',
      uid: 's:1~l:14~e:401778104',
      date: '2025-06-22T18:30Z',
      links: [
        { href: 'https://www.espn.com/mlb/game/_/gameId/401778104', rel: ['gamecast'] },
        { href: 'https://www.espn.com/mlb/boxscore/_/gameId/401778104', rel: ['boxscore'] },
      ],
      competitions: [
        {
          id: '401778104',
          date: '2025-06-22T18:30Z',
          status: {
            period: 9,
            type: {
              state: 'post',
              completed: true,
              detail: 'Final',
              shortDetail: 'Final',
              description: 'Final',
            },
          },
          broadcasts: [{ names: ['ESPN+'] }],
          venue: {
            fullName: 'Charles Schwab Field',
            address: {
              city: 'Omaha',
              state: 'NE',
            },
          },
          competitors: [
            {
              homeAway: 'home',
              score: '3',
              team: {
                id: '146',
                displayName: 'Coastal Carolina Chanticleers',
                shortDisplayName: 'Coastal',
                abbreviation: 'CCU',
                logo: 'https://a.espncdn.com/logo-home.png',
              },
              records: [{ summary: '56-13' }],
              curatedRank: { current: 13 },
            },
            {
              homeAway: 'away',
              score: '5',
              team: {
                id: '85',
                displayName: 'LSU Tigers',
                shortDisplayName: 'LSU',
                abbreviation: 'LSU',
                logo: 'https://a.espncdn.com/logo-away.png',
              },
              records: [{ summary: '53-15' }],
              rank: { current: 6 },
            },
          ],
        },
      ],
    },
    {
      id: '401778104',
      uid: 's:1~l:14~e:401778104',
      date: '2025-06-22T18:30Z',
      competitions: [],
    },
  ],
  day: {
    date: '2025-06-22',
  },
};

describe('normalizeEspnScoreboard', () => {
  it('normalizes ESPN scoreboard payload into internal format', () => {
    const now = new Date('2025-06-23T00:00:00Z');
    const normalized = normalizeEspnScoreboard(sampleEspnScoreboard, {
      now,
      canonicalDate: '2025-06-22',
    });

    expect(normalized.sport).toBe('baseball');
    expect(normalized.league).toBe('ncaab');
    expect(normalized.scoreboardDate).toBe('2025-06-22');
    expect(normalized.games).toHaveLength(1);

    const game = normalized.games[0];
    expect(game.id).toBe('401778104');
    expect(game.status.state).toBe('final');
    expect(game.status.inning).toBe(9);
    expect(game.venue.name).toBe('Charles Schwab Field');
    expect(game.venue.location).toBe('Omaha, NE');
    expect(game.broadcasters).toEqual(['ESPN+']);
    expect(game.links.boxscore).toContain('boxscore');
    expect(game.teams.home.record).toBe('56-13');
    expect(game.teams.away.rank).toBe(6);
    expect(normalized.ingestionKey).toBe('401778104');
  });

  it('throws when ESPN payload is invalid', () => {
    expect(() => normalizeEspnScoreboard({ events: null }, { now: new Date() })).toThrow(ScoreboardValidationError);
  });
});

describe('getScoreboardData', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-23T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns cached payload when redis hit occurs', async () => {
    const redis = new MockRedis();
    const cacheKey = buildCacheKey('20250622');
    const cachedValue = normalizeEspnScoreboard(sampleEspnScoreboard, {
      now: new Date('2025-06-22T23:00:00Z'),
      canonicalDate: '2025-06-22',
    });
    redis.store.set(cacheKey, cachedValue);

    const result = await getScoreboardData({
      dateParam: '20250622',
      redis,
      fetchImpl: vi.fn(),
    });

    expect(result.cacheState).toBe('hit');
    expect(result.data.ingestionKey).toBe('401778104');
    expect(redis.get).toHaveBeenCalledWith(cacheKey);
    expect(result.data.fetchedAt).toBe(cachedValue.fetchedAt);
  });

  it('fetches from ESPN and caches when miss occurs', async () => {
    const redis = new MockRedis();
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => sampleEspnScoreboard,
    } as unknown as Response));

    const result = await getScoreboardData({
      dateParam: '20250622',
      redis,
      fetchImpl: fetchMock,
      now: new Date('2025-06-23T00:00:00Z'),
    });

    expect(result.cacheState).toBe('miss');
    expect(result.data.games).toHaveLength(1);
    expect(redis.set).toHaveBeenCalledTimes(1);
    expect(redis.set).toHaveBeenCalledWith(buildCacheKey('20250622'), expect.any(Object), {
      ex: SCOREBOARD_TTL_SECONDS,
    });
  });

  it('throws provider error when upstream fetch fails', async () => {
    const redis = new MockRedis();
    redis.get.mockResolvedValueOnce(null);

    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
    } as unknown as Response));

    await expect(
      getScoreboardData({
        dateParam: '20250622',
        redis,
        fetchImpl: fetchMock,
      }),
    ).rejects.toBeInstanceOf(ScoreboardProviderError);
  });
});
