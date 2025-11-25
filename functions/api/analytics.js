import { ok, rateLimit, rateLimitError, corsHeaders } from './_utils.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting: 100 requests per minute per IP
  const limit = await rateLimit(env, request, 100, 60000);
  if (!limit.allowed) {
    return rateLimitError(limit.resetAt, limit.retryAfter);
  }

  // Placeholder for analytics processing
  return ok({
    message: 'Analytics endpoint ready',
    timestamp: new Date().toISOString(),
    sports: ['Baseball', 'Football', 'Basketball', 'Track & Field'],
  });
}
