import type { Env } from '../types';

export async function getTransactions(deviceId: string, env: Env): Promise<Response> {
  const rows = await env.DB.prepare(
    `SELECT id, device_id, type, currency, amount, reason, metadata, created_at
     FROM transactions WHERE device_id = ? ORDER BY created_at DESC LIMIT 50`
  ).bind(deviceId).all();

  return new Response(JSON.stringify({ transactions: rows.results }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
