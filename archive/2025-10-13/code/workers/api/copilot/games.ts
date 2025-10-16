/**
 * Blaze Sports Intel - Games API Endpoint
 *
 * Retrieves game data from D1 database with support for:
 * - Sport filtering (MLB, NFL, CFB, CBB, NBA)
 * - Date filtering (specific date or date range)
 * - Team filtering (by team_id or team_key)
 * - Status filtering (Scheduled, InProgress, Final)
 * - Season filtering (e.g., 2025)
 *
 * Implements multi-tier caching:
 * - KV cache with 5-minute TTL for live/in-progress games
 * - KV cache with 1-hour TTL for completed games
 * - Graceful degradation if cache unavailable
 *
 * Performance targets:
 * - D1 query: <500ms
 * - KV cache hit: <10ms
 * - Total response: <2000ms (including processing)
 */

interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
}

interface GameRecord {
  id: number;
  sport: string;
  game_id: number;
  season: number;
  season_type: string;
  week: number | null;
  game_date: string;
  game_time: string;
  status: string;
  home_team_id: number;
  home_team_key: string;
  home_team_name: string;
  home_score: number | null;
  away_team_id: number;
  away_team_key: string;
  away_team_name: string;
  away_score: number | null;
  stadium_name: string | null;
  winning_team_id: number | null;
  stats: string | null;
  created_at: string;
  updated_at: string;
}

interface GamesByDate {
  date: string;
  games: GameRecord[];
}

interface GamesBySport {
  sport: string;
  count: number;
  games: GameRecord[];
}

interface GamesResponse {
  sport: string;
  date: string | null;
  team: string | null;
  status: string | null;
  season: number | null;
  count: number;
  games: GameRecord[];
  gamesByDate?: GamesByDate[];
  gamesBySport?: GamesBySport[];
  liveGamesCount: number;
  completedGamesCount: number;
  scheduledGamesCount: number;
  timestamp: string;
  source: 'database' | 'cache';
  responseTime?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const startTime = Date.now();

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle OPTIONS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Parse query parameters
    const sport = url.searchParams.get('sport') || 'all';
    const date = url.searchParams.get('date'); // Format: YYYY-MM-DD
    const dateFrom = url.searchParams.get('dateFrom'); // Format: YYYY-MM-DD
    const dateTo = url.searchParams.get('dateTo'); // Format: YYYY-MM-DD
    const teamId = url.searchParams.get('teamId');
    const teamKey = url.searchParams.get('teamKey');
    const status = url.searchParams.get('status'); // Scheduled, InProgress, Final
    const season = url.searchParams.get('season'); // e.g., 2025
    const week = url.searchParams.get('week'); // For NFL/CFB

    // Build cache key
    const cacheKey = `games:${sport}:${date || 'all'}:${teamId || teamKey || 'all'}:${status || 'all'}:${season || 'current'}:${week || 'all'}`;

