/**
 * Pages Function — /api/health
 *
 * Lightweight health endpoint for Pages preview deployments.
 * Production custom-domain health is handled by the hybrid Worker,
 * but preview aliases need a local Pages Function so smoke checks pass.
 */

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function ok(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function preflight(): Response {
  return new Response(null, { status: 204, headers: corsHeaders });
}

interface Env {
  API_VERSION?: string;
  ENVIRONMENT?: string;
}

function buildHealthPayload(env: Env) {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: env.API_VERSION ?? '1.0.0',
    environment: env.ENVIRONMENT ?? 'preview',
    mode: 'pages-function',
  };
}

export const onRequestOptions = (): Response => preflight();

export const onRequestGet: PagesFunction<Env> = async (context) =>
  ok(buildHealthPayload(context.env));

export const onRequestHead: PagesFunction<Env> = async (context) =>
  new Response(null, {
    status: 200,
    headers: {
      ...corsHeaders,
      'X-Health-Status': buildHealthPayload(context.env).status,
    },
  });
