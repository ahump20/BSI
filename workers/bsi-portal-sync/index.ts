/**
 * BSI Portal Sync — College Baseball Transfer Portal Cron Worker
 *
 * Fetches transfer portal data every 30 minutes and writes to KV.
 * The main worker reads the same KV key to serve the portal page.
 *
 * Data source: ESPN college baseball athletes + team changes.
 * Because ESPN doesn't expose a dedicated portal endpoint, this worker
 * fetches recent news/headlines tagged as transfer-related and builds
 * portal entries from them.
 *
 * Deploy: wrangler deploy --config workers/bsi-portal-sync/wrangler.toml
 */

interface Env {
  KV: KVNamespace;
  RAPIDAPI_KEY?: string;
}

interface PortalEntry {
  id: string;
  playerName: string;
  position: string;
  fromSchool: string;
  toSchool?: string;
  status: 'entered' | 'committed' | 'withdrawn';
  enteredDate: string;
  classification?: string;
}

const ESPN_BASE = 'https://site.api.espn.com';
const SPORT_PATH = 'baseball/college-baseball';
const KV_KEY = 'portal:college-baseball:entries';
const KV_TTL = 3600; // 1 hour — cron refreshes every 30 min

async function fetchWithTimeout<T>(url: string, timeoutMs = 8000): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'BSI-PortalSync/1.0' },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/**
 * Extract transfer portal entries from ESPN news articles.
 * ESPN tags transfer-related articles with categories — we parse
 * the headline structure to extract player, school, and status.
 */
async function fetchPortalFromNews(): Promise<PortalEntry[]> {
  const url = `${ESPN_BASE}/apis/site/v2/sports/${SPORT_PATH}/news?limit=50`;
  const data = await fetchWithTimeout<Record<string, unknown>>(url);
  if (!data) return [];

  const articles = (data.articles as Record<string, unknown>[]) || [];
  const entries: PortalEntry[] = [];

  for (const article of articles) {
    const headline = ((article.headline as string) || '').toLowerCase();
    const isTransfer =
      headline.includes('transfer') ||
      headline.includes('portal') ||
      headline.includes('commits to') ||
      headline.includes('enters the');

    if (!isTransfer) continue;

    const categories = (article.categories as Record<string, unknown>[]) || [];
    const teamCat = categories.find((c) => (c.type as string) === 'team');
    const athleteCat = categories.find((c) => (c.type as string) === 'athlete');

    // Determine status from headline
    let status: PortalEntry['status'] = 'entered';
    if (headline.includes('commits') || headline.includes('committed') || headline.includes('signs with')) {
      status = 'committed';
    } else if (headline.includes('withdraw') || headline.includes('stays')) {
      status = 'withdrawn';
    }

    entries.push({
      id: String(article.id ?? `portal-${entries.length}`),
      playerName: (athleteCat?.description as string) || extractPlayerName(article.headline as string),
      position: '',
      fromSchool: (teamCat?.description as string) || '',
      toSchool: status === 'committed' ? extractDestination(article.headline as string) : undefined,
      status,
      enteredDate: (article.published as string) || new Date().toISOString(),
      classification: undefined,
    });
  }

  return entries;
}

/** Best-effort player name extraction from headline */
function extractPlayerName(headline: string): string {
  if (!headline) return 'Unknown';
  // Common patterns: "John Smith enters transfer portal", "John Smith commits to Texas"
  const match = headline.match(/^([A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/);
  return match?.[1] || headline.split(' ').slice(0, 2).join(' ');
}

/** Best-effort destination extraction: "commits to {School}" */
function extractDestination(headline: string): string | undefined {
  if (!headline) return undefined;
  const match = headline.match(/commits?\s+to\s+(.+?)(?:\s+from|\s*$)/i);
  return match?.[1]?.trim();
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
    const entries = await fetchPortalFromNews();

    // Merge with existing entries (avoid duplicates by ID)
    let existing: PortalEntry[] = [];
    try {
      const raw = await env.KV.get(KV_KEY, 'text');
      if (raw) {
        const parsed = JSON.parse(raw) as { entries?: PortalEntry[] };
        existing = parsed.entries || [];
      }
    } catch {
      // Start fresh
    }

    const existingIds = new Set(existing.map((e) => e.id));
    const merged = [
      ...existing,
      ...entries.filter((e) => !existingIds.has(e.id)),
    ];

    // Sort by date descending
    merged.sort((a, b) => new Date(b.enteredDate).getTime() - new Date(a.enteredDate).getTime());

    // Keep at most 200 entries
    const trimmed = merged.slice(0, 200);

    await env.KV.put(
      KV_KEY,
      JSON.stringify({ entries: trimmed, lastUpdated: new Date().toISOString() }),
      { expirationTtl: KV_TTL },
    );
  },

  /** Manual trigger + status endpoint */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/status') {
      const raw = await env.KV.get(KV_KEY, 'text');
      if (!raw) {
        return new Response(JSON.stringify({ error: 'No portal data yet' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const data = JSON.parse(raw) as { entries?: unknown[]; lastUpdated?: string };
      return new Response(JSON.stringify({
        totalEntries: (data.entries || []).length,
        lastUpdated: data.lastUpdated,
        status: 'ok',
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Trigger manual sync
    await this.scheduled(
      {} as ScheduledEvent,
      env,
      { waitUntil: () => {}, passThroughOnException: () => {} } as unknown as ExecutionContext,
    );

    return new Response(JSON.stringify({ ok: true, message: 'Portal sync completed' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
