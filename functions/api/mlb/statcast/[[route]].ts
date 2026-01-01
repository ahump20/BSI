/**
 * MLB Statcast API - PHASE 19
 * Advanced baseball analytics using Statcast tracking data
 *
 * Endpoints:
 * - GET /api/mlb/statcast/player/{playerId} - Player Statcast summary
 * - GET /api/mlb/statcast/leaderboard/{metric} - League leaderboards
 * - GET /api/mlb/statcast/events - Batted ball events (filtered)
 * - GET /api/mlb/statcast/barrels - Barrel analysis
 */

import type {
  StatcastPlayerSummary,
  StatcastLeaderboardEntry,
  BattedBallEvent,
  StatcastApiResponse as _StatcastApiResponse,
  StatcastQueryParams as _StatcastQueryParams,
} from '../../../../lib/types/statcast';

interface Env {
  SPORTS_CACHE: KVNamespace;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// MLB Stats API and Baseball Savant URLs
const MLB_STATS_API = 'https://statsapi.mlb.com/api/v1';
const _BASEBALL_SAVANT_API = 'https://baseballsavant.mlb.com/statcast_search';

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Only allow GET requests
  if (request.method !== 'GET') {
    return jsonResponse(
      {
        success: false,
        data: null,
        meta: {
          dataSource: 'Statcast API',
          lastUpdated: new Date().toISOString(),
          cached: false,
        },
        error: 'Method not allowed',
      },
      { status: 405 }
    );
  }

