/**
 * Blaze Sports Intel - Web Vitals Analytics Endpoint
 * Receives and stores Core Web Vitals metrics for performance monitoring
 *
 * @endpoint POST /api/analytics/vitals
 * @rateLimit 60 requests per minute per IP
 */

import type { PagesFunction } from '@cloudflare/workers-types';

interface Env {
  KV: KVNamespace;
  ANALYTICS?: AnalyticsEngineDataset;
}

interface WebVital {
  name: 'LCP' | 'INP' | 'CLS' | 'FCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
  page: {
    url: string;
    referrer: string;
    title: string;
  };
  device: {
    userAgent: string;
    viewport: {
      width: number;
      height: number;
    };
    connection?: {
      effectiveType: string;
      downlink: number;
      rtt: number;
    };
  };
  timestamp: string;
  timezone: string;
}

/**
 * Rate limiter using KV namespace
 * Limits requests to 60 per minute per IP address
 */
async function checkRateLimit(
  kv: KVNamespace,
  ip: string
): Promise<{ allowed: boolean; remaining: number }> {
  const key = `rate_limit:vitals:${ip}`;
  const now = Date.now();
  const window = 60 * 1000; // 1 minute
  const limit = 60; // 60 requests per minute

  // Get existing requests
  const existing = await kv.get<number[]>(key, 'json');

  // Filter requests within current window
  const recentRequests = (existing || []).filter((timestamp) => now - timestamp < window);

  // Check if limit exceeded
  if (recentRequests.length >= limit) {
    return {
      allowed: false,
      remaining: 0,
    };
  }

  // Add current request
  recentRequests.push(now);

  // Store updated list (expires after window)
  await kv.put(key, JSON.stringify(recentRequests), {
    expirationTtl: Math.ceil(window / 1000),
  });

  return {
    allowed: true,
    remaining: limit - recentRequests.length,
  };
}

/**
 * Validate Web Vitals payload
 */
function isValidWebVital(data: any): data is WebVital {
  const validNames = ['LCP', 'INP', 'CLS', 'FCP', 'TTFB'];
  const validRatings = ['good', 'needs-improvement', 'poor'];

  return (
    typeof data === 'object' &&
    validNames.includes(data.name) &&
    typeof data.value === 'number' &&
    validRatings.includes(data.rating) &&
    typeof data.id === 'string' &&
    typeof data.page?.url === 'string' &&
    typeof data.timestamp === 'string'
  );
}

/**
 * Handle OPTIONS preflight request
 */
export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
};

/**
 * Handle POST request - Store Web Vitals data
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    // Get client IP for rate limiting
    const ip =
      request.headers.get('CF-Connecting-IP') ||
      request.headers.get('X-Forwarded-For') ||
      'unknown';

    // Check rate limit
    const rateLimit = await checkRateLimit(env.KV, ip);

    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again in a minute.',
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Retry-After': '60',
            'X-RateLimit-Limit': '60',
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    // Parse and validate payload
    const vitals: WebVital = await request.json();

    if (!isValidWebVital(vitals)) {
      return new Response(
        JSON.stringify({
          error: 'Invalid payload',
          message: 'Web Vitals data does not match expected schema',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Write to Analytics Engine (if available)
    if (env.ANALYTICS) {
      try {
        await env.ANALYTICS.writeDataPoint({
          // String indices for filtering
          indexes: [vitals.name],

          // Categorical data
          blobs: [
            vitals.rating,
            vitals.page.url,
            vitals.navigationType,
            vitals.device.userAgent,
            vitals.device.connection?.effectiveType || 'unknown',
          ],

          // Numeric data
          doubles: [
            vitals.value,
            vitals.delta,
            vitals.device.viewport.width,
            vitals.device.viewport.height,
            vitals.device.connection?.downlink || 0,
            vitals.device.connection?.rtt || 0,
          ],
        });
      } catch (analyticsError) {
        console.error('[Analytics Engine] Failed to write:', analyticsError);
        // Don't fail the request if analytics fails
      }
    }

    // Also store raw data in KV for detailed analysis (sampled)
    // Only store 10% of requests to avoid bloating KV
    if (Math.random() < 0.1) {
      const storageKey = `vitals:${vitals.name}:${vitals.id}`;
      await env.KV.put(storageKey, JSON.stringify(vitals), {
        expirationTtl: 7 * 24 * 60 * 60, // 7 days
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Web Vitals data recorded',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'X-RateLimit-Limit': '60',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        },
      }
    );
  } catch (error) {
    console.error('[Web Vitals API] Error:', error);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'Failed to process Web Vitals data',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
};
