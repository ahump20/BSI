/**
 * NIL Intelligence API Handlers
 *
 * Routes:
 *   GET /api/nil/leaderboard      — Top NIL-valued players (free: score+range, pro: full)
 *   GET /api/nil/player/:id       — Individual NIL profile + trend data
 *   GET /api/nil/comparables/:id  — 10 nearest players by index score
 *   GET /api/nil/undervalued      — Top-quartile performance, below-median index
 *   GET /api/nil/trends           — Market trends by conference/time period
 *   GET /api/nil/war-to-nil       — Stateless WAR-to-dollar conversion
 *   GET /api/nil/collective-roi   — Conference-level collective spending analysis
 *   GET /api/nil/draft-leverage   — NIL value vs draft projection quadrant data
 *
 * Tier gating: Free tier sees basic score + dollar range.
 * Pro tier sees full breakdown, history, comparables, and analytics.
 */

import type { Env } from '../shared/types';
import { json, cachedJson, kvGet, kvPut } from '../shared/helpers';
import { HTTP_CACHE } from '../shared/constants';

const SEASON = 2026;

function nilMeta(source: string, cacheHit: boolean) {
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
  if (!keyValue) return 'free'; // Legitimately no key provided
  if (!env.BSI_KEYS) {
    console.error('[nil] BSI_KEYS binding missing — all users downgraded to free');
    return 'free';
  }
  try {
    const raw = await env.BSI_KEYS.get(`key:${keyValue}`);
    if (!raw) return 'free';
    const data = JSON.parse(raw) as { tier?: string; expires?: number };
    if (data.expires && data.expires < Date.now()) return 'free';
    return data.tier || 'free';
  } catch (err) {
    console.error('[nil] Tier resolution failed for key:', keyValue.slice(0, 8) + '...', err);
    return 'free';
  }
}

/** Strip pro-only fields for free tier.
 *  Free gets: index_score, performance_score, estimated range, tier.
 *  Pro adds: exposure_score, market_score, social_followers, market_size.
 */
function stripNILProFields(row: Record<string, unknown>): Record<string, unknown> {
  const proKeys = [
    'exposure_score', 'market_score',
    'social_followers', 'market_size',
  ];
  const filtered = { ...row };
  for (const key of proKeys) {
    if (key in filtered) filtered[key] = null;
  }
  filtered._tier_gated = true;
  return filtered;
}

// ---------------------------------------------------------------------------
// Leaderboard
// ---------------------------------------------------------------------------

/**
 * GET /api/nil/leaderboard
 * ?conference=SEC&position=OF&tier_filter=elite&limit=50&sort=desc
 */
export async function handleNILLeaderboard(url: URL, env: Env, headers?: Headers): Promise<Response> {
  const conference = url.searchParams.get('conference') || '';
  const position = url.searchParams.get('position') || '';
  const tierFilter = url.searchParams.get('tier_filter') || '';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '25', 10) || 25, 200);
  const sortDir = url.searchParams.get('sort') === 'asc' ? 'ASC' : 'DESC';
  const tier = await resolveTier(url, headers ?? new Headers(), env);

  const cacheKey = `nil:leaderboard:${conference || 'all'}:${position || 'all'}:${tierFilter || 'all'}:${limit}:${sortDir}:${tier}`;
  const cached = await kvGet<{ data: unknown; total: number }>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(
      { data: cached.data, total: cached.total, tier, meta: nilMeta('bsi-nil', true) },
      200, HTTP_CACHE.standings, { 'X-Cache': 'HIT' },
    );
  }

  try {
    let query = `
      SELECT player_id, player_name, team, conference, position,
             index_score, performance_score, exposure_score, market_score,
             estimated_low, estimated_mid, estimated_high, tier as nil_tier,
             social_followers, market_size
      FROM nil_player_scores
      WHERE season = ?
    `;
    const binds: (string | number)[] = [SEASON];

    if (conference) { query += ' AND conference = ?'; binds.push(conference); }
    if (position) { query += ' AND position = ?'; binds.push(position); }
    if (tierFilter) { query += ' AND tier = ?'; binds.push(tierFilter); }

    query += ` ORDER BY index_score ${sortDir} LIMIT ?`;
    binds.push(limit);

    const { results } = await env.DB.prepare(query).bind(...binds).all();

    let output = results as Record<string, unknown>[];
    if (tier !== 'pro') {
      output = output.map(stripNILProFields);
    }

    await kvPut(env.KV, cacheKey, { data: output, total: results.length }, 21600); // 6h
    return cachedJson(
      { data: output, total: results.length, tier, meta: nilMeta('bsi-nil', false) },
      200, HTTP_CACHE.standings, { 'X-Cache': 'MISS' },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return json({ error: 'Failed to fetch NIL leaderboard', detail: msg }, 500);
  }
}

