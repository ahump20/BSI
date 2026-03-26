/**
 * MLB Live Game Feed Worker
 * 
 * Fetches live game data from MLB StatsAPI with KV caching
 * and D1 persistence for game state tracking.
 * 
 * Query parameters:
 *   - gamePk: MLB game ID (required)
 * 
 * Example: /live?gamePk=745001
 */

export interface Env {
  BLAZE_KV: KVNamespace;
  BLAZE_D1: D1Database;
}

interface LiveGameResponse {
  meta: {
    source: 'statsapi.mlb.com';
    fetched_at: string;
    timezone: 'America/Chicago';
    cache_status?: string;
  };
  game_pk: string;
  live: unknown;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const gamePk = url.searchParams.get('gamePk');

    if (!gamePk) {
      return jsonResponse({
        error: 'Missing required parameter: gamePk'
      }, 400);
    }

    const cacheKey = `mlb:live:${gamePk}`;

    // Check KV cache
    const cached = await env.BLAZE_KV.get(cacheKey, 'json');
    if (cached) {
      return jsonResponse(cached, 200, { 'x-cache': 'hit' });
    }

    // Fetch from MLB StatsAPI
    const endpoint = `https://statsapi.mlb.com/api/v1/game/${gamePk}/feed/live`;

    try {
      const res = await fetchWithRetry(endpoint);
      const live = await res.json();

      // Build response with citation metadata
      const ts = new Date().toLocaleDateString('en-CA', { 
        timeZone: 'America/Chicago' 
      });

      const response: LiveGameResponse = {
        meta: {
          source: 'statsapi.mlb.com',
          fetched_at: ts,
          timezone: 'America/Chicago',
          cache_status: 'miss'
        },
        game_pk: gamePk,
        live
      };

      // Persist game state to D1
      await persistGameState(env.BLAZE_D1, gamePk, live, ts);

      // Cache for 15 seconds during live games
      const abstractState = live?.gameData?.status?.abstractGameState;
      const ttl = abstractState === 'Live' ? 15 : 60;

      await env.BLAZE_KV.put(
        cacheKey, 
        JSON.stringify(response), 
        { expirationTtl: ttl }
      );

      return jsonResponse(response, 200, { 'x-cache': 'miss' });

    } catch (error) {
      console.error('Live game fetch error:', error);
      return jsonResponse({
        error: 'Failed to fetch live game data',
        message: error instanceof Error ? error.message : 'Unknown error',
        game_pk: gamePk
      }, 502);
    }
  }
};

/**
 * Fetch with exponential backoff retry logic
 */
async function fetchWithRetry(url: string, tries = 3): Promise<Response> {
  for (let i = 0; i < tries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Blaze-Sports-Intel/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return response;

    } catch (err) {
      if (i === tries - 1) throw err;
      
      // Exponential backoff: 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, 1000 * 2 ** i));
    }
  }
  
  throw new Error('Retry logic failed');
}

/**
 * Persist game state and metadata to D1
 */
async function persistGameState(
  db: D1Database,
  gamePk: string,
  liveData: any,
  fetchedAt: string
): Promise<void> {
  try {
    const abstractState = liveData?.gameData?.status?.abstractGameState ?? 'Unknown';
    const gameDate = liveData?.gameData?.datetime?.officialDate ?? fetchedAt;
    
    const homeTeam = liveData?.gameData?.teams?.home?.name ?? null;
    const awayTeam = liveData?.gameData?.teams?.away?.name ?? null;

    await db
      .prepare(
        `INSERT INTO mlb_game_status (game_pk, state, home_team, away_team, game_date, fetched_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)
         ON CONFLICT(game_pk) DO UPDATE SET 
           state = excluded.state,
           home_team = excluded.home_team,
           away_team = excluded.away_team,
           game_date = excluded.game_date,
           fetched_at = excluded.fetched_at`
      )
      .bind(
        parseInt(gamePk),
        abstractState,
        homeTeam,
        awayTeam,
        gameDate,
        fetchedAt
      )
      .run();

  } catch (error) {
    console.error('D1 persistence error:', error);
    // Don't fail the request if D1 write fails
  }
}

/**
 * Helper to create JSON responses
 */
function jsonResponse(
  body: unknown, 
  status = 200, 
  headers: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      ...headers
    }
  });
}
