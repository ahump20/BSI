import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockCtx, createMockEnv } from '../utils/mocks';

describe('college baseball cache header preservation', () => {
  let env: ReturnType<typeof createMockEnv>;
  let worker: { fetch: (request: Request, env: unknown, ctx?: ExecutionContext) => Promise<Response> };
  let originalFetch: typeof globalThis.fetch;

  beforeEach(async () => {
    env = createMockEnv();
    worker = await import('../../workers/index');
    if ('default' in worker) worker = (worker as { default: typeof worker }).default;
    originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn() as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('preserves cached standings freshness headers', async () => {
    env.KV._store.set('cb:standings:v3:SEC', JSON.stringify({
      success: true,
      data: [],
      conference: 'SEC',
      meta: {
        source: 'highlightly+espn-v2',
        fetched_at: '2026-03-11T15:45:00Z',
        timezone: 'America/Chicago',
      },
    }));

    const res = await worker.fetch(
      new Request('https://blazesportsintel.com/api/college-baseball/standings?conference=SEC'),
      env,
      createMockCtx(),
    );

    expect(res.headers.get('X-Cache')).toBe('HIT');
    expect(res.headers.get('X-Last-Updated')).toBe('2026-03-11T15:45:00Z');
    expect(res.headers.get('X-Origin-Data-Source')).toBe('highlightly+espn-v2');
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('preserves cached rankings freshness headers', async () => {
    env.KV._store.set('cb:rankings:v2', JSON.stringify({
      rankings: [],
      timestamp: '2026-03-11T15:50:00Z',
      meta: {
        source: 'highlightly+espn',
        fetched_at: '2026-03-11T15:50:00Z',
        timezone: 'America/Chicago',
      },
    }));

    const res = await worker.fetch(
      new Request('https://blazesportsintel.com/api/college-baseball/rankings'),
      env,
      createMockCtx(),
    );

    expect(res.headers.get('X-Cache')).toBe('HIT');
    expect(res.headers.get('X-Last-Updated')).toBe('2026-03-11T15:50:00Z');
    expect(res.headers.get('X-Origin-Data-Source')).toBe('highlightly+espn');
  });

  it('preserves cached leaders freshness headers', async () => {
    env.KV._store.set('cb:leaders', JSON.stringify({
      categories: [],
      meta: {
        source: 'd1-accumulated',
        fetched_at: '2026-03-11T16:00:00Z',
        timezone: 'America/Chicago',
      },
    }));

    const res = await worker.fetch(
      new Request('https://blazesportsintel.com/api/college-baseball/leaders'),
      env,
      createMockCtx(),
    );

    expect(res.headers.get('X-Cache')).toBe('HIT');
    expect(res.headers.get('X-Last-Updated')).toBe('2026-03-11T16:00:00Z');
    expect(res.headers.get('X-Origin-Data-Source')).toBe('d1-accumulated');
  });

  it('preserves cached player freshness headers', async () => {
    env.KV._store.set('cb:player:7', JSON.stringify({
      player: { id: 7, name: 'Jared Thomas' },
      statistics: null,
      meta: {
        source: 'highlightly+d1',
        fetched_at: '2026-03-11T16:15:00Z',
        timezone: 'America/Chicago',
      },
    }));

    const res = await worker.fetch(
      new Request('https://blazesportsintel.com/api/college-baseball/players/7'),
      env,
      createMockCtx(),
    );

    expect(res.headers.get('X-Cache')).toBe('HIT');
    expect(res.headers.get('X-Last-Updated')).toBe('2026-03-11T16:15:00Z');
    expect(res.headers.get('X-Origin-Data-Source')).toBe('highlightly+d1');
  });

  it('preserves cached news freshness headers', async () => {
    env.KV._store.set('cb:news', JSON.stringify({
      articles: [],
      meta: {
        source: 'espn',
        fetched_at: '2026-03-11T16:20:00Z',
        timezone: 'America/Chicago',
      },
    }));

    const res = await worker.fetch(
      new Request('https://blazesportsintel.com/api/college-baseball/news'),
      env,
      createMockCtx(),
    );

    expect(res.headers.get('X-Cache')).toBe('HIT');
    expect(res.headers.get('X-Last-Updated')).toBe('2026-03-11T16:20:00Z');
    expect(res.headers.get('X-Origin-Data-Source')).toBe('espn');
  });

  it('preserves cached daily freshness on latest fallback', async () => {
    env.KV._store.set('cb:daily:latest', JSON.stringify({
      digest: 'latest edition',
      meta: {
        source: 'bsi-college-baseball-daily',
        fetched_at: '2026-03-11T16:30:00Z',
        timezone: 'America/Chicago',
      },
    }));

    const res = await worker.fetch(
      new Request('https://blazesportsintel.com/api/college-baseball/daily?edition=morning&date=2026-03-11'),
      env,
      createMockCtx(),
    );

    expect(res.headers.get('X-Cache')).toBe('FALLBACK');
    expect(res.headers.get('X-Cache-State')).toBe('fallback');
    expect(res.headers.get('X-Last-Updated')).toBe('2026-03-11T16:30:00Z');
    expect(res.headers.get('X-Origin-Data-Source')).toBe('bsi-college-baseball-daily');
  });

  it('preserves cached editorial list freshness headers', async () => {
    env.KV._store.set('cb:editorial:list', JSON.stringify({
      editorials: [],
      meta: {
        source: 'bsi-d1',
        fetched_at: '2026-03-11T16:40:00Z',
        timezone: 'America/Chicago',
      },
    }));

    const res = await worker.fetch(
      new Request('https://blazesportsintel.com/api/college-baseball/editorial/list'),
      env,
      createMockCtx(),
    );

    expect(res.headers.get('X-Cache')).toBe('HIT');
    expect(res.headers.get('X-Last-Updated')).toBe('2026-03-11T16:40:00Z');
    expect(res.headers.get('X-Origin-Data-Source')).toBe('bsi-d1');
  });
});
