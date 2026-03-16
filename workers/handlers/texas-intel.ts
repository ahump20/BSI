/**
 * Texas Intelligence — content aggregation, roster, analytics, and scheduling handlers.
 */

import type { Env } from '../shared/types';
import { json, cachedJson, withMeta, kvGet, kvPut } from '../shared/helpers';

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
  try {
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

    const query = encodeURIComponent('Texas Longhorns baseball 2026 highlights');
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&maxResults=20&order=date&key=${apiKey}`;

    const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8000) });
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
    console.error('[handleTexasIntelVideos]', err instanceof Error ? err.message : err);
    return json({ error: 'Internal server error', status: 500 }, 500);
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

// Texas official news via SIDEARM JSON API (not RSS — the RSS URL 404s after domain migration)
const TEXAS_NEWS_API = 'https://texaslonghorns.com/services/adaptive_components.ashx?type=stories&count=15&sport=1';

const RSS_FEEDS: { url: string; name: string; keywords: string[] }[] = [
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

function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function parseRSSItems(xml: string): { title: string; link: string; pubDate: string; description: string; categories: string }[] {
  const items: { title: string; link: string; pubDate: string; description: string; categories: string }[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ?? block.match(/<title>(.*?)<\/title>/)?.[1] ?? '';
    const link = block.match(/<link>(.*?)<\/link>/)?.[1] ?? '';
    const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? '';
    const desc = block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1] ?? block.match(/<description>(.*?)<\/description>/)?.[1] ?? '';
    // Gather all category tags for keyword matching
    const cats: string[] = [];
    const catRegex = /<category[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/category>/g;
    let catMatch;
    while ((catMatch = catRegex.exec(block)) !== null) cats.push(catMatch[1]);
    items.push({ title: decodeEntities(title), link, pubDate, description: decodeEntities(desc).slice(0, 200), categories: cats.join(' ') });
  }
  return items;
}

function isTexasRelevant(text: string, keywords: string[]): boolean {
  if (keywords.length === 0) return true; // No filter = all content relevant
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

export async function handleTexasIntelNews(env: Env): Promise<Response> {
  try {
  const KV_KEY = 'texas-intel:news';
  const TTL = 1800; // 30 minutes

  // Check cache
  const cached = await env.KV.get(KV_KEY);
  if (cached) {
    return cachedJson(JSON.parse(cached), 200, 120, { 'X-Cache': 'HIT' });
  }

  const allArticles: NewsItem[] = [];

  // 1. Official Texas Longhorns news (SIDEARM JSON API)
  try {
    const txRes = await fetch(TEXAS_NEWS_API, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
    });
    if (txRes.ok) {
      const stories = (await txRes.json()) as Array<Record<string, unknown>>;
      for (const s of stories) {
        const url = s.url as string | undefined;
        allArticles.push({
          title: (s.title as string) ?? '',
          link: url ? `https://texaslonghorns.com${url}` : '',
          source: 'Texas Longhorns',
          publishedAt: (s.date as string) ? new Date(s.date as string).toISOString() : new Date().toISOString(),
          description: ((s.teaser as string) ?? '').replace(/<[^>]*>/g, '').slice(0, 200),
        });
      }
    }
  } catch (err) {
    console.warn('[texas-intel] SIDEARM fetch failed:', err);
  }

  // 2. RSS feeds with keyword filtering (title, description, AND categories)
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
        if (isTexasRelevant(`${item.title} ${item.description} ${item.categories}`, feed.keywords)) {
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
  } catch (err) {
    console.error('[handleTexasIntelNews]', err instanceof Error ? err.message : err);
    return json({ error: 'Internal server error', status: 500 }, 500);
  }
}

// ─── AI Daily Digest ────────────────────────────────────────────────────────

export async function handleTexasIntelDigest(env: Env): Promise<Response> {
  try {
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
      const teamRes = await fetch(`https://blazesportsintel.com/api/college-baseball/teams/251`, { signal: AbortSignal.timeout(8000) });
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
    console.error('[handleTexasIntelDigest]', err instanceof Error ? err.message : err);
    return json({ error: 'Internal server error', status: 500 }, 500);
  }
}

// ─── Constants ──────────────────────────────────────────────────────────────

const TEXAS_TEAM_ID = '126';
const TEXAS_TEAM_PATTERN = '%Texas Longhorns%';
const RIVALRY_OPPONENTS = ['texas a&m', 'oklahoma', 'oklahoma state', 'tcu', 'baylor', 'texas tech', 'arkansas', 'lsu'];

// ─── Player Profile ─────────────────────────────────────────────────────────

interface PlayerBasicRow {
  espn_id: string;
  name: string;
  position: string;
  team: string;
  team_id: string;
  headshot: string | null;
  season: number;
}

interface BattingAdvancedRow {
  player_id: string;
  player_name: string;
  team: string;
  conference: string;
  season: number;
  position: string;
  g: number;
  ab: number;
  pa: number;
  r: number;
  h: number;
  doubles: number;
  triples: number;
  hr: number;
  rbi: number;
  bb: number;
  so: number;
  sb: number;
  cs: number;
  avg: number;
  obp: number;
  slg: number;
  ops: number;
  k_pct: number;
  bb_pct: number;
  iso: number;
  babip: number;
  woba: number;
  wrc_plus: number;
  ops_plus: number;
  computed_at: string;
}

interface PitchingAdvancedRow {
  player_id: string;
  player_name: string;
  team: string;
  conference: string;
  season: number;
  position: string;
  g: number;
  gs: number;
  w: number;
  l: number;
  sv: number;
  ip: number;
  h: number;
  er: number;
  bb: number;
  hbp: number;
  so: number;
  era: number;
  whip: number;
  k_9: number;
  bb_9: number;
  hr_9: number;
  fip: number;
  x_fip: number;
  era_minus: number;
  k_bb: number;
  lob_pct: number;
  babip: number;
  computed_at: string;
}

interface HavfRow {
  player_id: string;
  player_name: string;
  team: string;
  league: string;
  season: number;
  position: string;
  conference: string;
  h_score: number;
  a_score: number;
  v_score: number;
  f_score: number;
  havf_composite: number;
  breakdown: string;
  computed_at: string;
}

