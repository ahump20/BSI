import { Hono } from 'hono';

interface RegisterBody {
  expoPushToken: string;
  favoriteTeams: string[];
}

const app = new Hono<{ Bindings: Env }>();

app.post('/api/push/register', async (c) => {
  // Authenticate via BSI key (matches site-wide auth model)
  const bsiKey = c.req.header('X-BSI-Key') ?? '';
  if (!bsiKey) {
    return c.json({ ok: false, error: 'Authentication required' }, 401);
  }
  const storedKey = await c.env.BSI_KEYS.get(bsiKey);
  if (!storedKey) {
    return c.json({ ok: false, error: 'Invalid key' }, 401);
  }

  const body = (await c.req.json().catch(() => null)) as RegisterBody | null;
  if (!body || typeof body.expoPushToken !== 'string' || !Array.isArray(body.favoriteTeams)) {
    return c.json({ ok: false, error: 'Invalid request' }, 400);
  }

  // Validate Expo push token format
  if (!/^ExponentPushToken\[.+\]$/.test(body.expoPushToken)) {
    return c.json({ ok: false, error: 'Invalid push token format' }, 400);
  }

  // Validate favoriteTeams: must be strings, max 30 teams, max 100 chars each
  const MAX_TEAMS = 30;
  const MAX_TEAM_LEN = 100;
  if (body.favoriteTeams.length > MAX_TEAMS) {
    return c.json({ ok: false, error: `Maximum ${MAX_TEAMS} favorite teams` }, 400);
  }
  if (!body.favoriteTeams.every((t) => typeof t === 'string' && t.length <= MAX_TEAM_LEN)) {
    return c.json({ ok: false, error: 'Invalid team entries' }, 400);
  }

  await c.env.BSI_PROD_DB.prepare(
    `INSERT INTO push_registrations (expo_push_token, favorite_teams, platform, updated_at)
     VALUES (?, ?, 'ios', datetime('now'))
     ON CONFLICT(expo_push_token) DO UPDATE SET
     favorite_teams = excluded.favorite_teams,
     updated_at = datetime('now')`
  )
    .bind(body.expoPushToken, JSON.stringify(body.favoriteTeams))
    .run();

  return c.json({ ok: true });
});

app.post('/api/push/send', async (c) => {
  const authHeader = c.req.header('Authorization') ?? '';
  const expectedSecret = await c.env.BSI_KEYS.get('PUSH_INTERNAL_SECRET');
  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return c.json({ ok: false, error: 'Unauthorized' }, 401);
  }

  return c.json({ ok: true, queued: 0 });
});

export default {
  fetch: app.fetch,
  // Scaffold: sends a single notification to verify the pipeline works.
  // Production version should paginate all registrations and batch-send
  // via Expo's push API (up to 100 tokens per request).
  async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
    try {
      const rows = await env.BSI_PROD_DB.prepare('SELECT expo_push_token FROM push_registrations LIMIT 1').all<{
        expo_push_token: string;
      }>();

      if (!rows.results.length) return;

      const token = rows.results[0].expo_push_token;
      const key = `push_rate:${token}:scheduled`;
      const alreadySent = await env.RATE_LIMIT_KV.get(key);
      if (alreadySent) return;

      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: token,
          title: 'Blaze Sports Intel',
          body: 'Live score update available.',
          data: { type: 'score_update', id: 'scheduled', sport: 'all' }
        })
      });

      if (!res.ok) {
        console.error(`[push-scheduled] Expo API returned ${res.status}`);
        return;
      }

      await env.RATE_LIMIT_KV.put(key, '1', { expirationTtl: 900 });
    } catch (err) {
      console.error('[push-scheduled]', err instanceof Error ? err.message : err);
    }
  }
};
