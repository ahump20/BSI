/**
 * Newsletter Subscription API Endpoint
 * Handles newsletter signup for Blaze Sports Intel weekly updates
 * Stores subscribers in KV for fast access, with D1 backup
 */

interface Env {
  CACHE: KVNamespace;
  DB: D1Database;
}

interface SubscribeRequest {
  email: string;
}

// Email validation regex
const EMAIL_REGEX = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

// Rate limiting: max 3 subscriptions per IP per hour
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW = 3600; // 1 hour in seconds

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://blazesportsintel.com',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  try {
    // Parse request body
    const data: SubscribeRequest = await request.json();

    // Validate email
    if (!data.email) {
      return new Response(JSON.stringify({ error: 'Email is required', success: false }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const email = data.email.toLowerCase().trim();

    if (!EMAIL_REGEX.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email format', success: false }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Check if email is too long
    if (email.length > 320) {
      return new Response(JSON.stringify({ error: 'Email too long', success: false }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Get client IP for rate limiting (hashed for privacy)
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    const ipHash = await hashIP(clientIP);

    // Check rate limit using KV
    const rateLimitKey = `newsletter-ratelimit:${ipHash}`;
    const rateLimitCount = await env.CACHE.get(rateLimitKey);
    const currentCount = rateLimitCount ? parseInt(rateLimitCount, 10) : 0;

    if (currentCount >= RATE_LIMIT_MAX) {
      return new Response(
        JSON.stringify({
          error: 'Too many subscription attempts. Please try again later.',
          success: false,
        }),
        { status: 429, headers: corsHeaders }
      );
    }

    // Check if already subscribed
    const emailHash = await hashEmail(email);
    const subscriberKey = `newsletter-subscriber:${emailHash}`;
    const existingSubscriber = await env.CACHE.get(subscriberKey);

    if (existingSubscriber) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "You're already subscribed! Check your inbox for updates.",
          alreadySubscribed: true,
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Generate subscriber ID
    const subscriberId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    // Store in KV (primary storage for fast lookup)
    await env.CACHE.put(
      subscriberKey,
      JSON.stringify({
        id: subscriberId,
        email,
        subscribedAt: timestamp,
        source: 'homepage',
        status: 'active',
      }),
      { expirationTtl: 31536000 } // 1 year TTL
    );

    // Add to subscribers list (for bulk operations)
    const subscriberListKey = 'newsletter-subscribers-list';
    const existingList = await env.CACHE.get(subscriberListKey);
    const subscribersList = existingList ? JSON.parse(existingList) : [];
    subscribersList.push({
      id: subscriberId,
      emailHash,
      subscribedAt: timestamp,
    });
    await env.CACHE.put(subscriberListKey, JSON.stringify(subscribersList));

    // Also store in D1 for backup/querying (optional, table may not exist)
    try {
      await env.DB.prepare(
        `INSERT INTO newsletter_subscribers (id, email_hash, subscribed_at, source, status)
         VALUES (?, ?, ?, ?, ?)`
      )
        .bind(subscriberId, emailHash, timestamp, 'homepage', 'active')
        .run();
    } catch (dbError) {
      // D1 backup is optional - KV is primary
      console.log('[BSI] Newsletter D1 backup skipped:', dbError);
    }

    // Update rate limit counter
    await env.CACHE.put(rateLimitKey, String(currentCount + 1), {
      expirationTtl: RATE_LIMIT_WINDOW,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "You're on the list! First issue drops when the 2025 season kicks off.",
        subscriberId,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('[BSI] Newsletter subscription error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'An error occurred. Please try again.',
      }),
      { status: 500, headers: corsHeaders }
    );
  }
};

// Handle OPTIONS for CORS preflight
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': 'https://blazesportsintel.com',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
};

// Helper functions
async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + 'blaze-newsletter-salt-2025');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .slice(0, 16)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hashEmail(email: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(email.toLowerCase() + 'blaze-email-salt-2025');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