interface GameLogRow {
  espn_id: string;
  game_id: string;
  game_date: string;
  season: number;
  sport: string;
  opponent: string;
  is_home: number;
  result: string;
  ab: number;
  r: number;
  h: number;
  rbi: number;
  hr: number;
  bb: number;
  k: number;
  sb: number;
  ip_thirds: number;
  ha: number;
  er: number;
  so: number;
  bb_p: number;
  w: number;
  l: number;
  sv: number;
}

interface ProcessedGameRow {
  game_id: string;
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  game_date: string;
  home_team_id: string;
  away_team_id: string;
}

interface ConferenceStrengthRow {
  conference: string;
  season: number;
  strength_index: number;
  run_environment: number;
  avg_era: number;
  avg_ops: number;
  avg_woba: number;
}

function computeRollingAvg(gameLog: GameLogRow[], count: number): number {
  const eligible = gameLog.filter((g) => g.ab > 0).slice(0, count);
  if (eligible.length === 0) return 0;
  const totalH = eligible.reduce((sum, g) => sum + g.h, 0);
  const totalAB = eligible.reduce((sum, g) => sum + g.ab, 0);
  return totalAB > 0 ? Math.round((totalH / totalAB) * 1000) / 1000 : 0;
}

function computeRollingEra(gameLog: GameLogRow[], count: number): number | null {
  const eligible = gameLog.filter((g) => g.ip_thirds > 0).slice(0, count);
  if (eligible.length === 0) return null;
  const totalER = eligible.reduce((sum, g) => sum + g.er, 0);
  const totalIPThirds = eligible.reduce((sum, g) => sum + g.ip_thirds, 0);
  const totalIP = totalIPThirds / 3;
  return totalIP > 0 ? Math.round((totalER / totalIP) * 9 * 100) / 100 : null;
}

function computeRadar(
  batting: BattingAdvancedRow | null,
  havf: HavfRow | null,
  gameLog: GameLogRow[],
): { power: number; contact: number; discipline: number; speed: number; defense: number } {
  const cap = (v: number): number => Math.min(100, Math.max(0, Math.round(v)));

  const iso = batting?.iso ?? 0;
  const kPct = batting?.k_pct ?? 0.25;
  const bbPct = batting?.bb_pct ?? 0.05;
  const totalSB = gameLog.reduce((sum, g) => sum + g.sb, 0);

  return {
    power: cap((iso / 0.3) * 100),
    contact: cap((1 - kPct) * 100),
    discipline: cap((bbPct / 0.2) * 100),
    speed: totalSB > 0 ? cap(totalSB * 8) : 30,
    defense: havf?.f_score != null ? cap(havf.f_score) : 50,
  };
}

export async function handleTexasPlayerProfile(env: Env, playerId: string): Promise<Response> {
  try {
    const KV_KEY = `texas-intel:player:${playerId}`;
    const TTL = 3600; // 1 hour

    const cached = await kvGet<Record<string, unknown>>(env.KV, KV_KEY);
    if (cached) {
      return cachedJson(cached, 200, 300, { 'X-Cache': 'HIT' });
    }

    const [basicResult, battingResult, pitchingResult, havfResult, gameLogResult] = await Promise.all([
      env.DB.prepare(
        `SELECT espn_id, name, position, team, team_id, headshot, season
         FROM player_season_stats
         WHERE espn_id = ? AND team_id = ?
         ORDER BY season DESC LIMIT 1`,
      ).bind(playerId, TEXAS_TEAM_ID).first<PlayerBasicRow>(),

      env.DB.prepare(
        `SELECT * FROM cbb_batting_advanced
         WHERE player_id = ?
         ORDER BY season DESC LIMIT 1`,
      ).bind(playerId).first<BattingAdvancedRow>(),

      env.DB.prepare(
        `SELECT * FROM cbb_pitching_advanced
         WHERE player_id = ?
         ORDER BY season DESC LIMIT 1`,
      ).bind(playerId).first<PitchingAdvancedRow>(),

      env.DB.prepare(
        `SELECT * FROM havf_scores
         WHERE player_id = ? AND league = 'college-baseball'
         ORDER BY season DESC LIMIT 1`,
      ).bind(playerId).first<HavfRow>(),

      env.DB.prepare(
        `SELECT * FROM player_game_log
         WHERE espn_id = ?
         ORDER BY game_date DESC LIMIT 30`,
      ).bind(playerId).all<GameLogRow>(),
    ]);

    if (!basicResult) {
      return json(withMeta({ error: 'Player not found for Texas' }, 'd1'), 404);
    }

    const gameLog = gameLogResult.results ?? [];

    const payload = withMeta(
      {
        player: {
          id: basicResult.espn_id,
          name: basicResult.name,
          position: basicResult.position,
          team: basicResult.team,
          headshot: basicResult.headshot,
          classYear: basicResult.season,
        },
        batting: battingResult ?? null,
        pitching: pitchingResult ?? null,
        havf: havfResult
          ? {
              composite: havfResult.havf_composite,
              h: havfResult.h_score,
              a: havfResult.a_score,
              v: havfResult.v_score,
              f: havfResult.f_score,
              breakdown: havfResult.breakdown,
            }
          : null,
        gameLog: gameLog.map((g) => ({
          date: g.game_date,
          opponent: g.opponent,
          isHome: g.is_home === 1,
          result: g.result,
          batting: { ab: g.ab, r: g.r, h: g.h, rbi: g.rbi, hr: g.hr, bb: g.bb, k: g.k, sb: g.sb },
          pitching:
            g.ip_thirds > 0
              ? { ip: Math.round((g.ip_thirds / 3) * 10) / 10, ha: g.ha, er: g.er, so: g.so, bb: g.bb_p, w: g.w, l: g.l, sv: g.sv }
              : null,
        })),
        rolling: {
          avg5: computeRollingAvg(gameLog, 5),
          avg10: computeRollingAvg(gameLog, 10),
          era5: computeRollingEra(gameLog, 5),
        },
        radar: computeRadar(battingResult, havfResult, gameLog),
      },
      'd1',
    );

    await kvPut(env.KV, KV_KEY, payload, TTL);
    return cachedJson(payload, 200, 300, { 'X-Cache': 'MISS' });
  } catch (err) {
    console.error('[handleTexasPlayerProfile]', err instanceof Error ? err.message : err);
    return json({ error: 'Internal server error', status: 500 }, 500);
  }
}

