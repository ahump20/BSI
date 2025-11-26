/**
 * Team Schedule API Endpoint
 * Fetch upcoming and historical games for a specific team
 *
 * Features:
 * - Upcoming games with opponent details
 * - Historical game results
 * - Conference vs non-conference filtering
 * - Broadcast and venue information
 * - KV caching with 1-hour TTL
 *
 * Integration Points:
 * - WatchlistManager.tsx (upcoming games display)
 * - Game scheduling widgets
 * - Calendar integration
 *
 * Data Sources: NCAA Stats API, D1Baseball, Conference APIs
 * Last Updated: October 19, 2025
 * Timezone: America/Chicago
 */

// ============================================================================
// Type Definitions
// ============================================================================

interface Game {
  gameId: string;
  date: string; // ISO 8601 format
  time: string; // America/Chicago timezone
  opponent: {
    id: string;
    name: string;
    abbreviation: string;
    logo?: string;
    ranking?: number;
    record?: string;
  };
  venue: string;
  city?: string;
  state?: string;
  homeAway: 'home' | 'away';
  conferenceGame: boolean;
  broadcast?: string;
  result?: {
    status: 'scheduled' | 'live' | 'final' | 'postponed' | 'canceled';
    homeScore?: number;
    awayScore?: number;
    winner?: 'home' | 'away';
  };
}

interface ScheduleResponse {
  teamId: string;
  teamName: string;
  games: Game[];
  metadata: {
    total: number;
    upcoming: number;
    completed: number;
    dataSource: string;
    lastUpdated: string;
  };
}

interface ScheduleParams {
  teamId: string;
  upcoming?: boolean; // Only upcoming games
  completed?: boolean; // Only completed games
  conference?: boolean; // Only conference games
  limit?: number;
  offset?: number;
}

