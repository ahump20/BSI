/**
 * Blaze Sports Intel - Google OAuth Callback
 * Handles the OAuth callback from Google
 *
 * Endpoint: GET /api/auth/google/callback
 */

interface Env {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  DB: D1Database;
  KV: KVNamespace;
  JWT_SECRET: string;
}

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

function generateUserId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'usr_';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
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
  const url = new URL(request.url);
  const origin = url.origin;

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  // Handle OAuth errors
  if (error) {
    return Response.redirect(`${origin}/login?error=${encodeURIComponent(error)}`, 302);
  }

  if (!code || !state) {
    return Response.redirect(`${origin}/login?error=missing_params`, 302);
  }

  // Verify state
  const storedState = await env.KV.get(`oauth_state:${state}`);
  if (!storedState) {
    return Response.redirect(`${origin}/login?error=invalid_state`, 302);
  }
  await env.KV.delete(`oauth_state:${state}`);

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${origin}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', await tokenResponse.text());
      return Response.redirect(`${origin}/login?error=token_exchange_failed`, 302);
    }

    const tokens: GoogleTokenResponse = await tokenResponse.json();

    // Get user info
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoResponse.ok) {
      return Response.redirect(`${origin}/login?error=userinfo_failed`, 302);
    }

    const googleUser: GoogleUserInfo = await userInfoResponse.json();

    // Initialize tables
    try {
      await env.DB.prepare(
        `
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT,
          name TEXT,
          tier TEXT DEFAULT 'free',
          stripe_customer_id TEXT,
          google_id TEXT,
          picture TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          last_login TEXT,
          email_verified INTEGER DEFAULT 0
        )
      `
      ).run();
    } catch (e) {
      console.log('Tables exist');
    }

    // Check if user exists
    let user = await env.DB.prepare(
      'SELECT id, email, name, tier FROM users WHERE email = ? OR google_id = ?'
    )
      .bind(googleUser.email.toLowerCase(), googleUser.id)
      .first<{
        id: string;
        email: string;
        name: string | null;
        tier: string;
      }>();

    const now = new Date().toISOString();

    if (!user) {
      // Create new user
      const userId = generateUserId();
      await env.DB.prepare(
        `
        INSERT INTO users (id, email, name, tier, google_id, picture, email_verified, created_at, updated_at, last_login)
        VALUES (?, ?, ?, 'free', ?, ?, 1, ?, ?, ?)
      `
      )
        .bind(
          userId,
          googleUser.email.toLowerCase(),
          googleUser.name,
          googleUser.id,
          googleUser.picture || null,
          now,
          now,
          now
        )
        .run();

      user = {
        id: userId,
        email: googleUser.email.toLowerCase(),
        name: googleUser.name,
        tier: 'free',
      };

      // Log new signup
      console.log(`🎉 NEW GOOGLE SIGNUP: ${googleUser.email} (${googleUser.name}) at ${now}`);

      // Store signup notification
      await env.KV.put(
        `signup:${Date.now()}`,
        JSON.stringify({
          type: 'new_signup',
          method: 'google',
          email: googleUser.email.toLowerCase(),
          name: googleUser.name,
          timestamp: now,
          userId,
        }),
        { expirationTtl: 86400 * 30 }
      );
    } else {
      // Update existing user
      await env.DB.prepare(
        `
        UPDATE users SET google_id = ?, picture = ?, last_login = ?, updated_at = ?, email_verified = 1
        WHERE id = ?
      `
      )
        .bind(googleUser.id, googleUser.picture || null, now, now, user.id)
        .run();
    }

    // Generate JWT
    const token = await generateJWT(
      { userId: user.id, email: user.email, tier: user.tier },
      env.JWT_SECRET || 'bsi-default-secret-change-me'
    );

    // Store session
    await env.KV.put(
      `session:${user.id}`,
      JSON.stringify({
        userId: user.id,
        email: user.email,
        tier: user.tier,
        lastLogin: now,
      }),
      { expirationTtl: 86400 * 7 }
    );

    // Redirect to dashboard with token
    const _response = Response.redirect(`${origin}/dashboard?login=success`, 302);

    // Set cookie (note: Response.redirect creates immutable headers, so we need to create a new response)
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${origin}/dashboard?login=success`,
        'Set-Cookie': `bsi_token=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${86400 * 7}`,
      },
    });
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return Response.redirect(`${origin}/login?error=oauth_failed`, 302);
  }
};
