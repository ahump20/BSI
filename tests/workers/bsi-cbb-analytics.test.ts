/**
 * BSI CBB Analytics Tests — Cron Worker
 *
 * Tests the scheduled analytics pipeline and manual /run trigger.
 * All D1 queries are mocked to return sample data that exercises
 * the batting/pitching computation paths.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function createMockKV() {
  const store = new Map<string, string>();
  return {
    put: vi.fn(async (key: string, value: string, opts?: { expirationTtl?: number }) => {
      store.set(key, value);
    }),
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    _store: store,
  };
}

/** Minimal D1 mock — supports prepare().bind().first/all/run and prepare().first/all/run */
function createMockD1(responses: Record<string, { results?: any[]; first?: any }> = {}) {
  return {
    prepare: vi.fn((sql: string) => {
      // Find matching response by checking if sql contains a key substring
      let matched: { results?: any[]; first?: any } | undefined;
      for (const [pattern, response] of Object.entries(responses)) {
        if (sql.includes(pattern)) {
          matched = response;
          break;
        }
      }

      const resultMethods = {
        first: vi.fn(async () => matched?.first ?? null),
        all: vi.fn(async () => ({ results: matched?.results ?? [] })),
        run: vi.fn(async () => ({ success: true })),
      };

      return {
        ...resultMethods,
        bind: vi.fn((..._args: any[]) => resultMethods),
      };
    }),
    batch: vi.fn(async (stmts: any[]) => stmts.map(() => ({ success: true }))),
  };
}

function createEnv(dbResponses: Record<string, { results?: any[]; first?: any }> = {}) {
  return {
    KV: createMockKV(),
    DB: createMockD1(dbResponses),
  };
}

// Sample batting row matching PlayerBattingRow interface
const sampleBatter = {
  espn_id: 'p1',
  name: 'Test Hitter',
  team: 'Test U',
  team_id: 't1',
  position: '1B',
  conference: 'SEC',
  at_bats: 80,
  hits: 28,
  doubles: 6,
  triples: 1,
  home_runs: 4,
  walks_bat: 12,
  strikeouts_bat: 15,
  hit_by_pitch: 3,
  sacrifice_flies: 2,
  runs: 18,
  games_bat: 20,
  on_base_pct: 0.380,
  slugging_pct: 0.525,
  stolen_bases: 5,
  caught_stealing: 1,
};

// Sample pitching row matching PlayerPitchingRow interface
const samplePitcher = {
  espn_id: 'p2',
  name: 'Test Pitcher',
  team: 'Test U',
  team_id: 't1',
  position: 'SP',
  conference: 'SEC',
  innings_pitched_thirds: 150, // 50 IP
  strikeouts_pitch: 55,
  walks_pitch: 18,
  home_runs_allowed: 5,
  earned_runs: 22,
  hits_allowed: 40,
  games_pitch: 10,
  wins: 5,
  losses: 2,
  saves: 0,
};

