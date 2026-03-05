/**
 * BSI Portal Sync — Cron Worker Tests
 *
 * Tests the scheduled transfer portal data pipeline:
 * ESPN news fetch → filter for portal articles → merge with existing KV → write
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
// ESPN news fixtures
// ---------------------------------------------------------------------------

const ESPN_NEWS_WITH_TRANSFERS = {
  articles: [
    {
      dataSourceIdentifier: 'espn-portal-1',
      headline: 'Top SS enters transfer portal from LSU',
      description: 'A key infielder has entered the transfer portal.',
      published: '2026-03-15T12:00Z',
      categories: [
        { type: 'athlete', athleteId: '100', description: 'John Smith' },
        { type: 'team', description: 'LSU Tigers' },
      ],
      links: { web: { href: 'https://espn.com/portal/1' } },
    },
    {
      dataSourceIdentifier: 'espn-portal-2',
      headline: 'Former Texas commit joins portal',
      description: 'Player looking for new home via the portal.',
      published: '2026-03-15T14:00Z',
      categories: [
        { type: 'athlete', athleteId: '200', description: 'Mike Jones' },
        { type: 'team', description: 'Texas Longhorns' },
      ],
    },
    {
      dataSourceIdentifier: 'espn-regular-1',
      headline: 'Texas defeats A&M in series opener',
      description: 'A dominant pitching performance led the Horns.',
      published: '2026-03-15T16:00Z',
      categories: [{ type: 'team', description: 'Texas' }],
    },
  ],
};

const ESPN_NEWS_NO_TRANSFERS = {
  articles: [
    {
      dataSourceIdentifier: 'espn-regular-2',
      headline: 'College World Series preview',
      description: 'Top 8 teams to watch.',
      published: '2026-06-10T12:00Z',
      categories: [{ type: 'topic', description: 'Rankings' }],
    },
  ],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BSI Portal Sync Worker', () => {
  let env: { KV: ReturnType<typeof createMockKV> };
  let worker: {
    scheduled: (event: any, env: any, ctx: any) => Promise<void>;
    fetch: (request: Request, env: any) => Promise<Response>;
  };
  let originalFetch: typeof globalThis.fetch;
  const mockCtx = { waitUntil: () => {}, passThroughOnException: () => {} };

  beforeEach(async () => {
    env = { KV: createMockKV() };
    worker = await import('../../workers/bsi-portal-sync/index');
    if ('default' in worker) worker = (worker as any).default;
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  // -----------------------------------------------------------------------
  // scheduled() handler
  // -----------------------------------------------------------------------

  describe('scheduled()', () => {
    it('writes portal entries to KV from ESPN transfer news', async () => {
      globalThis.fetch = vi.fn(async () =>
        new Response(JSON.stringify(ESPN_NEWS_WITH_TRANSFERS), { status: 200, headers: { 'Content-Type': 'application/json' } })
      ) as unknown as typeof fetch;

      await worker.scheduled({}, env, mockCtx);

      expect(env.KV.put).toHaveBeenCalled();
      const putCall = env.KV.put.mock.calls[0];
      expect(putCall[0]).toBe('portal:college-baseball:entries');

      const payload = JSON.parse(putCall[1] as string);
      expect(payload.entries.length).toBe(2); // Only transfer-related articles
      expect(payload.entries[0].playerName).toBe('John Smith');
      expect(payload.entries[1].playerName).toBe('Mike Jones');
      expect(payload.lastUpdated).toBeDefined();
    });

    it('writes empty entries when no transfer articles exist', async () => {
      globalThis.fetch = vi.fn(async () =>
        new Response(JSON.stringify(ESPN_NEWS_NO_TRANSFERS), { status: 200, headers: { 'Content-Type': 'application/json' } })
      ) as unknown as typeof fetch;

      await worker.scheduled({}, env, mockCtx);

      const putCall = env.KV.put.mock.calls[0];
      const payload = JSON.parse(putCall[1] as string);
      expect(payload.entries).toEqual([]);
    });

    it('merges new entries with existing KV data without duplication', async () => {
      // Pre-populate KV with existing entries
      const existing = {
        entries: [
          { id: '100', playerName: 'John Smith', position: '', fromSchool: 'LSU Tigers', status: 'entered' },
          { id: '300', playerName: 'Old Player', position: '', fromSchool: 'Florida', status: 'committed' },
        ],
        lastUpdated: '2026-03-14T00:00Z',
      };
      env.KV._store.set('portal:college-baseball:entries', JSON.stringify(existing));

      globalThis.fetch = vi.fn(async () =>
        new Response(JSON.stringify(ESPN_NEWS_WITH_TRANSFERS), { status: 200, headers: { 'Content-Type': 'application/json' } })
      ) as unknown as typeof fetch;

      await worker.scheduled({}, env, mockCtx);

      const putCall = env.KV.put.mock.calls[0];
      const payload = JSON.parse(putCall[1] as string);

      // Should have 3: Old Player (kept) + John Smith (updated) + Mike Jones (new)
      expect(payload.entries.length).toBe(3);
      const names = payload.entries.map((e: any) => e.playerName);
      expect(names).toContain('Old Player');
      expect(names).toContain('John Smith');
      expect(names).toContain('Mike Jones');
    });

    it('overwrites entirely when existing KV data is corrupt', async () => {
      env.KV._store.set('portal:college-baseball:entries', 'NOT VALID JSON {{{');

      globalThis.fetch = vi.fn(async () =>
        new Response(JSON.stringify(ESPN_NEWS_WITH_TRANSFERS), { status: 200, headers: { 'Content-Type': 'application/json' } })
      ) as unknown as typeof fetch;

      await worker.scheduled({}, env, mockCtx);

      const putCall = env.KV.put.mock.calls[0];
      const payload = JSON.parse(putCall[1] as string);
      expect(payload.entries.length).toBe(2); // Just the new entries
    });

    it('handles ESPN API failure gracefully', async () => {
      globalThis.fetch = vi.fn(async () =>
        new Response('Internal Server Error', { status: 500 })
      ) as unknown as typeof fetch;

      // Should not throw
      await worker.scheduled({}, env, mockCtx);

      // KV still gets written (with empty entries merged with existing)
      expect(env.KV.put).toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // /status endpoint
  // -----------------------------------------------------------------------

  describe('/status endpoint', () => {
    it('returns 404 when no portal data exists', async () => {
      globalThis.fetch = vi.fn() as unknown as typeof fetch;
      const req = new Request('https://example.com/status');
      const res = await worker.fetch(req, env as any);
      const body = await res.json() as any;

      expect(res.status).toBe(404);
      expect(body.synced).toBe(false);
    });

    it('returns 200 with entry count when data exists', async () => {
      const data = {
        entries: [
          { id: '1', playerName: 'Test', position: 'SS', fromSchool: 'Texas', status: 'entered' },
          { id: '2', playerName: 'Test2', position: 'OF', fromSchool: 'LSU', status: 'entered' },
        ],
        lastUpdated: '2026-03-15T12:00Z',
      };
      env.KV._store.set('portal:college-baseball:entries', JSON.stringify(data));
      globalThis.fetch = vi.fn() as unknown as typeof fetch;

      const req = new Request('https://example.com/status');
      const res = await worker.fetch(req, env as any);
      const body = await res.json() as any;

      expect(res.status).toBe(200);
      expect(body.synced).toBe(true);
      expect(body.entryCount).toBe(2);
      expect(body.lastUpdated).toBe('2026-03-15T12:00Z');
    });
  });
});
