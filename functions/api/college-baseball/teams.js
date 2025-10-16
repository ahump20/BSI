/**
 * College Baseball Teams API
 * Returns NCAA Division I baseball teams with filtering
 *
 * Caching: 5 minutes
 * Data sources: ESPN API → D1Baseball → NCAA Stats (with fallback)
 */

import { fetchTeams } from './_ncaa-adapter.js';

const CACHE_KEY_PREFIX = 'college-baseball:teams';

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Parse query parameters
    const search = url.searchParams.get('search') || '';
    const conference = url.searchParams.get('conference') || '';

    const cacheKey = `${CACHE_KEY_PREFIX}:${search}:${conference}`;

    // Check cache
    if (env.CACHE) {
      const cached = await env.CACHE.get(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        return new Response(JSON.stringify({
          success: true,
          teams: data.teams,
          count: data.teams.length,
          cached: true,
          cacheTime: data.timestamp
        }), {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=300, stale-while-revalidate=60'
          }
        });
      }
    }

    // Fetch teams from NCAA data sources
    const teams = await fetchTeams({
      search: search || undefined,
      conference: conference || undefined
    });

    const cacheData = {
      teams,
      timestamp: new Date().toISOString()
    };

    if (env.CACHE) {
      await env.CACHE.put(cacheKey, JSON.stringify(cacheData), {
        expirationTtl: 300 // 5 minutes
      });
    }

    return new Response(JSON.stringify({
      success: true,
      teams,
      count: teams.length,
      cached: false,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=60'
      }
    });

  } catch (error) {
    console.error('Teams API error:', error);

    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch teams',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
