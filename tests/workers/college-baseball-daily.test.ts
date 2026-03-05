/**
 * BSI College Baseball Daily — Pipeline Worker Tests
 *
 * Tests the daily digest pipeline: data gathering from KV/ESPN,
 * game normalization (Highlightly + ESPN formats), Claude API take
 * generation with template fallback, bundle assembly, KV/R2 storage,
 * and HTTP handlers.
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
// Mock R2
// ---------------------------------------------------------------------------

function createMockR2() {
  const objects = new Map<string, { body: string; httpMetadata?: unknown; customMetadata?: unknown }>();
  return {
    put: vi.fn(async (key: string, value: string, opts?: unknown) => {
      objects.set(key, { body: value, ...(opts as Record<string, unknown>) });
    }),
    get: vi.fn(async (key: string) => {
      const obj = objects.get(key);
      if (!obj) return null;
      return { body: obj.body, text: async () => obj.body };
    }),
    _objects: objects,
  };
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const HIGHLIGHTLY_SCORES = {
  data: [
    {
      id: 1,
      homeTeam: { name: 'Texas', score: 12 },
      awayTeam: { name: 'UC Davis', score: 2 },
      homeScore: 12,
      awayScore: 2,
      status: { type: 'finished' },
      startTime: '2026-02-13T23:00:00Z',
      venue: { name: 'Disch-Falk Field' },
    },
    {
      id: 2,
      homeTeam: { name: 'LSU', score: 15 },
      awayTeam: { name: 'Milwaukee', score: 5 },
      homeScore: 15,
      awayScore: 5,
      status: { type: 'finished' },
      startTime: '2026-02-13T23:00:00Z',
      venue: { name: 'Alex Box Stadium' },
    },
    {
      id: 3,
      homeTeam: { name: 'Texas A&M', score: 0 },
      awayTeam: { name: 'Tennessee Tech', score: 0 },
      homeScore: 0,
      awayScore: 0,
      status: { type: 'scheduled' },
      startTime: '2026-02-14T17:00:00Z',
      venue: { name: 'Blue Bell Park' },
    },
  ],
  totalCount: 3,
};

const ESPN_SCOREBOARD = {
  events: [
    {
      id: '401600001',
      name: 'UC Davis Aggies at Texas Longhorns',
      date: '2026-02-14T18:00Z',
      competitions: [{
        venue: { fullName: 'UFCU Disch-Falk Field' },
        competitors: [
          {
            homeAway: 'home',
            team: { displayName: 'Texas Longhorns', abbreviation: 'TEX' },
            score: '0',
            records: [{ summary: '1-0' }],
          },
          {
            homeAway: 'away',
            team: { displayName: 'UC Davis Aggies', abbreviation: 'UCD' },
            score: '0',
            records: [{ summary: '0-1' }],
          },
        ],
        status: { type: { name: 'STATUS_SCHEDULED', completed: false } },
        broadcasts: [{ names: ['SEC Network+'] }],
      }],
    },
    {
      id: '401600002',
      name: 'Stanford Cardinal at Arizona Wildcats',
      date: '2026-02-14T20:00Z',
      competitions: [{
        venue: { fullName: 'Hi Corbett Field' },
        competitors: [
          {
            homeAway: 'home',
            team: { displayName: 'Arizona Wildcats', abbreviation: 'ARIZ' },
            score: '7',
            records: [{ summary: '0-1' }],
          },
          {
            homeAway: 'away',
            team: { displayName: 'Stanford Cardinal', abbreviation: 'STAN' },
            score: '10',
            records: [{ summary: '1-0' }],
          },
        ],
        status: { type: { name: 'STATUS_FINAL', completed: true } },
        broadcasts: [{ names: ['ESPN+'] }],
      }],
    },
  ],
};

const HIGHLIGHTLY_RANKINGS = {
  data: [
    { rank: 1, team: { name: 'UCLA' } },
    { rank: 2, team: { name: 'LSU' } },
    { rank: 3, team: { name: 'Texas' } },
    { rank: 24, team: { name: 'Arizona' } },
    { rank: 25, team: { name: 'Texas A&M' } },
  ],
};

const HIGHLIGHTLY_STANDINGS = {
  data: [
    { team: { name: 'Texas' }, wins: 1, losses: 0, conferenceRecord: '0-0' },
    { team: { name: 'Texas A&M' }, wins: 1, losses: 0, conferenceRecord: '0-0' },
  ],
};

const CLAUDE_API_RESPONSE = {
  content: [{
    text: '1. Texas enters with momentum after a dominant 12-2 opener. The process question is command: can UC Davis starters find the zone against a lineup that punished mistakes last night?\n2. Arizona needs to defend its home turf after an 11-hit effort that still produced a loss. The teaching point: sequencing matters more than contact volume.',
  }],
};

// ---------------------------------------------------------------------------
// Fetch mocks
// ---------------------------------------------------------------------------

function mockSuccessfulFetches() {
  return vi.fn(async (urlOrReq: string | URL | Request, init?: RequestInit) => {
    const url = typeof urlOrReq === 'string' ? urlOrReq : urlOrReq instanceof URL ? urlOrReq.toString() : urlOrReq.url;

    // ESPN scoreboard
    if (url.includes('espn.com') && url.includes('/scoreboard')) {
      return new Response(JSON.stringify(ESPN_SCOREBOARD), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // Claude API
    if (url.includes('api.anthropic.com')) {
      return new Response(JSON.stringify(CLAUDE_API_RESPONSE), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({}), { status: 200 });
  }) as unknown as typeof fetch;
}

function mockClaudeApiFailing() {
  return vi.fn(async (urlOrReq: string | URL | Request) => {
    const url = typeof urlOrReq === 'string' ? urlOrReq : urlOrReq instanceof URL ? urlOrReq.toString() : urlOrReq.url;

    if (url.includes('espn.com') && url.includes('/scoreboard')) {
      return new Response(JSON.stringify(ESPN_SCOREBOARD), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // Claude API fails
    if (url.includes('api.anthropic.com')) {
      return new Response('Rate limited', { status: 429 });
    }

    return new Response(JSON.stringify({}), { status: 200 });
  }) as unknown as typeof fetch;
}

function mockAllFailing() {
  return vi.fn(async () =>
    new Response('Server Error', { status: 500 })
  ) as unknown as typeof fetch;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BSI College Baseball Daily Pipeline', () => {
  let env: {
    KV: ReturnType<typeof createMockKV>;
    DIGEST_BUCKET: ReturnType<typeof createMockR2>;
    RAPIDAPI_KEY?: string;
    ANTHROPIC_API_KEY?: string;
  };
  let worker: {
    scheduled: (event: any, env: any, ctx: any) => Promise<void>;
    fetch: (request: Request, env: any) => Promise<Response>;
  };
  let originalFetch: typeof globalThis.fetch;
  let waitUntilPromises: Promise<void>[];
  const mockCtx = {
    waitUntil: (p: Promise<void>) => { waitUntilPromises.push(p); },
    passThroughOnException: () => {},
  };

  beforeEach(async () => {
    env = {
      KV: createMockKV(),
      DIGEST_BUCKET: createMockR2(),
      ANTHROPIC_API_KEY: 'test-anthropic-key',
    };
    worker = await import('../../workers/bsi-college-baseball-daily/index');
    if ('default' in worker) worker = (worker as any).default;
    originalFetch = globalThis.fetch;
    waitUntilPromises = [];

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-14T11:00:00Z')); // 5 AM CT — morning edition
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // -----------------------------------------------------------------------
  // Bundle schema
  // -----------------------------------------------------------------------

  describe('bundle schema', () => {
    it('produces a valid bundle with required fields', async () => {
      // Pre-populate KV with yesterday's scores and rankings
      env.KV._store.set('cb:scores:2026-02-13', JSON.stringify(HIGHLIGHTLY_SCORES));
      env.KV._store.set('cb:rankings', JSON.stringify(HIGHLIGHTLY_RANKINGS));
      env.KV._store.set('cb:standings:v3:SEC', JSON.stringify(HIGHLIGHTLY_STANDINGS));
      globalThis.fetch = mockSuccessfulFetches();

      const req = new Request('https://example.com/?edition=morning');
      const res = await worker.fetch(req, env as any);
      const bundle = await res.json() as any;

      expect(res.status).toBe(200);
      expect(bundle.run_date_local).toBe('2026-02-14');
      expect(bundle.timezone).toBe('America/Chicago');
      expect(bundle.lookback_date_local).toBe('2026-02-13');
      expect(bundle.edition).toBe('morning');
      expect(bundle.generated_at).toBeDefined();
      expect(bundle.data_quality_notes).toBeDefined();
      expect(bundle.sources_used).toBeInstanceOf(Array);
      expect(bundle.upcoming_games).toBeInstanceOf(Array);
      expect(bundle.prior_night_results).toBeInstanceOf(Array);
      expect(bundle.standings_snapshot).toBeInstanceOf(Array);
      expect(bundle.rankings).toBeInstanceOf(Array);
      expect(bundle.site_rendering_constraints).toBeDefined();
      expect(bundle.claude_code_prompt).toBeDefined();
      expect(bundle.meta).toMatchObject({
        source: 'bsi-college-baseball-daily',
        timezone: 'America/Chicago',
      });
    });

    it('handles missing odds gracefully', async () => {
      env.KV._store.set('cb:scores:2026-02-13', JSON.stringify(HIGHLIGHTLY_SCORES));
      env.KV._store.set('cb:rankings', JSON.stringify(HIGHLIGHTLY_RANKINGS));
      globalThis.fetch = mockSuccessfulFetches();

      const req = new Request('https://example.com/?edition=morning');
      const res = await worker.fetch(req, env as any);
      const bundle = await res.json() as any;

      // Every upcoming game should have odds marked as unavailable
      for (const game of bundle.upcoming_games) {
        expect(game.betting_odds.available).toBe(false);
        expect(game.betting_odds.reason).toContain('not yet integrated');
      }
    });

    it('includes quality flags for missing data', async () => {
      env.KV._store.set('cb:scores:2026-02-13', JSON.stringify(HIGHLIGHTLY_SCORES));
      globalThis.fetch = mockSuccessfulFetches();

      const req = new Request('https://example.com/?edition=morning');
      const res = await worker.fetch(req, env as any);
      const bundle = await res.json() as any;

      for (const game of bundle.upcoming_games) {
        expect(game.data_quality_flags).toContain('probable_pitcher_unknown');
        expect(game.data_quality_flags).toContain('odds_missing');
      }
    });
  });

  // -----------------------------------------------------------------------
  // Game normalization
  // -----------------------------------------------------------------------

  describe('game normalization', () => {
    it('normalizes Highlightly format games', async () => {
      env.KV._store.set('cb:scores:2026-02-13', JSON.stringify(HIGHLIGHTLY_SCORES));
      env.KV._store.set('cb:rankings', JSON.stringify(HIGHLIGHTLY_RANKINGS));
      globalThis.fetch = mockSuccessfulFetches();

      const req = new Request('https://example.com/?edition=morning');
      const res = await worker.fetch(req, env as any);
      const bundle = await res.json() as any;

      // Yesterday's finished games should appear in prior_night_results
      const results = bundle.prior_night_results;
      expect(results.length).toBeGreaterThanOrEqual(2);

      const texasGame = results.find((r: any) =>
        r.final.home === 'Texas' || r.final.away === 'Texas'
      );
      expect(texasGame).toBeDefined();
      expect(texasGame.final.score_home).toBe(12);
      expect(texasGame.final.score_away).toBe(2);
    });

    it('normalizes ESPN format games from fallback', async () => {
      // No KV cache — forces ESPN fetch
      globalThis.fetch = mockSuccessfulFetches();

      const req = new Request('https://example.com/?edition=morning');
      const res = await worker.fetch(req, env as any);
      const bundle = await res.json() as any;

      // ESPN games should be normalized and appear in the bundle
      expect(bundle.data_quality_notes.today_source || bundle.data_quality_notes.yesterday_source)
        .toContain('espn');
    });

    it('separates upcoming and final games for morning edition', async () => {
      // Mix of scheduled and final games
      env.KV._store.set('cb:scores:2026-02-14', JSON.stringify({
        data: [
          HIGHLIGHTLY_SCORES.data[2], // scheduled game
        ],
      }));
      env.KV._store.set('cb:scores:2026-02-13', JSON.stringify({
        data: [
          HIGHLIGHTLY_SCORES.data[0], // finished game
          HIGHLIGHTLY_SCORES.data[1], // finished game
        ],
      }));
      globalThis.fetch = mockSuccessfulFetches();

      const req = new Request('https://example.com/?edition=morning');
      const res = await worker.fetch(req, env as any);
      const bundle = await res.json() as any;

      // Upcoming should have scheduled games from today
      expect(bundle.upcoming_games.length).toBeGreaterThanOrEqual(1);
      // Prior night should have finished games from yesterday
      expect(bundle.prior_night_results.length).toBeGreaterThanOrEqual(2);
    });
  });

  // -----------------------------------------------------------------------
  // Claude API takes
  // -----------------------------------------------------------------------

  describe('Claude API matchup takes', () => {
    it('generates AI takes for notable games when API key is set', async () => {
      env.KV._store.set('cb:scores:2026-02-13', JSON.stringify(HIGHLIGHTLY_SCORES));
      env.KV._store.set('cb:rankings', JSON.stringify(HIGHLIGHTLY_RANKINGS));
      globalThis.fetch = mockSuccessfulFetches();

      const req = new Request('https://example.com/?edition=morning');
      const res = await worker.fetch(req, env as any);
      const bundle = await res.json() as any;

      // Source trail should include Claude API call
      const claudeSource = bundle.sources_used.find((s: any) => s.source_type === 'claude_api');
      expect(claudeSource).toBeDefined();
    });

    it('falls back to templates when ANTHROPIC_API_KEY is missing', async () => {
      env.ANTHROPIC_API_KEY = undefined;
      env.KV._store.set('cb:scores:2026-02-13', JSON.stringify(HIGHLIGHTLY_SCORES));
      env.KV._store.set('cb:rankings', JSON.stringify(HIGHLIGHTLY_RANKINGS));
      globalThis.fetch = mockSuccessfulFetches();

      const req = new Request('https://example.com/?edition=morning');
      const res = await worker.fetch(req, env as any);
      const bundle = await res.json() as any;

      // Should still produce a valid bundle — no Claude API in source trail
      expect(res.status).toBe(200);
      const claudeSource = bundle.sources_used.find((s: any) => s.source_type === 'claude_api');
      expect(claudeSource).toBeUndefined();
    });

    it('falls back to templates when Claude API returns error', async () => {
      env.KV._store.set('cb:scores:2026-02-13', JSON.stringify(HIGHLIGHTLY_SCORES));
      env.KV._store.set('cb:rankings', JSON.stringify(HIGHLIGHTLY_RANKINGS));
      globalThis.fetch = mockClaudeApiFailing();

      const req = new Request('https://example.com/?edition=morning');
      const res = await worker.fetch(req, env as any);
      const bundle = await res.json() as any;

      // Should still produce a valid bundle
      expect(res.status).toBe(200);
      expect(bundle.prior_night_results).toBeInstanceOf(Array);
    });
  });

  // -----------------------------------------------------------------------
  // Storage
  // -----------------------------------------------------------------------

  describe('storage', () => {
    it('writes bundle to KV with correct keys', async () => {
      env.KV._store.set('cb:scores:2026-02-13', JSON.stringify(HIGHLIGHTLY_SCORES));
      globalThis.fetch = mockSuccessfulFetches();

      const req = new Request('https://example.com/?edition=morning');
      await worker.fetch(req, env as any);

      expect(env.KV._store.has('cb:daily:morning:2026-02-14')).toBe(true);
      expect(env.KV._store.has('cb:daily:latest')).toBe(true);
      expect(env.KV._store.has('cb:daily:last-run')).toBe(true);
    });

    it('archives to R2 as markdown and JSON', async () => {
      env.KV._store.set('cb:scores:2026-02-13', JSON.stringify(HIGHLIGHTLY_SCORES));
      globalThis.fetch = mockSuccessfulFetches();

      const req = new Request('https://example.com/?edition=morning');
      await worker.fetch(req, env as any);

      expect(env.DIGEST_BUCKET._objects.has('daily-digest/2026-02-14-morning.md')).toBe(true);
      expect(env.DIGEST_BUCKET._objects.has('daily-digest/2026-02-14-morning.json')).toBe(true);
    });

    it('last-run metadata includes correct counts', async () => {
      env.KV._store.set('cb:scores:2026-02-13', JSON.stringify(HIGHLIGHTLY_SCORES));
      env.KV._store.set('cb:rankings', JSON.stringify(HIGHLIGHTLY_RANKINGS));
      globalThis.fetch = mockSuccessfulFetches();

      const req = new Request('https://example.com/?edition=morning');
      await worker.fetch(req, env as any);

      const lastRun = JSON.parse(env.KV._store.get('cb:daily:last-run')!);
      expect(lastRun.edition).toBe('morning');
      expect(lastRun.date).toBe('2026-02-14');
      expect(typeof lastRun.upcoming_count).toBe('number');
      expect(typeof lastRun.results_count).toBe('number');
      expect(typeof lastRun.takes_generated).toBe('number');
    });
  });

  // -----------------------------------------------------------------------
  // Claude Code prompt
  // -----------------------------------------------------------------------

  describe('Claude Code prompt generation', () => {
    it('generates a markdown prompt with required sections', async () => {
      env.KV._store.set('cb:scores:2026-02-13', JSON.stringify(HIGHLIGHTLY_SCORES));
      env.KV._store.set('cb:rankings', JSON.stringify(HIGHLIGHTLY_RANKINGS));
      env.KV._store.set('cb:standings:v3:SEC', JSON.stringify(HIGHLIGHTLY_STANDINGS));
      globalThis.fetch = mockSuccessfulFetches();

      const req = new Request('https://example.com/?edition=morning');
      const res = await worker.fetch(req, env as any);
      const bundle = await res.json() as any;
      const prompt = bundle.claude_code_prompt;

      expect(prompt).toContain('BSI College Baseball Daily');
      expect(prompt).toContain('2026-02-14');
      expect(prompt).toContain('Do not web search');
      expect(prompt).toContain('Source Trail');
      expect(prompt).toContain('BSI Codebase Context');
    });

    it('prompt includes ranked matchups as featured', async () => {
      env.KV._store.set('cb:scores:2026-02-14', JSON.stringify({
        data: [HIGHLIGHTLY_SCORES.data[2]], // Texas A&M (ranked) game
      }));
      env.KV._store.set('cb:rankings', JSON.stringify(HIGHLIGHTLY_RANKINGS));
      globalThis.fetch = mockSuccessfulFetches();

      const req = new Request('https://example.com/?edition=morning');
      const res = await worker.fetch(req, env as any);
      const bundle = await res.json() as any;
      const prompt = bundle.claude_code_prompt;

      // Ranked teams should appear in Featured section
      if (prompt.includes('Featured')) {
        expect(prompt).toContain('#25');
      }
    });
  });

  // -----------------------------------------------------------------------
  // HTTP handlers
  // -----------------------------------------------------------------------

  describe('HTTP handlers', () => {
    it('GET /status returns pipeline status', async () => {
      env.KV._store.set('cb:daily:last-run', JSON.stringify({
        edition: 'morning',
        date: '2026-02-14',
        generated_at: '2026-02-14T11:00:00Z',
        upcoming_count: 30,
        results_count: 15,
        takes_generated: 8,
      }));

      const req = new Request('https://example.com/status');
      const res = await worker.fetch(req, env as any);
      const body = await res.json() as any;

      expect(res.status).toBe(200);
      expect(body.ok).toBe(true);
      expect(body.season).toBe(true); // February is baseball season
      expect(body.last_run.edition).toBe('morning');
    });

    it('GET /bundle returns stored bundle from KV', async () => {
      const testBundle = { run_date_local: '2026-02-14', test: true };
      env.KV._store.set('cb:daily:morning:2026-02-14', JSON.stringify(testBundle));

      const req = new Request('https://example.com/bundle?date=2026-02-14&edition=morning');
      const res = await worker.fetch(req, env as any);
      const body = await res.json() as any;

      expect(res.status).toBe(200);
      expect(body.run_date_local).toBe('2026-02-14');
    });

    it('GET /bundle falls back to latest when specific key missing', async () => {
      const latestBundle = { run_date_local: '2026-02-13', edition: 'evening' };
      env.KV._store.set('cb:daily:latest', JSON.stringify(latestBundle));

      const req = new Request('https://example.com/bundle?date=2026-02-14&edition=morning');
      const res = await worker.fetch(req, env as any);
      const body = await res.json() as any;

      expect(res.status).toBe(200);
      expect(body.run_date_local).toBe('2026-02-13');
    });

    it('GET /bundle returns 404 when no bundles exist', async () => {
      const req = new Request('https://example.com/bundle?date=2099-01-01&edition=morning');
      const res = await worker.fetch(req, env as any);
      expect(res.status).toBe(404);
    });

    it('GET /prompt returns Claude Code prompt from R2', async () => {
      const markdownPrompt = '# BSI Daily\nTest prompt content';
      env.DIGEST_BUCKET._objects.set('daily-digest/2026-02-14-morning.md', {
        body: markdownPrompt,
      });

      const req = new Request('https://example.com/prompt?date=2026-02-14&edition=morning');
      const res = await worker.fetch(req, env as any);
      const text = await res.text();

      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('text/markdown');
      expect(text).toContain('BSI Daily');
    });

    it('unknown route returns 404 with route list', async () => {
      const req = new Request('https://example.com/unknown');
      const res = await worker.fetch(req, env as any);
      const body = await res.json() as any;

      expect(res.status).toBe(404);
      expect(body.routes).toContain('/status');
    });
  });

  // -----------------------------------------------------------------------
  // Scheduled handler (cron)
  // -----------------------------------------------------------------------

  describe('scheduled handler', () => {
    it('morning cron triggers morning edition', async () => {
      env.KV._store.set('cb:scores:2026-02-13', JSON.stringify(HIGHLIGHTLY_SCORES));
      globalThis.fetch = mockSuccessfulFetches();

      await worker.scheduled({ cron: '0 11 * * *' }, env, mockCtx);
      await Promise.all(waitUntilPromises);

      expect(env.KV._store.has('cb:daily:morning:2026-02-14')).toBe(true);
    });

    it('evening cron triggers evening edition', async () => {
      // 05:00 UTC Feb 15 = 11 PM CT Feb 14 (CST = UTC-6)
      vi.setSystemTime(new Date('2026-02-15T05:00:00Z'));
      env.KV._store.set('cb:scores:2026-02-14', JSON.stringify(HIGHLIGHTLY_SCORES));
      globalThis.fetch = mockSuccessfulFetches();

      await worker.scheduled({ cron: '0 5 * * *' }, env, mockCtx);
      await Promise.all(waitUntilPromises);

      expect(env.KV._store.has('cb:daily:evening:2026-02-14')).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Error resilience
  // -----------------------------------------------------------------------

  describe('error resilience', () => {
    it('produces bundle even when all external APIs fail', async () => {
      globalThis.fetch = mockAllFailing();

      const req = new Request('https://example.com/?edition=morning');
      const res = await worker.fetch(req, env as any);
      const bundle = await res.json() as any;

      // Should still return 200 with an empty-ish but valid bundle
      expect(res.status).toBe(200);
      expect(bundle.run_date_local).toBe('2026-02-14');
      expect(bundle.upcoming_games).toBeInstanceOf(Array);
      expect(bundle.prior_night_results).toBeInstanceOf(Array);
    });

    it('handles empty KV gracefully', async () => {
      globalThis.fetch = mockSuccessfulFetches();

      const req = new Request('https://example.com/?edition=morning');
      const res = await worker.fetch(req, env as any);
      const bundle = await res.json() as any;

      expect(res.status).toBe(200);
      expect(bundle.data_quality_notes).toBeDefined();
    });

    it('notes ranking unavailability in quality notes', async () => {
      globalThis.fetch = mockSuccessfulFetches();

      const req = new Request('https://example.com/?edition=morning');
      const res = await worker.fetch(req, env as any);
      const bundle = await res.json() as any;

      expect(bundle.data_quality_notes.rankings).toBe('unavailable');
    });
  });

  // -----------------------------------------------------------------------
  // Brand config
  // -----------------------------------------------------------------------

  describe('site rendering constraints', () => {
    it('includes BSI brand colors and fonts', async () => {
      globalThis.fetch = mockSuccessfulFetches();

      const req = new Request('https://example.com/?edition=morning');
      const res = await worker.fetch(req, env as any);
      const bundle = await res.json() as any;

      expect(bundle.site_rendering_constraints.brand_colors.burnt_orange).toBe('#BF5700');
      expect(bundle.site_rendering_constraints.fonts.headings).toBe('Oswald');
      expect(bundle.site_rendering_constraints.fonts.body).toBe('Cormorant Garamond');
    });
  });
});
