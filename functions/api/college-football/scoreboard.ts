/**
 * College Football Scoreboard API Endpoint
 *
 * GET /api/college-football/scoreboard
 *   - Returns live and recent games with real-time scores
 *   - Includes game status, scores, and team information
 *
 * Query Parameters:
 *   - year: season year (default: current year)
 *   - week: week number (default: current week)
 *   - conference: filter by conference (e.g., "SEC", "Big Ten")
 *
 * Examples:
 *   /api/college-football/scoreboard
 *   /api/college-football/scoreboard?year=2025&week=11
 *   /api/college-football/scoreboard?week=11&conference=SEC
 */

import { CFBDAdapter, getGameState } from '../../../lib/adapters/cfbd-adapter';

interface Env {
  CACHE: KVNamespace;
  ANALYTICS?: AnalyticsEngineDataset;
  CFBD_API_KEY?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

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

    // Parse query parameters
    const url = new URL(request.url);
    const year = parseInt(
      url.searchParams.get('year') || new Date().getFullYear().toString(),
      10
    );
    const week = url.searchParams.get('week')
      ? parseInt(url.searchParams.get('week')!, 10)
      : undefined;
    const conference = url.searchParams.get('conference') || undefined;

    // Initialize adapter
    const adapter = new CFBDAdapter(apiKey, env.CACHE);

    // Fetch scoreboard
    const scoreboard = await adapter.fetchScoreboard(year, week, conference);

    // Categorize games by status
    const liveGames = scoreboard.games.filter(g => getGameState(g) === 'live');
    const completedGames = scoreboard.games.filter(g => g.completed);
    const upcomingGames = scoreboard.games.filter(g => !g.completed && getGameState(g) === 'scheduled');

    const response = {
      season: scoreboard.season,
      week: scoreboard.week,
      seasonType: scoreboard.seasonType,
      totalGames: scoreboard.games.length,
      liveGames: liveGames.length,
      completedGames: completedGames.length,
      upcomingGames: upcomingGames.length,
      games: scoreboard.games.map(game => ({
        id: game.id,
        status: getGameState(game),
        startDate: game.startDate,
        startTimeTBD: game.startTimeTBD,
        completed: game.completed,
        venue: game.venue,
        neutralSite: game.neutralSite,
        conferenceGame: game.conferenceGame,
        homeTeam: {
          id: game.homeId,
          name: game.homeTeam,
          conference: game.homeConference,
          score: game.homePoints,
          lineScores: game.homeLineScores,
        },
        awayTeam: {
          id: game.awayId,
          name: game.awayTeam,
          conference: game.awayConference,
          score: game.awayPoints,
          lineScores: game.awayLineScores,
        },
        excitementIndex: game.excitementIndex,
      })),
      byStatus: {
        live: liveGames.map(g => ({
          id: g.id,
          homeTeam: g.homeTeam,
          homeScore: g.homePoints,
          awayTeam: g.awayTeam,
          awayScore: g.awayPoints,
        })),
        completed: completedGames.map(g => ({
          id: g.id,
          homeTeam: g.homeTeam,
          homeScore: g.homePoints,
          awayTeam: g.awayTeam,
          awayScore: g.awayPoints,
        })),
        upcoming: upcomingGames.map(g => ({
          id: g.id,
          homeTeam: g.homeTeam,
          awayTeam: g.awayTeam,
          startDate: g.startDate,
        })),
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
          blobs: ['college_football_scoreboard', `week_${scoreboard.week}`],
          doubles: [scoreboard.games.length],
          indexes: [`${year}`],
        });
      } catch (error) {
        console.warn('Analytics write failed:', error);
      }
    }

    // Cache based on game status
    const hasLiveGames = liveGames.length > 0;
    const cacheControl = hasLiveGames
      ? 'public, max-age=30, s-maxage=300' // 30s client, 5min CDN for live games
      : 'public, max-age=300, s-maxage=1800'; // 5min client, 30min CDN for completed

    return new Response(JSON.stringify(response, null, 2), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': cacheControl,
      },
    });
  } catch (error) {
    console.error('College football scoreboard error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return new Response(
      JSON.stringify({
        error: 'Failed to fetch scoreboard',
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
