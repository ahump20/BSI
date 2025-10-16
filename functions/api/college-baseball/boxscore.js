/**
 * College Baseball Box Score API
 * Returns detailed box scores with batting/pitching stats
 *
 * Caching: 15s for live games, 1 hour for final games
 * Data sources: ESPN API → D1Baseball → NCAA Stats (with fallback)
 */

import { fetchBoxScore as fetchNCAABoxScore } from './_ncaa-adapter.js';

const CACHE_KEY_PREFIX = 'college-baseball:boxscore';

export async function onRequest(context) {
  const { request, env, params } = context;
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
    const gameId = url.searchParams.get('gameId');
    
    if (!gameId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required parameter: gameId'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const cacheKey = `${CACHE_KEY_PREFIX}:${gameId}`;
    
    // Check cache
    if (env.CACHE) {
      const cached = await env.CACHE.get(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        return new Response(JSON.stringify({
          success: true,
          data: data.boxscore,
          cached: true,
          cacheTime: data.timestamp,
          source: 'cache'
        }), {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=15, stale-while-revalidate=10'
          }
        });
      }
    }

    // Fetch box score from NCAA data sources
    const boxscore = await fetchNCAABoxScore(gameId);
    
    // Cache with appropriate TTL
    const cacheTTL = boxscore.status === 'final' ? 3600 : 15;
    const cacheData = {
      boxscore,
      timestamp: new Date().toISOString()
    };
    
    if (env.CACHE) {
      await env.CACHE.put(cacheKey, JSON.stringify(cacheData), {
        expirationTtl: cacheTTL
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: boxscore,
      cached: false,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${cacheTTL}, stale-while-revalidate=${Math.floor(cacheTTL / 2)}`
      }
    });

  } catch (error) {
    console.error('Box score API error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch box score',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

