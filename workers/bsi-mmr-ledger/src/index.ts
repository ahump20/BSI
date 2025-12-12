/**
 * BSI MMR Ledger - Cloudflare Worker Entrypoint
 * Routes, authentication, and HTTP handling
 */

import type { Env, MmrProof, ListLeavesParams } from './types';
import { MmrError } from './types';
import {
  appendEvent,
  getHead,
  getLeafByIndex,
  listEvents,
  buildProof,
  verifyProof,
  batchAppend,
} from './service';

// ─────────────────────────────────────────────────────────────
// Response Helpers
// ─────────────────────────────────────────────────────────────

function json<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function success<T>(data: T): Response {
  return json({ ok: true, ...data });
}

function error(err: MmrError): Response {
  return json({ ok: false, error: err.message, code: err.code }, err.status);
}

// ─────────────────────────────────────────────────────────────
// Authentication
// ─────────────────────────────────────────────────────────────

function requireAuth(req: Request, env: Env): void {
  const auth = req.headers.get('authorization') ?? '';
  const match = auth.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    throw MmrError.unauthorized('Missing Bearer token');
  }

  if (match[1] !== env.ADMIN_TOKEN) {
    throw MmrError.forbidden('Invalid token');
  }
}

// ─────────────────────────────────────────────────────────────
// Request Parsing
// ─────────────────────────────────────────────────────────────

async function parseJson<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw MmrError.badRequest('Invalid JSON body');
  }
}

function parseIntParam(value: string | null, name: string): number | undefined {
  if (value === null) return undefined;
  const num = parseInt(value, 10);
  if (Number.isNaN(num)) {
    throw MmrError.badRequest(`Invalid ${name}: must be an integer`);
  }
  return num;
}

// ─────────────────────────────────────────────────────────────
// Route Handlers
// ─────────────────────────────────────────────────────────────

async function handleHealth(): Promise<Response> {
  return success({ status: 'healthy', timestamp: Date.now() });
}

async function handleAppend(req: Request, env: Env): Promise<Response> {
  requireAuth(req, env);
  const body = await parseJson(req);
  const result = await appendEvent(env.DB, body);
  return success(result);
}

async function handleBatchAppend(req: Request, env: Env): Promise<Response> {
  requireAuth(req, env);
  const body = await parseJson<{ events: unknown[]; stop_on_error?: boolean }>(req);

  if (!Array.isArray(body.events)) {
    throw MmrError.badRequest('events must be an array');
  }

  if (body.events.length > 100) {
    throw MmrError.badRequest('Maximum 100 events per batch');
  }

  const result = await batchAppend(env.DB, body.events, {
    stopOnError: body.stop_on_error,
  });

  return success(result);
}

async function handleHead(env: Env): Promise<Response> {
  const state = await getHead(env.DB);
  return success({
    version: state.leaf_count,
    root_hash: state.root_hash,
    peaks: state.peaks,
  });
}

async function handleGetLeaf(env: Env, leafIndex: number): Promise<Response> {
  const leaf = await getLeafByIndex(env.DB, leafIndex);
  return success({ leaf });
}

async function handleListLeaves(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);

  const params: ListLeavesParams = {
    limit: parseIntParam(url.searchParams.get('limit'), 'limit'),
    offset: parseIntParam(url.searchParams.get('offset'), 'offset'),
    actor: url.searchParams.get('actor') ?? undefined,
    tag: url.searchParams.get('tag') ?? undefined,
    type: url.searchParams.get('type') ?? undefined,
    since_ms: parseIntParam(url.searchParams.get('since_ms'), 'since_ms'),
    until_ms: parseIntParam(url.searchParams.get('until_ms'), 'until_ms'),
  };

  const result = await listEvents(env.DB, params);
  return success(result);
}

async function handleProof(req: Request, env: Env, leafIndex: number): Promise<Response> {
  const url = new URL(req.url);
  const version = parseIntParam(url.searchParams.get('version'), 'version');
  const proof = await buildProof(env.DB, leafIndex, version);
  return success({ proof });
}

