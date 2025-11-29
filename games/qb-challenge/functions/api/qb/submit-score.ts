/**
 * Blaze QB Challenge - Submit Score API
 *
 * POST /api/qb/submit-score
 */

interface Env {
  DB: D1Database;
  KV: KVNamespace;
  ANALYTICS: AnalyticsEngineDataset;
}

interface ScoreSubmission {
  playerId: string;
  playerName?: string;
  score: number;
  qbId: string;
  stats: {
    completions: number;
    attempts: number;
    completionPercentage: number;
    longestStreak: number;
    touchdowns: number;
    perfectThrows: number;
    durationSeconds: number;
  };
}

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: {
    playerId: string;
    rank: number;
    isNewHighScore: boolean;
    previousHighScore: number;
    gamesPlayed: number;
    totalCompletions: number;
  };
  error?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestPost(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  try {
    const { request, env } = context;
    const body = (await request.json()) as ScoreSubmission;

    // Validate required fields
    if (!body.playerId || typeof body.score !== 'number' || !body.qbId) {
      return jsonResponse(
        { success: false, error: 'Missing required fields' },
        400
      );
    }

    // Get existing player record
    const existingPlayer = await env.DB.prepare(
      'SELECT * FROM qb_players WHERE player_id = ?'
    )
      .bind(body.playerId)
      .first();

    const isNewHighScore = !existingPlayer || body.score > (existingPlayer.high_score as number);
    const previousHighScore = (existingPlayer?.high_score as number) || 0;

    // Upsert player record
    if (existingPlayer) {
      await env.DB.prepare(
        `UPDATE qb_players SET
          player_name = COALESCE(?, player_name),
          high_score = MAX(high_score, ?),
          games_played = games_played + 1,
          total_completions = total_completions + ?,
          total_attempts = total_attempts + ?,
          total_touchdowns = total_touchdowns + ?,
          total_perfect_throws = total_perfect_throws + ?,
          longest_streak = MAX(longest_streak, ?),
          total_play_time_seconds = total_play_time_seconds + ?,
          favorite_qb_id = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE player_id = ?`
      )
        .bind(
          body.playerName || null,
          body.score,
          body.stats.completions,
          body.stats.attempts,
          body.stats.touchdowns,
          body.stats.perfectThrows,
          body.stats.longestStreak,
          body.stats.durationSeconds,
          body.qbId,
          body.playerId
        )
        .run();
    } else {
      await env.DB.prepare(
        `INSERT INTO qb_players (
          player_id, player_name, high_score, games_played,
          total_completions, total_attempts, total_touchdowns,
          total_perfect_throws, longest_streak, total_play_time_seconds,
          favorite_qb_id
        ) VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          body.playerId,
          body.playerName || null,
          body.score,
          body.stats.completions,
          body.stats.attempts,
          body.stats.touchdowns,
          body.stats.perfectThrows,
          body.stats.longestStreak,
          body.stats.durationSeconds,
          body.qbId
        )
        .run();
    }

    // Insert individual score record
    await env.DB.prepare(
      `INSERT INTO qb_scores (
        player_id, score, qb_id, completions, attempts,
        completion_percentage, longest_streak, touchdowns,
        perfect_throws, duration_seconds
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        body.playerId,
        body.score,
        body.qbId,
        body.stats.completions,
        body.stats.attempts,
        body.stats.completionPercentage,
        body.stats.longestStreak,
        body.stats.touchdowns,
        body.stats.perfectThrows,
        body.stats.durationSeconds
      )
      .run();

    // Get player's rank
    const rankResult = await env.DB.prepare(
      `SELECT COUNT(*) + 1 as rank FROM qb_players WHERE high_score > ?`
    )
      .bind(body.score)
      .first();

    // Get updated player stats
    const updatedPlayer = await env.DB.prepare(
      'SELECT games_played, total_completions FROM qb_players WHERE player_id = ?'
    )
      .bind(body.playerId)
      .first();

    // Track analytics
    if (env.ANALYTICS) {
      env.ANALYTICS.writeDataPoint({
        blobs: [body.playerId, body.qbId, 'qb_challenge'],
        doubles: [
          body.score,
          body.stats.completions,
          body.stats.attempts,
          body.stats.touchdowns,
        ],
        indexes: ['game_score'],
      });
    }

    // Invalidate leaderboard cache
    await env.KV.delete('qb:leaderboard:alltime');

    return jsonResponse({
      success: true,
      message: isNewHighScore ? 'New high score!' : 'Score submitted',
      data: {
        playerId: body.playerId,
        rank: (rankResult?.rank as number) || 1,
        isNewHighScore,
        previousHighScore,
        gamesPlayed: (updatedPlayer?.games_played as number) || 1,
        totalCompletions: (updatedPlayer?.total_completions as number) || body.stats.completions,
      },
    });
  } catch (error: unknown) {
    console.error('Submit score error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Internal server error';
    return jsonResponse({ success: false, error: errorMessage }, 500);
  }
}

function jsonResponse(data: ApiResponse, status: number = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}
