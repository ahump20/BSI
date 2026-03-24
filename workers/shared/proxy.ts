import type { Env } from './types';
import { SECURITY_HEADERS } from './constants';

/**
 * Patterns for dynamic game-detail routes across all sports.
 * When Pages returns 404 for an unknown game ID, we re-fetch using the
 * "placeholder" shell page. The client-side router reads the real game ID
 * from the browser URL and fetches data dynamically, so this works
 * seamlessly for any game ID — even those not present at build time.
 */
/** Matches game detail HTML routes: /{sport}/game/{id}/ or /{sport}/game/{id}/{tab}/ */
const GAME_DETAIL_PATTERN = /^\/(college-baseball|mlb|nfl|nba|cfb)\/game\/[^/]+\/(box-score|play-by-play|team-stats|recap|live)?\/?$/;

/** Matches Next.js RSC metadata requests for game detail routes.
 *  e.g. /mlb/game/401833325/recap/__next._tree.txt?_rsc=... */
const GAME_RSC_PATTERN = /^\/(college-baseball|mlb|nfl|nba|cfb)\/game\/[^/]+\/((?:box-score|play-by-play|team-stats|recap|live)\/)?(__next\.[^?]+)/;

function buildPlaceholderPath(pathname: string): string | null {
  // Try HTML page match first
  const htmlMatch = pathname.match(GAME_DETAIL_PATTERN);
  if (htmlMatch) {
    const sport = htmlMatch[1];
    const subRoute = htmlMatch[2] || '';
    const trailing = subRoute ? `${subRoute}/` : '';
    return `/${sport}/game/placeholder/${trailing}`;
  }

  // Try RSC metadata file match
  const rscMatch = pathname.match(GAME_RSC_PATTERN);
  if (rscMatch) {
    const sport = rscMatch[1];
    const subRoute = rscMatch[2] || '';   // e.g. "recap/" or ""
    const rscFile = rscMatch[3];          // e.g. "__next._tree.txt"
    return `/${sport}/game/placeholder/${subRoute}${rscFile}`;
  }

  return null;
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
  // Handle both GET and HEAD — Next.js client router uses HEAD to check
  // if a route exists before prefetching. A HEAD 404 causes console errors
  // and breaks the client-side navigation optimization.
  if (pagesResponse.status === 404 && (request.method === 'GET' || request.method === 'HEAD')) {
    const placeholderPath = buildPlaceholderPath(url.pathname);
    if (placeholderPath) {
      const fallbackUrl = `${origin}${placeholderPath}`;
      // Always fetch as GET — Pages needs the full request to resolve the file.
      // For HEAD requests we strip the body from the response below.
      const fallbackResponse = await fetch(fallbackUrl, { method: 'GET', headers });
      if (fallbackResponse.ok) {
        const body = request.method === 'HEAD' ? null : fallbackResponse.body;
        const response = new Response(body, {
          status: fallbackResponse.status,
          statusText: fallbackResponse.statusText,
          headers: fallbackResponse.headers,
        });
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
