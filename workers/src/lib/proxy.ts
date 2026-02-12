import type { Env } from '../env';

const STATIC_CACHE_RE = /\.(js|css|woff2?|ttf|eot|ico|png|jpg|jpeg|gif|svg|webp|avif)$/;

const BASE_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
};

const DEFAULT_PERMISSIONS = 'camera=(), microphone=(), geolocation=()';
const PRESENCE_PERMISSIONS = 'camera=(self), microphone=(self), geolocation=()';

export function isPresenceCoachPath(pathname: string): boolean {
  return (
    pathname === '/presence-coach' ||
    pathname.startsWith('/presence-coach/') ||
    pathname === '/api/presence-coach' ||
    pathname.startsWith('/api/presence-coach/')
  );
}

export function buildSecurityHeaders(pathname: string): Record<string, string> {
  return {
    ...BASE_HEADERS,
    'Permissions-Policy': isPresenceCoachPath(pathname)
      ? PRESENCE_PERMISSIONS
      : DEFAULT_PERMISSIONS,
  };
}

export async function proxyToPages(request: Request, env: Env): Promise<Response> {
  const origin = env.PAGES_ORIGIN || 'https://blazesportsintel.pages.dev';
  const url = new URL(request.url);
  const pagesUrl = `${origin}${url.pathname}${url.search}`;

  const pagesResponse = await fetch(pagesUrl, {
    method: request.method,
    headers: request.headers,
    redirect: 'follow',
  });

  const response = new Response(pagesResponse.body, pagesResponse);

  const secHeaders = buildSecurityHeaders(url.pathname);
  for (const [key, value] of Object.entries(secHeaders)) {
    response.headers.set(key, value);
  }

  if (url.pathname.startsWith('/_next/static/') || STATIC_CACHE_RE.test(url.pathname)) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }

  return response;
}
