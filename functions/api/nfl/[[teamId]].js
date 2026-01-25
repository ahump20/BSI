/**
 * NFL Team Data API
 * Dynamic route: /api/nfl/:teamId (slug or ESPN ID)
 *
 * GET /api/nfl/titans
 * GET /api/nfl/10
 */

import { rateLimit, rateLimitError, corsHeaders, generateCorrelationId } from '../_utils.js';

// Team slug to ESPN ID mapping
const TEAM_SLUGS = {
  cardinals: 22,
  ari: 22,
  falcons: 1,
  atl: 1,
  ravens: 33,
  bal: 33,
  bills: 2,
  buf: 2,
  panthers: 29,
  car: 29,
  bears: 3,
  chi: 3,
  bengals: 4,
  cin: 4,
  browns: 5,
  cle: 5,
  cowboys: 6,
  dal: 6,
  broncos: 7,
  den: 7,
  lions: 8,
  det: 8,
  packers: 9,
  gb: 9,
  texans: 34,
  hou: 34,
  colts: 11,
  ind: 11,
  jaguars: 30,
  jax: 30,
  chiefs: 12,
  kc: 12,
  raiders: 13,
  lv: 13,
  chargers: 24,
  lac: 24,
  rams: 14,
  lar: 14,
  dolphins: 15,
  mia: 15,
  vikings: 16,
  min: 16,
  patriots: 17,
  ne: 17,
  saints: 18,
  no: 18,
  giants: 19,
  nyg: 19,
  jets: 20,
  nyj: 20,
  eagles: 21,
  phi: 21,
  steelers: 23,
  pit: 23,
  '49ers': 25,
  niners: 25,
  sf: 25,
  seahawks: 26,
  sea: 26,
  buccaneers: 27,
  bucs: 27,
  tb: 27,
  titans: 10,
  ten: 10,
  commanders: 28,
  wsh: 28,
};

