/**
 * Pages Function: /api/contact
 * Receives contact form submissions, validates, and forwards via Resend.
 *
 * Required secrets (set via wrangler pages secret put):
 *   RESEND_API_KEY
 *   TURNSTILE_SECRET_KEY (optional — skips verification if absent)
 */

interface Env {
  RESEND_API_KEY: string;
  TURNSTILE_SECRET_KEY?: string;
}

interface ContactPayload {
  name: string;
  email: string;
  message: string;
  site?: string;
  turnstileToken?: string;
}

const RECIPIENT = 'Austin@BlazeSportsIntel.com';
// blazesportsintel.com is verified in Resend — use that domain for sending
const FROM_ADDRESS = 'noreply@blazesportsintel.com';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

async function verifyTurnstile(token: string, secret: string, ip: string): Promise<boolean> {
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
    });
    const data = (await res.json()) as { success: boolean };
    return data.success;
  } catch {
    return false;
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (!env.RESEND_API_KEY) {
    return jsonResponse({ error: 'Contact service not configured' }, 503);
  }

  let body: ContactPayload;
  try {
    body = (await request.json()) as ContactPayload;
  } catch {
    return jsonResponse({ error: 'Invalid request body' }, 400);
  }

  // Honeypot check — if 'website' field is filled, it's a bot
  const raw = body as Record<string, unknown>;
  if (raw.website && typeof raw.website === 'string' && raw.website.length > 0) {
    // Silently accept to not reveal the honeypot
    return jsonResponse({ ok: true }, 200);
  }

  // Validate required fields
  const { name, email, message } = body;
  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return jsonResponse({ error: 'Name, email, and message are required' }, 400);
  }

  if (name.trim().length > 200 || email.trim().length > 320 || message.trim().length > 5000) {
    return jsonResponse({ error: 'Field length exceeded' }, 400);
  }

  // Basic email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return jsonResponse({ error: 'Invalid email address' }, 400);
  }

  // Turnstile verification (if configured)
  if (env.TURNSTILE_SECRET_KEY && body.turnstileToken) {
    const ip = request.headers.get('CF-Connecting-IP') || '';
    const valid = await verifyTurnstile(body.turnstileToken, env.TURNSTILE_SECRET_KEY, ip);
    if (!valid) {
      return jsonResponse({ error: 'Verification failed. Please try again.' }, 403);
    }
  }

  // Send via Resend
  try {
    const resendPayload = {
      from: `AustinHumphrey.com <${FROM_ADDRESS}>`,
      to: [RECIPIENT],
      reply_to: email.trim(),
      subject: `[Portfolio] Message from ${name.trim()}`,
      text: [
        `Name: ${name.trim()}`,
        `Email: ${email.trim()}`,
        `Site: ${body.site || 'austinhumphrey.com'}`,
        `Time: ${new Date().toISOString()}`,
        '',
        '---',
        '',
        message.trim(),
      ].join('\n'),
    };

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify(resendPayload),
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) {
      let errorDetail = '';
      try { errorDetail = await res.text(); } catch { /* ignore */ }
      console.error('Resend API error:', res.status, errorDetail);
      return jsonResponse({ error: 'Unable to send your message right now.', detail: `Resend ${res.status}` }, 200);
    }

    return jsonResponse({ ok: true }, 200);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('Contact function error:', msg);
    return jsonResponse({ error: 'Unable to send right now. Try emailing Austin@BlazeSportsIntel.com directly.', detail: msg }, 200);
  }
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: corsHeaders });
