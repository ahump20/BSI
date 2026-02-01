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
  consent?: boolean;
}

const ALLOWED_ORIGINS = new Set([
  'https://blazesportsintel.com',
  'https://www.blazesportsintel.com',
  'https://blazesportsintel.pages.dev',
  'http://localhost:3000',
]);

/** 90-day TTL for lead data */
const LEAD_TTL_SECONDS = 90 * 24 * 60 * 60;

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
    const lead = (await context.request.json()) as LeadPayload;

    if (!lead.name || !lead.email) {
      return new Response(JSON.stringify({ error: 'Name and email are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (!lead.consent) {
      return new Response(
        JSON.stringify({ error: 'Consent to privacy policy is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Store in KV if available — with TTL for data retention compliance
    if (context.env.KV) {
      const key = `lead:${Date.now()}:${lead.email}`;
      await context.env.KV.put(key, JSON.stringify({ ...lead, consentedAt: new Date().toISOString() }), {
        expirationTtl: LEAD_TTL_SECONDS,
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

export const onRequestOptions: PagesFunction = async (context) => {
  return new Response(null, {
    headers: {
      ...getCorsHeaders(context.request),
      'Access-Control-Max-Age': '86400',
    },
  });
};
