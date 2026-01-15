/**
 * College Baseball Transfer Portal API
 * Returns transfer portal entries with filtering
 *
 * Query params:
 * - position: Filter by position (P, C, INF, OF, UTIL)
 * - from_school: Filter by origin school
 * - to_school: Filter by destination school
 * - conference: Filter by destination conference
 * - status: committed, exploring, withdrawn
 * - limit: Max results (default 50)
 * - offset: Pagination offset
 *
 * Database: bsi-game-db (GAME_DB binding)
 */

import { corsHeaders, ok, err } from '../_utils.js';

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Get filter params
    const position = url.searchParams.get('position') || '';
    const fromSchool = url.searchParams.get('from_school') || '';
    const toSchool = url.searchParams.get('to_school') || '';
    const conference = url.searchParams.get('conference') || '';
    const status = url.searchParams.get('status') || '';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    // Build query (using actual schema column names)
    let query = `
      SELECT
        id, player_name, position, year,
        from_school, from_conference,
        to_school, to_conference,
        status, entry_date, commit_date,
        stats_era, stats_avg, stats_hr, stats_rbi, stats_sb,
        stats_strikeouts, stats_innings, stats_wins, stats_saves,
        impact_score, interest_score, headshot_url,
        notes, source, updated_at
      FROM transfer_portal
      WHERE 1=1
    `;
    const params = [];

    if (position) {
      query += ` AND position = ?`;
      params.push(position);
    }
    if (fromSchool) {
      query += ` AND LOWER(from_school) LIKE LOWER(?)`;
      params.push(`%${fromSchool}%`);
    }
    if (toSchool) {
      query += ` AND LOWER(to_school) LIKE LOWER(?)`;
      params.push(`%${toSchool}%`);
    }
    if (conference) {
      query += ` AND LOWER(to_conference) = LOWER(?)`;
      params.push(conference);
    }
    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }

    query += ` ORDER BY impact_score DESC NULLS LAST, updated_at DESC`;
    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    // Execute query
    const db = env.GAME_DB;
    if (!db) {
      return err(new Error('Database not configured'), 500);
    }

    const results = await db.prepare(query).bind(...params).all();

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM transfer_portal WHERE 1=1`;
    const countParams = [];
    if (position) {
      countQuery += ` AND position = ?`;
      countParams.push(position);
    }
    if (fromSchool) {
      countQuery += ` AND LOWER(from_school) LIKE LOWER(?)`;
      countParams.push(`%${fromSchool}%`);
    }
    if (toSchool) {
      countQuery += ` AND LOWER(to_school) LIKE LOWER(?)`;
      countParams.push(`%${toSchool}%`);
    }
    if (conference) {
      countQuery += ` AND LOWER(to_conference) = LOWER(?)`;
      countParams.push(conference);
    }
    if (status) {
      countQuery += ` AND status = ?`;
      countParams.push(status);
    }

    const countResult = await db.prepare(countQuery).bind(...countParams).first();
    const total = countResult?.total || 0;

    return ok({
      success: true,
      transfers: results.results || [],
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + limit < total
      },
      filters: {
        position: position || null,
        from_school: fromSchool || null,
        to_school: toSchool || null,
        conference: conference || null,
        status: status || null
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[transfer-portal] Error:', error);
    return err(error, 500);
  }
}
