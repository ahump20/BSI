import type { Env, MatchResult } from '../types';
import { validateMatchResult, calculateEarnings } from './validation';
import { levelFromXp, xpToNextLevel } from './leveling';

const EARN_COOLDOWN_SEC = 60;

export async function earnFromMatch(body: MatchResult, env: Env): Promise<Response> {
  const error = validateMatchResult(body);
  if (error) return json({ error }, 400);

  // Rate limit: 1 earn per device per 60s
  const rlKey = `rl:earn:${body.deviceId}`;
  const existing = await env.RATE_LIMIT.get(rlKey);
  if (existing) {
    return json({ error: 'Earn rate limited. One submission per 60 seconds.' }, 429);
  }
  await env.RATE_LIMIT.put(rlKey, '1', { expirationTtl: EARN_COOLDOWN_SEC });

  const { coins, xp, reasons } = calculateEarnings(body);

  // Update wallet
  const result = await env.DB.prepare(
    `UPDATE wallets SET blaze_coins = blaze_coins + ?, xp = xp + ?, updated_at = datetime('now') WHERE device_id = ?`
  ).bind(coins, xp, body.deviceId).run();

  if (!result.meta.changed_db) {
    return json({ error: 'Wallet not found. Register first.' }, 404);
  }

  // Log transaction
  await env.DB.prepare(
    `INSERT INTO transactions (device_id, type, currency, amount, reason, metadata) VALUES (?, 'earn_match', 'both', ?, ?, ?)`
  ).bind(
    body.deviceId,
    coins,
    reasons.join(', '),
    JSON.stringify({ coins, xp, matchResult: body })
  ).run();

  // Fetch updated wallet
  const wallet = await env.DB.prepare(
    `SELECT blaze_coins, xp FROM wallets WHERE device_id = ?`
  ).bind(body.deviceId).first();

  const totalXp = (wallet?.xp as number) ?? xp;

  return json({
    earned: { coins, xp, reasons },
    wallet: {
      blazeCoins: wallet?.blaze_coins,
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
