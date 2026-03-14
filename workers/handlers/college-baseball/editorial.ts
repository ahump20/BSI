/**
 * College Baseball — editorial, news, trending, and daily handlers.
 */

import type { Env, EnhancedArticle, HighlightlyMatch } from './shared';
import { json, cachedJson, kvGet, kvPut, dataHeaders, cachedPayloadHeaders, withMeta, getCollegeClient, getHighlightlyClient, HTTP_CACHE, CACHE_TTL, categorizeArticle, titleSimilarity, CATEGORY_KEYWORDS } from './shared';

export async function handleCollegeBaseballTrending(env: Env): Promise<Response> {
  const cacheKey = 'cb:trending';

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cached, 200, HTTP_CACHE.trending, cachedPayloadHeaders(cached));
  }

  // Trending is computed from recent scores — fetch today's games and derive
  const client = getCollegeClient();
  const result = await client.getMatches('NCAA');

  if (!result.success || !result.data) {
    return json(withMeta({ trendingPlayers: [], topGames: [] }, 'error', { fetchedAt: result.timestamp }), 502, dataHeaders(result.timestamp, 'error'));
  }

  const games = (result.data.data || []) as HighlightlyMatch[];

  // Top games: highest combined score, closest margin
  const finishedGames = games
    .filter((g: HighlightlyMatch) => g.status?.type === 'finished')
    .sort((a: HighlightlyMatch, b: HighlightlyMatch) => {
      const marginA = Math.abs(a.homeScore - a.awayScore);
      const marginB = Math.abs(b.homeScore - b.awayScore);
      return marginA - marginB;
    });

  const topGames = finishedGames.slice(0, 5).map((g: HighlightlyMatch) => ({
    id: g.id,
    homeTeam: g.homeTeam?.name,
    awayTeam: g.awayTeam?.name,
    homeScore: g.homeScore,
    awayScore: g.awayScore,
    margin: Math.abs(g.homeScore - g.awayScore),
  }));

  const payload = withMeta({ trendingPlayers: [], topGames }, 'ncaa', { fetchedAt: result.timestamp });
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.trending);

  return cachedJson(payload, 200, HTTP_CACHE.trending, { ...dataHeaders(result.timestamp, 'ncaa'), 'X-Cache': 'MISS' });
}

export async function handleCollegeBaseballDaily(url: URL, env: Env): Promise<Response> {
  const edition = url.searchParams.get('edition') ?? 'latest';
  const date = url.searchParams.get('date');

  // Resolve KV key: either specific edition+date, or latest
  let kvKey: string;
  if (edition === 'latest' || (!date && edition === 'latest')) {
    kvKey = 'cb:daily:latest';
  } else {
    const resolvedDate = date ?? new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
    kvKey = `cb:daily:${edition}:${resolvedDate}`;
  }

  const cached = await kvGet<unknown>(env.KV, kvKey);
  if (cached) {
    return cachedJson(cached, 200, 300, {
      ...cachedPayloadHeaders(cached, 'bsi-college-baseball-daily'),
    });
  }

  // Fallback to latest if specific key not found
  if (kvKey !== 'cb:daily:latest') {
    const latest = await kvGet<unknown>(env.KV, 'cb:daily:latest');
    if (latest) {
      return cachedJson(latest, 200, 300, {
        ...cachedPayloadHeaders(latest, 'bsi-college-baseball-daily'),
        'X-Cache': 'FALLBACK',
        'X-Cache-State': 'fallback',
        'X-Data-Source': 'bsi-college-baseball-daily',
      });
    }
  }

  return json(withMeta({
    error: 'Daily digest not yet generated. The pipeline runs at 5 AM and 11 PM CT.',
  }, 'bsi-college-baseball-daily'), 404);
}

