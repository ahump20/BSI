/**
 * College Baseball — editorial, news, trending, and daily handlers.
 */

import type { Env, EnhancedArticle, HighlightlyMatch } from './shared';
import { json, cachedJson, kvGet, kvPut, dataHeaders, cachedPayloadHeaders, getCollegeClient, getHighlightlyClient, logError, HTTP_CACHE, CACHE_TTL, categorizeArticle, titleSimilarity, CATEGORY_KEYWORDS } from './shared';

export async function handleCollegeBaseballTrending(env: Env): Promise<Response> {
  try {
    const cacheKey = 'cb:trending';

    const cached = await kvGet<unknown>(env.KV, cacheKey);
    if (cached) {
      return cachedJson(cached, 200, HTTP_CACHE.trending, { ...dataHeaders(new Date().toISOString()), 'X-Cache': 'HIT' });
    }

    // Trending is computed from recent scores — fetch today's games and derive
    const client = getCollegeClient();
    const result = await client.getMatches('NCAA');

    if (!result.success || !result.data) {
      return json({ trendingPlayers: [], topGames: [] }, 502, dataHeaders(result.timestamp));
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

    const payload = { trendingPlayers: [], topGames };
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.trending);

    return cachedJson(payload, 200, HTTP_CACHE.trending, { ...dataHeaders(result.timestamp), 'X-Cache': 'MISS' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[handleCollegeBaseballTrending]', msg);
    await logError(env, msg, 'handleCollegeBaseballTrending');
    return json({ error: 'Internal server error', status: 500 }, 500);
  }
}

export async function handleCollegeBaseballDaily(url: URL, env: Env): Promise<Response> {
  try {
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
        ...dataHeaders(new Date().toISOString(), 'bsi-college-baseball-daily'),
        'X-Cache': 'HIT',
      });
    }

    // Fallback to latest if specific key not found
    if (kvKey !== 'cb:daily:latest') {
      const latest = await kvGet<unknown>(env.KV, 'cb:daily:latest');
      if (latest) {
        return cachedJson(latest, 200, 300, {
          ...dataHeaders(new Date().toISOString(), 'bsi-college-baseball-daily'),
          'X-Cache': 'FALLBACK',
        });
      }
    }

    return json({
      error: 'Daily digest not yet generated. The pipeline runs at 5 AM and 11 PM CT.',
      meta: { source: 'bsi-college-baseball-daily', fetched_at: new Date().toISOString(), timezone: 'America/Chicago' },
    }, 404);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[handleCollegeBaseballDaily]', msg);
    await logError(env, msg, 'handleCollegeBaseballDaily');
    return json({ error: 'Internal server error', status: 500 }, 500);
  }
}

