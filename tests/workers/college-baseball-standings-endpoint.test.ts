/**
 * Standings Endpoint Tests — handleCollegeBaseballStandings
 *
 * Tests the request-handling layer at workers/index.ts:539-589.
 * Covers KV cache HIT, conference param routing, default NCAA,
 * meta wrapping, Highlightly fallback, and array safety.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockEnv, createMockCtx, HIGHLIGHTLY_STANDINGS, ESPN_STANDINGS } from '../utils/mocks';

// ---------------------------------------------------------------------------
// Fetch mocks
// ---------------------------------------------------------------------------

function mockHighlightlyStandings() {
  return vi.fn(async (url: string | URL | Request) => {
    const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;

    if (urlStr.includes('mlb-college-baseball-api') && urlStr.includes('/standings')) {
      return new Response(JSON.stringify(HIGHLIGHTLY_STANDINGS), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }) as unknown as typeof fetch;
}

function mockNcaaStandings() {
  return vi.fn(async (url: string | URL | Request) => {
    const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;

    // Highlightly fails
    if (urlStr.includes('mlb-college-baseball-api')) {
      return new Response('Error', { status: 500 });
    }
    // ESPN/NCAA standings
    if (urlStr.includes('espn.com') && urlStr.includes('/standings')) {
      return new Response(JSON.stringify(ESPN_STANDINGS), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    // ESPN rankings fallback (standings handler falls back to rankings)
    if (urlStr.includes('espn.com') && urlStr.includes('/rankings')) {
      return new Response(JSON.stringify({ rankings: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }) as unknown as typeof fetch;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('handleCollegeBaseballStandings', () => {
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

  it('returns cached standings on KV HIT', async () => {
    const cached = { success: true, data: [{ team: 'Texas', wins: 30 }], conference: 'SEC', meta: {} };
    env.KV._store.set('cb:standings:v3:SEC', JSON.stringify(cached));
    globalThis.fetch = vi.fn() as unknown as typeof fetch;

    const req = new Request('https://blazesportsintel.com/api/college-baseball/standings?conference=SEC');
    const res = await worker.fetch(req, env, createMockCtx());

    expect(res.status).toBe(200);
    expect(res.headers.get('X-Cache')).toBe('HIT');
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('uses conference param in cache key', async () => {
    globalThis.fetch = mockHighlightlyStandings();

    const req = new Request('https://blazesportsintel.com/api/college-baseball/standings?conference=SEC');
    await worker.fetch(req, env, createMockCtx());

    expect(env.KV.put).toHaveBeenCalledWith(
      'cb:standings:v3:SEC',
      expect.any(String),
      expect.objectContaining({ expirationTtl: expect.any(Number) })
    );
  });

  it('defaults to NCAA conference when no param', async () => {
    globalThis.fetch = mockHighlightlyStandings();

    const req = new Request('https://blazesportsintel.com/api/college-baseball/standings');
    await worker.fetch(req, env, createMockCtx());

    expect(env.KV.put).toHaveBeenCalledWith(
      'cb:standings:v3:NCAA',
      expect.any(String),
      expect.objectContaining({ expirationTtl: expect.any(Number) })
    );
  });

  it('wraps response with meta', async () => {
    globalThis.fetch = mockHighlightlyStandings();

    const req = new Request('https://blazesportsintel.com/api/college-baseball/standings?conference=SEC');
    const res = await worker.fetch(req, env, createMockCtx());
    const body = await res.json() as any;

    expect(body.success).toBe(true);
    expect(body.conference).toBe('SEC');
    expect(body.timestamp).toBeDefined();
    expect(body.meta).toBeDefined();
    expect(body.meta.source).toBe('highlightly');
    expect(body.meta.sport).toBe('college-baseball');
  });

  it('falls back to NCAA when Highlightly fails', async () => {
    globalThis.fetch = mockNcaaStandings();

    const req = new Request('https://blazesportsintel.com/api/college-baseball/standings');
    const res = await worker.fetch(req, env, createMockCtx());

    expect(res.status).toBe(200);
    expect(res.headers.get('X-Data-Source')).toBe('espn-v2');
  });

  it('ensures data is always an array', async () => {
    // Mock Highlightly returning non-array data
    globalThis.fetch = vi.fn(async (url: string | URL | Request) => {
      const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;
      if (urlStr.includes('mlb-college-baseball-api') && urlStr.includes('/standings')) {
        return new Response(JSON.stringify({ notAnArray: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      // ESPN fallback
      if (urlStr.includes('espn.com')) {
        return new Response(JSON.stringify(ESPN_STANDINGS), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as unknown as typeof fetch;

    const req = new Request('https://blazesportsintel.com/api/college-baseball/standings');
    const res = await worker.fetch(req, env, createMockCtx());
    const body = await res.json() as any;

    expect(Array.isArray(body.data)).toBe(true);
  });

  it('sets correct Cache-Control for standings', async () => {
    globalThis.fetch = mockHighlightlyStandings();

    const req = new Request('https://blazesportsintel.com/api/college-baseball/standings');
    const res = await worker.fetch(req, env, createMockCtx());

    expect(res.headers.get('Cache-Control')).toBe('public, max-age=300');
  });

  it('flattens ESPN v2 conference groups into team entries', async () => {
    // Highlightly fails → ESPN v2 fallback with nested entries
    globalThis.fetch = vi.fn(async (url: string | URL | Request) => {
      const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;

      if (urlStr.includes('mlb-college-baseball-api')) {
        return new Response('Error', { status: 500 });
      }
      if (urlStr.includes('espn.com') && urlStr.includes('/standings')) {
        return new Response(JSON.stringify({
          children: [{
            name: 'Southeastern Conference',
            standings: {
              entries: [{
                team: { id: '126', displayName: 'Texas Longhorns', abbreviation: 'TEX' },
                wins: 30,
                losses: 10,
                winPercent: 0.75,
                leagueWinPercent: 0.80,
                streak: 'W5',
                pointDifferential: 62,
              }],
            },
          }],
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (urlStr.includes('espn.com') && urlStr.includes('/rankings')) {
        return new Response(JSON.stringify({ rankings: [] }), {
          status: 200, headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }) as unknown as typeof fetch;

    const req = new Request('https://blazesportsintel.com/api/college-baseball/standings?conference=NCAA');
    const res = await worker.fetch(req, env, createMockCtx());
    const body = await res.json() as any;

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].team.name).toBe('Texas Longhorns');
    expect(body.data[0].overallRecord.wins).toBe(30);
    expect(body.data[0].overallRecord.losses).toBe(10);
    expect(body.data[0].winPct).toBe(0.75);
  });

  it('ESPN v2 fallback filters by conference metadata', async () => {
    // Highlightly fails → ESPN returns multiple conferences
    globalThis.fetch = vi.fn(async (url: string | URL | Request) => {
      const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;

      if (urlStr.includes('mlb-college-baseball-api')) {
        return new Response('Error', { status: 500 });
      }
      if (urlStr.includes('espn.com') && urlStr.includes('/standings')) {
        return new Response(JSON.stringify({
          children: [
            {
              name: 'Southeastern Conference',
              standings: {
                entries: [
                  { team: { id: '126', displayName: 'Texas Longhorns', abbreviation: 'TEX' }, wins: 30, losses: 10, winPercent: 0.75, leagueWinPercent: 0.80 },
                  { team: { id: '123', displayName: 'Texas A&M Aggies', abbreviation: 'TAMU' }, wins: 25, losses: 15, winPercent: 0.625, leagueWinPercent: 0.60 },
                ],
              },
            },
            {
              name: 'Big 12 Conference',
              standings: {
                entries: [
                  { team: { id: '66', displayName: 'TCU Horned Frogs', abbreviation: 'TCU' }, wins: 28, losses: 12, winPercent: 0.70, leagueWinPercent: 0.65 },
                ],
              },
            },
          ],
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (urlStr.includes('espn.com') && urlStr.includes('/rankings')) {
        return new Response(JSON.stringify({ rankings: [] }), {
          status: 200, headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }) as unknown as typeof fetch;

    const req = new Request('https://blazesportsintel.com/api/college-baseball/standings?conference=SEC');
    const res = await worker.fetch(req, env, createMockCtx());
    const body = await res.json() as any;

    expect(res.status).toBe(200);
    expect(body.data.length).toBe(2); // Only SEC teams (Texas + A&M)
    const teamNames = body.data.map((d: any) => d.team.name);
    expect(teamNames).toContain('Texas Longhorns');
    expect(teamNames).toContain('Texas A&M Aggies');
    expect(teamNames).not.toContain('TCU Horned Frogs'); // Big 12, not SEC
  });
});