    // Check cache first
    try {
      const cached = await env.CACHE.get(cacheKey, 'json');
      if (cached) {
        const cachedData = cached as GamesResponse;
        return new Response(JSON.stringify({
          ...cachedData,
          source: 'cache',
          responseTime: `${Date.now() - startTime}ms`
        }, null, 2), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'X-Data-Source': 'kv-cache',
            ...corsHeaders,
          }
        });
      }
    } catch (error) {
      console.warn('Cache read failed:', error);
      // Continue to database query
    }

    // Build D1 query
    // Note: games table is denormalized - it already contains team names/keys
    let query = `
      SELECT *
      FROM games
      WHERE 1=1
    `;

    const params: (string | number)[] = [];

    // Sport filter
    if (sport !== 'all') {
      query += ' AND sport = ?';
      params.push(sport.toUpperCase());
    }

    // Date filters
    if (date) {
      query += ' AND DATE(game_date) = ?';
      params.push(date);
    } else if (dateFrom && dateTo) {
      query += ' AND DATE(game_date) BETWEEN ? AND ?';
      params.push(dateFrom, dateTo);
    } else if (dateFrom) {
      query += ' AND DATE(game_date) >= ?';
      params.push(dateFrom);
    } else if (dateTo) {
      query += ' AND DATE(game_date) <= ?';
      params.push(dateTo);
    }

    // Team filter (either by ID or key)
    if (teamId) {
      query += ' AND (home_team_id = ? OR away_team_id = ?)';
      params.push(teamId, teamId);
    } else if (teamKey) {
      query += ' AND (home_team_key = ? OR away_team_key = ?)';
      params.push(teamKey.toUpperCase(), teamKey.toUpperCase());
    }

    // Status filter
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    // Season filter
    if (season) {
      query += ' AND season = ?';
      params.push(parseInt(season));
    }

    // Week filter (for NFL/CFB)
    if (week) {
      query += ' AND week = ?';
      params.push(parseInt(week));
    }

    query += ' ORDER BY game_date DESC, game_time DESC';

    // Execute query
    const queryStart = Date.now();
    const { results } = await env.DB.prepare(query).bind(...params).all();
    const queryTime = Date.now() - queryStart;

    console.log(`D1 query completed in ${queryTime}ms, returned ${results.length} games`);

    const games = results as GameRecord[];

    // Calculate game status counts
    const liveGamesCount = games.filter(g =>
      g.status === 'InProgress' || g.status === 'Live'
    ).length;

    const completedGamesCount = games.filter(g =>
      g.status === 'Final' || g.status === 'Completed'
    ).length;

    const scheduledGamesCount = games.filter(g =>
      g.status === 'Scheduled' || g.status === 'Upcoming'
    ).length;

    // Group games by date
    const gamesByDateMap = new Map<string, GameRecord[]>();
    games.forEach(game => {
      const gameDate = game.game_date.split('T')[0]; // Extract YYYY-MM-DD
      if (!gamesByDateMap.has(gameDate)) {
        gamesByDateMap.set(gameDate, []);
      }
      gamesByDateMap.get(gameDate)!.push(game);
    });

    const gamesByDate: GamesByDate[] = Array.from(gamesByDateMap.entries()).map(([date, games]) => ({
      date,
      games
    })).sort((a, b) => b.date.localeCompare(a.date)); // Most recent first

    // Group games by sport
    const gamesBySportMap = new Map<string, GameRecord[]>();
    games.forEach(game => {
      if (!gamesBySportMap.has(game.sport)) {
        gamesBySportMap.set(game.sport, []);
      }
      gamesBySportMap.get(game.sport)!.push(game);
    });

    const gamesBySport: GamesBySport[] = Array.from(gamesBySportMap.entries()).map(([sport, games]) => ({
      sport,
      count: games.length,
      games
    })).sort((a, b) => b.count - a.count); // Most games first

    // Build response
    const response: GamesResponse = {
      sport,
      date: date || null,
      team: teamKey || teamId || null,
      status: status || null,
      season: season ? parseInt(season) : null,
      count: games.length,
      games,
      gamesByDate: gamesByDate.length > 0 ? gamesByDate : undefined,
      gamesBySport: gamesBySport.length > 0 ? gamesBySport : undefined,
      liveGamesCount,
      completedGamesCount,
      scheduledGamesCount,
      timestamp: new Date().toISOString(),
      source: 'database'
    };

    // Determine cache TTL based on game status
    // Live/InProgress games: 5 minutes (300 seconds)
    // Completed games: 1 hour (3600 seconds)
    // Mixed: Use shorter TTL (5 minutes)
    let cacheTTL = 3600; // Default 1 hour
    if (liveGamesCount > 0) {
      cacheTTL = 300; // 5 minutes for live games
    }

    // Cache the response
    try {
      await env.CACHE.put(cacheKey, JSON.stringify(response), {
        expirationTtl: cacheTTL
      });
      console.log(`Cached response with TTL ${cacheTTL}s`);
    } catch (error) {
      console.warn('Cache write failed:', error);
      // Continue without caching
    }

    const totalTime = Date.now() - startTime;

    return new Response(JSON.stringify({
      ...response,
      responseTime: `${totalTime}ms`,
      performance: {
        queryTime: `${queryTime}ms`,
        totalTime: `${totalTime}ms`,
        cacheTTL: `${cacheTTL}s`
      }
    }, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Data-Source': 'database',
        'X-Query-Time': `${queryTime}ms`,
        'X-Cache-TTL': `${cacheTTL}`,
        ...corsHeaders,
      }
    });

  } catch (error) {
    console.error('Games API error:', error);

    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, null, 2), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      }
    });
  }
};
