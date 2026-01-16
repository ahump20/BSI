/**
 * College Baseball Standings API
 * Returns conference standings with RPI, SOS data
 *
 * Caching: 5 minutes
 * Data sources: ESPN API → D1Baseball → NCAA Stats (with fallback)
 */

import { fetchStandings as fetchNCAAStandings } from './_ncaa-adapter.js';
import { rateLimit, rateLimitError, corsHeaders } from '../_utils.js';

const CACHE_KEY_PREFIX = 'college-baseball:standings';

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Rate limiting: 100 requests per minute per IP
  const limit = await rateLimit(env, request, 100, 60000);
  if (!limit.allowed) {
    return rateLimitError(limit.resetAt, limit.retryAfter);
  }

  try {
    const conference = url.searchParams.get('conference') || 'SEC';
    const division = url.searchParams.get('division') || 'D1';

    const cacheKey = `${CACHE_KEY_PREFIX}:${conference}:${division}`;

    // Check cache
    if (env.CACHE) {
      const cached = await env.CACHE.get(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        return new Response(
          JSON.stringify({
            success: true,
            data: data.standings,
            conference: data.conference,
            cached: true,
            cacheTime: data.timestamp,
          }),
          {
            status: 200,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
              'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
            },
          }
        );
      }
    }

    // Fetch standings from NCAA data sources
    const standings = await fetchNCAAStandings(conference, division);

    const cacheData = {
      standings,
      conference,
      division,
      timestamp: new Date().toISOString(),
    };

    if (env.CACHE) {
      await env.CACHE.put(cacheKey, JSON.stringify(cacheData), {
        expirationTtl: 300, // 5 minutes
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: standings,
        conference,
        division,
        cached: false,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch standings',
        message: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}