// ---------------------------------------------------------------------------
// Player Profile
// ---------------------------------------------------------------------------

/**
 * GET /api/nil/player/:id
 */
export async function handleNILPlayer(playerId: string, url: URL, env: Env, headers?: Headers): Promise<Response> {
  const tier = await resolveTier(url, headers ?? new Headers(), env);

  const cacheKey = `nil:player:${playerId}:${tier}`;
  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(
      { player: cached, meta: nilMeta('bsi-nil', true) },
      200, HTTP_CACHE.player, { 'X-Cache': 'HIT' },
    );
  }

  try {
    const score = await env.DB.prepare(
      'SELECT * FROM nil_player_scores WHERE player_id = ? AND season = ?'
    ).bind(playerId, SEASON).first();

    if (!score) {
      return json({ error: 'Player not found in NIL data', player_id: playerId }, 404);
    }

    let player: Record<string, unknown> = { ...score as Record<string, unknown> };

    // Pro tier: include score history
    if (tier === 'pro') {
      const { results: history } = await env.DB.prepare(
        'SELECT index_score, performance_score, estimated_mid, computed_at FROM nil_score_history WHERE player_id = ? AND season = ? ORDER BY computed_at DESC LIMIT 30'
      ).bind(playerId, SEASON).all();
      player.history = history || [];
    } else {
      player = stripNILProFields(player);
    }

    await kvPut(env.KV, cacheKey, player, 3600); // 1h
    return cachedJson(
      { player, meta: nilMeta('bsi-nil', false) },
      200, HTTP_CACHE.player, { 'X-Cache': 'MISS' },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return json({ error: 'Failed to fetch NIL player', detail: msg }, 500);
  }
}

// ---------------------------------------------------------------------------
// Comparables
// ---------------------------------------------------------------------------

/**
 * GET /api/nil/comparables/:id — 10 nearest players by index score
 */
export async function handleNILComparables(playerId: string, url: URL, env: Env, headers?: Headers): Promise<Response> {
  const tier = await resolveTier(url, headers ?? new Headers(), env);
  if (tier !== 'pro') {
    return json({ error: 'Comparables require Pro tier', upgrade_url: '/pricing' }, 403);
  }

  const cacheKey = `nil:comparables:${playerId}`;
  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(
      { comparables: cached, meta: nilMeta('bsi-nil', true) },
      200, HTTP_CACHE.standings, { 'X-Cache': 'HIT' },
    );
  }

  try {
    // Get the target player's score
    const target = await env.DB.prepare(
      'SELECT index_score, position, conference FROM nil_player_scores WHERE player_id = ? AND season = ?'
    ).bind(playerId, SEASON).first() as { index_score: number; position: string; conference: string } | null;

    if (!target) {
      return json({ error: 'Player not found', player_id: playerId }, 404);
    }

    // Find 10 nearest by index_score, excluding self
    const { results } = await env.DB.prepare(
      `SELECT player_id, player_name, team, conference, position,
              index_score, performance_score, exposure_score, market_score,
              estimated_mid, tier
       FROM nil_player_scores
       WHERE season = ? AND player_id != ?
       ORDER BY ABS(index_score - ?) ASC
       LIMIT 10`
    ).bind(SEASON, playerId, target.index_score).all();

    await kvPut(env.KV, cacheKey, results, 21600);
    return cachedJson(
      { target_score: target.index_score, comparables: results, meta: nilMeta('bsi-nil', false) },
      200, HTTP_CACHE.standings, { 'X-Cache': 'MISS' },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return json({ error: 'Failed to fetch comparables', detail: msg }, 500);
  }
}

// ---------------------------------------------------------------------------
// Undervalued Discovery
// ---------------------------------------------------------------------------

/**
 * GET /api/nil/undervalued — Players with top-quartile performance but below-median index
 */
