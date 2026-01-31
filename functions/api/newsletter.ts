/**
 * Pages Function — /api/newsletter
 *
 * Newsletter subscription endpoint.
 * Stores subscriber emails in KV for both Pages-only and hybrid deployments.
 */

interface Env {
  KV?: KVNamespace;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const { email } = (await context.request.json()) as { email: string };

    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Valid email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (context.env.KV) {
      const key = `newsletter:${email.toLowerCase()}`;
      await context.env.KV.put(key, JSON.stringify({ email, subscribedAt: new Date().toISOString() }));
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

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
};
