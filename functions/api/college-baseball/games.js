/**
 * College Baseball Games API
 * Returns live and scheduled games with real-time updates
 *
 * Caching: 30s for live games, 5m for scheduled games
 * Data sources: ESPN API → D1Baseball → NCAA Stats (with fallback)
 */

import { fetchGames as fetchNCAAGames } from './_ncaa-adapter.js';

const CACHE_KEY_PREFIX = 'college-baseball:games';

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // CORS headers
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
    const date = url.searchParams.get('date') || getTodayDate();
    const conference = url.searchParams.get('conference');
    const status = url.searchParams.get('status'); // live, scheduled, final
    const team = url.searchParams.get('team');
    
    // Build cache key
    const cacheKey = `${CACHE_KEY_PREFIX}:${date}:${conference || 'all'}:${status || 'all'}:${team || 'all'}`;
    
    // Check cache first
    if (env.CACHE) {
      const cached = await env.CACHE.get(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        return new Response(JSON.stringify({
          success: true,
          data: data.games,
          cached: true,
          cacheTime: data.timestamp,
          source: 'cache'
        }), {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=30, stale-while-revalidate=15'
          }
        });
      }
    }

    // Fetch games from NCAA data sources
    const games = await fetchNCAAGames(date, { conference, status, team });
    
    // Store in cache
    const cacheData = {
      games,
      timestamp: new Date().toISOString(),
      filters: { date, conference, status, team }
    };
    
    // Determine TTL based on game status
    const hasLiveGames = games.some(g => g.status === 'live');
    const cacheTTL = hasLiveGames ? 30 : 300; // 30s for live, 5m for scheduled
    
    if (env.CACHE) {
      await env.CACHE.put(cacheKey, JSON.stringify(cacheData), {
        expirationTtl: cacheTTL
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: games,
      count: games.length,
      cached: false,
      timestamp: new Date().toISOString(),
      source: 'live'
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${cacheTTL}, stale-while-revalidate=${Math.floor(cacheTTL / 2)}`
      }
    });

  } catch (error) {
    console.error('College baseball games API error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch college baseball games',
      message: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
}

/**
 * Get today's date in YYYY-MM-DD format (America/Chicago timezone)
 */
function getTodayDate() {
  const today = new Date();
  // Convert to Chicago timezone
  const chicagoDate = new Date(today.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  return chicagoDate.toISOString().split('T')[0];
}
