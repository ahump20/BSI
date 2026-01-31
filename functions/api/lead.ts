/**
 * Pages Function — /api/lead
 *
 * Accepts lead capture form submissions.
 * In the hybrid setup the Worker handles this route, but this function
 * provides the same capability for Pages-only preview deployments.
 */

interface Env {
  KV?: KVNamespace;
}

interface LeadPayload {
  name: string;
  email: string;
  organization?: string;
  sport?: string;
  message?: string;
  source?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const lead = (await context.request.json()) as LeadPayload;

    if (!lead.name || !lead.email) {
      return new Response(JSON.stringify({ error: 'Name and email are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Store in KV if available
    if (context.env.KV) {
      const key = `lead:${Date.now()}:${lead.email}`;
      await context.env.KV.put(key, JSON.stringify(lead), {
        metadata: { timestamp: new Date().toISOString() },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Lead captured successfully',
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to process lead' }), {
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
