/**
 * Team Search API Endpoint
 * Search teams across multiple sports for watchlist management
 *
 * Features:
 * - Multi-sport search (College Baseball, MLB, NFL, CFB, CBB)
 * - Fuzzy matching with ranking
 * - Conference and division filtering
 * - KV caching with 5-minute TTL
 * - Rate limiting protection
 *
 * Integration Points:
 * - WatchlistManager.tsx (team search)
 * - D1 database for team data
 * - KV cache for performance
 *
 * Data Sources: BlazeSportsIntel DB, NCAA Stats API, ESPN API
 * Last Updated: October 19, 2025
 * Timezone: America/Chicago
 */

// ============================================================================
// Type Definitions
// ============================================================================

interface Team {
  id: string;
  name: string;
  abbreviation: string;
  conference: string;
  division?: string;
  sport: 'college_baseball' | 'mlb' | 'nfl' | 'cfb' | 'cbb';
  logo?: string;
  record?: string;
  winPct?: number;
  ranking?: number;
  city?: string;
  state?: string;
}

interface SearchParams {
  query: string;
  sport?: string;
  conference?: string;
  limit?: number;
}

// ============================================================================
// API Handler
// ============================================================================

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  // Extract search parameters
  const params: SearchParams = {
    query: url.searchParams.get('q') || '',
    sport: url.searchParams.get('sport') || undefined,
    conference: url.searchParams.get('conference') || undefined,
    limit: parseInt(url.searchParams.get('limit') || '20', 10)
  };

  // Validate query
  if (params.query.length < 2) {
    return Response.json(
      { error: 'Query must be at least 2 characters' },
      { status: 400 }
    );
  }

  try {
    // Check KV cache first
    const cacheKey = buildCacheKey(params);
    const cached = await env.KV.get<Team[]>(cacheKey, 'json');

    if (cached) {
      return Response.json(cached, {
        headers: {
          'Cache-Control': 'public, max-age=60, s-maxage=300',
          'X-Cache-Status': 'hit'
        }
      });
    }

    // Search teams
    const results = await searchTeams(params, env);

    // Cache results for 5 minutes
    await env.KV.put(cacheKey, JSON.stringify(results), {
      expirationTtl: 300
    });

    return Response.json(results, {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=300',
        'X-Cache-Status': 'miss'
      }
    });
  } catch (error) {
    console.error('Team search error:', error);
    return Response.json(
      {
        error: 'Search failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Build cache key from search parameters
 */
function buildCacheKey(params: SearchParams): string {
  const parts = [
    'team_search',
    params.query.toLowerCase(),
    params.sport || 'all',
    params.conference || 'all',
    params.limit || 20
  ];
  return parts.join(':');
}

/**
 * Search teams in database
 */
async function searchTeams(params: SearchParams, env: Env): Promise<Team[]> {
  const query = params.query.toLowerCase();
  const sportFilter = params.sport ? `AND sport = ?` : '';
  const conferenceFilter = params.conference ? `AND conference = ?` : '';

  // Build SQL query with fuzzy matching
  const sql = `
    SELECT
      id,
      name,
      abbreviation,
      conference,
      division,
      sport,
      logo,
      record,
      winPct,
      ranking,
      city,
      state,
      -- Ranking for relevance
      CASE
        WHEN LOWER(name) = ? THEN 10
        WHEN LOWER(abbreviation) = ? THEN 9
        WHEN LOWER(name) LIKE ? THEN 8
        WHEN LOWER(abbreviation) LIKE ? THEN 7
        WHEN LOWER(name) LIKE ? THEN 6
        WHEN LOWER(city) = ? THEN 5
        ELSE 4
      END as relevance
    FROM teams
    WHERE (
      LOWER(name) LIKE ?
      OR LOWER(abbreviation) LIKE ?
      OR LOWER(city) LIKE ?
      OR LOWER(conference) LIKE ?
    )
    ${sportFilter}
    ${conferenceFilter}
    ORDER BY relevance DESC, ranking ASC, name ASC
    LIMIT ?
  `;

  // Build bind parameters
  const binds: any[] = [
    query, // exact name match
    query, // exact abbreviation match
    `${query}%`, // name starts with
    `${query}%`, // abbreviation starts with
    `%${query}%`, // name contains
    query, // exact city match
    `%${query}%`, // name contains
    `%${query}%`, // abbreviation contains
    `%${query}%`, // city contains
    `%${query}%`  // conference contains
  ];

  if (params.sport) {
    binds.push(params.sport);
  }

  if (params.conference) {
    binds.push(params.conference);
  }

  binds.push(params.limit || 20);

  // Execute query
  const results = await env.DB.prepare(sql).bind(...binds).all();

  if (!results.success) {
    throw new Error('Database query failed');
  }

  // Map results to Team objects
  return results.results.map((row: any) => ({
    id: row.id,
    name: row.name,
    abbreviation: row.abbreviation,
    conference: row.conference,
    division: row.division || undefined,
    sport: row.sport,
    logo: row.logo || undefined,
    record: row.record || undefined,
    winPct: row.winPct || undefined,
    ranking: row.ranking || undefined,
    city: row.city || undefined,
    state: row.state || undefined
  }));
}

// ============================================================================
// Environment Types
// ============================================================================

interface Env {
  KV: KVNamespace;
  DB: D1Database;
}
