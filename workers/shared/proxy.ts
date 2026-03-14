import type { Env } from './types';
import { SECURITY_HEADERS } from './constants';

/**
 * Patterns for dynamic game-detail routes across all sports.
 * When Pages returns 404 for an unknown game ID, we re-fetch using the
 * "placeholder" shell page. The client-side router reads the real game ID
 * from the browser URL and fetches data dynamically, so this works
 * seamlessly for any game ID — even those not present at build time.
 */
const GAME_DETAIL_PATTERN = /^\/(college-baseball|mlb|nfl|nba|cfb)\/game\/[^/]+\/(box-score|play-by-play|team-stats|recap|live)?\/?$/;

function buildPlaceholderPath(pathname: string): string | null {
  const match = pathname.match(GAME_DETAIL_PATTERN);
  if (!match) return null;
  const sport = match[1];
  const subRoute = match[2] || '';
  const trailing = subRoute ? `${subRoute}/` : '';
  return `/${sport}/game/placeholder/${trailing}`;
}

export async function proxyToPages(request: Request, env: Env): Promise<Response> {
  const origin = env.PAGES_ORIGIN || 'https://blazesportsintel.pages.dev';
  const url = new URL(request.url);
  const pagesUrl = `${origin}${url.pathname}${url.search}`;
  const headers = new Headers(request.headers);
  headers.delete('host');

  const pagesResponse = await fetch(pagesUrl, {
    method: request.method,
    headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
    redirect: 'follow',
  });

  // If Pages returns 404 for a game detail route, serve the placeholder
  // shell instead. The client-side Next.js router reads the real game ID
  // from window.location, so the page will load the correct game data.
  if (pagesResponse.status === 404 && request.method === 'GET') {
    const placeholderPath = buildPlaceholderPath(url.pathname);
    if (placeholderPath) {
      const fallbackUrl = `${origin}${placeholderPath}`;
      const fallbackResponse = await fetch(fallbackUrl, { headers });
      if (fallbackResponse.ok) {
        const response = new Response(fallbackResponse.body, fallbackResponse);
        for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
          response.headers.set(key, value);
        }
        response.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
        return response;
      }
    }
  }

  const response = new Response(pagesResponse.body, pagesResponse);

  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.match(/\.(js|css|woff2?|ttf|eot|ico|png|jpg|jpeg|gif|svg|webp|avif)$/)
  ) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  } else {
    const ct = response.headers.get('Content-Type') || '';
    if (ct.includes('text/html')) {
      response.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
    }
  }

  return response;
}
