/**
 * Live Game Win Probability Worker
 *
 * Routes:
 * - POST /ingest          → Ingest play-by-play event
 * - GET  /live/:gameId    → SSE stream for live updates
 * - GET  /snapshot/:gameId → Current state + simulation snapshot
 * - GET  /health          → Health check
 */

import type { Env, PlayEvent } from './types';
import { GameCoordinator } from './game-coordinator';

export { GameCoordinator };

export default {
  /**
   * Main fetch handler
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS handling
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Ingest-Secret',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    try {
      // Health check
      if (path === '/health') {
        return handleHealth(env);
      }

      // Ingest play event
      if (path === '/ingest' && request.method === 'POST') {
        return handleIngest(request, env, ctx);
      }

      // Live SSE stream
      if (path.startsWith('/live/')) {
        const gameId = path.split('/')[2];
        if (!gameId) {
          return new Response('Game ID required', { status: 400 });
        }
        return handleLive(gameId, request, env);
      }

      // Snapshot
      if (path.startsWith('/snapshot/')) {
        const gameId = path.split('/')[2];
        if (!gameId) {
          return new Response('Game ID required', { status: 400 });
        }
        return handleSnapshot(gameId, env);
      }

      return new Response('Not Found', { status: 404 });
    } catch (error) {
      console.error('[LiveSim Worker] Error:', error);

      // Track error in Analytics
      if (env.ANALYTICS) {
        env.ANALYTICS.writeDataPoint({
          blobs: ['error', path],
          doubles: [1],
          indexes: [error instanceof Error ? error.message : 'unknown_error']
        });
      }

      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        path
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
};

/**
 * Health check endpoint
 */
function handleHealth(env: Env): Response {
  return new Response(JSON.stringify({
    status: 'ok',
    service: 'live-sim-worker',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

/**
 * Ingest play event
 *
 * POST /ingest
 * Body: PlayEvent JSON
 */
async function handleIngest(
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  // Optional: Check secret for write protection
  if (env.INGEST_SECRET) {
    const authHeader = request.headers.get('X-Ingest-Secret');
    if (authHeader !== env.INGEST_SECRET) {
      return new Response('Unauthorized', {
        status: 401,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }
  }

  // Parse event
  const event = await request.json<PlayEvent>();

  if (!event.gameId || !event.sport) {
    return new Response(JSON.stringify({
      error: 'Missing required fields: gameId, sport'
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  // Get Durable Object for this game
  const gameCoordinator = getGameCoordinator(env, event.gameId);

  // Forward event to Durable Object
  const doResponse = await gameCoordinator.fetch(new Request('https://do/ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event)
  }));

  // Track ingestion in Analytics
  if (env.ANALYTICS) {
    env.ANALYTICS.writeDataPoint({
      blobs: ['ingest', event.sport, event.gameId],
      doubles: [1],
      indexes: [event.eventType]
    });
  }

  return new Response(doResponse.body, {
    status: doResponse.status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

/**
 * Live SSE stream
 *
 * GET /live/:gameId
 * Accept: text/event-stream
 */
async function handleLive(
  gameId: string,
  request: Request,
  env: Env
): Promise<Response> {
  // Get Durable Object for this game
  const gameCoordinator = getGameCoordinator(env, gameId);

  // Forward SSE request to Durable Object
  const doRequest = new Request('https://do/live', {
    headers: {
      'Accept': 'text/event-stream'
    },
    signal: request.signal
  });

  const doResponse = await gameCoordinator.fetch(doRequest);

  // Track SSE connection in Analytics
  if (env.ANALYTICS) {
    env.ANALYTICS.writeDataPoint({
      blobs: ['sse_connect', gameId],
      doubles: [1],
      indexes: ['live']
    });
  }

  return new Response(doResponse.body, {
    status: doResponse.status,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'X-Accel-Buffering': 'no' // Disable nginx buffering for SSE
    }
  });
}

/**
 * Snapshot endpoint
 *
 * GET /snapshot/:gameId
 */
async function handleSnapshot(gameId: string, env: Env): Promise<Response> {
  // Try cache first (KV)
  const cacheKey = `snapshot:${gameId}`;
  const cached = await env.CACHE.get(cacheKey, 'json');

  if (cached) {
    return new Response(JSON.stringify(cached), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=5',
        'X-Cache': 'HIT'
      }
    });
  }

  // Get from Durable Object
  const gameCoordinator = getGameCoordinator(env, gameId);
  const doResponse = await gameCoordinator.fetch(new Request('https://do/snapshot'));

  if (doResponse.status === 200) {
    const snapshot = await doResponse.json();

    // Cache for 5 seconds
    await env.CACHE.put(cacheKey, JSON.stringify(snapshot), {
      expirationTtl: 5
    });

    return new Response(JSON.stringify(snapshot), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=5',
        'X-Cache': 'MISS'
      }
    });
  }

  return new Response(doResponse.body, {
    status: doResponse.status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

/**
 * Get Durable Object instance for game
 */
function getGameCoordinator(env: Env, gameId: string): DurableObjectStub {
  const id = env.GAME_COORDINATOR.idFromName(gameId);
  return env.GAME_COORDINATOR.get(id);
}
