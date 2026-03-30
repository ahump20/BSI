/**
 * Savant API Handlers — College Baseball Advanced Analytics
 *
 * Routes:
 *   GET /api/savant/batting/leaderboard   — Batting advanced leaderboard
 *   GET /api/savant/pitching/leaderboard  — Pitching advanced leaderboard
 *   GET /api/savant/player/:id            — Full advanced profile
 *   GET /api/savant/park-factors          — All park factors
 *   GET /api/savant/conference-strength   — Conference rankings
 *
 * Query params for leaderboards:
 *   ?metric=woba&conference=SEC&position=OF&limit=50&sort=desc&min_pa=25
 *   Pitching uses min_ip instead of min_pa.
 *
 * Tier gating: Free tier sees basic metrics (K%, BB%, ISO, BABIP, K/9, BB/9).
 * Pro tier sees full metrics (wOBA, wRC+, OPS+, FIP, ERA-, eBA, eSLG, ewOBA).
 */

import type { Env } from '../shared/types';
import { json, cachedJson, kvGet, kvPut } from '../shared/helpers';
import { HTTP_CACHE, CACHE_TTL } from '../shared/constants';

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

const SEASON = 2026;

function savantMeta(source: string, cacheHit: boolean) {
  return {
    source,
    fetched_at: new Date().toISOString(),
    timezone: 'America/Chicago' as const,
    cache_hit: cacheHit,
  };
}

/** Resolve tier from API key in BSI_KEYS KV. Falls back to 'free'. */
async function resolveTier(url: URL, headers: Headers, env: Env): Promise<string> {
  const keyValue = headers.get('X-BSI-Key') ?? url.searchParams.get('key') ?? '';
  if (!keyValue || !env.BSI_KEYS) return 'free';
  try {
    const raw = await env.BSI_KEYS.get(`key:${keyValue}`);
    if (!raw) return 'free';
    const data = JSON.parse(raw) as { tier?: string; expires?: number };
    if (data.expires && data.expires < Date.now()) return 'free';
    return data.tier || 'free';
  } catch {
    return 'free';
  }
}

/** Strip Pro-tier fields from a row for free-tier responses.
 *  Core Savant metrics (wOBA, wRC+, OPS+, FIP, ERA-) stay visible — free product promise.
 *  Only expected-stats and secondary pitching extras are Pro-gated. */
function stripProFields(row: Record<string, unknown>): Record<string, unknown> {
  const proKeys = ['k_bb', 'lob_pct'];
  const filtered = { ...row };
  for (const key of proKeys) {
    if (key in filtered) {
      filtered[key] = null;
    }
  }
  filtered._tier_gated = true;
  return filtered;
}

// ---------------------------------------------------------------------------
// Percentile Computation
// ---------------------------------------------------------------------------

/**
 * Compute percentile ranks for each numeric column in the dataset.
 * Returns rows with an added `percentiles` object mapping column → 0-100 rank.
 */
function computePercentileRanks(
  rows: Record<string, unknown>[],
  numericKeys: string[],
): Record<string, unknown>[] {
  if (rows.length === 0) return rows;

  // For each key, build sorted indices
  const percentilesByKey = new Map<string, number[]>();

  for (const key of numericKeys) {
    const indexed: { idx: number; val: number }[] = [];
    for (let i = 0; i < rows.length; i++) {
      const v = rows[i][key];
      if (v != null && typeof v === 'number' && Number.isFinite(v)) {
        indexed.push({ idx: i, val: v });
      }
    }
    indexed.sort((a, b) => a.val - b.val);

    const pctls = new Array<number>(rows.length).fill(50);
    const n = indexed.length;
    for (let rank = 0; rank < n; rank++) {
      pctls[indexed[rank].idx] = n > 1 ? Math.round((rank / (n - 1)) * 100) : 50;
    }
    percentilesByKey.set(key, pctls);
  }

  // Attach percentiles to each row
  return rows.map((row, i) => {
    const pctl: Record<string, number> = {};
    for (const key of numericKeys) {
      const arr = percentilesByKey.get(key);
      if (arr) pctl[key] = arr[i];
    }
    return { ...row, percentiles: pctl };
  });
}

