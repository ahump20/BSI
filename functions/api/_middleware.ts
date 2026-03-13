/**
 * Pages Functions Middleware — /api/*
 *
 * Runs before every Pages Function under /api/.
 * Adds CORS headers, request logging, and error handling.
 *
 * ARCHITECTURE NOTE: In production, blazesportsintel.com/* is routed through
 * the apex Worker (workers/wrangler.toml → blazesportsintel-worker). The Worker
 * handles API routes and proxies static asset requests to this Cloudflare Pages
 * project. These Pages Functions serve as the API layer when the site is accessed
 * directly via the *.pages.dev domain (e.g., blazesportsintel.pages.dev/api/*),
 * and as a fallback if the Worker is unavailable.
 *
 * Both the Worker and Pages Functions share the same KV namespace (BSI_CACHE / KV)
 * so cached data is consistent regardless of which path serves the request.
 */

export const onRequest: PagesFunction = async (context) => {
  const start = Date.now();

  try {
    const response = await context.next();
    const duration = Date.now() - start;

    // Clone to add timing header
    const result = new Response(response.body, response);
    result.headers.set('X-Response-Time', `${duration}ms`);
    result.headers.set('X-Served-By', 'pages-function');

    return result;
  } catch (err) {
    const duration = Date.now() - start;
    console.error(`[API] ${context.request.method} ${new URL(context.request.url).pathname} failed after ${duration}ms:`, err);

    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'X-Response-Time': `${duration}ms`,
        },
      }
    );
  }
};
