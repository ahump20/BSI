/**
 * Blaze Sports Intel - Email Login
 * Authenticates existing users
 *
 * Endpoint: POST /api/auth/login
 */

interface Env {
  DB: D1Database;
  KV: KVNamespace;
  JWT_SECRET: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function generateJWT(payload: Record<string, unknown>, secret: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const tokenPayload = {
    ...payload,
    iat: now,
    exp: now + 86400 * 7,
  };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '');
  const payloadB64 = btoa(JSON.stringify(tokenPayload)).replace(/=/g, '');
  const message = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${headerB64}.${payloadB64}.${sigB64}`;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    let body: LoginRequest;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const { email, password } = body;

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password required' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Find user - adapt query to available schema
    let user: {
      id: string;
      email: string;
      password_hash: string;
      name: string | null;
      tier: string;
    } | null = null;

    // Try query with tier first, fallback to basic query
    try {
      user = await env.DB.prepare(
        'SELECT id, email, password_hash, name, tier FROM users WHERE email = ?'
      )
        .bind(email.toLowerCase())
        .first();
    } catch {
      // Tier column might not exist, try without it
      const basicUser = await env.DB.prepare(
        'SELECT id, email, password_hash, name FROM users WHERE email = ?'
      )
        .bind(email.toLowerCase())
        .first<{
          id: string;
          email: string;
          password_hash: string;
          name: string | null;
        }>();

      if (basicUser) {
        user = { ...basicUser, tier: 'free' };
      }
    }

    // Default tier if null
    if (user && !user.tier) {
      user.tier = 'free';
    }

    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // Verify password
    const passwordHash = await hashPassword(password);
    if (passwordHash !== user.password_hash) {
      return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // Update last login (non-blocking - login works even if column doesn't exist)
    try {
      await env.DB.prepare('UPDATE users SET last_login = ? WHERE id = ?')
        .bind(new Date().toISOString(), user.id)
        .run();
    } catch (dbError) {
      console.log('Last login update skipped:', dbError);
    }

    // Generate token
    const token = await generateJWT(
      { userId: user.id, email: user.email, tier: user.tier },
      env.JWT_SECRET || 'bsi-default-secret-change-me'
    );

    // Store session (non-blocking - login works even if KV fails)
    try {
      await env.KV.put(
        `session:${user.id}`,
        JSON.stringify({
          userId: user.id,
          email: user.email,
          tier: user.tier,
          lastLogin: new Date().toISOString(),
        }),
        { expirationTtl: 86400 * 7 }
      );
    } catch (kvError) {
      console.log('KV session storage skipped:', kvError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          tier: user.tier,
        },
        token,
        redirectTo: '/dashboard',
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Set-Cookie': `bsi_token=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${86400 * 7}`,
        },
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    return new Response(
      JSON.stringify({
        error: 'Login failed',
      }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
};
