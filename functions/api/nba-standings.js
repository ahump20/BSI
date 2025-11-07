/**
 * NBA League-wide Standings API
 * Returns standings for all NBA teams
 */

import { rateLimit, rateLimitError, corsHeaders } from './_utils.js';

export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting: 100 requests per minute per IP
  const limit = await rateLimit(env, request, 100, 60000);
  if (!limit.allowed) {
    return rateLimitError(limit.resetAt, limit.retryAfter);
  }

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    Accept: 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    Referer: 'https://www.espn.com/',
    Origin: 'https://www.espn.com'
  };

  try {
    const baseUrl = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/standings';

    const response = await fetch(baseUrl, { headers });
    if (!response.ok) {
      throw new Error(`ESPN NBA standings API returned ${response.status}`);
    }

    const data = await response.json();

    // Format standings by conference
    const standings = {
      eastern: data.children?.find(c => c.name === 'Eastern Conference') || {},
      western: data.children?.find(c => c.name === 'Western Conference') || {},
      lastUpdated: new Date().toISOString()
    };

    return new Response(JSON.stringify(standings), {
      headers: corsHeaders,
      status: 200
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to fetch NBA standings',
      message: error.message
    }), {
      headers: corsHeaders,
      status: 500
    });
  }
}