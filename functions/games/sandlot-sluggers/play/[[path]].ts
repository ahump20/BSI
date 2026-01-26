// Proxy function for Sandlot Sluggers game (blaze-backyard-baseball)
const TARGET_HOST = 'blaze-backyard-baseball.pages.dev';

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);

  // Build target URL - strip /games/sandlot-sluggers/play prefix
  const path = url.pathname.replace(/^\/games\/sandlot-sluggers\/play\/?/, '/');
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
