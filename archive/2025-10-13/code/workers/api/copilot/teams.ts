/**
 * Copilot Teams API - Phase 2
 * GET /api/copilot/teams?sport={sport}&conference={conf}
 *
 * Returns team data from D1 database with KV caching
 * Supports filtering by sport and conference
 * Cache TTL: 1 hour (teams don't change frequently)
 */

interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
}

interface TeamRecord {
  id: number;
  sport: string;
  team_id: number;
  global_team_id: number | null;
  key: string;
  city: string;
  name: string;
  school: string | null;
  conference: string | null;
  division: string | null;
  stadium_name: string | null;
  stadium_capacity: number | null;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  active: number;
  created_at: string;
  updated_at: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const startTime = Date.now();

  // Parse query parameters
  const sport = url.searchParams.get('sport') || 'all';
  const conference = url.searchParams.get('conference');
  const division = url.searchParams.get('division');

  // Build cache key
  const cacheKey = `teams:${sport}:${conference || 'all'}:${division || 'all'}`;

  // Check cache first (1 hour TTL)
  try {
    const cached = await env.CACHE.get(cacheKey, 'json');
    if (cached) {
      return new Response(JSON.stringify({
        ...cached,
        source: 'cache',
        responseTime: `${Date.now() - startTime}ms`
      }, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=3600', // Browser can cache for 1 hour
          'X-Data-Source': 'kv-cache'
        }
      });
    }
  } catch (error) {
    console.warn('Cache read failed:', error);
    // Continue to database if cache fails
  }

  // Build D1 query
  let query = 'SELECT * FROM teams WHERE active = 1';
  const params: (string | number)[] = [];

  if (sport !== 'all') {
    query += ' AND sport = ?';
    params.push(sport.toUpperCase());
  }

  if (conference) {
    query += ' AND conference = ?';
    params.push(conference);
  }

  if (division) {
    query += ' AND division = ?';
    params.push(division);
  }

  query += ' ORDER BY sport, conference, name';

  // Execute query
  try {
    const { results } = await env.DB.prepare(query).bind(...params).all();

    // Group teams by sport for easier consumption
    const teamsBySport: Record<string, TeamRecord[]> = {};
    results.forEach((team: any) => {
      if (!teamsBySport[team.sport]) {
        teamsBySport[team.sport] = [];
      }
      teamsBySport[team.sport].push(team as TeamRecord);
    });

    // Build response
    const response = {
      sport,
      filters: {
        conference: conference || null,
        division: division || null
      },
      count: results.length,
      teams: results as TeamRecord[],
      teamsBySport,
      sportBreakdown: Object.entries(teamsBySport).map(([sport, teams]) => ({
        sport,
        count: teams.length,
        conferences: [...new Set(teams.map(t => t.conference).filter(Boolean))]
      })),
      timestamp: new Date().toISOString(),
      source: 'database'
    };

    // Cache for 1 hour
    try {
      await env.CACHE.put(cacheKey, JSON.stringify(response), {
        expirationTtl: 3600
      });
    } catch (error) {
      console.warn('Cache write failed:', error);
      // Continue even if caching fails
    }

    return new Response(JSON.stringify({
      ...response,
      responseTime: `${Date.now() - startTime}ms`
    }, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
        'X-Data-Source': 'd1-database'
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to fetch teams',
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, null, 2), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};
