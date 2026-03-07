/**
 * BSI Social Intel — D1 upserts + KV writes.
 *
 * Writes classified signals to D1 (permanent, queryable)
 * and denormalized summaries to KV (fast serving, 15-min TTL).
 */

import type { ClassifiedSignal, SocialIntelSummary } from './types';

const KV_TTL = 900; // 15 minutes — matches plan spec
const TZ = 'America/Chicago';

/**
 * Upsert a batch of classified signals into D1.
 * UNIQUE(platform, post_id) constraint handles deduplication.
 * Returns the count of successfully written rows.
 */
export async function storeSignals(signals: ClassifiedSignal[], env: Env): Promise<number> {
  if (signals.length === 0) return 0;

  let written = 0;

  // D1 doesn't support multi-row inserts with bind params — batch individually
  await Promise.allSettled(
    signals.map(async (s) => {
      try {
        await env.DB.prepare(`
          INSERT INTO cbb_social_signals
            (platform, post_id, post_url, post_text, author, posted_at,
             signal_type, confidence, team_mentioned, player_mentioned,
             summary, raw_entities)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(platform, post_id) DO NOTHING
        `).bind(
          s.platform,
          s.post_id,
          s.post_url,
          s.post_text.slice(0, 2000),
          s.author,
          s.posted_at,
          s.signal_type,
          s.confidence,
          s.team_mentioned,
          s.player_mentioned,
          s.summary,
          JSON.stringify(s.raw_entities),
        ).run();
        written++;
      } catch (err) {
        // Non-fatal — log and continue
        console.warn(`[store] D1 write failed for ${s.platform}:${s.post_id}:`, err instanceof Error ? err.message : err);
      }
    })
  );

  return written;
}

/**
 * Write KV feed cache with latest signals across all teams.
 * Key: social:intel:feed:latest, TTL: 15 min.
 */
export async function writeFeedCache(signals: ClassifiedSignal[], env: Env): Promise<void> {
  const payload = JSON.stringify({
    signals: signals.slice(0, 50), // cap feed at 50 most recent
    total: signals.length,
    generated_at: new Date().toISOString(),
    meta: {
      source: 'bsi-social-intel',
      fetched_at: new Date().toISOString(),
      timezone: TZ,
    },
  });

  await env.KV.put('social:intel:feed:latest', payload, { expirationTtl: KV_TTL });
}

/**
 * Compute per-team summaries from classified signals and write to D1 + KV.
 * Aggregates injury/transfer/recruiting counts and sentiment score per team per day.
 */
export async function writeTeamSummaries(signals: ClassifiedSignal[], env: Env): Promise<void> {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: TZ }); // YYYY-MM-DD

  // Group signals by team
  const byTeam = new Map<string, ClassifiedSignal[]>();
  for (const s of signals) {
    if (!s.team_mentioned) continue;
    const existing = byTeam.get(s.team_mentioned) ?? [];
    existing.push(s);
    byTeam.set(s.team_mentioned, existing);
  }

  await Promise.allSettled(
    Array.from(byTeam.entries()).map(async ([team_slug, teamSignals]) => {
      const summary = computeSummary(team_slug, today, teamSignals);

      // D1 upsert
      try {
        await env.DB.prepare(`
          INSERT INTO cbb_social_intel_summary
            (team_slug, summary_date, injury_count, transfer_count, recruiting_count,
             sentiment_score, top_signals)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(team_slug, summary_date) DO UPDATE SET
            injury_count    = excluded.injury_count,
            transfer_count  = excluded.transfer_count,
            recruiting_count = excluded.recruiting_count,
            sentiment_score = excluded.sentiment_score,
            top_signals     = excluded.top_signals,
            computed_at     = strftime('%Y-%m-%dT%H:%M:%fZ','now')
        `).bind(
          summary.team_slug,
          summary.summary_date,
          summary.injury_count,
          summary.transfer_count,
          summary.recruiting_count,
          summary.sentiment_score,
          JSON.stringify(summary.top_signals),
        ).run();
      } catch (err) {
        console.warn(`[store] summary D1 write failed for ${team_slug}:`, err instanceof Error ? err.message : err);
      }

      // KV per-team cache
      const teamPayload = JSON.stringify({
        team_slug,
        signals: teamSignals,
        summary,
        meta: {
          source: 'bsi-social-intel',
          fetched_at: new Date().toISOString(),
          timezone: TZ,
        },
      });
      await env.KV.put(`social:intel:team:${team_slug}`, teamPayload, { expirationTtl: KV_TTL });
    })
  );
}

function computeSummary(team_slug: string, summary_date: string, signals: ClassifiedSignal[]): SocialIntelSummary {
  const injury_count = signals.filter(s => s.signal_type === 'injury_lineup').length;
  const transfer_count = signals.filter(s => s.signal_type === 'transfer_portal').length;
  const recruiting_count = signals.filter(s => s.signal_type === 'recruiting').length;

  // Sentiment: average of -1/0/+1 from sentiment-type signals (positive post_text heuristic)
  const sentimentSignals = signals.filter(s => s.signal_type === 'sentiment');
  let sentiment_score: number | null = null;
  if (sentimentSignals.length > 0) {
    const scores: number[] = sentimentSignals.map(s => {
      const lower = s.post_text.toLowerCase();
      if (/huge win|great|impressive|dominant|clutch/.test(lower)) return 1;
      if (/loss|terrible|embarrass|awful|struggle/.test(lower)) return -1;
      return 0;
    });
    sentiment_score = scores.reduce((a, b) => a + b, 0) / scores.length;
  }

  // Top signals: up to 5 summaries from highest-confidence non-null entries
  const top_signals = signals
    .filter(s => s.summary !== null)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5)
    .map(s => s.summary as string);

  return { team_slug, summary_date, injury_count, transfer_count, recruiting_count, sentiment_score, top_signals };
}
