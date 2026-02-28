import type { Env } from '../shared/types';
import { json, cachedJson, kvGet, kvPut } from '../shared/helpers';
import { HTTP_CACHE, CACHE_TTL } from '../shared/constants';
import { batchComputeHAVF } from '../../lib/analytics/havf';
import type { HAVFInput } from '../../lib/analytics/havf';

// ---------------------------------------------------------------------------
// Shared meta builder
// ---------------------------------------------------------------------------

function analyticsMeta(source: string, cacheHit: boolean) {
  return {
    source,
    fetched_at: new Date().toISOString(),
    timezone: 'America/Chicago' as const,
    cache_hit: cacheHit,
  };
}

// ==========================================================================
// HAV-F Handlers
// ==========================================================================

/**
 * GET /api/analytics/havf/leaderboard
 *
 * Query params:
 *   league    – default 'college-baseball'
 *   team      – filter by team slug
 *   position  – filter by position
 *   conference – filter by conference
 *   limit     – default 25, max 100
 *   season    – default current year
 */
export async function handleHAVFLeaderboard(url: URL, env: Env): Promise<Response> {
  const league = url.searchParams.get('league') || 'college-baseball';
  const team = url.searchParams.get('team') || '';
  const position = url.searchParams.get('position') || '';
  const conference = url.searchParams.get('conference') || '';
  const season = parseInt(url.searchParams.get('season') || String(new Date().getFullYear()), 10);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '25', 10) || 25, 100);

  const cacheKey = `havf:leaderboard:${league}:${season}:${team || 'all'}:${position || 'all'}`;
  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(
      { leaderboard: cached, meta: analyticsMeta('bsi-havf', true) },
      200,
      HTTP_CACHE.standings,
      { 'X-Cache': 'HIT' },
    );
  }

  try {
    let query = 'SELECT * FROM havf_scores WHERE league = ? AND season = ?';
    const binds: (string | number)[] = [league, season];

    if (team) {
      query += ' AND team = ?';
      binds.push(team);
    }
    if (position) {
      query += ' AND position = ?';
      binds.push(position);
    }
    if (conference) {
      query += ' AND conference = ?';
      binds.push(conference);
    }

    query += ' ORDER BY havf_composite DESC LIMIT ?';
    binds.push(limit);

    const stmt = env.DB.prepare(query);
    const { results } = await stmt.bind(...binds).all();

    await kvPut(env.KV, cacheKey, results, 300);
    return cachedJson(
      { leaderboard: results, meta: analyticsMeta('bsi-havf', false) },
      200,
      HTTP_CACHE.standings,
      { 'X-Cache': 'MISS' },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return json({ error: 'Failed to fetch HAV-F leaderboard', detail: msg }, 500);
  }
}

/**
 * GET /api/analytics/havf/player/:id
 *
 * Returns the latest HAV-F result for a single player with full component breakdown.
 */
export async function handleHAVFPlayer(playerId: string, env: Env): Promise<Response> {
  const cacheKey = `havf:player:${playerId}`;
  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(
      { player: cached, meta: analyticsMeta('bsi-havf', true) },
      200,
      HTTP_CACHE.player,
      { 'X-Cache': 'HIT' },
    );
  }

  try {
    const result = await env.DB.prepare(
      'SELECT * FROM havf_scores WHERE player_id = ? ORDER BY season DESC LIMIT 1',
    ).bind(playerId).first();

    if (!result) {
      return json({ error: 'Player not found', player_id: playerId }, 404);
    }

    await kvPut(env.KV, cacheKey, result, CACHE_TTL.players);
    return cachedJson(
      { player: result, meta: analyticsMeta('bsi-havf', false) },
      200,
      HTTP_CACHE.player,
      { 'X-Cache': 'MISS' },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return json({ error: 'Failed to fetch HAV-F player', detail: msg }, 500);
  }
}

/**
 * GET /api/analytics/havf/compare/:p1/:p2
 *
 * Side-by-side HAV-F comparison for two players.
 */