async function handleVerify(req: Request): Promise<Response> {
  const body = await parseJson<{ proof?: MmrProof }>(req);

  if (!body.proof) {
    throw MmrError.badRequest('Missing proof in request body');
  }

  // Validate proof structure
  const p = body.proof;
  if (
    typeof p.version !== 'number' ||
    typeof p.root_hash !== 'string' ||
    typeof p.leaf_index !== 'number' ||
    typeof p.leaf_hash !== 'string' ||
    typeof p.peak_pos !== 'number' ||
    !Array.isArray(p.peaks) ||
    !Array.isArray(p.siblings)
  ) {
    throw MmrError.badRequest('Malformed proof structure');
  }

  const result = await verifyProof(body.proof);
  return success(result);
}

// ─────────────────────────────────────────────────────────────
// Router
// ─────────────────────────────────────────────────────────────

type RouteHandler = (req: Request, env: Env, params: Record<string, string>) => Promise<Response>;

interface Route {
  method: string;
  pattern: RegExp;
  handler: RouteHandler;
}

const routes: Route[] = [
  // Health check
  {
    method: 'GET',
    pattern: /^\/health$/,
    handler: async () => handleHealth(),
  },

  // Append single event (admin)
  {
    method: 'POST',
    pattern: /^\/v1\/mmr\/append$/,
    handler: async (req, env) => handleAppend(req, env),
  },

  // Append batch (admin)
  {
    method: 'POST',
    pattern: /^\/v1\/mmr\/batch$/,
    handler: async (req, env) => handleBatchAppend(req, env),
  },

  // Get current head
  {
    method: 'GET',
    pattern: /^\/v1\/mmr\/head$/,
    handler: async (_req, env) => handleHead(env),
  },

  // Get specific leaf
  {
    method: 'GET',
    pattern: /^\/v1\/mmr\/leaf\/(?<index>\d+)$/,
    handler: async (_req, env, params) => handleGetLeaf(env, parseInt(params.index, 10)),
  },

  // List/search leaves
  {
    method: 'GET',
    pattern: /^\/v1\/mmr\/leaves$/,
    handler: async (req, env) => handleListLeaves(req, env),
  },

  // Get inclusion proof
  {
    method: 'GET',
    pattern: /^\/v1\/mmr\/proof\/(?<index>\d+)$/,
    handler: async (req, env, params) => handleProof(req, env, parseInt(params.index, 10)),
  },

  // Verify proof (public)
  {
    method: 'POST',
    pattern: /^\/v1\/mmr\/verify$/,
    handler: async (req) => handleVerify(req),
  },
];

function matchRoute(method: string, path: string): { handler: RouteHandler; params: Record<string, string> } | null {
  for (const route of routes) {
    if (route.method !== method) continue;

    const match = path.match(route.pattern);
    if (match) {
      return {
        handler: route.handler,
        params: match.groups ?? {},
      };
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────
// Main Export
// ─────────────────────────────────────────────────────────────

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    try {
      const matched = matchRoute(req.method, path);

      if (!matched) {
        // Check if path exists but method is wrong
        for (const route of routes) {
          if (path.match(route.pattern)) {
            return json(
              { ok: false, error: `Method not allowed. Use ${route.method}` },
              405
            );
          }
        }
        return json({ ok: false, error: 'Not found', code: 'NOT_FOUND' }, 404);
      }

      return await matched.handler(req, env, matched.params);
    } catch (e) {
      if (e instanceof MmrError) {
        return error(e);
      }

      // Log unexpected errors in production
      console.error('Unexpected error:', e);

      const message = e instanceof Error ? e.message : String(e);
      return json({ ok: false, error: message, code: 'INTERNAL' }, 500);
    }
  },
};

// Re-export types for consumers
export type { Env, MmrProof, AppendResult } from './types';
