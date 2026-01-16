/**
 * MLB Teams API Endpoint
 *
 * GET /api/mlb/teams/:teamId
 *   - Fetches comprehensive team data including roster, stats, schedule, and standings
 *   - Returns team info, 40-man roster, team statistics, and division standings
 *
 * Query Parameters:
 *   - season: number (default: current year)
 *   - include: comma-separated list of data to include
 *     - 'roster' (default: true)
 *     - 'stats' (default: true)
 *     - 'schedule' (default: false - heavy payload)
 *     - 'standings' (default: true)
 *     - 'live' (default: false - today's games only)
 *   - rosterType: '40Man' | 'active' | 'fullSeason' (default: '40Man')
 *   - scheduleStart: YYYY-MM-DD (optional)
 *   - scheduleEnd: YYYY-MM-DD (optional)
 *
 * Examples:
 *   /api/mlb/teams/138?season=2025
 *   /api/mlb/teams/138?include=roster,stats,standings
 *   /api/mlb/teams/138?include=schedule&scheduleStart=2025-04-01&scheduleEnd=2025-04-30
 *   /api/mlb/teams/138?include=live (today's games only)
 */

import { MLBTeamsAdapter } from '../../../../lib/adapters/mlb-teams-adapter';
import { getTeamIdFromSlug } from '../../../../lib/utils/mlb-teams';

interface Env {
  CACHE: KVNamespace;
  ANALYTICS?: AnalyticsEngineDataset;
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
    // Extract team ID from URL params
    const teamIdParam = params.teamId as string | string[];
    const teamId = Array.isArray(teamIdParam) ? teamIdParam[0] : teamIdParam;

    // Handle special routes
    if (teamId === 'all') {
      return handleAllTeams(env, request, corsHeaders);
    }

    if (!teamId || teamId === 'undefined') {
      return new Response(
        JSON.stringify({
          error: 'Team ID is required',
          message: 'Please provide a valid MLB team ID (e.g., 138 or "stl" for Cardinals)',
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

    // Support both numeric IDs (138) and slug abbreviations (stl)
    let teamIdNum = parseInt(teamId, 10);
    if (isNaN(teamIdNum)) {
      // Try to resolve slug to numeric ID
      const resolvedId = getTeamIdFromSlug(teamId);
      if (!resolvedId) {
        return new Response(
          JSON.stringify({
            error: 'Invalid team ID',
            message: `Team "${teamId}" not found. Use MLB numeric ID or team abbreviation (e.g., "stl" for Cardinals).`,
            hint: 'Valid slugs: bal, bos, nyy, tb, tor, cws, cle, det, kc, min, hou, laa, oak, sea, tex, atl, mia, nym, phi, wsh, chc, cin, mil, pit, stl, ari, col, lad, sd, sf',
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
      teamIdNum = resolvedId;
    }

    // Parse query parameters
    const url = new URL(request.url);
    const season = parseInt(
      url.searchParams.get('season') || new Date().getFullYear().toString(),
      10
    );

    // Parse include parameter
    const includeParam = url.searchParams.get('include') || 'roster,stats,standings';
    const include = new Set(includeParam.split(',').map((s) => s.trim()));

    const rosterType = url.searchParams.get('rosterType') || '40Man';
    const scheduleStart = url.searchParams.get('scheduleStart');
    const scheduleEnd = url.searchParams.get('scheduleEnd');

    // Initialize adapter
    const adapter = new MLBTeamsAdapter(env.CACHE);

    // Build response object
    const response: Record<string, any> = {
      team: null,
      meta: {
        dataSource: 'MLB Stats API (statsapi.mlb.com)',
        lastUpdated: new Date().toISOString(),
        timezone: 'America/Chicago',
        season,
      },
    };

    // Fetch data in parallel based on includes
    const promises: Promise<any>[] = [];

    // Always fetch team info first
    promises.push(adapter.fetchTeamInfo(teamIdNum, season));

    // Roster
    if (include.has('roster')) {
      promises.push(adapter.fetchRoster(teamIdNum, season, rosterType));
    } else {
      promises.push(Promise.resolve(null));
    }

    // Stats
    if (include.has('stats')) {
      promises.push(adapter.fetchTeamStats(teamIdNum, season));
    } else {
      promises.push(Promise.resolve(null));
    }

    // Schedule
    if (include.has('schedule')) {
      promises.push(
        adapter.fetchSchedule(
          teamIdNum,
          season,
          scheduleStart || undefined,
          scheduleEnd || undefined
        )
      );
    } else {
      promises.push(Promise.resolve(null));
    }

    // Standings
    if (include.has('standings')) {
      promises.push(adapter.fetchStandings(teamIdNum, season));
    } else {
      promises.push(Promise.resolve(null));
    }

    // Live games
    if (include.has('live')) {
      promises.push(adapter.fetchLiveGames(teamIdNum));
    } else {
      promises.push(Promise.resolve(null));
    }

    const [teamInfo, roster, stats, schedule, standings, liveGames] = await Promise.all(promises);

    response.team = teamInfo;
    if (roster) response.roster = roster;
    if (stats) response.stats = stats;
    if (schedule) response.schedule = schedule;
    if (standings) response.standings = standings;
    if (liveGames) response.liveGames = liveGames;

    // Add quick access helpers
    if (standings) {
      const teamRecord = standings.teamRecords.find((tr: any) => tr.team.id === teamIdNum);
      if (teamRecord) {
        response.quickStats = {
          record: `${teamRecord.wins}-${teamRecord.losses}`,
          winPct: teamRecord.winningPercentage,
          gamesBack: teamRecord.divisionGamesBack,
          streak: teamRecord.streak.streakCode,
          divisionRank: teamRecord.divisionRank,
          leagueRank: teamRecord.leagueRank,
          runDifferential: teamRecord.runsScored - teamRecord.runsAllowed,
        };
      }
    }

    // Track analytics
    if (env.ANALYTICS) {
      try {
        env.ANALYTICS.writeDataPoint({
          blobs: ['mlb_team', `team_${teamIdNum}`, includeParam],
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
    console.error('MLB team error:', error);

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
 * Handle /api/mlb/teams/all request
 */
async function handleAllTeams(
  env: Env,
  request: Request,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const url = new URL(request.url);
  const season = parseInt(
    url.searchParams.get('season') || new Date().getFullYear().toString(),
    10
  );

  const adapter = new MLBTeamsAdapter(env.CACHE);
  const teams = await adapter.fetchAllTeams(season);

  // Group by division
  const byDivision: Record<string, any[]> = {};

  teams.forEach((team) => {
    const divisionKey = `${team.league.name}_${team.division.name}`;
    if (!byDivision[divisionKey]) {
      byDivision[divisionKey] = [];
    }
    byDivision[divisionKey].push({
      id: team.id,
      name: team.name,
      abbreviation: team.abbreviation,
      league: team.league.name,
      division: team.division.name,
    });
  });

  const response = {
    season,
    totalTeams: teams.length,
    byDivision,
    teams: teams.map((t) => ({
      id: t.id,
      name: t.name,
      abbreviation: t.abbreviation,
      league: t.league.name,
      division: t.division.name,
    })),
    meta: {
      dataSource: 'MLB Stats API',
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
