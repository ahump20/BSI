/**
 * BSI Social Intel — Pipeline Worker
 *
 * Ingests Reddit r/collegebaseball + Twitter/X posts every 30 minutes,
 * classifies signals with Claude (injury, transfer, recruiting, sentiment),
 * stores structured results in D1 (bsi-prod-db) + KV (BSI_PROD_CACHE).
 *
 * Data flow:
 *   Reddit public API + Twitter/X via RapidAPI
 *   → keyword filter (CBB relevance)
 *   → Claude batch classification
 *   → D1: cbb_social_signals, cbb_social_intel_summary
 *   → KV: social:intel:feed:latest, social:intel:team:{slug}
 *
 * Deploy: wrangler deploy --config workers/bsi-social-intel/wrangler.toml
 */

import { fetchRedditPosts } from './reddit';
import { fetchTwitterPosts } from './twitter';
import { classifyPosts } from './classify';
import { storeSignals, writeFeedCache, writeTeamSummaries } from './store';

// Only process posts that mention at least one of these college baseball keywords
const CBB_KEYWORDS = [
  'college baseball', 'ncaa baseball', 'd1 baseball',
  'transfer portal', 'commit', 'decommit',
  'sec baseball', 'acc baseball', 'big 12 baseball', 'big ten baseball',
  'injury', 'il ', 'day-to-day', 'lineup',
  'recruits', 'offer',
  // Major programs by short name — extend as needed
  'longhorns', 'aggies', 'razorbacks', 'gamecocks', 'volunteers', 'tigers',
  'bulldogs', 'wildcats', 'gators', 'crimson tide',
];

function isCollegeBaseballRelevant(text: string): boolean {
  const lower = text.toLowerCase();
  return CBB_KEYWORDS.some(kw => lower.includes(kw));
}

async function runPipeline(env: Env): Promise<{ reddit: number; twitter: number; classified: number; stored: number }> {
  const [redditPosts, twitterPosts] = await Promise.all([
    fetchRedditPosts(),
    fetchTwitterPosts(env.RAPIDAPI_KEY),
  ]);

  const allPosts = [...redditPosts, ...twitterPosts];
  const relevant = allPosts.filter(p => isCollegeBaseballRelevant(p.post_text));

  console.log(`[pipeline] fetched reddit=${redditPosts.length} twitter=${twitterPosts.length} relevant=${relevant.length}`);

  if (relevant.length === 0) {
    return { reddit: redditPosts.length, twitter: twitterPosts.length, classified: 0, stored: 0 };
  }

  const classified = await classifyPosts(relevant, env.ANTHROPIC_API_KEY);

  const [stored] = await Promise.all([
    storeSignals(classified, env),
    writeFeedCache(classified, env),
    writeTeamSummaries(classified, env),
  ]);

  console.log(`[pipeline] classified=${classified.length} stored=${stored}`);

  return {
    reddit: redditPosts.length,
    twitter: twitterPosts.length,
    classified: classified.length,
    stored,
  };
}

export default {
  // Cron: every 30 minutes
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(
      runPipeline(env).catch(err => {
        console.error('[bsi-social-intel] pipeline failed:', err instanceof Error ? err.message : err);
      }),
    );
  },

  // GET / — manual trigger + status check (same pattern as bsi-synthetic-monitor)
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const json = (data: unknown, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });

    if (url.pathname === '/' || url.pathname === '/trigger') {
      try {
        const result = await runPipeline(env);
        return json({ ok: true, ...result, run_at: new Date().toISOString() });
      } catch (err) {
        return json({ ok: false, error: err instanceof Error ? err.message : 'Pipeline failed' }, 500);
      }
    }

    if (url.pathname === '/health') {
      return json({ ok: true, worker: 'bsi-social-intel', now: new Date().toISOString() });
    }

    return json({ error: 'Not found', routes: ['/', '/trigger', '/health'] }, 404);
  },
};