// ESPN ID to abbreviation
const TEAM_ABBR = {
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

// Team metadata
const TEAM_META = {
  10: { name: 'Tennessee Titans', city: 'Tennessee', conference: 'AFC', division: 'AFC South' },
  1: { name: 'Atlanta Falcons', city: 'Atlanta', conference: 'NFC', division: 'NFC South' },
  2: { name: 'Buffalo Bills', city: 'Buffalo', conference: 'AFC', division: 'AFC East' },
  3: { name: 'Chicago Bears', city: 'Chicago', conference: 'NFC', division: 'NFC North' },
  4: { name: 'Cincinnati Bengals', city: 'Cincinnati', conference: 'AFC', division: 'AFC North' },
  5: { name: 'Cleveland Browns', city: 'Cleveland', conference: 'AFC', division: 'AFC North' },
  6: { name: 'Dallas Cowboys', city: 'Dallas', conference: 'NFC', division: 'NFC East' },
  7: { name: 'Denver Broncos', city: 'Denver', conference: 'AFC', division: 'AFC West' },
  8: { name: 'Detroit Lions', city: 'Detroit', conference: 'NFC', division: 'NFC North' },
  9: { name: 'Green Bay Packers', city: 'Green Bay', conference: 'NFC', division: 'NFC North' },
  11: {
    name: 'Indianapolis Colts',
    city: 'Indianapolis',
    conference: 'AFC',
    division: 'AFC South',
  },
  12: { name: 'Kansas City Chiefs', city: 'Kansas City', conference: 'AFC', division: 'AFC West' },
  13: { name: 'Las Vegas Raiders', city: 'Las Vegas', conference: 'AFC', division: 'AFC West' },
  14: { name: 'Los Angeles Rams', city: 'Los Angeles', conference: 'NFC', division: 'NFC West' },
  15: { name: 'Miami Dolphins', city: 'Miami', conference: 'AFC', division: 'AFC East' },
  16: { name: 'Minnesota Vikings', city: 'Minnesota', conference: 'NFC', division: 'NFC North' },
  17: {
    name: 'New England Patriots',
    city: 'New England',
    conference: 'AFC',
    division: 'AFC East',
  },
  18: { name: 'New Orleans Saints', city: 'New Orleans', conference: 'NFC', division: 'NFC South' },
  19: { name: 'New York Giants', city: 'New York', conference: 'NFC', division: 'NFC East' },
  20: { name: 'New York Jets', city: 'New York', conference: 'AFC', division: 'AFC East' },
  21: {
    name: 'Philadelphia Eagles',
    city: 'Philadelphia',
    conference: 'NFC',
    division: 'NFC East',
  },
  22: { name: 'Arizona Cardinals', city: 'Arizona', conference: 'NFC', division: 'NFC West' },
  23: { name: 'Pittsburgh Steelers', city: 'Pittsburgh', conference: 'AFC', division: 'AFC North' },
  24: {
    name: 'Los Angeles Chargers',
    city: 'Los Angeles',
    conference: 'AFC',
    division: 'AFC West',
  },
  25: {
    name: 'San Francisco 49ers',
    city: 'San Francisco',
    conference: 'NFC',
    division: 'NFC West',
  },
  26: { name: 'Seattle Seahawks', city: 'Seattle', conference: 'NFC', division: 'NFC West' },
  27: { name: 'Tampa Bay Buccaneers', city: 'Tampa Bay', conference: 'NFC', division: 'NFC South' },
  28: {
    name: 'Washington Commanders',
    city: 'Washington',
    conference: 'NFC',
    division: 'NFC East',
  },
  29: { name: 'Carolina Panthers', city: 'Carolina', conference: 'NFC', division: 'NFC South' },
  30: {
    name: 'Jacksonville Jaguars',
    city: 'Jacksonville',
    conference: 'AFC',
    division: 'AFC South',
  },
  33: { name: 'Baltimore Ravens', city: 'Baltimore', conference: 'AFC', division: 'AFC North' },
  34: { name: 'Houston Texans', city: 'Houston', conference: 'AFC', division: 'AFC South' },
};

export async function onRequest({ request, params, env }) {
  const teamIdParam = params.teamId;
  const teamIdRaw = Array.isArray(teamIdParam) ? teamIdParam[0] : teamIdParam;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Resolve slug to ESPN ID
  let teamId = teamIdRaw?.toLowerCase();
  if (TEAM_SLUGS[teamId]) {
    teamId = TEAM_SLUGS[teamId];
  } else if (!/^\d+$/.test(teamId)) {
    const correlationId = generateCorrelationId();
    return new Response(
      JSON.stringify({
        error: 'Team not found',
        message: `Unknown team: "${teamIdRaw}". Use team name (titans, chiefs) or ESPN ID (10, 12).`,
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
  } else {
    teamId = parseInt(teamId, 10);
  }

  // Check if team exists
  if (!TEAM_META[teamId]) {
    const correlationId = generateCorrelationId();
    return new Response(
      JSON.stringify({
        error: 'Team not found',
        message: `No NFL team found with ID ${teamId}`,
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

  // Rate limiting
  const limit = await rateLimit(env, request, 100, 60000);
  if (!limit.allowed) {
    return rateLimitError(limit.resetAt, limit.retryAfter);
  }

  try {
    const data = await fetchNFLTeamData(teamId);
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    console.error('NFL API Error:', error);
    const correlationId = generateCorrelationId();
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch NFL data',
        message: error.message,
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
}

async function fetchNFLTeamData(teamId) {
  const headers = {
    'User-Agent': 'BlazeSportsIntel/1.0 (https://blazesportsintel.com)',
    Accept: 'application/json',
  };

  // Fetch team data and standings from ESPN API in parallel
  const [teamResponse, standingsResponse] = await Promise.all([
    fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${teamId}`, {
      headers,
    }),
    fetch('https://site.api.espn.com/apis/v2/sports/football/nfl/standings', { headers }),
  ]);

  if (!teamResponse.ok) {
    throw new Error(`ESPN team API returned ${teamResponse.status}`);
  }

  const teamData = await teamResponse.json();
  const standingsData = await standingsResponse.json();

  const team = teamData.team || {};
  const meta = TEAM_META[teamId] || {};

  // Find team in standings to get detailed stats
  let teamStats = null;
  for (const conf of standingsData.children || []) {
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
  const getStatValue = (name) => {
    const stat = stats.find((s) => s.name === name || s.abbreviation === name);
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
      name: meta.name || team.displayName || 'Unknown',
      abbreviation: TEAM_ABBR[teamId] || team.abbreviation || 'UNK',
      city: meta.city || team.location || '',
      division: meta.division || '',
      conference: meta.conference || '',
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
    dataSource: 'ESPN API (Real-time)',
  };
}
