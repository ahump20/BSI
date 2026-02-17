import type { Env, PredictionPayload } from '../shared/types';
import { json, cachedJson, kvGet, kvPut, isValidEmail, checkRateLimit } from '../shared/helpers';
import { HTTP_CACHE, CACHE_TTL, LEAD_TTL_SECONDS, ESPN_NEWS_ENDPOINTS, INTEL_ESPN_NEWS } from '../shared/constants';
import { getTeams as espnGetTeams, transformTeams, type ESPNSport } from '../../lib/api-clients/espn-api';

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
  } catch {
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
      return json({ error: 'Too many requests. Please try again later.' }, 429);
    }

    const consentedAt = new Date().toISOString();

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
      } catch {
        // KV is the primary store; D1 failure is non-fatal
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
      } catch {
        // D1 table may not exist yet; fall through to KV
      }
    }

    const key = `feedback:${Date.now()}`;
    await env.KV.put(key, JSON.stringify({ ...body, timestamp: new Date().toISOString() }), {
      expirationTtl: 86400 * 90, // 90 days
    });

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
  } catch {
    // Return placeholder if table doesn't exist yet
    const placeholder = {
      weeks: [
        { week: 'W1', accuracy: 0.72, sport: 'all', recordedAt: new Date().toISOString() },
        { week: 'W2', accuracy: 0.74, sport: 'all', recordedAt: new Date().toISOString() },
        { week: 'W3', accuracy: 0.71, sport: 'all', recordedAt: new Date().toISOString() },
        { week: 'W4', accuracy: 0.76, sport: 'all', recordedAt: new Date().toISOString() },
      ],
      lastUpdated: new Date().toISOString(),
      note: 'Using placeholder data - model_health table not yet initialized',
    };
    return json(placeholder, 200);
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
  } catch {
    return json({
      overall: { total: 0, correct: 0, accuracy: 0 },
      bySport: {},
      note: 'Predictions table not yet initialized or no data available',
    }, 200);
  }
}
