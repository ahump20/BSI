/**
 * NBA League-wide Standings API
 * Returns standings for all NBA teams
 *
 * Response Contract: Uses BSI standard APIResponse format
 * - status: 'ok' | 'invalid' | 'unavailable'
 * - data: payload or null
 * - source: 'live' (real-time proxy)
 */

import { rateLimit, rateLimitError, corsHeaders } from './_utils.js';

// Minimum teams expected in each conference (NBA has 15 per conference)
const MIN_TEAMS_PER_CONFERENCE = 10;

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
    Origin: 'https://www.espn.com',
  };

  try {
    const baseUrl = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/standings';

    const response = await fetch(baseUrl, { headers });
    if (!response.ok) {
      throw new Error(`ESPN NBA standings API returned ${response.status}`);
    }

    const data = await response.json();

    // Format standings by conference
    const eastern = data.children?.find((c) => c.name === 'Eastern Conference') || {};
    const western = data.children?.find((c) => c.name === 'Western Conference') || {};

    const easternTeamCount = eastern.standings?.entries?.length || 0;
    const westernTeamCount = western.standings?.entries?.length || 0;

    // Semantic validation: Check minimum density
    if (
      easternTeamCount < MIN_TEAMS_PER_CONFERENCE ||
      westernTeamCount < MIN_TEAMS_PER_CONFERENCE
    ) {
      const lastUpdated = new Date().toISOString();
      return new Response(
        JSON.stringify({
          data: null,
          status: 'invalid',
          source: 'live',
          lastUpdated,
          reason: `Insufficient standings data: East=${easternTeamCount}, West=${westernTeamCount}, expected at least ${MIN_TEAMS_PER_CONFERENCE} per conference`,
          meta: {
            cache: { hit: false, ttlSeconds: 0 },
            planTier: 'highlightly_pro',
            quota: { remaining: 0, resetAt: '' },
          },
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'X-BSI-Status': 'invalid',
            'X-BSI-Source': 'live',
          },
        }
      );
    }

    const lastUpdated = new Date().toISOString();
    const standings = {
      eastern,
      western,
      lastUpdated,
    };

    // Standard APIResponse format
    return new Response(
      JSON.stringify({
        data: standings,
        status: 'ok',
        source: 'live',
        lastUpdated,
        reason: '',
        meta: {
          cache: { hit: false, ttlSeconds: 0 },
          planTier: 'highlightly_pro',
          quota: { remaining: 0, resetAt: '' },
        },
        // Legacy fields for backwards compatibility
        ...standings,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-BSI-Status': 'ok',
          'X-BSI-Source': 'live',
        },
      }
    );
  } catch (error) {
    // Standard APIResponse error format
    return new Response(
      JSON.stringify({
        data: null,
        status: 'unavailable',
        source: 'live',
        lastUpdated: new Date().toISOString(),
        reason: error.message || 'Failed to fetch NBA standings',
        meta: {
          cache: { hit: false, ttlSeconds: 0 },
          planTier: 'highlightly_pro',
          quota: { remaining: 0, resetAt: '' },
        },
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-BSI-Status': 'unavailable',
          'X-BSI-Source': 'live',
        },
      }
    );
  }
}