export async function handleCollegeBaseballNews(env: Env): Promise<Response> {
  const cacheKey = 'cb:news';

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cached, 200, HTTP_CACHE.news, cachedPayloadHeaders(cached));
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/news',
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    const fetchedAt = new Date().toISOString();
    if (!res.ok) {
      return json(withMeta({ articles: [] }, 'espn', { fetchedAt }), 502);
    }

    const raw = (await res.json()) as Record<string, unknown>;
    const rawArticles = (raw?.articles || []) as Record<string, unknown>[];

    const articles = rawArticles.map((a: Record<string, unknown>, i: number) => {
      const links = a.links as Record<string, unknown> | undefined;
      const web = links?.web as Record<string, unknown> | undefined;
      const cats = (a.categories || []) as Record<string, unknown>[];
      const primaryCat = cats[0];
      const catType = (primaryCat?.type as string) || '';

      // Map ESPN category types to frontend categories
      let category: string = 'general';
      if (catType === 'athlete' || catType === 'player') category = 'recruiting';
      else if (catType === 'team') category = 'game';
      else if (catType === 'topic') {
        const desc = ((primaryCat?.description as string) || '').toLowerCase();
        if (desc.includes('rank')) category = 'rankings';
        else if (desc.includes('transfer') || desc.includes('portal')) category = 'transfer';
        else if (desc.includes('recruit')) category = 'recruiting';
        else category = 'analysis';
      }

      // Extract team/conference from categories if available
      const teamCat = cats.find((c) => c.type === 'team');
      const team = (teamCat?.description as string) || undefined;

      return {
        id: String(a.dataSourceIdentifier || `espn-cbb-${i}`),
        title: (a.headline || a.title || '') as string,
        summary: (a.description || '') as string,
        source: 'ESPN',
        url: (web?.href || a.link || '') as string,
        publishedAt: (a.published || '') as string,
        category,
        team,
      };
    });

    const payload = withMeta({
      articles,
    }, 'espn', { fetchedAt });

    await kvPut(env.KV, cacheKey, payload, 300); // 5 min cache
    return cachedJson(payload, 200, HTTP_CACHE.news, { ...dataHeaders(fetchedAt, 'espn'), 'X-Cache': 'MISS' });
  } catch {
    return json(withMeta({ articles: [] }, 'espn'), 502);
  }
}

export async function handleCollegeBaseballNewsEnhanced(env: Env): Promise<Response> {
  const now = new Date().toISOString();
  const cacheKey = 'cb:news:enhanced';
  const cached = await kvGet<string>(env.KV, cacheKey);
  if (cached) {
    try {
      const cachedPayload = JSON.parse(cached) as Record<string, unknown>;
      return cachedJson(cachedPayload, 200, HTTP_CACHE.news, cachedPayloadHeaders(cachedPayload));
    } catch { /* corrupted cache — rebuild */ }
  }

  async function fetchEspnNews(): Promise<EnhancedArticle[]> {
    try {
      const resp = await fetch('https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/news?limit=30');
      if (!resp.ok) return [];
      const data = await resp.json() as { articles?: Array<{ headline?: string; description?: string; links?: { web?: { href?: string } }; images?: Array<{ url?: string }>; published?: string }> };
      return (data.articles || []).map((a, i) => ({
        id: `espn-${i}-${Date.now()}`,
        title: a.headline || '',
        description: a.description || '',
        source: 'espn' as const,
        url: a.links?.web?.href || '#',
        imageUrl: a.images?.[0]?.url,
        publishedAt: a.published || now,
        category: categorizeArticle(a.headline || '', a.description || ''),
      }));
    } catch {
      return [];
    }
  }

  async function fetchHighlightlyNews(): Promise<EnhancedArticle[]> {
    const key = env.RAPIDAPI_KEY;
    if (!key) return [];
    try {
      const resp = await fetch('https://highlightly.p.rapidapi.com/baseball/matches?league=NCAA&status=complete&limit=20', {
        headers: { 'x-rapidapi-key': key, 'x-rapidapi-host': 'highlightly.p.rapidapi.com' },
      });
      if (!resp.ok) return [];
      const data = await resp.json() as { matches?: Array<{ id?: string; homeTeam?: { name?: string }; awayTeam?: { name?: string }; homeScore?: number; awayScore?: number; date?: string; status?: string }> };
      return (data.matches || []).map((m, i) => {
        const home = m.homeTeam?.name || 'Home';
        const away = m.awayTeam?.name || 'Away';
        const title = `${away} ${m.awayScore ?? 0} @ ${home} ${m.homeScore ?? 0} — Final`;
        return {
          id: `hl-${m.id || i}-${Date.now()}`,
          title,
          description: `${away} at ${home} — Final Score ${m.awayScore ?? 0}-${m.homeScore ?? 0}`,
          source: 'highlightly' as const,
          url: '#',
          publishedAt: m.date || now,
          category: 'scores',
          team: home,
        };
      });
    } catch {
      return [];
    }
  }

  const [espn, highlightly] = await Promise.all([fetchEspnNews(), fetchHighlightlyNews()]);

  // Deduplicate by title similarity > 70%
  const merged: EnhancedArticle[] = [...espn];
  for (const hl of highlightly) {
    const isDupe = merged.some((existing) => titleSimilarity(existing.title, hl.title) > 0.7);
    if (!isDupe) merged.push(hl);
  }
  merged.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const payload = withMeta({
    articles: merged,
    sources: { espn: espn.length, highlightly: highlightly.length, total: merged.length },
  }, 'espn+highlightly', { fetchedAt: now });

  await kvPut(env.KV, cacheKey, JSON.stringify(payload), 120);

  return cachedJson(payload, 200, HTTP_CACHE.news, { ...dataHeaders(now, 'espn+highlightly'), 'X-Cache': 'MISS' });
}

