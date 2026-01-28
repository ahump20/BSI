/**
 * OAuth Flow Handler
 * Implements OAuth 2.0 authorization code flow for ChatGPT Atlas
 *
 * Note: OAuth is optional for initial testing. ChatGPT Atlas can connect
 * without authentication during development. Add OAuth for production.
 */

import type { Env, OAuthState, OAuthToken } from './types';

const STATE_TTL_SECONDS = 600; // 10 minutes for OAuth state
const TOKEN_TTL_SECONDS = 3600; // 1 hour for access tokens

/**
 * Generate a cryptographically secure random string
 */
function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Initiate OAuth authorization flow
 * GET /oauth/authorize
 */
export async function handleAuthorize(env: Env, request: Request): Promise<Response> {
  const url = new URL(request.url);
  const redirectUri = url.searchParams.get('redirect_uri');
  const clientId = url.searchParams.get('client_id');

  if (!env.OAUTH_CLIENT_ID || !env.OAUTH_CLIENT_SECRET) {
    return Response.json({ error: 'OAuth not configured' }, { status: 501 });
  }

  if (clientId !== env.OAUTH_CLIENT_ID) {
    return Response.json({ error: 'Invalid client_id' }, { status: 400 });
  }

  if (!redirectUri) {
    return Response.json({ error: 'redirect_uri required' }, { status: 400 });
  }

  // Generate and store state
  const state = generateState();
  const stateData: OAuthState = {
    state,
    createdAt: Date.now(),
    redirectUri,
  };

  await env.MCP_STATE.put(`oauth:state:${state}`, JSON.stringify(stateData), {
    expirationTtl: STATE_TTL_SECONDS,
  });

  // For BSI, we use a simple internal authorization (no external IdP)
  // In production, this could redirect to a real login page
  // For now, we auto-approve for development
  const callbackUrl = new URL('/oauth/callback', request.url);
  callbackUrl.searchParams.set('state', state);
  callbackUrl.searchParams.set('code', generateState()); // authorization code

  return Response.redirect(callbackUrl.toString(), 302);
}

/**
 * OAuth callback - exchange code for token
 * GET /oauth/callback
 */
export async function handleCallback(env: Env, request: Request): Promise<Response> {
  const url = new URL(request.url);
  const state = url.searchParams.get('state');
  const code = url.searchParams.get('code');

  if (!state || !code) {
    return Response.json({ error: 'Missing state or code' }, { status: 400 });
  }

  // Verify state
  const stateDataRaw = await env.MCP_STATE.get(`oauth:state:${state}`);
  if (!stateDataRaw) {
    return Response.json({ error: 'Invalid or expired state' }, { status: 400 });
  }

  const stateData: OAuthState = JSON.parse(stateDataRaw);

  // Store authorization code for exchange
  await env.MCP_STATE.put(`oauth:code:${code}`, state, {
    expirationTtl: STATE_TTL_SECONDS,
  });

  // Delete used state
  await env.MCP_STATE.delete(`oauth:state:${state}`);

  // Redirect back to ChatGPT with the code
  const redirectUrl = new URL(stateData.redirectUri);
  redirectUrl.searchParams.set('code', code);
  redirectUrl.searchParams.set('state', state);

  return Response.redirect(redirectUrl.toString(), 302);
}

/**
 * Token exchange endpoint
 * POST /oauth/token
 */
export async function handleTokenExchange(env: Env, request: Request): Promise<Response> {
  const formData = await request.formData();
  const grantType = formData.get('grant_type');
  const code = formData.get('code');
  const clientId = formData.get('client_id');
  const clientSecret = formData.get('client_secret');

  if (!env.OAUTH_CLIENT_ID || !env.OAUTH_CLIENT_SECRET) {
    return Response.json({ error: 'OAuth not configured' }, { status: 501 });
  }

  if (grantType !== 'authorization_code') {
    return Response.json({ error: 'unsupported_grant_type' }, { status: 400 });
  }

  if (clientId !== env.OAUTH_CLIENT_ID || clientSecret !== env.OAUTH_CLIENT_SECRET) {
    return Response.json({ error: 'invalid_client' }, { status: 401 });
  }

  if (!code) {
    return Response.json({ error: 'invalid_grant' }, { status: 400 });
  }

  // Verify code
  const storedState = await env.MCP_STATE.get(`oauth:code:${code}`);
  if (!storedState) {
    return Response.json({ error: 'invalid_grant' }, { status: 400 });
  }

  // Delete used code
  await env.MCP_STATE.delete(`oauth:code:${code}`);

  // Generate access token
  const accessToken = generateState();
  const tokenData: OAuthToken = {
    accessToken,
    tokenType: 'Bearer',
    expiresAt: Date.now() + TOKEN_TTL_SECONDS * 1000,
    scope: 'deploy:read deploy:write',
  };

  await env.MCP_STATE.put(`oauth:token:${accessToken}`, JSON.stringify(tokenData), {
    expirationTtl: TOKEN_TTL_SECONDS,
  });

  return Response.json({
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: TOKEN_TTL_SECONDS,
    scope: 'deploy:read deploy:write',
  });
}

/**
 * Validate an access token
 */
export async function validateToken(env: Env, token: string): Promise<boolean> {
  if (!env.OAUTH_CLIENT_ID) {
    // OAuth not configured, allow all requests
    return true;
  }

  const tokenData = await env.MCP_STATE.get(`oauth:token:${token}`);
  if (!tokenData) {
    return false;
  }

  const parsed: OAuthToken = JSON.parse(tokenData);
  return parsed.expiresAt > Date.now();
}
