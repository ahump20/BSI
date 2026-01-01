/**
 * Transfer Portal Alert Subscription API
 *
 * Allows users to subscribe to portal alerts for their favorite teams.
 */

interface Env {
  KV: KVNamespace;
  DB: D1Database;
}

interface SubscriptionRequest {
  email: string;
  subscription_type: 'free' | 'pro' | 'enterprise';
  teams?: string[];
  conferences?: string[];
  positions?: string[];
}

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;

  try {
    const body = (await request.json()) as SubscriptionRequest;

    // Validate email
    if (!body.email || !body.email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Valid email required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Create subscription record
    const subscription = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      email: body.email.toLowerCase().trim(),
      subscription_type: body.subscription_type || 'free',
      teams: body.teams || [],
      conferences: body.conferences || [],
      positions: body.positions || [],
      created_at: new Date().toISOString(),
      status: 'active',
    };

    // Store in KV (would use D1 in production)
    await env.KV?.put(
      `portal:subscription:${subscription.email}`,
      JSON.stringify(subscription),
      { expirationTtl: 365 * 24 * 60 * 60 } // 1 year
    );

    // Also track total subscribers
    const countKey = 'portal:subscriber_count';
    const currentCount = parseInt((await env.KV?.get(countKey)) || '0', 10);
    await env.KV?.put(countKey, String(currentCount + 1));

    return new Response(
      JSON.stringify({
        success: true,
        subscription_id: subscription.id,
        message: 'Successfully subscribed to portal alerts',
        tier: subscription.subscription_type,
      }),
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Subscription error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to create subscription',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

// Handle OPTIONS for CORS
export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
