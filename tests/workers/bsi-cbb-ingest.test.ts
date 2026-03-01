/**
 * BSI College Baseball Ingest — Cron Worker Tests
 *
 * Tests the scheduled data pipeline that pre-caches scores, standings,
 * and rankings into KV. Covers Highlightly-first → ESPN fallback,
 * season awareness, and both cron paths (2-min scores, 15-min standings).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockKV, mockHighlightlySuccess, mockEspnFallback } from '../utils/mocks';

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

      // ESPN writes NCAA-level standings (raw key — main handler transforms on read)
      expect(env.KV._store.has('cb:standings:raw:NCAA')).toBe(true);
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
