/**
 * College Baseball Search API
 * Unified search across players and teams
 *
 * GET /api/college-baseball/search
 *   - q: Search query (required, min 2 chars)
 *   - type: "all" | "players" | "teams" (default: "all")
 *   - limit: Max results per type (default: 10, max: 50)
 *   - conference: Filter by conference (e.g., "SEC")
 *
 * Returns players and teams matching the query with relevance scoring.
 * Data sources: D1 database (8,395 players, 120 teams)
 */

import { rateLimit, rateLimitError, corsHeaders } from '../_utils.js';

const CACHE_KEY_PREFIX = 'college-baseball:search';

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Rate limiting: 60 requests per minute per IP (search is more expensive)
  const limit = await rateLimit(env, request, 60, 60000);
  if (!limit.allowed) {
    return rateLimitError(limit.resetAt, limit.retryAfter);
  }

  try {
    const query = url.searchParams.get('q')?.trim();
    const type = url.searchParams.get('type') || 'all';
    const limitParam = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50);
    const conference = url.searchParams.get('conference');

    // Validate query
    if (!query || query.length < 2) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Search query required',
          message: 'Please provide a search query of at least 2 characters',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Build cache key
    const cacheKey = `${CACHE_KEY_PREFIX}:${query.toLowerCase()}:${type}:${limitParam}:${conference || 'all'}`;

    // Check cache first (2 minute TTL for search results)
    if (env.CACHE) {
      const cached = await env.CACHE.get(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        return new Response(
          JSON.stringify({
            ...data,
            cached: true,
          }),
          {
            status: 200,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
              'Cache-Control': 'public, max-age=120',
            },
          }
        );
      }
    }

    const results = {
      success: true,
      query,
      players: [],
      teams: [],
      totalResults: 0,
      timestamp: new Date().toISOString(),
    };

    // Search players
    if (type === 'all' || type === 'players') {
      const players = await searchPlayers(env.DB, query, limitParam, conference);
      results.players = players;
    }

    // Search teams
    if (type === 'all' || type === 'teams') {
      const teams = await searchTeams(env.DB, query, limitParam, conference);
      results.teams = teams;
    }

    results.totalResults = results.players.length + results.teams.length;

    // Cache results
    if (env.CACHE && results.totalResults > 0) {
      await env.CACHE.put(cacheKey, JSON.stringify(results), {
        expirationTtl: 120, // 2 minutes
      });
    }

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Search failed',
        message: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Search players in D1 database
 */
async function searchPlayers(db, query, limit, conference) {
  if (!db) {
    return [];
  }

  const searchPattern = `%${query}%`;

  let sql = `
    SELECT
      p.id,
      p.name,
      p.team_id,
      p.position,
      p.class_year,
      p.jersey_number,
      t.name as team_name,
      t.conference as team_conference
    FROM college_baseball_players p
    LEFT JOIN college_baseball_teams t ON p.team_id = t.id
    WHERE (
      p.name LIKE ?1
      OR t.name LIKE ?1
    )
  `;

  const params = [searchPattern];

  if (conference) {
    sql += ` AND t.conference = ?2`;
    params.push(conference);
  }

  sql += ` ORDER BY
    CASE
      WHEN p.name LIKE ?1 THEN 1
      ELSE 2
    END,
    p.name ASC
    LIMIT ?${params.length + 1}`;
  params.push(limit);

  try {
    const result = await db
      .prepare(sql)
      .bind(...params)
      .all();

    return (result.results || []).map((player) => ({
      type: 'player',
      id: player.id,
      name: player.name,
      team: player.team_name,
      teamSlug: player.team_id,
      conference: player.team_conference,
      position: player.position,
      year: player.class_year,
      jerseyNumber: player.jersey_number,
      url: `/college-baseball/players/${player.id}`,
    }));
  } catch (error) {
    console.error('Player search error:', error);
    return [];
  }
}

/**
 * Search teams in D1 database
 */
async function searchTeams(db, query, limit, conference) {
  if (!db) {
    return [];
  }

  const searchPattern = `%${query}%`;

  let sql = `
    SELECT
      id,
      espn_id,
      name,
      mascot,
      abbreviation,
      conference,
      division,
      logo_url,
      stadium_name,
      city,
      state
    FROM college_baseball_teams
    WHERE (
      name LIKE ?1
      OR mascot LIKE ?1
      OR abbreviation LIKE ?1
      OR city LIKE ?1
    )
  `;

  const params = [searchPattern];

  if (conference) {
    sql += ` AND conference = ?2`;
    params.push(conference);
  }

  sql += ` ORDER BY
    CASE
      WHEN name LIKE ?1 THEN 1
      WHEN abbreviation LIKE ?1 THEN 2
      ELSE 3
    END,
    name ASC
    LIMIT ?${params.length + 1}`;
  params.push(limit);

  try {
    const result = await db
      .prepare(sql)
      .bind(...params)
      .all();

    return (result.results || []).map((team) => ({
      type: 'team',
      id: team.id,
      espnId: team.espn_id,
      name: team.name,
      mascot: team.mascot,
      abbreviation: team.abbreviation,
      conference: team.conference,
      division: team.division,
      logo: team.logo_url,
      location: {
        city: team.city,
        state: team.state,
        stadium: team.stadium_name,
      },
      url: `/college-baseball/teams/${team.id}`,
    }));
  } catch (error) {
    console.error('Team search error:', error);
    return [];
  }
}
