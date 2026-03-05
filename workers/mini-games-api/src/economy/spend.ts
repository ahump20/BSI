import type { Env } from '../types';
import { getCatalogItem } from './catalog';
import { levelFromXp, xpToNextLevel } from './leveling';

interface SpendRequest {
  deviceId: string;
  itemId: string;
}

export async function spendCoins(body: SpendRequest, env: Env): Promise<Response> {
  if (!body.deviceId || !body.itemId) {
    return json({ error: 'Missing deviceId or itemId' }, 400);
  }

  const item = getCatalogItem(body.itemId);
  if (!item) {
    return json({ error: 'Item not found in catalog' }, 404);
  }

  // Check balance
  const wallet = await env.DB.prepare(
    `SELECT blaze_coins, xp FROM wallets WHERE device_id = ?`
  ).bind(body.deviceId).first();

  if (!wallet) {
    return json({ error: 'Wallet not found' }, 404);
  }

  if ((wallet.blaze_coins as number) < item.cost) {
    return json({ error: 'Insufficient coins', required: item.cost, balance: wallet.blaze_coins }, 400);
  }

  // Deduct
  await env.DB.prepare(
    `UPDATE wallets SET blaze_coins = blaze_coins - ?, updated_at = datetime('now') WHERE device_id = ?`
  ).bind(item.cost, body.deviceId).run();

  // Log transaction
  await env.DB.prepare(
    `INSERT INTO transactions (device_id, type, currency, amount, reason, metadata) VALUES (?, 'spend', 'coins', ?, ?, ?)`
  ).bind(
    body.deviceId,
    item.cost,
    `Purchased ${item.name}`,
    JSON.stringify({ itemId: item.id, itemName: item.name })
  ).run();

  const updatedWallet = await env.DB.prepare(
    `SELECT blaze_coins, xp FROM wallets WHERE device_id = ?`
  ).bind(body.deviceId).first();

  const totalXp = (updatedWallet?.xp as number) ?? 0;

  return json({
    purchased: { itemId: item.id, itemName: item.name, cost: item.cost },
    wallet: {
      blazeCoins: updatedWallet?.blaze_coins,
      xp: totalXp,
      level: levelFromXp(totalXp),
      xpToNextLevel: xpToNextLevel(totalXp),
    },
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
