import type { Env, PredictionPayload } from '../shared/types';
import { json, cachedJson, kvGet, kvPut, isValidEmail, checkRateLimit } from '../shared/helpers';
import { HTTP_CACHE, CACHE_TTL, LEAD_TTL_SECONDS, ESPN_NEWS_ENDPOINTS, INTEL_ESPN_NEWS } from '../shared/constants';
import { getTeams as espnGetTeams, transformTeams, type ESPNSport } from '../../lib/api-clients/espn-api';

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
// Analytics Engine helpers
// =============================================================================

function emitOpsEvent(
  env: Env,
  event: string,
  blobs: string[] = [],
  doubles: number[] = [],
): void {
  if (!env.OPS_EVENTS) return;
  try {
    env.OPS_EVENTS.writeDataPoint({
      indexes: [event],
      blobs,
      doubles,
    });
  } catch {
    // Non-fatal — analytics should never break a request
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

/**
 * /api/teams/:league — Pull team list from ESPN for the requested league.
 */
export async function handleTeams(league: string, env: Env): Promise<Response> {
  const key = league.toUpperCase();
  const sportMap: Record<string, ESPNSport> = { MLB: 'mlb', NFL: 'nfl', NBA: 'nba' };
  const sport = sportMap[key];

  if (!sport) return json([], 200);

  const cacheKey = `teams:list:${key}`;
  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return json(cached, 200, { 'X-Cache': 'HIT' });

  try {
    const raw = await espnGetTeams(sport) as Record<string, unknown>;
    const { teams } = transformTeams(raw);
    const result = teams.map((t) => ({
      id: t.id,
      name: t.name,
      league: key,
      abbreviation: t.abbreviation,
      logos: t.logos,
      color: t.color,
    }));
    await kvPut(env.KV, cacheKey, result, CACHE_TTL.standings);
    return json(result, 200, { 'X-Cache': 'MISS' });
  } catch (err) {
    console.error('[teams] ESPN fetch failed:', err instanceof Error ? err.message : err);
    return json([], 200);
  }
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

export async function handleIntelNews(url: URL, env: Env): Promise<Response> {
  const sportParam = url.searchParams.get('sport') || 'all';

  // Determine which sports to fetch news for
  const sportsToFetch = sportParam === 'all'
    ? Object.keys(INTEL_ESPN_NEWS)
    : sportParam.split(',').filter((s) => s in INTEL_ESPN_NEWS);

  if (sportsToFetch.length === 0) {
    return json({ articles: [], error: 'Invalid sport parameter' }, 400);
  }

  const results: Array<{ sport: string; data: Record<string, unknown> }> = [];

  for (const sport of sportsToFetch) {
    const cacheKey = `intel:news:${sport}`;

    // Check KV cache first
    const cached = await kvGet<Record<string, unknown>>(env.KV, cacheKey);
    if (cached) {
      results.push({ sport, data: cached });
      continue;
    }

    // Fetch from ESPN
    try {
      const espnUrl = INTEL_ESPN_NEWS[sport];
      if (!espnUrl) continue;

      const res = await fetch(espnUrl, {
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        const data = (await res.json()) as Record<string, unknown>;
        // Cache in KV for 2 minutes
        await kvPut(env.KV, cacheKey, data, 120);
        results.push({ sport, data });
      } else {
        results.push({ sport, data: { articles: [] } });
      }
    } catch {
      results.push({ sport, data: { articles: [] } });
    }
  }

  return cachedJson(results, 200, HTTP_CACHE.news);
}

export async function handleESPNNews(sport: string, env: Env): Promise<Response> {
  const endpoint = ESPN_NEWS_ENDPOINTS[sport];
  if (!endpoint) {
    return json({ error: `Unknown sport: ${sport}` }, 400);
  }

  const cacheKey = `espn-news:${sport}`;
  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cached, 200, HTTP_CACHE.news, { 'X-Cache': 'HIT' });
  }

  try {
    const res = await fetch(endpoint, {
      headers: { 'User-Agent': 'BlazeSportsIntel/1.0' },
    });

    if (!res.ok) {
      return json({ error: 'Failed to fetch news from ESPN', articles: [] }, 502);
    }

    const data = await res.json() as { articles?: unknown[] };
    const articles = (data.articles || []).map((a: unknown) => {
      const article = a as Record<string, unknown>;
      return {
        id: article.id || article.dataSourceIdentifier,
        headline: article.headline,
        description: article.description,
        link: ((article.links as Record<string, unknown>)?.web as Record<string, unknown>)?.href || '',
        published: article.published,
        source: 'ESPN',
        sport,
        images: article.images,
      };
    });

    const payload = { articles, lastUpdated: new Date().toISOString() };
    await kvPut(env.KV, cacheKey, payload, 900); // 15 min TTL
    return cachedJson(payload, 200, HTTP_CACHE.news, { 'X-Cache': 'MISS' });
  } catch {
    return json({ error: 'ESPN news fetch failed', articles: [] }, 502);
  }
}

export async function handleModelHealth(env: Env): Promise<Response> {
  const cacheKey = 'model-health:all';
  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cached, 200, 600, { 'X-Cache': 'HIT' });
  }

  try {
    const result = await env.DB
      .prepare(
        `SELECT week, accuracy, sport, created_at as recordedAt
         FROM model_health
         ORDER BY created_at DESC
         LIMIT 12`
      )
      .all();

    const weeks = result.results || [];
    const payload = { weeks, lastUpdated: new Date().toISOString() };
    await kvPut(env.KV, cacheKey, payload, 600);
    return cachedJson(payload, 200, 600, { 'X-Cache': 'MISS' });
  } catch (err) {
    console.error('[model-health] D1 query failed:', err instanceof Error ? err.message : err);
    return json({
      weeks: [],
      lastUpdated: new Date().toISOString(),
      note: 'Model health data temporarily unavailable',
    }, 503);
  }
}