// ============================================================================
// API Handler
// ============================================================================

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  const url = new URL(request.url);
  const teamId = params.teamId as string;

  if (!teamId) {
    return Response.json({ error: 'Missing teamId parameter' }, { status: 400 });
  }

  // Extract query parameters
  const scheduleParams: ScheduleParams = {
    teamId,
    upcoming: url.searchParams.get('upcoming') === 'true',
    completed: url.searchParams.get('completed') === 'true',
    conference: url.searchParams.get('conference') === 'true',
    limit: parseInt(url.searchParams.get('limit') || '20', 10),
    offset: parseInt(url.searchParams.get('offset') || '0', 10),
  };

  try {
    // Check KV cache first
    const cacheKey = buildCacheKey(scheduleParams);
    const cached = await env.KV.get<ScheduleResponse>(cacheKey, 'json');

    if (cached) {
      return Response.json(cached, {
        headers: {
          'Cache-Control': 'public, max-age=300, s-maxage=3600',
          'X-Cache-Status': 'hit',
        },
      });
    }

    // Fetch schedule
    const schedule = await fetchTeamSchedule(scheduleParams, env);

    // Cache for 1 hour
    await env.KV.put(cacheKey, JSON.stringify(schedule), {
      expirationTtl: 3600,
    });

    return Response.json(schedule, {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=3600',
        'X-Cache-Status': 'miss',
      },
    });
  } catch (error) {
    console.error('Schedule fetch error:', error);
    return Response.json(
      {
        error: 'Failed to fetch schedule',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Build cache key from parameters
 */
function buildCacheKey(params: ScheduleParams): string {
  const parts = [
    'schedule',
    params.teamId,
    params.upcoming ? 'upcoming' : '',
    params.completed ? 'completed' : '',
    params.conference ? 'conference' : '',
    params.limit || 20,
    params.offset || 0,
  ];
  return parts.filter(Boolean).join(':');
}

/**
 * Fetch team schedule from database and external APIs
 */
async function fetchTeamSchedule(params: ScheduleParams, env: Env): Promise<ScheduleResponse> {
  // First, get team info
  const team = await env.DB.prepare('SELECT id, name, abbreviation FROM teams WHERE id = ?')
    .bind(params.teamId)
    .first();

  if (!team) {
    throw new Error('Team not found');
  }

  // Build SQL query with filters
  const now = new Date().toISOString();
  let sql = `
    SELECT
      g.gameId,
      g.date,
      g.time,
      g.venue,
      g.city,
      g.state,
      g.homeAway,
      g.conferenceGame,
      g.broadcast,
      g.status,
      g.homeScore,
      g.awayScore,
      g.winner,
      -- Opponent details
      t.id as opponent_id,
      t.name as opponent_name,
      t.abbreviation as opponent_abbr,
      t.logo as opponent_logo,
      t.ranking as opponent_ranking,
      t.record as opponent_record
    FROM games g
    LEFT JOIN teams t ON (
      CASE
        WHEN g.homeTeamId = ? THEN g.awayTeamId
        ELSE g.homeTeamId
      END = t.id
    )
    WHERE (g.homeTeamId = ? OR g.awayTeamId = ?)
  `;

  const binds: any[] = [params.teamId, params.teamId, params.teamId];

  // Add filters
  if (params.upcoming) {
    sql += ` AND g.date >= ? AND g.status = 'scheduled'`;
    binds.push(now);
  }

  if (params.completed) {
    sql += ` AND g.status = 'final'`;
  }

  if (params.conference) {
    sql += ` AND g.conferenceGame = 1`;
  }

  // Order and limit
  sql += ` ORDER BY g.date ${params.upcoming ? 'ASC' : 'DESC'}`;
  sql += ` LIMIT ? OFFSET ?`;
  binds.push(params.limit || 20, params.offset || 0);

  // Execute query
  const results = await env.DB.prepare(sql)
    .bind(...binds)
    .all();

  if (!results.success) {
    throw new Error('Database query failed');
  }

  // Map results to Game objects
  const games: Game[] = results.results.map((row: any) => ({
    gameId: row.gameId,
    date: row.date,
    time: row.time,
    opponent: {
      id: row.opponent_id,
      name: row.opponent_name,
      abbreviation: row.opponent_abbr,
      logo: row.opponent_logo || undefined,
      ranking: row.opponent_ranking || undefined,
      record: row.opponent_record || undefined,
    },
    venue: row.venue,
    city: row.city || undefined,
    state: row.state || undefined,
    homeAway: row.homeAway,
    conferenceGame: row.conferenceGame === 1,
    broadcast: row.broadcast || undefined,
    result: row.status
      ? {
          status: row.status,
          homeScore: row.homeScore || undefined,
          awayScore: row.awayScore || undefined,
          winner: row.winner || undefined,
        }
      : undefined,
  }));

  // Get counts for metadata
  const totalCount = await env.DB.prepare(
    'SELECT COUNT(*) as count FROM games WHERE homeTeamId = ? OR awayTeamId = ?'
  )
    .bind(params.teamId, params.teamId)
    .first<{ count: number }>();

  const upcomingCount = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM games WHERE (homeTeamId = ? OR awayTeamId = ?) AND date >= ? AND status = 'scheduled'"
  )
    .bind(params.teamId, params.teamId, now)
    .first<{ count: number }>();

  const completedCount = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM games WHERE (homeTeamId = ? OR awayTeamId = ?) AND status = 'final'"
  )
    .bind(params.teamId, params.teamId)
    .first<{ count: number }>();

  return {
    teamId: team.id as string,
    teamName: team.name as string,
    games,
    metadata: {
      total: totalCount?.count || 0,
      upcoming: upcomingCount?.count || 0,
      completed: completedCount?.count || 0,
      dataSource: 'BlazeSportsIntel DB',
      lastUpdated: new Date().toISOString(),
    },
  };
}

// ============================================================================
// Environment Types
// ============================================================================

interface Env {
  KV: KVNamespace;
  DB: D1Database;
}
