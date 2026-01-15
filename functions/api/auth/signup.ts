/**
 * Blaze Sports Intel - Email Signup
 * Creates new user accounts and notifies Austin of new signups
 *
 * Endpoint: POST /api/auth/signup
 */

import { sendEmail, welcomeEmail } from '../_email';
import { logAuthEvent, generateRequestId } from '../_auth-events';

interface Env {
  DB: D1Database;
  KV: KVNamespace;
  JWT_SECRET: string;
  RESEND_API_KEY: string;
  NOTIFICATION_EMAIL?: string;
}

interface SignupRequest {
  email: string;
  password: string;
  name?: string;
  tier?: 'free' | 'pro' | 'enterprise';
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

// Hash password using PBKDF2 (100k iterations with random salt)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  const hashArray = new Uint8Array(hash);
  const combined = new Uint8Array(salt.length + hashArray.length);
  combined.set(salt);
  combined.set(hashArray, salt.length);
  return btoa(String.fromCharCode(...combined));
}

// Generate JWT token
async function generateJWT(payload: Record<string, unknown>, secret: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const tokenPayload = {
    ...payload,
    iat: now,
    exp: now + 86400 * 7, // 7 days
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

// Generate unique user ID
function generateUserId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'usr_';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // Handle CORS preflight
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
    // Parse request
    let body: SignupRequest;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const { email, password, name, tier = 'free' } = body;

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: 'Valid email is required' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Validate password
    if (!password || password.length < 8) {
      return new Response(JSON.stringify({ error: 'Password must be at least 8 characters' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Initialize database tables if needed
    try {
      // Try to add tier column if it doesn't exist
      try {
        await env.DB.prepare(`ALTER TABLE users ADD COLUMN tier TEXT DEFAULT 'free'`).run();
      } catch {
        /* Column may already exist */
      }

      try {
        await env.DB.prepare(`ALTER TABLE users ADD COLUMN google_id TEXT`).run();
      } catch {
        /* Column may already exist */
      }

      try {
        await env.DB.prepare(`ALTER TABLE users ADD COLUMN picture TEXT`).run();
      } catch {
        /* Column may already exist */
      }

      try {
        await env.DB.prepare(`ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0`).run();
      } catch {
        /* Column may already exist */
      }
    } catch (dbError) {
      console.log('Schema update info:', dbError);
    }

    // Check if email already exists
    const existingUser = await env.DB.prepare('SELECT id FROM users WHERE email = ?')
      .bind(email.toLowerCase())
      .first();

    if (existingUser) {
      // Log failed signup (email already exists)
      await logAuthEvent(
        { email: email.toLowerCase(), eventType: 'signup_failed', metadata: { reason: 'email_exists' } },
        env,
        request
      );
      return new Response(JSON.stringify({ error: 'Email already registered' }), {
        status: 409,
        headers: corsHeaders,
      });
    }

    // Create user
    const userId = generateUserId();
    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();

    // Try insert with tier first, fall back to without tier
    try {
      await env.DB.prepare(
        `
        INSERT INTO users (id, email, password_hash, name, tier, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `
      )
        .bind(userId, email.toLowerCase(), passwordHash, name || null, tier, now, now)
        .run();
    } catch (insertError) {
      // Try without tier column
      await env.DB.prepare(
        `
        INSERT INTO users (id, email, password_hash, name, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `
      )
        .bind(userId, email.toLowerCase(), passwordHash, name || null, now, now)
        .run();
    }

    // Generate session token
    const token = await generateJWT(
      { userId, email: email.toLowerCase(), tier },
      env.JWT_SECRET || 'bsi-default-secret-change-me'
    );

    // Store session in KV (non-blocking - account created even if KV fails)
    try {
      await env.KV.put(
        `session:${userId}`,
        JSON.stringify({
          userId,
          email: email.toLowerCase(),
          tier,
          createdAt: now,
        }),
        { expirationTtl: 86400 * 7 }
      );
    } catch (kvError) {
      console.log('KV session storage skipped:', kvError);
    }

    // Send notification to Austin about new signup
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' });
    console.log(`🎉 NEW SIGNUP: ${email} (${name || 'No name'}) - ${tier} tier at ${timestamp}`);

    // Store signup notification in KV for dashboard visibility (non-blocking)
    try {
      const notificationId = `signup:${Date.now()}`;
      await env.KV.put(
        notificationId,
        JSON.stringify({
          type: 'new_signup',
          email: email.toLowerCase(),
          name: name || null,
          tier,
          timestamp: now,
          userId,
        }),
        { expirationTtl: 86400 * 30 }
      );
    } catch (kvError) {
      console.log('KV notification storage skipped:', kvError);
    }

    // Log successful signup
    const requestId = await logAuthEvent(
      { userId, email: email.toLowerCase(), eventType: 'signup_success', metadata: { tier, name: name || null } },
      env,
      request
    );

    // Send welcome email and track result (non-blocking for account creation)
    const emailTemplate = welcomeEmail(name || '', email.toLowerCase());
    let emailStatus: 'sent' | 'failed' | 'disabled' = 'disabled';

    try {
      const emailResult = await sendEmail(
        {
          to: email.toLowerCase(),
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          text: emailTemplate.text,
          userId,
          emailType: 'welcome',
        },
        env
      );
      emailStatus = emailResult.success ? 'sent' : 'failed';
      if (!emailResult.success) {
        console.log('Welcome email failed:', emailResult.error);
      }
    } catch (err) {
      emailStatus = 'failed';
      console.log('Welcome email error:', err);
    }

    // Return success with token and email status
    return new Response(
      JSON.stringify({
        success: true,
        requestId,
        message: 'Account created successfully',
        user: {
          id: userId,
          email: email.toLowerCase(),
          name: name || null,
          tier,
        },
        token,
        redirectTo: tier === 'free' ? '/dashboard' : '/checkout?tier=' + tier,
        emailStatus, // 'sent', 'failed', or 'disabled' - visible for debugging
      }),
      {
        status: 201,
        headers: {
          ...corsHeaders,
          'Set-Cookie': `bsi_token=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${86400 * 7}`,
        },
      }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Signup failed',
      }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
};
