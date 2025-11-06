/**
 * MLB Statcast API Endpoint
 *
 * GET /api/mlb/statcast/:playerId
 *   - Fetches comprehensive Statcast data for a player
 *   - Returns batted ball events, expected stats, sprint speed, and OAA
 *
 * Query Parameters:
 *   - season: number (default: current year)
 *   - type: 'batter' | 'pitcher' (default: 'batter')
 *   - includeBattedBalls: boolean (default: true)
 *   - includePitches: boolean (default: false)
 *   - includeSprintSpeed: boolean (default: true)
 *   - includeOAA: boolean (default: true)
 *   - minExitVelo: number (optional filter for batted balls)
 *
 * Examples:
 *   /api/mlb/statcast/660271?season=2025&type=batter
 *   /api/mlb/statcast/543037?season=2025&type=pitcher&includePitches=true
 *   /api/mlb/statcast/663656?minExitVelo=100
 */

import { StatcastAdapter } from '../../../../lib/adapters/statcast-adapter';

interface Env {
  CACHE: KVNamespace;
  ANALYTICS?: AnalyticsEngineDataset;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, params, env } = context;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle OPTIONS request
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Extract player ID from URL params
    const playerIdParam = params.playerId as string | string[];
    const playerId = Array.isArray(playerIdParam) ? playerIdParam[0] : playerIdParam;

    if (!playerId || playerId === 'undefined') {
      return new Response(
        JSON.stringify({
          error: 'Player ID is required',
          message: 'Please provide a valid MLB player ID',
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const playerIdNum = parseInt(playerId, 10);
    if (isNaN(playerIdNum)) {
      return new Response(
        JSON.stringify({
          error: 'Invalid player ID',
          message: 'Player ID must be a number',
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Parse query parameters
    const url = new URL(request.url);
    const season = parseInt(url.searchParams.get('season') || new Date().getFullYear().toString(), 10);
    const type = (url.searchParams.get('type') || 'batter') as 'batter' | 'pitcher';
    const includeBattedBalls = url.searchParams.get('includeBattedBalls') !== 'false'; // Default true
    const includePitches = url.searchParams.get('includePitches') === 'true'; // Default false
    const includeSprintSpeed = url.searchParams.get('includeSprintSpeed') !== 'false'; // Default true
    const includeOAA = url.searchParams.get('includeOAA') !== 'false'; // Default true
    const minExitVelo = url.searchParams.get('minExitVelo')
      ? parseInt(url.searchParams.get('minExitVelo')!, 10)
      : undefined;

    // Initialize adapter
    const adapter = new StatcastAdapter(env.CACHE);

    // Build response object
    const response: Record<string, any> = {
      player: {
        id: playerIdNum,
        season,
        type,
      },
      statcast: {},
      meta: {
        dataSource: 'Baseball Savant (MLB Statcast)',
        lastUpdated: new Date().toISOString(),
        timezone: 'America/Chicago',
      },
    };

    // Fetch data in parallel based on type and includes
    if (type === 'batter') {
      const [seasonStats, battedBalls, sprintSpeed, oaa] = await Promise.all([
        adapter.fetchPlayerSeasonStats(playerIdNum, season),
        includeBattedBalls
          ? adapter.fetchPlayerBattedBalls(playerIdNum, season, minExitVelo)
          : null,
        includeSprintSpeed
          ? adapter.fetchSprintSpeed(playerIdNum, season)
          : null,
        includeOAA
          ? adapter.fetchOAA(playerIdNum, season)
          : null,
      ]);

      response.statcast = {
        seasonStats,
        battedBalls: battedBalls
          ? {
              events: battedBalls,
              totalEvents: battedBalls.length,
              summary: {
                avgExitVelo: battedBalls.length > 0
                  ? (battedBalls.reduce((sum, bb) => sum + (bb.launch_speed || 0), 0) / battedBalls.length).toFixed(1)
                  : null,
                maxExitVelo: battedBalls.length > 0
                  ? Math.max(...battedBalls.map(bb => bb.launch_speed || 0)).toFixed(1)
                  : null,
                avgLaunchAngle: battedBalls.length > 0
                  ? (battedBalls.reduce((sum, bb) => sum + (bb.launch_angle || 0), 0) / battedBalls.length).toFixed(1)
                  : null,
                barrels: battedBalls.filter(bb => bb.barrel === 1).length,
                barrelRate: battedBalls.length > 0
                  ? ((battedBalls.filter(bb => bb.barrel === 1).length / battedBalls.length) * 100).toFixed(1)
                  : null,
              },
            }
          : null,
        sprintSpeed,
        oaa,
      };
    } else {
      // Pitcher
      const [seasonStats, pitches] = await Promise.all([
        adapter.fetchPitcherSeasonStats(playerIdNum, season),
        includePitches
          ? adapter.fetchPitcherPitches(playerIdNum, season)
          : null,
      ]);

      response.statcast = {
        seasonStats,
        pitches: pitches
          ? {
              events: pitches,
              totalPitches: pitches.length,
              summary: {
                avgVelocity: pitches.length > 0
                  ? (pitches.reduce((sum, p) => sum + p.release_speed, 0) / pitches.length).toFixed(1)
                  : null,
                maxVelocity: pitches.length > 0
                  ? Math.max(...pitches.map(p => p.release_speed)).toFixed(1)
                  : null,
                avgSpinRate: pitches.length > 0
                  ? (pitches.reduce((sum, p) => sum + p.release_spin_rate, 0) / pitches.length).toFixed(0)
                  : null,
                maxSpinRate: pitches.length > 0
                  ? Math.max(...pitches.map(p => p.release_spin_rate)).toFixed(0)
                  : null,
                pitchTypes: [...new Set(pitches.map(p => p.pitch_type))],
              },
            }
          : null,
      };
    }

    // Track analytics
    if (env.ANALYTICS) {
      try {
        env.ANALYTICS.writeDataPoint({
          blobs: ['mlb_statcast', type, `player_${playerIdNum}`],
          doubles: [1],
          indexes: [`${season}`],
        });
      } catch (error) {
        console.warn('Analytics write failed:', error);
      }
    }

    return new Response(JSON.stringify(response, null, 2), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=600, s-maxage=3600', // 10min client, 1hr CDN
      },
    });
  } catch (error) {
    console.error('MLB Statcast error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return new Response(
      JSON.stringify({
        error: 'Failed to fetch Statcast data',
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
};
