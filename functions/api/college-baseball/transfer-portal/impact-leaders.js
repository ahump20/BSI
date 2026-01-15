/**
 * College Baseball Transfer Portal - Impact Leaders
 * Returns top transfers by impact score with optional filters
 *
 * Query params:
 * - position: P, C, INF, OF, UTIL
 * - conference: Filter by destination conference
 * - type: hitter, pitcher (filters by stat presence)
 * - limit: Max results (default 25)
 */

import { corsHeaders, ok, err } from '../../_utils.js';

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const position = url.searchParams.get('position') || '';
    const conference = url.searchParams.get('conference') || '';
    const type = url.searchParams.get('type') || '';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '25', 10), 50);

    let query = `
      SELECT
        id, player_name, position, year,
        from_school, from_conference,
        to_school, to_conference,
        status, entry_date,
        stats_era, stats_avg, stats_hr, stats_rbi, stats_sb,
        stats_strikeouts, stats_innings, stats_wins, stats_saves,
        impact_score, interest_score,
        updated_at
      FROM transfer_portal
      WHERE impact_score IS NOT NULL AND impact_score > 0
    `;
    const params = [];

    if (position) {
      query += ` AND position = ?`;
      params.push(position);
    }
    if (conference) {
      query += ` AND LOWER(to_conference) = LOWER(?)`;
      params.push(conference);
    }
    if (type === 'hitter') {
      query += ` AND stats_avg IS NOT NULL`;
    } else if (type === 'pitcher') {
      query += ` AND stats_era IS NOT NULL`;
    }

    query += ` ORDER BY impact_score DESC LIMIT ?`;
    params.push(limit);

    const db = env.GAME_DB;
    if (!db) {
      return err(new Error('Database not configured'), 500);
    }

    const results = await db.prepare(query).bind(...params).all();

    return ok({
      success: true,
      leaders: results.results || [],
      count: results.results?.length || 0,
      filters: {
        position: position || null,
        conference: conference || null,
        type: type || null
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[transfer-portal/impact-leaders] Error:', error);
    return err(error, 500);
  }
}
