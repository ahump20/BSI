/**
 * BSI MCP Deploy - ChatGPT Atlas Connector for Cloudflare Deployments
 *
 * MCP Server that enables CI/CD operations via ChatGPT Atlas:
 * - Trigger deployments via GitHub Actions workflow_dispatch
 * - Check deployment status
 * - View deployment logs
 *
 * Endpoints:
 * - GET /sse - SSE endpoint for ChatGPT Atlas (legacy transport)
 * - POST /mcp - Streamable HTTP endpoint for MCP messages
 * - GET /oauth/* - OAuth flow for authentication
 * - GET /health - Health check
 */

import type { Env } from './types';
import { createSSEHandler, handleMCPPost, handleSSEMessage } from './mcp';
import { handleAuthorize, handleCallback, handleTokenExchange, validateToken } from './oauth';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Health check
    if (path === '/health') {
      return Response.json({
        status: 'healthy',
        service: 'bsi-mcp-deploy',
        timestamp: new Date().toISOString(),
      });
    }

    // OAuth endpoints (no auth required for these)
    if (path === '/oauth/authorize' && request.method === 'GET') {
      return handleAuthorize(env, request);
    }
    if (path === '/oauth/callback' && request.method === 'GET') {
      return handleCallback(env, request);
    }
    if (path === '/oauth/token' && request.method === 'POST') {
      return handleTokenExchange(env, request);
    }

    // Validate auth for MCP endpoints (if OAuth is configured)
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const valid = await validateToken(env, token);
      if (!valid) {
        return Response.json({ error: 'Invalid or expired token' }, { status: 401 });
      }
    }

    // SSE endpoint for ChatGPT Atlas discovery
    if (path === '/sse' && request.method === 'GET') {
      return createSSEHandler(env, request);
    }

    // MCP message endpoint (Streamable HTTP transport)
    if (path === '/mcp' && request.method === 'POST') {
      return handleMCPPost(env, request);
    }

    // SSE message endpoint (SSE transport - receives POSTs, responds via SSE stream)
    if (path === '/messages' && request.method === 'POST') {
      return handleSSEMessage(env, request);
    }

    // Well-known MCP endpoint (alternative discovery)
    if (path === '/.well-known/mcp.json') {
      return Response.json({
        name: 'BSI Deploy',
        description: 'Deploy Cloudflare Workers and Pages via GitHub Actions',
        version: '1.0.0',
        endpoints: {
          sse: '/sse',
          mcp: '/mcp',
        },
        capabilities: {
          tools: true,
        },
      });
    }

    // Root endpoint - return server info
    if (path === '/') {
      return Response.json({
        name: 'bsi-mcp-deploy',
        description: 'MCP Server for Cloudflare deployment via ChatGPT Atlas',
        version: '1.0.0',
        endpoints: {
          health: '/health',
          sse: '/sse (GET)',
          mcp: '/mcp (POST)',
          oauth: {
            authorize: '/oauth/authorize',
            callback: '/oauth/callback',
            token: '/oauth/token',
          },
        },
        documentation: 'https://github.com/ahump20/blazesportsintel/workers/bsi-mcp-deploy',
      });
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  },
};
