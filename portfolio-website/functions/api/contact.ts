interface ContactPayload {
  name?: string;
  email?: string;
  message?: string;
  site?: string;
  turnstileToken?: string;
}

const CONTACT_FORWARD_URL = 'https://blazesportsintel.com/api/contact';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function buildCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigins = new Set([
    'https://austinhumphrey.com',
    'https://www.austinhumphrey.com',
    'http://localhost:5173',
  ]);

  const resolvedOrigin = origin && allowedOrigins.has(origin)
    ? origin
    : 'https://austinhumphrey.com';

  return {
    'Access-Control-Allow-Origin': resolvedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
}

function json(origin: string | null, body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: buildCorsHeaders(origin),
  });
}

function sanitizePayload(body: ContactPayload): ContactPayload {
  return {
    name: body.name?.trim().slice(0, 200),
    email: body.email?.trim().slice(0, 254),
    message: body.message?.trim().slice(0, 5000),
    site: 'austinhumphrey.com',
    turnstileToken: body.turnstileToken?.trim(),
  };
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const existing = rateLimitMap.get(ip);

  if (!existing || now >= existing.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  existing.count += 1;
  return existing.count <= RATE_LIMIT_MAX;
}

export const onRequestPost: PagesFunction = async ({ request }) => {
  const origin = request.headers.get('Origin');
  const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';

  if (!checkRateLimit(clientIp)) {
    return json(origin, { error: 'Rate limit exceeded. Try again in a minute.' }, 429);
  }

  let body: ContactPayload;
  try {
    body = await request.json() as ContactPayload;
  } catch {
    return json(origin, { error: 'Invalid request body.' }, 400);
  }

  const sanitized = sanitizePayload(body);
  if (!sanitized.name || !sanitized.email || !sanitized.message) {
    return json(origin, { error: 'Name, email, and message are required.' }, 400);
  }

  if (!EMAIL_PATTERN.test(sanitized.email)) {
    return json(origin, { error: 'Please enter a valid email address.' }, 400);
  }

  try {
    const response = await fetch(CONTACT_FORWARD_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AustinHumphrey.com Contact Proxy',
      },
      body: JSON.stringify(sanitized),
      signal: AbortSignal.timeout(8000),
    });

    const payload = (await response.json().catch(() => null)) as { message?: string; error?: string } | null;
    if (!response.ok) {
      return json(origin, { error: payload?.error || 'Unable to send your message right now.' }, response.status >= 500 ? 502 : response.status);
    }

    return json(origin, {
      success: true,
      message: payload?.message || 'Message received. Austin will get back to you.',
    });
  } catch (error) {
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      return json(origin, { error: 'The contact service timed out. Please try again.' }, 504);
    }

    return json(origin, { error: 'The contact service is temporarily unavailable.' }, 502);
  }
};

export const onRequestOptions: PagesFunction = async ({ request }) =>
  new Response(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get('Origin')),
  });
