/**
 * News handlers — Intel news feed and ESPN news by sport.
 */

import type { Env } from '../shared/types';
import { json, cachedJson, kvGet, kvPut } from '../shared/helpers';
import { HTTP_CACHE, ESPN_NEWS_ENDPOINTS, INTEL_ESPN_NEWS } from '../shared/constants';

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

