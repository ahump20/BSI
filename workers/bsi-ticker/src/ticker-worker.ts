/**
 * BSI Ticker API Worker
 * Main entry point for the live sports ticker service
 * Routes: /ws, /publish, /items, /stats
 */

import {
  Env,
  PublishRequest,
  PublishResponse,
  ItemsResponse,
  TickerItem,
  QueueMessage,
  ulid,
  validateTickerItem,
  sanitizeHeadline,
  VALID_TYPES,
  VALID_LEAGUES,
} from './types';

// Re-export Durable Object for wrangler
export { TickerRoom } from './ticker-do';

// CORS headers for blazesportsintel.com
function corsHeaders(env: Env, origin?: string | null): HeadersInit {
  const allowedOrigins = env.ALLOWED_ORIGINS?.split(',') || [
    'https://blazesportsintel.com',
    'https://www.blazesportsintel.com',
    'http://localhost:3000',
  ];

  const requestOrigin = origin || '';
  const allowOrigin = allowedOrigins.includes(requestOrigin) ? requestOrigin : allowedOrigins[0];

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    'Access-Control-Max-Age': '86400',
  };
}

// Authentication check for publish endpoint
function isAuthenticated(request: Request, env: Env): boolean {
  const apiKey =
    request.headers.get('X-API-Key') ||
    request.headers.get('Authorization')?.replace('Bearer ', '');
  return apiKey === env.API_SECRET;
}

// Get the singleton Durable Object
function getTickerRoom(env: Env): DurableObjectStub {
  const id = env.TICKER_ROOM.idFromName('global-ticker');
  return env.TICKER_ROOM.get(id);
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(env, origin),
      });
    }

    try {
      switch (url.pathname) {
        case '/ws':
          return handleWebSocket(request, env);
        case '/publish':
          return handlePublish(request, env, ctx, origin);
        case '/items':
          return handleGetItems(request, env, origin);
        case '/stats':
          return handleGetStats(request, env, origin);
        case '/health':
          return handleHealth(env, origin);
        default:
          return new Response('Not Found', {
            status: 404,
            headers: corsHeaders(env, origin),
          });
      }
    } catch (error) {
      console.error('Worker error:', error);
      return Response.json(
        { error: 'Internal Server Error' },
        {
          status: 500,
          headers: corsHeaders(env, origin),
        }
      );
    }
  },

  // Queue consumer handler
  async queue(batch: MessageBatch<QueueMessage>, env: Env): Promise<void> {
    const tickerRoom = getTickerRoom(env);

    for (const message of batch.messages) {
      try {
        const queueItem = message.body;

        // Create ticker item from queue message
        const item: TickerItem = {
          id: queueItem.id || ulid(),
          type: queueItem.type,
          league: queueItem.league,
          headline: sanitizeHeadline(queueItem.headline),
          timestamp: Date.now(),
          priority: queueItem.priority || 3,
          metadata: queueItem.metadata,
        };

        // Validate
        if (!validateTickerItem(item)) {
          console.error('Invalid queue message:', queueItem);
          message.ack();
          continue;
        }

        // Broadcast to Durable Object
        await tickerRoom.fetch('https://ticker/broadcast', {
          method: 'POST',
          body: JSON.stringify(item),
        });

        // Store in D1 for history
        await env.BSI_TICKER_DB.prepare(
          `INSERT INTO ticker_history (id, type, league, headline, priority, metadata, timestamp, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`
        )
          .bind(
            item.id,
            item.type,
            item.league,
            item.headline,
            item.priority,
            item.metadata ? JSON.stringify(item.metadata) : null,
            item.timestamp
          )
          .run();

        // Update KV cache
        const currentItems = (await tickerRoom
          .fetch('https://ticker/items')
          .then((r) => r.json())) as ItemsResponse;
        await env.BSI_TICKER_CACHE.put('current_items', JSON.stringify(currentItems.items), {
          expirationTtl: 300, // 5 min TTL
        });

        message.ack();
      } catch (error) {
        console.error('Queue processing error:', error);
        message.retry();
      }
    }
  },
};

// WebSocket upgrade handler
async function handleWebSocket(request: Request, env: Env): Promise<Response> {
  if (request.headers.get('Upgrade') !== 'websocket') {
    return new Response('Expected WebSocket', { status: 426 });
  }

  const tickerRoom = getTickerRoom(env);
  return tickerRoom.fetch(request);
}

