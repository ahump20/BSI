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

// ESPN team ID to abbreviation mapping
const TEAM_ABBR_MAP: Record<number, string> = {
  1: 'ATL',
  2: 'BUF',
  3: 'CHI',
  4: 'CIN',
  5: 'CLE',
  6: 'DAL',
  7: 'DEN',
  8: 'DET',
  9: 'GB',
  10: 'TEN',
  11: 'IND',
  12: 'KC',
  13: 'LV',
  14: 'LAR',
  15: 'MIA',
  16: 'MIN',
  17: 'NE',
  18: 'NO',
  19: 'NYG',
  20: 'NYJ',
  21: 'PHI',
  22: 'ARI',
  23: 'PIT',
  24: 'LAC',
  25: 'SF',
  26: 'SEA',
  27: 'TB',
  28: 'WAS',
  29: 'CAR',
  30: 'JAX',
  33: 'BAL',
  34: 'HOU',
};

// Division ID mapping from ESPN API
const DIVISION_MAP: Record<string, { conference: string; division: string }> = {
  '1': { conference: 'AFC', division: 'AFC East' },
  '2': { conference: 'AFC', division: 'AFC North' },
  '3': { conference: 'AFC', division: 'AFC South' },
  '4': { conference: 'AFC', division: 'AFC West' },
  '5': { conference: 'NFC', division: 'NFC East' },
  '6': { conference: 'NFC', division: 'NFC North' },
  '7': { conference: 'NFC', division: 'NFC South' },
  '8': { conference: 'NFC', division: 'NFC West' },
};

interface Env {
  KV?: KVNamespace;
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
    : new Date().getFullYear();

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

async function fetchESPNStandings(
  season: number,
  filterConference: string | null,
  filterDivision: string | null
): Promise<any[]> {
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
  const divisionStandings: any[] = [];

  // ESPN structure: children (conferences) -> standings.entries (divisions)
  for (const conf of data.children || []) {
    const confName = conf.abbreviation; // 'AFC' or 'NFC'

    // Filter by conference if specified
    if (filterConference && confName !== filterConference) {
      continue;
    }

    for (const divisionData of conf.standings?.entries || []) {
      // Get division info from the first team's group
      const firstTeam = divisionData;
      const divId = firstTeam?.group?.id;
      const divInfo = DIVISION_MAP[divId] || {
        conference: confName,
        division: `${confName} Unknown`,
      };

      // Filter by division if specified
      if (filterDivision && divInfo.division !== filterDivision) {
        continue;
      }

      // This is actually a team entry, not a division - ESPN nests differently
      // Let me re-examine the structure
    }
  }

  // Actually, ESPN API has a different structure - let me process it correctly
  // conferences -> standings -> entries (teams grouped by division)
  for (const conf of data.children || []) {
    const confAbbr = conf.abbreviation; // 'AFC' or 'NFC'

    if (filterConference && confAbbr !== filterConference) {
      continue;
    }

    // Each conference has standings with entries grouped by division
    for (const divGroup of conf.children || []) {
      const divName = divGroup.name; // e.g., "AFC East"
      const fullDivisionName = `${confAbbr} ${divName?.split(' ').pop() || 'Unknown'}`;

      if (filterDivision && fullDivisionName !== filterDivision) {
        continue;
      }

      const teams = (divGroup.standings?.entries || []).map((entry: any) => {
        const team = entry.team;
        const stats = entry.stats || [];

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

        return {
          id: team?.id || 0,
          name: team?.displayName || team?.name || 'Unknown',
          abbreviation: TEAM_ABBR_MAP[team?.id] || team?.abbreviation || 'UNK',
          city: team?.location || team?.displayName?.split(' ').slice(0, -1).join(' ') || '',
          division: fullDivisionName,
          conference: confAbbr,
          wins,
          losses,
          ties,
          winPct: Math.round(winPct * 1000) / 1000,
          pointsFor,
          pointsAgainst,
          pointDifferential: pointsFor - pointsAgainst,
          lastUpdated: new Date().toISOString(),
        };
      });

      // Sort by win percentage descending
      teams.sort((a: any, b: any) => b.winPct - a.winPct);

      divisionStandings.push({
        conference: confAbbr,
        division: fullDivisionName,
        teams,
        lastUpdated: new Date().toISOString(),
        dataSource: 'ESPN API',
      });
    }
  }

  // Sort: AFC first, then by division order (East, North, South, West)
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
