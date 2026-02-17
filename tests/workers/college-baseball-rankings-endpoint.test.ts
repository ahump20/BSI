/**
 * Rankings Endpoint Tests — handleCollegeBaseballRankings
 *
 * Tests the request-handling layer at workers/index.ts:591-662.
 * Covers KV cache HIT, Highlightly-first, ESPN direct fallback,
 * NCAA final fallback, 502 on total failure, and v2 cache key.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockEnv, HIGHLIGHTLY_RANKINGS, ESPN_RANKINGS } from '../utils/mocks';

// ---------------------------------------------------------------------------
// Fetch mocks
// ---------------------------------------------------------------------------

function mockHighlightlyRankings() {
  return vi.fn(async (url: string | URL | Request) => {
    const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;

    if (urlStr.includes('mlb-college-baseball-api') && urlStr.includes('/rankings')) {
      return new Response(JSON.stringify(HIGHLIGHTLY_RANKINGS), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }) as unknown as typeof fetch;
}

function mockEspnRankingsOnly() {
  return vi.fn(async (url: string | URL | Request) => {
    const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;

    // Highlightly fails
    if (urlStr.includes('mlb-college-baseball-api')) {
      return new Response('Error', { status: 500 });
    }
    // ESPN rankings succeeds
    if (urlStr.includes('espn.com') && urlStr.includes('/rankings')) {
      return new Response(JSON.stringify(ESPN_RANKINGS), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }) as unknown as typeof fetch;
}

function mockNcaaRankingsOnly() {
  return vi.fn(async (url: string | URL | Request) => {
    const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;

    // Highlightly fails
    if (urlStr.includes('mlb-college-baseball-api')) {
      return new Response('Error', { status: 500 });
    }
    // ESPN also fails
    if (urlStr.includes('espn.com') && urlStr.includes('/rankings')) {
      return new Response('Error', { status: 500 });
    }
    // NCAA/ESPN scoreboard as final fallback
    if (urlStr.includes('espn.com')) {
      return new Response(JSON.stringify({
        rankings: [{ name: 'NCAA Top 25', ranks: [{ current: 1, team: { displayName: 'Texas' } }] }],
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }) as unknown as typeof fetch;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('handleCollegeBaseballRankings', () => {
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

  it('returns cached rankings on KV HIT', async () => {
    const cached = { rankings: [{ rank: 1, team: 'Texas' }], meta: { dataSource: 'cache' } };
    env.KV._store.set('cb:rankings:v2', JSON.stringify(cached));
    globalThis.fetch = vi.fn() as unknown as typeof fetch;

    const req = new Request('https://blazesportsintel.com/api/college-baseball/rankings');
    const res = await worker.fetch(req, env);
    const body = await res.json() as any;

    expect(res.status).toBe(200);
    expect(res.headers.get('X-Cache')).toBe('HIT');
    expect(body.rankings).toHaveLength(1);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('fetches from Highlightly first', async () => {
    globalThis.fetch = mockHighlightlyRankings();

    const req = new Request('https://blazesportsintel.com/api/college-baseball/rankings');
    const res = await worker.fetch(req, env);
    const body = await res.json() as any;

    expect(res.status).toBe(200);
    expect(body.meta.dataSource).toBe('highlightly');
    expect(res.headers.get('X-Cache')).toBe('MISS');
  });

  it('falls back to ESPN direct when Highlightly fails', async () => {
    globalThis.fetch = mockEspnRankingsOnly();

    const req = new Request('https://blazesportsintel.com/api/college-baseball/rankings');
    const res = await worker.fetch(req, env);
    const body = await res.json() as any;

    expect(res.status).toBe(200);
    expect(body.meta.dataSource).toBe('espn');
    expect(body.rankings).toBeDefined();
  });

  it('falls back to NCAA client when ESPN direct also fails', async () => {
    // The NCAA client wraps ESPN internally, so when ESPN /rankings
    // returns 500, both tier 2 (direct) and tier 3 (NCAA client) fail.
    // NCAA client catches the error and returns { success: false, data: [] }.
    globalThis.fetch = mockNcaaRankingsOnly();

    const req = new Request('https://blazesportsintel.com/api/college-baseball/rankings');
    const res = await worker.fetch(req, env);
    const body = await res.json() as any;

    // NCAA client returns success: false → handler returns 502
    expect(res.status).toBe(502);
    expect(body.meta.dataSource).toBe('ncaa');
    expect(body.rankings).toEqual([]);
  });

  it('returns 502 with empty rankings when all fetches reject', async () => {
    // NCAA client catches rejected fetches internally, returns { success: false }
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network down')) as unknown as typeof fetch;

    const req = new Request('https://blazesportsintel.com/api/college-baseball/rankings');
    const res = await worker.fetch(req, env);
    const body = await res.json() as any;

    expect(res.status).toBe(502);
    expect(body.rankings).toEqual([]);
    expect(body.meta.dataSource).toBe('ncaa');
  });

  it('uses v2 cache key', async () => {
    globalThis.fetch = mockHighlightlyRankings();

    const req = new Request('https://blazesportsintel.com/api/college-baseball/rankings');
    await worker.fetch(req, env);

    expect(env.KV.put).toHaveBeenCalledWith(
      'cb:rankings:v2',
      expect.any(String),
      expect.objectContaining({ expirationTtl: expect.any(Number) })
    );
  });

  it('sets correct Cache-Control for rankings', async () => {
    globalThis.fetch = mockHighlightlyRankings();

    const req = new Request('https://blazesportsintel.com/api/college-baseball/rankings');
    const res = await worker.fetch(req, env);

    expect(res.headers.get('Cache-Control')).toBe('public, max-age=300');
  });
});