export async function handleHAVFCompare(p1: string, p2: string, env: Env): Promise<Response> {
  try {
    const [r1, r2] = await Promise.all([
      env.DB.prepare(
        'SELECT * FROM havf_scores WHERE player_id = ? ORDER BY season DESC LIMIT 1',
      ).bind(p1).first(),
      env.DB.prepare(
        'SELECT * FROM havf_scores WHERE player_id = ? ORDER BY season DESC LIMIT 1',
      ).bind(p2).first(),
    ]);

    if (!r1 || !r2) {
      const missing = [];
      if (!r1) missing.push(p1);
      if (!r2) missing.push(p2);
      return json({ error: 'Player(s) not found', missing }, 404);
    }

    return cachedJson(
      {
        comparison: { player_1: r1, player_2: r2 },
        meta: analyticsMeta('bsi-havf', false),
      },
      200,
      HTTP_CACHE.player,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return json({ error: 'Failed to compare HAV-F players', detail: msg }, 500);
  }
}

/**
 * POST /api/analytics/havf/compute
 *
 * Accepts a JSON body with `{ players: HAVFInput[], persist?: boolean }`.
 * Computes HAV-F scores for the cohort. If `persist: true`, writes results to D1.
 */
export async function handleHAVFCompute(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as { players?: HAVFInput[]; persist?: boolean };

    if (!body.players || !Array.isArray(body.players) || body.players.length === 0) {
      return json({ error: 'Request body must include a non-empty "players" array' }, 400);
    }

    const results = batchComputeHAVF(body.players);

    if (body.persist) {
      const insertStmt = env.DB.prepare(
        `INSERT OR REPLACE INTO havf_scores
         (player_id, name, team, league, season, position, conference,
          h_score, a_score, v_score, f_score, havf_composite, breakdown, computed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      );

      const batch = results.map(r =>
        insertStmt.bind(
          r.playerID,
          r.name,
          r.team,
          r.league,
          r.season,
          null, // position — not in HAVFResult, populated upstream
          null, // conference — same
          r.h_score,
          r.a_score,
          r.v_score,
          r.f_score,
          r.havf_composite,
          JSON.stringify(r.breakdown),
          r.meta.computed_at,
        ),
      );

      await env.DB.batch(batch);
    }

    return json({
      results,
      persisted: !!body.persist,
      meta: analyticsMeta('bsi-havf', false),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return json({ error: 'Failed to compute HAV-F', detail: msg }, 500);
  }
}

// ==========================================================================
// MMI Handlers
// ==========================================================================

/**
 * GET /api/analytics/mmi/live/:gameId
 *
 * Returns the most recent MMI snapshot for an in-progress game.
 * Short TTL (15s) since this powers live dashboards.
 */
export async function handleMMILive(gameId: string, env: Env): Promise<Response> {
  const cacheKey = `mmi:live:${gameId}`;
  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(
      { snapshot: cached, meta: analyticsMeta('bsi-mmi', true) },
      200,
      15,
      { 'X-Cache': 'HIT' },
    );
  }

  try {
    const result = await env.DB.prepare(
      'SELECT * FROM mmi_snapshots WHERE game_id = ? ORDER BY id DESC LIMIT 1',
    ).bind(gameId).first();

    if (!result) {
      return json({ error: 'No MMI data for game', game_id: gameId }, 404);
    }

    await kvPut(env.KV, cacheKey, result, 15);
    return cachedJson(
      { snapshot: result, meta: analyticsMeta('bsi-mmi', false) },
      200,
      15,
      { 'X-Cache': 'MISS' },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return json({ error: 'Failed to fetch live MMI', detail: msg }, 500);
  }
}

/**
 * GET /api/analytics/mmi/game/:gameId
 *
 * Returns the full MMI timeline (all snapshots) plus game summary.
 * Longer TTL for completed games.
 */
export async function handleMMIGame(gameId: string, env: Env): Promise<Response> {
  const cacheKey = `mmi:game:${gameId}`;
  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(
      cached,
      200,
      HTTP_CACHE.standings,
      { 'X-Cache': 'HIT' },
    );
  }

  try {
    const [snapshots, summary] = await Promise.all([
      env.DB.prepare(
        'SELECT * FROM mmi_snapshots WHERE game_id = ? ORDER BY id ASC',
      ).bind(gameId).all(),
      env.DB.prepare(
        'SELECT * FROM mmi_game_summary WHERE game_id = ? LIMIT 1',
      ).bind(gameId).first(),
    ]);

    if (!summary && snapshots.results.length === 0) {
      return json({ error: 'No MMI data for game', game_id: gameId }, 404);
    }

    const payload = {
      game_id: gameId,
      summary: summary || null,
      timeline: snapshots.results,
      meta: analyticsMeta('bsi-mmi', false),
    };

    await kvPut(env.KV, cacheKey, payload, 300);
    return cachedJson(payload, 200, HTTP_CACHE.standings, { 'X-Cache': 'MISS' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return json({ error: 'Failed to fetch MMI game', detail: msg }, 500);
  }
}

/**
 * GET /api/analytics/mmi/trending
 *
 * Returns the top 10 most volatile/exciting games from today.
 */
export async function handleMMITrending(env: Env): Promise<Response> {
  const cacheKey = 'mmi:trending';
  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(
      { games: cached, meta: analyticsMeta('bsi-mmi', true) },
      200,
      60,
      { 'X-Cache': 'HIT' },
    );
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    const { results: summaries } = await env.DB.prepare(
      `SELECT * FROM mmi_game_summary
       WHERE game_date = ?
       ORDER BY mmi_volatility DESC
       LIMIT 10`,
    ).bind(today).all();

    // Attach snapshots to the top game so the Momentum Flow viz can render it
    const games = [...(summaries || [])];
    if (games.length > 0) {
      const topGameId = (games[0] as Record<string, unknown>).game_id as string;
      if (topGameId) {
        const { results: snaps } = await env.DB.prepare(
          `SELECT inning, inning_half, mmi_value, direction, magnitude,
                  event_description, home_score, away_score
           FROM mmi_snapshots
           WHERE game_id = ?
           ORDER BY id ASC`
        ).bind(topGameId).all();
        (games[0] as Record<string, unknown>).snapshots = snaps || [];
      }
    }

    await kvPut(env.KV, cacheKey, games, 60);
    return cachedJson(
      { games, meta: analyticsMeta('bsi-mmi', false) },
      200,
      60,
      { 'X-Cache': 'MISS' },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return json({ error: 'Failed to fetch trending MMI games', detail: msg }, 500);
  }
}

// ==========================================================================
// Model Example Handlers (Tier 2 — methodology page live examples)
// ==========================================================================

/**
 * GET /api/models/win-probability/example
 *
 * Returns a sample win probability calculation. Pulls from D1 if a recent
 * game exists, otherwise returns a static example with methodology context.
 */
export async function handleWinProbExample(env: Env): Promise<Response> {
  const cacheKey = 'model:wp-example';
  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cached, 200, 600, { 'X-Cache': 'HIT' });
  }

  try {
    // Try to pull a recent game with WP snapshots from D1
    const recent = await env.DB.prepare(
      `SELECT game_id, home_team, away_team, final_home_score, final_away_score, game_date
       FROM mmi_game_summary
       ORDER BY game_date DESC
       LIMIT 1`,
    ).first();

    if (recent) {
      // Pull WP timeline for the game
      const { results: snapshots } = await env.DB.prepare(
        'SELECT * FROM mmi_snapshots WHERE game_id = ? ORDER BY id ASC LIMIT 20',
      ).bind(recent.game_id).all();

      const payload = {
        example: {
          game_id: recent.game_id,
          homeTeam: recent.home_team,
          awayTeam: recent.away_team,
          finalScore: `${recent.final_home_score}-${recent.final_away_score}`,
          date: recent.game_date,
          wpTimeline: snapshots.map((s: Record<string, unknown>) => ({
            inning: s.inning,
            homeWP: s.home_wp,
            event: s.event_description,
          })),
        },
        methodology: {
          model: 'Win Probability v0.1',
          inputs: ['score_differential', 'inning', 'outs', 'base_state', 'home_away'],
          calibrationTarget: 'MLB 2024-2025 regular season',
        },
        meta: analyticsMeta('bsi-models', false),
      };

      await kvPut(env.KV, cacheKey, payload, 600);
      return cachedJson(payload, 200, 600, { 'X-Cache': 'MISS' });
    }

    // Fallback: static example
    const staticPayload = {
      example: {
        game_id: 'example-static',
        homeTeam: 'Texas',
        awayTeam: 'UC Davis',
        finalScore: '13-2',
        date: '2026-02-14',
        wpTimeline: [
          { inning: 'T1', homeWP: 0.54, event: 'Pregame home advantage' },
          { inning: 'T1', homeWP: 0.42, event: 'Bases loaded, 1 out' },
          { inning: 'T1', homeWP: 0.54, event: 'Volantis escapes jam — 2 strikeouts' },
          { inning: 'B2', homeWP: 0.72, event: 'Texas scores 4 in 2nd' },
          { inning: 'B5', homeWP: 0.96, event: 'Lead extends to 10-2' },
          { inning: 'B9', homeWP: 0.99, event: 'Final: 13-2' },
        ],
      },
      methodology: {
        model: 'Win Probability v0.1',
        inputs: ['score_differential', 'inning', 'outs', 'base_state', 'home_away'],
        calibrationTarget: 'MLB 2024-2025 regular season',
      },
      meta: analyticsMeta('bsi-models', false),
    };

    await kvPut(env.KV, cacheKey, staticPayload, 600);
    return cachedJson(staticPayload, 200, 600, { 'X-Cache': 'MISS' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return json({ error: 'Failed to generate WP example', detail: msg }, 500);
  }
}

/**
 * GET /api/models/monte-carlo/example
 *
 * Returns a sample Monte Carlo simulation result for a conference race.
 * Pulls from KV if populated, otherwise returns a static example.
 */
export async function handleMonteCarloExample(env: Env): Promise<Response> {
  const cacheKey = 'model:mc-example';
  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cached, 200, 600, { 'X-Cache': 'HIT' });
  }

  // Static example — Monte Carlo isn't running live yet
  const payload = {
    example: {
      conference: 'SEC',
      simulations: 10000,
      date: new Date().toISOString().split('T')[0],
      projectedStandings: [
        { team: 'Texas', projectedWins: 20.3, projectedLosses: 9.7, tournamentOdds: 0.94, cwsOdds: 0.18, nationalSeedOdds: 0.41 },
        { team: 'LSU', projectedWins: 19.1, projectedLosses: 10.9, tournamentOdds: 0.91, cwsOdds: 0.14, nationalSeedOdds: 0.28 },
        { team: 'Vanderbilt', projectedWins: 18.4, projectedLosses: 11.6, tournamentOdds: 0.88, cwsOdds: 0.11, nationalSeedOdds: 0.19 },
        { team: 'Texas A&M', projectedWins: 17.8, projectedLosses: 12.2, tournamentOdds: 0.82, cwsOdds: 0.08, nationalSeedOdds: 0.12 },
        { team: 'Arkansas', projectedWins: 16.2, projectedLosses: 13.8, tournamentOdds: 0.71, cwsOdds: 0.05, nationalSeedOdds: 0.04 },
      ],
    },
    methodology: {
      model: 'Monte Carlo v0.1',
      simCount: 10000,
      inputs: ['team_strength', 'remaining_schedule', 'home_advantage', 'conference_rules'],
      assumptions: [
        'Fixed team strength (no in-season injuries modeled)',
        'Independent game outcomes',
        'Home advantage: 54% baseline',
      ],
    },
    meta: analyticsMeta('bsi-models', false),
  };

  await kvPut(env.KV, cacheKey, payload, 600);
  return cachedJson(payload, 200, 600, { 'X-Cache': 'MISS' });
}
