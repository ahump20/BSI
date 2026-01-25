/**
 * NFL Standings API - ESPN Data
 * Comprehensive NFL standings with division/conference breakdowns
 *
 * GET /api/nfl/standings
 * GET /api/nfl/standings?conference=AFC
 * GET /api/nfl/standings?division=AFC%20South
 * GET /api/nfl/standings?season=2025
 */

import { corsHeaders, generateCorrelationId, badRequest } from '../_utils.js';

// Valid NFL conferences and divisions
const VALID_CONFERENCES = ['AFC', 'NFC'];
const VALID_DIVISIONS = [
  'AFC East',
  'AFC North',
  'AFC South',
  'AFC West',
  'NFC East',
  'NFC North',
  'NFC South',
  'NFC West',
];

// ESPN team ID to division mapping
const TEAM_DIVISION: Record<
  number,
  { abbreviation: string; division: string; conference: string }
> = {
  // AFC East
  2: { abbreviation: 'BUF', division: 'AFC East', conference: 'AFC' },
  15: { abbreviation: 'MIA', division: 'AFC East', conference: 'AFC' },
  17: { abbreviation: 'NE', division: 'AFC East', conference: 'AFC' },
  20: { abbreviation: 'NYJ', division: 'AFC East', conference: 'AFC' },
  // AFC North
  33: { abbreviation: 'BAL', division: 'AFC North', conference: 'AFC' },
  4: { abbreviation: 'CIN', division: 'AFC North', conference: 'AFC' },
  5: { abbreviation: 'CLE', division: 'AFC North', conference: 'AFC' },
  23: { abbreviation: 'PIT', division: 'AFC North', conference: 'AFC' },
  // AFC South
  34: { abbreviation: 'HOU', division: 'AFC South', conference: 'AFC' },
  11: { abbreviation: 'IND', division: 'AFC South', conference: 'AFC' },
  30: { abbreviation: 'JAX', division: 'AFC South', conference: 'AFC' },
  10: { abbreviation: 'TEN', division: 'AFC South', conference: 'AFC' },
  // AFC West
  7: { abbreviation: 'DEN', division: 'AFC West', conference: 'AFC' },
  12: { abbreviation: 'KC', division: 'AFC West', conference: 'AFC' },
  13: { abbreviation: 'LV', division: 'AFC West', conference: 'AFC' },
  24: { abbreviation: 'LAC', division: 'AFC West', conference: 'AFC' },
  // NFC East
  6: { abbreviation: 'DAL', division: 'NFC East', conference: 'NFC' },
  19: { abbreviation: 'NYG', division: 'NFC East', conference: 'NFC' },
  21: { abbreviation: 'PHI', division: 'NFC East', conference: 'NFC' },
  28: { abbreviation: 'WAS', division: 'NFC East', conference: 'NFC' },
  // NFC North
  3: { abbreviation: 'CHI', division: 'NFC North', conference: 'NFC' },
  8: { abbreviation: 'DET', division: 'NFC North', conference: 'NFC' },
  9: { abbreviation: 'GB', division: 'NFC North', conference: 'NFC' },
  16: { abbreviation: 'MIN', division: 'NFC North', conference: 'NFC' },
  // NFC South
  1: { abbreviation: 'ATL', division: 'NFC South', conference: 'NFC' },
  29: { abbreviation: 'CAR', division: 'NFC South', conference: 'NFC' },
  18: { abbreviation: 'NO', division: 'NFC South', conference: 'NFC' },
  27: { abbreviation: 'TB', division: 'NFC South', conference: 'NFC' },
  // NFC West
  22: { abbreviation: 'ARI', division: 'NFC West', conference: 'NFC' },
  14: { abbreviation: 'LAR', division: 'NFC West', conference: 'NFC' },
  25: { abbreviation: 'SF', division: 'NFC West', conference: 'NFC' },
  26: { abbreviation: 'SEA', division: 'NFC West', conference: 'NFC' },
};

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
  // If we're in Jan-Aug, the current NFL season is the previous year
  return month < 8 ? year - 1 : year;
}

