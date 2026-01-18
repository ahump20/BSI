/**
 * Blaze Sports Intel - Current User Endpoint
 * Returns authenticated user info (alias for /api/auth/session)
 *
 * Endpoint: GET /api/auth/me
 */

interface Env {
  DB: D1Database;
  KV: KVNamespace;
  JWT_SECRET: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie',
  'Content-Type': 'application/json',
};

async function verifyJWT(
  token: string,
  secret: string
): Promise<{ userId: string; email: string; tier: string } | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, sigB64] = parts;
    const message = `${headerB64}.${payloadB64}`;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const sigString = atob(sigB64.replace(/-/g, '+').replace(/_/g, '/'));
    const sigArray = new Uint8Array(sigString.length);
    for (let i = 0; i < sigString.length; i++) {
      sigArray[i] = sigString.charCodeAt(i);
    }

    const valid = await crypto.subtle.verify('HMAC', key, sigArray, encoder.encode(message));
    if (!valid) return null;

    const payload = JSON.parse(atob(payloadB64));

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      userId: payload.userId,
      email: payload.email,
      tier: payload.tier,
    };
  } catch {
    return null;
  }
}

function getCookie(request: Request, name: string): string | null {
  const cookies = request.headers.get('Cookie') || '';
  const match = cookies.match(new RegExp(`${name}=([^;]+)`));
  return match ? match[1] : null;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      token = getCookie(request, 'bsi_token');
    }

    if (!token) {
      return new Response(
        JSON.stringify({
          authenticated: false,
          user: null,
        }),
        {
          status: 200,
          headers: corsHeaders,
        }
      );
    }

    const decoded = await verifyJWT(token, env.JWT_SECRET || 'bsi-default-secret-change-me');
    if (!decoded) {
      return new Response(
        JSON.stringify({
          authenticated: false,
          user: null,
          error: 'Invalid or expired token',
        }),
        {
          status: 200,
          headers: corsHeaders,
        }
      );
    }

    const user = await env.DB.prepare(
      'SELECT id, email, name, tier, stripe_customer_id, created_at FROM users WHERE id = ?'
    )
      .bind(decoded.userId)
      .first<{
        id: string;
        email: string;
        name: string | null;
        tier: string;
        stripe_customer_id: string | null;
        created_at: string;
      }>();

    if (!user) {
      return new Response(
        JSON.stringify({
          authenticated: false,
          user: null,
          error: 'User not found',
        }),
        {
          status: 200,
          headers: corsHeaders,
        }
      );
    }

    let subscriptionStatus = null;
    if (user.stripe_customer_id) {
      const subData = await env.KV.get(`sub:${user.stripe_customer_id}`);
      if (subData) {
        subscriptionStatus = JSON.parse(subData);
      }
    }

    return new Response(
      JSON.stringify({
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          tier: user.tier,
          memberSince: user.created_at,
        },
        subscription: subscriptionStatus,
      }),
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error('Auth me error:', error);
    return new Response(
      JSON.stringify({
        authenticated: false,
        user: null,
        error: 'Session check failed',
      }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
};
