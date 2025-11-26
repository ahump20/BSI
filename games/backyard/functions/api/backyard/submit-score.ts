/**
 * Blaze Backyard Baseball - Submit Score API
 *
 * POST /api/backyard/submit-score
 * Submits a game score and updates player stats
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
  characterId: string;
  fieldId?: string;
  stats: {
    totalPitches: number;
    totalHits: number;
    singles: number;
    doubles: number;
    triples: number;
    homeRuns: number;
    whiffs: number;
    longestStreak: number;
    durationSeconds: number;
    multiplierPeak?: number;
  };
}

interface ApiResponse {
  success: boolean;
  data?: any;
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
    if (!body.playerId || typeof body.score !== 'number' || !body.characterId) {
      return jsonResponse(
        { success: false, error: 'Missing required fields: playerId, score, characterId' },
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

    const { playerId, playerName, score, characterId, fieldId, stats } = body;

    // 1. Upsert player record
    const existingPlayer = await env.DB.prepare(
      'SELECT * FROM backyard_players WHERE player_id = ?'
    )
      .bind(playerId)
      .first();

    if (existingPlayer) {
      // Update existing player
      const newHighScore = Math.max(existingPlayer.high_score as number, score);
      const newLongestStreak = Math.max(
        existingPlayer.longest_streak as number,
        stats.longestStreak
      );

      await env.DB.prepare(`
        UPDATE backyard_players SET
          player_name = COALESCE(?, player_name),
          high_score = ?,
          games_played = games_played + 1,
          total_hits = total_hits + ?,
          total_home_runs = total_home_runs + ?,
          total_singles = total_singles + ?,
          total_doubles = total_doubles + ?,
          total_triples = total_triples + ?,
          total_whiffs = total_whiffs + ?,
          longest_streak = ?,
          total_play_time_seconds = total_play_time_seconds + ?,
          favorite_character_id = CASE
            WHEN ? > high_score THEN ?
            ELSE favorite_character_id
          END,
          updated_at = CURRENT_TIMESTAMP
        WHERE player_id = ?
      `)
        .bind(
          playerName || null,
          newHighScore,
          stats.totalHits,
          stats.homeRuns,
          stats.singles,
          stats.doubles,
          stats.triples,
          stats.whiffs,
          newLongestStreak,
          stats.durationSeconds,
          score,
          characterId,
          playerId
        )
        .run();
    } else {
      // Insert new player
      await env.DB.prepare(`
        INSERT INTO backyard_players (
          player_id, player_name, high_score, games_played,
          total_hits, total_home_runs, total_singles, total_doubles, total_triples,
          total_whiffs, longest_streak, total_play_time_seconds, favorite_character_id
        ) VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
        .bind(
          playerId,
          playerName || null,
          score,
          stats.totalHits,
          stats.homeRuns,
          stats.singles,
          stats.doubles,
          stats.triples,
          stats.whiffs,
          stats.longestStreak,
          stats.durationSeconds,
          characterId
        )
        .run();
    }

    // 2. Insert individual game score record
    await env.DB.prepare(`
      INSERT INTO backyard_scores (
        player_id, score, character_id, field_id,
        total_pitches, total_hits, singles, doubles, triples,
        home_runs, whiffs, longest_streak, duration_seconds, multiplier_peak
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
      .bind(
        playerId,
        score,
        characterId,
        fieldId || null,
        stats.totalPitches,
        stats.totalHits,
        stats.singles,
        stats.doubles,
        stats.triples,
        stats.homeRuns,
        stats.whiffs,
        stats.longestStreak,
        stats.durationSeconds,
        stats.multiplierPeak || 1.0
      )
      .run();

    // 3. Invalidate leaderboard cache
    await env.KV.delete('leaderboard:alltime');
    await env.KV.delete('leaderboard:daily');

    // 4. Track analytics
    if (env.ANALYTICS) {
      env.ANALYTICS.writeDataPoint({
        blobs: [
          'game_play',           // event type
          'backyard_baseball',   // game name
          characterId,           // character used
          fieldId || 'default',  // field played
          stats.homeRuns > 0 ? 'home_run_hit' : 'no_home_run',
        ],
        doubles: [
          score,                     // final score
          stats.totalHits,           // hits
          stats.homeRuns,            // home runs
          stats.longestStreak,       // streak
          stats.durationSeconds,     // play time
        ],
        indexes: [playerId],
      });
    }

    // 5. Get player's current rank
    const rankResult = await env.DB.prepare(`
      SELECT COUNT(*) + 1 as rank FROM backyard_players
      WHERE high_score > ?
    `)
      .bind(existingPlayer ? Math.max(existingPlayer.high_score as number, score) : score)
      .first();

    // 5. Get updated player stats
    const updatedPlayer = await env.DB.prepare(
      'SELECT * FROM backyard_players WHERE player_id = ?'
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
          totalHomeRuns: updatedPlayer?.total_home_runs,
          longestStreak: updatedPlayer?.longest_streak,
        },
      },
    });
  } catch (error: any) {
    console.error('Submit score error:', error);
    return jsonResponse(
      { success: false, error: error.message || 'Internal server error' },
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
