/**
 * Revoke API Key Endpoint
 * Permanently revokes an API key
 *
 * DELETE /api/keys/:id
 *
 * Response:
 * {
 *   success: true,
 *   message: "API key revoked successfully"
 * }
 */

interface Env {
  DB: D1Database;
  KV: KVNamespace;
  JWT_SECRET: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  const userId = await authenticateRequest(request, env);
  if (!userId) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  const keyId = params.id as string;
  if (!keyId) {
    return new Response(JSON.stringify({ success: false, error: 'Key ID required' }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  try {
    // Verify key belongs to user before revoking
    const key = await env.DB.prepare(
      'SELECT id FROM api_keys WHERE id = ? AND user_id = ? AND revoked_at IS NULL'
    )
      .bind(keyId, userId)
      .first();

    if (!key) {
      return new Response(
        JSON.stringify({ success: false, error: 'API key not found or already revoked' }),
        { status: 404, headers: corsHeaders }
      );
    }

    // Revoke the key
    await env.DB.prepare('UPDATE api_keys SET revoked_at = unixepoch() WHERE id = ?')
      .bind(keyId)
      .run();

    // Clear any cached key data
    await env.KV.delete(`apikey:${keyId}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'API key revoked successfully',
        keyId,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Failed to revoke API key:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to revoke API key' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { status: 204, headers: corsHeaders });
};

async function authenticateRequest(request: Request, env: Env): Promise<string | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  if (!env.JWT_SECRET) return null;

  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.');
    if (!headerB64 || !payloadB64 || !signatureB64) return null;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(env.JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signatureInput = `${headerB64}.${payloadB64}`;
    const signature = Uint8Array.from(
      atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')),
      (c) => c.charCodeAt(0)
    );

    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      signature,
      encoder.encode(signatureInput)
    );
    if (!valid) return null;

    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload.userId || payload.sub || null;
  } catch {
    return null;
  }
}
