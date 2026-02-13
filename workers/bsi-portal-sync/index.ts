/**
 * BSI Portal Sync — Cron Worker
 *
 * Fetches college baseball transfer portal data from ESPN and writes
 * to KV so the main worker can serve it instantly.
 *
 * Cron: every 30 minutes
 * KV key: portal:college-baseball:entries
 *
 * Deploy: wrangler deploy --config workers/bsi-portal-sync/wrangler.toml
 */

interface Env {
  KV: KVNamespace;
}

interface PortalEntry {
  id: string;
  playerName: string;
  position: string;
  fromSchool: string;
  toSchool?: string;
  status: string;
  enteredDate?: string;
  classification?: string;
}

const KV_KEY = 'portal:college-baseball:entries';
const KV_TTL = 3600; // 1 hour — cron refreshes every 30 min so stale data auto-expires
const ESPN_BASE = 'https://site.api.espn.com';
const SPORT_PATH = 'baseball/college-baseball';
const TIMEOUT_MS = 12_000;

async function espnFetch<T>(url: string): Promise<{ ok: boolean; data?: T; error?: string }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(url, {
      headers: { 'User-Agent': 'BSI-Portal-Sync/1.0' },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return { ok: false, error: `ESPN returned ${res.status}` };
    return { ok: true, data: (await res.json()) as T };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Fetch failed' };
  }
}

/**
 * Fetch transfer portal data from ESPN's athlete transfer endpoint.
 * ESPN doesn't have a dedicated portal API, so we use the news feed
 * filtered for transfer-related articles + the athletes endpoint
 * with transfer status filtering when available.
 */
async function fetchPortalEntries(): Promise<PortalEntry[]> {
  const entries: PortalEntry[] = [];

  // Strategy 1: ESPN transfer news → extract player names and schools
  const newsUrl = `${ESPN_BASE}/apis/site/v2/sports/${SPORT_PATH}/news?limit=50`;
  const newsResult = await espnFetch<Record<string, unknown>>(newsUrl);

  if (newsResult.ok && newsResult.data) {
    const articles = (newsResult.data.articles ?? []) as Record<string, unknown>[];

    for (const article of articles) {
      const headline = ((article.headline ?? article.title) as string ?? '').toLowerCase();
      const desc = ((article.description ?? '') as string).toLowerCase();

      // Filter for transfer/portal mentions
      if (!headline.includes('transfer') && !headline.includes('portal') &&
          !desc.includes('transfer') && !desc.includes('portal')) {
        continue;
      }

      const categories = (article.categories ?? []) as Record<string, unknown>[];
      const athleteCat = categories.find((c) => c.type === 'athlete');
      const teamCat = categories.find((c) => c.type === 'team');

      if (athleteCat) {
        entries.push({
          id: String(athleteCat.athleteId ?? article.dataSourceIdentifier ?? `portal-${entries.length}`),
          playerName: (athleteCat.description as string) ?? 'Unknown',
          position: '',
          fromSchool: (teamCat?.description as string) ?? '',
          status: headline.includes('commit') ? 'committed' : 'entered',
          enteredDate: (article.published as string) ?? undefined,
          classification: undefined,
        });
      }
    }
  }

  // Strategy 2: Check ESPN athletes endpoint for teams with recent roster changes
  // ESPN's college baseball teams endpoint can list athletes
  const teamsUrl = `${ESPN_BASE}/apis/site/v2/sports/${SPORT_PATH}/teams?limit=400`;
  const teamsResult = await espnFetch<Record<string, unknown>>(teamsUrl);

  if (teamsResult.ok && teamsResult.data) {
    const sports = (teamsResult.data.sports ?? []) as Record<string, unknown>[];
    for (const sport of sports) {
      const leagues = (sport.leagues ?? []) as Record<string, unknown>[];
      for (const league of leagues) {
        const teams = (league.teams ?? []) as Record<string, unknown>[];
        // We don't iterate all 300+ teams — that would be too many requests.
        // The news-based approach above is the primary source.
        // This loop is here as a placeholder for when ESPN adds transfer status to the teams API.
        void teams;
      }
    }
  }

  return entries;
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
    const entries = await fetchPortalEntries();
    const now = new Date().toISOString();

    // Merge with existing entries to avoid losing data between syncs
    const existing = await env.KV.get(KV_KEY, 'text');
    let merged = entries;

    if (existing) {
      try {
        const prev = JSON.parse(existing) as { entries?: PortalEntry[] };
        const prevEntries = prev.entries ?? [];
        const newIds = new Set(entries.map((e) => e.id));

        // Keep old entries not in the new batch + add new entries
        merged = [
          ...prevEntries.filter((e) => !newIds.has(e.id)),
          ...entries,
        ];
      } catch {
        // Corrupt data — overwrite entirely
      }
    }

    const payload = {
      entries: merged,
      lastUpdated: now,
    };

    await env.KV.put(KV_KEY, JSON.stringify(payload), { expirationTtl: KV_TTL });
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/status') {
      const raw = await env.KV.get(KV_KEY, 'text');
      if (!raw) {
        return new Response(JSON.stringify({ error: 'No portal data yet', synced: false }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      try {
        const data = JSON.parse(raw) as { entries?: unknown[]; lastUpdated?: string };
        return new Response(JSON.stringify({
          synced: true,
          entryCount: (data.entries ?? []).length,
          lastUpdated: data.lastUpdated ?? null,
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch {
        return new Response(JSON.stringify({ error: 'Corrupt KV data' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Manual trigger
    await this.scheduled(
      {} as ScheduledEvent,
      env,
      { waitUntil: () => {}, passThroughOnException: () => {} } as unknown as ExecutionContext
    );

    return new Response(JSON.stringify({ ok: true, message: 'Portal sync completed' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
