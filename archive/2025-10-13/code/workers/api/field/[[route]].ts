/**
 * BLAZE SPORTS INTEL - MORPHOGENIC FIELD API ENDPOINTS
 *
 * Real-time neural substrate field data and updates
 *
 * Endpoints:
 * - GET /api/field/snapshot - Get current field state (compressed)
 * - POST /api/field/update - Push field update (rate-limited)
 * - GET /api/field/tensor/:teamId - Get team's 16D latent vector
 * - WebSocket /api/field/stream - Real-time field updates
 *
 * @version 1.0.0
 * @author Austin Humphrey <austin@blazesportsintel.com>
 */

// CORS headers
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
} as const;

// Cache configuration
const TENSOR_CACHE_TTL = 300; // 5 minutes
const SNAPSHOT_CACHE_TTL = 30; // 30 seconds

/**
 * Main router
 */
export async function onRequest(context: {
  request: Request;
  env: Env;
  params: { route: string[] };
  waitUntil: (promise: Promise<any>) => void;
}): Promise<Response> {
  const { request, env, params } = context;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }

  // Extract route
  const route = params.route?.[0] || 'snapshot';

  // Route to appropriate handler
  switch (route) {
    case 'snapshot':
      return handleSnapshot(context);
    case 'update':
      return handleUpdate(context);
    case 'tensor':
      return handleTensor(context);
    case 'stream':
      return handleStream(context);
    default:
      return new Response(JSON.stringify({ error: 'Unknown route' }), {
        status: 404,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
  }
}

/**
 * GET /api/field/snapshot
 * Returns current morphogenic field state (compressed)
 */
async function handleSnapshot(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;

  try {
    // Check cache first
    const cacheKey = 'field:snapshot:latest';
    const cached = await env.CACHE?.get(cacheKey, 'json');

    if (cached && cached.expires > Date.now()) {
      return new Response(JSON.stringify(cached.data), {
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json',
          'Cache-Control': `public, max-age=${SNAPSHOT_CACHE_TTL}`,
          'X-Cache': 'HIT',
        },
      });
    }

    // Fetch latest snapshot from Durable Object
    const doId = env.SHARED_FIELD.idFromName('global-field');
    const doStub = env.SHARED_FIELD.get(doId);

    // Request snapshot from Durable Object
    const doResponse = await doStub.fetch(new Request('https://dummy/snapshot', {
      method: 'POST',
      body: JSON.stringify({ type: 'get_snapshot' }),
    }));

    if (!doResponse.ok) {
      throw new Error('Failed to fetch snapshot from Durable Object');
    }

    const snapshot = await doResponse.json();

    // Cache the snapshot
    if (env.CACHE) {
      await env.CACHE.put(
        cacheKey,
        JSON.stringify({
          data: snapshot,
          expires: Date.now() + SNAPSHOT_CACHE_TTL * 1000,
        }),
        { expirationTtl: SNAPSHOT_CACHE_TTL }
      );
    }

    return new Response(JSON.stringify(snapshot), {
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${SNAPSHOT_CACHE_TTL}`,
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.error('[Field API] Error fetching snapshot:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to fetch field snapshot',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * POST /api/field/update
 * Push field update (rate-limited to 10/sec per IP)
 */
async function handleUpdate(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;

  // Only accept POST
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Parse update payload
    const update = await request.json();

    // Validate payload
    if (!update.voxelIndex || !Array.isArray(update.voxelIndex) || update.voxelIndex.length !== 3) {
      return new Response(
        JSON.stringify({ error: 'Invalid voxelIndex (must be [x, y, z] array)' }),
        {
          status: 400,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        }
      );
    }

    if (typeof update.value !== 'number' || update.value < 0 || update.value > 255) {
      return new Response(
        JSON.stringify({ error: 'Invalid value (must be 0-255)' }),
        {
          status: 400,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        }
      );
    }

    // Rate limiting check
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    const rateLimitKey = `ratelimit:field:update:${clientIP}`;
    const rateLimitWindow = 1; // 1 second
    const rateLimitMax = 10; // 10 updates per second

    if (env.CACHE) {
      const currentCount = await env.CACHE.get(rateLimitKey);
      if (currentCount && parseInt(currentCount) >= rateLimitMax) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded (max 10 updates/sec)' }),
          {
            status: 429,
            headers: {
              ...CORS_HEADERS,
              'Content-Type': 'application/json',
              'Retry-After': String(rateLimitWindow),
            },
          }
        );
      }

      // Increment rate limit counter
      await env.CACHE.put(
        rateLimitKey,
        String((currentCount ? parseInt(currentCount) : 0) + 1),
        { expirationTtl: rateLimitWindow }
      );
    }

    // Forward update to Durable Object
    const doId = env.SHARED_FIELD.idFromName('global-field');
    const doStub = env.SHARED_FIELD.get(doId);

    const doResponse = await doStub.fetch(new Request('https://dummy/update', {
      method: 'POST',
      body: JSON.stringify({
        type: 'field_update',
        ...update,
        timestamp: Date.now(),
      }),
    }));

    if (!doResponse.ok) {
      throw new Error('Failed to update field in Durable Object');
    }

    const result = await doResponse.json();

    // Invalidate snapshot cache
    if (env.CACHE) {
      await env.CACHE.delete('field:snapshot:latest');
    }

    return new Response(JSON.stringify(result), {
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('[Field API] Error handling update:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to update field',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * GET /api/field/tensor/:teamId
 * Get team's 16D latent vector from D1 database
 */
async function handleTensor(context: {
  request: Request;
  env: Env;
  params: { route: string[] };
}): Promise<Response> {
  const { request, env, params } = context;

  const teamId = params.route?.[1];

  if (!teamId) {
    return new Response(JSON.stringify({ error: 'Missing teamId parameter' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Check cache first
    const cacheKey = `field:tensor:${teamId}`;
    const cached = await env.CACHE?.get(cacheKey, 'json');

    if (cached && cached.expires > Date.now()) {
      return new Response(JSON.stringify(cached.data), {
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json',
          'Cache-Control': `public, max-age=${TENSOR_CACHE_TTL}`,
          'X-Cache': 'HIT',
        },
      });
    }

    // Query D1 database for team tensor
    const result = await env.DB.prepare(
      'SELECT tensor_embedding, updated_at FROM teams WHERE id = ? OR code = ?'
    )
      .bind(teamId, teamId)
      .first();

    if (!result) {
      return new Response(JSON.stringify({ error: 'Team not found' }), {
        status: 404,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // Parse tensor embedding (stored as JSON array)
    const tensor = JSON.parse(result.tensor_embedding);

    const responseData = {
      teamId,
      tensor,
      dimension: tensor.length,
      updatedAt: result.updated_at,
      meta: {
        encoding: 'Float32Array',
        normalized: true,
      },
    };

    // Cache the tensor
    if (env.CACHE) {
      await env.CACHE.put(
        cacheKey,
        JSON.stringify({
          data: responseData,
          expires: Date.now() + TENSOR_CACHE_TTL * 1000,
        }),
        { expirationTtl: TENSOR_CACHE_TTL }
      );
    }

    return new Response(JSON.stringify(responseData), {
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${TENSOR_CACHE_TTL}`,
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.error('[Field API] Error fetching tensor:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to fetch team tensor',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * WebSocket /api/field/stream
 * Real-time field updates via Durable Objects
 */
async function handleStream(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;

  // Only accept WebSocket upgrades
  const upgradeHeader = request.headers.get('Upgrade');
  if (upgradeHeader !== 'websocket') {
    return new Response('Expected WebSocket upgrade', { status: 426 });
  }

  try {
    // Forward WebSocket connection to Durable Object
    const doId = env.SHARED_FIELD.idFromName('global-field');
    const doStub = env.SHARED_FIELD.get(doId);

    // Pass query params (e.g., userId) to Durable Object
    const url = new URL(request.url);
    const wsUrl = `https://dummy${url.pathname}${url.search}`;

    return doStub.fetch(new Request(wsUrl, {
      method: 'GET',
      headers: {
        'Upgrade': 'websocket',
        'Connection': 'Upgrade',
      },
    }));
  } catch (error) {
    console.error('[Field API] Error establishing WebSocket:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to establish WebSocket connection',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  }
}

// Type definitions
interface Env {
  CACHE: KVNamespace;
  DB: D1Database;
  SHARED_FIELD: DurableObjectNamespace;
}
