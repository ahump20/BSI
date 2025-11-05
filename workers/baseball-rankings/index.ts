export interface Env {
  BASEBALL_RANKINGS_CACHE: KVNamespace;
}

const CACHE_KEY = 'latest:rankings';

export default {
  async fetch(_request: Request, env: Env): Promise<Response> {
    const cachedPayload = await env.BASEBALL_RANKINGS_CACHE.get(CACHE_KEY);

    if (cachedPayload) {
      return new Response(cachedPayload, {
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'public, max-age=300',
        },
      });
    }

    const placeholder = JSON.stringify({
      status: 'ready',
      message: 'Baseball rankings worker configured. Populate cache to serve data.',
    });

    await env.BASEBALL_RANKINGS_CACHE.put(CACHE_KEY, placeholder, {
      expirationTtl: 300,
    });

    return new Response(placeholder, {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-cache',
      },
      status: 202,
    });
  },
};
