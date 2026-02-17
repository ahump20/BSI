import type { Env } from '../types';
import { levelFromXp, xpToNextLevel } from './leveling';

export async function registerWallet(deviceId: string, env: Env): Promise<Response> {
  await env.DB.prepare(
    `INSERT OR IGNORE INTO wallets (device_id) VALUES (?)`
  ).bind(deviceId).run();

  return getWallet(deviceId, env);
}

export async function getWallet(deviceId: string, env: Env): Promise<Response> {
  const row = await env.DB.prepare(
    `SELECT device_id, blaze_coins, xp, created_at, updated_at FROM wallets WHERE device_id = ?`
  ).bind(deviceId).first();

  if (!row) {
    return json({ error: 'Wallet not found' }, 404);
  }

  const xp = row.xp as number;

  return json({
    deviceId: row.device_id,
    blazeCoins: row.blaze_coins,
    xp,
    level: levelFromXp(xp),
    xpToNextLevel: xpToNextLevel(xp),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
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
