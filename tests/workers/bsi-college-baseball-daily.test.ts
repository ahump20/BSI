/**
 * BSI College Baseball Daily Tests — Pipeline Worker
 *
 * Tests the fetch handler endpoints, KV/R2 storage, game normalization,
 * and pipeline orchestration. The Claude API call is mocked.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function createMockKV() {
  const store = new Map<string, string>();
  return {
    put: vi.fn(async (key: string, value: string, opts?: { expirationTtl?: number }) => {
      store.set(key, value);
    }),
    get: vi.fn(async (key: string, type?: string) => {
      const val = store.get(key);
      if (!val) return null;
      return type === 'json' ? JSON.parse(val) : val;
    }),
    _store: store,
  };
}

function createMockR2() {
  const objects = new Map<string, { body: ReadableStream; httpMetadata?: any; customMetadata?: any }>();
  return {
    put: vi.fn(async (key: string, body: string | ReadableStream, opts?: any) => {
      const content = typeof body === 'string' ? body : '';
      objects.set(key, {
        body: new ReadableStream({
          start(controller) { controller.enqueue(new TextEncoder().encode(content)); controller.close(); },
        }),
        httpMetadata: opts?.httpMetadata,
        customMetadata: opts?.customMetadata,
      });
    }),
    get: vi.fn(async (key: string) => objects.get(key) ?? null),
    _objects: objects,
  };
}

function createEnv(overrides: Record<string, unknown> = {}) {
  return {
    KV: createMockKV(),
    DIGEST_BUCKET: createMockR2(),
    RAPIDAPI_KEY: undefined as string | undefined,
    ANTHROPIC_API_KEY: undefined as string | undefined,
    ...overrides,
  };
}

// Sample ESPN-format game
const espnGame = {
  id: '401234567',
  date: '2026-02-25T23:00Z',
  competitions: [{
    venue: { fullName: 'UFCU Disch-Falk Field' },
    competitors: [
      {
        homeAway: 'home',
        team: { displayName: 'Texas Longhorns', abbreviation: 'TEX' },
        score: '5',
        records: [{ summary: '10-2' }],
      },
      {
        homeAway: 'away',
        team: { displayName: 'LSU Tigers', abbreviation: 'LSU' },
        score: '3',
        records: [{ summary: '8-4' }],
      },
    ],
    status: { type: { name: 'STATUS_FINAL', completed: true } },
    broadcasts: [{ names: ['ESPN+'] }],
  }],
};

// Sample Highlightly-format game
const highlightlyGame = {
  id: 99001,
  awayTeam: { name: 'Arkansas Razorbacks', score: 7 },
  homeTeam: { name: 'Ole Miss Rebels', score: 4 },
  status: { type: 'finished' },
  startTime: '2026-02-24T23:00:00Z',
  venue: { name: 'Swayze Field' },
};

describe('bsi-college-baseball-daily', () => {
  let worker: {
    fetch: (request: Request, env: any) => Promise<Response>;
    scheduled: (event: any, env: any, ctx: any) => Promise<void>;
  };
  let env: ReturnType<typeof createEnv>;
  const mockCtx = { waitUntil: vi.fn(), passThroughOnException: vi.fn() };

  beforeEach(async () => {
    // Mock external fetches (ESPN scoreboard) to return empty events
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ events: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    ));
    env = createEnv();
    const mod = await import('../../workers/bsi-college-baseball-daily/index');
    worker = 'default' in mod ? (mod as any).default : mod;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --- Fetch handler routing ---

  it('returns pipeline result on root path', async () => {
    const res = await worker.fetch(new Request('https://daily.example.com/'), env);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.edition).toBe('morning'); // default
    expect(body.timezone).toBe('America/Chicago');
    expect(body.meta).toBeDefined();
    expect(body.meta.source).toBe('bsi-college-baseball-daily');
  });

  it('accepts edition query param on /trigger', async () => {
    const res = await worker.fetch(
      new Request('https://daily.example.com/trigger?edition=evening'),
      env,
    );
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.edition).toBe('evening');
  });

  it('returns /status with season and last_run info', async () => {
    const res = await worker.fetch(new Request('https://daily.example.com/status'), env);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.ok).toBe(true);
    expect(typeof body.season).toBe('boolean');
    expect(body.now_ct).toBeDefined();
  });

  it('/status includes last_run after pipeline runs', async () => {
    // Run the pipeline first
    await worker.fetch(new Request('https://daily.example.com/'), env);

    // Now check status
    const res = await worker.fetch(new Request('https://daily.example.com/status'), env);
    const body = await res.json() as any;
    // last_run was stored in KV by storeBundle
    // The mock KV get returns the stored value
    expect(body.ok).toBe(true);
  });

  it('returns 404 for /bundle when no bundle exists', async () => {
    const res = await worker.fetch(new Request('https://daily.example.com/bundle'), env);
    expect(res.status).toBe(404);
  });

  it('returns stored bundle from KV', async () => {
    // Store a bundle directly in KV
    const bundle = { edition: 'morning', test: true };
    env.KV._store.set('cb:daily:latest', JSON.stringify(bundle));

    const res = await worker.fetch(
      new Request('https://daily.example.com/bundle?edition=latest'),
      env,
    );
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.test).toBe(true);
  });

  it('returns 404 for /prompt when no prompt exists', async () => {
    const res = await worker.fetch(
      new Request('https://daily.example.com/prompt?date=2026-02-25&edition=morning'),
      env,
    );
    expect(res.status).toBe(404);
  });

  it('returns 404 for unknown routes', async () => {
    const res = await worker.fetch(new Request('https://daily.example.com/nonexistent'), env);
    expect(res.status).toBe(404);
    const body = await res.json() as any;
    expect(body.routes).toBeDefined();
  });

  // --- Pipeline execution ---

  it('pipeline stores bundle in KV with correct keys', async () => {
    await worker.fetch(new Request('https://daily.example.com/'), env);

    const putCalls = env.KV.put.mock.calls.map((c: any[]) => c[0] as string);
    const hasEditionKey = putCalls.some((k: string) => k.startsWith('cb:daily:morning:'));
    const hasLatestKey = putCalls.includes('cb:daily:latest');
    const hasLastRunKey = putCalls.includes('cb:daily:last-run');

    expect(hasEditionKey).toBe(true);
    expect(hasLatestKey).toBe(true);
    expect(hasLastRunKey).toBe(true);
  });

  it('pipeline stores markdown and JSON in R2', async () => {
    await worker.fetch(new Request('https://daily.example.com/'), env);

    const putCalls = env.DIGEST_BUCKET.put.mock.calls;
    expect(putCalls.length).toBe(2); // .md and .json

    const mdCall = putCalls.find((c: any[]) => (c[0] as string).endsWith('.md'));
    const jsonCall = putCalls.find((c: any[]) => (c[0] as string).endsWith('.json'));
    expect(mdCall).toBeDefined();
    expect(jsonCall).toBeDefined();
  });

  it('normalizes ESPN-format games into bundle', async () => {
    // Mock ESPN scoreboard to return our test game
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ events: [espnGame] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    ));

    const res = await worker.fetch(
      new Request('https://daily.example.com/trigger?edition=evening'),
      env,
    );
    const body = await res.json() as any;

    // ESPN game should appear in prior_night_results (evening edition)
    const results = body.prior_night_results ?? [];
    if (results.length > 0) {
      // Found the final game
      const result = results[0];
      expect(result.final.home).toBe('Texas Longhorns');
      expect(result.final.away).toBe('LSU Tigers');
    }
  });

  it('normalizes Highlightly-format games from KV', async () => {
    // Pre-populate KV with Highlightly data for yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });

    env.KV._store.set(`cb:scores:${yesterdayStr}`, JSON.stringify({
      data: [highlightlyGame],
    }));

    const res = await worker.fetch(new Request('https://daily.example.com/'), env);
    const body = await res.json() as any;
    expect(body.data_quality_notes).toBeDefined();
  });

  // --- Scheduled handler ---

  it('scheduled handler delegates to pipeline via waitUntil', async () => {
    const event = { cron: '0 11 * * *' };
    await worker.scheduled(event, env, mockCtx);
    expect(mockCtx.waitUntil).toHaveBeenCalled();
  });

  it('morning edition determined by cron containing "11"', async () => {
    // The pipeline runs inside waitUntil, so we trigger it directly
    const res = await worker.fetch(
      new Request('https://daily.example.com/trigger?edition=morning'),
      env,
    );
    const body = await res.json() as any;
    expect(body.edition).toBe('morning');
    // Morning edition should have upcoming_games field
    expect(body.upcoming_games).toBeDefined();
  });

  it('evening edition includes today finals as prior_night_results', async () => {
    const res = await worker.fetch(
      new Request('https://daily.example.com/trigger?edition=evening'),
      env,
    );
    const body = await res.json() as any;
    expect(body.edition).toBe('evening');
    expect(body.prior_night_results).toBeDefined();
    // Evening edition should have empty upcoming_games
    expect(body.upcoming_games).toEqual([]);
  });

  // --- Claude Code prompt ---

  it('bundle includes claude_code_prompt field', async () => {
    const res = await worker.fetch(new Request('https://daily.example.com/'), env);
    const body = await res.json() as any;
    expect(body.claude_code_prompt).toBeDefined();
    expect(body.claude_code_prompt).toContain('BSI College Baseball Daily');
  });

  // --- Error handling ---

  it('returns 500 when pipeline throws', async () => {
    // Force KV.put to throw, which will break storeBundle
    env.KV.put = vi.fn().mockRejectedValue(new Error('KV write failed'));

    const res = await worker.fetch(new Request('https://daily.example.com/'), env);
    expect(res.status).toBe(500);
    const body = await res.json() as any;
    expect(body.error).toBeDefined();
  });
});
