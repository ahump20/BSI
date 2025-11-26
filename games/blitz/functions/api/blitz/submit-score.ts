/**
 * Blaze Blitz Football - Submit Score API
 *
 * POST /api/blitz/submit-score
 * Submits a game score and updates player stats
 */

interface Env {
  DB: D1Database;
  KV: KVNamespace;
}

interface ScoreSubmission {
  playerId: string;
  playerName?: string;
  score: number;
  teamId: string;
  stats: {
    yardsGained: number;
    touchdowns: number;
    firstDowns: number;
    bigPlays: number;
    turnovers: number;
    tacklesMade: number;
    stiffArms: number;
    jukes: number;
    turboYards: number;
    longestPlay: number;
    durationSeconds: number;
    result: string;
  };
}

interface ApiResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

/** CORS headers for cross-origin requests */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

/** Handle OPTIONS preflight */
export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { headers: corsHeaders });
}

/** Handle POST request to submit score */
export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  try {
    const { request, env } = context;

    // Parse request body
    const body: ScoreSubmission = await request.json();

    // Validate required fields
    if (!body.playerId || typeof body.score !== 'number' || !body.teamId) {
      return jsonResponse(
        { success: false, error: 'Missing required fields: playerId, score, teamId' },
        400
      );
    }

    // Validate score is reasonable (anti-cheat basic check)
    if (body.score < 0 || body.score > 100000) {
      return jsonResponse(
        { success: false, error: 'Invalid score value' },
        400
      );
    }

    const { playerId, playerName, score, teamId, stats } = body;

    // 1. Upsert player record
    const existingPlayer = await env.DB.prepare(
      'SELECT * FROM blitz_players WHERE player_id = ?'
    )
      .bind(playerId)
      .first();

    if (existingPlayer) {
      // Update existing player
      const newHighScore = Math.max(existingPlayer.high_score as number, score);
      const newLongestPlay = Math.max(
        existingPlayer.longest_play as number,
        stats.longestPlay
      );

      await env.DB.prepare(`
        UPDATE blitz_players SET
          player_name = COALESCE(?, player_name),
          high_score = ?,
          games_played = games_played + 1,
          total_touchdowns = total_touchdowns + ?,
          total_yards = total_yards + ?,
          total_first_downs = total_first_downs + ?,
          total_big_plays = total_big_plays + ?,
          total_turnovers = total_turnovers + ?,
          total_tackles = total_tackles + ?,
          total_stiff_arms = total_stiff_arms + ?,
          total_jukes = total_jukes + ?,
          longest_play = ?,
          total_play_time_seconds = total_play_time_seconds + ?,
          favorite_team_id = CASE
            WHEN ? > high_score THEN ?
            ELSE favorite_team_id
          END,
          updated_at = CURRENT_TIMESTAMP
        WHERE player_id = ?
      `)
        .bind(
          playerName || null,
          newHighScore,
          stats.touchdowns,
          stats.yardsGained,
          stats.firstDowns,
          stats.bigPlays,
          stats.turnovers,
          stats.tacklesMade,
          stats.stiffArms,
          stats.jukes,
          newLongestPlay,
          stats.durationSeconds,
          score,
          teamId,
          playerId
        )
        .run();
    } else {
      // Insert new player
      await env.DB.prepare(`
        INSERT INTO blitz_players (
          player_id, player_name, high_score, games_played,
          total_touchdowns, total_yards, total_first_downs, total_big_plays,
          total_turnovers, total_tackles, total_stiff_arms, total_jukes,
          longest_play, total_play_time_seconds, favorite_team_id
        ) VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
        .bind(
          playerId,
          playerName || null,
          score,
          stats.touchdowns,
          stats.yardsGained,
          stats.firstDowns,
          stats.bigPlays,
          stats.turnovers,
          stats.tacklesMade,
          stats.stiffArms,
          stats.jukes,
          stats.longestPlay,
          stats.durationSeconds,
          teamId
        )
        .run();
    }

    // 2. Insert individual game score record
    await env.DB.prepare(`
      INSERT INTO blitz_scores (
        player_id, score, team_id, yards_gained, touchdowns, first_downs,
        big_plays, turnovers, tackles_made, stiff_arms, jukes,
        longest_play, turbo_yards, duration_seconds, result
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
      .bind(
        playerId,
        score,
        teamId,
        stats.yardsGained,
        stats.touchdowns,
        stats.firstDowns,
        stats.bigPlays,
        stats.turnovers,
        stats.tacklesMade,
        stats.stiffArms,
        stats.jukes,
        stats.longestPlay,
        stats.turboYards,
        stats.durationSeconds,
        stats.result
      )
      .run();

    // 3. Invalidate leaderboard cache
    await env.KV.delete('blitz:leaderboard:alltime');
    await env.KV.delete('blitz:leaderboard:daily');

    // 4. Get player's current rank
    const rankResult = await env.DB.prepare(`
      SELECT COUNT(*) + 1 as rank FROM blitz_players
      WHERE high_score > ?
    `)
      .bind(existingPlayer ? Math.max(existingPlayer.high_score as number, score) : score)
      .first();

    // 5. Get updated player stats
    const updatedPlayer = await env.DB.prepare(
      'SELECT * FROM blitz_players WHERE player_id = ?'
    )
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
          totalTouchdowns: updatedPlayer?.total_touchdowns,
          totalYards: updatedPlayer?.total_yards,
          longestPlay: updatedPlayer?.longest_play,
        },
      },
    });
  } catch (error: unknown) {
    console.error('Submit score error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return jsonResponse(
      { success: false, error: errorMessage },
      500
    );
  }
}

/** Helper to create JSON response */
function jsonResponse(data: ApiResponse, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders,
  });
}
