/**
 * Lead capture handlers — contact form, leads, feedback, CSP reports, Turnstile.
 */

import type { Env } from '../shared/types';
import { json, kvGet, kvPut, isValidEmail, checkRateLimit } from '../shared/helpers';
import { LEAD_TTL_SECONDS } from '../shared/constants';
import { emitOpsEvent } from './general';

// =============================================================================
// Turnstile verification
// =============================================================================

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function verifyTurnstile(token: string, secret: string, ip?: string): Promise<boolean> {
  try {
    const body: Record<string, string> = { secret, response: token };
    if (ip) body.remoteip = ip;
    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(body).toString(),
    });
    const result = await res.json() as { success: boolean };
    return result.success === true;
  } catch {
    return false;
  }
}

// =============================================================================
// Contact form handler (portfolio + general)
// =============================================================================

export async function handleContact(request: Request, env: Env): Promise<Response> {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      message?: string;
      site?: string;
      turnstileToken?: string;
    };

    if (!body.name || !body.email || !body.message) {
      return json({ error: 'Name, email, and message are required' }, 400);
    }

    if (!isValidEmail(body.email)) {
      return json({ error: 'Invalid email address' }, 400);
    }

    if (body.name.length > 200 || body.message.length > 5000) {
      return json({ error: 'Input exceeds maximum length' }, 400);
    }

    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';

    // Turnstile verification — required when secret is configured
    let turnstileVerified = false;
    if (env.TURNSTILE_SECRET_KEY) {
      if (!body.turnstileToken) {
        emitOpsEvent(env, 'turnstile_missing', [clientIP, body.site || 'unknown']);
        return json({ error: 'Bot verification required. Please complete the challenge.' }, 403);
      }
      turnstileVerified = await verifyTurnstile(body.turnstileToken, env.TURNSTILE_SECRET_KEY, clientIP);
      if (!turnstileVerified) {
        emitOpsEvent(env, 'turnstile_failure', [clientIP, body.site || 'unknown']);
        return json({ error: 'Bot verification failed. Please try again.' }, 403);
      }
    }

    const site = body.site || 'unknown';

    // D1 primary store
    if (env.DB) {
      try {
        await env.DB
          .prepare(
            `INSERT INTO contact_submissions (site, name, email, message, ip, turnstile_verified, created_at)
             VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
          )
          .bind(site, body.name, body.email, body.message, clientIP, turnstileVerified ? 1 : 0)
          .run();
      } catch {
        // D1 failure is non-fatal — KV backup below
      }
    }

    // KV backup with 90-day TTL
    if (env.KV) {
      const key = `contact:${Date.now()}:${body.email}`;
      await env.KV.put(key, JSON.stringify({
        site,
        name: body.name,
        email: body.email,
        message: body.message,
        ip: clientIP,
        turnstile_verified: turnstileVerified,
        created_at: new Date().toISOString(),
      }), { expirationTtl: 90 * 24 * 60 * 60 });
    }

    emitOpsEvent(env, 'contact_submission', [site, body.email]);

    return json({
      success: true,
      message: 'Message received. Austin will get back to you.',
    });
  } catch {
    return json({ error: 'Failed to process contact form' }, 500);
  }
}

// =============================================================================
// CSP report endpoint
// =============================================================================

export async function handleCSPReport(request: Request, env: Env): Promise<Response> {
  try {
    const reportText = await request.text();
    const userAgent = request.headers.get('User-Agent') || 'unknown';
    const host = request.headers.get('Host') || 'unknown';

    if (env.DB) {
      try {
        await env.DB
          .prepare(
            `INSERT INTO csp_reports (site, user_agent, report_json, created_at)
             VALUES (?, ?, ?, datetime('now'))`
          )
          .bind(host, userAgent, reportText)
          .run();
      } catch {
        // Non-fatal
      }
    }

    emitOpsEvent(env, 'csp_report', [host, userAgent]);
  } catch {
    // CSP reports should never fail the response
  }

  return new Response(null, { status: 204 });
}

export async function handleLead(request: Request, env: Env): Promise<Response> {
  try {
    const lead = (await request.json()) as {
      name: string;
      email: string;
      organization?: string;
      sport?: string;
      message?: string;
      source?: string;
      consent?: boolean;
    };

    if (!lead.name || !lead.email) {
      return json({ error: 'Name and email are required' }, 400);
    }

    if (!isValidEmail(lead.email)) {
      return json({ error: 'Invalid email address' }, 400);
    }

    if (lead.name.length > 200 || (lead.message && lead.message.length > 5000)) {
      return json({ error: 'Input exceeds maximum length' }, 400);
    }

    if (lead.consent !== true) {
      return json({ error: 'Consent to privacy policy is required' }, 400);
    }

    // Rate limit POST endpoints
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (env.KV && !(await checkRateLimit(env.KV, clientIP))) {
      console.warn('[rate-limit] lead:', clientIP);
      return json({ error: 'Too many requests. Please try again later.' }, 429);
    }

    const consentedAt = new Date().toISOString();
    emitOpsEvent(env, 'lead_submission', [lead.email, lead.source || 'API']);

    if (env.KV) {
      const key = `lead:${Date.now()}:${lead.email}`;
      await env.KV.put(key, JSON.stringify({ ...lead, consentedAt }), {
        expirationTtl: LEAD_TTL_SECONDS,
        metadata: { timestamp: consentedAt },
      });
    }

    if (env.DB) {
      try {
        // NOTE: Run migration to add consented_at column:
        //   ALTER TABLE leads ADD COLUMN consented_at TEXT;
        await env.DB
          .prepare(
            `INSERT INTO leads (name, email, organization, sport, message, source, created_at)
             VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
          )
          .bind(
            lead.name,
            lead.email,
            lead.organization ?? null,
            lead.sport ?? null,
            lead.message ?? null,
            lead.source ?? 'API'
          )
          .run();
      } catch (err) {
        console.error('[leads] D1 write failed:', err instanceof Error ? err.message : err);
      }
    }

    return json({
      success: true,
      message: 'Lead captured successfully',
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    });
  } catch {
    return json({ error: 'Failed to process lead' }, 500);
  }
}

export async function handleFeedback(request: Request, env: Env): Promise<Response> {
  try {
    const body = (await request.json()) as {
      rating?: number;
      category?: string;
      text?: string;
      page?: string;
    };

    if (!body.text) {
      return json({ error: 'Feedback text is required' }, 400);
    }

    if (body.text.length > 5000) {
      return json({ error: 'Feedback text exceeds maximum length' }, 400);
    }

    // Rate limit feedback submissions
    const fbIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (env.KV && !(await checkRateLimit(env.KV, fbIP))) {
      console.warn('[rate-limit] feedback:', fbIP);
      return json({ error: 'Too many requests. Please try again later.' }, 429);
    }

    if (env.DB) {
      try {
        await env.DB
          .prepare(
            `INSERT INTO feedback (rating, category, text, page, created_at)
             VALUES (?, ?, ?, ?, datetime('now'))`
          )
          .bind(body.rating ?? null, body.category ?? null, body.text, body.page ?? null)
          .run();
      } catch (err) {
        console.error('[feedback] D1 write failed:', err instanceof Error ? err.message : err);
      }
    }

    if (env.KV) {
      const key = `feedback:${Date.now()}`;
      await env.KV.put(key, JSON.stringify({ ...body, timestamp: new Date().toISOString() }), {
        expirationTtl: 86400 * 90, // 90 days
      });
    }

    return json({ success: true, message: 'Feedback received' });
  } catch {
    return json({ error: 'Failed to process feedback' }, 500);
  }
}
