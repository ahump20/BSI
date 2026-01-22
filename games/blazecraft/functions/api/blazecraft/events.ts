/**
 * BlazeCraft Live Events Endpoint
 *
 * GET  /api/blazecraft/events - SSE stream of live events
 * POST /api/blazecraft/events - Receive event from Claude Code hook
 *
 * Uses KV as event queue with 60-second TTL.
 * SSE polls KV every 500ms for new events.
 */

interface Env {
  BLAZECRAFT_CACHE: KVNamespace;
  BLAZECRAFT_ANALYTICS: AnalyticsEngineDataset;
  BSI_API_KEY?: string;
}

/**
 * Check if request is authorized via Bearer token or X-API-Key header
 */
function isAuthorized(request: Request, env: Env): boolean {
  const required = env.BSI_API_KEY;
  if (!required) return true; // no key configured = allow (dev mode)
  const auth = request.headers.get('Authorization') || '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  const xKey = (request.headers.get('X-API-Key') || '').trim();
  return bearer === required || xKey === required;
}

interface BlazeCraftEvent {
  type: 'agent_spawn' | 'task_start' | 'task_complete' | 'file_edit' | 'error' | 'status';
  agentId: string;
  agentName: string;
  sessionId: string;
  timestamp: string;
  data: {
    filePath?: string;
    taskDescription?: string;
    buildingKind?: string;
    status?: 'success' | 'failure';
    message?: string;
  };
}

// Event queue key prefix
const EVENT_PREFIX = 'blazecraft:event:';
const LAST_READ_PREFIX = 'blazecraft:lastread:';

/**
 * GET - SSE stream of events
 */
async function handleSSE(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const clientId = url.searchParams.get('clientId') || crypto.randomUUID();

  // Get last read timestamp for this client
  const lastReadKey = `${LAST_READ_PREFIX}${clientId}`;
  let lastRead = parseInt((await env.BLAZECRAFT_CACHE.get(lastReadKey)) || '0', 10);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection event
      const connectEvent = `event: connected\ndata: ${JSON.stringify({ clientId, timestamp: Date.now() })}\n\n`;
      controller.enqueue(encoder.encode(connectEvent));

      // Poll for new events
      const pollInterval = 500; // ms
      let isRunning = true;

      const poll = async () => {
        if (!isRunning) return;

        try {
          // List all event keys
          const list = await env.BLAZECRAFT_CACHE.list({ prefix: EVENT_PREFIX });

          for (const key of list.keys) {
            // Extract timestamp from key: blazecraft:event:{timestamp}:{id}
            const parts = key.name.split(':');
            const eventTimestamp = parseInt(parts[2], 10);

            if (eventTimestamp > lastRead) {
              const eventData = await env.BLAZECRAFT_CACHE.get(key.name);
              if (eventData) {
                const sseMessage = `event: message\ndata: ${eventData}\n\n`;
                controller.enqueue(encoder.encode(sseMessage));
                lastRead = eventTimestamp;
              }
            }
          }

          // Update last read timestamp
          await env.BLAZECRAFT_CACHE.put(lastReadKey, lastRead.toString(), { expirationTtl: 300 });

          // Send heartbeat
          const heartbeat = `event: heartbeat\ndata: ${JSON.stringify({ timestamp: Date.now() })}\n\n`;
          controller.enqueue(encoder.encode(heartbeat));

        } catch (error) {
          console.error('[SSE] Poll error:', error);
        }

        // Schedule next poll
        if (isRunning) {
          setTimeout(poll, pollInterval);
        }
      };

      // Start polling
      poll();

      // Handle client disconnect (won't fire in Workers, but good practice)
      request.signal?.addEventListener('abort', () => {
        isRunning = false;
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    },
  });
}

/**
 * POST - Receive event from Claude Code hook
 */
async function handlePost(request: Request, env: Env): Promise<Response> {
  if (!isAuthorized(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  try {
    const body = await request.json() as Partial<BlazeCraftEvent>;

    // Validate required fields
    if (!body.type) {
      return new Response(JSON.stringify({ error: 'Missing event type' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build event with defaults
    const event: BlazeCraftEvent = {
      type: body.type,
      agentId: body.agentId || 'unknown',
      agentName: body.agentName || 'Agent',
      sessionId: body.sessionId || 'session-' + Date.now(),
      timestamp: body.timestamp || new Date().toISOString(),
      data: body.data || {},
    };

    // Store in KV with timestamp-based key for ordering
    const timestamp = Date.now();
    const eventId = crypto.randomUUID().slice(0, 8);
    const key = `${EVENT_PREFIX}${timestamp}:${eventId}`;

    await env.BLAZECRAFT_CACHE.put(key, JSON.stringify(event), {
      expirationTtl: 60, // Events expire after 60 seconds
    });

    // Log to analytics
    env.BLAZECRAFT_ANALYTICS?.writeDataPoint({
      blobs: [event.type, event.agentId, event.sessionId],
      doubles: [timestamp],
      indexes: [event.type],
    });

    return new Response(JSON.stringify({ success: true, eventId, key }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[Events] POST error:', error);
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * OPTIONS - CORS preflight
 */
function handleOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      'Access-Control-Max-Age': '86400',
    },
  });
}

/**
 * Main handler
 */
export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return handleOptions();
  }

  if (request.method === 'GET') {
    return handleSSE(request, env);
  }

  if (request.method === 'POST') {
    return handlePost(request, env);
  }

  return new Response('Method not allowed', { status: 405 });
};
