/**
 * Pages Function — /api/health
 *
 * Lightweight health-check that runs on Cloudflare Pages Functions.
 * When the hybrid Worker is active it will intercept this route,
 * but this function serves as a fallback during Pages-only previews.
 */

interface Env {
  KV?: KVNamespace;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  return new Response(
    JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      mode: 'pages-function',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
};
