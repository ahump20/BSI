/**
 * Web Vitals Analytics Endpoint
 * Receives and stores Core Web Vitals metrics from real users
 *
 * POST /api/analytics/vitals
 * Body: { name, value, rating, delta, id, page, device, timestamp }
 *
 * Stores metrics in:
 * - Cloudflare Analytics Engine (for aggregation)
 * - Cloudflare KV (for recent metrics)
 */

export async function onRequest(context) {
  const { request, env } = context;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle OPTIONS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  // Only allow POST
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const metric = await request.json();

    // Validate required fields
    if (!metric.name || !metric.value || !metric.page?.url) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Normalize metric data
    const normalizedMetric = {
      name: metric.name,
      value: Math.round(metric.value),
      rating: metric.rating || 'unknown',
      delta: Math.round(metric.delta || 0),
      id: metric.id || 'unknown',
      navigationType: metric.navigationType || 'unknown',

      // Page context
      page_url: metric.page.url,
      page_title: metric.page.title || '',
      page_referrer: metric.page.referrer || '',

      // Device context
      user_agent: metric.device?.userAgent?.substring(0, 200) || '',
      viewport_width: metric.device?.viewport?.width || 0,
      viewport_height: metric.device?.viewport?.height || 0,
      connection_type: metric.device?.connection?.effectiveType || 'unknown',
      connection_downlink: metric.device?.connection?.downlink || 0,
      connection_rtt: metric.device?.connection?.rtt || 0,

      // Timing
      timestamp: metric.timestamp || new Date().toISOString(),
      timezone: metric.timezone || 'America/Chicago'
    };

    // Store in Analytics Engine (if available)
    if (env.ANALYTICS) {
      try {
        env.ANALYTICS.writeDataPoint({
          // Blobs (string dimensions) - max 20
          blobs: [
            metric.name,                    // Metric name (LCP, INP, CLS, FCP, TTFB)
            metric.rating,                  // good, needs-improvement, poor
            metric.page.url,                // Page URL
            metric.navigationType || 'unknown', // navigate, reload, back-forward, prerender
            metric.device?.connection?.effectiveType || 'unknown', // 4g, 3g, 2g, slow-2g
            metric.device?.viewport ? `${metric.device.viewport.width}x${metric.device.viewport.height}` : 'unknown'
          ],

          // Doubles (numeric metrics) - max 20
          doubles: [
            metric.value,                   // Metric value
            metric.delta || 0,              // Delta from previous
            metric.device?.viewport?.width || 0,
            metric.device?.viewport?.height || 0,
            metric.device?.connection?.downlink || 0,
            metric.device?.connection?.rtt || 0
          ],

          // Indexes (categorical dimensions for grouping)
          indexes: [metric.name]
        });
      } catch (analyticsError) {
        console.error('[Web Vitals] Analytics Engine write failed:', analyticsError);
        // Don't fail the request if Analytics Engine is down
      }
    }

    // Store in KV for recent metrics dashboard (if available)
    if (env.CACHE_KV) {
      try {
        const kvKey = `vitals:recent:${metric.name}:${Date.now()}`;
        await env.CACHE_KV.put(kvKey, JSON.stringify(normalizedMetric), {
          expirationTtl: 86400 // Keep for 24 hours
        });

        // Also maintain a "latest" key for quick access
        const latestKey = `vitals:latest:${metric.name}:${metric.page.url}`;
        await env.CACHE_KV.put(latestKey, JSON.stringify(normalizedMetric), {
          expirationTtl: 3600 // Keep for 1 hour
        });
      } catch (kvError) {
        console.error('[Web Vitals] KV write failed:', kvError);
        // Don't fail the request if KV is down
      }
    }

    // Log to console in development
    if (env.ENVIRONMENT !== 'production') {
      console.log('[Web Vitals] Received metric:', {
        name: metric.name,
        value: Math.round(metric.value),
        rating: metric.rating,
        page: metric.page.url
      });
    }

    // Success response
    return new Response(JSON.stringify({
      success: true,
      metric: metric.name,
      value: Math.round(metric.value),
      rating: metric.rating
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });

  } catch (error) {
    console.error('[Web Vitals] Error processing metric:', error);

    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