// ─── Opponent Scouting Report ───────────────────────────────────────────────

export async function handleTexasOpponentScout(env: Env, opponentId: string): Promise<Response> {
  try {
    const KV_KEY = `texas-intel:scout:${opponentId}`;
    const TTL = 21600; // 6 hours

    const cached = await kvGet<Record<string, unknown>>(env.KV, KV_KEY);
    if (cached) {
      return cachedJson(cached, 200, 600, { 'X-Cache': 'HIT' });
    }

    const [teamBattingResult, teamPitchingResult, topHittersResult, topPitchersResult] = await Promise.all([
      env.DB.prepare(
        `SELECT AVG(avg) AS avg, AVG(obp) AS obp, AVG(slg) AS slg, AVG(ops) AS ops,
                AVG(k_pct) AS k_pct, AVG(bb_pct) AS bb_pct, AVG(iso) AS iso,
                AVG(woba) AS woba, AVG(wrc_plus) AS wrc_plus, AVG(babip) AS babip
         FROM cbb_batting_advanced
         WHERE team_id = ?`,
      ).bind(opponentId).first(),

      env.DB.prepare(
        `SELECT AVG(era) AS era, AVG(fip) AS fip, AVG(whip) AS whip,
                AVG(k_9) AS k_9, AVG(bb_9) AS bb_9
         FROM cbb_pitching_advanced
         WHERE team_id = ?`,
      ).bind(opponentId).first(),

      env.DB.prepare(
        `SELECT player_name, position, ab AS pa, avg, woba, wrc_plus, hr
         FROM cbb_batting_advanced
         WHERE team_id = ?
         ORDER BY woba DESC LIMIT 5`,
      ).bind(opponentId).all(),

      env.DB.prepare(
        `SELECT player_name, position, ip, era, fip, k_9, bb_9
         FROM cbb_pitching_advanced
         WHERE team_id = ?
         ORDER BY fip ASC LIMIT 5`,
      ).bind(opponentId).all(),
    ]);

    // Determine opponent name + conference from data rows
    const sampleRow = await env.DB.prepare(
      `SELECT team AS team_name, conference FROM cbb_batting_advanced WHERE team_id = ? LIMIT 1`,
    ).bind(opponentId).first<{ team_name: string; conference: string }>();

    let conferenceStrength: ConferenceStrengthRow | null = null;
    if (sampleRow?.conference) {
      conferenceStrength = await env.DB.prepare(
        `SELECT * FROM cbb_conference_strength
         WHERE conference = ?
         ORDER BY season DESC LIMIT 1`,
      ).bind(sampleRow.conference).first<ConferenceStrengthRow>();
    }

    const topHitters = topHittersResult.results ?? [];
    const topPitchers = topPitchersResult.results ?? [];

    // Attempt AI scouting brief
    let brief: Record<string, unknown> | null = null;
    if (env.ANTHROPIC_API_KEY) {
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          signal: AbortSignal.timeout(15000),
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 1024,
            messages: [
              {
                role: 'user',
                content: `You are a college baseball scouting analyst for the Texas Longhorns. Analyze this opponent data and provide a scouting report.

Team batting averages: ${JSON.stringify(teamBattingResult)}
Team pitching averages: ${JSON.stringify(teamPitchingResult)}
Top 5 hitters by wOBA: ${JSON.stringify(topHitters)}
Top 5 pitchers by FIP: ${JSON.stringify(topPitchers)}
Conference strength: ${JSON.stringify(conferenceStrength)}

Respond ONLY with valid JSON in this exact structure:
{
  "overview": "1-2 sentence team summary",
  "offense_analysis": "2-3 sentences on their offensive profile — strengths, weaknesses, tendencies",
  "pitching_analysis": "2-3 sentences on their pitching staff — strengths, weaknesses, tendencies",
  "key_matchups": "2-3 sentences on key individual matchups Texas should watch",
  "game_plan": "2-3 sentences on recommended approach for Texas"
}`,
              },
            ],
          }),
        });

        if (res.ok) {
          const result = (await res.json()) as { content: Array<{ text: string }> };
          const text = result.content?.[0]?.text ?? '';
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            brief = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
          }
        }
      } catch (aiErr) {
        console.warn('[texas-intel] AI scouting brief failed:', aiErr);
      }
    }

    // Structure response to match client ScoutingResponse interface
    const payload = withMeta(
      {
        opponent: {
          id: opponentId,
          name: sampleRow?.team_name ?? opponentId,
          conference: sampleRow?.conference ?? '',
          teamBatting: teamBattingResult ?? {},
          teamPitching: teamPitchingResult ?? {},
        },
        topHitters,
        topPitchers,
        conferenceStrength: conferenceStrength ?? null,
        brief,
      },
      brief ? 'anthropic+d1' : 'd1',
    );

    await kvPut(env.KV, KV_KEY, payload, TTL);
    return cachedJson(payload, 200, 600, { 'X-Cache': 'MISS' });
  } catch (err) {
    console.error('[handleTexasOpponentScout]', err instanceof Error ? err.message : err);
    return json({ error: 'Internal server error', status: 500 }, 500);
  }
}

// ─── Game Analyses ──────────────────────────────────────────────────────────

interface GameAnalysis {
  gameId: string;
  analysis: string;
  generatedAt: string;
}

