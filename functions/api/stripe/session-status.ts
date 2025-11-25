/**
 * Blaze Sports Intel - Stripe Session Status
 * Returns the status of a checkout session for the return page
 *
 * Endpoint: GET /api/stripe/session-status?session_id=cs_test_...
 */

interface Env {
  STRIPE_SECRET_KEY: string;
}

interface StripeSession {
  id: string;
  status: 'complete' | 'open' | 'expired';
  customer: string | null;
  customer_email: string | null;
  customer_details: {
    email: string | null;
    name: string | null;
  } | null;
  subscription: string | null;
  metadata: Record<string, string>;
  payment_status: string;
}

async function getStripeSession(secretKey: string, sessionId: string): Promise<StripeSession> {
  const response = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${sessionId}`,
    {
      headers: {
        'Authorization': `Bearer ${secretKey}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json() as { error?: { message?: string } };
    throw new Error(error.error?.message || 'Failed to retrieve session');
  }

  return response.json();
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // Handle OPTIONS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow GET
  if (request.method !== 'GET') {
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

    const url = new URL(request.url);
    const sessionId = url.searchParams.get('session_id');

    if (!sessionId) {
      return new Response(JSON.stringify({
        error: 'Missing session_id parameter'
      }), { status: 400, headers: corsHeaders });
    }

    if (!sessionId.startsWith('cs_')) {
      return new Response(JSON.stringify({
        error: 'Invalid session_id format'
      }), { status: 400, headers: corsHeaders });
    }

    const session = await getStripeSession(env.STRIPE_SECRET_KEY, sessionId);

    const customerEmail = session.customer_details?.email ||
                          session.customer_email ||
                          null;

    return new Response(JSON.stringify({
      status: session.status,
      customer_email: customerEmail,
      subscription_id: session.subscription,
      tier: session.metadata?.tier || null,
      payment_status: session.payment_status,
    }), { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Session status error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Failed to retrieve session status'
    }), { status: 500, headers: corsHeaders });
  }
};
