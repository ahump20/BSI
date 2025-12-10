/**
 * Newsletter Signup Handler
 *
 * Stores newsletter signups in KV with rate limiting
 * Endpoint: POST /api/newsletter
 */

interface Env {
  KV: KVNamespace;
}

interface NewsletterSignup {
  email: string;
  source?: string;
  timestamp: string;
  ip?: string;
}

// Simple email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

// Rate limiting: max 5 signups per IP per hour
async function checkRateLimit(env: Env, ip: string): Promise<boolean> {
  const key = `rate_limit:newsletter:${ip}`;
  const count = parseInt((await env.KV.get(key)) || '0');
  return count < 5;
}

async function incrementRateLimit(env: Env, ip: string): Promise<void> {
  const key = `rate_limit:newsletter:${ip}`;
  const count = parseInt((await env.KV.get(key)) || '0');
  await env.KV.put(key, String(count + 1), { expirationTtl: 3600 }); // 1 hour TTL
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

    // Check rate limit
    if (!(await checkRateLimit(env, ip))) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Too many signup attempts. Please try again later.',
        }),
        { status: 429, headers }
      );
    }

    // Parse request body
    const body = (await request.json()) as { email?: string; source?: string };
    const { email, source } = body;

    // Validate email
    if (!email || !isValidEmail(email)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Please provide a valid email address.',
        }),
        { status: 400, headers }
      );
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check for duplicate
    const existingKey = `newsletter:${normalizedEmail}`;
    const existing = await env.KV.get(existingKey);
    if (existing) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "You're already subscribed! Thanks for your interest.",
        }),
        { status: 200, headers }
      );
    }

    // Create signup record
    const signup: NewsletterSignup = {
      email: normalizedEmail,
      source: source || 'website',
      timestamp: new Date().toISOString(),
      ip: ip !== 'unknown' ? ip : undefined,
    };

    // Store in KV
    await env.KV.put(existingKey, JSON.stringify(signup));

    // Also add to a list for easy retrieval
    const listKey = 'newsletter:subscribers';
    const existingList = await env.KV.get(listKey);
    const subscribers = existingList ? JSON.parse(existingList) : [];
    subscribers.push({
      email: normalizedEmail,
      signedUpAt: signup.timestamp,
    });
    await env.KV.put(listKey, JSON.stringify(subscribers));

    // Increment rate limit
    await incrementRateLimit(env, ip);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Welcome to Blaze Sports Intel! You'll get real analytics, delivered weekly.",
      }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error('Newsletter signup error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Something went wrong. Please try again.',
      }),
      { status: 500, headers }
    );
  }
};

// Handle OPTIONS for CORS preflight
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
