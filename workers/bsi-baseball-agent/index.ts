/**
 * bsi-baseball-agent
 *
 * Stateful AI chat agent for college baseball analytics.
 * Currently a stub — the BaseballChatAgent DO class is minimal.
 * Full Agents SDK integration to be added in a future session.
 *
 * Deploy: wrangler deploy --config workers/bsi-baseball-agent/wrangler.toml
 * Worker name: bsi-baseball-agent
 */

import type { AgentEnv } from './types';
import { applySecurityHeaders } from '../shared/security';

export { BaseballChatAgent } from './agent';

const CORS_ORIGINS = new Set([
  'https://blazesportsintel.com',
  'https://www.blazesportsintel.com',
  'https://blazesportsintel.pages.dev',
  'http://localhost:3000',
]);

function corsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-BSI-Key, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
  if (origin && CORS_ORIGINS.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

export default {
  async fetch(request: Request, env: AgentEnv): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // Health check
    if (url.pathname === '/health' || url.pathname === '/') {
      const body = {
        service: 'bsi-baseball-agent',
        status: 'ok',
        mode: 'stub',
        timestamp: new Date().toISOString(),
      };
      return applySecurityHeaders(new Response(JSON.stringify(body), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      }));
    }

    // Route /agent/* requests to the Durable Object
    if (url.pathname.startsWith('/agent')) {
      const id = env.BSI_BASEBALL_AGENT.idFromName('default');
      const stub = env.BSI_BASEBALL_AGENT.get(id);
      const doResponse = await stub.fetch(request);
      const headers = new Headers(doResponse.headers);
      for (const [k, v] of Object.entries(corsHeaders(origin))) {
        headers.set(k, v);
      }
      return applySecurityHeaders(new Response(doResponse.body, { status: doResponse.status, headers }));
    }

    return applySecurityHeaders(new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    }));
  },
};
