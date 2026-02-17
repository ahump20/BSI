/**
 * Shared helpers for generateStaticParams in static export.
 *
 * These run at build time — the production Worker must be reachable.
 * Each helper returns a fallback array on any failure so the build
 * never hard-fails due to a transient network issue.
 */

const WORKER_BASE = 'https://blazesportsintel.com';

/** Returns [gameId] params for college baseball game detail pages. */
export async function cbbGameParams(): Promise<{ gameId: string }[]> {
  try {
    const res = await fetch(`${WORKER_BASE}/api/college-baseball/scores`, {
      headers: { 'User-Agent': 'BSI-Build/1.0' },
    });
    if (!res.ok) return [{ gameId: 'placeholder' }];

    const body = (await res.json()) as { data?: { id: string }[] };
    const games = body.data ?? [];
    const ids = games.map((g) => ({ gameId: String(g.id) }));
    return ids.length > 0 ? ids : [{ gameId: 'placeholder' }];
  } catch {
    return [{ gameId: 'placeholder' }];
  }
}

/** Returns [teamId] params for NBA team detail pages (all 30 teams). */
export async function nbaTeamParams(): Promise<{ teamId: string }[]> {
  try {
    const res = await fetch(`${WORKER_BASE}/api/nba/teams`, {
      headers: { 'User-Agent': 'BSI-Build/1.0' },
    });
    if (!res.ok) return [{ teamId: 'placeholder' }];

    const body = (await res.json()) as { teams?: { id: string }[] };
    const teams = body.teams ?? [];
    const ids = teams.map((t) => ({ teamId: String(t.id) }));
    return ids.length > 0 ? ids : [{ teamId: 'placeholder' }];
  } catch {
    return [{ teamId: 'placeholder' }];
  }
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