// Publish new ticker item
async function handlePublish(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  origin: string | null
): Promise<Response> {
  const headers = corsHeaders(env, origin);

  // Authenticate
  if (!isAuthenticated(request, env)) {
    return Response.json({ success: false, error: 'Unauthorized' } as PublishResponse, {
      status: 401,
      headers,
    });
  }

  // Parse request
  let body: PublishRequest;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: 'Invalid JSON' } as PublishResponse, {
      status: 400,
      headers,
    });
  }

  // Validate
  if (!body.type || !VALID_TYPES.includes(body.type)) {
    return Response.json(
      {
        success: false,
        error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`,
      } as PublishResponse,
      { status: 400, headers }
    );
  }

  if (!body.league || !VALID_LEAGUES.includes(body.league)) {
    return Response.json(
      {
        success: false,
        error: `Invalid league. Must be one of: ${VALID_LEAGUES.join(', ')}`,
      } as PublishResponse,
      { status: 400, headers }
    );
  }

  if (!body.headline || body.headline.trim().length === 0) {
    return Response.json({ success: false, error: 'Headline is required' } as PublishResponse, {
      status: 400,
      headers,
    });
  }

  // Create item
  const item: TickerItem = {
    id: ulid(),
    type: body.type,
    league: body.league,
    headline: sanitizeHeadline(body.headline),
    timestamp: Date.now(),
    priority: body.priority || 3,
    metadata: body.metadata,
  };

  // Send to queue for processing
  await env.BSI_TICKER_QUEUE.send({
    id: item.id,
    type: item.type,
    league: item.league,
    headline: item.headline,
    priority: item.priority,
    metadata: item.metadata,
    source: 'api',
  });

  return Response.json({ success: true, item } as PublishResponse, { status: 201, headers });
}

// Get current ticker items
async function handleGetItems(
  request: Request,
  env: Env,
  origin: string | null
): Promise<Response> {
  const headers = corsHeaders(env, origin);
  const url = new URL(request.url);

  // Try KV cache first for non-WebSocket clients
  const cached = await env.BSI_TICKER_CACHE.get('current_items');
  if (cached) {
    const items = JSON.parse(cached) as TickerItem[];

    // Apply filters from query params
    const filteredItems = filterItems(items, url.searchParams);

    return Response.json(
      {
        items: filteredItems,
        count: filteredItems.length,
        timestamp: Date.now(),
        cached: true,
      } as ItemsResponse & { cached: boolean },
      { headers }
    );
  }

  // Fall back to Durable Object
  const tickerRoom = getTickerRoom(env);
  const response = await tickerRoom.fetch('https://ticker/items');
  const data = (await response.json()) as ItemsResponse;

  // Apply filters
  const filteredItems = filterItems(data.items, url.searchParams);

  return Response.json(
    {
      items: filteredItems,
      count: filteredItems.length,
      timestamp: Date.now(),
      cached: false,
    },
    { headers }
  );
}

// Filter items based on query params
function filterItems(items: TickerItem[], params: URLSearchParams): TickerItem[] {
  let filtered = items;

  const leagues = params.get('leagues')?.split(',');
  if (leagues?.length) {
    filtered = filtered.filter((item) => leagues.includes(item.league));
  }

  const types = params.get('types')?.split(',');
  if (types?.length) {
    filtered = filtered.filter((item) => types.includes(item.type));
  }

  const minPriority = parseInt(params.get('priority') || '3', 10);
  filtered = filtered.filter((item) => item.priority <= minPriority);

  const limit = parseInt(params.get('limit') || '50', 10);
  filtered = filtered.slice(0, Math.min(limit, 50));

  return filtered;
}

// Get ticker stats
async function handleGetStats(
  request: Request,
  env: Env,
  origin: string | null
): Promise<Response> {
  const headers = corsHeaders(env, origin);

  // Require auth for stats
  if (!isAuthenticated(request, env)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401, headers });
  }

  const tickerRoom = getTickerRoom(env);
  const response = await tickerRoom.fetch('https://ticker/stats');
  const stats = await response.json();

  return Response.json(stats, { headers });
}

// Health check
async function handleHealth(env: Env, origin: string | null): Promise<Response> {
  const headers = corsHeaders(env, origin);

  try {
    // Check D1
    await env.BSI_TICKER_DB.prepare('SELECT 1').first();

    // Check KV
    await env.BSI_TICKER_CACHE.get('health_check');

    return Response.json(
      {
        status: 'healthy',
        timestamp: Date.now(),
        services: {
          d1: 'ok',
          kv: 'ok',
          do: 'ok',
        },
      },
      { headers }
    );
  } catch (error) {
    return Response.json(
      {
        status: 'degraded',
        timestamp: Date.now(),
        error: String(error),
      },
      { status: 503, headers }
    );
  }
}
