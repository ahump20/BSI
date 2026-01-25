// MLB Standings API - Cloudflare Pages Function
// Fetches real-time MLB standings with validation and caching

import {
  ok,
  err,
  badRequest,
  cache,
  withRetry,
  validateMLBRecord,
  fetchWithTimeout,
  rateLimit,
  rateLimitError,
} from '../_utils.js';

// Valid MLB divisions
const VALID_DIVISIONS = ['AL East', 'AL Central', 'AL West', 'NL East', 'NL Central', 'NL West'];

// MLB Division ID to Name mapping (API sometimes returns only IDs)
const DIVISION_MAP = {
  200: { name: 'AL West', league: 'AL' },
  201: { name: 'AL East', league: 'AL' },
  202: { name: 'AL Central', league: 'AL' },
  203: { name: 'NL West', league: 'NL' },
  204: { name: 'NL East', league: 'NL' },
  205: { name: 'NL Central', league: 'NL' },
};

// MLB League ID to abbreviation mapping
const LEAGUE_MAP = {
  103: 'AL',
  104: 'NL',
};

/**
 * MLB Standings endpoint
 * GET /api/mlb/standings?division=AL_East
 */
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Rate limiting: 100 requests per minute per IP
  const limit = await rateLimit(env, request, 100, 60000);
  if (!limit.allowed) {
    return rateLimitError(limit.resetAt, limit.retryAfter);
  }

  const division = url.searchParams.get('division');
  const league = url.searchParams.get('league'); // 'AL' or 'NL'

  // Validate division parameter if provided
  if (division && !VALID_DIVISIONS.includes(division)) {
    return badRequest(
      `Invalid division: "${division}". Valid divisions are: ${VALID_DIVISIONS.join(', ')}`
    );
  }

  // Validate league parameter if provided
  if (league && !['AL', 'NL'].includes(league)) {
    return badRequest(`Invalid league: "${league}". Valid leagues are: AL, NL`);
  }

  try {
    const cacheKey = `mlb:standings:${division || league || 'all'}`;

    const standings = await cache(
      env,
      cacheKey,
      async () => {
        return await fetchMLBStandings(division, league);
      },
      300
    ); // 5 minute cache

    return ok({
      league: 'MLB',
      season: '2025',
      standings,
      meta: {
        dataSource: 'MLB Stats API',
        lastUpdated: new Date().toISOString(),
        timezone: 'America/Chicago',
      },
    });
  } catch (error) {
    return err(error);
  }
}

/**
 * Fetch MLB standings from MLB Stats API with retry logic
 */
async function fetchMLBStandings(filterDivision, filterLeague) {
  return await withRetry(
    async () => {
      const headers = {
        'User-Agent': 'BlazeSportsIntel/1.0 (https://blazesportsintel.com)',
        Accept: 'application/json',
      };

      // MLB Stats API endpoint
      const standingsUrl =
        'https://statsapi.mlb.com/api/v1/standings?leagueId=103,104&season=2025&standingsTypes=regularSeason';

      const response = await fetchWithTimeout(standingsUrl, { headers }, 10000);

      if (!response.ok) {
        throw new Error(`MLB API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Process standings data
      const processed = processMLBStandingsData(data, filterDivision, filterLeague);

      return processed;
    },
    3,
    250
  ); // 3 retries with 250ms base delay
}

/**
 * Process and validate MLB standings data
 * Returns array of { division, league, teams } objects matching test expectations
 */
function processMLBStandingsData(data, filterDivision, filterLeague) {
  const divisionStandings = [];

  // MLB Stats API structure: records array contains divisions
  const records = data.records || [];

  records.forEach((record) => {
    const divisionId = record.division?.id;
    const leagueId = record.league?.id;

    // Use mapping for division/league info (API may not include names for future seasons)
    const divisionInfo = DIVISION_MAP[divisionId];
    const leagueAbbr = divisionInfo?.league || LEAGUE_MAP[leagueId] || 'NL';

    // Get full division name from mapping, or fallback to parsing the name field
    let fullDivisionName;
    if (divisionInfo) {
      fullDivisionName = divisionInfo.name;
    } else {
      // Fallback: parse from division name if available
      const divisionName = record.division?.name; // e.g., "American League East"
      const simpleDivisionName = divisionName?.split(' ').pop() || 'Unknown';
      fullDivisionName = `${leagueAbbr} ${simpleDivisionName}`;
    }

    // Filter by division if specified (e.g., "NL Central")
    // Normalize both values for comparison to handle whitespace/casing
    if (filterDivision) {
      const normalizedFilter = filterDivision.trim().toLowerCase();
      const normalizedFull = fullDivisionName.trim().toLowerCase();
      if (normalizedFull !== normalizedFilter) {
        return;
      }
    }
    // Filter by league if specified
    if (filterLeague && leagueAbbr !== filterLeague) {
      return;
    }

    // Process teams in this division
    const teams = (record.teamRecords || []).map((teamRecord) => {
      const team = teamRecord.team;
      const wins = teamRecord.wins || 0;
      const losses = teamRecord.losses || 0;
      const gamesPlayed = teamRecord.gamesPlayed || 0;
      const winningPercentage = parseFloat(teamRecord.leagueRecord?.pct || '0.000');
      const gamesBack = parseFloat(teamRecord.gamesBack || '0') || 0;
      const streak = teamRecord.streak?.streakCode || '-';
      const runsScored = teamRecord.runsScored || 0;
      const runsAllowed = teamRecord.runsAllowed || 0;

      const teamData = {
        id: team.id,
        name: team.name || team.teamName || 'Unknown Team',
        abbreviation: team.abbreviation || team.name?.slice(0, 3).toUpperCase() || 'UNK',
        city: team.locationName || team.name?.split(' ').slice(0, -1).join(' ') || '',
        division: fullDivisionName,
        league: leagueAbbr,
        wins,
        losses,
        winPct: winningPercentage,
        gamesBack,
        runsScored,
        runsAllowed,
        streakCode: streak,
        lastUpdated: new Date().toISOString(),
      };

      // Validate record
      const validation = validateMLBRecord({
        wins,
        losses,
        gamesPlayed,
        games: 162,
        name: team.name,
      });
      if (!validation.valid) {
        console.warn(`Invalid MLB record for ${team.name}:`, validation.errors);
      }

      return teamData;
    });

    // Sort teams by wins descending within division
    teams.sort((a, b) => b.wins - a.wins);

    divisionStandings.push({
      division: fullDivisionName,
      league: leagueAbbr,
      teams,
      lastUpdated: new Date().toISOString(),
      dataSource: 'MLB Stats API',
    });
  });

  // Sort divisions: AL first, then by East/Central/West
  const divOrder = ['East', 'Central', 'West'];
  return divisionStandings.sort((a, b) => {
    if (a.league !== b.league) {
      return a.league === 'AL' ? -1 : 1;
    }
    const aDivPart = a.division.split(' ').pop();
    const bDivPart = b.division.split(' ').pop();
    return divOrder.indexOf(aDivPart) - divOrder.indexOf(bDivPart);
  });
}
