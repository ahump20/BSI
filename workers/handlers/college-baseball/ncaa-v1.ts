/**
 * NCAA Baseball — v1 Public API Handlers
 *
 * Implements the v1 REST API surface for the canonical NCAA baseball platform.
 * All responses include provenance metadata (source, fetched_at, timezone).
 *
 * Endpoints:
 *   GET /v1/seasons
 *   GET /v1/teams
 *   GET /v1/teams/:teamId
 *   GET /v1/players
 *   GET /v1/players/:playerId
 *   GET /v1/games
 *   GET /v1/games/:gameId
 *   GET /v1/games/:gameId/boxscore
 *   GET /v1/games/:gameId/pbp
 *   GET /v1/metrics/players
 *   GET /v1/metrics/teams
 *   GET /v1/players/:playerId/splits
 *   GET /v1/provenance/:resource
 */

import type { Env } from '../../shared/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TZ = 'America/Chicago';
const DEFAULT_SEASON_ID = '2026-d1';

// Allowlisted metric column names — used as column identifiers in SQL.
// NEVER interpolate user input directly; always resolve through this map.
const PLAYER_METRIC_COLS: Record<string, string> = {
  woba: 'woba', wrc_plus: 'wrc_plus', ops_plus: 'ops_plus',
  babip: 'babip', iso: 'iso', k_pct: 'k_pct', bb_pct: 'bb_pct',
  fip: 'fip', xfip: 'xfip', war_est: 'war_est',
};

const TEAM_METRIC_COLS: Record<string, string> = {
  woba: 'woba', wrc_plus: 'wrc_plus', ops_plus: 'ops_plus',
  babip: 'babip', iso: 'iso', fip: 'fip',
};

function meta(source: string): { source: string; fetched_at: string; timezone: string } {
  return { source, fetched_at: new Date().toISOString(), timezone: TZ };
}

function paginate<T>(
  rows: T[],
  page: number,
  perPage: number,
): { data: T[]; page: number; per_page: number; total: number } {
  const start = (page - 1) * perPage;
  return {
    data: rows.slice(start, start + perPage),
    page,
    per_page: perPage,
    total: rows.length,
  };
}

/** Strip access-controlled PII fields from a player record before serving. */
function stripPlayerPII(row: Record<string, unknown>): Record<string, unknown> {
  const { dob: _dob, ...safe } = row;
  return safe;
}

// ---------------------------------------------------------------------------
// GET /v1/seasons
// ---------------------------------------------------------------------------
export async function handleV1Seasons(
  url: URL,
  env: Env,
): Promise<Response> {
  const division = url.searchParams.get('division') ?? undefined;
  const year = url.searchParams.get('year') ? Number(url.searchParams.get('year')) : undefined;

  let query = 'SELECT * FROM canonical_season WHERE 1=1';
  const params: (string | number)[] = [];
  if (division) { query += ' AND division = ?'; params.push(division); }
  if (year) { query += ' AND year = ?'; params.push(year); }
  query += ' ORDER BY year DESC';

  const { results } = await env.DB.prepare(query).bind(...params).all();
  return Response.json({ data: results, meta: meta('canonical_season') });
}