export async function handleNILUndervalued(url: URL, env: Env, headers?: Headers): Promise<Response> {
  const tier = await resolveTier(url, headers ?? new Headers(), env);
  if (tier !== 'pro') {
    return json({ error: 'Undervalued discovery requires Pro tier', upgrade_url: '/pricing' }, 403);
  }

  const cacheKey = 'nil:undervalued';
  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(
      { data: cached, meta: nilMeta('bsi-nil', true) },
      200, HTTP_CACHE.standings, { 'X-Cache': 'HIT' },
    );
  }

  try {
    // Find players where performance_score is in top 25% but index_score is below median
    const { results } = await env.DB.prepare(
      `SELECT player_id, player_name, team, conference, position,
              index_score, performance_score, exposure_score, market_score,
              estimated_mid, tier,
              (performance_score - index_score) as value_gap
       FROM nil_player_scores
       WHERE season = ?
         AND performance_score >= (SELECT performance_score FROM nil_player_scores WHERE season = ? ORDER BY performance_score DESC LIMIT 1 OFFSET (SELECT COUNT(*)/4 FROM nil_player_scores WHERE season = ?))
         AND index_score <= (SELECT index_score FROM nil_player_scores WHERE season = ? ORDER BY index_score DESC LIMIT 1 OFFSET (SELECT COUNT(*)/2 FROM nil_player_scores WHERE season = ?))
       ORDER BY (performance_score - index_score) DESC
       LIMIT 25`
    ).bind(SEASON, SEASON, SEASON, SEASON, SEASON).all();

    await kvPut(env.KV, cacheKey, results, 21600);
    return cachedJson(
      { data: results, total: results.length, meta: nilMeta('bsi-nil', false) },
      200, HTTP_CACHE.standings, { 'X-Cache': 'MISS' },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return json({ error: 'Failed to fetch undervalued players', detail: msg }, 500);
  }
}

// ---------------------------------------------------------------------------
// Market Trends
// ---------------------------------------------------------------------------

/**
 * GET /api/nil/trends?group_by=conference
 */
export async function handleNILTrends(url: URL, env: Env, headers?: Headers): Promise<Response> {
  const tier = await resolveTier(url, headers ?? new Headers(), env);
  if (tier !== 'pro') {
    return json({ error: 'Trend data requires Pro tier', upgrade_url: '/pricing' }, 403);
  }

  const groupBy = url.searchParams.get('group_by') || 'conference';

  const cacheKey = `nil:trends:${groupBy}`;
  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(
      { data: cached, meta: nilMeta('bsi-nil', true) },
      200, HTTP_CACHE.standings, { 'X-Cache': 'HIT' },
    );
  }

  try {
    const { results } = await env.DB.prepare(
      `SELECT conference,
              COUNT(*) as player_count,
              ROUND(AVG(index_score), 1) as avg_index,
              ROUND(AVG(performance_score), 1) as avg_performance,
              ROUND(AVG(estimated_mid)) as avg_value,
              MAX(estimated_mid) as top_value,
              SUM(CASE WHEN tier = 'elite' THEN 1 ELSE 0 END) as elite_count,
              SUM(CASE WHEN tier = 'high' THEN 1 ELSE 0 END) as high_count
       FROM nil_player_scores
       WHERE season = ? AND conference IS NOT NULL
       GROUP BY conference
       ORDER BY avg_index DESC`
    ).bind(SEASON).all();

    await kvPut(env.KV, cacheKey, results, 86400); // 24h
    return cachedJson(
      { data: results, total: results.length, meta: nilMeta('bsi-nil', false) },
      200, HTTP_CACHE.standings, { 'X-Cache': 'MISS' },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return json({ error: 'Failed to fetch NIL trends', detail: msg }, 500);
  }
}

// ---------------------------------------------------------------------------
// WAR-to-NIL Converter (stateless — no DB, no cache)
// ---------------------------------------------------------------------------

/**
 * GET /api/nil/war-to-nil?war=3.5&sport=baseball&position=SP
 *
 * Converts Wins Above Replacement to estimated NIL dollar range.
 * Pure math — no database dependency.
 */
