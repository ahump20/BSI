/**
 * bsi-baseball-agent
 *
 * Stateful AI chat agent for college baseball analytics.
 * Extends Cloudflare Agents SDK AIChatAgent with BSI data tools.
 * Each session gets its own Durable Object with persistent conversation history.
 *
 * Deploy: wrangler deploy --config workers/bsi-baseball-agent/wrangler.toml
 * Worker name: bsi-baseball-agent
 */

import { routeAgentRequest } from 'agents';
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
        model: 'claude-sonnet-4-6',
        timestamp: new Date().toISOString(),
      };
      return applySecurityHeaders(new Response(JSON.stringify(body), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      }));
    }

    // Route all /agents/* requests to the Durable Object via Agents SDK
    const agentResponse = await routeAgentRequest(request, env);
    if (agentResponse) {
      // Add CORS headers to non-WebSocket responses (skip WebSocket upgrades)
      if (!request.headers.get('Upgrade')) {
        const headers = new Headers(agentResponse.headers);
        for (const [k, v] of Object.entries(corsHeaders(origin))) {
          headers.set(k, v);
        }
        return applySecurityHeaders(new Response(agentResponse.body, { status: agentResponse.status, headers }));
      }
      return agentResponse;
    }

    return applySecurityHeaders(new Response('Not found', { status: 404, headers: corsHeaders(origin) }));
  },
};
