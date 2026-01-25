/**
 * BSI Blaze Vision Access Request Endpoint
 * Handles access requests for Blaze Vision and game notification signups.
 * Rate limited to 20 requests per hour per IP.
 */

export interface Env {
  BSI_CACHE: KVNamespace;
}

interface AccessRequestBody {
  name: string;
  email: string;
  organization?: string;
  role?: string;
  sportFocus?: string;
  notes?: string;
  interest?: string;
}

interface StoredRequest {
  id: string;
  name: string;
  email: string;
  organization: string;
  role: string;
  sportFocus: string;
  notes: string;
  interest: string;
  submittedAt: string;
  ip: string;
  colo: string;
  userAgent: string;
  referer: string;
}

const RATE_LIMIT_WINDOW = 3600;
const RATE_LIMIT_MAX = 20;
const REQUEST_TTL = 365 * 24 * 60 * 60;

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers,
    });
  }

  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const rateLimitKey = `ratelimit:vision:${ip}`;

  const currentCount = await env.BSI_CACHE.get(rateLimitKey);
  const count = currentCount ? parseInt(currentCount, 10) : 0;

  if (count >= RATE_LIMIT_MAX) {
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
        retryAfter: RATE_LIMIT_WINDOW,
      }),
      { status: 429, headers: { ...headers, 'Retry-After': String(RATE_LIMIT_WINDOW) } }
    );
  }

  let body: AccessRequestBody;
  const contentType = request.headers.get('content-type') ?? '';

  try {
    if (contentType.includes('application/json')) {
      body = (await request.json()) as AccessRequestBody;
    } else if (contentType.includes('form')) {
      const formData = await request.formData();
      body = {
        name: formData.get('name')?.toString() ?? '',
        email: formData.get('email')?.toString() ?? '',
        organization: formData.get('organization')?.toString(),
        role: formData.get('role')?.toString(),
        sportFocus: formData.get('sportFocus')?.toString(),
        notes: formData.get('notes')?.toString(),
        interest: formData.get('interest')?.toString(),
      };
    } else {
      return new Response(JSON.stringify({ error: 'Unsupported content type' }), {
        status: 400,
        headers,
      });
    }
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers,
    });
  }

  const { name, email, organization, role, sportFocus, notes, interest } = body;

  if (!name || name.trim().length < 2) {
    return new Response(JSON.stringify({ error: 'Name must be at least 2 characters' }), {
      status: 400,
      headers,
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return new Response(JSON.stringify({ error: 'Invalid email address' }), {
      status: 400,
      headers,
    });
  }

  const id = crypto.randomUUID();
  const colo = (request as Request & { cf?: { colo?: string } }).cf?.colo ?? 'unknown';

  const stored: StoredRequest = {
    id,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    organization: organization?.trim() ?? '',
    role: role?.trim() ?? '',
    sportFocus: sportFocus?.trim() ?? '',
    notes: notes?.trim() ?? '',
    interest: interest?.trim() ?? '',
    submittedAt: new Date().toISOString(),
    ip,
    colo,
    userAgent: request.headers.get('user-agent') ?? '',
    referer: request.headers.get('referer') ?? '',
  };

  const storageKey = `vision:req:${id}`;

  try {
    await env.BSI_CACHE.put(storageKey, JSON.stringify(stored), {
      expirationTtl: REQUEST_TTL,
    });

    await env.BSI_CACHE.put(rateLimitKey, String(count + 1), {
      expirationTtl: RATE_LIMIT_WINDOW,
    });
  } catch (error: unknown) {
    return new Response(
      JSON.stringify({
        error: 'Failed to store request',
        message: error instanceof Error ? error.message : 'Storage error',
      }),
      { status: 500, headers }
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Request received. We will review and contact you soon.',
      id,
    }),
    { status: 201, headers }
  );
};
