/**
 * College Football Games API Endpoint
 *
 * GET /api/college-football/games/:gameId
 *   - Fetches complete game data including score, stats, and play-by-play
 *   - Returns game info, teams, scoring, and advanced metrics
 *
 * GET /api/college-football/games (no gameId)
 *   - Returns games for a specific week/season
 *
 * Query Parameters:
 *   - year: season year (default: current year)
 *   - week: week number (default: current week)
 *   - seasonType: 'regular' | 'postseason' (default: 'regular')
 *   - conference: filter by conference
 *   - team: filter by team name
 *   - format: 'full' | 'compact' (default: 'full')
 *
 * Examples:
 *   /api/college-football/games/401762852
 *   /api/college-football/games?year=2025&week=11&conference=SEC
 *   /api/college-football/games?year=2025&week=11&team=Texas
 */

import { CFBDAdapter, getGameState } from '../../../../lib/adapters/cfbd-adapter';

interface Env {
  CACHE: KVNamespace;
  ANALYTICS?: AnalyticsEngineDataset;
  CFBD_API_KEY?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, params, env } = context;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle OPTIONS request
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Check for API key
    const apiKey = env.CFBD_API_KEY || 'fGJioao24tAaWLyWOh5MmLHl8DwJsKLfv5Lg73mbZsNQogP9XeOXi3l/1o28soOi';
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'Configuration error',
          message: 'CFBD API key not configured',
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Extract game ID from URL params
    const gameIdParam = params.gameId as string | string[];
    const gameId = Array.isArray(gameIdParam) ? gameIdParam[0] : gameIdParam;

    // Initialize adapter
    const adapter = new CFBDAdapter(apiKey, env.CACHE);

    // Parse query parameters
    const url = new URL(request.url);

    // If no game ID, return games for a week
    if (!gameId || gameId === 'undefined') {
      return handleGamesList(env, request, corsHeaders, adapter);
    }

    const gameIdNum = parseInt(gameId, 10);
    if (isNaN(gameIdNum)) {
      return new Response(
        JSON.stringify({
          error: 'Invalid game ID',
          message: 'Game ID must be a number',
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Fetch single game
    const game = await adapter.fetchGameById(gameIdNum);

    if (!game) {
      return new Response(
        JSON.stringify({
          error: 'Game not found',
          message: `No game found with ID ${gameIdNum}`,
        }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const response = {
      game: {
        id: game.id,
        season: game.season,
        week: game.week,
        seasonType: game.seasonType,
        startDate: game.startDate,
        startTimeTBD: game.startTimeTBD,
        status: getGameState(game),
        completed: game.completed,
        neutralSite: game.neutralSite,
        conferenceGame: game.conferenceGame,
        attendance: game.attendance,
        venue: {
          id: game.venueId,
          name: game.venue,
        },
        homeTeam: {
          id: game.homeId,
          name: game.homeTeam,
          classification: game.homeClassification,
          conference: game.homeConference,
          score: game.homePoints,
          lineScores: game.homeLineScores,
          pregameElo: game.homePregameElo,
          postgameElo: game.homePostgameElo,
          winProbability: game.homePostgameWinProbability,
        },
        awayTeam: {
          id: game.awayId,
          name: game.awayTeam,
          classification: game.awayClassification,
          conference: game.awayConference,
          score: game.awayPoints,
          lineScores: game.awayLineScores,
          pregameElo: game.awayPregameElo,
          postgameElo: game.awayPostgameElo,
          winProbability: game.awayPostgameWinProbability,
        },
        excitementIndex: game.excitementIndex,
        highlights: game.highlights,
        notes: game.notes,
      },
      meta: {
        dataSource: 'College Football Data API (api.collegefootballdata.com)',
        lastUpdated: new Date().toISOString(),
        timezone: 'America/Chicago',
      },
    };

    // Track analytics
    if (env.ANALYTICS) {
      try {
        env.ANALYTICS.writeDataPoint({
          blobs: ['college_football_game', `game_${gameIdNum}`],
          doubles: [1],
          indexes: [`${game.season}`],
        });
      } catch (error) {
        console.warn('Analytics write failed:', error);
      }
    }

    return new Response(JSON.stringify(response, null, 2), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': game.completed
          ? 'public, max-age=3600, s-maxage=86400' // 1hr client, 24hr CDN for completed
          : 'public, max-age=30, s-maxage=300', // 30s client, 5min CDN for live
      },
    });
  } catch (error) {
    console.error('College football game error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return new Response(
      JSON.stringify({
        error: 'Failed to fetch game data',
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
};

/**
 * Handle games list request
 */
async function handleGamesList(
  env: Env,
  request: Request,
  corsHeaders: Record<string, string>,
  adapter: CFBDAdapter
): Promise<Response> {
  const url = new URL(request.url);

  const year = parseInt(
    url.searchParams.get('year') || new Date().getFullYear().toString(),
    10
  );

  const week = parseInt(
    url.searchParams.get('week') || '1',
    10
  );

  const seasonType = (url.searchParams.get('seasonType') || 'regular') as 'regular' | 'postseason';
  const conference = url.searchParams.get('conference') || undefined;
  const team = url.searchParams.get('team') || undefined;
  const format = url.searchParams.get('format') || 'full';

  const games = await adapter.fetchGames(year, week, seasonType, conference, team);

  const response = {
    season: year,
    week,
    seasonType,
    totalGames: games.length,
    games: format === 'compact'
      ? games.map(g => ({
          id: g.id,
          homeTeam: g.homeTeam,
          awayTeam: g.awayTeam,
          homePoints: g.homePoints,
          awayPoints: g.awayPoints,
          status: getGameState(g),
          startDate: g.startDate,
        }))
      : games,
    meta: {
      dataSource: 'College Football Data API',
      lastUpdated: new Date().toISOString(),
      timezone: 'America/Chicago',
    },
  };

  // Track analytics
  if (env.ANALYTICS) {
    try {
      env.ANALYTICS.writeDataPoint({
        blobs: ['college_football_games', `week_${week}`, `${conference || 'all'}`],
        doubles: [games.length],
        indexes: [`${year}`],
      });
    } catch (error) {
      console.warn('Analytics write failed:', error);
    }
  }

  // Determine cache TTL based on games status
  const allCompleted = games.every(g => g.completed);
  const cacheControl = allCompleted
    ? 'public, max-age=3600, s-maxage=86400' // 1hr client, 24hr CDN for completed
    : 'public, max-age=30, s-maxage=300'; // 30s client, 5min CDN for live

  return new Response(JSON.stringify(response, null, 2), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': cacheControl,
    },
  });
}
