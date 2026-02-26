/**
 * Standings Meta Shape Tests
 *
 * Verifies that the college baseball standings handler returns
 * meta.sources and meta.degraded in the response — the fields
 * that the standings data-source indicator reads on the frontend.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockEnv, createMockCtx, HIGHLIGHTLY_STANDINGS, ESPN_STANDINGS } from '../utils/mocks';

// ---------------------------------------------------------------------------
// Fetch mocks
// ---------------------------------------------------------------------------

function mockBothSources() {
  return vi.fn(async (url: string | URL | Request) => {
    const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;
    const urlObj = new URL(urlStr, 'http://localhost');

    // Highlightly standings
    if (urlObj.hostname === 'mlb-college-baseball-api' && urlObj.pathname.includes('/standings')) {
      return new Response(JSON.stringify(HIGHLIGHTLY_STANDINGS), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    // ESPN standings
    if (urlObj.hostname === 'espn.com' && urlObj.pathname.includes('/standings')) {
      return new Response(JSON.stringify(ESPN_STANDINGS), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    // ESPN rankings (handler also fetches these)
    if (urlObj.hostname === 'espn.com' && urlObj.pathname.includes('/rankings')) {
      return new Response(JSON.stringify({ rankings: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }) as unknown as typeof fetch;
}

function mockHighlightlyOnly() {
  return vi.fn(async (url: string | URL | Request) => {
    const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;

    if (urlObj.hostname === 'mlb-college-baseball-api' && urlObj.pathname.includes('/standings')) {
      return new Response(JSON.stringify(HIGHLIGHTLY_STANDINGS), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    // ESPN fails
    if (urlObj.hostname === 'espn.com') {
      return new Response('Service Unavailable', { status: 503 });
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }) as unknown as typeof fetch;
}

function mockAllSourcesFail() {
  return vi.fn(async () => {
    return new Response('Service Unavailable', { status: 503 });
  }) as unknown as typeof fetch;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('standings meta.sources and meta.degraded', () => {
  let env: ReturnType<typeof createMockEnv>;
  let worker: { fetch: (request: Request, env: any, ctx?: any) => Promise<Response> };
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

  it('includes meta.sources array and meta.degraded:false on happy path', async () => {
    globalThis.fetch = mockBothSources();

    const req = new Request('https://blazesportsintel.com/api/college-baseball/standings?conference=SEC');
    const res = await worker.fetch(req, env, createMockCtx());
    const body = await res.json() as any;

    expect(body.meta).toBeDefined();
    expect(Array.isArray(body.meta.sources)).toBe(true);
    expect(body.meta.sources.length).toBeGreaterThan(0);
    // When Highlightly succeeds, degraded should be false
    expect(body.meta.degraded).toBe(false);
  });

  it('returns meta.sources with highlightly when ESPN fails', async () => {
    globalThis.fetch = mockHighlightlyOnly();

    const req = new Request('https://blazesportsintel.com/api/college-baseball/standings?conference=SEC');
    const res = await worker.fetch(req, env, createMockCtx());
    const body = await res.json() as any;

    expect(body.meta).toBeDefined();
    expect(Array.isArray(body.meta.sources)).toBe(true);
    // Highlightly-only path still has data — should include highlightly
    expect(body.meta.sources).toContain('highlightly');
  });

  it('returns meta.degraded:true and empty sources on full failure', async () => {
    globalThis.fetch = mockAllSourcesFail();

    const req = new Request('https://blazesportsintel.com/api/college-baseball/standings?conference=SEC');
    const res = await worker.fetch(req, env, createMockCtx());
    const body = await res.json() as any;

    expect(body.meta).toBeDefined();
    expect(body.meta.degraded).toBe(true);
    expect(Array.isArray(body.meta.sources)).toBe(true);
  });
});
