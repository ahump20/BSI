export interface Env {
  FEATURE_FLAGS: KVNamespace;
  UE_UPSTREAM: string;
}

const SECURITY_HEADERS: Record<string, string> = {
  'Content-Security-Policy': [
    "default-src 'none'",
    "base-uri 'none'",
    "connect-src 'self' https://*.blazesportsintel.com",
    "font-src 'self' data:",
    "img-src 'self' data:",
    "manifest-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "worker-src 'self'",
    "frame-ancestors 'none'",
  ].join('; '),
  'Permissions-Policy': [
    'accelerometer=()',
    'ambient-light-sensor=()',
    'autoplay=()',
    'camera=()',
    'cross-origin-isolated=()',
    'display-capture=()',
    'fullscreen=(self)',
    'geolocation=()',
    'gyroscope=()',
    'magnetometer=()',
    'microphone=()',
    'payment=()',
    'usb=()',
  ].join(', '),
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'cross-origin',
};

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'host',
]);

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/flags') {
      return withSecurityHeaders(await handleFlags(request, env));
    }

    if (url.pathname.startsWith('/dev/ue')) {
      return withSecurityHeaders(await handleUnrealProxy(request, env));
    }

    if (request.method === 'OPTIONS') {
      return withSecurityHeaders(buildCorsPreflightResponse(request.headers.get('Origin')));
    }

    return withSecurityHeaders(
      new Response('Not Found', {
        status: 404,
        headers: buildCorsHeaders(request.headers.get('Origin')),
      })
    );
  },
};

async function handleFlags(request: Request, env: Env): Promise<Response> {
  const origin = request.headers.get('Origin');

  if (request.method === 'OPTIONS') {
    return buildCorsPreflightResponse(origin);
  }

  if (request.method !== 'GET') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: {
        ...buildCorsHeaders(origin),
        'Content-Type': 'application/json',
        Allow: 'GET, OPTIONS',
      },
    });
  }

  const url = new URL(request.url);
  const segment = url.searchParams.get('segment')?.trim() || 'global';
  const kvKey = `flags:${segment}`;

  try {
    const flags = (await env.FEATURE_FLAGS.get(kvKey, {
      type: 'json',
    })) as Record<string, unknown> | null;

    const body = JSON.stringify({
      segment,
      flags: flags ?? {},
    });

    return new Response(body, {
      status: 200,
      headers: {
        ...buildCorsHeaders(origin),
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=30',
        'Vary': 'Origin',
        'ETag': await generateEtag(body),
      },
    });
  } catch (error) {
    console.error('[FlagsWorker] Failed to read flags', error);

    return new Response(JSON.stringify({ error: 'Failed to load feature flags' }), {
      status: 500,
      headers: {
        ...buildCorsHeaders(origin),
        'Content-Type': 'application/json',
      },
    });
  }
}

async function handleUnrealProxy(request: Request, env: Env): Promise<Response> {
  const origin = request.headers.get('Origin');
  const upstreamBase = env.UE_UPSTREAM?.trim();

  if (!upstreamBase) {
    return new Response('Unreal upstream missing', {
      status: 500,
      headers: buildCorsHeaders(origin),
    });
  }

  const upstreamUrl = buildUpstreamUrl(request.url, upstreamBase);

  const init: RequestInit = {
    method: request.method,
    headers: filterForwardHeaders(request.headers),
    redirect: 'manual',
    body: allowRequestBody(request.method) ? request.body : undefined,
  };

  const response = await fetch(upstreamUrl, init);
  const headers = filterResponseHeaders(response.headers);
  const mergedHeaders = new Headers({
    ...buildCorsHeaders(origin),
  });

  headers.forEach((value, key) => {
    mergedHeaders.set(key, value);
  });

  if (!mergedHeaders.has('Cache-Control')) {
    mergedHeaders.set('Cache-Control', 'private, max-age=0, must-revalidate');
  }

  mergedHeaders.set('Vary', 'Origin');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: mergedHeaders,
  });
}

function buildCorsHeaders(origin: string | null): Record<string, string> {
  if (!origin) {
    return {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS,PUT,PATCH,DELETE',
    };
  }

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS,PUT,PATCH,DELETE',
    'Access-Control-Allow-Credentials': 'true',
  };
}

function buildCorsPreflightResponse(origin: string | null): Response {
  return new Response(null, {
    status: 204,
    headers: {
      ...buildCorsHeaders(origin),
      'Access-Control-Max-Age': '600',
    },
  });
}

function filterForwardHeaders(headers: Headers): Headers {
  const result = new Headers();
  headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      result.set(key, value);
    }
  });
  return result;
}

function filterResponseHeaders(headers: Headers): Headers {
  const result = new Headers();
  headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      result.set(key, value);
    }
  });
  return result;
}

function allowRequestBody(method: string): boolean {
  return !['GET', 'HEAD'].includes(method.toUpperCase());
}

function buildUpstreamUrl(requestUrl: string, upstreamBase: string): string {
  const incoming = new URL(requestUrl);
  const upstream = new URL(upstreamBase);
  const suffix = incoming.pathname.replace(/^\/dev\/ue/, '');
  const pathname = `${upstream.pathname.replace(/\/$/, '')}${suffix}` || '/';
  upstream.pathname = pathname;
  upstream.search = incoming.search;
  return upstream.toString();
}

async function generateEtag(body: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(body));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return `W/\"${hashHex}\"`;
}

function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    headers.set(key, value);
  });
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
