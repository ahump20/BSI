/**
 * NFL Player Profile API Endpoint
 *
 * GET /api/nfl/players/:playerId
 *   - Fetches player info and stats from ESPN
 */

import { ESPNUnifiedAdapter } from '../../../../lib/adapters/espn-unified-adapter';

interface Env {
  BSI_CACHE: KVNamespace;
  ANALYTICS?: AnalyticsEngineDataset;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, params, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const playerIdParam = params.playerId as string | string[];
    const playerId = Array.isArray(playerIdParam) ? playerIdParam[0] : playerIdParam;

    if (!playerId || playerId === 'undefined') {
      return new Response(JSON.stringify({ error: 'Player ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const season = parseInt(
      url.searchParams.get('season') || new Date().getFullYear().toString(),
      10
    );

    const adapter = new ESPNUnifiedAdapter(env.BSI_CACHE);

    // Fetch player stats from ESPN
    const playerStats = await adapter.getPlayerStats('nfl', playerId);

    // Build response with available data
    const response = {
      player: {
        id: playerId,
        fullName: playerStats?.athlete?.fullName || `Player ${playerId}`,
        firstName: playerStats?.athlete?.firstName || '',
        lastName: playerStats?.athlete?.lastName || '',
        jersey: playerStats?.athlete?.jersey,
        position: playerStats?.athlete?.position?.abbreviation || '',
        team: playerStats?.athlete?.team
          ? {
              id: playerStats.athlete.team.id,
              name: playerStats.athlete.team.displayName,
              abbreviation: playerStats.athlete.team.abbreviation,
            }
          : undefined,
        height: playerStats?.athlete?.displayHeight,
        weight: playerStats?.athlete?.displayWeight
          ? parseInt(playerStats.athlete.displayWeight)
          : undefined,
        age: playerStats?.athlete?.age,
        experience: playerStats?.athlete?.experience?.years,
        college: playerStats?.athlete?.college?.name,
        birthPlace: playerStats?.athlete?.birthPlace?.city,
        headshot: playerStats?.athlete?.headshot?.href,
      },
      stats: {
        season,
        stats: extractNFLStats(playerStats),
      },
      meta: {
        dataSource: 'ESPN API',
        lastUpdated: new Date().toISOString(),
        timezone: 'America/Chicago',
      },
    };

    return new Response(JSON.stringify(response, null, 2), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('NFL player profile error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return new Response(
      JSON.stringify({ error: 'Failed to fetch player profile', message: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

function extractNFLStats(playerStats: any): Record<string, number | string> {
  const stats: Record<string, number | string> = {};

  if (!playerStats?.statistics) return stats;

  // Find season stats (typically the first entry)
  const seasonStats = playerStats.statistics[0];
  if (!seasonStats?.splits) return stats;

  // Extract stats from splits
  for (const split of seasonStats.splits) {
    if (split.categories) {
      for (const category of split.categories) {
        for (const stat of category.stats || []) {
          if (stat.name && stat.value !== undefined) {
            stats[stat.name] = stat.value;
          }
        }
      }
    }
  }

  return stats;
}
