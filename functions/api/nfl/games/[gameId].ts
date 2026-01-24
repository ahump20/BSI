/**
 * NFL Game Details API
 * Fetches game summary from ESPN API
 */

interface Env {
  BSI_CACHE?: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  const gameId = params.gameId as string;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=60, s-maxage=120',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  if (!gameId) {
    return new Response(JSON.stringify({ error: 'Game ID required' }), {
      status: 400,
      headers,
    });
  }

  try {
    const cacheKey = `nfl:game:${gameId}`;
    let gameData = null;

    if (env.BSI_CACHE) {
      const cached = await env.BSI_CACHE.get(cacheKey, 'json');
      if (cached) gameData = cached;
    }

    if (!gameData) {
      const espnResponse = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${gameId}`,
        {
          headers: {
            'User-Agent': 'BlazeSportsIntel/1.0',
            Accept: 'application/json',
          },
        }
      );

      if (!espnResponse.ok) {
        throw new Error(`ESPN API returned ${espnResponse.status}`);
      }

      const espnData = await espnResponse.json();
      const header = espnData.header;
      const boxscore = espnData.boxscore;

      const away = header?.competitions?.[0]?.competitors?.find(
        (c: { homeAway: string }) => c.homeAway === 'away'
      );
      const home = header?.competitions?.[0]?.competitors?.find(
        (c: { homeAway: string }) => c.homeAway === 'home'
      );

      gameData = {
        timestamp: new Date().toISOString(),
        game: {
          id: gameId,
          date: header?.competitions?.[0]?.date || new Date().toISOString(),
          status: {
            state: header?.competitions?.[0]?.status?.type?.description || 'Unknown',
            quarter: header?.competitions?.[0]?.status?.period,
            timeRemaining: header?.competitions?.[0]?.status?.displayClock,
            isLive:
              !header?.competitions?.[0]?.status?.type?.completed &&
              (header?.competitions?.[0]?.status?.period || 0) > 0,
            isFinal: header?.competitions?.[0]?.status?.type?.completed || false,
          },
          teams: {
            away: {
              name: away?.team?.displayName || 'Away',
              abbreviation: away?.team?.abbreviation || 'AWY',
              score: parseInt(away?.score) || 0,
              isWinner: away?.winner || false,
              record: away?.record?.[0]?.summary || '',
            },
            home: {
              name: home?.team?.displayName || 'Home',
              abbreviation: home?.team?.abbreviation || 'HME',
              score: parseInt(home?.score) || 0,
              isWinner: home?.winner || false,
              record: home?.record?.[0]?.summary || '',
            },
          },
          venue: header?.competitions?.[0]?.venue?.fullName || 'TBD',
          broadcast: header?.competitions?.[0]?.broadcasts?.[0]?.names?.[0] || '',
          leaders: extractLeaders(boxscore),
        },
        meta: {
          dataSource: 'ESPN NFL API',
          lastUpdated: new Date().toISOString(),
        },
      };

      const isCompleted = gameData.game.status.isFinal;
      const ttl = isCompleted ? 3600 : 30;

      if (env.BSI_CACHE) {
        await env.BSI_CACHE.put(cacheKey, JSON.stringify(gameData), {
          expirationTtl: ttl,
        });
      }
    }

    return new Response(JSON.stringify(gameData, null, 2), {
      status: 200,
      headers,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch game data',
        message,
      }),
      {
        status: 500,
        headers,
      }
    );
  }
};

interface Leader {
  name: string;
  stats: string;
}

interface GameLeaders {
  passing?: Leader;
  rushing?: Leader;
  receiving?: Leader;
}

function extractLeaders(boxscore: {
  players?: Array<{
    team?: { displayName?: string };
    statistics?: Array<{
      name?: string;
      keys?: string[];
      athletes?: Array<{
        athlete?: { displayName?: string };
        stats?: string[];
      }>;
    }>;
  }>;
}): GameLeaders | undefined {
  if (!boxscore?.players) return undefined;

  const leaders: GameLeaders = {};

  for (const team of boxscore.players) {
    for (const statGroup of team.statistics || []) {
      const topAthlete = statGroup.athletes?.[0];
      if (!topAthlete) continue;

      const name = topAthlete.athlete?.displayName || 'Unknown';
      const stats = topAthlete.stats?.join(', ') || '';

      if (statGroup.name === 'passing' && !leaders.passing) {
        leaders.passing = { name, stats };
      } else if (statGroup.name === 'rushing' && !leaders.rushing) {
        leaders.rushing = { name, stats };
      } else if (statGroup.name === 'receiving' && !leaders.receiving) {
        leaders.receiving = { name, stats };
      }
    }
  }

  return Object.keys(leaders).length > 0 ? leaders : undefined;
}