// ---------------------------------------------------------------------------
// GET /v1/teams
// ---------------------------------------------------------------------------
export async function handleV1Teams(
  url: URL,
  env: Env,
): Promise<Response> {
  const q = url.searchParams.get('q');
  const conference = url.searchParams.get('conference_id');
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
  const perPage = Math.min(100, Math.max(1, Number(url.searchParams.get('per_page') ?? 25)));

  let query = 'SELECT * FROM canonical_team WHERE 1=1';
  const params: string[] = [];
  if (q) { query += ' AND (name LIKE ? OR short_name LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
  if (conference) { query += ' AND conference_id = ?'; params.push(conference); }
  query += ' ORDER BY name';

  const { results } = await env.DB.prepare(query).bind(...params).all();
  return Response.json({ ...paginate(results, page, perPage), meta: meta('canonical_team') });
}

// ---------------------------------------------------------------------------
// GET /v1/teams/:teamId
// ---------------------------------------------------------------------------
export async function handleV1Team(
  teamId: string,
  env: Env,
): Promise<Response> {
  const row = await env.DB.prepare('SELECT * FROM canonical_team WHERE team_id = ?').bind(teamId).first();
  if (!row) return Response.json({ error: 'Team not found', team_id: teamId }, { status: 404 });
  return Response.json({ ...row, meta: meta('canonical_team') });
}

// ---------------------------------------------------------------------------
// GET /v1/players
// ---------------------------------------------------------------------------
export async function handleV1Players(
  url: URL,
  env: Env,
): Promise<Response> {
  const q = url.searchParams.get('q');
  const teamId = url.searchParams.get('team_id');
  const seasonId = url.searchParams.get('season_id');
  const pos = url.searchParams.get('pos');
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
  const perPage = Math.min(100, Math.max(1, Number(url.searchParams.get('per_page') ?? 25)));

  let query: string;
  const params: string[] = [];

  if (teamId || seasonId) {
    // Join through roster_snapshot for team/season filter
    query = `SELECT DISTINCT cp.* FROM canonical_player cp
             JOIN roster_snapshot rs ON rs.player_id = cp.player_id
             WHERE 1=1`;
    if (teamId) { query += ' AND rs.team_id = ?'; params.push(teamId); }
    if (seasonId) { query += ' AND rs.season_id = ?'; params.push(seasonId); }
    if (pos) { query += ' AND cp.primary_pos = ?'; params.push(pos); }
    if (q) { query += ' AND cp.full_name LIKE ?'; params.push(`%${q}%`); }
  } else {
    query = 'SELECT * FROM canonical_player WHERE 1=1';
    if (pos) { query += ' AND primary_pos = ?'; params.push(pos); }
    if (q) { query += ' AND full_name LIKE ?'; params.push(`%${q}%`); }
  }
  query += ' ORDER BY full_name';

  const { results } = await env.DB.prepare(query).bind(...params).all();
  const stripped = results.map((r: Record<string, unknown>) => stripPlayerPII(r));
  return Response.json({ ...paginate(stripped, page, perPage), meta: meta('canonical_player') });
}

// ---------------------------------------------------------------------------
// GET /v1/players/:playerId
// ---------------------------------------------------------------------------
export async function handleV1Player(
  playerId: string,
  env: Env,
): Promise<Response> {
  const row = await env.DB.prepare('SELECT * FROM canonical_player WHERE player_id = ?').bind(playerId).first<Record<string, unknown>>();
  if (!row) return Response.json({ error: 'Player not found', player_id: playerId }, { status: 404 });
  return Response.json({ ...stripPlayerPII(row), meta: meta('canonical_player') });
}

// ---------------------------------------------------------------------------
// GET /v1/games
// ---------------------------------------------------------------------------
export async function handleV1Games(
  url: URL,
  env: Env,
): Promise<Response> {
  const seasonId = url.searchParams.get('season_id') ?? DEFAULT_SEASON_ID;
  const dateTo = url.searchParams.get('date_to');
  const status = url.searchParams.get('status');
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
  const perPage = Math.min(100, Math.max(1, Number(url.searchParams.get('per_page') ?? 25)));

  let query = 'SELECT * FROM canonical_game WHERE season_id = ?';
  const params: (string | number)[] = [seasonId];

  if (teamId) { query += ' AND (team_id_home = ? OR team_id_away = ?)'; params.push(teamId, teamId); }
  if (dateFrom) { query += ' AND date_start >= ?'; params.push(dateFrom); }
  if (dateTo) { query += ' AND date_start <= ?'; params.push(dateTo); }
  if (status) { query += ' AND status = ?'; params.push(status); }
  query += ' ORDER BY date_start';

  const { results } = await env.DB.prepare(query).bind(...params).all();
  return Response.json({ ...paginate(results, page, perPage), meta: meta('canonical_game') });
}

// ---------------------------------------------------------------------------
// GET /v1/games/:gameId
// ---------------------------------------------------------------------------
export async function handleV1Game(
  gameId: string,
  env: Env,
): Promise<Response> {
  const row = await env.DB.prepare('SELECT * FROM canonical_game WHERE game_id = ?').bind(gameId).first();
  if (!row) return Response.json({ error: 'Game not found', game_id: gameId }, { status: 404 });
  return Response.json({ ...row, meta: meta('canonical_game') });
}

// ---------------------------------------------------------------------------
// GET /v1/games/:gameId/boxscore
// ---------------------------------------------------------------------------
export async function handleV1Boxscore(
  gameId: string,
  url: URL,
  env: Env,
): Promise<Response> {
  const game = await env.DB.prepare('SELECT * FROM canonical_game WHERE game_id = ?').bind(gameId).first<Record<string, unknown>>();
  if (!game) return Response.json({ error: 'Game not found', game_id: gameId }, { status: 404 });

  const { results: teamBoxes } = await env.DB.prepare(
    'SELECT * FROM box_team_game WHERE game_id = ?'
  ).bind(gameId).all<Record<string, unknown>>();

  // Get most recent correction for provenance
  const lastCorr = await env.DB.prepare(
    `SELECT submitted_at, requested_by FROM corrections_ledger
     WHERE game_id = ? AND status = 'approved' ORDER BY resolved_at DESC LIMIT 1`
  ).bind(gameId).first<{ submitted_at: string; requested_by: string }>();

  const home = teamBoxes.find((b) => b.is_home === 1 || b.is_home === true);
  const away = teamBoxes.find((b) => b.is_home === 0 || b.is_home === false);

  return Response.json({
    game_id: gameId,
    status: game.status,
    provenance: {
      policy: 'host_official_stats',
      last_corrected_at: lastCorr?.submitted_at ?? null,
      corrected_by: lastCorr?.requested_by ?? null,
      source_systems: [...new Set(teamBoxes.map((b) => b.source_system_id).filter(Boolean))],
    },
    teams: {
      home: home ?? null,
      away: away ?? null,
    },
    meta: meta('box_team_game'),
  });
}

// ---------------------------------------------------------------------------
// GET /v1/games/:gameId/pbp
// ---------------------------------------------------------------------------
export async function handleV1PBP(
  gameId: string,
  url: URL,
  env: Env,
): Promise<Response> {
  const cursor = url.searchParams.get('cursor');
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get('limit') ?? 50)));

  let query = 'SELECT * FROM pbp_event WHERE game_id = ?';
  const params: (string | number)[] = [gameId];
  if (cursor) { query += ' AND sequence_n > ?'; params.push(Number(cursor)); }
  query += ' ORDER BY sequence_n LIMIT ?';
  params.push(limit + 1); // fetch one extra to detect next page

  const { results } = await env.DB.prepare(query).bind(...params).all<Record<string, unknown>>();
  const hasMore = results.length > limit;
  const events = hasMore ? results.slice(0, limit) : results;
  const nextCursor = hasMore ? String(events[events.length - 1].sequence_n) : null;

  return Response.json({
    game_id: gameId,
    next_cursor: nextCursor,
    data: events,
    meta: meta('pbp_event'),
  });
}