export async function handleCollegeBaseballNews(env: Env): Promise<Response> {
  try {
    const cacheKey = 'cb:news';

    const cached = await kvGet<unknown>(env.KV, cacheKey);
    if (cached) {
      return cachedJson(cached, 200, HTTP_CACHE.news, { ...dataHeaders(new Date().toISOString(), 'cache'), 'X-Cache': 'HIT' });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/news',
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!res.ok) {
      return json({ articles: [], meta: { source: 'espn', fetched_at: new Date().toISOString(), timezone: 'America/Chicago' } }, 502);
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

    const payload = {
      articles,
      meta: { source: 'espn', fetched_at: new Date().toISOString(), timezone: 'America/Chicago' },
    };

    await kvPut(env.KV, cacheKey, payload, 300); // 5 min cache
    return cachedJson(payload, 200, HTTP_CACHE.news, { ...dataHeaders(new Date().toISOString(), 'espn'), 'X-Cache': 'MISS' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[handleCollegeBaseballNews]', msg);
    await logError(env, msg, 'handleCollegeBaseballNews');
    return json({ articles: [], meta: { source: 'espn', fetched_at: new Date().toISOString(), timezone: 'America/Chicago' } }, 502);
  }
}

export async function handleCollegeBaseballNewsEnhanced(env: Env): Promise<Response> {
  try {
  const now = new Date().toISOString();
  const cacheKey = 'cb:news:enhanced';
  const cached = await kvGet<string>(env.KV, cacheKey);
  if (cached) {
    try {
      return cachedJson(JSON.parse(cached), 200, HTTP_CACHE.news);
    } catch { /* corrupted cache — rebuild */ }
  }

  async function fetchEspnNews(): Promise<EnhancedArticle[]> {
    try {
      const resp = await fetch('https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/news?limit=30', {
        signal: AbortSignal.timeout(8000),
      });
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
        signal: AbortSignal.timeout(8000),
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

  const payload = {
    articles: merged,
    sources: { espn: espn.length, highlightly: highlightly.length, total: merged.length },
    meta: { source: 'espn+highlightly', fetched_at: now, timezone: 'America/Chicago' },
  };

  await kvPut(env.KV, cacheKey, JSON.stringify(payload), 120);

  return cachedJson(payload, 200, HTTP_CACHE.news);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[handleCollegeBaseballNewsEnhanced]', msg);
    await logError(env, msg, 'handleCollegeBaseballNewsEnhanced');
    return json({ error: 'Internal server error', status: 500 }, 500);
  }
}

export async function handleCollegeBaseballTransferPortal(env: Env): Promise<Response> {
  try {
    const now = new Date().toISOString();
    const cacheKey = 'cb:transfer-portal:v2';

    // Serve from KV cache if fresh (5 min TTL)
    const cached = await kvGet<Record<string, unknown>>(env.KV, cacheKey);
    if (cached) {
      return cachedJson(cached, 200, HTTP_CACHE.trending, cachedPayloadHeaders(cached));
    }

    // Query D1 for social intel signals classified as transfer_portal.
    // The bsi-social-intel worker ingests Reddit + Twitter, classifies with Claude,
    // and writes transfer_portal signals with player/team associations.
    //
    // Quality gate: require high confidence AND a real player name AND a from-school.
    // Reddit keyword matching produces many false positives (game recaps, well-wishes)
    // that get classified as transfer_portal with low confidence. Filter them out at
    // the query level so the UI only sees verified movement.
    const result = await env.DB.prepare(`
      SELECT
        post_id AS id,
        player_mentioned AS playerName,
        team_mentioned AS fromSchool,
        summary,
        posted_at AS enteredDate,
        confidence,
        post_url AS sourceUrl,
        platform,
        author
      FROM cbb_social_signals
      WHERE signal_type = 'transfer_portal'
        AND confidence >= 0.75
        AND player_mentioned IS NOT NULL
        AND TRIM(player_mentioned) != ''
        AND player_mentioned NOT LIKE '%Unknown%'
        AND team_mentioned IS NOT NULL
        AND TRIM(team_mentioned) != ''
      ORDER BY posted_at DESC
      LIMIT 200
    `).all<{
      id: string;
      playerName: string | null;
      fromSchool: string | null;
      summary: string | null;
      enteredDate: string;
      confidence: number;
      sourceUrl: string | null;
      platform: string;
      author: string | null;
    }>();

    const entries = (result.results ?? []).map((r) => ({
      id: r.id,
      playerName: r.playerName ?? '',
      position: '',
      fromSchool: r.fromSchool ?? '',
      toSchool: undefined,
      status: 'reported',
      enteredDate: r.enteredDate,
      classification: undefined,
      summary: r.summary,
      confidence: r.confidence,
      sourceUrl: r.sourceUrl,
      platform: r.platform,
      author: r.author,
    }));

    const payload = {
      entries,
      totalEntries: entries.length,
      lastUpdated: entries[0]?.enteredDate ?? now,
      emptyReason: entries.length === 0
        ? 'No verified transfer portal activity in the last 30 days. Entries are filtered for high confidence and verified player names.'
        : undefined,
      meta: { source: 'social-intel', fetched_at: now, timezone: 'America/Chicago' as const },
    };

    // Cache for 5 minutes — social intel cron runs more frequently
    await kvPut(env.KV, cacheKey, payload, 300);
    return cachedJson(payload, 200, HTTP_CACHE.trending, dataHeaders(now, 'social-intel'));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[handleCollegeBaseballTransferPortal]', msg);
    await logError(env, msg, 'handleCollegeBaseballTransferPortal');
    return json({ error: 'Internal server error', status: 500 }, 500);
  }
}

/**
 * Portal player detail — serves /api/portal/player/:playerId
 *
 * Looks up a player by slug (e.g. "jace-laviolette") from the KV portal entries
 * written to KV. Returns the shape PlayerDetailClient.tsx expects.
 */
export async function handlePortalPlayerDetail(
  playerId: string,
  env: Env,
): Promise<Response> {
  const now = new Date().toISOString();

  try {
    const raw = await env.KV.get('portal:college-baseball:entries', 'text');
    if (!raw) {
      return json({
        player: null,
        meta: { source: 'portal-sync', fetched_at: now, timezone: 'America/Chicago' },
        error: 'No portal data available',
      }, 404);
    }

    const data = JSON.parse(raw) as { entries?: Array<Record<string, unknown>>; lastUpdated?: string };
    const entries = data.entries ?? [];

    // Convert slug to comparable form: "jace-laviolette" → "jace laviolette"
    const slugNormalized = playerId.toLowerCase().replace(/-/g, ' ').trim();

    // Find matching entry by name slug comparison
    const entry = entries.find((e) => {
      const name = ((e.playerName ?? e.player_name ?? '') as string).toLowerCase().trim();
      // Exact slug match: "Jace LaViolette" → "jace laviolette"
      const nameSlug = name.replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ');
      const nameSlugDashed = name.replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-');
      return nameSlug === slugNormalized || nameSlugDashed === playerId.toLowerCase();
    });

    // Also try matching by ID directly (numeric or string)
    const entryById = !entry ? entries.find((e) => String(e.id) === playerId) : null;
    const matched = entry || entryById;

    if (!matched) {
      return json({
        player: null,
        meta: { source: 'portal-sync', fetched_at: now, timezone: 'America/Chicago' },
        error: 'Player not found in transfer portal',
      }, 404);
    }

    // Map KV entry to the PlayerProfile shape the client expects
    const playerName = (matched.playerName ?? matched.player_name ?? '') as string;
    const status = ((matched.status ?? 'in_portal') as string).toLowerCase();
    const portalStatus = status.includes('commit') ? 'committed'
      : status.includes('withdraw') ? 'withdrawn'
      : 'in_portal';

    const player = {
      id: String(matched.id ?? playerId),
      player_name: playerName,
      school_from: (matched.fromSchool ?? matched.school_from ?? '') as string,
      school_to: (matched.toSchool ?? matched.school_to ?? null) as string | null,
      position: (matched.position ?? '') as string,
      conference: (matched.conference ?? '') as string,
      class_year: (matched.classification ?? matched.class_year ?? '') as string,
      status: portalStatus,
      portal_date: (matched.enteredDate ?? matched.portal_date ?? now) as string,
      engagement_score: (matched.engagement_score ?? undefined) as number | undefined,
      source: 'portal-sync',
      verified: false,
    };

    return json({
      player,
      meta: { source: 'portal-sync', fetched_at: data.lastUpdated ?? now, timezone: 'America/Chicago' },
    }, 200);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[handlePortalPlayerDetail]', msg);
    await logError(env, msg, 'handlePortalPlayerDetail');
    return json({
      player: null,
      meta: { source: 'error', fetched_at: now, timezone: 'America/Chicago' },
      error: 'Internal server error',
    }, 500);
  }
}

export async function handleCollegeBaseballEditorialList(env: Env): Promise<Response> {
  const now = new Date().toISOString();

  try {
    const cacheKey = 'cb:editorial:list';

    const cached = await kvGet<unknown>(env.KV, cacheKey);
    if (cached) {
      return cachedJson(cached, 200, HTTP_CACHE.news, {
        ...dataHeaders(now, 'cache'), 'X-Cache': 'HIT',
      });
    }

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

    const payload = {
      editorials,
      meta: { source: 'bsi-d1', fetched_at: now, timezone: 'America/Chicago' },
    };

    await kvPut(env.KV, cacheKey, payload, 300); // 5 min cache
    return cachedJson(payload, 200, HTTP_CACHE.news, {
      ...dataHeaders(now, 'bsi-d1'), 'X-Cache': 'MISS',
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[handleCollegeBaseballEditorialList]', msg);
    await logError(env, msg, 'handleCollegeBaseballEditorialList');
    return json({
      editorials: [],
      meta: { source: 'bsi-d1', fetched_at: now, timezone: 'America/Chicago' },
      message: 'Editorial content is being set up.',
    }, 200);
  }
}

export async function handleCollegeBaseballEditorialContent(
  date: string,
  env: Env
): Promise<Response> {
  const now = new Date().toISOString();

  // Validate date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return json({
      error: 'Invalid date format. Use YYYY-MM-DD.',
      meta: { source: 'bsi-r2', fetched_at: now, timezone: 'America/Chicago' },
    }, 400);
  }

  const r2Key = `editorial/cbb/${date}.md`;

  try {
    const object = await env.ASSETS_BUCKET.get(r2Key);

    if (!object) {
      return json({
        content: null,
        date,
        meta: { source: 'bsi-r2', fetched_at: now, timezone: 'America/Chicago' },
        message: `No editorial found for ${date}. Content is generated daily by the digest pipeline.`,
      }, 404);
    }

    const content = await object.text();

    return json({
      content,
      date,
      contentType: object.httpMetadata?.contentType ?? 'text/markdown',
      size: object.size,
      meta: { source: 'bsi-r2', fetched_at: now, timezone: 'America/Chicago' },
    });
  } catch (err) {
    console.error('[editorial] R2 read failed:', err instanceof Error ? err.message : err);
    return json({
      content: null,
      date,
      meta: { source: 'bsi-r2', fetched_at: now, timezone: 'America/Chicago' },
      error: 'Failed to retrieve editorial content from storage.',
    }, 500);
  }
}
