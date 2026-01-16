/**
 * BLAZE SPORTS INTEL - PRODUCTION MONITORING MIDDLEWARE
 *
 * Tracks critical metrics via Cloudflare Analytics Engine:
 * - API request performance and response times
 * - Error rates and types
 * - Cache hit/miss ratios
 * - CORS handling for all endpoints
 *
 * @version 2.0.0
 * @updated 2025-10-11
 */

export async function onRequest(context) {
  const { request, env, next } = context;
  const startTime = Date.now();
  const url = new URL(request.url);
  const requestId = crypto.randomUUID();

  // Extract route information for analytics
  const endpoint = url.pathname.replace('/api/', '');
  const sport = endpoint.split('/')[0] || 'unknown';
  const method = request.method;

  // CORS headers for all API responses
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization',
    'Access-Control-Max-Age': '86400', // 24 hours
    'X-Request-ID': requestId,
  };

  // Handle OPTIONS preflight requests
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  let response;
  let error = null;
  let statusCode = 200;
  let cacheStatus = 'MISS';

  try {
    // Execute the actual API handler
    response = await next();
    statusCode = response.status;

    // Check cache status from headers
    if (response.headers.has('X-Cache')) {
      cacheStatus = response.headers.get('X-Cache');
    }

    // Add CORS headers to response
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (e) {
    error = e;
    statusCode = 500;

    // Return error response with CORS
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: error.message,
        requestId,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } finally {
    // Calculate request duration
    const duration = Date.now() - startTime;

    // Track metrics asynchronously (don't block response)
    context.waitUntil(
      trackMetrics({
        env,
        requestId,
        endpoint,
        sport,
        method,
        statusCode,
        duration,
        cacheStatus,
        error: error ? error.message : null,
        timestamp: new Date().toISOString(),
      })
    );
  }
}

/**
 * Track metrics to Cloudflare Analytics Engine
 */
async function trackMetrics(data) {
  const {
    env,
    requestId,
    endpoint,
    sport,
    method,
    statusCode,
    duration,
    cacheStatus,
    error,
    timestamp,
  } = data;

  // Skip if Analytics Engine is not configured (local development)
  if (!env.ANALYTICS) {
    return;
  }

  try {
    // Write data point to Analytics Engine
    env.ANALYTICS.writeDataPoint({
      // Blobs: String dimensions (max 8)
      blobs: [
        requestId, // Unique request ID
        endpoint, // API endpoint path
        sport, // Sport category (mlb, nfl, nba, ncaa)
        method, // HTTP method
        String(statusCode), // HTTP status code
        cacheStatus, // Cache hit/miss
        error || 'none', // Error message or 'none'
        timestamp, // ISO timestamp
      ],

      // Doubles: Numeric metrics (max 20)
      doubles: [
        duration, // Request duration in ms
        statusCode === 200 ? 1 : 0, // Success flag
        statusCode >= 500 ? 1 : 0, // Server error flag
        statusCode >= 400 && statusCode < 500 ? 1 : 0, // Client error flag
        cacheStatus === 'HIT' ? 1 : 0, // Cache hit flag
        error ? 1 : 0, // Error occurred flag
        Date.now(), // Unix timestamp
      ],

      // Indexes: Additional categorical data (max 20, optional)
      indexes: [sport, endpoint],
    });
  } catch (e) {
    // Don't let analytics failures affect the API response
  }
}
