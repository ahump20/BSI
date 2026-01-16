/**
 * College Baseball Teams API
 * Returns NCAA Division I baseball teams with filtering
 *
 * Caching: 1 hour (teams don't change frequently)
 * Data sources: D1 Database (primary) → ESPN API (fallback)
 */

import { fetchTeams as fetchESPNTeams } from './_ncaa-adapter.js';
import { rateLimit, rateLimitError, corsHeaders } from '../_utils.js';

const CACHE_KEY_PREFIX = 'college-baseball:teams';

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Rate limiting: 100 requests per minute per IP
  const limit = await rateLimit(env, request, 100, 60000);
  if (!limit.allowed) {
    return rateLimitError(limit.resetAt, limit.retryAfter);
  }

  try {
    const search = url.searchParams.get('search') || '';
    const conference = url.searchParams.get('conference') || '';
    const limit_param = parseInt(url.searchParams.get('limit') || '150', 10);

    const cacheKey = `${CACHE_KEY_PREFIX}:${search}:${conference}:${limit_param}`;

    // Check cache
    if (env.CACHE) {
      const cached = await env.CACHE.get(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        return new Response(
          JSON.stringify({
            success: true,
            ...data,
            cached: true,
          }),
          {
            status: 200,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
              'Cache-Control': 'public, max-age=3600, stale-while-revalidate=300',
            },
          }
        );
      }
    }

    let teams = [];
    let dataSource = 'D1 Database';

    // Try D1 database first (primary source)
    if (env.DB) {
      try {
        teams = await fetchTeamsFromD1(env.DB, { search, conference, limit: limit_param });
      } catch (dbError) {
        console.error('D1 fetch failed:', dbError.message);
      }
    }

    // Fallback to ESPN if D1 returns no results
    if (teams.length === 0) {
      dataSource = 'ESPN API';
      teams = await fetchESPNTeams({
        search: search || undefined,
        conference: conference || undefined,
      });
    }

    const responseData = {
      teams,
      count: teams.length,
      dataStamp: {
        source: dataSource,
        fetchedAt: new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }) + ' CT',
      },
      timestamp: new Date().toISOString(),
    };

    // Cache the response
    if (env.CACHE) {
      await env.CACHE.put(cacheKey, JSON.stringify(responseData), {
        expirationTtl: 3600, // 1 hour
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        ...responseData,
        cached: false,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch teams',
        message: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Fetch teams from D1 database
 */
async function fetchTeamsFromD1(db, { search, conference, limit }) {
  let query = `
    SELECT
      id,
      espn_id,
      name,
      mascot,
      abbreviation,
      conference,
      city,
      state,
      primary_color,
      secondary_color,
      logo_url,
      stadium_name,
      stadium_capacity,
      coach_name,
      updated_at
    FROM college_baseball_teams
    WHERE 1=1
  `;

  const params = [];

  if (search) {
    query += ` AND (name LIKE ? OR mascot LIKE ? OR abbreviation LIKE ?)`;
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  if (conference) {
    query += ` AND conference = ?`;
    params.push(conference);
  }

  query += ` ORDER BY name ASC LIMIT ?`;
  params.push(limit);

  const stmt = db.prepare(query);
  const result = await stmt.bind(...params).all();

  return result.results.map((row) => ({
    id: row.id,
    espnId: row.espn_id,
    name: row.name,
    mascot: row.mascot,
    abbreviation: row.abbreviation,
    conference: row.conference,
    division: 'D1',
    location: {
      city: row.city || null,
      state: row.state || null,
    },
    colors: {
      primary: row.primary_color,
      secondary: row.secondary_color,
    },
    logo: row.logo_url,
    stadium: {
      name: row.stadium_name || null,
      capacity: row.stadium_capacity || null,
    },
    coach: row.coach_name || null,
    updatedAt: row.updated_at,
  }));
}
