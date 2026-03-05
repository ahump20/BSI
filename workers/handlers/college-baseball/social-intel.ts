/**
 * College Baseball — Social Intelligence handlers.
 *
 * Serves classified social signals from KV cache (written by bsi-social-intel cron worker).
 * Falls back to direct D1 query when KV is cold.
 *
 * Routes (registered in workers/index.ts):
 *   GET /api/college-baseball/social-intel
 *   GET /api/college-baseball/social-intel/team/:teamId
 */

import type { Env } from './shared';
import { json, cachedJson, kvGet, kvPut, dataHeaders } from './shared';

const KV_TTL = 900; // 15 min — matches bsi-social-intel write TTL
const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8' };

// ─────────────────────────────────────────────────────────────────────────────
// Feed: latest signals across all teams
// ─────────────────────────────────────────────────────────────────────────────

export async function handleSocialIntelFeed(env: Env): Promise<Response> {
  // KV fast path
  const cached = await env.KV.get('social:intel:feed:latest', 'text');
  if (cached) {
    return new Response(cached, {
      headers: {
        ...JSON_HEADERS,
        'Cache-Control': 'public, max-age=60, s-maxage=900',
        'X-Cache': 'HIT',
      },
    });
  }

  // D1 fallback — query recent signals directly
  if (!env.DB) {
    return json({ signals: [], total: 0, generated_at: new Date().toISOString(), meta: emptyMeta() }, 200, dataHeaders(new Date().toISOString()));
  }

  try {
    const { results } = await env.DB.prepare(`
      SELECT platform, post_id, post_url, post_text, author, posted_at,
             signal_type, confidence, team_mentioned, player_mentioned,
             summary, raw_entities
      FROM cbb_social_signals
      ORDER BY computed_at DESC
      LIMIT 50
    `).all<DbSignalRow>();

    const signals = results.map(rowToSignal);
    const payload = {
      signals,
      total: signals.length,
      generated_at: new Date().toISOString(),
      meta: buildMeta(),
    };

    // Populate KV for next request
    await env.KV.put('social:intel:feed:latest', JSON.stringify(payload), { expirationTtl: KV_TTL });

    return new Response(JSON.stringify(payload), {
      headers: { ...JSON_HEADERS, 'Cache-Control': 'public, max-age=60', 'X-Cache': 'MISS' },
    });
  } catch (err) {
    console.error('[social-intel] D1 fallback failed:', err);
    return json({ error: 'Social intelligence unavailable' }, 503, JSON_HEADERS);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Team: signals + summary for a specific team slug
// ─────────────────────────────────────────────────────────────────────────────

export async function handleSocialIntelTeam(teamId: string, env: Env): Promise<Response> {
  const slug = teamId.toLowerCase().replace(/[^a-z0-9-]/g, '-');

  // KV fast path
  const cached = await env.KV.get(`social:intel:team:${slug}`, 'text');
  if (cached) {
    return new Response(cached, {
      headers: {
        ...JSON_HEADERS,
        'Cache-Control': 'public, max-age=60, s-maxage=900',
        'X-Cache': 'HIT',
      },
    });
  }

  // D1 fallback
  if (!env.DB) {
    return json({ team_slug: slug, signals: [], summary: null, meta: buildMeta() }, 200, JSON_HEADERS);
  }

  try {
    const [signalsResult, summaryResult] = await Promise.all([
      env.DB.prepare(`
        SELECT platform, post_id, post_url, post_text, author, posted_at,
               signal_type, confidence, team_mentioned, player_mentioned,
               summary, raw_entities
        FROM cbb_social_signals
        WHERE team_mentioned = ?
        ORDER BY computed_at DESC
        LIMIT 25
      `).bind(slug).all<DbSignalRow>(),
      env.DB.prepare(`
        SELECT team_slug, summary_date, injury_count, transfer_count,
               recruiting_count, sentiment_score, top_signals
        FROM cbb_social_intel_summary
        WHERE team_slug = ?
        ORDER BY summary_date DESC
        LIMIT 1
      `).bind(slug).first<DbSummaryRow>(),
    ]);

    const signals = signalsResult.results.map(rowToSignal);
    const summary = summaryResult ? rowToSummary(summaryResult) : null;

    const payload = { team_slug: slug, signals, summary, meta: buildMeta() };

    await env.KV.put(`social:intel:team:${slug}`, JSON.stringify(payload), { expirationTtl: KV_TTL });

    return new Response(JSON.stringify(payload), {
      headers: { ...JSON_HEADERS, 'Cache-Control': 'public, max-age=60', 'X-Cache': 'MISS' },
    });
  } catch (err) {
    console.error(`[social-intel] D1 fallback failed for ${slug}:`, err);
    return json({ error: 'Social intelligence unavailable' }, 503, JSON_HEADERS);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

interface DbSignalRow {
  platform: string;
  post_id: string;
  post_url: string | null;
  post_text: string;
  author: string | null;
  posted_at: string;
  signal_type: string;
  confidence: number;
  team_mentioned: string | null;
  player_mentioned: string | null;
  summary: string | null;
  raw_entities: string | null;
}

interface DbSummaryRow {
  team_slug: string;
  summary_date: string;
  injury_count: number;
  transfer_count: number;
  recruiting_count: number;
  sentiment_score: number | null;
  top_signals: string | null;
}

function rowToSignal(row: DbSignalRow) {
  return {
    platform: row.platform,
    post_id: row.post_id,
    post_url: row.post_url,
    post_text: row.post_text,
    author: row.author,
    posted_at: row.posted_at,
    signal_type: row.signal_type,
    confidence: row.confidence,
    team_mentioned: row.team_mentioned,
    player_mentioned: row.player_mentioned,
    summary: row.summary,
    raw_entities: row.raw_entities ? JSON.parse(row.raw_entities) : { teams: [], players: [] },
  };
}

function rowToSummary(row: DbSummaryRow) {
  return {
    team_slug: row.team_slug,
    summary_date: row.summary_date,
    injury_count: row.injury_count,
    transfer_count: row.transfer_count,
    recruiting_count: row.recruiting_count,
    sentiment_score: row.sentiment_score,
    top_signals: row.top_signals ? JSON.parse(row.top_signals) : [],
  };
}

function buildMeta() {
  return {
    source: 'bsi-social-intel',
    fetched_at: new Date().toISOString(),
    timezone: 'America/Chicago' as const,
  };
}

function emptyMeta() {
  return buildMeta();
}
