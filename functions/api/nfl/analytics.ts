/**
 * NFL Analytics API
 *
 * GET /api/nfl/analytics?teamId=34
 * Returns advanced analytics for a team
 */

import { corsHeaders, generateCorrelationId, badRequest } from '../_utils.js';

// ESPN team IDs
const VALID_TEAM_IDS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27,
  28, 29, 30, 33, 34,
];

interface Env {
  KV?: KVNamespace;
}

/**
 * Get the current NFL season year.
 * NFL season starts in September and ends in February.
 * So in Jan-Aug, we use previous year's season.
 */
function getCurrentNFLSeason(): number {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const year = now.getFullYear();
  return month < 8 ? year - 1 : year;
}

export const onRequest: PagesFunction<Env> = async ({ request }) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(request.url);
  const teamIdParam = url.searchParams.get('teamId');

  if (!teamIdParam) {
    return badRequest('teamId parameter is required');
  }

  const teamId = parseInt(teamIdParam);
  if (isNaN(teamId) || !VALID_TEAM_IDS.includes(teamId)) {
    return badRequest(`Invalid teamId: ${teamIdParam}. Must be a valid ESPN team ID.`);
  }

  try {
    const analytics = await fetchTeamAnalytics(teamId);

    return new Response(JSON.stringify(analytics), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    console.error('NFL Analytics Error:', error);
    const correlationId = generateCorrelationId();
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch NFL analytics',
        message: error instanceof Error ? error.message : 'Unknown error',
        correlationId,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Correlation-ID': correlationId,
        },
      }
    );
  }
};

async function fetchTeamAnalytics(teamId: number): Promise<{
  teamId: number;
  pythagWins: number | undefined;
  pointsFor: number;
  pointsAgainst: number;
  pointDifferential: number;
  gamesPlayed: number;
  strengthOfSchedule: number;
  epa: undefined;
  dvoa: undefined;
  successRate: undefined;
  meta: {
    dataSource: string;
    lastUpdated: string;
    note: string;
  };
}> {
  const headers = {
    'User-Agent': 'BlazeSportsIntel/1.0 (https://blazesportsintel.com)',
    Accept: 'application/json',
  };

  const season = getCurrentNFLSeason();

  // Fetch standings to get team stats
  const response = await fetch(
    `https://site.api.espn.com/apis/v2/sports/football/nfl/standings?season=${season}`,
    { headers }
  );

  if (!response.ok) {
    throw new Error(`ESPN API returned ${response.status}`);
  }

  const data = await response.json();

  // Find team in standings - ESPN structure: children (conferences) -> standings.entries (teams)
  let teamStats: { stats: { name: string; abbreviation?: string; value?: number }[] } | null = null;

  for (const conf of data.children || []) {
    const entries = conf.standings?.entries || [];
    for (const entry of entries) {
      const entryTeamId = parseInt(entry.team?.id) || 0;
      if (entryTeamId === teamId) {
        teamStats = entry;
        break;
      }
    }
    if (teamStats) break;
  }

  const stats = teamStats?.stats || [];
  const getStatValue = (name: string): number => {
    const stat = stats.find((s) => s.name === name || s.abbreviation === name);
    return stat?.value ?? 0;
  };

  const wins = getStatValue('wins');
  const losses = getStatValue('losses');
  const ties = getStatValue('ties');
  const pointsFor = getStatValue('pointsFor');
  const pointsAgainst = getStatValue('pointsAgainst');
  const totalGames = wins + losses + ties;

  // Calculate Pythagorean wins (NFL uses exponent of 2.37)
  let pythagWins: number | undefined;
  if (pointsFor > 0 && pointsAgainst > 0 && totalGames > 0) {
    const exponent = 2.37;
    const pythagWinPct =
      Math.pow(pointsFor, exponent) /
      (Math.pow(pointsFor, exponent) + Math.pow(pointsAgainst, exponent));
    pythagWins = Math.round(pythagWinPct * 17 * 10) / 10; // Project to 17-game season
  }

  // Calculate simple strength of schedule (point differential of opponents would be better)
  // For now, use a placeholder based on division standing
  const strengthOfSchedule = 0; // Would require more data to calculate

  return {
    teamId,
    pythagWins,
    pointsFor,
    pointsAgainst,
    pointDifferential: pointsFor - pointsAgainst,
    gamesPlayed: totalGames,
    strengthOfSchedule,
    // EPA and DVOA would require play-by-play data
    epa: undefined,
    dvoa: undefined,
    successRate: undefined,
    meta: {
      dataSource: 'ESPN API',
      lastUpdated: new Date().toISOString(),
      note: 'EPA, DVOA, and success rate require play-by-play data not available from ESPN public API',
    },
  };
}
