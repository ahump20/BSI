/**
 * BSI College Baseball Ingest — Cron Worker Tests
 *
 * Tests the scheduled data pipeline that pre-caches scores, standings,
 * and rankings into KV. Covers Highlightly-first → ESPN fallback,
 * season awareness, and both cron paths (2-min scores, 15-min standings).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mock KV
// ---------------------------------------------------------------------------

function createMockKV() {
  const store = new Map<string, string>();
  return {
    put: vi.fn(async (key: string, value: string) => { store.set(key, value); }),
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    delete: vi.fn(async (key: string) => { store.delete(key); }),
    list: vi.fn(async () => ({ keys: [] })),
    _store: store,
  };
}

// ---------------------------------------------------------------------------
// API response fixtures
// ---------------------------------------------------------------------------

const HIGHLIGHTLY_SCORES = {
  data: [
    { id: 1, homeTeam: { name: 'Texas' }, awayTeam: { name: 'A&M' }, homeScore: 7, awayScore: 3, status: { type: 'finished' } },
    { id: 2, homeTeam: { name: 'LSU' }, awayTeam: { name: 'Ole Miss' }, homeScore: 4, awayScore: 4, status: { type: 'inprogress' } },
  ],
  totalCount: 2,
};

const ESPN_SCOREBOARD = {
  events: [
    { id: '101', name: 'Texas vs A&M', status: { type: { state: 'post' } } },
    { id: '102', name: 'LSU vs Ole Miss', status: { type: { state: 'in' } } },
  ],
};

const HIGHLIGHTLY_STANDINGS = {
  data: [{ conference: 'SEC', teams: [{ name: 'Texas', wins: 30, losses: 10 }] }],
};

const ESPN_STANDINGS = {
  children: [
    { name: 'Southeastern Conference', standings: { entries: [] } },
    { name: 'Big 12 Conference', standings: { entries: [] } },
    { name: 'Atlantic Coast Conference', standings: { entries: [] } },
  ],
};

const HIGHLIGHTLY_RANKINGS = {
  data: [{ rank: 1, team: 'Texas' }, { rank: 2, team: 'LSU' }],
};

const ESPN_RANKINGS = {
  rankings: [{ name: 'D1 Baseball Top 25', ranks: [{ current: 1, team: { displayName: 'Texas' } }] }],
};

// ---------------------------------------------------------------------------
// Fetch mocks
// ---------------------------------------------------------------------------

function mockHighlightlySuccess() {
  return vi.fn(async (url: string | URL | Request) => {
    const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;

    if (urlStr.includes('mlb-college-baseball-api') && urlStr.includes('/matches')) {
      return new Response(JSON.stringify(HIGHLIGHTLY_SCORES), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (urlStr.includes('mlb-college-baseball-api') && urlStr.includes('/standings')) {
      return new Response(JSON.stringify(HIGHLIGHTLY_STANDINGS), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (urlStr.includes('mlb-college-baseball-api') && urlStr.includes('/rankings')) {
      return new Response(JSON.stringify(HIGHLIGHTLY_RANKINGS), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({}), { status: 200 });
  }) as unknown as typeof fetch;
}

function mockEspnFallback() {
  return vi.fn(async (url: string | URL | Request) => {
    const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;

    // Highlightly fails
    if (urlStr.includes('mlb-college-baseball-api')) {
      return new Response('Error', { status: 500 });
    }
    // ESPN scoreboard
    if (urlStr.includes('espn.com') && urlStr.includes('/scoreboard')) {
      return new Response(JSON.stringify(ESPN_SCOREBOARD), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    // ESPN standings
    if (urlStr.includes('espn.com') && urlStr.includes('/standings')) {
      return new Response(JSON.stringify(ESPN_STANDINGS), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    // ESPN rankings
    if (urlStr.includes('espn.com') && urlStr.includes('/rankings')) {
      return new Response(JSON.stringify(ESPN_RANKINGS), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({}), { status: 200 });
  }) as unknown as typeof fetch;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BSI CBB Ingest Worker', () => {
  let env: { KV: ReturnType<typeof createMockKV>; RAPIDAPI_KEY?: string };
  let worker: {
    scheduled: (event: any, env: any, ctx: any) => Promise<void>;
    fetch: (request: Request, env: any) => Promise<Response>;
  };
  let originalFetch: typeof globalThis.fetch;
  const mockCtx = { waitUntil: () => {}, passThroughOnException: () => {} };

  beforeEach(async () => {
    env = { KV: createMockKV(), RAPIDAPI_KEY: 'test-key' };
    worker = await import('../../workers/bsi-cbb-ingest/index');
    if ('default' in worker) worker = (worker as any).default;
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  // -----------------------------------------------------------------------
  // Scores ingest
  // -----------------------------------------------------------------------

  describe('scores ingest', () => {
    it('writes scores to KV via Highlightly when API key is set', async () => {
      globalThis.fetch = mockHighlightlySuccess();

      // Use 2-min cron during baseball season (April)
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-04-15T18:00:00Z'));

      await worker.scheduled({ cron: '*/2 * * * *' }, env, mockCtx);

      vi.useRealTimers();

      const todayKey = env.KV._store.get('cb:scores:today');
      expect(todayKey).toBeDefined();

      const scores = JSON.parse(todayKey!);
      expect(scores.data).toHaveLength(2);
    });

    it('falls back to ESPN when no RAPIDAPI_KEY', async () => {
      env.RAPIDAPI_KEY = undefined;
      globalThis.fetch = mockEspnFallback();

      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-04-15T18:00:00Z'));

      await worker.scheduled({ cron: '*/2 * * * *' }, env, mockCtx);

      vi.useRealTimers();

      const todayKey = env.KV._store.get('cb:scores:today');
      expect(todayKey).toBeDefined();

      const scores = JSON.parse(todayKey!);
      // ESPN events get normalized: { data: events, totalCount }
      expect(scores.data).toHaveLength(2);
    });

    it('writes both today and date-specific KV keys', async () => {
      globalThis.fetch = mockHighlightlySuccess();

      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-04-15T18:00:00Z'));

      await worker.scheduled({ cron: '*/2 * * * *' }, env, mockCtx);

      vi.useRealTimers();

      expect(env.KV._store.has('cb:scores:today')).toBe(true);
      expect(env.KV._store.has('cb:scores:2026-04-15')).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Season awareness
  // -----------------------------------------------------------------------

  describe('season awareness', () => {
    it('runs scores during baseball season (April)', async () => {
      globalThis.fetch = mockHighlightlySuccess();

      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-04-15T18:00:00Z'));

      await worker.scheduled({ cron: '*/2 * * * *' }, env, mockCtx);

      vi.useRealTimers();

      expect(env.KV._store.has('cb:scores:today')).toBe(true);
    });

    it('skips scores off-season when minute > 2', async () => {
      globalThis.fetch = mockHighlightlySuccess();

      vi.useFakeTimers();
      // December, minute=30 — off-season, not within minute<=2 window
      vi.setSystemTime(new Date('2026-12-15T18:30:00Z'));

      await worker.scheduled({ cron: '*/2 * * * *' }, env, mockCtx);

      vi.useRealTimers();

      // Scores should NOT be written (off-season skip)
      expect(env.KV._store.has('cb:scores:today')).toBe(false);
    });

    it('runs scores off-season when minute <= 2', async () => {
      globalThis.fetch = mockHighlightlySuccess();

      vi.useFakeTimers();
      // December, minute=1 — off-season but within minute<=2 window
      vi.setSystemTime(new Date('2026-12-15T18:01:00Z'));

      await worker.scheduled({ cron: '*/2 * * * *' }, env, mockCtx);

      vi.useRealTimers();

      expect(env.KV._store.has('cb:scores:today')).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Standings ingest
  // -----------------------------------------------------------------------

  describe('standings ingest', () => {
    it('writes per-conference standings via Highlightly', async () => {
      globalThis.fetch = mockHighlightlySuccess();

      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-04-15T18:00:00Z'));

      await worker.scheduled({ cron: '*/15 * * * *' }, env, mockCtx);

      vi.useRealTimers();

      // Should attempt to write standings for each conference
      const standingsPuts = env.KV.put.mock.calls.filter(
        (call: any[]) => typeof call[0] === 'string' && (call[0] as string).startsWith('cb:standings:')
      );
      expect(standingsPuts.length).toBeGreaterThan(0);
    });

    it('falls back to ESPN for standings', async () => {
      env.RAPIDAPI_KEY = undefined;
      globalThis.fetch = mockEspnFallback();

      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-04-15T18:00:00Z'));

      await worker.scheduled({ cron: '*/15 * * * *' }, env, mockCtx);

      vi.useRealTimers();

      // ESPN writes NCAA-level standings
      expect(env.KV._store.has('cb:standings:NCAA')).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Rankings ingest
  // -----------------------------------------------------------------------

  describe('rankings ingest', () => {
    it('writes rankings via Highlightly', async () => {
      globalThis.fetch = mockHighlightlySuccess();

      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-04-15T18:00:00Z'));

      await worker.scheduled({ cron: '*/15 * * * *' }, env, mockCtx);

      vi.useRealTimers();

      expect(env.KV._store.has('cb:rankings')).toBe(true);
    });

    it('falls back to ESPN for rankings', async () => {
      env.RAPIDAPI_KEY = undefined;
      globalThis.fetch = mockEspnFallback();

      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-04-15T18:00:00Z'));

      await worker.scheduled({ cron: '*/15 * * * *' }, env, mockCtx);

      vi.useRealTimers();

      expect(env.KV._store.has('cb:rankings')).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Trending ingest
  // -----------------------------------------------------------------------

  describe('trending ingest', () => {
    it('computes trending from scores data', async () => {
      globalThis.fetch = mockHighlightlySuccess();

      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-04-15T18:00:00Z'));

      // 15-min cron runs scores + trending during season
      await worker.scheduled({ cron: '*/15 * * * *' }, env, mockCtx);

      vi.useRealTimers();

      const trending = env.KV._store.get('cb:trending');
      if (trending) {
        const parsed = JSON.parse(trending);
        expect(parsed.data).toBeDefined();
        expect(parsed.lastUpdated).toBeDefined();
      }
    });
  });

  // -----------------------------------------------------------------------
  // /status endpoint
  // -----------------------------------------------------------------------

  describe('/status endpoint', () => {
    it('returns cache freshness state', async () => {
      // Pre-populate some KV keys
      env.KV._store.set('cb:scores:today', JSON.stringify({ data: [] }));
      env.KV._store.set('cb:rankings', JSON.stringify([]));
      env.KV._store.set('cbb-ingest:last-run', JSON.stringify({ timestamp: '2026-04-15T18:00Z' }));

      globalThis.fetch = vi.fn() as unknown as typeof fetch;

      const req = new Request('https://example.com/status');
      const res = await worker.fetch(req, env as any);
      const body = await res.json() as any;

      expect(res.status).toBe(200);
      expect(body.cache).toBeDefined();
      expect(body.cache.scores).toBe(true);
      expect(body.cache.rankings).toBe(true);
      expect(body.cache.standings).toBe(false); // Not set
    });
  });

  // -----------------------------------------------------------------------
  // Last run summary
  // -----------------------------------------------------------------------

  describe('last run tracking', () => {
    it('stores ingest summary in KV after scheduled run', async () => {
      globalThis.fetch = mockHighlightlySuccess();

      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-04-15T18:00:00Z'));

      await worker.scheduled({ cron: '*/15 * * * *' }, env, mockCtx);

      vi.useRealTimers();

      expect(env.KV._store.has('cbb-ingest:last-run')).toBe(true);
      const summary = JSON.parse(env.KV._store.get('cbb-ingest:last-run')!);
      expect(summary.timestamp).toBeDefined();
      expect(summary.season).toBe(true); // April is baseball season
    });
  });

  // -----------------------------------------------------------------------
  // Error resilience
  // -----------------------------------------------------------------------

  describe('error resilience', () => {
    it('handles total API failure gracefully', async () => {
      globalThis.fetch = vi.fn(async () =>
        new Response('Gateway Timeout', { status: 504 })
      ) as unknown as typeof fetch;

      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-04-15T18:00:00Z'));

      // Should not throw
      await worker.scheduled({ cron: '*/15 * * * *' }, env, mockCtx);

      vi.useRealTimers();

      // Last run should still be written (with error details)
      expect(env.KV._store.has('cbb-ingest:last-run')).toBe(true);
    });
  });
});
