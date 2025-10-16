/**
 * College Baseball Players API
 * Returns NCAA baseball players with comprehensive stats and draft prospect info
 *
 * Caching: 5 minutes
 * Data sources: ESPN API → D1Baseball → NCAA Stats (with fallback)
 */

import { fetchPlayers } from './_ncaa-adapter.js';

const CACHE_KEY_PREFIX = 'college-baseball:players';

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
    const team = url.searchParams.get('team') || '';
    const position = url.searchParams.get('position') || '';
    const classYear = url.searchParams.get('class') || '';
    const draftOnly = url.searchParams.get('draft') || '';

    const cacheKey = `${CACHE_KEY_PREFIX}:${search}:${team}:${position}:${classYear}:${draftOnly}`;

    // Check cache
    if (env.CACHE) {
      const cached = await env.CACHE.get(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        return new Response(JSON.stringify({
          success: true,
          players: data.players,
          count: data.players.length,
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

    // Fetch players from NCAA data sources
    const players = await fetchPlayers({
      search: search || undefined,
      team: team || undefined,
      position: position || undefined,
      class: classYear || undefined,
      draft: draftOnly || undefined
    });

    const cacheData = {
      players,
      timestamp: new Date().toISOString()
    };

    if (env.CACHE) {
      await env.CACHE.put(cacheKey, JSON.stringify(cacheData), {
        expirationTtl: 300 // 5 minutes
      });
    }

    return new Response(JSON.stringify({
      success: true,
      players,
      count: players.length,
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
    console.error('Players API error:', error);

    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch players',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
