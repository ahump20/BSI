/**
 * MLB Player Profile API Endpoint
 *
 * GET /api/mlb/players/:playerId
 *   - Fetches player info, stats, and splits
 *   - Returns comprehensive player profile data
 *
 * Query Parameters:
 *   - season: number (default: current year)
 *   - includeGameLog: boolean (default: false)
 *   - includeSplits: boolean (default: true)
 */

import {
  MlbAdapter,
  calculateAdvancedBattingStats,
  calculateAdvancedPitchingStats,
} from '../../../../lib/adapters/mlb-adapter';

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
    const season = parseInt(
      url.searchParams.get('season') || new Date().getFullYear().toString(),
      10
    );
    const includeGameLog = url.searchParams.get('includeGameLog') === 'true';
    const includeSplits = url.searchParams.get('includeSplits') !== 'false'; // Default true

    // Initialize adapter
    const adapter = new MlbAdapter(env.CACHE);

    // Fetch player info
    const playerInfo = await adapter.fetchPlayerInfo(playerIdNum);

    // Determine if player is batter or pitcher
    const isPitcher =
      playerInfo.primaryPosition.code === '1' || playerInfo.primaryPosition.type === 'Pitcher';
    const statGroup = isPitcher ? 'pitching' : 'hitting';

    // Fetch season stats
    const seasonStats = await adapter.fetchPlayerStats(playerIdNum, season, statGroup as any);

    // Fetch splits if requested
    let splits = null;
    if (includeSplits) {
      if (isPitcher) {
        splits = await adapter.fetchPitcherStatSplits(playerIdNum, season);
      } else {
        splits = await adapter.fetchBatterStatSplits(playerIdNum, season);
      }
    }

    // Fetch game log if requested
    let gameLog = null;
    if (includeGameLog) {
      gameLog = await adapter.fetchPlayerGameLog(
        playerIdNum,
        season,
        isPitcher ? 'pitching' : 'hitting'
      );
    }

    // Get asset URLs
    const headshot = adapter.fetchPlayerHeadshotUrl(playerIdNum);
    const heroImage = adapter.fetchPlayerHeroImageUrl(playerIdNum);
    const teamLogo = playerInfo.currentTeam?.id
      ? adapter.fetchTeamLogoUrl(playerInfo.currentTeam.id)
      : null;

    // Calculate advanced stats for the primary season stat line
    let advancedStats = null;
    if (seasonStats.length > 0) {
      const primaryStat = seasonStats[0].stat;
      if (isPitcher) {
        advancedStats = calculateAdvancedPitchingStats(primaryStat as any);
      } else {
        advancedStats = calculateAdvancedBattingStats(primaryStat as any);
      }
    }

    // Build response
    const response = {
      player: {
        id: playerInfo.id,
        fullName: playerInfo.fullName,
        firstName: playerInfo.firstName,
        lastName: playerInfo.lastName,
        primaryNumber: playerInfo.primaryNumber,
        birthDate: playerInfo.birthDate,
        currentAge: playerInfo.currentAge,
        birthCity: playerInfo.birthCity,
        birthStateProvince: playerInfo.birthStateProvince,
        birthCountry: playerInfo.birthCountry,
        height: playerInfo.height,
        weight: playerInfo.weight,
        active: playerInfo.active,
        mlbDebutDate: playerInfo.mlbDebutDate,
        draftYear: playerInfo.draftYear,
        currentTeam: playerInfo.currentTeam,
        primaryPosition: playerInfo.primaryPosition,
        batSide: playerInfo.batSide,
        pitchHand: playerInfo.pitchHand,
      },
      assets: {
        headshot,
        heroImage,
        teamLogo,
      },
      stats: {
        season,
        seasonStats,
        advancedStats,
        splits,
        gameLog,
      },
      meta: {
        dataSource: 'MLB Stats API',
        lastUpdated: new Date().toISOString(),
        timezone: 'America/Chicago',
        isPitcher,
      },
    };

    // Track analytics
    if (env.ANALYTICS) {
      try {
        env.ANALYTICS.writeDataPoint({
          blobs: ['mlb_player_profile', `player_${playerIdNum}`],
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
        'Cache-Control': 'public, max-age=300, s-maxage=3600', // 5min client, 1hr CDN
      },
    });
  } catch (error) {
    console.error('MLB player profile error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return new Response(
      JSON.stringify({
        error: 'Failed to fetch player profile',
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
