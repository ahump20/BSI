/**
 * College Baseball Scoreboard Worker
 * 
 * Fetches ESPN college baseball scoreboard data with KV caching
 * and optional D1 persistence for historical tracking.
 * 
 * Query parameters:
 *   - date: YYYYMMDD format (optional, defaults to today)
 *   - conference: Conference filter (optional)
 * 
 * Example: /scoreboard?date=20250315
 */

export interface Env {
  BLAZE_KV: KVNamespace;
  BLAZE_D1?: D1Database;
}

interface ScoreboardResponse {
  meta: {
    source: 'ESPN college-baseball';
    fetched_at: string;
    timezone: 'America/Chicago';
    cache_status?: string;
  };
  events: unknown[];
  leagues?: unknown[];
  season?: unknown;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const date = url.searchParams.get('date') ?? '';
    const conference = url.searchParams.get('conference') ?? '';
    
    // Build cache key
    const cacheKey = `cb:scoreboard:${date || 'today'}${conference ? `:${conference}` : ''}`;

    // Check KV cache
    const cached = await env.BLAZE_KV.get(cacheKey, 'json');
    if (cached) {
      return jsonResponse(cached, 200, { 'x-cache': 'hit' });
    }

    // Fetch from ESPN API
    let endpoint = 'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/scoreboard';
    const params = new URLSearchParams();
    
    if (date) params.set('dates', date);
    if (conference) params.set('groups', conference);
    
    if (params.toString()) {
      endpoint += '?' + params.toString();
    }

    try {
      const res = await fetchWithRetry(endpoint);
      const raw = await res.json();

      // Build response with citation metadata
      const ts = new Date().toLocaleDateString('en-CA', { 
        timeZone: 'America/Chicago' 
      });

      const response: ScoreboardResponse = {
        meta: {
          source: 'ESPN college-baseball',
          fetched_at: ts,
          timezone: 'America/Chicago',
          cache_status: 'miss'
        },
        events: raw.events ?? [],
        leagues: raw.leagues,
        season: raw.season
      };

      // Optionally persist to D1 for historical tracking
      if (env.BLAZE_D1 && response.events.length > 0) {
        await persistToD1(env.BLAZE_D1, response.events, ts, date || ts);
      }

      // Cache for 30 seconds
      await env.BLAZE_KV.put(
        cacheKey, 
        JSON.stringify(response), 
        { expirationTtl: 30 }
      );

      return jsonResponse(response, 200, { 'x-cache': 'miss' });

    } catch (error) {
      console.error('Scoreboard fetch error:', error);
      return jsonResponse({
        error: 'Failed to fetch scoreboard data',
        message: error instanceof Error ? error.message : 'Unknown error'
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
 * Persist scoreboard events to D1 for historical analysis
 */
async function persistToD1(
  db: D1Database, 
  events: unknown[], 
  fetchedAt: string,
  dateYYYYMMDD: string
): Promise<void> {
  try {
    for (const event of events) {
      const eventObj = event as { id?: string };
      if (!eventObj.id) continue;

      await db
        .prepare(
          `INSERT INTO cb_scoreboard (espn_event_id, date_yyyymmdd, payload_json, fetched_at)
           VALUES (?1, ?2, ?3, ?4)
           ON CONFLICT(espn_event_id) DO UPDATE SET 
             payload_json = excluded.payload_json,
             fetched_at = excluded.fetched_at`
        )
        .bind(
          eventObj.id,
          dateYYYYMMDD.replace(/-/g, ''),
          JSON.stringify(event),
          fetchedAt
        )
        .run();
    }
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
