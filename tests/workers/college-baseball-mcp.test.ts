import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockKV, createMockEnv, ESPN_GAME_SUMMARY } from '../utils/mocks';

const MATCH_ID = '401234567';

const HIGHLIGHTLY_MATCH_DETAIL = {
  id: Number(MATCH_ID),
  date: '2026-04-15T18:00:00Z',
  season: '2026',
  round: 'Regular Season',
  homeTeam: {
    id: 2633,
    displayName: 'Texas Longhorns',
    abbreviation: 'TEX',
    logo: 'https://cdn.example.com/texas.png',
  },
  awayTeam: {
    id: 2641,
    displayName: 'Texas A&M Aggies',
    abbreviation: 'TAMU',
    logo: 'https://cdn.example.com/tamu.png',
  },
  state: {
    description: 'Final',
    report: 'Final',
    score: {
      current: '3 - 7',
      home: {
        hits: 10,
        errors: 1,
        innings: [2, 0, 3, 0, 2],
      },
      away: {
        hits: 5,
        errors: 2,
        innings: [0, 1, 0, 2, 0],
      },
    },
  },
  venue: {
    name: 'UFCU Disch-Falk Field',
    city: 'Austin',
    state: 'TX',
  },
  forecast: {
    status: 'Clear',
    temperature: 72,
  },
  predictions: {
    prematch: [
      {
        description: 'Win probability',
        probabilities: { home: 0.64, away: 0.36 },
        generatedAt: '2026-04-15T17:55:00Z',
      },
    ],
    live: [
      {
        description: 'Live win probability',
        probabilities: { home: 0.93, away: 0.07 },
        generatedAt: '2026-04-15T20:15:00Z',
      },
    ],
  },
  plays: [
    {
      inning: 5,
      half: 'bottom',
      description: 'Texas plates two on a double into the gap.',
    },
  ],
  stats: [
    {
      teamId: 2633,
      name: 'Runs',
      value: 7,
    },
  ],
};

const HIGHLIGHTLY_SCOREBOARD_MATCH = {
  id: Number(MATCH_ID),
  date: '2026-04-15T18:00:00Z',
  season: '2026',
  round: 'Regular Season',
  homeTeam: HIGHLIGHTLY_MATCH_DETAIL.homeTeam,
  awayTeam: HIGHLIGHTLY_MATCH_DETAIL.awayTeam,
  state: HIGHLIGHTLY_MATCH_DETAIL.state,
  venue: HIGHLIGHTLY_MATCH_DETAIL.venue,
};

const ESPN_SCOREBOARD = {
  events: [
    {
      id: '501999999',
      date: '2026-04-15T18:00:00Z',
      competitions: [
        {
          date: '2026-04-15T18:00:00Z',
          competitors: [
            {
              homeAway: 'home',
              team: {
                id: '2633',
                displayName: 'Texas Longhorns',
                name: 'Texas Longhorns',
                abbreviation: 'TEX',
              },
            },
            {
              homeAway: 'away',
              team: {
                id: '2641',
                displayName: 'Texas A&M Aggies',
                name: 'Texas A&M Aggies',
                abbreviation: 'TAMU',
              },
            },
          ],
        },
      ],
    },
  ],
};

