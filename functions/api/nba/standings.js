// NBA Standings API - Cloudflare Pages Function
// Fetches real-time NBA standings with validation and caching

import {
  ok,
  err,
  cache,
  withRetry,
  validateNBARecord,
  fetchWithTimeout,
  rateLimit,
  rateLimitError,
  corsHeaders,
} from '../_utils.js';

/**
 * NBA Standings endpoint
 * GET /api/nba/standings?conference=Eastern
 */
export async function onRequestGet(context) {
  const { request, env } = context;

  // Handle OPTIONS request
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting: 100 requests per minute per IP
  const limit = await rateLimit(env, request, 100, 60000);
  if (!limit.allowed) {
    return rateLimitError(limit.resetAt, limit.retryAfter);
  }

  const url = new URL(request.url);
  const conference = url.searchParams.get('conference'); // 'East' or 'West'

  try {
    const cacheKey = `nba:standings:${conference || 'all'}`;

    const standings = await cache(
      env,
      cacheKey,
      async () => {
        return await fetchNBAStandings(conference);
      },
      300
    ); // 5 minute cache

    return ok({
      league: 'NBA',
      season: '2025-26',
      standings,
      meta: {
        dataSource: 'ESPN NBA API',
        lastUpdated: new Date().toISOString(),
        timezone: 'America/Chicago',
      },
    });
  } catch (error) {
    return err(error);
  }
}

/**
 * Fetch NBA standings from ESPN API with retry logic
 */
async function fetchNBAStandings(filterConference) {
  return await withRetry(
    async () => {
      const headers = {
        'User-Agent': 'BlazeSportsIntel/1.0 (https://blazesportsintel.com)',
        Accept: 'application/json',
      };

      // ESPN NBA API endpoint
      const standingsUrl = 'https://site.api.espn.com/apis/v2/sports/basketball/nba/standings';

      const response = await fetchWithTimeout(standingsUrl, { headers }, 10000);

      if (!response.ok) {
        throw new Error(`ESPN API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Process standings data
      const processed = processNBAStandingsData(data, filterConference);

      return processed;
    },
    3,
    250
  ); // 3 retries with 250ms base delay
}

/**
 * Process and validate NBA standings data
 * ESPN API structure: children[] contains conferences, each with standings.entries[]
 */
function processNBAStandingsData(data, filterConference) {
  const conferences = [];

  // ESPN NBA API structure: children array contains conferences
  const conferenceData = data.children || [];

  conferenceData.forEach((conf) => {
    const conferenceName = conf.name; // "Eastern Conference" or "Western Conference"
    const conferenceAbbr = conferenceName?.includes('Eastern') ? 'East' : 'West';

    // Filter by conference if specified
    if (filterConference && conferenceAbbr !== filterConference) {
      return;
    }

    // Process teams directly from conference standings (no division nesting in ESPN API)
    const entries = conf.standings?.entries || [];

    const teams = entries.map((entry) => {
      const team = entry.team;
      const stats = entry.stats || [];

      // Helper to find stat by name
      const getStat = (name) => stats.find((s) => s.name === name);

      const wins = getStat('wins')?.value || 0;
      const losses = getStat('losses')?.value || 0;
      const gamesPlayed = getStat('gamesPlayed')?.value || wins + losses;
      const winPercent = getStat('winPercent')?.value || (gamesPlayed > 0 ? wins / gamesPlayed : 0);
      const gamesBehind = getStat('gamesBehind')?.displayValue || '-';
      const streak = getStat('streak')?.displayValue || '-';
      const pointsFor = getStat('pointsFor')?.value || 0;
      const pointsAgainst = getStat('pointsAgainst')?.value || 0;

      // Get additional records
      const vsConf =
        getStat('vsConf')?.displayValue || getStat('conferenceRecord')?.displayValue || 'N/A';
      const vsDiv =
        getStat('vsDiv')?.displayValue || getStat('divisionRecord')?.displayValue || 'N/A';
      const home = getStat('home')?.displayValue || getStat('homeRecord')?.displayValue || 'N/A';
      const road = getStat('road')?.displayValue || getStat('awayRecord')?.displayValue || 'N/A';
      const lastTen = getStat('L10')?.displayValue || getStat('last10Games')?.displayValue || 'N/A';

      const teamData = {
        id: team.id,
        name: team.displayName,
        abbreviation: team.abbreviation,
        logo: team.logos?.[0]?.href,
        wins,
        losses,
        gamesPlayed,
        games: 82,
        record: {
          wins,
          losses,
          winningPercentage: winPercent.toFixed(3),
          displayRecord: `${wins}-${losses}`,
        },
        conference: conferenceAbbr,
        standings: {
          gamesBack: gamesBehind,
          streak,
          clinched: entry.note?.description?.includes('Clinched') || false,
        },
        stats: {
          pointsFor,
          pointsAgainst,
          pointDifferential: pointsFor - pointsAgainst,
          conferenceRecord: vsConf,
          divisionRecord: vsDiv,
          homeRecord: home,
          roadRecord: road,
          lastTenRecord: lastTen,
        },
      };

      // Validate record if function available
      if (typeof validateNBARecord === 'function') {
        const validation = validateNBARecord(teamData);
        if (!validation.valid) {
          console.warn(`Invalid NBA record for ${team.displayName}:`, validation.errors);
        }
      }

      return teamData;
    });

    // Sort teams by wins descending, then by winning percentage
    const sortedTeams = teams.sort((a, b) => {
      if (b.wins !== a.wins) {
        return b.wins - a.wins;
      }
      return parseFloat(b.record.winningPercentage) - parseFloat(a.record.winningPercentage);
    });

    conferences.push({
      name: conferenceName,
      abbreviation: conferenceAbbr,
      teams: sortedTeams,
    });
  });

  return conferences;
}