const BATTING_PERCENTILE_KEYS = [
  'avg', 'obp', 'slg', 'ops', 'k_pct', 'bb_pct', 'iso', 'babip',
  'woba', 'wrc_plus', 'ops_plus',
];

const PITCHING_PERCENTILE_KEYS = [
  'era', 'whip', 'k_9', 'bb_9', 'hr_9', 'fip', 'x_fip',
  'era_minus', 'k_bb', 'lob_pct', 'babip',
];

// ---------------------------------------------------------------------------
// Batting Leaderboard
// ---------------------------------------------------------------------------

/**
 * GET /api/savant/batting/leaderboard
 *
 * Query params:
 *   metric     — sort column (default: woba)
 *   conference — filter by conference
 *   position   — filter by position
 *   limit      — default 25, max 100
 *   sort       — asc or desc (default: desc)
 *   min_pa     — minimum plate appearances (default: 25)
 *   tier       — 'pro' for full metrics, omit for free tier
 */
export async function handleSavantBattingLeaderboard(url: URL, env: Env, headers?: Headers): Promise<Response> {
  const metric = url.searchParams.get('metric') || 'woba';
  const conference = url.searchParams.get('conference') || '';
  const position = url.searchParams.get('position') || '';
  const team = url.searchParams.get('team') || '';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '25', 10) || 25, 100);
  const sortDir = url.searchParams.get('sort') === 'asc' ? 'ASC' : 'DESC';
  const minPA = Math.max(0, parseInt(url.searchParams.get('min_pa') || '25', 10) || 25);
  const tier = await resolveTier(url, headers ?? new Headers(), env);

  // Validate metric column to prevent SQL injection
  const allowedMetrics = [
    'avg', 'obp', 'slg', 'ops', 'k_pct', 'bb_pct', 'iso', 'babip',
    'woba', 'wrc_plus', 'ops_plus', 'pa', 'hr',
  ];
  const safeMetric = allowedMetrics.includes(metric) ? metric : 'woba';

  const cacheKey = `savant:bat:lb:${safeMetric}:${conference || 'all'}:${team || 'all'}:${position || 'all'}:${limit}:${sortDir}:${minPA}:${tier}`;
  const cached = await kvGet<{ data: unknown; total: number }>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(
      { data: cached.data, total: cached.total, tier, meta: savantMeta('bsi-savant', true) },
      200,
      HTTP_CACHE.standings,
      { 'X-Cache': 'HIT' },
    );
  }

  try {
    let query = `
      SELECT player_id, player_name, team, conference, position, class_year,
             g, ab, pa, h, hr, bb, so,
             avg, obp, slg, ops, k_pct, bb_pct, iso, babip,
             woba, wrc_plus, ops_plus, e_ba, e_slg, e_woba
      FROM cbb_batting_advanced
      WHERE season = ? AND pa >= ?
    `;
    const binds: (string | number)[] = [SEASON, minPA];

    if (conference) {
      query += ' AND conference = ?';
      binds.push(conference);
    }
    if (team) {
      query += ' AND team = ?';
      binds.push(team);
    }
    if (position) {
      query += ' AND position = ?';
      binds.push(position);
    }

    query += ` ORDER BY ${safeMetric} ${sortDir} LIMIT ?`;
    binds.push(limit);

    const { results } = await env.DB.prepare(query).bind(...binds).all();

    // Free tier: strip pro metrics (row count follows requested limit for both tiers)
    let output = results as Record<string, unknown>[];
    // Compute percentile ranks for all numeric columns
    output = computePercentileRanks(output, BATTING_PERCENTILE_KEYS);
    if (tier !== 'pro') {
      output = output.map(stripProFields);
    }

    await kvPut(env.KV, cacheKey, { data: output, total: results.length }, 300);
    return cachedJson(
      {
        data: output,
        total: results.length,
        tier,
        meta: savantMeta('bsi-savant', false),
      },
      200,
      HTTP_CACHE.standings,
      { 'X-Cache': 'MISS' },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return json({ error: 'Failed to fetch batting leaderboard', detail: msg }, 500);
  }
}

// ---------------------------------------------------------------------------
// Pitching Leaderboard
// ---------------------------------------------------------------------------

/**
 * GET /api/savant/pitching/leaderboard
 *
 * Query params: same as batting, plus min_ip (default: 10) instead of min_pa.
 */
