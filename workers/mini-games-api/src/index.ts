import type { Env } from './types';
import { submitScore, getGameLeaderboard, getGlobalLeaderboard } from './leaderboard';
import { checkRateLimit } from './rate-limiter';
import { handleEconomyRoute } from './economy/router';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0';

    // Economy routes
    if (path.startsWith('/api/mini-games/economy/')) {
      try {
        const economyResponse = await handleEconomyRoute(path, request, env);
        if (economyResponse) return economyResponse;
      } catch {
        return json({ error: 'Invalid request body' }, 400);
      }
    }

    // POST /api/mini-games/leaderboard/submit
    if (path === '/api/mini-games/leaderboard/submit' && request.method === 'POST') {
      const allowed = await checkRateLimit(ip, env);
      if (!allowed) {
        return json({ error: 'Rate limited. Try again in a minute.' }, 429);
      }

      try {
        const body = await request.json();
        return await submitScore(body, ip, env);
      } catch {
        return json({ error: 'Invalid JSON body' }, 400);
      }
    }

    // GET /api/mini-games/leaderboard/global
    if (path === '/api/mini-games/leaderboard/global' && request.method === 'GET') {
      const limit = parseInt(url.searchParams.get('limit') || '20', 10);
      return await getGlobalLeaderboard(limit, env);
    }

    // GET /api/mini-games/leaderboard/:gameId
    const gameMatch = path.match(/^\/api\/mini-games\/leaderboard\/([a-z0-9-]+)$/);
    if (gameMatch && request.method === 'GET') {
      const limit = parseInt(url.searchParams.get('limit') || '20', 10);
      return await getGameLeaderboard(gameMatch[1], limit, env);
    }

    return json({ error: 'Not found' }, 404);
  },
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