export async function handleCollegeBaseballTransferPortal(env: Env): Promise<Response> {
  const raw = await env.KV.get('portal:college-baseball:entries', 'text');
  if (raw) {
    try {
      const data = JSON.parse(raw) as Record<string, unknown>;
      const entries = (data.entries ?? []) as unknown[];
      return cachedJson(withMeta({
        entries,
        totalEntries: entries.length,
        lastUpdated: data.lastUpdated ?? null,
      }, 'portal-sync', {
        fetchedAt: (data.lastUpdated as string) ?? new Date().toISOString(),
      }), 200, HTTP_CACHE.trending);
    } catch {
      // Corrupt KV entry — fall through
    }
  }
  return json(withMeta({
    entries: [], totalEntries: 0, lastUpdated: null,
    message: 'No portal data available yet',
  }, 'none'), 200);
}

export async function handleCollegeBaseballEditorialList(env: Env): Promise<Response> {
  const cacheKey = 'cb:editorial:list';
  const now = new Date().toISOString();

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cached, 200, HTTP_CACHE.news, cachedPayloadHeaders(cached));
  }

  try {
    const { results } = await env.DB.prepare(
      `SELECT id, slug, date, title, preview, teams, word_count, created_at
       FROM editorials
       ORDER BY date DESC
       LIMIT 30`
    ).all<{
      id: number;
      slug: string;
      date: string;
      title: string;
      preview: string | null;
      teams: string | null;
      word_count: number;
      created_at: string;
    }>();

    const editorials = (results ?? []).map((row) => {
      let teams: string[] = [];
      try { teams = JSON.parse(row.teams || '[]'); } catch { /* fallback */ }
      if (!Array.isArray(teams)) teams = row.teams ? row.teams.split(',').map((t) => t.trim()) : [];
      return {
        id: row.id,
        slug: row.slug,
        date: row.date,
        title: row.title,
        preview: row.preview ?? '',
        teams,
        wordCount: row.word_count,
        createdAt: row.created_at,
      };
    });

    const payload = withMeta({
      editorials,
    }, 'bsi-d1', { fetchedAt: now });

    await kvPut(env.KV, cacheKey, payload, 300); // 5 min cache
    return cachedJson(payload, 200, HTTP_CACHE.news, {
      ...dataHeaders(now, 'bsi-d1'), 'X-Cache': 'MISS',
    });
  } catch (err) {
    console.error('[editorial] D1 query failed:', err instanceof Error ? err.message : err);
    return json(withMeta({
      editorials: [],
      message: 'Editorial content is being set up.',
    }, 'bsi-d1', { fetchedAt: now }), 200);
  }
}

export async function handleCollegeBaseballEditorialContent(
  date: string,
  env: Env
): Promise<Response> {
  const now = new Date().toISOString();

  // Validate date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return json(withMeta({
      error: 'Invalid date format. Use YYYY-MM-DD.',
    }, 'bsi-r2', { fetchedAt: now }), 400);
  }

  const r2Key = `editorial/cbb/${date}.md`;

  try {
    const object = await env.ASSETS_BUCKET.get(r2Key);

    if (!object) {
      return json(withMeta({
        content: null,
        date,
        message: `No editorial found for ${date}. Content is generated daily by the digest pipeline.`,
      }, 'bsi-r2', { fetchedAt: now }), 404);
    }

    const content = await object.text();

    return json(withMeta({
      content,
      date,
      contentType: object.httpMetadata?.contentType ?? 'text/markdown',
      size: object.size,
    }, 'bsi-r2', { fetchedAt: now }));
  } catch (err) {
    console.error('[editorial] R2 read failed:', err instanceof Error ? err.message : err);
    return json(withMeta({
      content: null,
      date,
      error: 'Failed to retrieve editorial content from storage.',
    }, 'bsi-r2', { fetchedAt: now }), 500);
  }
}
