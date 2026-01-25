/**
 * NFL Teams API
 *
 * GET /api/nfl/teams/:teamId - Get team by ID
 * GET /api/nfl/teams?teamId=34 - Get team by query param
 */

import { corsHeaders, generateCorrelationId } from '../../_utils.js';

// ESPN team IDs and metadata
const TEAM_META: Record<
  number,
  { name: string; city: string; abbreviation: string; conference: string; division: string }
> = {
  10: {
    name: 'Tennessee Titans',
    city: 'Tennessee',
    abbreviation: 'TEN',
    conference: 'AFC',
    division: 'AFC South',
  },
  1: {
    name: 'Atlanta Falcons',
    city: 'Atlanta',
    abbreviation: 'ATL',
    conference: 'NFC',
    division: 'NFC South',
  },
  2: {
    name: 'Buffalo Bills',
    city: 'Buffalo',
    abbreviation: 'BUF',
    conference: 'AFC',
    division: 'AFC East',
  },
  3: {
    name: 'Chicago Bears',
    city: 'Chicago',
    abbreviation: 'CHI',
    conference: 'NFC',
    division: 'NFC North',
  },
  4: {
    name: 'Cincinnati Bengals',
    city: 'Cincinnati',
    abbreviation: 'CIN',
    conference: 'AFC',
    division: 'AFC North',
  },
  5: {
    name: 'Cleveland Browns',
    city: 'Cleveland',
    abbreviation: 'CLE',
    conference: 'AFC',
    division: 'AFC North',
  },
  6: {
    name: 'Dallas Cowboys',
    city: 'Dallas',
    abbreviation: 'DAL',
    conference: 'NFC',
    division: 'NFC East',
  },
  7: {
    name: 'Denver Broncos',
    city: 'Denver',
    abbreviation: 'DEN',
    conference: 'AFC',
    division: 'AFC West',
  },
  8: {
    name: 'Detroit Lions',
    city: 'Detroit',
    abbreviation: 'DET',
    conference: 'NFC',
    division: 'NFC North',
  },
  9: {
    name: 'Green Bay Packers',
    city: 'Green Bay',
    abbreviation: 'GB',
    conference: 'NFC',
    division: 'NFC North',
  },
  11: {
    name: 'Indianapolis Colts',
    city: 'Indianapolis',
    abbreviation: 'IND',
    conference: 'AFC',
    division: 'AFC South',
  },
  12: {
    name: 'Kansas City Chiefs',
    city: 'Kansas City',
    abbreviation: 'KC',
    conference: 'AFC',
    division: 'AFC West',
  },
  13: {
    name: 'Las Vegas Raiders',
    city: 'Las Vegas',
    abbreviation: 'LV',
    conference: 'AFC',
    division: 'AFC West',
  },
  14: {
    name: 'Los Angeles Rams',
    city: 'Los Angeles',
    abbreviation: 'LAR',
    conference: 'NFC',
    division: 'NFC West',
  },
  15: {
    name: 'Miami Dolphins',
    city: 'Miami',
    abbreviation: 'MIA',
    conference: 'AFC',
    division: 'AFC East',
  },
  16: {
    name: 'Minnesota Vikings',
    city: 'Minnesota',
    abbreviation: 'MIN',
    conference: 'NFC',
    division: 'NFC North',
  },
  17: {
    name: 'New England Patriots',
    city: 'New England',
    abbreviation: 'NE',
    conference: 'AFC',
    division: 'AFC East',
  },
  18: {
    name: 'New Orleans Saints',
    city: 'New Orleans',
    abbreviation: 'NO',
    conference: 'NFC',
    division: 'NFC South',
  },
  19: {
    name: 'New York Giants',
    city: 'New York',
    abbreviation: 'NYG',
    conference: 'NFC',
    division: 'NFC East',
  },
  20: {
    name: 'New York Jets',
    city: 'New York',
    abbreviation: 'NYJ',
    conference: 'AFC',
    division: 'AFC East',
  },
  21: {
    name: 'Philadelphia Eagles',
    city: 'Philadelphia',
    abbreviation: 'PHI',
    conference: 'NFC',
    division: 'NFC East',
  },
  22: {
    name: 'Arizona Cardinals',
    city: 'Arizona',
    abbreviation: 'ARI',
    conference: 'NFC',
    division: 'NFC West',
  },
  23: {
    name: 'Pittsburgh Steelers',
    city: 'Pittsburgh',
    abbreviation: 'PIT',
    conference: 'AFC',
    division: 'AFC North',
  },
  24: {
    name: 'Los Angeles Chargers',
    city: 'Los Angeles',
    abbreviation: 'LAC',
    conference: 'AFC',
    division: 'AFC West',
  },
  25: {
    name: 'San Francisco 49ers',
    city: 'San Francisco',
    abbreviation: 'SF',
    conference: 'NFC',
    division: 'NFC West',
  },
  26: {
    name: 'Seattle Seahawks',
    city: 'Seattle',
    abbreviation: 'SEA',
    conference: 'NFC',
    division: 'NFC West',
  },
  27: {
    name: 'Tampa Bay Buccaneers',
    city: 'Tampa Bay',
    abbreviation: 'TB',
    conference: 'NFC',
    division: 'NFC South',
  },
  28: {
    name: 'Washington Commanders',
    city: 'Washington',
    abbreviation: 'WAS',
    conference: 'NFC',
    division: 'NFC East',
  },
  29: {
    name: 'Carolina Panthers',
    city: 'Carolina',
    abbreviation: 'CAR',
    conference: 'NFC',
    division: 'NFC South',
  },
  30: {
    name: 'Jacksonville Jaguars',
    city: 'Jacksonville',
    abbreviation: 'JAX',
    conference: 'AFC',
    division: 'AFC South',
  },
  33: {
    name: 'Baltimore Ravens',
    city: 'Baltimore',
    abbreviation: 'BAL',
    conference: 'AFC',
    division: 'AFC North',
  },
  34: {
    name: 'Houston Texans',
    city: 'Houston',
    abbreviation: 'HOU',
    conference: 'AFC',
    division: 'AFC South',
  },
};

