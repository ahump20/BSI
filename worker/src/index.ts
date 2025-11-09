import { Router, type IRequest } from 'itty-router';

interface Env {
  UE_PROXY_TARGET: string;
  FEATURE_FLAGS: KVNamespace;
}

const router = Router();

router.get('/api/flags', async (request: IRequest, env: Env) => {
  const url = new URL(request.url ?? 'https://dummy.local');
  const keysParam = url.searchParams.get('keys');
  if (!keysParam) {
    return new Response(JSON.stringify({ error: 'keys query parameter is required' }), {
      status: 400,
      headers: buildJsonHeaders(),
    });
  }

  const keys = Array.from(new Set(keysParam.split(',').map((key) => key.trim()).filter(Boolean)));
  const flagEntries = await Promise.all(
    keys.map(async (key) => {
      const value = await env.FEATURE_FLAGS.get(key, 'json');
      return [key, value ?? null] as const;
    })
  );

  return new Response(
    JSON.stringify({
      flags: Object.fromEntries(flagEntries),
    }),
    {
      headers: buildJsonHeaders(),
    }
  );
});

router.all('/dev/ue/*', (request: IRequest, env: Env) => proxyToUnderdogEdge(request, env));
router.all('/dev/ue', (request: IRequest, env: Env) => proxyToUnderdogEdge(request, env));

router.options('*', () =>
  new Response(null, {
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-headers': '*',
      'access-control-allow-methods': 'GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS',
    },
  })
);

router.all('*', () => new Response('Not Found', { status: 404 }));

async function proxyToUnderdogEdge(request: IRequest, env: Env): Promise<Response> {
  const incomingUrl = new URL(request.url ?? 'https://dummy.local');
  const proxyTarget = new URL(env.UE_PROXY_TARGET);
  const workerRequest = request as unknown as Request;

  const pathnameSuffix = incomingUrl.pathname.replace(/^\/dev\/ue/, '');
  const targetUrl = new URL(pathnameSuffix || '/', proxyTarget);
  targetUrl.search = incomingUrl.search;

  const body = request.method === 'GET' || request.method === 'HEAD' ? undefined : await readRequestBody(workerRequest);

  const init: RequestInit = {
    method: request.method,
    headers: sanitizeHeaders(workerRequest.headers, proxyTarget.hostname),
    body,
    redirect: 'manual',
  };

  try {
    const response = await fetch(targetUrl.toString(), init);
    return rewriteProxyResponse(response);
  } catch (error) {
    console.error('proxy failure', error);
    return new Response(JSON.stringify({ error: 'Upstream request failed' }), {
      status: 502,
      headers: buildJsonHeaders(),
    });
  }
}

async function readRequestBody(request: Request): Promise<BodyInit | null | undefined> {
  if (request.method === 'GET' || request.method === 'HEAD') {
    return undefined;
  }
  const clone = request.clone();
  const arrayBuffer = await clone.arrayBuffer();
  return arrayBuffer;
}

function sanitizeHeaders(headers: Headers, host: string): Headers {
  const forwarded = new Headers();
  headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (['host', 'cf-connecting-ip', 'cf-ray'].includes(lower)) {
      return;
    }
    forwarded.set(key, value);
  });
  forwarded.set('host', host);
  return forwarded;
}

function rewriteProxyResponse(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set('access-control-allow-origin', '*');
  headers.set('access-control-allow-headers', '*');
  headers.set('access-control-allow-methods', 'GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS');
  return new Response(response.body, {
    status: response.status,
    headers,
  });
}

function buildJsonHeaders(): HeadersInit {
  return {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
  };
}

export default {
  fetch: (request: Request, env: Env, ctx: ExecutionContext) => router.handle(request, env, ctx),
};
