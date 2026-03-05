/**
 * Scores Endpoint Tests — handleCollegeBaseballScores
 *
 * Tests the request-handling layer at workers/index.ts:492-537.
 * Covers KV cache HIT, Highlightly MISS, date param routing,
 * NCAA fallback, missing API key, total failure (502), and Cache-Control.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockEnv, createMockCtx, HIGHLIGHTLY_SCORES } from '../utils/mocks';

// ---------------------------------------------------------------------------
// Fetch mocks scoped to this endpoint
// ---------------------------------------------------------------------------

function mockHighlightlyScores() {
  return vi.fn(async (url: string | URL | Request) => {
    const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;

    if (urlStr.includes('mlb-college-baseball-api') && urlStr.includes('/matches')) {
      return new Response(JSON.stringify(HIGHLIGHTLY_SCORES), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    // NCAA fallback (ESPN scoreboard)
    if (urlStr.includes('espn.com') && urlStr.includes('/scoreboard')) {
      return new Response(JSON.stringify({
        events: [{ id: '301', name: 'Fallback Game', status: { type: { state: 'post' } } }],
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }) as unknown as typeof fetch;
}

function mockNcaaOnly() {
  return vi.fn(async (url: string | URL | Request) => {
    const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;

    // Highlightly fails
    if (urlStr.includes('mlb-college-baseball-api')) {
      return new Response('Server Error', { status: 500 });
    }
    // NCAA/ESPN scoreboard succeeds
    if (urlStr.includes('espn.com') && urlStr.includes('/scoreboard')) {
      return new Response(JSON.stringify({
        events: [{ id: '401', name: 'NCAA Game', status: { type: { state: 'in' } } }],
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }) as unknown as typeof fetch;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('handleCollegeBaseballScores', () => {
  let env: ReturnType<typeof createMockEnv>;
  let worker: { fetch: (request: Request, env: any) => Promise<Response> };
  let originalFetch: typeof globalThis.fetch;

  beforeEach(async () => {
    env = createMockEnv();
    worker = await import('../../workers/index');
    if ('default' in worker) worker = (worker as any).default;
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('returns cached scores on KV HIT', async () => {
    const cached = { data: [{ id: 1, name: 'Cached Game' }], totalCount: 1 };
    env.KV._store.set('cb:scores:today', JSON.stringify(cached));
    globalThis.fetch = vi.fn() as unknown as typeof fetch;

    const req = new Request('https://blazesportsintel.com/api/college-baseball/scores');
    const res = await worker.fetch(req, env, createMockCtx());
    const body = await res.json() as any;

    expect(res.status).toBe(200);
    expect(res.headers.get('X-Cache')).toBe('HIT');
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe('Cached Game');
    // Should NOT have called external APIs
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('fetches from Highlightly on cache MISS', async () => {
    globalThis.fetch = mockHighlightlyScores();

    const req = new Request('https://blazesportsintel.com/api/college-baseball/scores');
    const res = await worker.fetch(req, env, createMockCtx());

    expect(res.status).toBe(200);
    expect(res.headers.get('X-Cache')).toBe('MISS');
    // Verify KV was populated
    expect(env.KV.put).toHaveBeenCalledWith(
      'cb:scores:today',
      expect.any(String),
      expect.objectContaining({ expirationTtl: expect.any(Number) })
    );
  });

  it('uses date param in cache key', async () => {
    globalThis.fetch = mockHighlightlyScores();

    const req = new Request('https://blazesportsintel.com/api/college-baseball/scores?date=2026-02-15');
    await worker.fetch(req, env, createMockCtx());

    expect(env.KV.put).toHaveBeenCalledWith(
      'cb:scores:2026-02-15',
      expect.any(String),
      expect.objectContaining({ expirationTtl: expect.any(Number) })
    );
  });

  it('falls back to ESPN when Highlightly fails', async () => {
    globalThis.fetch = mockNcaaOnly();

    const req = new Request('https://blazesportsintel.com/api/college-baseball/scores');
    const res = await worker.fetch(req, env, createMockCtx());

    expect(res.status).toBe(200);
    expect(res.headers.get('X-Cache')).toBe('MISS');
    expect(res.headers.get('X-Data-Source')).toBe('espn');
  });

  it('falls back to ESPN when no RAPIDAPI_KEY', async () => {
    env = createMockEnv({ RAPIDAPI_KEY: undefined });
    globalThis.fetch = mockNcaaOnly();

    const req = new Request('https://blazesportsintel.com/api/college-baseball/scores');
    const res = await worker.fetch(req, env, createMockCtx());

    expect(res.status).toBe(200);
    expect(res.headers.get('X-Data-Source')).toBe('espn');
  });

  it('returns 502 with empty data when all sources fail', async () => {
    // NCAA client catches fetch errors internally and returns { success: false },
    // so the handler returns 502 via the result.success check, not the catch block.
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network down')) as unknown as typeof fetch;

    const req = new Request('https://blazesportsintel.com/api/college-baseball/scores');
    const res = await worker.fetch(req, env, createMockCtx());
    const body = await res.json() as any;

    expect(res.status).toBe(502);
    expect(body.data).toEqual([]);
    expect(body.totalCount).toBe(0);
  });

  it('sets correct Cache-Control header', async () => {
    globalThis.fetch = mockHighlightlyScores();

    const req = new Request('https://blazesportsintel.com/api/college-baseball/scores');
    const res = await worker.fetch(req, env, createMockCtx());

    expect(res.headers.get('Cache-Control')).toBe('public, max-age=30');
  });
});

// ---------------------------------------------------------------------------
// Schedule Endpoint (powers the live scores page)
// ---------------------------------------------------------------------------

describe('handleCollegeBaseballSchedule', () => {
  let env: ReturnType<typeof createMockEnv>;
  let worker: { fetch: (request: Request, env: any) => Promise<Response> };
  let originalFetch: typeof globalThis.fetch;

  beforeEach(async () => {
    env = createMockEnv();
    worker = await import('../../workers/index');
    if ('default' in worker) worker = (worker as any).default;
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('uses scores-level Cache-Control (30s), not schedule (3600s)', async () => {
    // ESPN scoreboard mock for the schedule endpoint
    globalThis.fetch = vi.fn(async () =>
      new Response(JSON.stringify({
        events: [{
          id: '501',
          name: 'Test Game',
          date: '2026-02-25T18:00Z',
          competitions: [{
            competitors: [
              { homeAway: 'home', team: { id: '126', displayName: 'Texas', abbreviation: 'TEX' }, score: '0' },
              { homeAway: 'away', team: { id: '245', displayName: 'Texas A&M', abbreviation: 'TAMU' }, score: '0' },
            ],
            venue: { fullName: 'UFCU Disch-Falk Field' },
            status: { type: { state: 'pre', name: 'STATUS_SCHEDULED' }, displayClock: '', period: 0 },
          }],
          status: { type: { state: 'pre', name: 'STATUS_SCHEDULED' } },
        }],
      }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    ) as unknown as typeof fetch;

    const req = new Request('https://blazesportsintel.com/api/college-baseball/schedule?date=2026-02-25');
    const res = await worker.fetch(req, env, createMockCtx());

    expect(res.status).toBe(200);
    // Schedule endpoint powers the live scores page — must use short cache
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=30');
  });

  it('returns cached data on KV HIT with 30s max-age', async () => {
    const cached = {
      success: true,
      data: [{ id: '501', status: 'scheduled', homeTeam: { name: 'Texas' }, awayTeam: { name: 'A&M' } }],
      live: false,
      timestamp: new Date().toISOString(),
    };
    env.KV._store.set('cb:schedule:2026-02-25:week', JSON.stringify(cached));
    globalThis.fetch = vi.fn() as unknown as typeof fetch;

    const req = new Request('https://blazesportsintel.com/api/college-baseball/schedule?date=2026-02-25');
    const res = await worker.fetch(req, env, createMockCtx());

    expect(res.status).toBe(200);
    expect(res.headers.get('X-Cache')).toBe('HIT');
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=30');
    // Should not call external APIs on cache hit
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('returns 502 with short cache on upstream failure', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network down')) as unknown as typeof fetch;

    const req = new Request('https://blazesportsintel.com/api/college-baseball/schedule?date=2026-02-25');
    const res = await worker.fetch(req, env, createMockCtx());

    expect(res.status).toBe(502);
    // Even errors should use the short cache, not 3600s
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=30');
  });
});