function mockMatchDetailFetch(mode: 'highlightly-success' | 'espn-fallback' | 'scores-fallback') {
  return vi.fn(async (url: string | URL | Request) => {
    const urlStr =
      typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;

    if (urlStr.includes('baseball.highlightly.net/matches/')) {
      if (mode === 'highlightly-success') {
        return new Response(JSON.stringify(HIGHLIGHTLY_MATCH_DETAIL), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response('Unauthorized', { status: 401 });
    }

    if (urlStr.includes('baseball.highlightly.net/matches?league=NCAA&date=')) {
      return new Response(JSON.stringify({ data: [HIGHLIGHTLY_SCOREBOARD_MATCH] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (urlStr.includes('site.api.espn.com') && urlStr.includes('/scoreboard')) {
      if (mode === 'scores-fallback') {
        return new Response(JSON.stringify({ events: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify(ESPN_SCOREBOARD), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (urlStr.includes('site.api.espn.com') && urlStr.includes('/summary?event=')) {
      if (mode === 'scores-fallback') {
        return new Response('Not found', { status: 404 });
      }
      return new Response(JSON.stringify(ESPN_GAME_SUMMARY), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as unknown as typeof fetch;
}

function mockProxyScoreboardFallback() {
  return vi.fn(async (url: string | URL | Request) => {
    const urlStr =
      typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;

    if (urlStr.includes('baseball.highlightly.net/matches/')) {
      return new Response('Unauthorized', { status: 401 });
    }

    if (urlStr.includes('baseball.highlightly.net/matches?league=NCAA&date=')) {
      return new Response('Unauthorized', { status: 401 });
    }

    if (urlStr.includes('blazesportsintel.com/api/college-baseball/scores?date=')) {
      return new Response(JSON.stringify({ data: [HIGHLIGHTLY_SCOREBOARD_MATCH] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (urlStr.includes('site.api.espn.com') && urlStr.includes('/scoreboard')) {
      return new Response(JSON.stringify(ESPN_SCOREBOARD), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (urlStr.includes('site.api.espn.com') && urlStr.includes('/summary?event=')) {
      return new Response(JSON.stringify(ESPN_GAME_SUMMARY), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as unknown as typeof fetch;
}

describe('college-baseball MCP match detail endpoint', () => {
  let env: ReturnType<typeof createMockEnv> & { TEAM_STATS_KV: ReturnType<typeof createMockKV> };
  let worker: { fetch: (request: Request, env: unknown) => Promise<Response> };
  let originalFetch: typeof globalThis.fetch;

  beforeEach(async () => {
    env = {
      ...createMockEnv({
        HIGHLIGHTLY_API_KEY: 'test-highlightly-key',
      }),
      TEAM_STATS_KV: createMockKV(),
    };
    worker = await import('../../workers/college-baseball-mcp/src/worker');
    if ('default' in worker) worker = (worker as { default: typeof worker }).default;
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('returns full Highlightly match detail when Highlightly succeeds', async () => {
    globalThis.fetch = mockMatchDetailFetch('highlightly-success');

    const response = await worker.fetch(
      new Request(`https://sabermetrics.blazesportsintel.com/v1/matches/${MATCH_ID}`),
      env
    );
    const body = await response.json() as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body.meta).toMatchObject({ source: 'highlightly' });
    expect(body).toHaveProperty('weather');
    expect(body).toHaveProperty('predictions');
    expect(body).toHaveProperty('plays');
    expect(body).toHaveProperty('teamStats');
    expect((body.home as Record<string, unknown>).name).toBe('Texas Longhorns');
    expect((body.away as Record<string, unknown>).name).toBe('Texas A&M Aggies');
  });

  it('falls back to ESPN summary and returns degraded 200 when Highlightly detail 401s', async () => {
    globalThis.fetch = mockMatchDetailFetch('espn-fallback');

    const response = await worker.fetch(
      new Request(`https://sabermetrics.blazesportsintel.com/v1/matches/${MATCH_ID}`),
      env
    );
    const body = await response.json() as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body.meta).toMatchObject({
      source: 'espn-fallback',
      degraded: true,
    });
    expect(body.weather).toBeNull();
    expect(body.predictions).toEqual({ prematch: [], live: [] });
    expect(body.plays).toEqual([]);
    expect(body.teamStats).toEqual([]);
    expect((body.home as Record<string, unknown>).score).toBe(7);
    expect((body.away as Record<string, unknown>).score).toBe(3);
  });

  it('falls back to scoreboard-only partial detail when ESPN summary is unavailable', async () => {
    globalThis.fetch = mockMatchDetailFetch('scores-fallback');

    const response = await worker.fetch(
      new Request(`https://sabermetrics.blazesportsintel.com/v1/matches/${MATCH_ID}`),
      env
    );
    const body = await response.json() as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body.meta).toMatchObject({
      source: 'scores-cache',
      degraded: true,
    });
    expect(body.currentScore).toBe('3 - 7');
    expect(body.weather).toBeNull();
    expect(body.predictions).toEqual({ prematch: [], live: [] });
    expect(body.plays).toEqual([]);
    expect(body.teamStats).toEqual([]);
    expect((body.venue as Record<string, unknown>).name).toBe('UFCU Disch-Falk Field');
  });

  it('uses the BSI scores proxy when direct Highlightly scoreboard lookup is unavailable', async () => {
    globalThis.fetch = mockProxyScoreboardFallback();

    const response = await worker.fetch(
      new Request(`https://sabermetrics.blazesportsintel.com/v1/matches/${MATCH_ID}`),
      env
    );
    const body = await response.json() as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body.meta).toMatchObject({
      source: 'espn-fallback',
      degraded: true,
    });
    expect((body.home as Record<string, unknown>).name).toBe('Texas Longhorns');
    expect((body.away as Record<string, unknown>).name).toBe('Texas A&M Aggies');
  });

  it('keeps fallback responses on the same top-level contract as full Highlightly detail', async () => {
    globalThis.fetch = mockMatchDetailFetch('highlightly-success');
    const successResponse = await worker.fetch(
      new Request(`https://sabermetrics.blazesportsintel.com/v1/matches/${MATCH_ID}`),
      env
    );
    const successBody = await successResponse.json() as Record<string, unknown>;

    globalThis.fetch = mockMatchDetailFetch('espn-fallback');
    const fallbackResponse = await worker.fetch(
      new Request(`https://sabermetrics.blazesportsintel.com/v1/matches/${MATCH_ID}`),
      env
    );
    const fallbackBody = await fallbackResponse.json() as Record<string, unknown>;

    expect(Object.keys(fallbackBody).sort()).toEqual(Object.keys(successBody).sort());
  });
});
