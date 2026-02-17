import type { Env } from '../shared/types';
import { json, cachedJson, kvGet, kvPut, cvApiResponse } from '../shared/helpers';

// ---------------------------------------------------------------------------
// HAV-F Endpoints
// ---------------------------------------------------------------------------

/**
 * GET /api/analytics/havf/player/:playerId
 * Returns HAV-F composite + component scores for a single player.
 */
export async function handleHAVFPlayer(playerId: string, env: Env): Promise<Response> {
  const cacheKey = `havf:player:${playerId}`;
  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cvApiResponse(cached, 'havf-cache', true), 200, 1800, { 'X-Cache': 'HIT' });
  }

  try {
    const result = await env.DB.prepare(
      `SELECT * FROM havf_scores WHERE player_id = ? ORDER BY season DESC LIMIT 1`
    ).bind(playerId).first();

    if (!result) {
      return json(cvApiResponse(null, 'havf-d1', false), 404);
    }

    await kvPut(env.KV, cacheKey, result, 1800);
    return cachedJson(cvApiResponse(result, 'havf-d1', false), 200, 1800, { 'X-Cache': 'MISS' });
  } catch (err) {
    return json({ error: 'Failed to fetch HAV-F score' }, 500);
  }
}

/**
 * GET /api/analytics/havf/leaderboard?league=college-baseball&season=2026&limit=50
 * Returns top HAV-F scores filterable by league, season, team.
 */
export async function handleHAVFLeaderboard(url: URL, env: Env): Promise<Response> {
  const league = url.searchParams.get('league') || 'college-baseball';
  const season = parseInt(url.searchParams.get('season') || String(new Date().getFullYear()), 10);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200);
  const team = url.searchParams.get('team');

  const cacheKey = `havf:leaderboard:${league}:${season}:${team || 'all'}:${limit}`;
  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cvApiResponse(cached, 'havf-cache', true), 200, 300, { 'X-Cache': 'HIT' });
  }

  try {
    let query = `SELECT player_id, player_name, team, league, season,
      h_score, a_score, v_score, f_score, havf_composite, havf_rank,
      data_source, updated_at
      FROM havf_scores WHERE league = ? AND season = ?`;
    const binds: (string | number)[] = [league, season];

    if (team) {
      query += ' AND team = ?';
      binds.push(team);
    }

    query += ' ORDER BY havf_composite DESC LIMIT ?';
    binds.push(limit);

    const stmt = env.DB.prepare(query);
    const { results } = await stmt.bind(...binds).all();

    await kvPut(env.KV, cacheKey, results, 300);
    return cachedJson(cvApiResponse(results, 'havf-d1', false), 200, 300, { 'X-Cache': 'MISS' });
  } catch (err) {
    return json({ error: 'Failed to fetch HAV-F leaderboard' }, 500);
  }
}

/**
 * GET /api/analytics/havf/compare/:p1/:p2
 * Side-by-side HAV-F comparison of two players.
 */
export async function handleHAVFCompare(p1: string, p2: string, env: Env): Promise<Response> {
  try {
    const [player1, player2] = await Promise.all([
      env.DB.prepare('SELECT * FROM havf_scores WHERE player_id = ? ORDER BY season DESC LIMIT 1').bind(p1).first(),
      env.DB.prepare('SELECT * FROM havf_scores WHERE player_id = ? ORDER BY season DESC LIMIT 1').bind(p2).first(),
    ]);

    if (!player1 || !player2) {
      const missing = !player1 ? p1 : p2;
      return json(cvApiResponse({ error: `Player ${missing} not found` }, 'havf-d1', false), 404);
    }

    const comparison = {
      player1,
      player2,
      advantage: {
        hitting: player1.h_score > player2.h_score ? 'player1' : player1.h_score < player2.h_score ? 'player2' : 'even',
        atBatQuality: player1.a_score > player2.a_score ? 'player1' : player1.a_score < player2.a_score ? 'player2' : 'even',
        velocity: player1.v_score > player2.v_score ? 'player1' : player1.v_score < player2.v_score ? 'player2' : 'even',
        fielding: player1.f_score > player2.f_score ? 'player1' : player1.f_score < player2.f_score ? 'player2' : 'even',
        overall: player1.havf_composite > player2.havf_composite ? 'player1' : player1.havf_composite < player2.havf_composite ? 'player2' : 'even',
      },
    };

    return cachedJson(cvApiResponse(comparison, 'havf-d1', false), 200, 1800);
  } catch (err) {
    return json({ error: 'Failed to compare HAV-F scores' }, 500);
  }
}

