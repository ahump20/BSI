#!/usr/bin/env node
/**
 * Establish an ngrok tunnel for local development and update webhook providers.
 *
 * Required environment variables:
 * - NGROK_API_TOKEN
 *
 * Optional environment variables for webhook updates:
 * - STRIPE_SECRET_KEY
 * - STRIPE_WEBHOOK_ENDPOINT_ID
 * - STRIPE_WEBHOOK_PATH (default: /api/stripe/webhook)
 * - AUTH0_DOMAIN
 * - AUTH0_CLIENT_ID
 * - AUTH0_CLIENT_SECRET
 * - AUTH0_WEBHOOK_ID (Log Stream ID)
 * - AUTH0_WEBHOOK_PATH (default: /api/auth0/webhook)
 *
 * Other optional configuration:
 * - NGROK_PORT (default: 3000)
 * - NGROK_LABEL (metadata for tunnel)
 */

import ngrok from '@ngrok/ngrok';

if (!process.env.NGROK_API_TOKEN) {
  console.error('Missing required environment variable: NGROK_API_TOKEN');
  process.exit(1);
}

const port = Number(process.env.NGROK_PORT || 3000);
const metadata = process.env.NGROK_LABEL || 'bsi-local-dev';

async function updateStripeWebhook(baseUrl) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const endpointId = process.env.STRIPE_WEBHOOK_ENDPOINT_ID;
  if (!secretKey || !endpointId) {
    console.log('Skipping Stripe webhook update (missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_ENDPOINT_ID).');
    return;
  }

  const path = process.env.STRIPE_WEBHOOK_PATH || '/api/stripe/webhook';
  const url = `${baseUrl}${path}`;
  const body = new URLSearchParams({ url });

  const response = await fetch(`https://api.stripe.com/v1/webhook_endpoints/${endpointId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
    },
    body,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error('Stripe webhook update failed:', payload.error || payload);
    return;
  }

  console.log(`Updated Stripe webhook endpoint ${endpointId} → ${url}`);
}

async function updateAuth0Webhook(baseUrl) {
  const domain = process.env.AUTH0_DOMAIN;
  const clientId = process.env.AUTH0_CLIENT_ID;
  const clientSecret = process.env.AUTH0_CLIENT_SECRET;
  const webhookId = process.env.AUTH0_WEBHOOK_ID;

  if (!domain || !clientId || !clientSecret || !webhookId) {
    console.log('Skipping Auth0 webhook update (missing AUTH0_* environment variables).');
    return;
  }

  const tokenResponse = await fetch(`https://${domain}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      audience: `https://${domain}/api/v2/`,
      grant_type: 'client_credentials',
    }),
  });

  const tokenPayload = await tokenResponse.json();

  if (!tokenResponse.ok) {
    console.error('Auth0 token request failed:', tokenPayload);
    return;
  }

  const accessToken = tokenPayload.access_token;
  if (!accessToken) {
    console.error('Auth0 token response missing access_token');
    return;
  }

  const path = process.env.AUTH0_WEBHOOK_PATH || '/api/auth0/webhook';
  const url = `${baseUrl}${path}`;

  const updateResponse = await fetch(`https://${domain}/api/v2/logs/streams/${webhookId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      name: metadata,
      sink: {
        http: {
          endpoint: url,
          content_format: 'JSON',
        },
      },
    }),
  });

  const updatePayload = await updateResponse.json();

  if (!updateResponse.ok) {
    console.error('Auth0 webhook update failed:', updatePayload);
    return;
  }

  console.log(`Updated Auth0 log stream ${webhookId} → ${url}`);
}

async function main() {
  console.log(`Starting ngrok tunnel on port ${port}...`);
  const listener = await ngrok.forward({
    addr: port,
    authtoken: process.env.NGROK_API_TOKEN,
    metadata,
    proto: 'http',
  });

  const publicUrl = listener.url();
  console.log(`ngrok tunnel established at ${publicUrl}`);

  await updateStripeWebhook(publicUrl);
  await updateAuth0Webhook(publicUrl);

  console.log('Tunnel is live. Press Ctrl+C to terminate.');

  const shutdown = async () => {
    console.log('\nShutting down ngrok tunnel...');
    await listener.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  process.stdin.resume();
}

main().catch((error) => {
  console.error('ngrok boot failed:', error);
  process.exit(1);
});