export async function handleTexasGameAnalysisGenerate(env: Env, gameId: string): Promise<Response> {
  try {
    const ANALYSIS_KEY = `texas-intel:game-analysis:${gameId}`;
    const ANALYSIS_TTL = 604800; // 7 days

    const existing = await kvGet<GameAnalysis>(env.KV, ANALYSIS_KEY);
    if (existing) return cachedJson(withMeta(existing, 'cache'), 200, 300, { 'X-Cache': 'HIT' });

    if (!env.ANTHROPIC_API_KEY) return json(withMeta({ error: 'Analysis generation unavailable' }, 'fallback'), 200);

    const game = await env.DB.prepare(
      `SELECT * FROM processed_games WHERE game_id = ?`,
    ).bind(gameId).first<ProcessedGameRow>();

    if (!game) return json(withMeta({ error: 'Game not found' }, 'error'), 404);

    const boxScoreResult = await env.DB.prepare(
      `SELECT * FROM player_game_log WHERE game_id = ? ORDER BY ab DESC, ip_thirds DESC`,
    ).bind(gameId).all<GameLogRow>();

    const boxScore = boxScoreResult.results ?? [];

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        messages: [
          {
            role: 'user',
            content: `Write a 3-paragraph game analysis for this Texas Longhorns baseball game. Be factual and analytical — this is for an intelligence dashboard, not a news article.

Game: ${game.away_team} ${game.away_score} @ ${game.home_team} ${game.home_score} on ${game.game_date}
Box score data: ${JSON.stringify(boxScore.slice(0, 20))}

Paragraph 1: Game narrative and key moments.
Paragraph 2: Standout individual performances.
Paragraph 3: Strategic implications and what it means going forward.

Respond with plain text only — no JSON, no markdown headers.`,
          },
        ],
      }),
    });

    if (!res.ok) {
      console.error(`[texas-intel] Game analysis API error: ${res.status}`);
      return json(withMeta({ error: 'Analysis generation failed' }, 'error'), 502);
    }

    const result = (await res.json()) as { content: Array<{ text: string }> };
    const analysisText = result.content?.[0]?.text ?? '';

    if (!analysisText) return json(withMeta({ error: 'Empty analysis' }, 'error'), 200);

    const analysis: GameAnalysis = {
      gameId,
      analysis: analysisText,
      generatedAt: new Date().toISOString(),
    };

    await kvPut(env.KV, ANALYSIS_KEY, analysis, ANALYSIS_TTL);
    return cachedJson(withMeta(analysis, 'anthropic'), 200, 300, { 'X-Cache': 'MISS' });
  } catch (err) {
    console.error('[handleTexasGameAnalysisGenerate]', err instanceof Error ? err.message : err);
    return json({ error: 'Internal server error', status: 500 }, 500);
  }
}

export async function handleTexasGameAnalyses(env: Env): Promise<Response> {
  try {
    const KV_KEY = 'texas-intel:game-analyses';
    const TTL = 1800; // 30 minutes

    const cached = await kvGet<Record<string, unknown>>(env.KV, KV_KEY);
    if (cached) {
      return cachedJson(cached, 200, 300, { 'X-Cache': 'HIT' });
    }

    const gamesResult = await env.DB.prepare(
      `SELECT * FROM processed_games
       WHERE home_team_id = ? OR away_team_id = ?
       ORDER BY game_date DESC LIMIT 10`,
    ).bind(TEXAS_TEAM_ID, TEXAS_TEAM_ID).all<ProcessedGameRow>();

    const games = gamesResult.results ?? [];

    const gamesWithAnalyses = await Promise.all(
      games.map(async (game) => {
        const analysisKey = `texas-intel:game-analysis:${game.game_id}`;
        const analysis = await kvGet<GameAnalysis>(env.KV, analysisKey);
        return {
          gameId: game.game_id,
          date: game.game_date,
          homeTeam: game.home_team,
          awayTeam: game.away_team,
          homeScore: game.home_score,
          awayScore: game.away_score,
          isHome: game.home_team_id === TEXAS_TEAM_ID,
          analysis: analysis?.analysis ?? null,
          analysisGeneratedAt: analysis?.generatedAt ?? null,
        };
      }),
    );

    const payload = withMeta(
      { games: gamesWithAnalyses, total: gamesWithAnalyses.length },
      'd1',
    );

    await kvPut(env.KV, KV_KEY, payload, TTL);
    return cachedJson(payload, 200, 300, { 'X-Cache': 'MISS' });
  } catch (err) {
    console.error('[handleTexasGameAnalyses]', err instanceof Error ? err.message : err);
    return json({ error: 'Internal server error', status: 500 }, 500);
  }
}

// ─── Pitching Staff ─────────────────────────────────────────────────────────

interface PitcherWithLog extends PitchingAdvancedRow {
  role: 'starter' | 'reliever' | 'closer';
  recentLog: Array<{
    date: string;
    opponent: string;
    ip: number;
    ha: number;
    er: number;
    so: number;
    bb: number;
    result: string;
  }>;
}

function classifyPitcherRole(pitcher: PitchingAdvancedRow): 'starter' | 'reliever' | 'closer' {
  if (pitcher.sv >= 3) return 'closer';
  if (pitcher.gs > pitcher.g * 0.5) return 'starter';
  return 'reliever';
}

