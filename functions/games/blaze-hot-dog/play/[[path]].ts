// Proxy function for Blaze Hot Dog Dash game
const TARGET_HOST = 'blaze-hotdog-dash.pages.dev';

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);

  // Build target URL - strip /games/blaze-hot-dog/play prefix
  const path = url.pathname.replace(/^\/games\/blaze-hot-dog\/play\/?/, '/');
  const targetUrl = `https://${TARGET_HOST}${path}${url.search}`;

  // Clone the request with the new URL
  const proxyRequest = new Request(targetUrl, {
    method: context.request.method,
    headers: context.request.headers,
    body: context.request.body,
  });

  // Fetch from target
  const response = await fetch(proxyRequest);

  // Clone response and modify headers
  const newHeaders = new Headers(response.headers);
  newHeaders.set('Access-Control-Allow-Origin', '*');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
};
