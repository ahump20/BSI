/**
 * CFB Game Detail API Endpoint
 *
 * GET /api/cfb/game/:gameId
 */

import { ESPNUnifiedAdapter } from '../../../../lib/adapters/espn-unified-adapter';

interface Env {
  BSI_CACHE: KVNamespace;
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
    const gameId = params.gameId as string;

    if (!gameId || gameId === 'undefined') {
      return new Response(JSON.stringify({ error: 'Game ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adapter = new ESPNUnifiedAdapter(env.BSI_CACHE);
    const summary = await adapter.getGameSummary('ncaaf', gameId);

    const gameData = summary.game;

    const response = {
      game: {
        id: gameId,
        date: gameData.scheduledAt,
        status: {
          state: gameData.status,
          quarter: (gameData.sportData as any)?.quarter,
          timeRemaining: (gameData.sportData as any)?.timeRemaining,
          isLive: gameData.status === 'LIVE',
          isFinal: gameData.status === 'FINAL',
        },
        teams: {
          away: {
            name: gameData.awayTeamName,
            abbreviation: gameData.awayTeamAbbrev,
            score: gameData.awayScore || 0,
            isWinner:
              gameData.status === 'FINAL' && (gameData.awayScore || 0) > (gameData.homeScore || 0),
            record: '',
            ranking: gameData.awayRanking,
          },
          home: {
            name: gameData.homeTeamName,
            abbreviation: gameData.homeTeamAbbrev,
            score: gameData.homeScore || 0,
            isWinner:
              gameData.status === 'FINAL' && (gameData.homeScore || 0) > (gameData.awayScore || 0),
            record: '',
            ranking: gameData.homeRanking,
          },
        },
        venue: gameData.venue || 'TBD',
        broadcast: gameData.broadcast,
        leaders: extractLeaders(summary.leaders),
      },
      boxscore: summary.boxscore,
      plays: summary.plays,
      meta: {
        dataSource: 'ESPN College Football',
        lastUpdated: new Date().toISOString(),
      },
    };

    return new Response(JSON.stringify(response, null, 2), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60, s-maxage=300',
      },
    });
  } catch (error) {
    console.error('CFB game error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch game',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

function extractLeaders(leaders: any): any {
  if (!leaders) return null;

  return {
    passing: extractLeaderCategory(leaders, 'passing'),
    rushing: extractLeaderCategory(leaders, 'rushing'),
    receiving: extractLeaderCategory(leaders, 'receiving'),
  };
}

function extractLeaderCategory(
  leaders: any,
  category: string
): { name: string; stats: string } | undefined {
  const categoryData = leaders?.find?.((l: any) => l.name?.toLowerCase() === category);
  if (!categoryData?.leaders?.[0]) return undefined;

  const leader = categoryData.leaders[0];
  return {
    name: leader.athlete?.displayName || leader.athlete?.fullName || 'Unknown',
    stats: leader.displayValue || '',
  };
}