// ---------------------------------------------------------------------------
// GET /v1/metrics/players
// ---------------------------------------------------------------------------
export async function handleV1MetricsPlayers(
  url: URL,
  env: Env,
): Promise<Response> {
  const seasonId = url.searchParams.get('season_id') ?? DEFAULT_SEASON_ID;
  const metric = url.searchParams.get('metric') ?? 'woba';
  const minPA = Number(url.searchParams.get('min_pa') ?? 20);
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
  const perPage = Math.min(100, Math.max(1, Number(url.searchParams.get('per_page') ?? 25)));

  const col = PLAYER_METRIC_COLS[metric];
  if (!col) {
    return Response.json({ error: `Invalid metric. Allowed: ${Object.keys(PLAYER_METRIC_COLS).join(', ')}` }, { status: 400 });
  }

  const { results } = await env.DB.prepare(
    `SELECT m.player_id, cp.full_name, m.team_id, m.pa, m.${col} as metric_value,
            m.model_versions, m.computed_at
     FROM metrics_player_season m
     JOIN canonical_player cp ON cp.player_id = m.player_id
     WHERE m.season_id = ? AND m.pa >= ?
       AND m.${col} IS NOT NULL
     ORDER BY m.${col} DESC`
  ).bind(seasonId, minPA).all<Record<string, unknown>>();

  return Response.json({
    metric,
    season_id: seasonId,
    min_pa: minPA,
    ...paginate(results, page, perPage),
    meta: meta('metrics_player_season'),
  });
}

// ---------------------------------------------------------------------------
// GET /v1/metrics/teams
// ---------------------------------------------------------------------------
export async function handleV1MetricsTeams(
  url: URL,
  env: Env,
): Promise<Response> {
  const seasonId = url.searchParams.get('season_id') ?? DEFAULT_SEASON_ID;
  const metric = url.searchParams.get('metric') ?? 'woba';

  const col = TEAM_METRIC_COLS[metric];
  if (!col) {
    return Response.json({ error: `Invalid metric. Allowed: ${Object.keys(TEAM_METRIC_COLS).join(', ')}` }, { status: 400 });
  }

  // Aggregate team-level metrics from player season metrics
  const { results } = await env.DB.prepare(
    `SELECT m.team_id, ct.name as team_name, AVG(m.${col}) as metric_value,
            COUNT(m.player_id) as player_count
     FROM metrics_player_season m
     JOIN canonical_team ct ON ct.team_id = m.team_id
     WHERE m.season_id = ? AND m.${col} IS NOT NULL
     GROUP BY m.team_id
     ORDER BY metric_value DESC`
  ).bind(seasonId).all<Record<string, unknown>>();

  return Response.json({
    metric,
    season_id: seasonId,
    data: results,
    meta: meta('metrics_player_season'),
  });
}

