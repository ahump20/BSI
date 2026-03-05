/**
 * Pages Functions Middleware — /api/*
 *
 * Runs before every Pages Function under /api/.
 * Adds CORS headers, request logging, and error handling.
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
