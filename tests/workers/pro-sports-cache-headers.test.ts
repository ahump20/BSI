import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockCtx, createMockEnv } from '../utils/mocks';

function wrapCachedPayload(payload: unknown, cachedAt = '2026-03-12T03:00:00Z') {
  return JSON.stringify({ data: payload, cachedAt });
}

describe('pro sports cache header preservation', () => {
  let env: ReturnType<typeof createMockEnv>;
  let worker: { fetch: (request: Request, env: unknown, ctx?: ExecutionContext) => Promise<Response> };
  let originalFetch: typeof globalThis.fetch;

  beforeEach(async () => {
    env = createMockEnv({ SPORTS_DATA_IO_API_KEY: 'test-sdio-key' });
    worker = await import('../../workers/index');
    if ('default' in worker) worker = (worker as { default: typeof worker }).default;
    originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn() as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('preserves cached freshness on MLB scores fallback-cache hits', async () => {
    env.KV._store.set('mlb:scores:20260701:st2', wrapCachedPayload({
      games: [],
      meta: {
        source: 'sportsdataio',
        fetched_at: '2026-03-12T02:45:00Z',
        timezone: 'America/Chicago',
      },
    }));

    const res = await worker.fetch(new Request('https://blazesportsintel.com/api/mlb/scores?date=2026-07-01'), env, createMockCtx());

    expect(res.headers.get('X-Cache')).toBe('HIT');
    expect(res.headers.get('X-Last-Updated')).toBe('2026-03-12T02:45:00Z');
    expect(res.headers.get('X-Origin-Data-Source')).toBe('sportsdataio');
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('preserves cached freshness on NFL standings fallback-cache hits', async () => {
    env.KV._store.set('nfl:standings', wrapCachedPayload({
      standings: [],
      meta: {
        source: 'espn',
        fetched_at: '2026-03-12T02:50:00Z',
        timezone: 'America/Chicago',
      },
    }));

    const res = await worker.fetch(new Request('https://blazesportsintel.com/api/nfl/standings'), env, createMockCtx());

    expect(res.headers.get('X-Cache')).toBe('HIT');
    expect(res.headers.get('X-Last-Updated')).toBe('2026-03-12T02:50:00Z');
    expect(res.headers.get('X-Origin-Data-Source')).toBe('espn');
  });

  it('preserves cached freshness on NBA news fallback-cache hits', async () => {
    env.KV._store.set('nba:news', wrapCachedPayload({
      articles: [],
      meta: {
        source: 'sportsdataio',
        fetched_at: '2026-03-12T02:55:00Z',
        timezone: 'America/Chicago',
      },
    }));

    const res = await worker.fetch(new Request('https://blazesportsintel.com/api/nba/news'), env, createMockCtx());

    expect(res.headers.get('X-Cache')).toBe('HIT');
    expect(res.headers.get('X-Last-Updated')).toBe('2026-03-12T02:55:00Z');
    expect(res.headers.get('X-Origin-Data-Source')).toBe('sportsdataio');
  });

  it('preserves cached freshness on MLB leaders direct KV hits', async () => {
    env.KV._store.set('mlb:leaders:batting:avg', JSON.stringify({
      leaders: [],
      category: 'batting',
      stat: 'avg',
      meta: {
        source: 'espn',
        fetched_at: '2026-03-12T03:10:00Z',
        timezone: 'America/Chicago',
      },
    }));

    const res = await worker.fetch(new Request('https://blazesportsintel.com/api/mlb/stats/leaders?category=batting&stat=avg'), env, createMockCtx());

    expect(res.headers.get('X-Cache')).toBe('HIT');
    expect(res.headers.get('X-Last-Updated')).toBe('2026-03-12T03:10:00Z');
    expect(res.headers.get('X-Origin-Data-Source')).toBe('espn');
  });

  it('preserves cached freshness on NFL roster direct KV hits', async () => {
    env.KV._store.set('nfl:roster:12', JSON.stringify({
      timestamp: '2026-03-12T03:12:00Z',
      players: [],
      meta: {
        source: 'espn',
        fetched_at: '2026-03-12T03:12:00Z',
        timezone: 'America/Chicago',
      },
    }));

    const res = await worker.fetch(new Request('https://blazesportsintel.com/api/nfl/players?teamId=12'), env, createMockCtx());

    expect(res.headers.get('X-Cache')).toBe('HIT');
    expect(res.headers.get('X-Last-Updated')).toBe('2026-03-12T03:12:00Z');
    expect(res.headers.get('X-Origin-Data-Source')).toBe('espn');
  });

  it('preserves cached freshness on NBA full-team direct KV hits', async () => {
    env.KV._store.set('nba:team-full:2', JSON.stringify({
      timestamp: '2026-03-12T03:15:00Z',
      team: null,
      roster: [],
      schedule: [],
      meta: {
        source: 'espn',
        fetched_at: '2026-03-12T03:15:00Z',
        timezone: 'America/Chicago',
      },
    }));

    const res = await worker.fetch(new Request('https://blazesportsintel.com/api/nba/teams/2'), env, createMockCtx());

    expect(res.headers.get('X-Cache')).toBe('HIT');
    expect(res.headers.get('X-Last-Updated')).toBe('2026-03-12T03:15:00Z');
    expect(res.headers.get('X-Origin-Data-Source')).toBe('espn');
  });
});
