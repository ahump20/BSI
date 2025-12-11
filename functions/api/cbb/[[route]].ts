/**
 * CBB (College Basketball) API Alias
 * Redirects /api/cbb/* to /api/basketball/* for backwards compatibility
 *
 * This provides a shorter path for clients using CBB prefix:
 * - /api/cbb/scoreboard → /api/basketball/scores (mapped)
 * - /api/cbb/scores → /api/basketball/scores
 * - /api/cbb/standings → /api/basketball/standings
 * - /api/cbb/teams → /api/basketball/teams
 */

export const onRequest: PagesFunction = async (context) => {
  const { request, params } = context;
  const url = new URL(request.url);

  // Get the route parts
  const routeParts = params.route as string[] | undefined;
  let subPath = routeParts?.join('/') || '';

  // Map 'scoreboard' to 'scores' for compatibility
  if (subPath === 'scoreboard') {
    subPath = 'scores';
  }

  // Build new URL pointing to basketball endpoint
  const newUrl = new URL(url);
  newUrl.pathname = `/api/basketball/${subPath}`;

  // Fetch from the canonical endpoint
  const response = await fetch(newUrl.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.method !== 'GET' ? request.body : undefined,
  });

  // Return the response with CORS headers
  const responseHeaders = new Headers(response.headers);
  responseHeaders.set('Access-Control-Allow-Origin', '*');
  responseHeaders.set('X-CBB-Alias', 'true');
  responseHeaders.set('X-Canonical-Path', newUrl.pathname);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
};
