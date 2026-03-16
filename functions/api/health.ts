/**
 * Pages Function — /api/health
 *
 * Lightweight health endpoint for Pages preview deployments.
 * Production custom-domain health is handled by the hybrid Worker,
 * but preview aliases need a local Pages Function so smoke checks pass.
 */

import { corsHeaders, ok, preflight } from './_utils';

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
