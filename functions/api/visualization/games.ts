/**
 * Cloudflare Function to get available games
 * GET /api/visualization/games
 */

import { getTodaysGames } from '../../../lib/api/mlb-statcast';

interface Env {
  KV: KVNamespace;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const env = context.env;

  // Check cache first
  const cacheKey = 'available_games';
  const cached = await env.KV.get(cacheKey);

  if (cached) {
    return new Response(cached, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  try {
    const games = await getTodaysGames();

    const response = JSON.stringify({
      date: new Date().toISOString().split('T')[0],
      games,
      count: games.length
    });

    // Cache for 5 minutes
    await env.KV.put(cacheKey, response, { expirationTtl: 300 });

    return new Response(response, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Error fetching games:', error);

    return new Response(JSON.stringify({
      error: 'Failed to fetch games',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
