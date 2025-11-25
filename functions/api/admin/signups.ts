/**
 * Blaze Sports Intel - Admin Signups
 * Lists recent customer signups
 *
 * Endpoint: GET /api/admin/signups
 * Protected - requires admin token
 */

interface Env {
  DB: D1Database;
  KV: KVNamespace;
  ADMIN_TOKEN?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Simple admin auth check
  const authHeader = request.headers.get('Authorization');
  const adminToken = env.ADMIN_TOKEN || 'bsi-admin-2025';

  if (authHeader !== `Bearer ${adminToken}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  try {
    // Get recent users from DB
    const users = await env.DB.prepare(
      `
      SELECT id, email, name, tier, created_at, last_login
      FROM users
      ORDER BY created_at DESC
      LIMIT 50
    `
    ).all();

    // Get signup notifications from KV (last 30 days)
    const notifications: Array<Record<string, unknown>> = [];
    const listResult = await env.KV.list({ prefix: 'signup:' });

    for (const key of listResult.keys.slice(0, 50)) {
      const data = await env.KV.get(key.name);
      if (data) {
        notifications.push(JSON.parse(data));
      }
    }

    // Sort notifications by timestamp
    notifications.sort(
      (a, b) =>
        new Date(b.timestamp as string).getTime() - new Date(a.timestamp as string).getTime()
    );

    return new Response(
      JSON.stringify({
        success: true,
        totalUsers: users.results?.length || 0,
        users: users.results || [],
        recentSignups: notifications,
        timestamp: new Date().toISOString(),
        timezone: 'America/Chicago',
      }),
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error('Admin signups error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch signups',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
};