export async function handlePredictionSubmit(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as PredictionPayload;
    const { gameId, sport, predictedWinner, confidence, spread, overUnder } = body;

    if (!gameId || !sport || !predictedWinner) {
      return json({ error: 'Missing required fields: gameId, sport, predictedWinner' }, 400);
    }

    await env.DB
      .prepare(
        `INSERT INTO predictions (game_id, sport, predicted_winner, confidence, spread, over_under, created_at)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
      )
      .bind(gameId, sport, predictedWinner, confidence || 0, spread || null, overUnder || null)
      .run();

    return json({ success: true, gameId });
  } catch {
    return json({ error: 'Failed to record prediction' }, 500);
  }
}

export async function handleAnalyticsEvent(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as { event?: string; properties?: Record<string, unknown> };
    if (!body?.event) {
      return new Response(null, { status: 204 });
    }

    // Prefer Analytics Engine for structured, queryable event tracking
    if (env.OPS_EVENTS) {
      emitOpsEvent(env, body.event, [
        JSON.stringify(body.properties || {}).slice(0, 256),
      ]);
    } else {
      // Fallback to KV if Analytics Engine not bound
      const date = new Date().toISOString().slice(0, 10);
      const uid = Math.random().toString(36).slice(2, 10);
      await kvPut(env.KV, `analytics:${date}:${body.event}:${uid}`, body, 2592000);
    }
  } catch (err) {
    console.error('[analytics]', err instanceof Error ? err.message : err);
  }
  return new Response(null, { status: 204 });
}

/**
 * GET /api/intel/weekly-brief
 *
 * Returns the latest weekly brief from KV. Populated manually each week.
 * Falls back to a framework response if no brief is published yet.
 */
export async function handleWeeklyBrief(env: Env): Promise<Response> {
  const cacheKey = 'intel:weekly-brief:latest';
  const brief = await kvGet<Record<string, unknown>>(env.KV, cacheKey);

  if (brief) {
    return cachedJson({
      brief,
      meta: { source: 'bsi-intel', fetched_at: new Date().toISOString(), timezone: 'America/Chicago' },
    }, 200, 300);
  }

  // No brief published — return framework structure
  return json({
    brief: null,
    status: 'not_published',
    message: 'Weekly brief not yet published for this week.',
    framework: {
      sections: ['Decision Register', 'Five Feeds', 'ICE Scoring', 'KPIs'],
      publishSchedule: 'Mondays during the college baseball season',
    },
    meta: { source: 'bsi-intel', fetched_at: new Date().toISOString(), timezone: 'America/Chicago' },
  });
}

export async function handlePredictionAccuracy(env: Env): Promise<Response> {
  const cacheKey = 'predictions:accuracy';
  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cached, 200, 300, { 'X-Cache': 'HIT' });
  }

  try {
    const result = await env.DB
      .prepare(
        `SELECT
           p.sport,
           COUNT(*) as total,
           SUM(CASE WHEN p.predicted_winner = o.actual_winner THEN 1 ELSE 0 END) as correct
         FROM predictions p
         INNER JOIN outcomes o ON p.game_id = o.game_id
         GROUP BY p.sport`
      )
      .all();

    const bySport: Record<string, { total: number; correct: number; accuracy: number }> = {};
    let totalAll = 0;
    let correctAll = 0;

    for (const row of result.results || []) {
      const r = row as { sport: string; total: number; correct: number };
      bySport[r.sport] = {
        total: r.total,
        correct: r.correct,
        accuracy: r.total > 0 ? r.correct / r.total : 0,
      };
      totalAll += r.total;
      correctAll += r.correct;
    }

    const payload = {
      overall: {
        total: totalAll,
        correct: correctAll,
        accuracy: totalAll > 0 ? correctAll / totalAll : 0,
      },
      bySport,
      lastUpdated: new Date().toISOString(),
    };

    await kvPut(env.KV, cacheKey, payload, 300);
    return cachedJson(payload, 200, 300, { 'X-Cache': 'MISS' });
  } catch (err) {
    console.error('[predictions] D1 query failed:', err instanceof Error ? err.message : err);
    return json({
      overall: { total: 0, correct: 0, accuracy: 0 },
      bySport: {},
      note: 'Predictions data temporarily unavailable',
    }, 503);
  }
}
