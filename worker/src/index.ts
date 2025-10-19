import type { ExecutionContext, ExportedHandler } from '@cloudflare/workers-types';

export interface Env {
  UPSTREAM_BASE_URL: string;
  WEBGPU_DEMO_ORIGIN?: string;
  ALLOWED_ORIGINS?: string;
  CACHE_TTL_SECONDS?: string;
}

const DEFAULT_CACHE_TTL = 30;

const TEXT_ENCODER = new TextEncoder();

function buildCorsHeaders(origin: string | null, env: Env): HeadersInit {
  const allowedOrigins = env.ALLOWED_ORIGINS
    ? env.ALLOWED_ORIGINS.split(',').map((value) => value.trim()).filter(Boolean)
    : [];

  const allowOriginHeader =
    allowedOrigins.length === 0 || (origin && allowedOrigins.includes(origin))
      ? origin ?? '*'
      : allowedOrigins[0] ?? '*';

  return {
    'Access-Control-Allow-Origin': allowOriginHeader,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Methods': 'GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS'
  };
}

function json(data: unknown, init?: ResponseInit): Response {
  const body = JSON.stringify(data, null, 2);
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  return new Response(body, {
    ...init,
    headers
  });
}

function missingEnvResponse(variable: string): Response {
  return json(
    {
      error: `Missing required environment variable: ${variable}`
    },
    { status: 500 }
  );
}

function getCacheTtl(env: Env): number {
  const ttl = env.CACHE_TTL_SECONDS ? Number(env.CACHE_TTL_SECONDS) : DEFAULT_CACHE_TTL;
  if (Number.isNaN(ttl) || ttl < 0) {
    return DEFAULT_CACHE_TTL;
  }
  return Math.min(ttl, 60);
}

async function handleProxy(
  request: Request,
  env: Env,
  ctx?: ExecutionContext
): Promise<Response> {
  if (!env.UPSTREAM_BASE_URL) {
    return missingEnvResponse('UPSTREAM_BASE_URL');
  }

  const requestUrl = new URL(request.url);
  const upstreamBase = env.UPSTREAM_BASE_URL.replace(/\/$/, '');
  const targetPath = requestUrl.pathname.replace(/^\/proxy/, '') || '/';
  const upstreamUrl = `${upstreamBase}${targetPath}${requestUrl.search}`;

  const cache = caches.default;
  const cacheKey = new Request(upstreamUrl, {
    method: 'GET',
    headers: request.headers
  });

  if (request.method === 'GET') {
    const cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      const headers = new Headers(cachedResponse.headers);
      headers.set('x-bsi-cache', 'HIT');
      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers
      });
    }
  }

  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.set('x-forwarded-proto', 'https');

  let body: BodyInit | null | undefined;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const arrayBuffer = await request.arrayBuffer();
    body = arrayBuffer.byteLength ? arrayBuffer : undefined;
  }

  const upstreamRequest = new Request(upstreamUrl, {
    method: request.method,
    headers,
    body,
    redirect: 'follow'
  });

  const response = await fetch(upstreamRequest);
  const responseHeaders = new Headers(response.headers);
  responseHeaders.set('x-bsi-cache', 'MISS');
  responseHeaders.set('x-bsi-upstream', upstreamUrl);

  if (request.method === 'GET' && response.ok) {
    const ttl = getCacheTtl(env);
    responseHeaders.set('cache-control', `public, max-age=${ttl}`);
    const cachePromise = cache.put(cacheKey, response.clone());
    if (ctx) {
      ctx.waitUntil(cachePromise);
    } else {
      void cachePromise;
    }
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders
  });
}

function renderHealth(env: Env): Response {
  return json({
    status: 'ok',
    service: 'bsi-proxy-worker',
    upstreamConfigured: Boolean(env.UPSTREAM_BASE_URL),
    webgpuDemo: env.WEBGPU_DEMO_ORIGIN ?? null,
    timestamp: new Date().toISOString()
  });
}

function renderWebGpuManifest(env: Env): Response {
  const origin = env.WEBGPU_DEMO_ORIGIN ?? 'https://demo.bsi.local';
  return json({
    name: 'Blaze Sports Intel WebGPU Demo',
    origin,
    entrypoints: {
      scatter: `${origin}/scatter`,
      pitchMovement: `${origin}/pitch-movement`
    }
  });
}

function renderNotFound(): Response {
  return new Response('Not Found', { status: 404 });
}

function handleOptions(request: Request, env: Env): Response {
  const headers = buildCorsHeaders(request.headers.get('Origin'), env);
  return new Response(null, { headers });
}

function applyCors(response: Response, request: Request, env: Env): Response {
  const headers = new Headers(response.headers);
  const corsHeaders = buildCorsHeaders(request.headers.get('Origin'), env);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

function renderDocs(): Response {
  const body = TEXT_ENCODER.encode(`{
  "service": "BlazeSportsIntel Proxy Worker",
  "endpoints": {
    "/health": "Service health payload",
    "/proxy/*": "Reverse proxy to the configured origin",
    "/webgpu/manifest": "WebGPU entrypoint manifest for client routing"
  }
}`);
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    }
  });
}

const worker: ExportedHandler<Env> = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return applyCors(handleOptions(request, env), request, env);
    }

    let response: Response;
    switch (url.pathname) {
      case '/':
      case '/docs':
        response = renderDocs();
        break;
      case '/health':
        response = renderHealth(env);
        break;
      case '/webgpu/manifest':
        response = renderWebGpuManifest(env);
        break;
      default:
        if (url.pathname.startsWith('/proxy')) {
          response = await handleProxy(request, env, ctx);
        } else {
          response = renderNotFound();
        }
    }

    return applyCors(response, request, env);
  }
};

export default worker;
