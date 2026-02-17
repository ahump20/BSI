/**
 * Shared helpers for generateStaticParams in static export.
 *
 * These run at build time — the production Worker must be reachable.
 * Module-level promises are used as a cache so each endpoint is fetched
 * only once per build process, regardless of how many pages import the helper.
 * Each helper falls back to a single placeholder entry on any network failure
 * so the build never hard-fails.
 */

const WORKER_BASE = 'https://blazesportsintel.com';

// Module-level cache — shared across all imports in the same build process
const cache = new Map<string, Promise<unknown>>();

function cachedFetch<T>(url: string): Promise<T> {
  if (!cache.has(url)) {
    cache.set(
      url,
      fetch(url, { headers: { 'User-Agent': 'BSI-Build/1.0' } })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    );
  }
  return cache.get(url) as Promise<T>;
}

/** Returns [gameId] params for college baseball game detail pages. */
export async function cbbGameParams(): Promise<{ gameId: string }[]> {
  const body = await cachedFetch<{ data?: { id: string }[] }>(
    `${WORKER_BASE}/api/college-baseball/scores`,
  );
  const games = body?.data ?? [];
  const ids = games.map((g) => ({ gameId: String(g.id) }));
  return ids.length > 0 ? ids : [{ gameId: 'placeholder' }];
}

/** Returns [teamId] params for NBA team detail pages (all 30 teams). */
export async function nbaTeamParams(): Promise<{ teamId: string }[]> {
  const body = await cachedFetch<{ teams?: { id: string }[] }>(`${WORKER_BASE}/api/nba/teams`);
  const teams = body?.teams ?? [];
  const ids = teams.map((t) => ({ teamId: String(t.id) }));
  return ids.length > 0 ? ids : [{ teamId: 'placeholder' }];
}

/** Returns [gameId] params for MLB game detail pages. */
export async function mlbGameParams(): Promise<{ gameId: string }[]> {
  const body = await cachedFetch<{ games?: { id: string }[] }>(`${WORKER_BASE}/api/mlb/scores`);
  const games = body?.games ?? [];
  const ids = games.map((g) => ({ gameId: String(g.id) }));
  return ids.length > 0 ? ids : [{ gameId: 'placeholder' }];
}

/** Returns [playerId] params for NFL player detail pages. */
export async function nflPlayerParams(): Promise<{ playerId: string }[]> {
  const body = await cachedFetch<{ players?: { id: string }[] }>(`${WORKER_BASE}/api/nfl/players`);
  const players = body?.players ?? [];
  const ids = players.map((p) => ({ playerId: String(p.id) }));
  return ids.length > 0 ? ids : [{ playerId: 'placeholder' }];
}

const ESPN_MLB_ROSTER = (teamId: string) =>
  `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/teams/${teamId}/roster`;

/** Returns [playerId] params for MLB player detail pages via ESPN team rosters. */
export async function mlbPlayerParams(): Promise<{ playerId: string }[]> {
  try {
    const teamsBody = await cachedFetch<{ teams?: { id: string }[] }>(`${WORKER_BASE}/api/mlb/teams`);
    const teamIds = (teamsBody?.teams ?? []).map((t) => String(t.id));
    if (teamIds.length === 0) return [{ playerId: 'placeholder' }];

    const BATCH = 10;
    const playerIds = new Set<string>();

    for (let i = 0; i < teamIds.length; i += BATCH) {
      const batch = teamIds.slice(i, i + BATCH);
      const results = await Promise.allSettled(
        batch.map((id) => cachedFetch<{ athletes?: { items?: { id: string }[] }[] }>(ESPN_MLB_ROSTER(id)))
      );

      for (const result of results) {
        if (result.status !== 'fulfilled' || !result.value) continue;
        for (const group of result.value.athletes ?? []) {
          for (const item of group.items ?? []) {
            if (item.id) playerIds.add(String(item.id));
          }
        }
      }
    }

    const params = [...playerIds].map((id) => ({ playerId: id }));
    return params.length > 0 ? params : [{ playerId: 'placeholder' }];
  } catch {
    return [{ playerId: 'placeholder' }];
  }
}

/** Returns [playerId] params for college baseball player detail pages. */
export async function cbbPlayerParams(): Promise<{ playerId: string }[]> {
  const body = await cachedFetch<{ players?: { id: string }[] }>(
    `${WORKER_BASE}/api/college-baseball/players`,
  );
  const players = body?.players ?? [];
  const ids = players.map((p) => ({ playerId: String(p.id) }));
  return ids.length > 0 ? ids : [{ playerId: 'placeholder' }];
}

const ESPN_ROSTER = (teamId: string) =>
  `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${teamId}/roster`;

/**
 * Returns [playerId] params for NBA player detail pages.
 * Fetches rosters for all 30 teams from ESPN in parallel batches of 10,
 * then deduplicates player IDs.
 */
export async function nbaPlayerParams(): Promise<{ playerId: string }[]> {
  try {
    const teamsBody = await cachedFetch<{ teams?: { id: string }[] }>(`${WORKER_BASE}/api/nba/teams`);
    const teamIds = (teamsBody?.teams ?? []).map((t) => String(t.id));
    if (teamIds.length === 0) return [{ playerId: 'placeholder' }];

    const BATCH = 10;
    const playerIds = new Set<string>();

    for (let i = 0; i < teamIds.length; i += BATCH) {
      const batch = teamIds.slice(i, i + BATCH);
      const results = await Promise.allSettled(
        batch.map((id) => cachedFetch<{ athletes?: { id: string }[] }>(ESPN_ROSTER(id)))
      );

      for (const result of results) {
        if (result.status !== 'fulfilled' || !result.value) continue;
        for (const athlete of result.value.athletes ?? []) {
          if (athlete.id) playerIds.add(String(athlete.id));
        }
      }
    }

    const params = [...playerIds].map((id) => ({ playerId: id }));
    return params.length > 0 ? params : [{ playerId: 'placeholder' }];
  } catch {
    return [{ playerId: 'placeholder' }];
  }
}

/** Returns [slug] params for blog-post-feed detail pages. */
export async function blogPostFeedParams(): Promise<{ slug: string }[]> {
  const body = await cachedFetch<{ posts?: { slug: string }[] }>(
    `${WORKER_BASE}/api/blog-post-feed?limit=50`,
  );
  const posts = body?.posts ?? [];
  const slugs = posts.map((p) => ({ slug: p.slug }));
  return slugs.length > 0 ? slugs : [{ slug: 'texas-baseball-week-1-recap-lamar-preview-michigan-state-series-2026' }];
}

/**
 * Returns [date] params for daily editorial pages — last 30 days.
 * Dates in YYYY-MM-DD format, America/Chicago context.
 * No API call needed: these are deterministic from build date.
 */
export function dailyEditorialDateParams(): { date: string }[] {
  const dates: { date: string }[] = [];
  const now = new Date();

  for (let i = 0; i < 30; i++) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    dates.push({ date: `${yyyy}-${mm}-${dd}` });
  }

  return dates;
}
