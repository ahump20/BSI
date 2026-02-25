/**
 * Pages Function — /api/stripe/session-status
 *
 * Retrieves the status of a Stripe Checkout Session.
 * Called by the checkout return page to verify payment completion.
 *
 * Requires STRIPE_SECRET_KEY set in Cloudflare Pages project settings.
 */

interface Env {
  STRIPE_SECRET_KEY?: string;
}

interface StripeSession {
  id: string;
  status: 'complete' | 'open' | 'expired';
  customer_details?: {
    email: string | null;
  };
  subscription?: string | null;
  payment_status: string;
  metadata?: Record<string, string>;
}

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
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const corsHeaders = getCorsHeaders(context.request);

  try {
    if (!context.env.STRIPE_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: 'Payment system not configured' }),
        { status: 503, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    const url = new URL(context.request.url);
    const sessionId = url.searchParams.get('session_id');

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'Missing session_id parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    // Fetch session from Stripe
    const res = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
      {
        headers: {
          'Authorization': `Bearer ${context.env.STRIPE_SECRET_KEY}`,
        },
      },
    );

    if (!res.ok) {
      const error = await res.json() as { error?: { message?: string } };
      return new Response(
        JSON.stringify({ error: error?.error?.message ?? 'Failed to retrieve session' }),
        { status: res.status, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    const session = await res.json() as StripeSession;

    // Infer tier from subscription metadata or price
    const tier = session.metadata?.tier ?? 'pro';

    // If a subscription exists, fetch it to get trial_end timestamp
    let trialEnd: number | null = null;
    if (session.subscription) {
      try {
        const subRes = await fetch(
          `https://api.stripe.com/v1/subscriptions/${encodeURIComponent(session.subscription)}`,
          { headers: { 'Authorization': `Bearer ${context.env.STRIPE_SECRET_KEY}` } },
        );
        if (subRes.ok) {
          const sub = await subRes.json() as { trial_end?: number | null };
          trialEnd = sub.trial_end ?? null;
        }
      } catch {
        // Non-fatal — trial_end is optional enhancement
      }
    }

    return new Response(
      JSON.stringify({
        status: session.status,
        customer_email: session.customer_details?.email ?? null,
        subscription_id: session.subscription ?? null,
        tier,
        payment_status: session.payment_status,
        trial_end: trialEnd,
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    );
  } catch (err) {
    console.error('[Stripe] Session status check failed:', err);
    return new Response(
      JSON.stringify({ error: 'Failed to verify session' }),
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
