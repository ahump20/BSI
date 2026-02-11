import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock helpers (same pattern as index.test.ts)
// ---------------------------------------------------------------------------

function createMockD1() {
  return {
    prepare: vi.fn().mockReturnValue({
      first: vi.fn().mockResolvedValue(null),
      all: vi.fn().mockResolvedValue({ results: [] }),
      bind: vi.fn().mockReturnThis(),
      run: vi.fn().mockResolvedValue({ success: true }),
    }),
  };
}

function createMockKV() {
  const store = new Map<string, string>();
  return {
    put: vi.fn(async (key: string, value: string) => { store.set(key, value); }),
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    delete: vi.fn(async (key: string) => { store.delete(key); }),
    list: vi.fn(async () => ({ keys: [] })),
  };
}

function createMockEnv(overrides: Record<string, unknown> = {}) {
  return {
    DB: createMockD1(),
    KV: createMockKV(),
    CACHE: {} as any,
    PORTAL_POLLER: {} as any,
    ASSETS_BUCKET: {} as any,
    ENVIRONMENT: 'test',
    API_VERSION: '1.0.0-test',
    PAGES_ORIGIN: 'https://test.pages.dev',
    RAPIDAPI_KEY: 'test-key',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// ESPN mock response builders
// ---------------------------------------------------------------------------

function espnScoreboardResponse(sport: string) {
  return {
    events: [
      {
        id: '401001',
        name: 'Team A at Team B',
        shortName: 'TA @ TB',
        date: '2026-02-11T19:00Z',
        status: {
          type: { id: '3', name: 'STATUS_FINAL', state: 'post', completed: true, description: 'Final', detail: 'Final', shortDetail: 'Final' },
          period: 9,
          displayClock: '0:00',
        },
        competitions: [
          {
            competitors: [
              {
                id: '1',
                team: { id: '1', displayName: 'Team B', abbreviation: 'TB', shortDisplayName: 'Team B' },
                score: '5',
                homeAway: 'home',
                winner: true,
                records: [{ summary: '50-30' }],
              },
              {
                id: '2',
                team: { id: '2', displayName: 'Team A', abbreviation: 'TA', shortDisplayName: 'Team A' },
                score: '3',
                homeAway: 'away',
                winner: false,
                records: [{ summary: '45-35' }],
              },
            ],
            venue: { fullName: 'Test Stadium' },
          },
        ],
      },
    ],
  };
}

function espnStandingsResponse(sport: string) {
  return {
    children: [
      {
        name: sport === 'nfl' ? 'AFC' : sport === 'cfb' ? 'SEC' : 'American League',
        abbreviation: sport === 'nfl' ? 'AFC' : sport === 'cfb' ? 'SEC' : 'AL',
        standings: {
          entries: [
            {
              team: {
                id: '1',
                displayName: 'Test Team',
                abbreviation: 'TT',
                logos: [{ href: 'https://test.com/logo.png' }],
              },
              stats: [
                { name: 'wins', value: 10 },
                { name: 'losses', value: 5 },
                { name: 'winPercent', value: 0.667 },
                { name: 'pointsFor', value: 350 },
                { name: 'pointsAgainst', value: 280 },
                { name: 'differential', value: 70 },
                { name: 'streak', displayValue: 'W3' },
              ],
            },
          ],
        },
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Critical API route tests', () => {
  let env: ReturnType<typeof createMockEnv>;
  let worker: { fetch: (request: Request, env: any) => Promise<Response> };
  let originalFetch: typeof globalThis.fetch;

  beforeEach(async () => {
    env = createMockEnv();
    worker = await import('../../workers/index');
    if ('default' in worker) {
      worker = (worker as any).default;
    }
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  // -----------------------------------------------------------------------
  // MLB Scores
  // -----------------------------------------------------------------------

  describe('GET /api/mlb/scores', () => {
    it('returns games array with expected shape', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(espnScoreboardResponse('mlb')), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const req = new Request('https://blazesportsintel.com/api/mlb/scores');
      const res = await worker.fetch(req, env);
      const body = await res.json() as any;

      expect(res.status).toBe(200);
      expect(body).toHaveProperty('games');
      expect(Array.isArray(body.games)).toBe(true);
    });

    it('includes Cache-Control header', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(espnScoreboardResponse('mlb')), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const req = new Request('https://blazesportsintel.com/api/mlb/scores');
      const res = await worker.fetch(req, env);

      expect(res.headers.get('Cache-Control')).toBeTruthy();
    });

    it('caches to KV on first request', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(espnScoreboardResponse('mlb')), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const req = new Request('https://blazesportsintel.com/api/mlb/scores');
      await worker.fetch(req, env);

      expect(env.KV.put).toHaveBeenCalled();
    });

    it('returns X-Cache: MISS on first request', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(espnScoreboardResponse('mlb')), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const req = new Request('https://blazesportsintel.com/api/mlb/scores');
      const res = await worker.fetch(req, env);

      expect(res.headers.get('X-Cache')).toBe('MISS');
    });

    it('accepts date query parameter', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(espnScoreboardResponse('mlb')), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const req = new Request('https://blazesportsintel.com/api/mlb/scores?date=2026-02-10');
      const res = await worker.fetch(req, env);

      expect(res.status).toBe(200);
    });

    it('returns fallback on ESPN failure', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('ESPN unavailable'));

      const req = new Request('https://blazesportsintel.com/api/mlb/scores');
      const res = await worker.fetch(req, env);
      const body = await res.json() as any;

      // safeESPN returns { games: [], meta: { error: ... } }
      expect(res.status).toBe(502);
      expect(body).toHaveProperty('games');
      expect(body).toHaveProperty('meta');
      expect(body.meta).toHaveProperty('error');
    });
  });

  // -----------------------------------------------------------------------
  // MLB Standings
  // -----------------------------------------------------------------------

  describe('GET /api/mlb/standings', () => {
    it('returns standings array', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(espnStandingsResponse('mlb')), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const req = new Request('https://blazesportsintel.com/api/mlb/standings');
      const res = await worker.fetch(req, env);
      const body = await res.json() as any;

      expect(res.status).toBe(200);
      expect(body).toHaveProperty('standings');
      expect(Array.isArray(body.standings)).toBe(true);
    });

    it('includes Cache-Control for standings', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(espnStandingsResponse('mlb')), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const req = new Request('https://blazesportsintel.com/api/mlb/standings');
      const res = await worker.fetch(req, env);

      expect(res.headers.get('Cache-Control')).toBeTruthy();
    });

    it('caches standings to KV', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(espnStandingsResponse('mlb')), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const req = new Request('https://blazesportsintel.com/api/mlb/standings');
      await worker.fetch(req, env);

      expect(env.KV.put).toHaveBeenCalled();
    });

    it('returns fallback on ESPN failure', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('ESPN unavailable'));

      const req = new Request('https://blazesportsintel.com/api/mlb/standings');
      const res = await worker.fetch(req, env);
      const body = await res.json() as any;

      expect(res.status).toBe(502);
      expect(body).toHaveProperty('standings');
      expect(body).toHaveProperty('meta');
    });
  });

  // -----------------------------------------------------------------------
  // NFL Standings
  // -----------------------------------------------------------------------

  describe('GET /api/nfl/standings', () => {
    it('returns standings array', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(espnStandingsResponse('nfl')), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const req = new Request('https://blazesportsintel.com/api/nfl/standings');
      const res = await worker.fetch(req, env);
      const body = await res.json() as any;

      expect(res.status).toBe(200);
      expect(body).toHaveProperty('standings');
      expect(Array.isArray(body.standings)).toBe(true);
    });

    it('standings entries have conference/division data', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(espnStandingsResponse('nfl')), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const req = new Request('https://blazesportsintel.com/api/nfl/standings');
      const res = await worker.fetch(req, env);
      const body = await res.json() as any;

      if (body.standings.length > 0) {
        const conference = body.standings[0];
        expect(conference).toHaveProperty('name');
        // NFL standings use divisions array, not teams
        expect(conference).toHaveProperty('divisions');
      }
    });

    it('returns fallback on ESPN failure', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('ESPN unavailable'));

      const req = new Request('https://blazesportsintel.com/api/nfl/standings');
      const res = await worker.fetch(req, env);
      const body = await res.json() as any;

      expect(res.status).toBe(502);
      expect(body).toHaveProperty('standings');
    });
  });

  // -----------------------------------------------------------------------
  // NBA Scoreboard
  // -----------------------------------------------------------------------

  describe('GET /api/nba/scoreboard', () => {
    it('returns games array', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(espnScoreboardResponse('nba')), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const req = new Request('https://blazesportsintel.com/api/nba/scoreboard');
      const res = await worker.fetch(req, env);
      const body = await res.json() as any;

      expect(res.status).toBe(200);
      expect(body).toHaveProperty('games');
      expect(Array.isArray(body.games)).toBe(true);
    });

    it('also responds on /api/nba/scores alias', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(espnScoreboardResponse('nba')), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const req = new Request('https://blazesportsintel.com/api/nba/scores');
      const res = await worker.fetch(req, env);
      const body = await res.json() as any;

      expect(res.status).toBe(200);
      expect(body).toHaveProperty('games');
    });

    it('accepts date parameter', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(espnScoreboardResponse('nba')), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const req = new Request('https://blazesportsintel.com/api/nba/scoreboard?date=2026-02-10');
      const res = await worker.fetch(req, env);

      expect(res.status).toBe(200);
    });

    it('returns fallback on ESPN failure', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('ESPN unavailable'));

      const req = new Request('https://blazesportsintel.com/api/nba/scoreboard');
      const res = await worker.fetch(req, env);
      const body = await res.json() as any;

      expect(res.status).toBe(502);
      expect(body).toHaveProperty('games');
      expect(body).toHaveProperty('meta');
    });
  });

  // -----------------------------------------------------------------------
  // College Baseball Schedule
  // -----------------------------------------------------------------------

  describe('GET /api/college-baseball/schedule', () => {
    it('returns 200 with data structure', async () => {
      // College baseball uses a different client (NcaaApiClient), not ESPN
      // Mock its fetch to return schedule data
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({
          data: [
            { id: '1', date: '2026-02-11', status: 'scheduled', home: 'Texas', away: 'LSU' },
          ],
          totalCount: 1,
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const req = new Request('https://blazesportsintel.com/api/college-baseball/schedule');
      const res = await worker.fetch(req, env);

      expect(res.status).toBe(200);
      const body = await res.json() as any;
      // Should have data array or a wrapped response
      expect(body).toBeDefined();
    });

    it('accepts date and range params', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: [], totalCount: 0 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const req = new Request('https://blazesportsintel.com/api/college-baseball/schedule?date=2026-02-11&range=day');
      const res = await worker.fetch(req, env);

      expect(res.status).toBe(200);
    });

    it('returns valid response on client failure', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('NCAA API down'));

      const req = new Request('https://blazesportsintel.com/api/college-baseball/schedule');
      const res = await worker.fetch(req, env);

      // Should return 502 or a fallback rather than 500
      expect([200, 502]).toContain(res.status);
      const body = await res.json() as any;
      expect(body).toBeDefined();
    });
  });

  // -----------------------------------------------------------------------
  // Cross-cutting: CORS on sport routes
  // -----------------------------------------------------------------------

  describe('CORS on sport API routes', () => {
    it('MLB scores returns CORS headers for blazesportsintel.com', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(espnScoreboardResponse('mlb')), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const req = new Request('https://blazesportsintel.com/api/mlb/scores', {
        headers: { Origin: 'https://blazesportsintel.com' },
      });
      const res = await worker.fetch(req, env);

      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://blazesportsintel.com');
    });
  });
});
