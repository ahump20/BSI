import type { Env } from '../shared/types';
import { json } from '../shared/helpers';

/**
 * /api/multiplayer/leaderboard — Read top scores from D1.
 * Query: ?game=blitz&limit=25 (default: all games, top 25)
 */
export async function handleLeaderboard(url: URL, env: Env): Promise<Response> {
  const gameId = url.searchParams.get('game');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '25'), 100);

  try {
    let stmt;
    if (gameId) {
      stmt = env.DB.prepare(
        'SELECT player_name as name, score, avatar, game_id, updated_at FROM leaderboard WHERE game_id = ? ORDER BY score DESC LIMIT ?'
      ).bind(gameId, limit);
    } else {
      stmt = env.DB.prepare(
        'SELECT player_name as name, score, avatar, game_id, updated_at FROM leaderboard ORDER BY score DESC LIMIT ?'
      ).bind(limit);
    }

    const { results } = await stmt.all();
    return json(results ?? []);
  } catch (err) {
    // Table might not exist yet — return empty gracefully
    const msg = err instanceof Error ? err.message : 'D1 error';
    if (msg.includes('no such table')) {
      return json([]);
    }
    return json({ error: msg }, 500);
  }
}

/**
 * POST /api/multiplayer/leaderboard — Submit a score.
 * Body: { name: string, score: number, game: string, avatar?: string }
 */
export async function handleLeaderboardSubmit(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as { name?: string; score?: number; game?: string; avatar?: string };

  if (!body.name || typeof body.score !== 'number' || !body.game) {
    return json({ error: 'name, score (number), and game are required' }, 400);
  }

  try {
    await env.DB.prepare(
      `INSERT INTO leaderboard (player_name, game_id, score, avatar, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'))
       ON CONFLICT(player_name, game_id) DO UPDATE SET
         score = MAX(leaderboard.score, excluded.score),
         avatar = excluded.avatar,
         updated_at = datetime('now')`
    ).bind(body.name, body.game, body.score, body.avatar || '\uD83C\uDFAE').run();

    return json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'D1 error';
    return json({ error: msg }, 500);
  }
}

/**
 * GET /api/arcade/games — Return the full game manifest.
 * Query: ?category=sports (optional filter)
 */
export async function handleArcadeGames(url: URL): Promise<Response> {
  // Import inline to avoid bundling lib/ into worker at top-level
  const { ARCADE_GAMES, ARCADE_CATEGORIES } = await import('../../lib/data/arcade-games');
  const category = url.searchParams.get('category');

  const games = category
    ? ARCADE_GAMES.filter((g) => g.category === category)
    : ARCADE_GAMES;

  return json({
    games,
    categories: ARCADE_CATEGORIES,
    meta: {
      source: 'bsi-arcade',
      fetched_at: new Date().toISOString(),
      timezone: 'America/Chicago',
    },
  });
}

/**
 * GET /api/arcade/stats — Daily aggregate play stats.
 * Query: ?game=blitz&days=7 (defaults: all games, 7 days)
 */
export async function handleArcadeStats(url: URL, env: Env): Promise<Response> {
  const gameId = url.searchParams.get('game');
  const days = Math.min(parseInt(url.searchParams.get('days') || '7'), 90);

  try {
    const dateLimit = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
    let stmt;

    if (gameId) {
      stmt = env.DB.prepare(
        `SELECT game_id, stat_date, total_plays, unique_players, high_score, avg_score
         FROM arcade_daily_stats
         WHERE game_id = ? AND stat_date >= ?
         ORDER BY stat_date DESC`
      ).bind(gameId, dateLimit);
    } else {
      stmt = env.DB.prepare(
        `SELECT game_id, stat_date, total_plays, unique_players, high_score, avg_score
         FROM arcade_daily_stats
         WHERE stat_date >= ?
         ORDER BY stat_date DESC`
      ).bind(dateLimit);
    }

    const { results } = await stmt.all();
    return json({
      stats: results ?? [],
      meta: {
        source: 'bsi-arcade',
        fetched_at: new Date().toISOString(),
        timezone: 'America/Chicago',
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'D1 error';
    if (msg.includes('no such table')) return json({ stats: [] });
    return json({ error: msg }, 500);
  }
}

/**
 * POST /api/arcade/sessions — Record a play session.
 * Body: { player_name: string, game_id: string, score: number, duration_ms?: number }
 */
export async function handleArcadeSession(request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as {
    player_name?: string;
    game_id?: string;
    score?: number;
    duration_ms?: number;
  };

  if (!body.player_name || !body.game_id || typeof body.score !== 'number') {
    return json({ error: 'player_name, game_id, and score (number) are required' }, 400);
  }

  try {
    // Record session
    await env.DB.prepare(
      `INSERT INTO arcade_sessions (player_name, game_id, score, duration_ms, played_at)
       VALUES (?, ?, ?, ?, datetime('now'))`
    ).bind(body.player_name, body.game_id, body.score, body.duration_ms ?? null).run();

    // Update daily stats aggregate
    const today = new Date().toISOString().split('T')[0];
    await env.DB.prepare(
      `INSERT INTO arcade_daily_stats (game_id, stat_date, total_plays, unique_players, high_score, avg_score)
       VALUES (?, ?, 1, 1, ?, ?)
       ON CONFLICT(game_id, stat_date) DO UPDATE SET
         total_plays = arcade_daily_stats.total_plays + 1,
         unique_players = (SELECT COUNT(DISTINCT player_name) FROM arcade_sessions
                           WHERE game_id = ? AND date(played_at) = ?),
         high_score = MAX(arcade_daily_stats.high_score, excluded.high_score),
         avg_score = (SELECT AVG(score) FROM arcade_sessions
                      WHERE game_id = ? AND date(played_at) = ?)`
    ).bind(
      body.game_id, today, body.score, body.score,
      body.game_id, today,
      body.game_id, today
    ).run();

    return json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'D1 error';
    if (msg.includes('no such table')) {
      return json({ success: false, error: 'Arcade tables not yet initialized' }, 503);
    }
    return json({ error: msg }, 500);
  }
}

export async function handleGameAsset(
  assetPath: string,
  env: Env
): Promise<Response> {
  const object = await env.ASSETS_BUCKET.get(assetPath);

  if (!object) {
    return json({ error: 'Asset not found' }, 404);
  }

  const headers: Record<string, string> = {
    'Cache-Control': 'public, max-age=86400, immutable',
    'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
  };

  if (object.httpMetadata?.contentEncoding) {
    headers['Content-Encoding'] = object.httpMetadata.contentEncoding;
  }

  return new Response(object.body, { headers });
}
