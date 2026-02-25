/**
 * Pages Function — /api/stripe/create-embedded-checkout
 *
 * Creates a Stripe Checkout Session in embedded mode.
 * Returns the clientSecret for the EmbeddedCheckoutProvider on the frontend.
 *
 * Requires STRIPE_SECRET_KEY set in Cloudflare Pages project settings.
 */

interface Env {
  STRIPE_SECRET_KEY?: string;
}

interface CheckoutPayload {
  tier: 'pro' | 'enterprise';
}

// Stripe price IDs — set these after creating products in Stripe Dashboard.
// Replace with real price IDs before going live.
const PRICE_MAP: Record<string, string> = {
  pro: 'price_1T4enWLvpRBk20R2PwijbY72',
  enterprise: 'price_1T4enWLvpRBk20R2EYqVeGY5',
};

const ALLOWED_ORIGINS = new Set([
  'https://blazesportsintel.com',
  'https://www.blazesportsintel.com',
  'https://blazesportsintel.pages.dev',
  'http://localhost:3000',
]);

function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin') ?? '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : '',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

/**
 * Stripe API call via fetch — avoids importing the full Stripe SDK
 * in the Pages Function bundle. Cloudflare Workers/Pages Functions
 * don't support Node.js APIs that the Stripe SDK depends on.
 */
async function createCheckoutSession(
  secretKey: string,
  priceId: string,
  returnUrl: string,
  tier: 'pro' | 'enterprise',
): Promise<{ client_secret: string; id: string }> {
  const params = new URLSearchParams();
  params.set('mode', 'subscription');
  params.set('ui_mode', 'embedded');
  params.set('line_items[0][price]', priceId);
  params.set('line_items[0][quantity]', '1');
  params.set('return_url', `${returnUrl}/checkout/return/?session_id={CHECKOUT_SESSION_ID}`);
  params.set('metadata[tier]', tier);

  // Pro tier gets a 14-day trial; Enterprise does not
  if (tier === 'pro') {
    params.set('subscription_data[trial_period_days]', '14');
  }

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const error = await res.json() as { error?: { message?: string } };
    throw new Error(error?.error?.message ?? `Stripe API error: ${res.status}`);
  }

  return res.json() as Promise<{ client_secret: string; id: string }>;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const corsHeaders = getCorsHeaders(context.request);

  try {
    if (!context.env.STRIPE_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: 'Payment system not configured' }),
        { status: 503, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    const { tier } = (await context.request.json()) as CheckoutPayload;

    if (!tier || !PRICE_MAP[tier]) {
      return new Response(
        JSON.stringify({ error: 'Invalid pricing tier' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    const priceId = PRICE_MAP[tier];

    // Determine return URL from request origin
    const origin = new URL(context.request.url).origin;

    const session = await createCheckoutSession(
      context.env.STRIPE_SECRET_KEY,
      priceId,
      origin,
      tier,
    );

    return new Response(
      JSON.stringify({ clientSecret: session.client_secret }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    );
  } catch (err) {
    console.error('[Stripe] Checkout session creation failed:', err);
    return new Response(
      JSON.stringify({ error: 'Failed to create checkout session' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    );
  }
};

export const onRequestOptions: PagesFunction = async (context) => {
  return new Response(null, {
    headers: {
      ...getCorsHeaders(context.request),
      'Access-Control-Max-Age': '86400',
    },
  });
};