export async function handleSavantPitchingLeaderboard(url: URL, env: Env, headers?: Headers): Promise<Response> {
  const metric = url.searchParams.get('metric') || 'fip';
  const conference = url.searchParams.get('conference') || '';
  const position = url.searchParams.get('position') || '';
  const team = url.searchParams.get('team') || '';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '25', 10) || 25, 100);
  const sortDir = url.searchParams.get('sort') === 'desc' ? 'DESC' : 'ASC';
  const minIP = Math.max(0, parseFloat(url.searchParams.get('min_ip') || '10') || 10);
  const tier = await resolveTier(url, headers ?? new Headers(), env);

  const allowedMetrics = [
    'era', 'whip', 'k_9', 'bb_9', 'hr_9', 'fip', 'x_fip',
    'era_minus', 'k_bb', 'lob_pct', 'ip', 'so',
  ];
  const safeMetric = allowedMetrics.includes(metric) ? metric : 'fip';

  const cacheKey = `savant:pitch:lb:${safeMetric}:${conference || 'all'}:${team || 'all'}:${position || 'all'}:${limit}:${sortDir}:${minIP}:${tier}`;
  const cached = await kvGet<{ data: unknown; total: number }>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(
      { data: cached.data, total: cached.total, tier, meta: savantMeta('bsi-savant', true) },
      200,
      HTTP_CACHE.standings,
      { 'X-Cache': 'HIT' },
    );
  }

  try {
    let query = `
      SELECT player_id, player_name, team, conference, position, class_year,
             g, gs, w, l, sv, ip, h, er, bb, hbp, so, era, whip,
             k_9, bb_9, hr_9, fip, x_fip, era_minus, k_bb, lob_pct, babip
      FROM cbb_pitching_advanced
      WHERE season = ? AND ip >= ?
    `;
    const binds: (string | number)[] = [SEASON, minIP];

    if (conference) {
      query += ' AND conference = ?';
      binds.push(conference);
    }
    if (team) {
      query += ' AND team = ?';
      binds.push(team);
    }
    if (position) {
      query += ' AND position = ?';
      binds.push(position);
    }

    query += ` ORDER BY ${safeMetric} ${sortDir} LIMIT ?`;
    binds.push(limit);

    const { results } = await env.DB.prepare(query).bind(...binds).all();

    let output = results as Record<string, unknown>[];
    // Compute percentile ranks for all numeric columns
    output = computePercentileRanks(output, PITCHING_PERCENTILE_KEYS);
    if (tier !== 'pro') {
      output = output.map(stripProFields);
    }

    await kvPut(env.KV, cacheKey, { data: output, total: results.length }, 300);
    return cachedJson(
      {
        data: output,
        total: results.length,
        tier,
        meta: savantMeta('bsi-savant', false),
      },
      200,
      HTTP_CACHE.standings,
      { 'X-Cache': 'MISS' },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return json({ error: 'Failed to fetch pitching leaderboard', detail: msg }, 500);
  }
}

// ---------------------------------------------------------------------------
// Player Profile
// ---------------------------------------------------------------------------

/**
 * GET /api/savant/player/:id
 */
