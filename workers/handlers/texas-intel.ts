/**
 * Texas Intelligence — content aggregation handlers.
 *
 * Endpoints:
 *   GET /api/college-baseball/texas-intelligence/videos  — YouTube search results
 *   GET /api/college-baseball/texas-intelligence/news    — RSS aggregation
 *   GET /api/college-baseball/texas-intelligence/digest  — AI-generated daily digest
 */

import type { Env } from '../shared/types';
import { json, cachedJson, withMeta } from '../shared/helpers';

// ─── YouTube Videos ─────────────────────────────────────────────────────────

interface YouTubeSearchItem {
  id: { videoId: string };
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    channelTitle: string;
    thumbnails: { high?: { url: string } };
  };
}

interface YouTubeSearchResponse {
  items?: YouTubeSearchItem[];
}

export async function handleTexasIntelVideos(env: Env): Promise<Response> {
  const KV_KEY = 'texas-intel:videos';
  const TTL = 3600; // 1 hour

  // Check cache
  const cached = await env.KV.get(KV_KEY);
  if (cached) {
    return cachedJson(JSON.parse(cached), 200, 300, { 'X-Cache': 'HIT' });
  }

  // YouTube API key is optional — fallback to empty when not configured
  const apiKey = (env as Env & { YOUTUBE_API_KEY?: string }).YOUTUBE_API_KEY;
  if (!apiKey) {
    return json(
      withMeta({ videos: [], message: 'YouTube API key not configured — use curated video registry' }, 'fallback'),
      200,
    );
  }

  try {
    const query = encodeURIComponent('Texas Longhorns baseball 2026 highlights');
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&maxResults=20&order=date&key=${apiKey}`;

    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) {
      console.error(`[texas-intel] YouTube API error: ${res.status}`);
      return json(withMeta({ videos: [], error: 'YouTube API unavailable' }, 'error'), 200);
    }

    const data = (await res.json()) as YouTubeSearchResponse;
    const videos = (data.items ?? []).map((item) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      publishedAt: item.snippet.publishedAt,
      channel: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.high?.url ?? '',
    }));

    const payload = withMeta({ videos }, 'youtube');
    await env.KV.put(KV_KEY, JSON.stringify(payload), { expirationTtl: TTL });

    return cachedJson(payload, 200, 300, { 'X-Cache': 'MISS' });
  } catch (err) {
    console.error('[texas-intel] YouTube fetch error:', err);
    return json(withMeta({ videos: [], error: 'Failed to fetch videos' }, 'error'), 200);
  }
}

// ─── RSS News Aggregation ───────────────────────────────────────────────────

interface NewsItem {
  title: string;
  link: string;
  source: string;
  publishedAt: string;
  description: string;
}

const RSS_FEEDS: { url: string; name: string; keywords: string[] }[] = [
  {
    url: 'https://texassports.com/sports/baseball/news?feed=rss_2.0',
    name: 'Texas Sports',
    keywords: [], // All content is Texas-relevant
  },
  {
    url: 'https://d1baseball.com/feed/',
    name: 'D1Baseball',
    keywords: ['texas', 'longhorns', 'schlossnagle', 'disch-falk'],
  },
  {
    url: 'https://www.baseballamerica.com/feed/',
    name: 'Baseball America',
    keywords: ['texas', 'longhorns', 'schlossnagle'],
  },
];

function parseRSSItems(xml: string): { title: string; link: string; pubDate: string; description: string }[] {
  const items: { title: string; link: string; pubDate: string; description: string }[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/)?.[1] ?? block.match(/<title>(.*?)<\/title>/)?.[1] ?? '';
    const link = block.match(/<link>(.*?)<\/link>/)?.[1] ?? '';
    const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? '';
    const desc = block.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/)?.[1] ?? '';
    items.push({ title, link, pubDate, description: desc.slice(0, 200) });
  }
  return items;
}

function isTexasRelevant(text: string, keywords: string[]): boolean {
  if (keywords.length === 0) return true; // No filter = all content relevant
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

export async function handleTexasIntelNews(env: Env): Promise<Response> {
  const KV_KEY = 'texas-intel:news';
  const TTL = 1800; // 30 minutes

  // Check cache
  const cached = await env.KV.get(KV_KEY);
  if (cached) {
    return cachedJson(JSON.parse(cached), 200, 120, { 'X-Cache': 'HIT' });
  }

  const allArticles: NewsItem[] = [];

  for (const feed of RSS_FEEDS) {
    try {
      const res = await fetch(feed.url, {
        headers: { Accept: 'application/rss+xml, application/xml, text/xml' },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) continue;

      const xml = await res.text();
      const items = parseRSSItems(xml);

      for (const item of items) {
        if (isTexasRelevant(`${item.title} ${item.description}`, feed.keywords)) {
          allArticles.push({
            title: item.title,
            link: item.link,
            source: feed.name,
            publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
            description: item.description,
          });
        }
      }
    } catch (err) {
      console.warn(`[texas-intel] RSS fetch failed for ${feed.name}:`, err);
    }
  }

  // Sort by recency
  allArticles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const payload = withMeta({ articles: allArticles.slice(0, 30), total: allArticles.length }, 'rss');
  await env.KV.put(KV_KEY, JSON.stringify(payload), { expirationTtl: TTL });

  return cachedJson(payload, 200, 120, { 'X-Cache': 'MISS' });
}

// ─── AI Daily Digest ────────────────────────────────────────────────────────

export async function handleTexasIntelDigest(env: Env): Promise<Response> {
  const KV_KEY = 'texas-intel:digest';
  const TTL = 86400; // 24 hours

  // Check cache
  const cached = await env.KV.get(KV_KEY);
  if (cached) {
    return cachedJson(JSON.parse(cached), 200, 600, { 'X-Cache': 'HIT' });
  }

  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return json(
      withMeta({ digest: null, message: 'Digest generation unavailable' }, 'fallback'),
      200,
    );
  }

  // Gather source data for the digest
  let teamContext = '';
  try {
    const teamRes = await fetch(`https://blazesportsintel.com/api/college-baseball/teams/251`);
    if (teamRes.ok) {
      const teamData = await teamRes.json();
      teamContext = JSON.stringify(teamData).slice(0, 2000);
    }
  } catch { /* continue without team data */ }

  let newsContext = '';
  try {
    const newsStr = await env.KV.get('texas-intel:news');
    if (newsStr) {
      const newsData = JSON.parse(newsStr);
      newsContext = (newsData.articles ?? [])
        .slice(0, 10)
        .map((a: NewsItem) => `${a.title} (${a.source})`)
        .join('\n');
    }
  } catch { /* continue without news */ }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `Generate a brief daily intelligence digest for Texas Longhorns baseball. Write 3-5 short paragraphs covering: current record/ranking, recent performance, upcoming schedule, and any notable storylines. Be factual and concise — this powers a sports intelligence dashboard.

Team data: ${teamContext || 'unavailable'}
Recent headlines: ${newsContext || 'unavailable'}

Format as JSON: { "title": "...", "date": "${new Date().toISOString().slice(0, 10)}", "sections": [{ "heading": "...", "content": "..." }] }`,
          },
        ],
      }),
    });

    if (!res.ok) {
      console.error(`[texas-intel] Anthropic API error: ${res.status}`);
      return json(withMeta({ digest: null, error: 'Digest generation failed' }, 'error'), 200);
    }

    const result = (await res.json()) as { content: Array<{ text: string }> };
    const text = result.content?.[0]?.text ?? '';

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const digest = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    const payload = withMeta({ digest }, 'anthropic');
    await env.KV.put(KV_KEY, JSON.stringify(payload), { expirationTtl: TTL });

    return cachedJson(payload, 200, 600, { 'X-Cache': 'MISS' });
  } catch (err) {
    console.error('[texas-intel] Digest generation error:', err);
    return json(withMeta({ digest: null, error: 'Digest generation failed' }, 'error'), 200);
  }
}