describe('bsi-cbb-analytics', () => {
  let worker: {
    fetch: (request: Request, env: any) => Promise<Response>;
    scheduled: (event: any, env: any, ctx: any) => Promise<void>;
  };
  const mockCtx = { waitUntil: vi.fn(), passThroughOnException: vi.fn() };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --- Fetch handler ---

  it('returns info on root path', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('ok')));
    const env = createEnv();
    const mod = await import('../../workers/bsi-cbb-analytics/index');
    worker = 'default' in mod ? (mod as any).default : mod;

    const res = await worker.fetch(new Request('https://analytics.example.com/'), env);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('BSI CBB Analytics');
  });

  it('/run triggers analytics pipeline and returns results', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('ok')));
    const env = createEnv({
      // League context query (batting aggregates)
      'SUM(at_bats)': {
        first: {
          total_ab: 5000, total_h: 1350, total_2b: 270, total_3b: 30,
          total_hr: 100, total_bb: 500, total_k: 1100, total_hbp: 80,
          total_sf: 60, total_r: 700, n: 200,
        },
      },
      // League context query (pitching aggregates)
      'SUM(innings_pitched_thirds)': {
        first: {
          total_ip_thirds: 15000, total_k: 4000, total_bb: 1500,
          total_hr: 300, total_er: 2000, n: 150,
        },
      },
      // Batting player query (computeBatting)
      'at_bats, hits, doubles': { results: [sampleBatter] },
      // Pitching player query (computePitching) — must not collide with SUM() above
      'strikeouts_pitch, walks_pitch, home_runs_allowed': { results: [samplePitcher] },
      // Top 50 leaderboard queries
      'ORDER BY woba DESC': { results: [] },
      'ORDER BY fip ASC': { results: [] },
      // Park factors: team list + processed_games home/away/cross-conf
      'DISTINCT team': { results: [{ team: 'Test U', team_id: 't1' }] },
      'home_team_id as team_id': { results: [] },
      'away_team_id as team_id': { results: [] },
      // Conference strength queries
      'AVG(woba)': { results: [{ conference: 'SEC', avg_woba: 0.350, avg_ops: 0.800, n: 10 }] },
      'AVG(era)': { results: [{ conference: 'SEC', avg_era: 4.20 }] },
      'home_team_id, away_team_id, home_score': { results: [] },
      // League context D1 persist (INSERT OR REPLACE INTO cbb_league_context)
      'cbb_league_context': { results: [] },
    });

    const mod = await import('../../workers/bsi-cbb-analytics/index');
    worker = 'default' in mod ? (mod as any).default : mod;

    const res = await worker.fetch(new Request('https://analytics.example.com/run'), env);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(body.battingCount).toBe(1);
    expect(body.pitchingCount).toBe(1);
    expect(body.durationMs).toBeDefined();
  });

  it('stores league context in KV after computation', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('ok')));
    const env = createEnv({
      'SUM(at_bats)': {
        first: {
          total_ab: 5000, total_h: 1350, total_2b: 270, total_3b: 30,
          total_hr: 100, total_bb: 500, total_k: 1100, total_hbp: 80,
          total_sf: 60, total_r: 700, n: 200,
        },
      },
      'SUM(innings_pitched_thirds)': {
        first: {
          total_ip_thirds: 15000, total_k: 4000, total_bb: 1500,
          total_hr: 300, total_er: 2000, n: 150,
        },
      },
      'at_bats, hits, doubles': { results: [] },
      'innings_pitched_thirds': { results: [] },
    });

    const mod = await import('../../workers/bsi-cbb-analytics/index');
    worker = 'default' in mod ? (mod as any).default : mod;

    await worker.fetch(new Request('https://analytics.example.com/run'), env);

    const leagueCall = env.KV.put.mock.calls.find(
      (c: any[]) => typeof c[0] === 'string' && c[0].startsWith('savant:league:'),
    );
    expect(leagueCall).toBeDefined();
    const league = JSON.parse(leagueCall![1]);
    expect(league.woba).toBeGreaterThan(0);
    expect(league.era).toBeGreaterThan(0);
    expect(league.wobaScale).toBeGreaterThan(0);
  });

  it('uses default league context when D1 returns no data', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('ok')));
    const env = createEnv({
      'SUM(at_bats)': { first: null },
      'SUM(innings_pitched_thirds)': { first: null },
      'at_bats, hits, doubles': { results: [] },
      'innings_pitched_thirds': { results: [] },
    });

    const mod = await import('../../workers/bsi-cbb-analytics/index');
    worker = 'default' in mod ? (mod as any).default : mod;

    const res = await worker.fetch(new Request('https://analytics.example.com/run'), env);
    const body = await res.json() as any;
    expect(body.success).toBe(true);

    // Should still store a league context (the default)
    const leagueCall = env.KV.put.mock.calls.find(
      (c: any[]) => typeof c[0] === 'string' && c[0].startsWith('savant:league:'),
    );
    expect(leagueCall).toBeDefined();
    const league = JSON.parse(leagueCall![1]);
    expect(league.woba).toBe(0.340); // Default value
  });

  it('handles D1 errors gracefully', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('ok')));
    const env = createEnv();
    // Override prepare to throw
    env.DB.prepare = vi.fn(() => {
      throw new Error('D1 unavailable');
    });

    const mod = await import('../../workers/bsi-cbb-analytics/index');
    worker = 'default' in mod ? (mod as any).default : mod;

    const res = await worker.fetch(new Request('https://analytics.example.com/run'), env);
    const body = await res.json() as any;
    expect(body.success).toBe(false);
    expect(body.error).toContain('D1 unavailable');
  });

  // --- Scheduled handler ---

  it('runs scheduled handler without errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('ok')));
    const env = createEnv({
      'SUM(at_bats)': { first: null },
      'SUM(innings_pitched_thirds)': { first: null },
      'at_bats, hits, doubles': { results: [] },
      'innings_pitched_thirds': { results: [] },
    });

    const mod = await import('../../workers/bsi-cbb-analytics/index');
    worker = 'default' in mod ? (mod as any).default : mod;

    // Weekday — should NOT run park factors or conference strength
    const event = { cron: '0 11 * * *', scheduledTime: Date.now() };
    await expect(worker.scheduled(event, env, mockCtx)).resolves.not.toThrow();
  });

  it('includes weekly computations on Sunday', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('ok')));

    // Mock Date to be Sunday
    const sunday = new Date('2026-03-01T11:00:00Z'); // March 1 2026 is a Sunday
    vi.setSystemTime(sunday);

    const env = createEnv({
      'SUM(at_bats)': { first: null },
      'SUM(innings_pitched_thirds)': { first: null },
      'at_bats, hits, doubles': { results: [] },
      'innings_pitched_thirds': { results: [] },
      'DISTINCT team': { results: [] },
      'AVG(woba)': { results: [] },
    });

    const mod = await import('../../workers/bsi-cbb-analytics/index');
    worker = 'default' in mod ? (mod as any).default : mod;

    const res = await worker.fetch(new Request('https://analytics.example.com/run'), env);
    const body = await res.json() as any;
    expect(body.success).toBe(true);
    // On manual /run, includeWeekly is always true
    expect(body.parkFactorsCount).toBeDefined();

    vi.useRealTimers();
  });

  // --- Batting leaderboard caching ---

  it('caches batting leaderboard in KV after computation', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('ok')));
    const env = createEnv({
      'SUM(at_bats)': {
        first: {
          total_ab: 5000, total_h: 1350, total_2b: 270, total_3b: 30,
          total_hr: 100, total_bb: 500, total_k: 1100, total_hbp: 80,
          total_sf: 60, total_r: 700, n: 200,
        },
      },
      'SUM(innings_pitched_thirds)': {
        first: {
          total_ip_thirds: 15000, total_k: 4000, total_bb: 1500,
          total_hr: 300, total_er: 2000, n: 150,
        },
      },
      'at_bats, hits, doubles': { results: [sampleBatter] },
      'innings_pitched_thirds': { results: [] },
      'ORDER BY woba DESC': { results: [{ player_name: 'Test Hitter', woba: 0.450 }] },
    });

    const mod = await import('../../workers/bsi-cbb-analytics/index');
    worker = 'default' in mod ? (mod as any).default : mod;

    await worker.fetch(new Request('https://analytics.example.com/run'), env);

    const lbCall = env.KV.put.mock.calls.find(
      (c: any[]) => typeof c[0] === 'string' && c[0].includes('savant:batting:leaderboard'),
    );
    expect(lbCall).toBeDefined();
    expect(lbCall![2]?.expirationTtl).toBe(3600);
  });
});