export async function handleSavantPlayer(playerId: string, url: URL, env: Env, headers?: Headers): Promise<Response> {
  const tier = await resolveTier(url, headers ?? new Headers(), env);

  const cacheKey = `savant:player:${playerId}:${tier}`;
  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(
      { player: cached, meta: savantMeta('bsi-savant', true) },
      200,
      HTTP_CACHE.player,
      { 'X-Cache': 'HIT' },
    );
  }

  try {
    // Try batting first
    const batting = await env.DB.prepare(`
      SELECT * FROM cbb_batting_advanced WHERE player_id = ? AND season = ?
    `).bind(playerId, SEASON).first();

    // Try pitching
    const pitching = await env.DB.prepare(`
      SELECT * FROM cbb_pitching_advanced WHERE player_id = ? AND season = ?
    `).bind(playerId, SEASON).first();

    if (!batting && !pitching) {
      return json({ error: 'Player not found in Savant data', player_id: playerId }, 404);
    }

    // Headshot: ESPN does not host college baseball player headshots (404 for all).
    // Highlightly API also has no player photos. If a headshot URL is stored in
    // player_season_stats from a future ingest source, use it.
    const playerNameForLookup = (batting as Record<string, unknown> | null)?.player_name ?? (pitching as Record<string, unknown> | null)?.player_name ?? '';
    const teamForLookup = (batting as Record<string, unknown> | null)?.team ?? (pitching as Record<string, unknown> | null)?.team ?? '';
    let headshotUrl: string | null = null;
    if (playerNameForLookup && teamForLookup) {
      const hsRow = await env.DB.prepare(
        `SELECT headshot FROM player_season_stats WHERE name = ? AND team = ? AND sport = 'college-baseball' AND season = ? AND headshot != '' LIMIT 1`
      ).bind(playerNameForLookup, teamForLookup, SEASON).first<{ headshot: string }>();
      if (hsRow?.headshot) {
        headshotUrl = hsRow.headshot;
      }
    }

    let player: Record<string, unknown> = {
      player_id: playerId,
      batting: batting || null,
      pitching: pitching || null,
      type: batting && pitching ? 'two-way' : batting ? 'hitter' : 'pitcher',
      headshot: headshotUrl,
    };

    // Compute per-stat percentiles against full population
    const battingPctls: Record<string, number> = {};
    const pitchingPctls: Record<string, number> = {};

    if (batting) {
      for (const key of BATTING_PERCENTILE_KEYS) {
        const val = (batting as Record<string, unknown>)[key];
        if (val != null && typeof val === 'number' && Number.isFinite(val)) {
          const { results: popResults } = await env.DB.prepare(
            `SELECT ${key} FROM cbb_batting_advanced WHERE season = ? AND pa >= 25 AND ${key} IS NOT NULL`
          ).bind(SEASON).all();
          const sorted = popResults.map(r => r[key] as number).filter(v => Number.isFinite(v)).sort((a, b) => a - b);
          const below = sorted.filter(v => v < val).length;
          battingPctls[key] = sorted.length > 1 ? Math.round((below / (sorted.length - 1)) * 100) : 50;
        }
      }
    }

    if (pitching) {
      for (const key of PITCHING_PERCENTILE_KEYS) {
        const val = (pitching as Record<string, unknown>)[key];
        if (val != null && typeof val === 'number' && Number.isFinite(val)) {
          const { results: popResults } = await env.DB.prepare(
            `SELECT ${key} FROM cbb_pitching_advanced WHERE season = ? AND ip >= 10 AND ${key} IS NOT NULL`
          ).bind(SEASON).all();
          const sorted = popResults.map(r => r[key] as number).filter(v => Number.isFinite(v)).sort((a, b) => a - b);
          const below = sorted.filter(v => v < val).length;
          pitchingPctls[key] = sorted.length > 1 ? Math.round((below / (sorted.length - 1)) * 100) : 50;
        }
      }
    }

    player.percentiles = {
      batting: Object.keys(battingPctls).length > 0 ? battingPctls : null,
      pitching: Object.keys(pitchingPctls).length > 0 ? pitchingPctls : null,
    };

    if (tier !== 'pro') {
      if (batting) player.batting = stripProFields(batting as Record<string, unknown>);
      if (pitching) player.pitching = stripProFields(pitching as Record<string, unknown>);
    }

    await kvPut(env.KV, cacheKey, player, CACHE_TTL.players);
    return cachedJson(
      { player, meta: savantMeta('bsi-savant', false) },
      200,
      HTTP_CACHE.player,
      { 'X-Cache': 'MISS' },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return json({ error: 'Failed to fetch Savant player', detail: msg }, 500);
  }
}

// ---------------------------------------------------------------------------
// Park Factors
// ---------------------------------------------------------------------------

/**
 * GET /api/savant/park-factors
 */
