/**
 * GET /api/auth/whoop/callback
 *
 * OAuth 2.0 callback handler for WHOOP authorization.
 * Exchanges authorization code for access tokens and stores them securely.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import { createWHOOPAdapter } from '@/lib/adapters/whoop-v2-adapter';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // player_id
  const error = searchParams.get('error');

  // Handle authorization errors
  if (error) {
    console.error('[WHOOP OAuth] Authorization error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/players/${state}/wearables?error=authorization_failed`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/players/${state}/wearables?error=missing_parameters`
    );
  }

  const playerId = state;

  try {
    const db = new Client({ connectionString: process.env.DATABASE_URL });
    await db.connect();

    // Initialize WHOOP adapter
    const whoopAdapter = createWHOOPAdapter({
      clientId: process.env.WHOOP_CLIENT_ID!,
      clientSecret: process.env.WHOOP_CLIENT_SECRET!,
      redirectUri: process.env.WHOOP_REDIRECT_URI!,
    });

    // Exchange code for tokens
    const tokens = await whoopAdapter.exchangeCodeForTokens(code);

    // Get user profile to store user_id
    const profile = await whoopAdapter.getUserProfile(tokens.access_token);

    // Encrypt tokens
    const accessTokenEncrypted = encrypt(tokens.access_token, process.env.ENCRYPTION_KEY!);
    const refreshTokenEncrypted = encrypt(tokens.refresh_token, process.env.ENCRYPTION_KEY!);

    // Store in database
    await db.query(`
      INSERT INTO wearables_devices (
        player_id,
        device_type,
        api_version,
        access_token_encrypted,
        refresh_token_encrypted,
        token_expires_at,
        consent_granted,
        consent_granted_at,
        is_active,
        raw_payload
      )
      VALUES ($1, 'whoop', 'v2', $2, $3, $4, TRUE, NOW(), TRUE, $5)
      ON CONFLICT (player_id, device_serial)
      DO UPDATE SET
        access_token_encrypted = EXCLUDED.access_token_encrypted,
        refresh_token_encrypted = EXCLUDED.refresh_token_encrypted,
        token_expires_at = EXCLUDED.token_expires_at,
        consent_granted = TRUE,
        consent_granted_at = NOW(),
        is_active = TRUE,
        updated_at = NOW()
    `, [
      playerId,
      accessTokenEncrypted,
      refreshTokenEncrypted,
      new Date(Date.now() + tokens.expires_in * 1000),
      JSON.stringify({ user_id: profile.user_id }),
    ]);

    await db.end();

    console.log(`[WHOOP OAuth] Successfully authorized player ${playerId}`);

    // Redirect to success page
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/players/${playerId}/wearables?success=true`
    );
  } catch (error) {
    console.error('[WHOOP OAuth] Error during callback:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/players/${state}/wearables?error=token_exchange_failed`
    );
  }
}

/**
 * Encrypt data using AES-256-GCM
 */
function encrypt(data: string, key: string): string {
  const algorithm = 'aes-256-gcm';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'hex'), iv);

  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Return: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}
