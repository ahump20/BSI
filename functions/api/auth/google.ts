/**
 * Blaze Sports Intel - Google OAuth Initiator
 * Redirects user to Google for authentication
 *
 * Endpoint: GET /api/auth/google
 *
 * Required secrets:
 *   - GOOGLE_CLIENT_ID: From Google Cloud Console
 *   - GOOGLE_CLIENT_SECRET: From Google Cloud Console
 */

interface Env {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  KV: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // Check if Google OAuth is configured
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    // Redirect to email signup instead
    const origin = new URL(request.url).origin;
    return Response.redirect(`${origin}/signup?method=email&message=google_not_configured`, 302);
  }

  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/auth/google/callback`;

  // Generate state for CSRF protection
  const state = crypto.randomUUID();
  await env.KV.put(`oauth_state:${state}`, 'pending', { expirationTtl: 600 }); // 10 min expiry

  // Build Google OAuth URL
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state: state,
    access_type: 'offline',
    prompt: 'consent',
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  return Response.redirect(googleAuthUrl, 302);
};