export async function handleSavantParkFactors(url: URL, env: Env, headers?: Headers): Promise<Response> {
  const conference = url.searchParams.get('conference') || '';
  const tier = await resolveTier(url, headers ?? new Headers(), env);

  const cacheKey = `savant:parks:${conference || 'all'}`;
  const cached = await kvGet<{ data: unknown; total: number }>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(
      { data: cached.data, total: cached.total, tier, meta: savantMeta('bsi-savant', true) },
      200,
      HTTP_CACHE.standings,
      { 'X-Cache': 'HIT' },
    );
  }

  try {
    let query = `
      SELECT team, team_id, venue_name, conference, season,
             runs_factor, hits_factor, hr_factor, bb_factor, so_factor,
             sample_games, methodology_note
      FROM cbb_park_factors
      WHERE season = ?
    `;
    const binds: (string | number)[] = [SEASON];

    if (conference) {
      query += ' AND conference = ?';
      binds.push(conference);
    }

    query += ' ORDER BY runs_factor DESC';

    const { results } = await env.DB.prepare(query).bind(...binds).all();

    // Park factors are core product — show all on every tier
    const output = results;

    await kvPut(env.KV, cacheKey, { data: output, total: results.length }, 600);
    return cachedJson(
      {
        data: output,
        total: results.length,
        tier,
        meta: savantMeta('bsi-savant', false),
      },
      200,
      HTTP_CACHE.standings,
      { 'X-Cache': 'MISS' },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return json({ error: 'Failed to fetch park factors', detail: msg }, 500);
  }
}

// ---------------------------------------------------------------------------
// CSV Export (Pro tier only)
// ---------------------------------------------------------------------------

/**
 * GET /api/savant/batting/export?format=csv
 * GET /api/savant/pitching/export?format=csv
 *
 * Pro-tier only. Returns full leaderboard as CSV download.
 */
