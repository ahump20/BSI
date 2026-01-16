/**
 * College Baseball Transfer Portal - Player Detail
 * Returns detailed player profile with headshot fallback
 *
 * URL: /api/college-baseball/transfer-portal/player/:playerId
 */

import { corsHeaders, ok, err } from '../../../_utils.js';

export async function onRequest(context) {
  const { request, env, params } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const playerId = params.playerId;

    if (!playerId) {
      return err(new Error('Player ID required'), 400);
    }

    const db = env.GAME_DB;
    if (!db) {
      return err(new Error('Database not configured'), 500);
    }

    // Get player from transfer portal
    const player = await db
      .prepare(
        `
      SELECT
        id, player_name, position, year,
        from_school, from_conference,
        to_school, to_conference,
        status, entry_date, commit_date,
        stats_era, stats_avg, stats_hr, stats_rbi, stats_sb,
        stats_strikeouts, stats_innings, stats_wins, stats_saves,
        power_grade, speed_grade, arm_grade, field_grade, hit_grade, contact_grade,
        pitch_command, pitch_velocity, pitch_stuff,
        impact_score, interest_score, headshot_url,
        notes, source, updated_at
      FROM transfer_portal
      WHERE id = ?
    `
      )
      .bind(playerId)
      .first();

    if (!player) {
      return err(new Error('Player not found'), 404);
    }

    // Use headshot from the transfer_portal table if available
    const headshot = player.headshot_url || null;

    // Build grades object only if we have any grades
    const grades = {};
    const hitGrades = [
      'power_grade',
      'speed_grade',
      'hit_grade',
      'contact_grade',
      'field_grade',
      'arm_grade',
    ];
    const pitchGrades = ['pitch_command', 'pitch_velocity', 'pitch_stuff'];

    for (const key of hitGrades) {
      if (player[key] !== null && player[key] !== undefined) {
        grades[key.replace('_grade', '')] = player[key];
      }
    }
    for (const key of pitchGrades) {
      if (player[key] !== null && player[key] !== undefined) {
        grades[key] = player[key];
      }
    }

    // Build stats object
    const stats = {};
    const statMapping = {
      stats_era: 'era',
      stats_avg: 'avg',
      stats_hr: 'hr',
      stats_rbi: 'rbi',
      stats_sb: 'sb',
      stats_strikeouts: 'strikeouts',
      stats_innings: 'innings_pitched',
      stats_wins: 'wins',
      stats_saves: 'saves',
    };
    for (const [dbField, outputField] of Object.entries(statMapping)) {
      if (player[dbField] !== null && player[dbField] !== undefined) {
        stats[outputField] = player[dbField];
      }
    }

    return ok({
      success: true,
      player: {
        id: player.id,
        name: player.player_name,
        position: player.position,
        year: player.year,
        headshot_url: headshot,
        transfer: {
          from_school: player.from_school,
          from_conference: player.from_conference,
          to_school: player.to_school,
          to_conference: player.to_conference,
          status: player.status,
          entry_date: player.entry_date,
          commit_date: player.commit_date,
        },
        stats: Object.keys(stats).length > 0 ? stats : null,
        grades: Object.keys(grades).length > 0 ? grades : null,
        impact: {
          score: player.impact_score,
          interest_score: player.interest_score,
        },
        notes: player.notes,
        source: player.source,
        updated_at: player.updated_at,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[transfer-portal/player] Error:', error);
    return err(error, 500);
  }
}