// ---------------------------------------------------------------------------
// MMI Endpoints
// ---------------------------------------------------------------------------

/**
 * GET /api/analytics/mmi/live/:gameId
 * Returns current MMI value + full timeline for a live game.
 */
export async function handleMMILive(gameId: string, env: Env): Promise<Response> {
  const cacheKey = `mmi:live:${gameId}`;
  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cvApiResponse(cached, 'mmi-cache', true), 200, 15, { 'X-Cache': 'HIT' });
  }

  try {
    const { results } = await env.DB.prepare(
      `SELECT mmi_value, sd_component, rs_component, gp_component, bs_component,
              inning, inning_half, home_score, away_score, captured_at
       FROM mmi_snapshots WHERE game_id = ? ORDER BY play_index ASC`
    ).bind(gameId).all();

    if (!results || results.length === 0) {
      return json(cvApiResponse({ timeline: [], current: null }, 'mmi-d1', false), 200);
    }

    const current = results[results.length - 1];
    const data = { timeline: results, current };

    await kvPut(env.KV, cacheKey, data, 15);
    return cachedJson(cvApiResponse(data, 'mmi-d1', false), 200, 15, { 'X-Cache': 'MISS' });
  } catch (err) {
    return json({ error: 'Failed to fetch live MMI' }, 500);
  }
}

/**
 * GET /api/analytics/mmi/game/:gameId
 * Returns full MMI timeline + summary for a completed game.
 */
export async function handleMMIGame(gameId: string, env: Env): Promise<Response> {
  const cacheKey = `mmi:game:${gameId}`;
  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cvApiResponse(cached, 'mmi-cache', true), 200, 3600, { 'X-Cache': 'HIT' });
  }

  try {
    const [snapshots, summary] = await Promise.all([
      env.DB.prepare(
        `SELECT mmi_value, sd_component, rs_component, gp_component, bs_component,
                inning, inning_half, home_score, away_score, captured_at
         FROM mmi_snapshots WHERE game_id = ? ORDER BY play_index ASC`
      ).bind(gameId).all(),
      env.DB.prepare(
        `SELECT * FROM mmi_game_summary WHERE game_id = ?`
      ).bind(gameId).first(),
    ]);

    const data = {
      timeline: snapshots.results || [],
      summary: summary || null,
    };

    await kvPut(env.KV, cacheKey, data, 3600);
    return cachedJson(cvApiResponse(data, 'mmi-d1', false), 200, 3600, { 'X-Cache': 'MISS' });
  } catch (err) {
    return json({ error: 'Failed to fetch game MMI' }, 500);
  }
}

/**
 * GET /api/analytics/mmi/trending?sport=college-baseball&limit=10
 * Games with the highest momentum swings today.
 */
export async function handleMMITrending(url: URL, env: Env): Promise<Response> {
  const sport = url.searchParams.get('sport');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '10', 10), 50);
  const today = new Date().toISOString().split('T')[0];

  const cacheKey = `mmi:trending:${sport || 'all'}:${today}`;
  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cvApiResponse(cached, 'mmi-cache', true), 200, 60, { 'X-Cache': 'HIT' });
  }

  try {
    let query = `SELECT * FROM mmi_game_summary WHERE game_date = ?`;
    const binds: (string | number)[] = [today];

    if (sport) {
      query += ' AND sport = ?';
      binds.push(sport);
    }

    query += ' ORDER BY momentum_swings DESC, biggest_swing DESC LIMIT ?';
    binds.push(limit);

    const { results } = await env.DB.prepare(query).bind(...binds).all();

    await kvPut(env.KV, cacheKey, results, 60);
    return cachedJson(cvApiResponse(results, 'mmi-d1', false), 200, 60, { 'X-Cache': 'MISS' });
  } catch (err) {
    return json({ error: 'Failed to fetch trending MMI games' }, 500);
  }
}
