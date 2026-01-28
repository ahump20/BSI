/**
 * NFL Stats Leaders API
 * GET /api/nfl/stats/leaders?category=passing&stat=yards
 *
 * Returns top 10 leaders for a given stat category from ESPN
 */

import { getCurrentSeason } from '../../_season-utils.js';
import { corsHeaders, badRequest } from '../../_utils.js';

interface Env {
  KV?: KVNamespace;
}

interface StatLeader {
  rank: number;
  player: {
    id: string;
    name: string;
    team: string;
    teamAbbr: string;
  };
  value: number | string;
  supportingStats?: Record<string, string | number>;
}

// Map frontend stat IDs to ESPN API stat names
const STAT_MAP: Record<string, string> = {
  // Passing
  passYards: 'passingYards',
  passTD: 'passingTouchdowns',
  qbr: 'quarterbackRating',
  completionPct: 'completionPct',
  // Rushing
  rushYards: 'rushingYards',
  rushTD: 'rushingTouchdowns',
  yardsPerCarry: 'yardsPerRushAttempt',
  // Receiving
  receptions: 'receptions',
  recYards: 'receivingYards',
  recTD: 'receivingTouchdowns',
  // Defense
  tackles: 'totalTackles',
  sacks: 'sacks',
  interceptions: 'interceptions',
};

const CATEGORY_STAT_MAP: Record<string, string> = {
  passing: 'passing',
  rushing: 'rushing',
  receiving: 'receiving',
  defense: 'defensive',
};

export const onRequest: PagesFunction<Env> = async ({ request }) => {
  // Handle OPTIONS request
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(request.url);
  const category = url.searchParams.get('category') || 'passing';
  const stat = url.searchParams.get('stat') || 'passYards';
  const season = getCurrentSeason('nfl');

  // Validate category
  if (!['passing', 'rushing', 'receiving', 'defense'].includes(category)) {
    return badRequest(
      `Invalid category: "${category}". Valid categories are: passing, rushing, receiving, defense`
    );
  }

  // Validate stat
  if (!STAT_MAP[stat]) {
    return badRequest(
      `Invalid stat: "${stat}". Valid stats are: ${Object.keys(STAT_MAP).join(', ')}`
    );
  }

  try {
    // ESPN NFL API endpoint for statistics
    const apiUrl = `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/${season}/types/2/leaders?limit=10`;

    const headers = {
      'User-Agent': 'BlazeSportsIntel/1.0 (https://blazesportsintel.com)',
      Accept: 'application/json',
    };

    const response = await fetch(apiUrl, { headers });

    if (!response.ok) {
      throw new Error(`ESPN API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Find the specific category and stat in the response
    const categoryData = data.categories?.find((c: { name: string }) =>
      c.name.toLowerCase().includes(category)
    );

    const statData = categoryData?.leaders?.find((l: { name: string }) =>
      l.name.toLowerCase().includes(stat.toLowerCase())
    );

    // Transform to frontend format
    const leaders: StatLeader[] = (statData?.leaders || []).map(
      (
        leader: { athlete: { displayName: string; id: string }; displayValue: string },
        index: number
      ) => ({
        rank: index + 1,
        player: {
          id: leader.athlete?.id?.toString() || '',
          name: leader.athlete?.displayName || 'Unknown',
          team: '',
          teamAbbr: '',
        },
        value: leader.displayValue || '0',
        supportingStats: {},
      })
    );

    return new Response(
      JSON.stringify({
        leaders,
        meta: {
          dataSource: 'ESPN NFL API',
          lastUpdated: new Date().toISOString(),
          timezone: 'America/Chicago',
          season,
          category,
          stat,
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
    console.error('NFL stats leaders error:', error);
    // Return empty array for graceful degradation
    return new Response(
      JSON.stringify({
        leaders: [],
        meta: {
          dataSource: 'ESPN NFL API',
          lastUpdated: new Date().toISOString(),
          timezone: 'America/Chicago',
          season,
          category,
          stat,
          error: error instanceof Error ? error.message : 'Data unavailable',
        },
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
};
