interface Env {
  FLAG_STORE: KVNamespace;
  UE_UPSTREAM: string;
}

const SECURITY_HEADERS: Record<string, string> = {
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'self'; connect-src 'self'",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "accelerometer=(), autoplay=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin"
};

function applySecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);

  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(key, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

function jsonResponse(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");

  return new Response(JSON.stringify(data), {
    ...init,
    headers
  });
}

async function handleFlags(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const key = url.searchParams.get("key") ?? "feature-flags";

  try {
    const flags = await env.FLAG_STORE.get(key, { type: "json" });

    return jsonResponse({
      key,
      flags: flags ?? {}
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to read feature flags";
    return jsonResponse({ error: message }, { status: 500 });
  }
}

function buildUpstreamUrl(requestUrl: URL, upstream: string): string {
  const base = new URL(upstream);
  const incomingPath = requestUrl.pathname.replace(/^\/dev\/ue/, "");

  const basePath = base.pathname.endsWith("/") ? base.pathname.slice(0, -1) : base.pathname;
  const suffix = incomingPath.startsWith("/") ? incomingPath : `/${incomingPath}`;
  const combinedPath = `${basePath}${suffix}`.replace(/\/+/g, "/") || "/";

  base.pathname = combinedPath;
  base.search = requestUrl.search;

  return base.toString();
}

async function handleUpstreamProxy(request: Request, env: Env): Promise<Response> {
  const targetUrl = buildUpstreamUrl(new URL(request.url), env.UE_UPSTREAM);

  const proxyRequest = new Request(targetUrl, request);
  const response = await fetch(proxyRequest);

  return new Response(response.body, response);
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    let response: Response;

    if (url.pathname === "/api/flags") {
      response = await handleFlags(request, env);
    } else if (url.pathname.startsWith("/dev/ue")) {
      response = await handleUpstreamProxy(request, env);
    } else if (url.pathname === "/health") {
      response = jsonResponse({ status: "ok", timestamp: new Date().toISOString() });
    } else {
      response = jsonResponse({ error: "Not found" }, { status: 404 });
    }

    return applySecurityHeaders(response);
  }
};
