import type { Env } from './types';
import { SECURITY_HEADERS } from './constants';

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

  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.match(/\.(js|css|woff2?|ttf|eot|ico|png|jpg|jpeg|gif|svg|webp|avif)$/)
  ) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }

  return response;
}