export const onRequest: PagesFunction<Env> = async ({ request }) => {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  const url = new URL(request.url);
  const conference = url.searchParams.get('conference');
  const division = url.searchParams.get('division');
  const season = url.searchParams.get('season')
    ? parseInt(url.searchParams.get('season')!)
    : getCurrentNFLSeason();

  // Validate conference
  if (conference && !VALID_CONFERENCES.includes(conference)) {
    return badRequest(
      `Invalid conference: "${conference}". Valid conferences are: ${VALID_CONFERENCES.join(', ')}`
    );
  }

  // Validate division
  if (division && !VALID_DIVISIONS.includes(division)) {
    return badRequest(
      `Invalid division: "${division}". Valid divisions are: ${VALID_DIVISIONS.join(', ')}`
    );
  }

  try {
    const standings = await fetchESPNStandings(season, conference, division);

    return new Response(
      JSON.stringify({
        season,
        standings,
        meta: {
          dataSource: 'ESPN API',
          lastUpdated: new Date().toISOString(),
          timezone: 'America/Chicago',
        },
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300',
        },
      }
    );
  } catch (error) {
    console.error('NFL Standings Error:', error);
    const correlationId = generateCorrelationId();
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch NFL standings',
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

interface TeamStanding {
  id: number;
  name: string;
  abbreviation: string;
  city: string;
  division: string;
  conference: string;
  wins: number;
  losses: number;
  ties: number;
  winPct: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDifferential: number;
  lastUpdated: string;
}

interface DivisionStanding {
  conference: string;
  division: string;
  teams: TeamStanding[];
  lastUpdated: string;
  dataSource: string;
}

async function fetchESPNStandings(
  season: number,
  filterConference: string | null,
  filterDivision: string | null
): Promise<DivisionStanding[]> {
  const headers = {
    'User-Agent': 'BlazeSportsIntel/1.0 (https://blazesportsintel.com)',
    Accept: 'application/json',
  };

  // Fetch standings from ESPN API
  const response = await fetch(
    `https://site.api.espn.com/apis/v2/sports/football/nfl/standings?season=${season}`,
    { headers }
  );

  if (!response.ok) {
    throw new Error(`ESPN API returned ${response.status}`);
  }

  const data = await response.json();

  // Collect all teams from both conferences
  const allTeams: TeamStanding[] = [];

  // ESPN structure: children (AFC/NFC conferences) -> standings.entries (teams)
  for (const conf of data.children || []) {
    const entries = conf.standings?.entries || [];

    for (const entry of entries) {
      const team = entry.team;
      const teamId = parseInt(team?.id) || 0;
      const teamMeta = TEAM_DIVISION[teamId];

      if (!teamMeta) {
        continue; // Skip unknown teams
      }

      const stats = entry.stats || [];
      const getStatValue = (name: string): number => {
        const stat = stats.find(
          (s: { name: string; abbreviation?: string; value?: number }) =>
            s.name === name || s.abbreviation === name
        );
        return stat?.value ?? 0;
      };

      const wins = getStatValue('wins');
      const losses = getStatValue('losses');
      const ties = getStatValue('ties');
      const totalGames = wins + losses + ties;
      const winPct = totalGames > 0 ? (wins + ties * 0.5) / totalGames : 0;
      const pointsFor = getStatValue('pointsFor');
      const pointsAgainst = getStatValue('pointsAgainst');

      allTeams.push({
        id: teamId,
        name: team?.displayName || team?.name || 'Unknown',
        abbreviation: teamMeta.abbreviation,
        city: team?.location || '',
        division: teamMeta.division,
        conference: teamMeta.conference,
        wins,
        losses,
        ties,
        winPct: Math.round(winPct * 1000) / 1000,
        pointsFor,
        pointsAgainst,
        pointDifferential: pointsFor - pointsAgainst,
        lastUpdated: new Date().toISOString(),
      });
    }
  }

  // Group teams by division
  const divisionMap = new Map<string, TeamStanding[]>();

  for (const team of allTeams) {
    // Apply filters
    if (filterConference && team.conference !== filterConference) {
      continue;
    }
    if (filterDivision && team.division !== filterDivision) {
      continue;
    }

    const existing = divisionMap.get(team.division) || [];
    existing.push(team);
    divisionMap.set(team.division, existing);
  }

  // Convert to array and sort teams within each division
  const divisionStandings: DivisionStanding[] = [];

  for (const [divisionName, teams] of divisionMap) {
    // Sort by win percentage descending
    teams.sort((a, b) => b.winPct - a.winPct);

    divisionStandings.push({
      conference: teams[0]?.conference || divisionName.split(' ')[0],
      division: divisionName,
      teams,
      lastUpdated: new Date().toISOString(),
      dataSource: 'ESPN API',
    });
  }

  // Sort divisions: AFC first, then by division order (East, North, South, West)
  const divOrder = ['East', 'North', 'South', 'West'];
  return divisionStandings.sort((a, b) => {
    if (a.conference !== b.conference) {
      return a.conference === 'AFC' ? -1 : 1;
    }
    const aDivPart = a.division.split(' ').pop() || '';
    const bDivPart = b.division.split(' ').pop() || '';
    return divOrder.indexOf(aDivPart) - divOrder.indexOf(bDivPart);
  });
}
