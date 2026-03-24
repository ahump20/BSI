/**
 * Push Notification Handler
 *
 * POST /api/push/register — register/update Expo push token + favorite teams
 * POST /api/push/send     — internal: check scores, send via Expo Push API
 *
 * Uses D1 for registrations, RATE_LIMIT KV for per-game rate limiting.
 * Sends via Expo Push API (https://exp.host/--/api/v2/push/send).
 */

import type { Env } from '../shared/types';
import { json, apiError } from '../shared/helpers';

interface RegisterBody {
  expoPushToken: string;
  favoriteTeams: string[];
}

interface PushRegistration {
  id: number;
  expo_push_token: string;
  favorite_teams: string;
  platform: string;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// POST /api/push/register
// ---------------------------------------------------------------------------

export async function handlePushRegister(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return apiError('Method not allowed', 'BAD_REQUEST', 405);
  }

  let body: RegisterBody;
  try {
    body = await request.json() as RegisterBody;
  } catch {
    return apiError('Invalid JSON body', 'BAD_REQUEST', 400);
  }

  const { expoPushToken, favoriteTeams } = body;

  if (!expoPushToken || typeof expoPushToken !== 'string') {
    return apiError('expoPushToken is required', 'BAD_REQUEST', 400);
  }

  if (!expoPushToken.startsWith('ExponentPushToken[')) {
    return apiError('Invalid Expo push token format', 'BAD_REQUEST', 400);
  }

  const teamsJson = JSON.stringify(Array.isArray(favoriteTeams) ? favoriteTeams : []);

  try {
    await env.DB.prepare(
      `INSERT INTO push_registrations (expo_push_token, favorite_teams, updated_at)
       VALUES (?, ?, datetime('now'))
       ON CONFLICT(expo_push_token) DO UPDATE SET
         favorite_teams = excluded.favorite_teams,
         updated_at = datetime('now')`
    )
      .bind(expoPushToken, teamsJson)
      .run();

    return json({ registered: true, token: expoPushToken, teams: teamsJson });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Registration failed';
    return apiError(message, 'INTERNAL_ERROR', 500);
  }
}

// ---------------------------------------------------------------------------
// POST /api/push/send — internal cron-callable
// ---------------------------------------------------------------------------

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data: Record<string, string>;
  sound: 'default';
  priority: 'high';
}

async function isRateLimited(
  kv: KVNamespace,
  token: string,
  gameId: string
): Promise<boolean> {
  const key = `push:${token}:${gameId}`;
  const existing = await kv.get(key);
  if (existing) return true;
  await kv.put(key, '1', { expirationTtl: 900 }); // 15 minutes
  return false;
}

async function sendExpoPush(messages: ExpoPushMessage[]): Promise<void> {
  if (messages.length === 0) return;

  // Expo Push API accepts batches of up to 100
  const batches: ExpoPushMessage[][] = [];
  for (let i = 0; i < messages.length; i += 100) {
    batches.push(messages.slice(i, i + 100));
  }

  for (const batch of batches) {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(batch),
    });
  }
}

export async function handlePushSend(env: Env): Promise<Response> {
  // This endpoint is intended for cron triggers or admin use only
  const rateKv = env.RATE_LIMIT;
  if (!rateKv) {
    return apiError('RATE_LIMIT KV not bound', 'INTERNAL_ERROR', 500);
  }

  try {
    // Fetch all registrations
    const registrations = await env.DB.prepare(
      'SELECT * FROM push_registrations'
    ).all<PushRegistration>();

    if (!registrations.results || registrations.results.length === 0) {
      return json({ sent: 0, message: 'No registrations found' });
    }

    // For now, return registration count. Full cron logic (score change detection,
    // matching against favorite teams, sending targeted pushes) will be implemented
    // when the cron trigger is wired up in the main worker's scheduled handler.
    return json({
      registrations: registrations.results.length,
      message: 'Push send endpoint ready. Wire cron for automated delivery.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Push send failed';
    return apiError(message, 'INTERNAL_ERROR', 500);
  }
}

export { isRateLimited, sendExpoPush };
export type { ExpoPushMessage, PushRegistration };
