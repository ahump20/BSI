/**
 * MLB League-wide Standings API
 * Returns standings for all MLB teams
 */

import { rateLimit, rateLimitError, corsHeaders } from './_utils.js';

export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Rate limiting: 100 requests per minute per IP
  const limit = await rateLimit(env, request, 100, 60000);
  if (!limit.allowed) {
    return rateLimitError(limit.resetAt, limit.retryAfter);
  }

  try {
    const baseUrl = 'https://statsapi.mlb.com/api/v1';

    // Fetch both AL and NL standings
    const [alResponse, nlResponse] = await Promise.all([
      fetch(`${baseUrl}/standings?leagueId=103&season=2024`), // American League
      fetch(`${baseUrl}/standings?leagueId=104&season=2024`)  // National League
    ]);

    const alData = await alResponse.json();
    const nlData = await nlResponse.json();

    // Combine and format standings
    const standings = {
      americanLeague: alData.records || [],
      nationalLeague: nlData.records || [],
      lastUpdated: new Date().toISOString()
    };

    return new Response(JSON.stringify(standings), {
      headers: corsHeaders,
      status: 200
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to fetch MLB standings',
      message: error.message
    }), {
      headers: corsHeaders,
      status: 500
    });
  }
}