/**
 * MLB Stats Leaders API
 * GET /api/mlb/stats/leaders?category=batting&stat=avg
 *
 * Returns top 10 leaders for a given stat category
 */

import { getCurrentSeason } from '../../_season-utils.js';
import { corsHeaders, ok, badRequest } from '../../_utils.js';

// Map frontend stat IDs to MLB API stat names
const STAT_MAP = {
  // Batting
  avg: 'battingAverage',
  hr: 'homeRuns',
  rbi: 'runsBattedIn',
  sb: 'stolenBases',
  ops: 'onBasePlusSlugging',
  hits: 'hits',
  runs: 'runs',
  doubles: 'doubles',
  // Pitching
  era: 'earnedRunAverage',
  wins: 'wins',
  so: 'strikeOuts',
  saves: 'saves',
  whip: 'walksAndHitsPerInningPitched',
  ip: 'inningsPitched',
};

// Map category to stat group
const STAT_GROUP_MAP = {
  batting: 'hitting',
  pitching: 'pitching',
};

export async function onRequestGet(context) {
  const { request } = context;

  // Handle OPTIONS request
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(request.url);
  const category = url.searchParams.get('category') || 'batting';
  const stat = url.searchParams.get('stat') || 'avg';
  const season = getCurrentSeason('mlb');

  // Validate category
  if (!['batting', 'pitching'].includes(category)) {
    return badRequest(`Invalid category: "${category}". Valid categories are: batting, pitching`);
  }

  // Validate stat
  if (!STAT_MAP[stat]) {
    return badRequest(
      `Invalid stat: "${stat}". Valid stats are: ${Object.keys(STAT_MAP).join(', ')}`
    );
  }

  try {
    const apiStat = STAT_MAP[stat];
    const statGroup = STAT_GROUP_MAP[category];

    // MLB Stats API endpoint
    const apiUrl = `https://statsapi.mlb.com/api/v1/stats/leaders?leaderCategories=${apiStat}&season=${season}&sportId=1&statGroup=${statGroup}&limit=10`;

    const headers = {
      'User-Agent': 'BlazeSportsIntel/1.0 (https://blazesportsintel.com)',
      Accept: 'application/json',
    };

    const response = await fetch(apiUrl, { headers });

    if (!response.ok) {
      throw new Error(`MLB API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Transform to frontend format
    const leaders = (data.leagueLeaders?.[0]?.leaders || []).map((leader, index) => ({
      rank: index + 1,
      player: {
        id: leader.person?.id?.toString() || '',
        name: leader.person?.fullName || 'Unknown',
        team: leader.team?.name || '',
        teamAbbr: leader.team?.abbreviation || '',
      },
      value: leader.value,
      supportingStats: {
        team: leader.team?.name || '',
        position: leader.person?.primaryPosition?.abbreviation || '',
      },
    }));

    return ok({
      leaders,
      meta: {
        dataSource: 'MLB Stats API',
        lastUpdated: new Date().toISOString(),
        timezone: 'America/Chicago',
        season,
        category,
        stat,
      },
    });
  } catch (error) {
    console.error('MLB stats leaders error:', error);
    // Return empty array for graceful degradation
    return ok({
      leaders: [],
      meta: {
        dataSource: 'MLB Stats API',
        lastUpdated: new Date().toISOString(),
        timezone: 'America/Chicago',
        season,
        category,
        stat,
        error: error instanceof Error ? error.message : 'Data unavailable',
      },
    });
  }
}
