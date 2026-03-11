import { describe, expect, it, vi } from 'vitest';

import { fetchWithFallback } from '../../lib/api-clients/data-fetcher';

type KVValue = string;

function createKV(seed: Record<string, string> = {}) {
  const store = new Map<string, KVValue>(Object.entries(seed));
  return {
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    put: vi.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    store,
  };
}

function envelope(data: unknown, cachedAt: string) {
  return JSON.stringify({ data, cachedAt });
}

describe('fetchWithFallback stale handling', () => {
  it('returns stale-cache when primary and fallback fail but stale snapshot exists', async () => {
    const staleAt = new Date(Date.now() - 5 * 60_000).toISOString();
    const kv = createKV({
      'scores:stale': envelope({ games: [{ id: '1' }] }, staleAt),
    });

    const result = await fetchWithFallback(
      async () => {
        throw new Error('primary failed');
      },
      async () => {
        throw new Error('fallback failed');
      },
      'scores',
      kv,
      30,
      'sportsdataio',
      'espn',
      { staleKey: 'scores:stale' },
    );

    expect(result.source).toBe('stale-cache');
    expect(result.cached).toBe(true);
    expect(result.staleMinutes).toBeTypeOf('number');
    expect((result.data as { games: Array<{ id: string }> }).games[0].id).toBe('1');
  });

  it('writes fresh and stale snapshots on primary success', async () => {
    const kv = createKV();

    const result = await fetchWithFallback(
      async () => ({ ok: true, source: 'primary' }),
      async () => ({ ok: true, source: 'fallback' }),
      'standings',
      kv,
      60,
      'sportsdataio',
      'espn',
      { staleKey: 'standings:stale' },
    );

    expect(result.source).toBe('sportsdataio');
    expect(kv.put).toHaveBeenCalledWith(
      'standings',
      expect.any(String),
      { expirationTtl: 60 },
    );
    expect(kv.put).toHaveBeenCalledWith(
      'standings:stale',
      expect.any(String),
      { expirationTtl: 86400 },
    );
  });

  it('writes fresh and stale snapshots on fallback success', async () => {
    const kv = createKV();

    const result = await fetchWithFallback(
      async () => {
        throw new Error('primary unavailable');
      },
      async () => ({ ok: true, source: 'fallback' }),
      'rankings',
      kv,
      60,
      'sportsdataio',
      'espn',
      { staleKey: 'rankings:stale' },
    );

    expect(result.source).toBe('espn');
    expect(kv.put).toHaveBeenCalledWith(
      'rankings',
      expect.any(String),
      { expirationTtl: 60 },
    );
    expect(kv.put).toHaveBeenCalledWith(
      'rankings:stale',
      expect.any(String),
      { expirationTtl: 86400 },
    );
  });
});
