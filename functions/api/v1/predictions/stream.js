/**
 * Blaze Sports Intel - Real-Time Prediction Streaming API
 *
 * Manages live prediction streams for games with WebSocket/SSE support.
 *
 * Endpoints:
 * - POST /api/v1/predictions/stream/init?gameId=123&sport=NFL
 * - GET /api/v1/predictions/stream/live?gameId=123
 * - GET /api/v1/predictions/stream/history?gameId=123
 * - GET /api/v1/predictions/stream/status?gameId=123
 * - GET /api/v1/predictions/stream/metrics?gameId=123
 * - GET /api/v1/predictions/stream/poll?gameId=123 (SSE polling)
 * - POST /api/v1/predictions/stream/stop?gameId=123
 */

import {
  initializePredictionStream,
  updateLivePredictions,
  getPredictionHistory,
  getStreamStatus,
  getPredictionMetrics,
  stopPredictionStream,
  identifyKeyMoments
} from '../../../../lib/ml/prediction-stream-manager.js';
import { rateLimit, rateLimitError, corsHeaders } from '../../_utils.js';

export async function onRequest(context) {
  const { request, env } = context;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Rate limiting: 100 requests per minute per IP
  const limit = await rateLimit(env, request, 100, 60000);
  if (!limit.allowed) {
    return rateLimitError(limit.resetAt, limit.retryAfter);
  }

  const url = new URL(request.url);
  const gameId = url.searchParams.get('gameId');
  const action = url.pathname.split('/').pop(); // 'init', 'live', 'history', 'status', 'metrics', 'poll', 'stop'

  try {
    let result;

    switch (action) {
      case 'init':
        // Initialize prediction stream
        if (!gameId) {
          throw new Error('gameId required for stream initialization');
        }
        if (request.method !== 'POST') {
          throw new Error('POST method required for stream initialization');
        }
        result = await initializePredictionStream(gameId, env);
        break;

      case 'live':
        // Get current live prediction
        if (!gameId) {
          throw new Error('gameId required for live predictions');
        }
        result = await updateLivePredictions(gameId, env);
        break;

      case 'history':
        // Get prediction history
        if (!gameId) {
          throw new Error('gameId required for prediction history');
        }
        const history = await getPredictionHistory(gameId, env);
        const keyMoments = identifyKeyMoments(history);

        result = {
          gameId: gameId,
          historyCount: history.length,
          history: history,
          keyMoments: keyMoments,
          meta: {
            oldestTimestamp: history.length > 0 ? history[0].timestamp : null,
            latestTimestamp: history.length > 0 ? history[history.length - 1].timestamp : null,
            dataPoints: history.length
          }
        };
        break;

      case 'status':
        // Get stream status
        if (!gameId) {
          throw new Error('gameId required for stream status');
        }
        result = await getStreamStatus(gameId, env);
        break;

      case 'metrics':
        // Get prediction performance metrics
        if (!gameId) {
          throw new Error('gameId required for prediction metrics');
        }
        result = await getPredictionMetrics(gameId, env);
        break;

      case 'poll':
        // Server-Sent Events polling endpoint
        if (!gameId) {
          throw new Error('gameId required for polling');
        }
        return await handleSSEPolling(gameId, env);

      case 'stop':
        // Stop prediction stream
        if (!gameId) {
          throw new Error('gameId required to stop stream');
        }
        if (request.method !== 'POST') {
          throw new Error('POST method required to stop stream');
        }
        result = await stopPredictionStream(gameId, env);
        break;

      default:
        throw new Error(`Unknown action: ${action}. Valid actions: init, live, history, status, metrics, poll, stop`);
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': action === 'live' || action === 'poll'
          ? 'no-cache, no-store, must-revalidate'
          : 'public, max-age=60, s-maxage=120'
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to process prediction stream request',
      message: error.message,
      action: action
    }), {
      status: error.message.includes('required') ? 400 : 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
}

/**
 * Handle Server-Sent Events (SSE) polling
 * Provides real-time updates via long-polling mechanism
 */
async function handleSSEPolling(gameId, env) {
  try {
    // Get current stream status
    const streamStatus = await getStreamStatus(gameId, env);

    if (streamStatus.status === 'not_initialized') {
      return new Response(JSON.stringify({
        error: 'Stream not initialized',
        gameId: gameId
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Check for broadcast message in KV
    const broadcastKey = `broadcast:${gameId}`;
    const broadcastMessage = await env.SPORTS_DATA_KV.get(broadcastKey, 'json');

    if (broadcastMessage) {
      // Return SSE-formatted response
      const sseData = `data: ${JSON.stringify(broadcastMessage)}\n\n`;

      return new Response(sseData, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
    } else {
      // No new data, return empty SSE response
      return new Response('data: {"type":"heartbeat"}\n\n', {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
    }

  } catch (error) {
    return new Response(JSON.stringify({
      error: 'SSE polling failed',
      message: error.message
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
 * WebSocket handler (Durable Object integration)
 * This would be implemented with Cloudflare Durable Objects for true WebSocket support
 *
 * Example Durable Object class structure:
 *
 * export class PredictionStreamDO {
 *   constructor(state, env) {
 *     this.state = state;
 *     this.env = env;
 *     this.sessions = new Set();
 *   }
 *
 *   async fetch(request) {
 *     const upgradeHeader = request.headers.get('Upgrade');
 *     if (upgradeHeader !== 'websocket') {
 *       return new Response('Expected WebSocket', { status: 400 });
 *     }
 *
 *     const [client, server] = Object.values(new WebSocketPair());
 *
 *     this.handleSession(server);
 *
 *     return new Response(null, {
 *       status: 101,
 *       webSocket: client
 *     });
 *   }
 *
 *   handleSession(webSocket) {
 *     webSocket.accept();
 *     this.sessions.add(webSocket);
 *
 *     webSocket.addEventListener('message', async (msg) => {
 *       const data = JSON.parse(msg.data);
 *
 *       if (data.action === 'subscribe') {
 *         // Subscribe to game predictions
 *         await this.subscribeToGame(data.gameId, webSocket);
 *       }
 *     });
 *
 *     webSocket.addEventListener('close', () => {
 *       this.sessions.delete(webSocket);
 *     });
 *   }
 *
 *   async broadcast(message) {
 *     const messageStr = JSON.stringify(message);
 *     this.sessions.forEach(session => {
 *       try {
 *         session.send(messageStr);
 *       } catch (err) {
 *         console.error('WebSocket send error:', err);
 *       }
 *     });
 *   }
 * }
 */

/**
 * Scheduled worker for automatic prediction updates
 * Add this to wrangler.toml:
 *
 * [triggers]
 * crons = ["0,30 * * * * *"]  # Every 30 seconds
 *
 * export default {
 *   async scheduled(event, env, ctx) {
 *     // Get all active streams
 *     const activeStreams = await getActiveStreams(env);
 *
 *     // Update predictions for each active game
 *     for (const gameId of activeStreams) {
 *       try {
 *         const prediction = await updateLivePredictions(gameId, env);
 *         await broadcastPredictionUpdate(gameId, prediction, env);
 *       } catch (error) {
 *         console.error(`Failed to update predictions for game ${gameId}:`, error);
 *       }
 *     }
 *   }
 * };
 *
 * async function getActiveStreams(env) {
 *   // Query KV for all active stream keys
 *   const list = await env.SPORTS_DATA_KV.list({ prefix: 'stream:' });
 *
 *   const activeGames = [];
 *   for (const key of list.keys) {
 *     const streamData = await env.SPORTS_DATA_KV.get(key.name, 'json');
 *     if (streamData && streamData.status === 'active') {
 *       activeGames.push(streamData.gameId);
 *     }
 *   }
 *
 *   return activeGames;
 * }
 */
