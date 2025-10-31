/**
 * Cloudflare Function to sync MLB StatCast data
 * GET /api/visualization/sync/[gameId]
 */

import { syncGameData } from '../../../../lib/api/mlb-statcast';

interface Env {
  DB: D1Database;
  KV: KVNamespace;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { gameId } = context.params;
  const env = context.env;

  if (!gameId || typeof gameId !== 'string') {
    return new Response(JSON.stringify({ error: 'Invalid game ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    console.log(`Syncing data for game ${gameId}...`);

    const result = await syncGameData(env.DB, gameId);

    // Clear cache for this game after sync
    await env.KV.delete(`pitches:${gameId}`);

    return new Response(JSON.stringify({
      success: result.success,
      gameId,
      pitchCount: result.pitchCount,
      message: `Successfully synced ${result.pitchCount} pitches`
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Error syncing game data:', error);

    return new Response(JSON.stringify({
      error: 'Failed to sync game data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  // Support POST for triggering sync via webhook
  return onRequestGet(context);
};