export async function handleTexasPitchingStaff(env: Env): Promise<Response> {
  try {
    const KV_KEY = 'texas-intel:pitching';
    const TTL = 3600; // 1 hour

    const cached = await kvGet<Record<string, unknown>>(env.KV, KV_KEY);
    if (cached) {
      return cachedJson(cached, 200, 300, { 'X-Cache': 'HIT' });
    }

    const pitchersResult = await env.DB.prepare(
      `SELECT * FROM cbb_pitching_advanced
       WHERE team_id = ? OR team LIKE ?
       ORDER BY fip ASC`,
    ).bind(TEXAS_TEAM_ID, TEXAS_TEAM_PATTERN).all<PitchingAdvancedRow>();

    const pitchers = pitchersResult.results ?? [];

    const pitchersWithLogs: PitcherWithLog[] = await Promise.all(
      pitchers.map(async (p) => {
        const logResult = await env.DB.prepare(
          `SELECT game_date, opponent, ip_thirds, ha, er, so, bb_p, result
           FROM player_game_log
           WHERE espn_id = ? AND ip_thirds > 0
           ORDER BY game_date DESC LIMIT 5`,
        ).bind(p.player_id).all<GameLogRow>();

        const recentLog = (logResult.results ?? []).map((g) => ({
          date: g.game_date,
          opponent: g.opponent,
          ip: Math.round((g.ip_thirds / 3) * 10) / 10,
          ha: g.ha,
          er: g.er,
          so: g.so,
          bb: g.bb_p,
          result: g.result,
        }));

        return {
          ...p,
          role: classifyPitcherRole(p),
          recentLog,
        };
      }),
    );

    const starters = pitchersWithLogs.filter((p) => p.role === 'starter');
    const relievers = pitchersWithLogs.filter((p) => p.role === 'reliever');
    const closers = pitchersWithLogs.filter((p) => p.role === 'closer');

    // Compute team-level pitching aggregates
    const totalIP = pitchers.reduce((sum, p) => sum + p.ip, 0);
    const teamPitching =
      totalIP > 0
        ? {
            era: Math.round((pitchers.reduce((sum, p) => sum + p.era * p.ip, 0) / totalIP) * 100) / 100,
            fip: Math.round((pitchers.reduce((sum, p) => sum + p.fip * p.ip, 0) / totalIP) * 100) / 100,
            whip: Math.round((pitchers.reduce((sum, p) => sum + p.whip * p.ip, 0) / totalIP) * 100) / 100,
            k_9: Math.round((pitchers.reduce((sum, p) => sum + p.k_9 * p.ip, 0) / totalIP) * 100) / 100,
            bb_9: Math.round((pitchers.reduce((sum, p) => sum + p.bb_9 * p.ip, 0) / totalIP) * 100) / 100,
            k_bb: Math.round((pitchers.reduce((sum, p) => sum + p.k_bb * p.ip, 0) / totalIP) * 100) / 100,
          }
        : { era: 0, fip: 0, whip: 0, k_9: 0, bb_9: 0, k_bb: 0 };

    const payload = withMeta(
      {
        staff: { starters, relievers, closers },
        teamPitching,
      },
      'd1',
    );

    await kvPut(env.KV, KV_KEY, payload, TTL);
    return cachedJson(payload, 200, 300, { 'X-Cache': 'MISS' });
  } catch (err) {
    console.error('[handleTexasPitchingStaff]', err instanceof Error ? err.message : err);
    return json({ error: 'Internal server error', status: 500 }, 500);
  }
}

// ─── Schedule Heat Map ──────────────────────────────────────────────────────

interface ESPNScheduleEvent {
  id: string;
  date: string;
  name: string;
  competitions: Array<{
    id: string;
    venue?: { fullName: string };
    competitors: Array<{
      id: string;
      team: { id: string; displayName: string };
      homeAway: string;
      score?: string;
      winner?: boolean;
    }>;
    status?: { type?: { completed: boolean } };
  }>;
}

interface ESPNScheduleResponse {
  events?: ESPNScheduleEvent[];
}

function computeDifficulty(
  strengthIndex: number | null,
  isAway: boolean,
  opponentName: string,
): { difficulty: number; difficultyLabel: string } {
  let score = strengthIndex != null ? Math.round(strengthIndex * 100) : 50;
  if (isAway) score += 10;
  if (RIVALRY_OPPONENTS.some((r) => opponentName.toLowerCase().includes(r))) score += 5;
  score = Math.min(100, Math.max(0, score));

  let label: string;
  if (score <= 30) label = 'easy';
  else if (score <= 55) label = 'moderate';
  else if (score <= 75) label = 'tough';
  else label = 'brutal';

  return { difficulty: score, difficultyLabel: label };
}

