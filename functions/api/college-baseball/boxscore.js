/**
 * College Baseball Box Score API
 * Returns detailed box scores with batting/pitching stats
 *
 * Caching: 15s for live games, 1 hour for final games
 * Data sources: ESPN API → D1Baseball → NCAA Stats (with fallback)
 */

import { fetchBoxScore as fetchNCAABoxScore } from './_ncaa-adapter.js';
import { rateLimit, rateLimitError, corsHeaders } from '../_utils.js';

const CACHE_KEY_PREFIX = 'college-baseball:boxscore';

export async function onRequest(context) {
  const { request, env, params } = context;
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
    const gameId = url.searchParams.get('gameId');

    if (!gameId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required parameter: gameId',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const cacheKey = `${CACHE_KEY_PREFIX}:${gameId}`;

    // Check cache
    if (env.CACHE) {
      const cached = await env.CACHE.get(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        return new Response(
          JSON.stringify({
            success: true,
            data: data.boxscore,
            cached: true,
            cacheTime: data.timestamp,
            source: 'cache',
          }),
          {
            status: 200,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
              'Cache-Control': 'public, max-age=15, stale-while-revalidate=10',
            },
          }
        );
      }
    }

    // Fetch box score from NCAA data sources
    const boxscore = await fetchNCAABoxScore(gameId);

    // Cache with appropriate TTL
    const cacheTTL = boxscore.status === 'final' ? 3600 : 15;
    const cacheData = {
      boxscore,
      timestamp: new Date().toISOString(),
    };

    if (env.CACHE) {
      await env.CACHE.put(cacheKey, JSON.stringify(cacheData), {
        expirationTtl: cacheTTL,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: boxscore,
        cached: false,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': `public, max-age=${cacheTTL}, stale-while-revalidate=${Math.floor(cacheTTL / 2)}`,
        },
      }
    );
  } catch (error) {
    // Determine the error type and provide helpful guidance
    const isESPNError = error.message.includes('ESPN API returned');
    const isNotFoundError = error.message.includes('400') || error.message.includes('404');

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch box score',
        message: error.message,
        guidance: isNotFoundError
          ? {
              reason:
                'The requested game may not have box score data available. This can happen for games that are too old, too recent, or during the off-season.',
              suggestions: [
                'Verify the gameId is a valid ESPN game ID (e.g., 401778104)',
                'Check /api/college-baseball/schedule to find games with available data',
                'College baseball season runs February through June',
              ],
              season: '2025 season starts February 14, 2026',
            }
          : undefined,
        timestamp: new Date().toISOString(),
      }),
      {
        status: isNotFoundError ? 404 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}