export async function handleSavantExport(
  type: 'batting' | 'pitching',
  url: URL,
  env: Env,
  headers?: Headers
): Promise<Response> {
  const tier = await resolveTier(url, headers ?? new Headers(), env);
  if (tier !== 'pro') {
    return json(
      {
        error: 'CSV export requires a Pro subscription.',
        upgrade_url: '/pricing',
        meta: savantMeta('bsi-savant', false),
      },
      403
    );
  }

  const conference = url.searchParams.get('conference') || '';
  const minThreshold = type === 'batting'
    ? Math.max(0, parseInt(url.searchParams.get('min_pa') || '25', 10) || 25)
    : Math.max(0, parseFloat(url.searchParams.get('min_ip') || '10') || 10);

  try {
    const table = type === 'batting' ? 'cbb_batting_advanced' : 'cbb_pitching_advanced';
    const thresholdCol = type === 'batting' ? 'pa' : 'ip';
    let query = `SELECT * FROM ${table} WHERE season = ? AND ${thresholdCol} >= ?`;
    const binds: (string | number)[] = [SEASON, minThreshold];

    if (conference) {
      query += ' AND conference = ?';
      binds.push(conference);
    }

    const sortCol = type === 'batting' ? 'woba' : 'fip';
    const sortDir = type === 'batting' ? 'DESC' : 'ASC';
    query += ` ORDER BY ${sortCol} ${sortDir}`;

    const { results } = await env.DB.prepare(query).bind(...binds).all();

    if (!results.length) {
      return json({ error: 'No data matching filters', meta: savantMeta('bsi-savant', false) }, 404);
    }

    // Build CSV
    const columns = Object.keys(results[0]);
    const csvRows = [columns.join(',')];
    for (const row of results) {
      const values = columns.map(col => {
        const val = (row as Record<string, unknown>)[col];
        if (val === null || val === undefined) return '';
        const str = String(val);
        return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
      });
      csvRows.push(values.join(','));
    }

    const csv = csvRows.join('\n');
    const filename = `bsi-savant-${type}-${SEASON}${conference ? `-${conference}` : ''}.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-BSI-Source': 'bsi-savant',
        'X-BSI-Timestamp': new Date().toISOString(),
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return json({ error: 'Failed to export CSV', detail: msg }, 500);
  }
}

// ---------------------------------------------------------------------------
// Conference Strength
// ---------------------------------------------------------------------------

/**
 * GET /api/savant/conference-strength
 */
export async function handleSavantConferenceStrength(url: URL, env: Env, headers?: Headers): Promise<Response> {
  const tier = await resolveTier(url, headers ?? new Headers(), env);

  const cacheKey = 'savant:conf:all';
  const cached = await kvGet<{ data: unknown; total: number }>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(
      { data: cached.data, total: cached.total, tier, meta: savantMeta('bsi-savant', true) },
      200,
      HTTP_CACHE.standings,
      { 'X-Cache': 'HIT' },
    );
  }

  try {
    const { results } = await env.DB.prepare(`
      SELECT conference, season, strength_index, run_environment,
             avg_era, avg_ops, avg_woba, inter_conf_win_pct, rpi_avg, is_power
      FROM cbb_conference_strength
      WHERE season = ?
      ORDER BY strength_index DESC
    `).bind(SEASON).all();

    // Conference strength is core product — show all conferences on every tier
    const output = results;

    await kvPut(env.KV, cacheKey, { data: output, total: results.length }, 600);
    return cachedJson(
      {
        data: output,
        total: results.length,
        tier,
        meta: savantMeta('bsi-savant', false),
      },
      200,
      HTTP_CACHE.standings,
      { 'X-Cache': 'MISS' },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return json({ error: 'Failed to fetch conference strength', detail: msg }, 500);
  }
}

// ---------------------------------------------------------------------------
// Player Directory
// ---------------------------------------------------------------------------

/** Metrics where lower = better, so default sort should be ASC. */
const LOWER_IS_BETTER = new Set(['era', 'fip', 'x_fip', 'era_minus', 'whip', 'bb_9', 'hr_9', 'k_pct']);

const BATTING_ALLOWED_SORTS = [
  'avg', 'obp', 'slg', 'ops', 'k_pct', 'bb_pct', 'iso', 'babip',
  'woba', 'wrc_plus', 'ops_plus', 'pa', 'hr', 'h', 'ab', 'g',
  'player_name', 'team',
];

const PITCHING_ALLOWED_SORTS = [
  'era', 'whip', 'k_9', 'bb_9', 'hr_9', 'fip', 'x_fip',
  'era_minus', 'k_bb', 'lob_pct', 'babip', 'ip', 'so', 'g', 'gs',
  'player_name', 'team',
];

/**
 * GET /api/savant/directory
 *
 * Browsable directory of all D1 players with advanced metrics.
 * Unlike the leaderboard (top-N by one metric, min PA/IP), this endpoint
 * supports full search, multi-filter, and pagination for discovery.
 *
 * Query params:
 *   type       — batting (default) or pitching
 *   search     — LIKE match on player_name or team
 *   conference — exact match
 *   position   — P, C, IF, OF, or specific code
 *   class      — Fr, So, Jr, Sr
 *   sort       — metric column (default: woba for batting, fip for pitching)
 *   dir        — asc or desc (auto-detected if omitted based on metric)
 *   min_pa     — minimum plate appearances (default: 1)
 *   min_ip     — minimum innings pitched (default: 1)
 *   page       — page number (default: 1)
 *   limit      — results per page (default: 50, max: 100)
 */
export async function handleSavantPlayerDirectory(url: URL, env: Env, headers?: Headers): Promise<Response> {
  const type = url.searchParams.get('type') === 'pitching' ? 'pitching' : 'batting';
  const search = url.searchParams.get('search') || '';
  const conference = url.searchParams.get('conference') || '';
  const position = url.searchParams.get('position') || '';
  const classYear = url.searchParams.get('class') || '';
  const sortParam = url.searchParams.get('sort') || '';
  const dirParam = url.searchParams.get('dir') || '';
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10) || 50));
  const offset = (page - 1) * limit;
  const tier = await resolveTier(url, headers ?? new Headers(), env);

  const isBatting = type === 'batting';
  const table = isBatting ? 'cbb_batting_advanced' : 'cbb_pitching_advanced';
  const allowedSorts = isBatting ? BATTING_ALLOWED_SORTS : PITCHING_ALLOWED_SORTS;
  const defaultSort = isBatting ? 'woba' : 'fip';
  const safeSort = allowedSorts.includes(sortParam) ? sortParam : defaultSort;

  // Auto-detect direction: lower-is-better metrics sort ASC by default
  let sortDir: string;
  if (dirParam === 'asc' || dirParam === 'desc') {
    sortDir = dirParam.toUpperCase();
  } else {
    sortDir = LOWER_IS_BETTER.has(safeSort) ? 'ASC' : 'DESC';
  }

  // Min thresholds — default 25 PA / 10 IP to filter small-sample noise
  const minThreshold = isBatting
    ? Math.max(0, parseInt(url.searchParams.get('min_pa') || '25', 10) || 25)
    : Math.max(0, parseInt(url.searchParams.get('min_ip') || '10', 10) || 10);
  const thresholdCol = isBatting ? 'pa' : 'ip';

  // Build cache key
  const cacheKey = `savant:dir:${type}:${search}:${conference}:${position}:${classYear}:${safeSort}:${sortDir}:${minThreshold}:${page}:${limit}:${tier}`;
  const cached = await kvGet<{ players: unknown[]; total: number; conferences: string[] }>(env.KV, cacheKey);
  if (cached) {
    return cachedJson({
      players: cached.players,
      total: cached.total,
      page,
      totalPages: Math.ceil(cached.total / limit),
      conferences: cached.conferences,
      type,
      tier,
      meta: savantMeta('bsi-savant', true),
    }, 200, HTTP_CACHE.standings, { 'X-Cache': 'HIT' });
  }

  try {
    // --- Build conditions ---
    const conditions = [`season = ?`, `${thresholdCol} >= ?`];
    const binds: (string | number)[] = [SEASON, minThreshold];

    if (search) {
      conditions.push(`(player_name LIKE ? OR team LIKE ?)`);
      const q = `%${search}%`;
      binds.push(q, q);
    }
    if (conference) {
      conditions.push(`conference = ?`);
      binds.push(conference);
    }
    if (position) {
      const upper = position.toUpperCase();
      if (upper === 'IF') {
        conditions.push(`position IN ('1B','2B','3B','SS','IF')`);
      } else if (upper === 'OF') {
        conditions.push(`position IN ('LF','CF','RF','OF')`);
      } else if (upper === 'P' && !isBatting) {
        // Pitching tab — all entries are pitchers, no position filter needed
      } else {
        conditions.push(`position = ?`);
        binds.push(upper);
      }
    }
    if (classYear) {
      conditions.push(`class_year = ?`);
      binds.push(classYear);
    }

    const whereClause = conditions.join(' AND ');

    // --- Count total ---
    const countResult = await env.DB.prepare(
      `SELECT COUNT(*) as total FROM ${table} WHERE ${whereClause}`
    ).bind(...binds).first<{ total: number }>();
    const total = countResult?.total ?? 0;

    // --- Fetch page ---
    const selectCols = isBatting
      ? `player_id, player_name, team, conference, position, class_year,
         g, ab, pa, h, hr, bb, so,
         avg, obp, slg, ops, k_pct, bb_pct, iso, babip,
         woba, wrc_plus, ops_plus, e_ba, e_slg, e_woba`
      : `player_id, player_name, team, conference, position, class_year,
         g, gs, w, l, sv, ip, h, er, bb, hbp, so,
         era, whip, k_9, bb_9, hr_9, fip, x_fip, era_minus, k_bb, lob_pct, babip`;

    const dataBinds = [...binds, limit, offset];
    const query = `
      SELECT ${selectCols}
      FROM ${table}
      WHERE ${whereClause}
      ORDER BY ${safeSort} ${sortDir}
      LIMIT ? OFFSET ?
    `;

    const { results } = await env.DB.prepare(query).bind(...dataBinds).all();

    // Percentile ranks
    const percentileKeys = isBatting ? BATTING_PERCENTILE_KEYS : PITCHING_PERCENTILE_KEYS;
    let output = computePercentileRanks(results as Record<string, unknown>[], percentileKeys);

    // Tier gating
    if (tier !== 'pro') {
      output = output.map(stripProFields);
    }

    // Add playerType flag
    output = output.map((row) => ({ ...row, playerType: type === 'batting' ? 'batter' : 'pitcher' }));

    // --- Conference list (for filter dropdown) ---
    const confResult = await env.DB.prepare(
      `SELECT DISTINCT conference FROM ${table} WHERE season = ? AND conference IS NOT NULL ORDER BY conference`
    ).bind(SEASON).all<{ conference: string }>();
    const conferences = (confResult.results || []).map((r) => r.conference).filter(Boolean);

    // Cache result
    await kvPut(env.KV, cacheKey, { players: output, total, conferences }, 300);

    return cachedJson({
      players: output,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      conferences,
      type,
      tier,
      meta: savantMeta('bsi-savant', false),
    }, 200, HTTP_CACHE.standings, { 'X-Cache': 'MISS' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return json({ error: 'Failed to fetch player directory', detail: msg }, 500);
  }
}
