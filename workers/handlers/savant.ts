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
 *   ?metric=woba&conference=SEC&position=OF&limit=50&sort=desc
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

/** Strip Pro-tier fields from a row for free-tier responses. */
function stripProFields(row: Record<string, unknown>): Record<string, unknown> {
  const proKeys = [
    'woba', 'wrc_plus', 'ops_plus', 'e_ba', 'e_slg', 'e_woba',
    'fip', 'x_fip', 'era_minus', 'k_bb', 'lob_pct',
  ];
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
 *   tier       — 'pro' for full metrics, omit for free tier
 */
export async function handleSavantBattingLeaderboard(url: URL, env: Env): Promise<Response> {
  const metric = url.searchParams.get('metric') || 'woba';
  const conference = url.searchParams.get('conference') || '';
  const position = url.searchParams.get('position') || '';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '25', 10) || 25, 100);
  const sortDir = url.searchParams.get('sort') === 'asc' ? 'ASC' : 'DESC';
  const tier = url.searchParams.get('tier') || 'free';

  // Validate metric column to prevent SQL injection
  const allowedMetrics = [
    'avg', 'obp', 'slg', 'ops', 'k_pct', 'bb_pct', 'iso', 'babip',
    'woba', 'wrc_plus', 'ops_plus', 'pa', 'hr',
  ];
  const safeMetric = allowedMetrics.includes(metric) ? metric : 'woba';

  const cacheKey = `savant:bat:lb:${safeMetric}:${conference || 'all'}:${position || 'all'}:${limit}:${sortDir}:${tier}`;
  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(
      { data: cached, meta: savantMeta('bsi-savant', true) },
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
      WHERE season = ?
    `;
    const binds: (string | number)[] = [SEASON];

    if (conference) {
      query += ' AND conference = ?';
      binds.push(conference);
    }
    if (position) {
      query += ' AND position = ?';
      binds.push(position);
    }

    query += ` ORDER BY ${safeMetric} ${sortDir} LIMIT ?`;
    binds.push(limit);

    const { results } = await env.DB.prepare(query).bind(...binds).all();

    // Free tier: strip pro metrics, limit to 10 rows
    let output = results as Record<string, unknown>[];
    if (tier !== 'pro') {
      output = output.slice(0, 10).map(stripProFields);
    }

    await kvPut(env.KV, cacheKey, output, 300);
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
 */
export async function handleSavantPitchingLeaderboard(url: URL, env: Env): Promise<Response> {
  const metric = url.searchParams.get('metric') || 'fip';
  const conference = url.searchParams.get('conference') || '';
  const position = url.searchParams.get('position') || '';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '25', 10) || 25, 100);
  const sortDir = url.searchParams.get('sort') === 'desc' ? 'DESC' : 'ASC';
  const tier = url.searchParams.get('tier') || 'free';

  const allowedMetrics = [
    'era', 'whip', 'k_9', 'bb_9', 'hr_9', 'fip', 'x_fip',
    'era_minus', 'k_bb', 'lob_pct', 'ip', 'so',
  ];
  const safeMetric = allowedMetrics.includes(metric) ? metric : 'fip';

  const cacheKey = `savant:pitch:lb:${safeMetric}:${conference || 'all'}:${position || 'all'}:${limit}:${sortDir}:${tier}`;
  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(
      { data: cached, meta: savantMeta('bsi-savant', true) },
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
      WHERE season = ?
    `;
    const binds: (string | number)[] = [SEASON];

    if (conference) {
      query += ' AND conference = ?';
      binds.push(conference);
    }
    if (position) {
      query += ' AND position = ?';
      binds.push(position);
    }

    query += ` ORDER BY ${safeMetric} ${sortDir} LIMIT ?`;
    binds.push(limit);

    const { results } = await env.DB.prepare(query).bind(...binds).all();

    let output = results as Record<string, unknown>[];
    if (tier !== 'pro') {
      output = output.slice(0, 10).map(stripProFields);
    }

    await kvPut(env.KV, cacheKey, output, 300);
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
export async function handleSavantPlayer(playerId: string, url: URL, env: Env): Promise<Response> {
  const tier = url.searchParams.get('tier') || 'free';

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

    let player: Record<string, unknown> = {
      player_id: playerId,
      batting: batting || null,
      pitching: pitching || null,
      type: batting && pitching ? 'two-way' : batting ? 'hitter' : 'pitcher',
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
export async function handleSavantParkFactors(url: URL, env: Env): Promise<Response> {
  const conference = url.searchParams.get('conference') || '';
  const tier = url.searchParams.get('tier') || 'free';

  const cacheKey = `savant:parks:${conference || 'all'}:${tier}`;
  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(
      { data: cached, meta: savantMeta('bsi-savant', true) },
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

    // Free tier: top 5 only
    const output = tier !== 'pro' ? results.slice(0, 5) : results;

    await kvPut(env.KV, cacheKey, output, 600);
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
// Conference Strength
// ---------------------------------------------------------------------------

/**
 * GET /api/savant/conference-strength
 */
export async function handleSavantConferenceStrength(url: URL, env: Env): Promise<Response> {
  const tier = url.searchParams.get('tier') || 'free';

  const cacheKey = `savant:conf:${tier}`;
  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(
      { data: cached, meta: savantMeta('bsi-savant', true) },
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

    // Free tier: top 5 only
    const output = tier !== 'pro' ? results.slice(0, 5) : results;

    await kvPut(env.KV, cacheKey, output, 600);
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