  try {
    const url = new URL(request.url);
    const route = params.route as string[] | string;
    const routePath = Array.isArray(route) ? route.join('/') : route;

    // Route handling
    if (routePath.startsWith('player/')) {
      const playerId = routePath.split('/')[1];
      return await getPlayerStatcast(playerId, url, env);
    }

    if (routePath.startsWith('leaderboard/')) {
      const metric = routePath.split('/')[1];
      return await getStatcastLeaderboard(metric, url, env);
    }

    if (routePath === 'events') {
      return await getStatcastEvents(url, env);
    }

    if (routePath === 'barrels') {
      return await getBarrelAnalysis(url, env);
    }

    if (routePath === 'health') {
      return await healthCheck();
    }

    // Unknown route
    return jsonResponse(
      {
        success: false,
        data: null,
        meta: {
          dataSource: 'Statcast API',
          lastUpdated: new Date().toISOString(),
          cached: false,
        },
        error: `Unknown route: ${routePath}`,
      },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('[Statcast API] Error:', error);

    return jsonResponse(
      {
        success: false,
        data: null,
        meta: {
          dataSource: 'Statcast API',
          lastUpdated: new Date().toISOString(),
          cached: false,
        },
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
};

/**
 * Get player Statcast summary
 * GET /api/mlb/statcast/player/{playerId}?season=2024
 */
async function getPlayerStatcast(playerId: string, url: URL, env: Env): Promise<Response> {
  const season = url.searchParams.get('season') || new Date().getFullYear().toString();
  const cacheKey = `statcast:player:${playerId}:${season}`;

  // Check cache first (5 minute TTL)
  const cached = await env.SPORTS_CACHE?.get(cacheKey, 'json');
  if (cached) {
    return jsonResponse({
      success: true,
      data: cached as StatcastPlayerSummary,
      meta: {
        dataSource: 'MLB Stats API + Baseball Savant',
        lastUpdated: new Date().toISOString(),
        season: parseInt(season),
        cached: true,
      },
    });
  }

  try {
    // Fetch player data from MLB Stats API
    const playerResponse = await fetch(
      `${MLB_STATS_API}/people/${playerId}?hydrate=stats(group=[hitting],type=[season],season=${season})`
    );

    if (!playerResponse.ok) {
      throw new Error(`MLB Stats API returned ${playerResponse.status}`);
    }

    const playerData = await playerResponse.json();
    const person = playerData.people?.[0];

    if (!person) {
      throw new Error('Player not found');
    }

    // For now, return structured demo data with proper typing
    // TODO: Implement full Baseball Savant scraping for Statcast metrics
    const statcastSummary: StatcastPlayerSummary = {
      playerId: parseInt(playerId),
      playerName: person.fullName,
      team: person.currentTeam?.name || 'Unknown',
      position: person.primaryPosition?.abbreviation || 'Unknown',
      season: parseInt(season),

      batting: {
        // Core stats from MLB Stats API
        atBats: person.stats?.[0]?.splits?.[0]?.stat?.atBats || 0,
        hits: person.stats?.[0]?.splits?.[0]?.stat?.hits || 0,
        homeRuns: person.stats?.[0]?.splits?.[0]?.stat?.homeRuns || 0,
        battingAverage: person.stats?.[0]?.splits?.[0]?.stat?.avg || 0,

        // Statcast metrics (to be populated from Baseball Savant)
        avgExitVelocity: 0,
        maxExitVelocity: 0,
        avgLaunchAngle: 0,

        xBA: 0,
        xSLG: 0,
        xWOBA: 0,
        xWOBACON: 0,

        barrelRate: 0,
        barrels: 0,
        barrelPerPA: 0,

        sweetSpotPercent: 0,

        hardHitPercent: 0,
        avgHitDistance: 0,

        sprintSpeed: undefined,
      },

      battedBallEvents: 0,
      plateAppearances: person.stats?.[0]?.splits?.[0]?.stat?.plateAppearances || 0,

      lastUpdated: new Date().toISOString(),
      dataSource: 'MLB Stats API (Baseball Savant integration pending)',
    };

    // Cache for 5 minutes
    await env.SPORTS_CACHE?.put(cacheKey, JSON.stringify(statcastSummary), {
      expirationTtl: 300,
    });

    return jsonResponse({
      success: true,
      data: statcastSummary,
      meta: {
        dataSource: 'MLB Stats API + Baseball Savant',
        lastUpdated: new Date().toISOString(),
        season: parseInt(season),
        cached: false,
      },
    });
  } catch (error: any) {
    console.error(`[getPlayerStatcast] Error for player ${playerId}:`, error);

    return jsonResponse(
      {
        success: false,
        data: null,
        meta: {
          dataSource: 'MLB Stats API',
          lastUpdated: new Date().toISOString(),
          season: parseInt(season),
          cached: false,
        },
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Get Statcast leaderboard for a specific metric
 * GET /api/mlb/statcast/leaderboard/{metric}?season=2024&limit=10
 */
async function getStatcastLeaderboard(metric: string, url: URL, env: Env): Promise<Response> {
  const season = url.searchParams.get('season') || new Date().getFullYear().toString();
  const limit = parseInt(url.searchParams.get('limit') || '10');
  const cacheKey = `statcast:leaderboard:${metric}:${season}:${limit}`;

  // Check cache first (10 minute TTL for leaderboards)
  const cached = await env.SPORTS_CACHE?.get(cacheKey, 'json');
  if (cached) {
    return jsonResponse({
      success: true,
      data: cached as StatcastLeaderboardEntry[],
      meta: {
        dataSource: 'Baseball Savant',
        lastUpdated: new Date().toISOString(),
        season: parseInt(season),
        cached: true,
      },
    });
  }

  // Metric to Baseball Savant leaderboard mapping
  const metricConfig: Record<string, { leaderboard: string; column: string; sortDesc: boolean }> = {
    xBA: { leaderboard: 'expected_statistics', column: 'est_ba', sortDesc: true },
    xSLG: { leaderboard: 'expected_statistics', column: 'est_slg', sortDesc: true },
    xWOBA: { leaderboard: 'expected_statistics', column: 'est_woba', sortDesc: true },
    barrelRate: { leaderboard: 'exit_velocity_barrels', column: 'brl_percent', sortDesc: true },
    avgExitVelocity: {
      leaderboard: 'exit_velocity_barrels',
      column: 'avg_hit_speed',
      sortDesc: true,
    },
    maxExitVelocity: {
      leaderboard: 'exit_velocity_barrels',
      column: 'max_hit_speed',
      sortDesc: true,
    },
    hardHitPercent: { leaderboard: 'exit_velocity_barrels', column: 'ev95percent', sortDesc: true },
    sweetSpotPercent: {
      leaderboard: 'exit_velocity_barrels',
      column: 'anglesweetspotpercent',
      sortDesc: true,
    },
  };

  const config = metricConfig[metric];
  if (!config) {
    return jsonResponse(
      {
        success: false,
        data: null,
        meta: {
          dataSource: 'Statcast API',
          lastUpdated: new Date().toISOString(),
          cached: false,
        },
        error: `Invalid metric. Must be one of: ${Object.keys(metricConfig).join(', ')}`,
      },
      { status: 400 }
    );
  }

  try {
    // Fetch from Baseball Savant CSV endpoint
    const savantUrl = `https://baseballsavant.mlb.com/leaderboard/${config.leaderboard}?type=batter&year=${season}&position=&team=&min=25&csv=true`;

    const response = await fetch(savantUrl, {
      headers: {
        'User-Agent': 'BSI-Analytics/1.0 (blazesportsintel.com)',
        Accept: 'text/csv',
      },
    });

    if (!response.ok) {
      throw new Error(`Baseball Savant returned ${response.status}`);
    }

    const csvText = await response.text();
    const leaderboard = parseBaseballSavantCSV(
      csvText,
      metric,
      config.column,
      limit,
      parseInt(season)
    );

    await env.SPORTS_CACHE?.put(cacheKey, JSON.stringify(leaderboard), {
      expirationTtl: 600, // 10 minutes
    });

    return jsonResponse({
      success: true,
      data: leaderboard,
      meta: {
        dataSource: 'Baseball Savant',
        lastUpdated: new Date().toISOString(),
        season: parseInt(season),
        cached: false,
      },
    });
  } catch (error: any) {
    console.error(`[getStatcastLeaderboard] Error fetching ${metric}:`, error);

    return jsonResponse(
      {
        success: false,
        data: [],
        meta: {
          dataSource: 'Baseball Savant',
          lastUpdated: new Date().toISOString(),
          season: parseInt(season),
          cached: false,
        },
        error: error.message || 'Failed to fetch leaderboard data',
      },
      { status: 500 }
    );
  }
}

/**
 * Get batted ball events with filters
 * GET /api/mlb/statcast/events?playerId=660271&season=2024&minExitVelocity=100
 */
async function getStatcastEvents(url: URL, env: Env): Promise<Response> {
  const playerId = url.searchParams.get('playerId');
  const season = url.searchParams.get('season') || new Date().getFullYear().toString();

  if (!playerId) {
    return jsonResponse(
      {
        success: false,
        data: null,
        meta: {
          dataSource: 'Statcast API',
          lastUpdated: new Date().toISOString(),
          cached: false,
        },
        error: 'playerId parameter is required',
      },
      { status: 400 }
    );
  }

  const cacheKey = `statcast:events:${playerId}:${season}`;

  // Check cache
  const cached = await env.SPORTS_CACHE?.get(cacheKey, 'json');
  if (cached) {
    return jsonResponse({
      success: true,
      data: cached as BattedBallEvent[],
      meta: {
        dataSource: 'Baseball Savant',
        lastUpdated: new Date().toISOString(),
        season: parseInt(season),
        cached: true,
      },
    });
  }

  // For now, return empty events array
  // TODO: Implement Baseball Savant Statcast search integration
  const events: BattedBallEvent[] = [];

  await env.SPORTS_CACHE?.put(cacheKey, JSON.stringify(events), {
    expirationTtl: 300, // 5 minutes
  });

  return jsonResponse({
    success: true,
    data: events,
    meta: {
      dataSource: 'Baseball Savant (integration pending)',
      lastUpdated: new Date().toISOString(),
      season: parseInt(season),
      cached: false,
    },
  });
}

/**
 * Get barrel analysis
 * GET /api/mlb/statcast/barrels?playerId=660271&season=2024
 */
async function getBarrelAnalysis(url: URL, env: Env): Promise<Response> {
  const playerId = url.searchParams.get('playerId');
  const season = url.searchParams.get('season') || new Date().getFullYear().toString();

  if (!playerId) {
    return jsonResponse(
      {
        success: false,
        data: null,
        meta: {
          dataSource: 'Statcast API',
          lastUpdated: new Date().toISOString(),
          cached: false,
        },
        error: 'playerId parameter is required',
      },
      { status: 400 }
    );
  }

  // Return barrel analysis structure
  const barrelAnalysis = {
    playerId: parseInt(playerId),
    season: parseInt(season),
    totalBarrels: 0,
    barrelRate: 0,
    avgExitVelocityOnBarrels: 0,
    avgLaunchAngleOnBarrels: 0,
    avgDistanceOnBarrels: 0,
    battingAverageOnBarrels: 0,
    sluggingOnBarrels: 0,
    events: [] as BattedBallEvent[],
  };

  return jsonResponse({
    success: true,
    data: barrelAnalysis,
    meta: {
      dataSource: 'Baseball Savant (integration pending)',
      lastUpdated: new Date().toISOString(),
      season: parseInt(season),
      cached: false,
    },
  });
}

/**
 * Parse Baseball Savant CSV response into leaderboard entries
 */
function parseBaseballSavantCSV(
  csvText: string,
  metric: string,
  valueColumn: string,
  limit: number,
  season: number
): StatcastLeaderboardEntry[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  // Parse header row to find column indices
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''));
  const playerIdIdx = headers.findIndex((h) => h === 'player_id' || h === 'batter');
  const playerNameIdx = headers.findIndex(
    (h) => h === 'player_name' || h === 'name' || h === 'last_name, first_name'
  );
  const teamIdx = headers.findIndex((h) => h === 'team' || h === 'team_name');
  const valueIdx = headers.findIndex((h) => h === valueColumn.toLowerCase());

  if (valueIdx === -1) {
    console.error(`Column ${valueColumn} not found in CSV headers:`, headers);
    return [];
  }

  // Parse data rows
  const entries: StatcastLeaderboardEntry[] = [];

  for (let i = 1; i < lines.length && entries.length < limit; i++) {
    const row = parseCSVRow(lines[i]);
    if (row.length <= valueIdx) continue;

    const value = parseFloat(row[valueIdx]);
    if (isNaN(value)) continue;

    entries.push({
      rank: entries.length + 1,
      playerId: playerIdIdx >= 0 ? parseInt(row[playerIdIdx]) || 0 : 0,
      playerName:
        playerNameIdx >= 0 ? row[playerNameIdx]?.replace(/"/g, '') || 'Unknown' : 'Unknown',
      team: teamIdx >= 0 ? row[teamIdx]?.replace(/"/g, '') || '' : '',
      metric,
      value,
      season,
    });
  }

  return entries;
}

/**
 * Parse a CSV row handling quoted values
 */
function parseCSVRow(row: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());

  return result;
}

/**
 * Health check endpoint
 */
async function healthCheck(): Promise<Response> {
  return jsonResponse({
    success: true,
    data: {
      status: 'healthy',
      service: 'MLB Statcast API',
      version: '1.0.0',
      phase: 'PHASE 19 - Development',
      endpoints: [
        'GET /api/mlb/statcast/player/{playerId}',
        'GET /api/mlb/statcast/leaderboard/{metric}',
        'GET /api/mlb/statcast/events',
        'GET /api/mlb/statcast/barrels',
        'GET /api/mlb/statcast/health',
      ],
      dataSources: ['MLB Stats API (statsapi.mlb.com)', 'Baseball Savant (baseballsavant.mlb.com)'],
      notes: [
        'Phase 19-A: TypeScript interfaces complete',
        'Phase 19-B: API endpoints with Baseball Savant CSV integration',
        'Phase 19-C: Dashboard visualization pending',
      ],
    },
    meta: {
      dataSource: 'Statcast API',
      lastUpdated: new Date().toISOString(),
      cached: false,
    },
  });
}

/**
 * Helper to create JSON responses
 */
function jsonResponse(data: any, options: { status?: number } = {}): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status: options.status || 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