export async function handleTexasScheduleHeatMap(env: Env): Promise<Response> {
  try {
    const KV_KEY = 'texas-intel:schedule-heatmap';
    const TTL = 14400; // 4 hours

    const cached = await kvGet<Record<string, unknown>>(env.KV, KV_KEY);
    if (cached) {
      return cachedJson(cached, 200, 600, { 'X-Cache': 'HIT' });
    }

    const scheduleRes = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams/${TEXAS_TEAM_ID}/schedule`,
      {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10000),
      },
    );

    if (!scheduleRes.ok) {
      return json(withMeta({ error: 'ESPN schedule unavailable' }, 'error'), 502);
    }

    const scheduleData = (await scheduleRes.json()) as ESPNScheduleResponse;
    const events = scheduleData.events ?? [];

    // Pre-fetch conference strength data
    const confResult = await env.DB.prepare(
      `SELECT * FROM cbb_conference_strength ORDER BY season DESC`,
    ).all<ConferenceStrengthRow>();
    const confStrengthMap = new Map<string, ConferenceStrengthRow>();
    for (const row of confResult.results ?? []) {
      if (!confStrengthMap.has(row.conference)) {
        confStrengthMap.set(row.conference, row);
      }
    }

    // Pre-fetch opponent records from processed_games
    const recordResult = await env.DB.prepare(
      `SELECT home_team_id, away_team_id, home_score, away_score
       FROM processed_games`,
    ).all<ProcessedGameRow>();

    const teamWins = new Map<string, { w: number; l: number }>();
    for (const g of recordResult.results ?? []) {
      const homeRec = teamWins.get(g.home_team_id) ?? { w: 0, l: 0 };
      const awayRec = teamWins.get(g.away_team_id) ?? { w: 0, l: 0 };
      if (g.home_score > g.away_score) {
        homeRec.w++;
        awayRec.l++;
      } else if (g.away_score > g.home_score) {
        awayRec.w++;
        homeRec.l++;
      }
      teamWins.set(g.home_team_id, homeRec);
      teamWins.set(g.away_team_id, awayRec);
    }

    let totalDifficulty = 0;
    let gamesPlayed = 0;
    let gamesRemaining = 0;

    const games = events.map((event) => {
      const competition = event.competitions?.[0];
      const competitors = competition?.competitors ?? [];
      const texas = competitors.find((c) => c.team.id === TEXAS_TEAM_ID);
      const opponent = competitors.find((c) => c.team.id !== TEXAS_TEAM_ID);
      const isHome = texas?.homeAway === 'home';
      const isCompleted = competition?.status?.type?.completed === true;

      const opponentId = opponent?.team.id ?? '';
      const opponentName = opponent?.team.displayName ?? 'TBD';

      // Look up opponent conference for strength mapping
      const opponentRecord = teamWins.get(opponentId);
      const opponentRecordStr = opponentRecord ? `${opponentRecord.w}-${opponentRecord.l}` : null;

      // Find opponent's conference strength via team name lookup in DB
      let confStrengthVal: number | null = null;
      // Try to find the opponent's conference from their team name
      const opponentConf = confStrengthMap.get(opponentName);
      if (opponentConf?.strength_index != null) {
        confStrengthVal = opponentConf.strength_index;
      } else {
        // Fallback: look through all conferences for a name match in team lists
        for (const [, conf] of confStrengthMap) {
          if (conf.strength_index != null) {
            // Use a moderate default if we can't match the opponent
            confStrengthVal = confStrengthVal ?? conf.strength_index;
          }
        }
      }
      const { difficulty, difficultyLabel } = computeDifficulty(confStrengthVal, !isHome, opponentName);
      totalDifficulty += difficulty;

      if (isCompleted) {
        gamesPlayed++;
      } else {
        gamesRemaining++;
      }

      const texasScore = texas?.score;
      const opponentScore = opponent?.score;
      let result: string | null = null;
      let score: string | null = null;
      if (isCompleted && texasScore != null && opponentScore != null) {
        const ts = parseInt(texasScore, 10);
        const os = parseInt(opponentScore, 10);
        result = ts > os ? 'W' : ts < os ? 'L' : 'T';
        score = `${texasScore}-${opponentScore}`;
      }

      return {
        gameId: event.id,
        date: event.date,
        opponent: opponentName,
        opponentId,
        isHome,
        venue: competition?.venue?.fullName ?? null,
        result,
        score,
        difficulty,
        difficultyLabel,
        opponentRecord: opponentRecordStr,
        conferenceStrength: confStrengthVal,
      };
    });

    // Find toughest stretch — sliding window of 5 games
    let toughestStretch: { start: string; end: string; avgDifficulty: number } | null = null;
    if (games.length >= 5) {
      let maxAvg = 0;
      let maxIdx = 0;
      for (let i = 0; i <= games.length - 5; i++) {
        const windowAvg = games.slice(i, i + 5).reduce((s, g) => s + g.difficulty, 0) / 5;
        if (windowAvg > maxAvg) {
          maxAvg = windowAvg;
          maxIdx = i;
        }
      }
      toughestStretch = {
        start: games[maxIdx].date,
        end: games[maxIdx + 4].date,
        avgDifficulty: Math.round(maxAvg),
      };
    }

    const payload = withMeta(
      {
        games,
        summary: {
          gamesPlayed,
          gamesRemaining,
          avgDifficulty: games.length > 0 ? Math.round(totalDifficulty / games.length) : 0,
          toughestStretch,
        },
      },
      'espn+d1',
    );

    await kvPut(env.KV, KV_KEY, payload, TTL);
    return cachedJson(payload, 200, 600, { 'X-Cache': 'MISS' });
  } catch (err) {
    console.error('[handleTexasScheduleHeatMap]', err instanceof Error ? err.message : err);
    return json({ error: 'Internal server error', status: 500 }, 500);
  }
}

// ─── Matchup Theater ────────────────────────────────────────────────────────

export async function handleTexasMatchup(env: Env, opponentId: string): Promise<Response> {
  try {
    const KV_KEY = `texas-intel:matchup:${opponentId}`;
    const TTL = 7200; // 2 hours

    const cached = await kvGet<Record<string, unknown>>(env.KV, KV_KEY);
    if (cached) {
      return cachedJson(cached, 200, 300, { 'X-Cache': 'HIT' });
    }

    const [
      texasBatting, texasPitching, oppBatting, oppPitching,
      texasHitters, oppHitters, texasPitchers, oppPitchers, h2hGames,
    ] = await Promise.all([
      env.DB.prepare(
        `SELECT AVG(avg) AS avg, AVG(obp) AS obp, AVG(slg) AS slg, AVG(ops) AS ops,
                AVG(k_pct) AS k_pct, AVG(bb_pct) AS bb_pct, AVG(iso) AS iso,
                AVG(woba) AS woba, AVG(wrc_plus) AS wrc_plus
         FROM cbb_batting_advanced WHERE team_id = ? OR team LIKE ?`,
      ).bind(TEXAS_TEAM_ID, TEXAS_TEAM_PATTERN).first(),

      env.DB.prepare(
        `SELECT AVG(era) AS era, AVG(fip) AS fip, AVG(whip) AS whip,
                AVG(k_9) AS k_9, AVG(bb_9) AS bb_9
         FROM cbb_pitching_advanced WHERE team_id = ? OR team LIKE ?`,
      ).bind(TEXAS_TEAM_ID, TEXAS_TEAM_PATTERN).first(),

      env.DB.prepare(
        `SELECT AVG(avg) AS avg, AVG(obp) AS obp, AVG(slg) AS slg, AVG(ops) AS ops,
                AVG(k_pct) AS k_pct, AVG(bb_pct) AS bb_pct, AVG(iso) AS iso,
                AVG(woba) AS woba, AVG(wrc_plus) AS wrc_plus
         FROM cbb_batting_advanced WHERE team_id = ?`,
      ).bind(opponentId).first(),

      env.DB.prepare(
        `SELECT AVG(era) AS era, AVG(fip) AS fip, AVG(whip) AS whip,
                AVG(k_9) AS k_9, AVG(bb_9) AS bb_9
         FROM cbb_pitching_advanced WHERE team_id = ?`,
      ).bind(opponentId).first(),

      env.DB.prepare(
        `SELECT player_id, player_name, position, avg, obp, slg, woba, wrc_plus, hr, rbi, iso
         FROM cbb_batting_advanced WHERE team_id = ? OR team LIKE ?
         ORDER BY woba DESC LIMIT 5`,
      ).bind(TEXAS_TEAM_ID, TEXAS_TEAM_PATTERN).all(),

      env.DB.prepare(
        `SELECT player_id, player_name, position, avg, obp, slg, woba, wrc_plus, hr, rbi, iso
         FROM cbb_batting_advanced WHERE team_id = ?
         ORDER BY woba DESC LIMIT 5`,
      ).bind(opponentId).all(),

      env.DB.prepare(
        `SELECT player_id, player_name, position, era, fip, whip, k_9, bb_9, ip, w, l
         FROM cbb_pitching_advanced WHERE (team_id = ? OR team LIKE ?) AND gs > 0
         ORDER BY fip ASC LIMIT 3`,
      ).bind(TEXAS_TEAM_ID, TEXAS_TEAM_PATTERN).all(),

      env.DB.prepare(
        `SELECT player_id, player_name, position, era, fip, whip, k_9, bb_9, ip, w, l
         FROM cbb_pitching_advanced WHERE team_id = ? AND gs > 0
         ORDER BY fip ASC LIMIT 3`,
      ).bind(opponentId).all(),

      env.DB.prepare(
        `SELECT game_id, home_team, away_team, home_score, away_score, game_date,
                home_team_id, away_team_id
         FROM processed_games
         WHERE (home_team_id = ? AND away_team_id = ?)
            OR (home_team_id = ? AND away_team_id = ?)
         ORDER BY game_date DESC LIMIT 10`,
      ).bind(TEXAS_TEAM_ID, opponentId, opponentId, TEXAS_TEAM_ID).all<ProcessedGameRow>(),
    ]);

    const h2h = h2hGames.results ?? [];
    let texasWins = 0;
    let oppWins = 0;
    for (const g of h2h) {
      const isTexasHome = g.home_team_id === TEXAS_TEAM_ID;
      const ts = isTexasHome ? g.home_score : g.away_score;
      const os = isTexasHome ? g.away_score : g.home_score;
      if (ts > os) texasWins++;
      else if (os > ts) oppWins++;
    }

    const payload = withMeta({
      texas: {
        batting: texasBatting,
        pitching: texasPitching,
        topHitters: texasHitters.results ?? [],
        topPitchers: texasPitchers.results ?? [],
      },
      opponent: {
        id: opponentId,
        batting: oppBatting,
        pitching: oppPitching,
        topHitters: oppHitters.results ?? [],
        topPitchers: oppPitchers.results ?? [],
      },
      headToHead: {
        texasWins,
        opponentWins: oppWins,
        games: h2h.map((g) => ({
          date: g.game_date,
          homeTeam: g.home_team,
          awayTeam: g.away_team,
          homeScore: g.home_score,
          awayScore: g.away_score,
          texasIsHome: g.home_team_id === TEXAS_TEAM_ID,
        })),
      },
    }, 'd1');

    await kvPut(env.KV, KV_KEY, payload, TTL);
    return cachedJson(payload, 200, 300, { 'X-Cache': 'MISS' });
  } catch (err) {
    console.error('[handleTexasMatchup]', err instanceof Error ? err.message : err);
    return json({ error: 'Internal server error', status: 500 }, 500);
  }
}

// ─── Draft Board ─────────────────────────────────────────────────────────────

export async function handleTexasDraftBoard(env: Env): Promise<Response> {
  try {
    const KV_KEY = 'texas-intel:draft-board';
    const TTL = 14400; // 4 hours

    const cached = await kvGet<Record<string, unknown>>(env.KV, KV_KEY);
    if (cached) {
      return cachedJson(cached, 200, 600, { 'X-Cache': 'HIT' });
    }

    const [havfResult, battingResult, pitchingResult] = await Promise.all([
      env.DB.prepare(
        `SELECT * FROM havf_scores
         WHERE league = 'college-baseball' AND team LIKE ?
         ORDER BY havf_composite DESC`,
      ).bind(TEXAS_TEAM_PATTERN).all<HavfRow>(),

      env.DB.prepare(
        `SELECT * FROM cbb_batting_advanced
         WHERE team_id = ? OR team LIKE ?
         ORDER BY woba DESC`,
      ).bind(TEXAS_TEAM_ID, TEXAS_TEAM_PATTERN).all<BattingAdvancedRow>(),

      env.DB.prepare(
        `SELECT * FROM cbb_pitching_advanced
         WHERE team_id = ? OR team LIKE ?
         ORDER BY fip ASC`,
      ).bind(TEXAS_TEAM_ID, TEXAS_TEAM_PATTERN).all<PitchingAdvancedRow>(),
    ]);

    const battingMap = new Map<string, BattingAdvancedRow>();
    for (const b of battingResult.results ?? []) battingMap.set(b.player_id, b);

    const pitchingMap = new Map<string, PitchingAdvancedRow>();
    for (const p of pitchingResult.results ?? []) pitchingMap.set(p.player_id, p);

    const players = (havfResult.results ?? []).map((h) => {
      const batting = battingMap.get(h.player_id) ?? null;
      const pitching = pitchingMap.get(h.player_id) ?? null;
      const composite = h.havf_composite;

      let draftTier: string;
      if (composite >= 80) draftTier = 'Top 3 Rounds';
      else if (composite >= 65) draftTier = 'Rounds 4-10';
      else if (composite >= 50) draftTier = 'Day 3';
      else draftTier = 'Development';

      return {
        playerId: h.player_id,
        name: h.player_name,
        position: h.position,
        havf: { composite: h.havf_composite, h: h.h_score, a: h.a_score, v: h.v_score, f: h.f_score },
        batting: batting
          ? { avg: batting.avg, obp: batting.obp, slg: batting.slg, woba: batting.woba, wrc_plus: batting.wrc_plus, hr: batting.hr, sb: batting.sb, pa: batting.pa }
          : null,
        pitching: pitching
          ? { era: pitching.era, fip: pitching.fip, ip: pitching.ip, k_9: pitching.k_9, w: pitching.w, l: pitching.l, sv: pitching.sv }
          : null,
        draftTier,
      };
    });

    const payload = withMeta({ players, total: players.length }, 'd1');
    await kvPut(env.KV, KV_KEY, payload, TTL);
    return cachedJson(payload, 200, 600, { 'X-Cache': 'MISS' });
  } catch (err) {
    console.error('[handleTexasDraftBoard]', err instanceof Error ? err.message : err);
    return json({ error: 'Internal server error', status: 500 }, 500);
  }
}

// ─── Transfer Portal Intelligence ────────────────────────────────────────────

export async function handleTexasPortalIntel(env: Env): Promise<Response> {
  try {
    const KV_KEY = 'texas-intel:portal';
    const TTL = 3600; // 1 hour

    const cached = await kvGet<Record<string, unknown>>(env.KV, KV_KEY);
    if (cached) {
      return cachedJson(cached, 200, 300, { 'X-Cache': 'HIT' });
    }

    const portalRaw = await env.KV.get('portal:texas-intel');
    let portalMoves: unknown[] = [];
    if (portalRaw) {
      const parsed = JSON.parse(portalRaw);
      portalMoves = parsed.moves ?? parsed.players ?? [];
    }

    const [rosterResult, havfResult] = await Promise.all([
      env.DB.prepare(
        `SELECT espn_id, name, position, team, headshot, season
         FROM player_season_stats
         WHERE team_id = ?
         ORDER BY name ASC`,
      ).bind(TEXAS_TEAM_ID).all<PlayerBasicRow>(),

      env.DB.prepare(
        `SELECT player_id, player_name, havf_composite, position
         FROM havf_scores
         WHERE league = 'college-baseball' AND team LIKE ?
         ORDER BY havf_composite DESC`,
      ).bind(TEXAS_TEAM_PATTERN).all<HavfRow>(),
    ]);

    const havfMap = new Map<string, number>();
    for (const h of havfResult.results ?? []) {
      havfMap.set(h.player_id, h.havf_composite);
    }

    const roster = (rosterResult.results ?? []).map((p) => ({
      id: p.espn_id,
      name: p.name,
      position: p.position,
      headshot: p.headshot,
      havfComposite: havfMap.get(p.espn_id) ?? null,
    }));

    const payload = withMeta({
      portalMoves,
      currentRoster: roster,
      rosterCount: roster.length,
    }, portalMoves.length > 0 ? 'portal-sync' : 'd1');

    await kvPut(env.KV, KV_KEY, payload, TTL);
    return cachedJson(payload, 200, 300, { 'X-Cache': 'MISS' });
  } catch (err) {
    console.error('[handleTexasPortalIntel]', err instanceof Error ? err.message : err);
    return json({ error: 'Internal server error', status: 500 }, 500);
  }
}

// ─── Performance Trends ──────────────────────────────────────────────────────

export async function handleTexasTrends(env: Env): Promise<Response> {
  try {
    const KV_KEY = 'texas-intel:trends';
    const TTL = 3600; // 1 hour

    const cached = await kvGet<Record<string, unknown>>(env.KV, KV_KEY);
    if (cached) {
      return cachedJson(cached, 200, 300, { 'X-Cache': 'HIT' });
    }

    const battersResult = await env.DB.prepare(
      `SELECT player_id, player_name, position, avg, obp, slg, woba, wrc_plus, hr, sb, pa, iso, k_pct, bb_pct
       FROM cbb_batting_advanced
       WHERE team_id = ? OR team LIKE ?
       ORDER BY woba DESC`,
    ).bind(TEXAS_TEAM_ID, TEXAS_TEAM_PATTERN).all<BattingAdvancedRow>();

    const batters = battersResult.results ?? [];

    const trendsData = await Promise.all(
      batters.map(async (batter) => {
        const logResult = await env.DB.prepare(
          `SELECT game_date, opponent, is_home, result, ab, r, h, rbi, hr, bb, k, sb
           FROM player_game_log
           WHERE espn_id = ? AND ab > 0
           ORDER BY game_date DESC LIMIT 15`,
        ).bind(batter.player_id).all<GameLogRow>();

        const games = logResult.results ?? [];
        if (games.length < 3) return null;

        const avg5 = computeRollingAvg(games, 5);
        const avg10 = computeRollingAvg(games, 10);

        let status: 'hot' | 'cold' | 'neutral';
        if (avg5 > batter.avg + 0.050) status = 'hot';
        else if (avg5 < batter.avg - 0.050) status = 'cold';
        else status = 'neutral';

        const sparkline = games.slice(0, 10).reverse().map((g) => ({
          date: g.game_date,
          hits: g.h,
          abs: g.ab,
          avg: g.ab > 0 ? Math.round((g.h / g.ab) * 1000) / 1000 : 0,
        }));

        return {
          playerId: batter.player_id,
          name: batter.player_name,
          position: batter.position,
          seasonStats: { avg: batter.avg, woba: batter.woba, wrc_plus: batter.wrc_plus, pa: batter.pa },
          rolling: { avg5, avg10 },
          status,
          sparkline,
        };
      }),
    );

    const players = trendsData
      .filter((t): t is NonNullable<typeof t> => t !== null)
      .sort((a, b) => {
        if (a.status === 'hot' && b.status !== 'hot') return -1;
        if (a.status !== 'hot' && b.status === 'hot') return 1;
        if (a.status === 'cold' && b.status !== 'cold') return 1;
        if (a.status !== 'cold' && b.status === 'cold') return -1;
        return b.seasonStats.woba - a.seasonStats.woba;
      });

    const teamGamesResult = await env.DB.prepare(
      `SELECT home_team_id, away_team_id, home_score, away_score, game_date
       FROM processed_games
       WHERE home_team_id = ? OR away_team_id = ?
       ORDER BY game_date DESC LIMIT 10`,
    ).bind(TEXAS_TEAM_ID, TEXAS_TEAM_ID).all<ProcessedGameRow>();

    let last5RunDiff = 0;
    for (const g of (teamGamesResult.results ?? []).slice(0, 5)) {
      const isHome = g.home_team_id === TEXAS_TEAM_ID;
      last5RunDiff += (isHome ? g.home_score : g.away_score) - (isHome ? g.away_score : g.home_score);
    }

    const payload = withMeta({
      players,
      teamMomentum: {
        last5RunDifferential: last5RunDiff,
        hotPlayers: players.filter((p) => p.status === 'hot').length,
        coldPlayers: players.filter((p) => p.status === 'cold').length,
      },
    }, 'd1');

    await kvPut(env.KV, KV_KEY, payload, TTL);
    return cachedJson(payload, 200, 300, { 'X-Cache': 'MISS' });
  } catch (err) {
    console.error('[handleTexasTrends]', err instanceof Error ? err.message : err);
    return json({ error: 'Internal server error', status: 500 }, 500);
  }
}
