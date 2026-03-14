import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { handleHeroScores } from '../../workers/handlers/hero-scores';

function createMockKV() {
  const store = new Map<string, string>();
  return {
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    put: vi.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
  };
}

describe('/api/hero-scores', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-13T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('aggregates live, scheduled, and final games across in-season sports', async () => {
    const env = { KV: createMockKV() } as any;

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL | Request) => {
        const url = typeof input === 'string' ? new URL(input) : input instanceof URL ? input : new URL(input.url);

        if (url.pathname === '/api/college-baseball/scores') {
          return new Response(
            JSON.stringify({
              data: [
                {
                  competitions: [
                    {
                      competitors: [
                        { homeAway: 'home', score: '5', team: { displayName: 'Texas', abbreviation: 'TEX' } },
                        { homeAway: 'away', score: '4', team: { displayName: 'LSU', abbreviation: 'LSU' } },
                      ],
                      status: { type: { state: 'in', shortDetail: 'Top 8th' } },
                    },
                  ],
                },
              ],
            }),
          );
        }

        if (url.pathname === '/api/mlb/scores') {
          return new Response(
            JSON.stringify({
              games: [
                {
                  teams: {
                    home: { team: { displayName: 'Cardinals', abbreviation: 'STL' }, score: 0 },
                    away: { team: { displayName: 'Cubs', abbreviation: 'CHC' }, score: 0 },
                  },
                  status: { detailedState: 'Scheduled', startTime: '7:10 PM CT' },
                },
              ],
            }),
          );
        }

        if (url.pathname === '/api/nba/scoreboard') {
          return new Response(
            JSON.stringify({
              games: [
                {
                  teams: {
                    home: { team: { displayName: 'Spurs', abbreviation: 'SAS' }, score: 112 },
                    away: { team: { displayName: 'Suns', abbreviation: 'PHX' }, score: 108 },
                  },
                  status: { isFinal: true, detailedState: 'Final' },
                },
              ],
            }),
          );
        }

        return new Response('{}', { status: 404 });
      }),
    );

    const response = await handleHeroScores(new URL('https://blazesportsintel.com/api/hero-scores'), env);
    const body = await response.json() as {
      liveNow: { sport: string; home: { abbreviation: string } };
      nextUp: { sport: string; away: { abbreviation: string } };
      recentFinal: { sport: string; home: { abbreviation: string } };
      empty: boolean;
      meta: { source: string; timezone: string };
    };

    expect(body.liveNow).toMatchObject({ sport: 'College Baseball', home: { abbreviation: 'TEX' } });
    expect(body.nextUp).toMatchObject({ sport: 'MLB', away: { abbreviation: 'CHC' } });
    expect(body.recentFinal).toMatchObject({ sport: 'NBA', home: { abbreviation: 'SAS' } });
    expect(body.empty).toBe(false);
    expect(body.meta).toMatchObject({
      source: 'hero-scores-aggregator',
      timezone: 'America/Chicago',
    });
  });
});
