/**
 * Pages Function — /api/newsletter
 *
 * Newsletter subscription endpoint.
 * Stores subscriber emails in KV for both Pages-only and hybrid deployments.
 */

interface Env {
  KV?: KVNamespace;
}

interface NewsletterPayload {
  email: string;
  consent?: boolean;
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
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const corsHeaders = getCorsHeaders(context.request);

  try {
    const { email, consent } = (await context.request.json()) as NewsletterPayload;

    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Valid email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (!consent) {
      return new Response(
        JSON.stringify({ error: 'Consent to privacy policy is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    if (context.env.KV) {
      const key = `newsletter:${email.toLowerCase()}`;
      await context.env.KV.put(
        key,
        JSON.stringify({
          email,
          subscribedAt: new Date().toISOString(),
          consentedAt: new Date().toISOString(),
        })
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Subscribed successfully' }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch {
    return new Response(JSON.stringify({ error: 'Subscription failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
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
