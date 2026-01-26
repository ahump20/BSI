// Proxy function for Sandlot Sluggers game (blaze-backyard-baseball)
const TARGET_HOST = 'blaze-backyard-baseball.pages.dev';
const TARGET_ORIGIN = `https://${TARGET_HOST}`;

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);

  // Build target URL - strip /games/sandlot-sluggers/play prefix
  const path = url.pathname.replace(/^\/games\/sandlot-sluggers\/play\/?/, '/');
  const targetUrl = `${TARGET_ORIGIN}${path}${url.search}`;

  // Fetch from target
  const response = await fetch(targetUrl, {
    method: context.request.method,
    headers: context.request.headers,
  });

  const contentType = response.headers.get('content-type') || '';

  // For HTML responses, rewrite asset paths to point to original host
  if (contentType.includes('text/html')) {
    let html = await response.text();
    // Rewrite absolute asset paths to full URLs
    html = html.replace(/src="\/assets\//g, `src="${TARGET_ORIGIN}/assets/`);
    html = html.replace(/href="\/assets\//g, `href="${TARGET_ORIGIN}/assets/`);
    html = html.replace(/src='\/assets\//g, `src='${TARGET_ORIGIN}/assets/`);
    html = html.replace(/href='\/assets\//g, `href='${TARGET_ORIGIN}/assets/`);

    return new Response(html, {
      status: response.status,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // For other responses, pass through
  const newHeaders = new Headers(response.headers);
  newHeaders.set('Access-Control-Allow-Origin', '*');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
};
