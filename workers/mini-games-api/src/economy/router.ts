import type { Env } from '../types';
import { registerWallet, getWallet } from './wallet';
import { earnFromMatch } from './earn';
import { spendCoins } from './spend';
import { getTransactions } from './transactions';

/**
 * Dispatch economy routes. Called when path starts with /api/mini-games/economy/
 * Returns null if no route matched.
 */
export async function handleEconomyRoute(
  path: string,
  request: Request,
  env: Env
): Promise<Response | null> {
  // POST /economy/register
  if (path === '/api/mini-games/economy/register' && request.method === 'POST') {
    const body = await request.json<{ deviceId: string }>();
    if (!body.deviceId) return json({ error: 'Missing deviceId' }, 400);
    return registerWallet(body.deviceId, env);
  }

  // GET /economy/wallet/:deviceId
  const walletMatch = path.match(/^\/api\/mini-games\/economy\/wallet\/(.+)$/);
  if (walletMatch && request.method === 'GET') {
    return getWallet(decodeURIComponent(walletMatch[1]), env);
  }

  // POST /economy/earn
  if (path === '/api/mini-games/economy/earn' && request.method === 'POST') {
    const body = await request.json();
    return earnFromMatch(body, env);
  }

  // POST /economy/spend
  if (path === '/api/mini-games/economy/spend' && request.method === 'POST') {
    const body = await request.json();
    return spendCoins(body, env);
  }

  // GET /economy/transactions/:deviceId
  const txnMatch = path.match(/^\/api\/mini-games\/economy\/transactions\/(.+)$/);
  if (txnMatch && request.method === 'GET') {
    return getTransactions(decodeURIComponent(txnMatch[1]), env);
  }

  return null;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
