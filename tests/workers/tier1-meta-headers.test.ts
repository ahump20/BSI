import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockEnv } from '../utils/mocks';

function mockScoreboardResponse() {
  globalThis.fetch = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        events: [],
        leagues: [],
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    ),
  ) as unknown as typeof fetch;
}

function mockStandingsResponse() {
  globalThis.fetch = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        children: [],
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    ),
  ) as unknown as typeof fetch;
}

describe('Tier-1 API headers/meta contract', () => {
  let worker: { fetch: (request: Request, env: any) => Promise<Response> };
  let env: ReturnType<typeof createMockEnv>;
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

  it('includes tier1 freshness headers on /api/nfl/scores', async () => {
    mockScoreboardResponse();

    const req = new Request('https://blazesportsintel.com/api/nfl/scores');
    const res = await worker.fetch(req, env);
    const body = await res.json() as Record<string, unknown>;
    const meta = body.meta as Record<string, unknown>;

    expect(res.status).toBe(200);
    expect(res.headers.get('X-Data-Source')).toBeTruthy();
    expect(res.headers.get('X-Last-Updated')).toBeTruthy();
    expect(res.headers.get('X-Cache')).toBeTruthy();
    expect(res.headers.get('X-Cache-State')).toBeTruthy();

    expect(meta).toBeTruthy();
    expect(meta.source || meta.dataSource).toBeTruthy();
    expect(meta.fetched_at || meta.lastUpdated).toBeTruthy();
    expect(meta.timezone).toBe('America/Chicago');
  });

  it('includes tier1 freshness headers on /api/cfb/standings', async () => {
    mockStandingsResponse();

    const req = new Request('https://blazesportsintel.com/api/cfb/standings');
    const res = await worker.fetch(req, env);
    const body = await res.json() as Record<string, unknown>;
    const meta = body.meta as Record<string, unknown>;

    expect(res.status).toBe(200);
    expect(res.headers.get('X-Data-Source')).toBeTruthy();
    expect(res.headers.get('X-Last-Updated')).toBeTruthy();
    expect(res.headers.get('X-Cache')).toBeTruthy();
    expect(res.headers.get('X-Cache-State')).toBeTruthy();

    expect(meta).toBeTruthy();
    expect(meta.source || meta.dataSource).toBeTruthy();
    expect(meta.fetched_at || meta.lastUpdated).toBeTruthy();
    expect(meta.timezone).toBe('America/Chicago');
  });
});
