// MLB Standings API - Cloudflare Pages Function
// Fetches real-time MLB standings with validation and caching

import {
  ok,
  err,
  cache,
  withRetry,
  validateMLBRecord,
  fetchWithTimeout,
  rateLimit,
  rateLimitError,
} from '../_utils.js';

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
 */
function processMLBStandingsData(data, filterDivision, filterLeague) {
  const allTeams = [];

  // MLB Stats API structure: records array contains divisions
  const records = data.records || [];

  records.forEach((division) => {
    const divisionName = division.division?.name; // e.g., "American League East"
    const divisionAbbr = division.division?.abbreviation; // e.g., "ALE"
    const leagueName = division.league?.name; // "American League" or "National League"
    const leagueAbbr = leagueName?.includes('American') ? 'AL' : 'NL';

    // Extract simple division name (East, Central, West)
    const simpleDivisionName = divisionName?.split(' ').pop() || 'Unknown';

    // Filter by division or league if specified
    if (filterDivision && !divisionAbbr?.includes(filterDivision)) {
      return;
    }
    if (filterLeague && leagueAbbr !== filterLeague) {
      return;
    }

    // Process teams in this division
    const teams = (division.teamRecords || []).map((teamRecord) => {
      const team = teamRecord.team;
      const wins = teamRecord.wins || 0;
      const losses = teamRecord.losses || 0;
      const gamesPlayed = teamRecord.gamesPlayed || 0;
      const winningPercentage = parseFloat(teamRecord.leagueRecord?.pct || '0.000');
      const gamesBack = parseFloat(teamRecord.gamesBack || '0.0');
      const streak = teamRecord.streak?.streakCode || '-';
      const runsScored = teamRecord.runsScored || 0;
      const runsAllowed = teamRecord.runsAllowed || 0;

      const teamData = {
        teamName: team.name || team.teamName,
        wins,
        losses,
        winPercentage: winningPercentage,
        gamesBack,
        division: simpleDivisionName,
        league: leagueAbbr,
        runsScored,
        runsAllowed,
        streakCode: streak,
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

    allTeams.push(...teams);
  });

  // Sort teams by league and division, then by wins
  return allTeams.sort((a, b) => {
    // Sort by league (AL first)
    if (a.league !== b.league) {
      return a.league === 'AL' ? -1 : 1;
    }
    // Then by division
    const divOrder = ['East', 'Central', 'West'];
    const divCompare = divOrder.indexOf(a.division) - divOrder.indexOf(b.division);
    if (divCompare !== 0) {
      return divCompare;
    }
    // Then by wins (descending)
    return b.wins - a.wins;
  });
}
