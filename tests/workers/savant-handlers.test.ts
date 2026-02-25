/**
 * Savant handler tests — league, team, SOS, and CPI endpoints.
 *
 * Mock pattern: D1 queries are intercepted via SQL pattern matching on the
 * prepare() string. KV is an in-memory Map. Handlers are imported directly
 * and called with the mock Env — no Hono request lifecycle needed.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  handleCBBLeagueSabermetrics,
  handleCBBTeamSabermetrics,
  handleCBBTeamSOS,
  handleCBBConferencePowerIndex,
} from '../../workers/handlers/college-baseball/savant';

// ---------------------------------------------------------------------------
// Mock D1 + KV
// ---------------------------------------------------------------------------

type SQLHandler = (binds: unknown[]) => { results: unknown[] } | Record<string, unknown> | null;

function createMockD1(handlers: Record<string, SQLHandler>) {
  return {
    prepare(sql: string) {
      const handler = Object.entries(handlers).find(([pattern]) =>
        sql.toLowerCase().includes(pattern.toLowerCase()),
      );
      let binds: unknown[] = [];

      const stmt = {
        bind(...args: unknown[]) {
          binds = args;
          return stmt;
        },
        async first<T>(): Promise<T | null> {
          if (!handler) return null;
          return handler[1](binds) as T | null;
        },
        async all<T>(): Promise<{ results: T[] }> {
          if (!handler) return { results: [] };
          const result = handler[1](binds);
          if (result && 'results' in result) return result as { results: T[] };
          return { results: [] };
        },
      };
      return stmt;
    },
    batch: vi.fn(async () => []),
  };
}

function createMockKV(initial: Record<string, unknown> = {}) {
  const store = new Map<string, string>(
    Object.entries(initial).map(([k, v]) => [k, JSON.stringify(v)]),
  );
  return {
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    put: vi.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
  };
}

function parseResponseJson(res: Response) {
  return res.json() as Promise<Record<string, unknown>>;
}

// ---------------------------------------------------------------------------
// Test data factories
// ---------------------------------------------------------------------------

function makeBattingRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    total_ab: 500,
    total_h: 150,
    total_2b: 30,
    total_3b: 5,
    total_hr: 20,
    total_bb: 60,
    total_k: 100,
    total_hbp: 10,
    total_sf: 5,
    total_r: 80,
    qualified_hitters: 200,
    ...overrides,
  };
}

function makePitchingRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    total_ip_thirds: 3000, // 1000 IP
    total_k: 800,
    total_bb: 300,
    total_hr: 80,
    total_er: 400,
    qualified_pitchers: 50,
    ...overrides,
  };
}

function makeTeamBattingRow(teamId: string, team: string, overrides: Partial<Record<string, unknown>> = {}) {
  return {
    team_id: teamId,
    team,
    total_ab: 200,
    total_h: 60,
    total_2b: 10,
    total_3b: 2,
    total_hr: 8,
    total_bb: 25,
    total_k: 40,
    ...overrides,
  };
}

function makeGameRow(homeId: string, awayId: string, homeScore: number, awayScore: number) {
  return {
    game_id: `${homeId}-${awayId}-${Date.now()}`,
    home_team_id: homeId,
    away_team_id: awayId,
    home_score: homeScore,
    away_score: awayScore,
  };
}

// ---------------------------------------------------------------------------
// handleCBBLeagueSabermetrics
// ---------------------------------------------------------------------------

describe('handleCBBLeagueSabermetrics', () => {
  it('returns cached data on KV hit', async () => {
    const cachedPayload = { season: 2026, league_woba: 0.340, cached: true };
    const kv = createMockKV({ 'cb:saber:league:2026': cachedPayload });
    const db = createMockD1({});
    const env = { KV: kv, DB: db } as unknown as Parameters<typeof handleCBBLeagueSabermetrics>[0];

    const res = await handleCBBLeagueSabermetrics(env);
    expect(res.status).toBe(200);

    const body = await parseResponseJson(res);
    expect(body.cached).toBe(true);
    expect(res.headers.get('X-Cache')).toBe('HIT');
  });

  it('computes league baselines from D1 on cache miss', async () => {
    const kv = createMockKV();
    const db = createMockD1({
      'SUM(at_bats)': () => makeBattingRow(),
      'SUM(innings_pitched_thirds)': () => makePitchingRow(),
    });
    const env = { KV: kv, DB: db } as unknown as Parameters<typeof handleCBBLeagueSabermetrics>[0];

    const res = await handleCBBLeagueSabermetrics(env);
    expect(res.status).toBe(200);

    const body = await parseResponseJson(res);
    expect(body.season).toBe(2026);
    expect(body.league_woba).toBeTypeOf('number');
    expect((body.league_woba as number)).toBeGreaterThan(0);
    expect(body.league_fip).toBeTypeOf('number');
    expect(body.fip_constant).toBeTypeOf('number');
    expect(body.woba_scale).toBeTypeOf('number');
    expect(body.meta).toBeDefined();
    expect(res.headers.get('X-Cache')).toBe('MISS');
  });

  it('returns 404 when no qualifying data exists', async () => {
    const kv = createMockKV();
    const db = createMockD1({
      'SUM(at_bats)': () => null,
      'SUM(innings_pitched_thirds)': () => null,
    });
    const env = { KV: kv, DB: db } as unknown as Parameters<typeof handleCBBLeagueSabermetrics>[0];

    const res = await handleCBBLeagueSabermetrics(env);
    expect(res.status).toBe(404);

    const body = await parseResponseJson(res);
    expect(body.error).toBe('No qualifying data');
  });

  it('marks thin_sample when fewer than 100 qualified hitters', async () => {
    const kv = createMockKV();
    const db = createMockD1({
      'SUM(at_bats)': () => makeBattingRow({ qualified_hitters: 50 }),
      'SUM(innings_pitched_thirds)': () => makePitchingRow(),
    });
    const env = { KV: kv, DB: db } as unknown as Parameters<typeof handleCBBLeagueSabermetrics>[0];

    const res = await handleCBBLeagueSabermetrics(env);
    const body = await parseResponseJson(res);
    expect(body.thin_sample).toBe(true);
    // woba_scale should fall back to default 1.15 for thin samples
    expect(body.woba_scale).toBe(1.15);
  });
});

// ---------------------------------------------------------------------------
// handleCBBTeamSabermetrics
// ---------------------------------------------------------------------------

describe('handleCBBTeamSabermetrics', () => {
  it('returns cached data on KV hit', async () => {
    const cached = { teamId: '126', season: 2026, cached: true };
    const kv = createMockKV({ 'cb:saber:team:126': cached });
    const db = createMockD1({});
    const env = { KV: kv, DB: db } as unknown as Parameters<typeof handleCBBTeamSabermetrics>[1];

    const res = await handleCBBTeamSabermetrics('126', env);
    expect(res.status).toBe(200);

    const body = await parseResponseJson(res);
    expect(body.cached).toBe(true);
  });

  it('computes team sabermetrics with hitter and pitcher stats', async () => {
    const leagueBaseline = {
      league_woba: 0.340,
      league_fip: 4.50,
      league_babip: 0.300,
      league_kpct: 0.200,
      league_bbpct: 0.100,
      fip_constant: 3.80,
      woba_scale: 1.15,
      runs_per_pa: 0.060,
    };
    const kv = createMockKV({ 'cb:saber:league:2026': leagueBaseline });

    const hitters = [
      {
        espn_id: 'p1', name: 'Player One', position: '1B',
        at_bats: 100, hits: 35, doubles: 8, triples: 1, home_runs: 5,
        walks_bat: 15, strikeouts_bat: 20, hit_by_pitch: 2, sacrifice_flies: 1,
        games_bat: 20, on_base_pct: 0.380, slugging_pct: 0.520,
      },
    ];

    const pitchers = [
      {
        espn_id: 'p2', name: 'Pitcher One', position: 'P',
        innings_pitched_thirds: 180, strikeouts_pitch: 60,
        walks_pitch: 20, home_runs_allowed: 4, earned_runs: 18,
        hits_allowed: 45, games_pitch: 10,
      },
    ];

    const db = createMockD1({
      'FROM player_season_stats': (binds) => {
        const sql = 'from player_season_stats'; // pattern context
        // Hitters query includes 'at_bats >= 20'
        return { results: hitters };
      },
      'innings_pitched_thirds >= 45': () => ({ results: pitchers }),
    });

    const env = { KV: kv, DB: db } as unknown as Parameters<typeof handleCBBTeamSabermetrics>[1];
    const res = await handleCBBTeamSabermetrics('126', env);
    expect(res.status).toBe(200);

    const body = await parseResponseJson(res);
    expect(body.teamId).toBe('126');
    expect(body.batting).toBeDefined();
    expect(body.pitching).toBeDefined();
    expect(body.league).toBeDefined();

    const batting = body.batting as Record<string, unknown>;
    expect(batting.woba).toBeTypeOf('number');
    expect(batting.wrc_plus).toBeTypeOf('number');
    expect((batting.top_hitters as unknown[]).length).toBe(1);

    const pitching = body.pitching as Record<string, unknown>;
    expect(pitching.fip).toBeTypeOf('number');
    expect((pitching.top_pitchers as unknown[]).length).toBe(1);
  });

  it('resolves slug-based teamId via D1 lookup', async () => {
    const leagueBaseline = {
      league_woba: 0.340, league_fip: 4.50, league_babip: 0.300,
      league_kpct: 0.200, league_bbpct: 0.100,
      fip_constant: 3.80, woba_scale: 1.15, runs_per_pa: 0.060,
    };
    const kv = createMockKV({ 'cb:saber:league:2026': leagueBaseline });

    const db = createMockD1({
      'LOWER(team) LIKE LOWER': () => ({ team_id: '126' }),
      'at_bats >= 20': () => ({ results: [] }),
      'innings_pitched_thirds >= 45': () => ({ results: [] }),
    });

    const env = { KV: kv, DB: db } as unknown as Parameters<typeof handleCBBTeamSabermetrics>[1];
    const res = await handleCBBTeamSabermetrics('texas-longhorns', env);
    expect(res.status).toBe(200);

    const body = await parseResponseJson(res);
    // Should resolve to the numeric ID
    expect(body.teamId).toBe('126');
  });
});

// ---------------------------------------------------------------------------
// handleCBBTeamSOS
// ---------------------------------------------------------------------------

describe('handleCBBTeamSOS', () => {
  it('returns cached SOS data on KV hit', async () => {
    const cached = { team_id: '126', rpi: 0.600, cached: true };
    const kv = createMockKV({ 'cb:sos:126': cached });
    const db = createMockD1({});
    const env = { KV: kv, DB: db } as unknown as Parameters<typeof handleCBBTeamSOS>[1];

    const res = await handleCBBTeamSOS('126', env);
    expect(res.status).toBe(200);

    const body = await parseResponseJson(res);
    expect(body.cached).toBe(true);
  });

  it('computes RPI from game records', async () => {
    const kv = createMockKV();
    const games = [
      makeGameRow('126', '200', 5, 3),  // 126 wins
      makeGameRow('126', '201', 7, 2),  // 126 wins
      makeGameRow('200', '201', 4, 6),  // 201 wins
      makeGameRow('201', '126', 3, 8),  // 126 wins
    ];

    const db = createMockD1({
      'processed_games': () => ({ results: games }),
    });

    const env = { KV: kv, DB: db } as unknown as Parameters<typeof handleCBBTeamSOS>[1];
    const res = await handleCBBTeamSOS('126', env);
    expect(res.status).toBe(200);

    const body = await parseResponseJson(res);
    expect(body.team_id).toBe('126');
    expect(body.wp).toBeTypeOf('number');
    expect(body.owp).toBeTypeOf('number');
    expect(body.rpi).toBeTypeOf('number');
    expect(body.rpi_rank).toBeTypeOf('number');
    expect(body.sos_rank).toBeTypeOf('number');

    // Team 126 is 3-0, should have high WP
    expect((body.wp as number)).toBe(1.0);
    expect((body.record as Record<string, number>).wins).toBe(3);
    expect((body.record as Record<string, number>).losses).toBe(0);

    // Opponents list should include 200 and 201
    const opponents = body.opponents as Array<Record<string, unknown>>;
    const oppIds = opponents.map((o) => o.id);
    expect(oppIds).toContain('200');
    expect(oppIds).toContain('201');
  });

  it('returns 404 when no games exist', async () => {
    const kv = createMockKV();
    const db = createMockD1({
      'processed_games': () => ({ results: [] }),
    });

    const env = { KV: kv, DB: db } as unknown as Parameters<typeof handleCBBTeamSOS>[1];
    const res = await handleCBBTeamSOS('126', env);
    expect(res.status).toBe(404);

    const body = await parseResponseJson(res);
    expect(body.error).toContain('No game data');
  });
});

// ---------------------------------------------------------------------------
// handleCBBConferencePowerIndex
// ---------------------------------------------------------------------------

describe('handleCBBConferencePowerIndex', () => {
  // Use real espnIds from team-metadata.ts so the handler's metaByEspnId
  // lookup resolves conference correctly (126=Texas/SEC, 75=Florida/SEC, 117=Clemson/ACC).
  const secTeams = [
    makeTeamBattingRow('126', 'Texas', { total_hr: 12 }),
    makeTeamBattingRow('75', 'Florida', { total_hr: 10 }),
  ];

  const accTeams = [
    makeTeamBattingRow('117', 'Clemson', { total_hr: 9 }),
  ];

  const allTeams = [...secTeams, ...accTeams];

  const pitchingRows = [
    { team_id: '126', total_ip_thirds: 300, total_k: 90, total_bb: 30, total_hr: 6, total_er: 25 },
    { team_id: '75', total_ip_thirds: 270, total_k: 80, total_bb: 35, total_hr: 8, total_er: 30 },
    { team_id: '117', total_ip_thirds: 250, total_k: 70, total_bb: 25, total_hr: 5, total_er: 20 },
  ];

  const confRows = [
    { team_id: '126', conference: 'SEC' },
    { team_id: '75', conference: 'SEC' },
    { team_id: '117', conference: 'ACC' },
  ];

  const games = [
    makeGameRow('126', '75', 5, 3),    // SEC vs SEC: 126 wins
    makeGameRow('75', '117', 4, 6),    // Cross-conf: 117 wins
    makeGameRow('126', '117', 7, 1),   // Cross-conf: 126 wins
  ];

  function makeEnv(kvInit: Record<string, unknown> = {}) {
    const kv = createMockKV(kvInit);
    const db = createMockD1({
      'cb:saber:league': () => ({ league_woba: 0.340 }),
      'SUM(at_bats)': () => ({ results: allTeams }),
      'SUM(innings_pitched_thirds)': () => ({ results: pitchingRows }),
      'DISTINCT team_id, conference': () => ({ results: confRows }),
      'processed_games': () => ({ results: games }),
    });
    return { KV: kv, DB: db } as unknown as Parameters<typeof handleCBBConferencePowerIndex>[1];
  }

  it('returns cached data on KV hit', async () => {
    const cached = { conference: 'SEC', teams: [{ rank: 1 }], cached: true };
    const env = makeEnv({ 'cb:cpi:SEC': cached });

    const res = await handleCBBConferencePowerIndex('SEC', env);
    expect(res.status).toBe(200);

    const body = await parseResponseJson(res);
    expect(body.cached).toBe(true);
  });

  it('filters results to only requested conference teams', async () => {
    const env = makeEnv();
    const res = await handleCBBConferencePowerIndex('SEC', env);
    expect(res.status).toBe(200);

    const body = await parseResponseJson(res);
    expect(body.conference).toBe('SEC');

    const teams = body.teams as Array<Record<string, unknown>>;
    // Only SEC teams — Clemson (ACC) should NOT be present
    expect(teams.length).toBe(2);
    const teamNames = teams.map((t) => t.team);
    expect(teamNames).toContain('Texas');
    expect(teamNames).toContain('Florida');
    expect(teamNames).not.toContain('Clemson');
  });

  it('handles hyphenated slug for Big 12', async () => {
    // Add Big 12 teams — TCU real espnId is 198
    const b12Teams = [makeTeamBattingRow('198', 'TCU', {})];
    const b12Pitching = [{ team_id: '198', total_ip_thirds: 200, total_k: 60, total_bb: 20, total_hr: 4, total_er: 15 }];
    const b12Conf = [
      ...confRows,
      { team_id: '198', conference: 'Big 12' },
    ];
    const b12Games = [
      ...games,
      makeGameRow('198', '126', 3, 5),
    ];

    const kv = createMockKV();
    const db = createMockD1({
      'cb:saber:league': () => ({ league_woba: 0.340 }),
      'SUM(at_bats)': () => ({ results: [...allTeams, ...b12Teams] }),
      'SUM(innings_pitched_thirds)': () => ({ results: [...pitchingRows, ...b12Pitching] }),
      'DISTINCT team_id, conference': () => ({ results: b12Conf }),
      'processed_games': () => ({ results: b12Games }),
    });
    const env = { KV: kv, DB: db } as unknown as Parameters<typeof handleCBBConferencePowerIndex>[1];

    // "big-12" slug should match "Big 12" conference name
    const res = await handleCBBConferencePowerIndex('big-12', env);
    expect(res.status).toBe(200);

    const body = await parseResponseJson(res);
    const teams = body.teams as Array<Record<string, unknown>>;
    expect(teams.length).toBe(1);
    expect(teams[0].team).toBe('TCU');
  });

  it('returns empty teams array for unknown conference', async () => {
    const env = makeEnv();
    const res = await handleCBBConferencePowerIndex('pac-12', env);
    expect(res.status).toBe(200);

    const body = await parseResponseJson(res);
    const teams = body.teams as Array<Record<string, unknown>>;
    expect(teams.length).toBe(0);
  });

  it('includes CPI scores and proper ranking', async () => {
    const env = makeEnv();
    const res = await handleCBBConferencePowerIndex('SEC', env);
    const body = await parseResponseJson(res);
    const teams = body.teams as Array<Record<string, unknown>>;

    expect(teams.length).toBe(2);
    // Rank 1 should have highest CPI
    expect(teams[0].rank).toBe(1);
    expect(teams[1].rank).toBe(2);
    expect((teams[0].cpi as number)).toBeGreaterThanOrEqual((teams[1].cpi as number));

    // CPI should be between 0 and 1
    for (const t of teams) {
      expect((t.cpi as number)).toBeGreaterThanOrEqual(0);
      expect((t.cpi as number)).toBeLessThanOrEqual(1);
    }
  });

  it('includes conf_wins and conf_losses in response', async () => {
    const env = makeEnv();
    const res = await handleCBBConferencePowerIndex('SEC', env);
    const body = await parseResponseJson(res);
    const teams = body.teams as Array<Record<string, unknown>>;

    for (const t of teams) {
      expect(t).toHaveProperty('conf_wins');
      expect(t).toHaveProperty('conf_losses');
      expect(t).toHaveProperty('wins');
      expect(t).toHaveProperty('losses');
    }
  });

  it('CPI normalization is conference-relative not D1-wide', async () => {
    const env = makeEnv();

    // Get SEC CPI
    const secRes = await handleCBBConferencePowerIndex('SEC', env);
    const secBody = await parseResponseJson(secRes);
    const secTeamsList = secBody.teams as Array<Record<string, unknown>>;

    // The top team in the conference should have CPI close to 1.0
    // because normalization is within the conference
    if (secTeamsList.length > 0) {
      expect((secTeamsList[0].cpi as number)).toBeGreaterThanOrEqual(0.8);
    }
  });
});
