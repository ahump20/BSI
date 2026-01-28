/**
 * MCP Protocol Handler
 * Implements the Model Context Protocol for ChatGPT Atlas integration
 *
 * Supports two transports:
 * 1. SSE (Server-Sent Events) - bidirectional with session management
 * 2. Streamable HTTP - simple request/response
 */

import type { Env, MCPRequest, MCPResponse } from './types';
import { TOOLS, handleToolCall } from './tools';

const SERVER_INFO = {
  name: 'bsi-mcp-deploy',
  version: '1.0.0',
};

const CAPABILITIES = {
  tools: {},
};

/**
 * Handle an MCP JSON-RPC request
 */
export async function handleMCPRequest(env: Env, request: MCPRequest): Promise<MCPResponse> {
  const { id, method, params } = request;

  switch (method) {
    case 'initialize':
      return {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          serverInfo: SERVER_INFO,
          capabilities: CAPABILITIES,
        },
      };

    case 'notifications/initialized':
      // Client notification that initialization is complete - no response needed
      return { jsonrpc: '2.0', id, result: {} };

    case 'tools/list':
      return {
        jsonrpc: '2.0',
        id,
        result: { tools: TOOLS },
      };

    case 'tools/call': {
      const toolName = (params as { name: string })?.name;
      const args = (params as { arguments?: Record<string, unknown> })?.arguments || {};

      if (!toolName) {
        return {
          jsonrpc: '2.0',
          id,
          error: { code: -32602, message: 'Missing tool name' },
        };
      }

      const result = await handleToolCall(env, toolName, args);
      return {
        jsonrpc: '2.0',
        id,
        result,
      };
    }

    case 'ping':
      return { jsonrpc: '2.0', id, result: {} };

    default:
      // For unknown methods, return empty result (some are notifications)
      if (method.startsWith('notifications/')) {
        return { jsonrpc: '2.0', id, result: {} };
      }
      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Unknown method: ${method}` },
      };
  }
}

// Session storage for SSE connections (in-memory, per-isolate)
const sessions = new Map<string, {
  controller: ReadableStreamDefaultController<Uint8Array>;
  encoder: TextEncoder;
}>();

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Handle SSE endpoint for ChatGPT Atlas
 * Creates a persistent connection and returns a session-specific message endpoint
 */
export function createSSEHandler(env: Env, request: Request): Response {
  const encoder = new TextEncoder();
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  const sessionId = generateSessionId();

  let intervalId: ReturnType<typeof setInterval> | null = null;
  let controllerRef: ReadableStreamDefaultController<Uint8Array> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controllerRef = controller;

      // Store session for message routing
      sessions.set(sessionId, { controller, encoder });

      // Send the endpoint event with session-specific URL
      const endpointEvent = `event: endpoint\ndata: ${baseUrl}/messages?sessionId=${sessionId}\n\n`;
      controller.enqueue(encoder.encode(endpointEvent));

      // Send keep-alive every 15 seconds
      intervalId = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keep-alive\n\n'));
        } catch {
          if (intervalId) clearInterval(intervalId);
          sessions.delete(sessionId);
        }
      }, 15000);
    },
    cancel() {
      if (intervalId) clearInterval(intervalId);
      sessions.delete(sessionId);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

/**
 * Handle messages endpoint for SSE transport
 * Receives requests and sends responses back over the SSE stream
 */
export async function handleSSEMessage(env: Env, request: Request): Promise<Response> {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('sessionId');

  // For SSE transport, try to send response over SSE stream
  const session = sessionId ? sessions.get(sessionId) : null;

  let body: MCPRequest;
  try {
    body = (await request.json()) as MCPRequest;
  } catch {
    return new Response('Parse error', { status: 400 });
  }

  const response = await handleMCPRequest(env, body);

  // If we have an active SSE session, send response over SSE
  if (session) {
    try {
      const sseMessage = `event: message\ndata: ${JSON.stringify(response)}\n\n`;
      session.controller.enqueue(session.encoder.encode(sseMessage));
      // Return 202 Accepted to indicate response will come via SSE
      return new Response(null, {
        status: 202,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch {
      // SSE stream closed, fall back to HTTP response
      sessions.delete(sessionId!);
    }
  }

  // Fall back to direct HTTP response
  return Response.json(response, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

/**
 * Handle HTTP POST for MCP messages (Streamable HTTP transport)
 * This is the simpler transport - direct request/response
 */
export async function handleMCPPost(env: Env, request: Request): Promise<Response> {
  let body: MCPRequest;

  try {
    body = (await request.json()) as MCPRequest;
  } catch {
    return Response.json(
      {
        jsonrpc: '2.0',
        id: null,
        error: { code: -32700, message: 'Parse error' },
      },
      { status: 400 }
    );
  }

  if (!body.jsonrpc || body.jsonrpc !== '2.0' || !body.method) {
    return Response.json(
      {
        jsonrpc: '2.0',
        id: body?.id || null,
        error: { code: -32600, message: 'Invalid Request' },
      },
      { status: 400 }
    );
  }

  const response = await handleMCPRequest(env, body);

  return Response.json(response, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
