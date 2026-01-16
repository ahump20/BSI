/**
 * CFB API Alias - Redirects /api/cfb/* to /api/college-football/*
 *
 * This provides backwards compatibility for clients using the shorter path.
 * Canonical endpoints are at /api/college-football/
 */

export const onRequest: PagesFunction = async (context) => {
  const { request, params } = context;
  const url = new URL(request.url);

  // Get the route parts
  const routeParts = params.route as string[] | undefined;
  const subPath = routeParts?.join('/') || '';

  // Build new URL pointing to college-football endpoint
  const newUrl = new URL(url);
  newUrl.pathname = `/api/college-football/${subPath}`;

  // Fetch from the canonical endpoint
  const response = await fetch(newUrl.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.method !== 'GET' ? request.body : undefined,
  });

  // Return the response with CORS headers
  const responseHeaders = new Headers(response.headers);
  responseHeaders.set('Access-Control-Allow-Origin', '*');
  responseHeaders.set('X-CFB-Alias', 'true');
  responseHeaders.set('X-Canonical-Path', newUrl.pathname);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
};
