/**
 * Swing Usage Worker Handler
 * Returns analysis count for the current month and pro status.
 */

import type { Env } from '../../shared/types';

export async function handleSwingUsage(
  req: Request,
  env: Env,
): Promise<Response> {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const bsiKey = req.headers.get('X-BSI-Key');
  const userId = bsiKey || 'anonymous';

  // Check pro status via BSI_KEYS KV
  let isPro = false;
  if (bsiKey && env.BSI_KEYS) {
    try {
      const raw = await env.BSI_KEYS.get(`key:${bsiKey}`);
      if (raw) {
        const keyData = JSON.parse(raw) as { tier: string; expires: number };
        isPro = keyData.tier === 'pro' || keyData.tier === 'enterprise';
        if (Date.now() > keyData.expires) isPro = false;
      }
    } catch {
      // KV read failure — default to free
    }
  }

  // Count analyses this month
  let analysesThisMonth = 0;
  if (env.DB) {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const result = await env.DB.prepare(
        `SELECT COUNT(*) as count FROM swing_analyses
         WHERE user_id = ? AND created_at >= ?`,
      )
        .bind(userId, startOfMonth.toISOString())
        .first<{ count: number }>();

      analysesThisMonth = result?.count ?? 0;
    } catch {
      // Table might not exist yet — return 0
    }
  }

  return new Response(
    JSON.stringify({
      analysesThisMonth,
      isPro,
      meta: {
        source: 'BSI Swing Intelligence',
        fetched_at: new Date().toISOString(),
        timezone: 'America/Chicago',
      },
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  );
}
