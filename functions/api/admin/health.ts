/**
 * Blaze Sports Intel - Admin Health Check
 * Reports system configuration status without exposing secrets
 *
 * Endpoint: GET /api/admin/health
 */

interface Env {
  DB: D1Database;
  KV: KVNamespace;
  JWT_SECRET: string;
  RESEND_API_KEY: string;
  STRIPE_SECRET_KEY: string;
  FROM_EMAIL?: string;
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

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  // Check configuration status (booleans only, no secrets)
  const config = {
    database: !!env.DB,
    kv: !!env.KV,
    jwtSecret: !!env.JWT_SECRET && env.JWT_SECRET !== 'bsi-default-secret-change-me',
    resendApiKey: !!env.RESEND_API_KEY,
    stripeSecretKey: !!env.STRIPE_SECRET_KEY,
    fromEmail: !!env.FROM_EMAIL,
  };

  // Test database connection
  let dbConnected = false;
  let userCount = 0;
  try {
    const result = await env.DB.prepare('SELECT COUNT(*) as count FROM users').first<{
      count: number;
    }>();
    dbConnected = true;
    userCount = result?.count || 0;
  } catch (e) {
    console.error('DB health check failed:', e);
  }

  // Test KV connection
  let kvConnected = false;
  try {
    await env.KV.put('health_check', 'ok', { expirationTtl: 60 });
    const val = await env.KV.get('health_check');
    kvConnected = val === 'ok';
  } catch (e) {
    console.error('KV health check failed:', e);
  }

  const allConfigured = Object.values(config).every(Boolean);
  const timestamp = new Date().toISOString();

  return new Response(
    JSON.stringify({
      status: allConfigured && dbConnected && kvConnected ? 'healthy' : 'degraded',
      timestamp,
      config,
      connections: {
        database: dbConnected,
        kv: kvConnected,
      },
      stats: {
        userCount,
      },
      warnings: [
        ...(!config.jwtSecret ? ['JWT_SECRET not set or using default - CRITICAL'] : []),
        ...(!config.resendApiKey ? ['RESEND_API_KEY not set - emails will not be sent'] : []),
        ...(!config.stripeSecretKey ? ['STRIPE_SECRET_KEY not set - payments will fail'] : []),
        ...(!config.fromEmail ? ['FROM_EMAIL not set - using default sender'] : []),
        ...(!dbConnected ? ['Database connection failed'] : []),
        ...(!kvConnected ? ['KV connection failed'] : []),
      ],
    }),
    {
      status: 200,
      headers: corsHeaders,
    }
  );
};
