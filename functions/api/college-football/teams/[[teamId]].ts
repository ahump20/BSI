/**
 * College Football Teams API Endpoint
 *
 * GET /api/college-football/teams/:teamId
 *   - Fetches comprehensive team data including roster, stats, and schedule
 *   - Returns team info, roster, season statistics, and game schedule
 *
 * GET /api/college-football/teams/all
 *   - Returns all FBS teams with conference groupings
 *
 * Query Parameters:
 *   - season: number (default: current year)
 *   - include: comma-separated list of data to include
 *     - 'roster' (default: true)
 *     - 'stats' (default: true)
 *     - 'games' (default: false - heavy payload)
 *     - 'rankings' (default: false)
 *   - conference: filter by conference (e.g., "SEC", "Big Ten")
 *
 * Examples:
 *   /api/college-football/teams/251?season=2025
 *   /api/college-football/teams/251?include=roster,stats,games
 *   /api/college-football/teams/all?conference=SEC
 */

import { CFBDAdapter } from '../../../../lib/adapters/cfbd-adapter';

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
    const apiKey =
      env.CFBD_API_KEY || 'fGJioao24tAaWLyWOh5MmLHl8DwJsKLfv5Lg73mbZsNQogP9XeOXi3l/1o28soOi';
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

    // Extract team ID from URL params
    const teamIdParam = params.teamId as string | string[];
    const teamId = Array.isArray(teamIdParam) ? teamIdParam[0] : teamIdParam;

    // Handle special routes
    if (teamId === 'all') {
      return handleAllTeams(env, request, corsHeaders, apiKey);
    }

    if (!teamId || teamId === 'undefined') {
      return new Response(
        JSON.stringify({
          error: 'Team ID is required',
          message: 'Please provide a valid team ID (e.g., 251 for Texas)',
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

    const teamIdNum = parseInt(teamId, 10);
    if (isNaN(teamIdNum)) {
      return new Response(
        JSON.stringify({
          error: 'Invalid team ID',
          message: 'Team ID must be a number',
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

    // Parse query parameters
    const url = new URL(request.url);
    const season = parseInt(
      url.searchParams.get('season') || new Date().getFullYear().toString(),
      10
    );

    // Parse include parameter
    const includeParam = url.searchParams.get('include') || 'roster,stats';
    const include = new Set(includeParam.split(',').map((s) => s.trim()));

    // Initialize adapter
    const adapter = new CFBDAdapter(apiKey, env.CACHE);

    // Build response object
    const response: Record<string, any> = {
      team: null,
      meta: {
        dataSource: 'College Football Data API (api.collegefootballdata.com)',
        lastUpdated: new Date().toISOString(),
        timezone: 'America/Chicago',
        season,
      },
    };

    // Fetch team info
    const team = await adapter.fetchTeamById(teamIdNum);
    if (!team) {
      return new Response(
        JSON.stringify({
          error: 'Team not found',
          message: `No team found with ID ${teamIdNum}`,
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

    response.team = team;

    // Fetch data in parallel based on includes
    const promises: Promise<any>[] = [];

    // Roster
    if (include.has('roster')) {
      promises.push(
        adapter.fetchRoster(team.school, season).catch((err) => {
          console.error('Roster fetch error:', err);
          return null;
        })
      );
    } else {
      promises.push(Promise.resolve(null));
    }

    // Stats
    if (include.has('stats')) {
      promises.push(
        adapter
          .fetchTeamStats(season, team.school)
          .then((stats) => stats[0] || null)
          .catch((err) => {
            console.error('Stats fetch error:', err);
            return null;
          })
      );
    } else {
      promises.push(Promise.resolve(null));
    }

    // Games
    if (include.has('games')) {
      promises.push(
        adapter.fetchGames(season, 1, 'regular', undefined, team.school).catch((err) => {
          console.error('Games fetch error:', err);
          return null;
        })
      );
    } else {
      promises.push(Promise.resolve(null));
    }

    // Rankings
    if (include.has('rankings')) {
      promises.push(
        adapter.fetchAPTop25(season).catch((err) => {
          console.error('Rankings fetch error:', err);
          return null;
        })
      );
    } else {
      promises.push(Promise.resolve(null));
    }

    const [roster, stats, games, rankings] = await Promise.all(promises);

    if (roster) response.roster = roster;
    if (stats) response.stats = stats;
    if (games) response.games = games;
    if (rankings) response.rankings = rankings;

    // Track analytics
    if (env.ANALYTICS) {
      try {
        env.ANALYTICS.writeDataPoint({
          blobs: ['college_football_team', `team_${teamIdNum}`, includeParam],
          doubles: [1],
          indexes: [`${season}`],
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
        'Cache-Control': 'public, max-age=300, s-maxage=1800', // 5min client, 30min CDN
      },
    });
  } catch (error) {
    console.error('College football team error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return new Response(
      JSON.stringify({
        error: 'Failed to fetch team data',
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
 * Handle /api/college-football/teams/all request
 */
async function handleAllTeams(
  env: Env,
  request: Request,
  corsHeaders: Record<string, string>,
  apiKey: string
): Promise<Response> {
  const url = new URL(request.url);
  const conference = url.searchParams.get('conference') || undefined;

  const adapter = new CFBDAdapter(apiKey, env.CACHE);
  const teams = await adapter.fetchTeams(conference);

  // Group by conference
  const byConference: Record<string, any[]> = {};

  teams.forEach((team) => {
    const conf = team.conference || 'Independent';
    if (!byConference[conf]) {
      byConference[conf] = [];
    }
    byConference[conf].push({
      id: team.id,
      school: team.school,
      mascot: team.mascot,
      abbreviation: team.abbreviation,
      classification: team.classification,
      conference: team.conference,
      division: team.division,
      color: team.color,
      logos: team.logos,
    });
  });

  const response = {
    totalTeams: teams.length,
    byConference,
    teams: teams.map((t) => ({
      id: t.id,
      school: t.school,
      mascot: t.mascot,
      abbreviation: t.abbreviation,
      classification: t.classification,
      conference: t.conference,
      division: t.division,
    })),
    meta: {
      dataSource: 'College Football Data API',
      lastUpdated: new Date().toISOString(),
      timezone: 'America/Chicago',
    },
  };

  return new Response(JSON.stringify(response, null, 2), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400', // 24 hours
    },
  });
}