interface Env {
  KV?: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async ({ request, params }) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(request.url);

  // Get teamId from path params or query string
  const teamIdParam = params.teamId;
  const teamIdPath = Array.isArray(teamIdParam) ? teamIdParam[0] : teamIdParam;
  const teamIdQuery = url.searchParams.get('teamId');
  const teamIdRaw = teamIdPath || teamIdQuery;

  if (!teamIdRaw) {
    const correlationId = generateCorrelationId();
    return new Response(
      JSON.stringify({
        error: 'Team ID required',
        message: 'Please provide a team ID via path (/api/nfl/teams/34) or query (?teamId=34)',
        correlationId,
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Correlation-ID': correlationId,
        },
      }
    );
  }

  const teamId = parseInt(teamIdRaw);
  if (isNaN(teamId) || !TEAM_META[teamId]) {
    const correlationId = generateCorrelationId();
    return new Response(
      JSON.stringify({
        error: 'Team not found',
        message: `No NFL team found with ID ${teamIdRaw}`,
        correlationId,
      }),
      {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Correlation-ID': correlationId,
        },
      }
    );
  }

  try {
    const teamData = await fetchTeamData(teamId);

    return new Response(JSON.stringify(teamData), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    console.error('NFL Teams Error:', error);
    const correlationId = generateCorrelationId();
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch team data',
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

async function fetchTeamData(teamId: number): Promise<any> {
  const headers = {
    'User-Agent': 'BlazeSportsIntel/1.0 (https://blazesportsintel.com)',
    Accept: 'application/json',
  };

  const meta = TEAM_META[teamId]!;

  // Fetch standings for stats
  const response = await fetch('https://site.api.espn.com/apis/v2/sports/football/nfl/standings', {
    headers,
  });

  if (!response.ok) {
    throw new Error(`ESPN API returned ${response.status}`);
  }

  const data = await response.json();

  // Find team in standings
  let teamStats: any = null;
  for (const conf of data.children || []) {
    for (const div of conf.children || []) {
      for (const entry of div.standings?.entries || []) {
        if (entry.team?.id === teamId || entry.team?.id === String(teamId)) {
          teamStats = entry;
          break;
        }
      }
      if (teamStats) break;
    }
    if (teamStats) break;
  }

  const stats = teamStats?.stats || [];
  const getStatValue = (name: string): number => {
    const stat = stats.find((s: any) => s.name === name || s.abbreviation === name);
    return stat?.value ?? 0;
  };

  const wins = getStatValue('wins');
  const losses = getStatValue('losses');
  const ties = getStatValue('ties');
  const totalGames = wins + losses + ties;
  const winPct = totalGames > 0 ? (wins + ties * 0.5) / totalGames : 0;
  const pointsFor = getStatValue('pointsFor');
  const pointsAgainst = getStatValue('pointsAgainst');

  const lastUpdated = new Date().toISOString();

  return {
    team: {
      id: teamId,
      name: meta.name,
      abbreviation: meta.abbreviation,
      city: meta.city,
      division: meta.division,
      conference: meta.conference,
      wins,
      losses,
      ties,
      winPct: Math.round(winPct * 1000) / 1000,
      pointsFor,
      pointsAgainst,
      pointDifferential: pointsFor - pointsAgainst,
      lastUpdated,
    },
    lastUpdated,
    dataSource: 'ESPN API',
  };
}