export async function handleWARToNIL(url: URL): Promise<Response> {
  const war = parseFloat(url.searchParams.get('war') || '0');
  if (isNaN(war) || war < -5 || war > 20) {
    return json({ error: 'Invalid WAR value. Provide a number between -5 and 20.' }, 400);
  }
  const sport = url.searchParams.get('sport') || 'baseball';

  // College baseball WAR-to-NIL baseline:
  // 1 WAR ≈ $15K-$40K depending on market and exposure
  // Football multiplier ~3x, basketball ~2.5x
  const sportMultiplier: Record<string, number> = {
    baseball: 1.0,
    football: 3.0,
    basketball: 2.5,
    softball: 0.8,
  };

  const mult = sportMultiplier[sport] || 1.0;
  const basePerWAR = 25000;
  const mid = Math.round(war * basePerWAR * mult);
  const low = Math.round(mid * 0.65);
  const high = Math.round(mid * 1.45);

  return json({
    war,
    sport,
    estimated_low: low,
    estimated_mid: mid,
    estimated_high: high,
    methodology: 'BSI FMNV model — performance component only. Full valuation requires exposure + market factors.',
    meta: nilMeta('bsi-nil-calculator', false),
  });
}

// ---------------------------------------------------------------------------
// Collective ROI
// ---------------------------------------------------------------------------

/**
 * GET /api/nil/collective-roi — Conference-level collective analysis
 */
export async function handleNILCollectiveROI(url: URL, env: Env, headers?: Headers): Promise<Response> {
  const tier = await resolveTier(url, headers ?? new Headers(), env);
  if (tier !== 'pro') {
    return json({ error: 'Collective ROI requires Pro tier', upgrade_url: '/pricing' }, 403);
  }

  const cacheKey = 'nil:collective-roi';
  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(
      { data: cached, meta: nilMeta('bsi-nil', true) },
      200, HTTP_CACHE.standings, { 'X-Cache': 'HIT' },
    );
  }

  try {
    // Aggregate by team: total roster NIL value, avg performance, count
    const { results } = await env.DB.prepare(
      `SELECT n.team, n.conference,
              COUNT(*) as roster_scored,
              ROUND(SUM(n.estimated_mid)) as total_nil_value,
              ROUND(AVG(n.index_score), 1) as avg_index,
              ROUND(AVG(n.performance_score), 1) as avg_performance,
              MAX(n.estimated_mid) as top_player_value,
              m.market_size, m.program_tier
       FROM nil_player_scores n
       LEFT JOIN nil_school_market m ON n.team = m.team
       WHERE n.season = ?
       GROUP BY n.team
       ORDER BY total_nil_value DESC
       LIMIT 50`
    ).bind(SEASON).all();

    await kvPut(env.KV, cacheKey, results, 86400);
    return cachedJson(
      { data: results, total: results.length, meta: nilMeta('bsi-nil', false) },
      200, HTTP_CACHE.standings, { 'X-Cache': 'MISS' },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return json({ error: 'Failed to fetch collective ROI', detail: msg }, 500);
  }
}

// ---------------------------------------------------------------------------
// Draft Leverage
// ---------------------------------------------------------------------------

/**
 * GET /api/nil/draft-leverage — NIL value vs draft projection quadrant
 */
export async function handleNILDraftLeverage(url: URL, env: Env, headers?: Headers): Promise<Response> {
  const tier = await resolveTier(url, headers ?? new Headers(), env);
  if (tier !== 'pro') {
    return json({ error: 'Draft leverage requires Pro tier', upgrade_url: '/pricing' }, 403);
  }

  const cacheKey = 'nil:draft-leverage';
  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(
      { data: cached, meta: nilMeta('bsi-nil', true) },
      200, HTTP_CACHE.standings, { 'X-Cache': 'HIT' },
    );
  }

  try {
    // Use performance_score as draft proxy (higher performance → more draftable)
    // Quadrants: High NIL + High Draft, High NIL + Low Draft, Low NIL + High Draft, Low NIL + Low Draft
    const { results } = await env.DB.prepare(
      `SELECT player_id, player_name, team, conference, position,
              index_score, performance_score, estimated_mid,
              CASE
                WHEN index_score >= 50 AND performance_score >= 60 THEN 'high-nil-high-draft'
                WHEN index_score >= 50 AND performance_score < 60 THEN 'high-nil-low-draft'
                WHEN index_score < 50 AND performance_score >= 60 THEN 'low-nil-high-draft'
                ELSE 'low-nil-low-draft'
              END as quadrant
       FROM nil_player_scores
       WHERE season = ?
       ORDER BY index_score DESC
       LIMIT 100`
    ).bind(SEASON).all();

    await kvPut(env.KV, cacheKey, results, 86400);
    return cachedJson(
      { data: results, total: results.length, meta: nilMeta('bsi-nil', false) },
      200, HTTP_CACHE.standings, { 'X-Cache': 'MISS' },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return json({ error: 'Failed to fetch draft leverage', detail: msg }, 500);
  }
}
