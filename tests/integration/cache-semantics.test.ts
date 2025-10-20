import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { setCacheClient } from '@lib/cache/redis';
import { prisma } from '@lib/db/prisma';

vi.mock('@prisma/client', () => {
  class PrismaClientMock {
    game = {
      findMany: vi.fn(),
      count: vi.fn(),
    };

    conference = {
      findUnique: vi.fn(),
    };

    team = {
      findMany: vi.fn(),
    };

    $queryRaw = vi.fn();
    $disconnect = vi.fn();
  }

  return {
    Prisma: {},
    PrismaClient: PrismaClientMock,
    GameStatus: {
      LIVE: 'LIVE',
      SCHEDULED: 'SCHEDULED',
      FINAL: 'FINAL',
      POSTPONED: 'POSTPONED',
      CANCELLED: 'CANCELLED',
    },
  };
});

const { getGames } = await import('@lib/api/v1/games');
const { getConferenceStandings } = await import('@lib/api/v1/conferences');

type GamesParams = Parameters<typeof getGames>[0];
type Status = NonNullable<GamesParams['status']>;

const LIVE_STATUS = 'LIVE' as Status;
const SCHEDULED_STATUS = 'SCHEDULED' as Status;

class MockRedis {
  public store = new Map<string, { value: string; ttl?: number }>();

  async get<T = string>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    return entry ? (entry.value as T) : null;
  }

  async set(key: string, value: unknown, options?: { ex?: number }): Promise<'OK'> {
    this.store.set(key, { value: value as string, ttl: options?.ex });
    return 'OK';
  }
}

describe('cache semantics', () => {
  let mockRedis: MockRedis;

  beforeEach(() => {
    mockRedis = new MockRedis();
    setCacheClient(mockRedis as any);
  });

  afterEach(() => {
    setCacheClient(null);
    vi.restoreAllMocks();
  });

  it('caches live games for 60 seconds', async () => {
    const game = {
      id: 'live-1',
      status: LIVE_STATUS,
      scheduledAt: new Date(),
    } as any;

    vi.spyOn(prisma.game, 'findMany').mockResolvedValue([game]);
    vi.spyOn(prisma.game, 'count').mockResolvedValue(1);

    const response = await getGames({ status: LIVE_STATUS });

    expect(response.games).toHaveLength(1);
    expect(prisma.game.findMany).toHaveBeenCalledTimes(1);

    const entries = Array.from(mockRedis.store.values());
    expect(entries).toHaveLength(1);
    expect(entries[0]?.ttl).toBe(60);

    await getGames({ status: LIVE_STATUS });
    expect(prisma.game.findMany).toHaveBeenCalledTimes(1);
  });

  it('caches non-live games for 5 minutes and reuses the cache', async () => {
    const game = {
      id: 'scheduled-1',
      status: SCHEDULED_STATUS,
      scheduledAt: new Date(),
    } as any;

    vi.spyOn(prisma.game, 'findMany').mockResolvedValue([game]);
    vi.spyOn(prisma.game, 'count').mockResolvedValue(1);

    await getGames({ status: SCHEDULED_STATUS });

    const entries = Array.from(mockRedis.store.values());
    expect(entries[0]?.ttl).toBe(300);

    await getGames({ status: SCHEDULED_STATUS });
    expect(prisma.game.findMany).toHaveBeenCalledTimes(1);
  });

  it('caches conference standings for four hours', async () => {
    const season = 2025;

    prisma.conference.findUnique.mockResolvedValue({
      id: 'sec',
      name: 'Southeastern Conference',
      slug: 'sec',
      shortName: 'SEC',
    } as any);

    prisma.team.findMany.mockResolvedValue([
      {
        id: 'lsu',
        name: 'LSU Tigers',
        slug: 'lsu',
        school: 'Louisiana State University',
        abbreviation: 'LSU',
        logoUrl: 'https://example.com/lsu.svg',
        teamStats: [
          {
            season,
            wins: 10,
            losses: 2,
            confWins: 4,
            confLosses: 1,
            runsScored: 78,
            runsAllowed: 35,
            pythagWins: 9.2,
            rpi: 0.64,
            strengthOfSched: 0.58,
          },
        ],
        homeGames: [
          { homeScore: 6, awayScore: 3 },
          { homeScore: 4, awayScore: 2 },
        ],
        awayGames: [
          { homeScore: 1, awayScore: 3 },
          { homeScore: 5, awayScore: 7 },
        ],
      },
    ] as any);

    const standings = await getConferenceStandings('sec', { season });

    expect(standings?.conference.slug).toBe('sec');
    expect(standings?.standings).toHaveLength(1);

    const entries = Array.from(mockRedis.store.values());
    expect(entries[0]?.ttl).toBe(4 * 60 * 60);
  });
});
