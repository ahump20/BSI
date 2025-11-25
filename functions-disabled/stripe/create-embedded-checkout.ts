/**
 * Blaze Sports Intel - Stripe Embedded Checkout Session
 * Creates checkout sessions for new customer onboarding
 *
 * Endpoint: POST /api/stripe/create-embedded-checkout
 */

interface Env {
  STRIPE_SECRET_KEY: string;
  STRIPE_PRO_PRICE_ID: string;
  STRIPE_ENTERPRISE_PRICE_ID: string;
}

interface CheckoutRequest {
  tier: 'pro' | 'enterprise';
  email?: string;
  mode?: 'payment' | 'subscription';
}

// Stripe API helper - no external dependencies needed
async function createStripeCheckoutSession(
  secretKey: string,
  params: {
    priceId: string;
    mode: 'payment' | 'subscription';
    successUrl: string;
    returnUrl: string;
    customerEmail?: string;
    uiMode: 'embedded' | 'hosted';
    metadata?: Record<string, string>;
  }
): Promise<{ id: string; client_secret: string; url: string | null }> {
  const body: Record<string, string> = {
    'line_items[0][price]': params.priceId,
    'line_items[0][quantity]': '1',
    'mode': params.mode,
    'ui_mode': params.uiMode,
    'return_url': params.returnUrl,
  };

  if (params.customerEmail) {
    body['customer_email'] = params.customerEmail;
  }

  if (params.metadata) {
    Object.entries(params.metadata).forEach(([key, value]) => {
      body[`metadata[${key}]`] = value;
    });
  }

  body['automatic_tax[enabled]'] = 'true';

  if (params.mode === 'subscription' && params.metadata?.tier === 'pro') {
    body['subscription_data[trial_period_days]'] = '14';
  }

  body['allow_promotion_codes'] = 'true';

  const formBody = Object.entries(body)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formBody,
  });

  if (!response.ok) {
    const error = await response.json() as { error?: { message?: string } };
    throw new Error(error.error?.message || 'Failed to create checkout session');
  }

  return response.json();
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // Handle OPTIONS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    if (!env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY not configured');
      return new Response(JSON.stringify({
        error: 'Payment system not configured'
      }), { status: 500, headers: corsHeaders });
    }

    let body: CheckoutRequest;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({
        error: 'Invalid request body'
      }), { status: 400, headers: corsHeaders });
    }

    const { tier, email, mode = 'subscription' } = body;

    if (!tier || !['pro', 'enterprise'].includes(tier)) {
      return new Response(JSON.stringify({
        error: 'Invalid tier. Must be "pro" or "enterprise"'
      }), { status: 400, headers: corsHeaders });
    }

    const priceId = tier === 'pro' ? env.STRIPE_PRO_PRICE_ID : env.STRIPE_ENTERPRISE_PRICE_ID;

    if (!priceId) {
      console.error(`Price ID not configured for tier: ${tier}`);
      return new Response(JSON.stringify({
        error: 'Pricing not configured for this tier'
      }), { status: 500, headers: corsHeaders });
    }

    const origin = new URL(request.url).origin;
    const returnUrl = `${origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`;

    const session = await createStripeCheckoutSession(env.STRIPE_SECRET_KEY, {
      priceId,
      mode,
      successUrl: `${origin}/dashboard?subscription=success`,
      returnUrl,
      customerEmail: email,
      uiMode: 'embedded',
      metadata: {
        tier,
        source: 'blazesportsintel',
        created_at: new Date().toISOString(),
      },
    });

    return new Response(JSON.stringify({
      clientSecret: session.client_secret,
      sessionId: session.id,
    }), { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Create embedded checkout error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Failed to create checkout session'
    }), { status: 500, headers: corsHeaders });
  }
};
