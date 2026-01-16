/**
 * Blaze Hoops Shootout - Submit Score API
 *
 * POST /api/hoops/submit-score
 */

interface Env {
  DB: D1Database;
  KV: KVNamespace;
  ANALYTICS?: AnalyticsEngineDataset;
}

interface ScoreSubmission {
  playerId: string;
  playerName?: string;
  score: number;
  shooterId: string;
  stats: {
    shotsMade: number;
    shotsAttempted: number;
    shootingPercentage: number;
    longestStreak: number;
    swishes: number;
    moneyBallsMade: number;
    durationSeconds: number;
  };
}

interface ApiResponse {
  success: boolean;
  data?: unknown;
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

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  try {
    const { request, env } = context;
    const body: ScoreSubmission = await request.json();

    if (!body.playerId || typeof body.score !== 'number' || !body.shooterId) {
      return jsonResponse(
        { success: false, error: 'Missing required fields: playerId, score, shooterId' },
        400
      );
    }

    if (body.score < 0 || body.score > 100000) {
      return jsonResponse({ success: false, error: 'Invalid score value' }, 400);
    }

    const { playerId, playerName, score, shooterId, stats } = body;

    // Upsert player record
    const existingPlayer = await env.DB.prepare('SELECT * FROM hoops_players WHERE player_id = ?')
      .bind(playerId)
      .first();

    if (existingPlayer) {
      const newHighScore = Math.max(existingPlayer.high_score as number, score);
      const newLongestStreak = Math.max(
        existingPlayer.longest_streak as number,
        stats.longestStreak
      );

      await env.DB.prepare(
        `
        UPDATE hoops_players SET
          player_name = COALESCE(?, player_name),
          high_score = ?,
          games_played = games_played + 1,
          total_shots_made = total_shots_made + ?,
          total_shots_attempted = total_shots_attempted + ?,
          total_swishes = total_swishes + ?,
          total_money_balls = total_money_balls + ?,
          longest_streak = ?,
          total_play_time_seconds = total_play_time_seconds + ?,
          favorite_shooter_id = CASE
            WHEN ? > high_score THEN ?
            ELSE favorite_shooter_id
          END,
          updated_at = CURRENT_TIMESTAMP
        WHERE player_id = ?
      `
      )
        .bind(
          playerName || null,
          newHighScore,
          stats.shotsMade,
          stats.shotsAttempted,
          stats.swishes,
          stats.moneyBallsMade,
          newLongestStreak,
          stats.durationSeconds,
          score,
          shooterId,
          playerId
        )
        .run();
    } else {
      await env.DB.prepare(
        `
        INSERT INTO hoops_players (
          player_id, player_name, high_score, games_played,
          total_shots_made, total_shots_attempted, total_swishes,
          total_money_balls, longest_streak, total_play_time_seconds,
          favorite_shooter_id
        ) VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?)
      `
      )
        .bind(
          playerId,
          playerName || null,
          score,
          stats.shotsMade,
          stats.shotsAttempted,
          stats.swishes,
          stats.moneyBallsMade,
          stats.longestStreak,
          stats.durationSeconds,
          shooterId
        )
        .run();
    }

    // Insert game record
    await env.DB.prepare(
      `
      INSERT INTO hoops_scores (
        player_id, score, shooter_id, shots_made, shots_attempted,
        shooting_percentage, longest_streak, swishes, money_balls_made,
        duration_seconds
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    )
      .bind(
        playerId,
        score,
        shooterId,
        stats.shotsMade,
        stats.shotsAttempted,
        stats.shootingPercentage,
        stats.longestStreak,
        stats.swishes,
        stats.moneyBallsMade,
        stats.durationSeconds
      )
      .run();

    // Invalidate cache
    await env.KV.delete('hoops:leaderboard:alltime');
    await env.KV.delete('hoops:leaderboard:daily');

    // Track analytics
    if (env.ANALYTICS) {
      env.ANALYTICS.writeDataPoint({
        blobs: [
          'game_play',
          'hoops_shootout',
          shooterId,
          stats.swishes > 0 ? 'had_swish' : 'no_swish',
          stats.shootingPercentage >= 50 ? 'above_50pct' : 'below_50pct',
        ],
        doubles: [
          score,
          stats.shotsMade,
          stats.shotsAttempted,
          stats.longestStreak,
          stats.durationSeconds,
        ],
        indexes: [playerId],
      });
    }

    // Get rank
    const rankResult = await env.DB.prepare(
      `
      SELECT COUNT(*) + 1 as rank FROM hoops_players
      WHERE high_score > ?
    `
    )
      .bind(existingPlayer ? Math.max(existingPlayer.high_score as number, score) : score)
      .first();

    const updatedPlayer = await env.DB.prepare('SELECT * FROM hoops_players WHERE player_id = ?')
      .bind(playerId)
      .first();

    return jsonResponse({
      success: true,
      data: {
        rank: rankResult?.rank || 1,
        isHighScore: !existingPlayer || score > (existingPlayer.high_score as number),
        playerStats: {
          highScore: updatedPlayer?.high_score,
          gamesPlayed: updatedPlayer?.games_played,
          totalShotsMade: updatedPlayer?.total_shots_made,
          longestStreak: updatedPlayer?.longest_streak,
        },
      },
    });
  } catch (error: unknown) {
    console.error('Submit score error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return jsonResponse({ success: false, error: errorMessage }, 500);
  }
}

function jsonResponse(data: ApiResponse, status: number = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}