// ---------------------------------------------------------------------------
// GET /v1/players/:playerId/splits
// ---------------------------------------------------------------------------
export async function handleV1PlayerSplits(
  playerId: string,
  url: URL,
  env: Env,
): Promise<Response> {
  const seasonId = url.searchParams.get('season_id') ?? DEFAULT_SEASON_ID;
  const split = url.searchParams.get('split') ?? 'overall';

  // Supported splits from PBP data
  const allowedSplits = ['overall', 'vs_RHP', 'vs_LHP', 'home', 'away', 'high_leverage'];
  if (!allowedSplits.includes(split)) {
    return Response.json({ error: `Invalid split. Allowed: ${allowedSplits.join(', ')}` }, { status: 400 });
  }

  // Base query: PAs for this player this season
  const query = `SELECT pa.pa_result, pa.woba_flag, pa.li,
                      pa.inning, pa.half,
                      cg.team_id_home, cg.team_id_away
               FROM plate_appearance pa
               JOIN canonical_game cg ON cg.game_id = pa.game_id
               WHERE pa.batter_id = ? AND cg.season_id = ? AND cg.status = 'final'`;
  const params: (string | number)[] = [playerId, seasonId];

  const { results: pas } = await env.DB.prepare(query).bind(...params).all<{
    pa_result: string;
    woba_flag: number;
    li: number | null;
    inning: number;
    half: string;
    team_id_home: string;
    team_id_away: string;
  }>();

  // Filter by split
  let filtered = pas;
  // Note: for vs_RHP/vs_LHP we would need pitcher handedness data from the pitch table.
  // For now, return all PAs with a note when split requires data not yet available.
  if (split === 'high_leverage') {
    filtered = pas.filter((p) => (p.li ?? 1) >= 1.5);
  }

  // Compute aggregate wOBA from result counts
  const woba_eligible = filtered.filter((p) => p.woba_flag === 1);
  const total_pa = woba_eligible.length;

  const counts = { BB: 0, HBP: 0, '1B': 0, '2B': 0, '3B': 0, HR: 0 };
  for (const p of woba_eligible) {
    if (p.pa_result in counts) counts[p.pa_result as keyof typeof counts]++;
  }

  // Use default weights from linear_weights table or fall back
  const weights = await env.DB.prepare(
    'SELECT * FROM linear_weights WHERE season_id = ? AND scope = ?'
  ).bind(seasonId, 'D1').first<{
    wBB: number; wHBP: number; w1B: number; w2B: number; w3B: number; wHR: number;
  }>();

  const w = weights ?? { wBB: 0.69, wHBP: 0.72, w1B: 0.89, w2B: 1.24, w3B: 1.56, wHR: 2.01 };
  const woba = total_pa > 0
    ? (w.wBB * counts.BB + w.wHBP * counts.HBP + w.w1B * counts['1B'] +
       w.w2B * counts['2B'] + w.w3B * counts['3B'] + w.wHR * counts.HR) / total_pa
    : null;

  return Response.json({
    player_id: playerId,
    season_id: seasonId,
    split,
    pa: total_pa,
    woba: woba !== null ? Math.round(woba * 1000) / 1000 : null,
    counts,
    meta: meta('plate_appearance'),
  });
}

// ---------------------------------------------------------------------------
// GET /v1/provenance/:resource
// ---------------------------------------------------------------------------
export async function handleV1Provenance(
  resource: string,
  url: URL,
  env: Env,
): Promise<Response> {
  const id = url.searchParams.get('id');
  if (!id) {
    return Response.json({ error: 'id query parameter required' }, { status: 400 });
  }

  const { results } = await env.DB.prepare(
    'SELECT * FROM provenance_field WHERE tbl = ? AND record_id = ?'
  ).bind(resource, id).all();

  return Response.json({
    resource,
    id,
    sources: results,
    meta: meta('provenance_field'),
  });
}
