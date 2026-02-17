/**
 * Pages Function — /api/hero-scores
 *
 * Lightweight aggregator that returns 3 compact game objects for the hero strip:
 * liveNow (first live game found), nextUp (next scheduled), recentFinal (most recent completed).
 *
 * Calls existing per-sport score endpoints instead of duplicating API logic.
 * Caches 30s during live windows, 5 min otherwise.
 */

import { ok, err, preflight, cache } from './_utils';

interface Env {
  [key: string]: unknown;
  CACHE?: KVNamespace;
  KV?: KVNamespace;
}

interface HeroGame {
  sport: string;
  away: { name: string; abbreviation: string; score: number };
  home: { name: string; abbreviation: string; score: number };
  status: string;
  detail?: string;
  startTime?: string;
}

interface HeroScoresResponse {
  liveNow: HeroGame | null;
  nextUp: HeroGame | null;
  recentFinal: HeroGame | null;
  empty: boolean;
  meta: { source: string; fetched_at: string; timezone: string };
}

// Season check — inlined since this runs on the edge (can't import lib/season.ts)
function getInSeasonSports(): Array<{ key: string; endpoint: string; label: string }> {
  const now = new Date();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  const md = m * 100 + d;

  const sports: Array<{ key: string; endpoint: string; label: string }> = [];

  // College baseball: Feb 14 – Jun 30
  if (md >= 214 && md <= 630) {
    sports.push({ key: 'ncaa', endpoint: '/api/college-baseball/scores', label: 'College Baseball' });
  }

  // MLB: Feb 15 – Nov 5 (spring training through postseason)
  if (md >= 215 && md <= 1105) {
    sports.push({ key: 'mlb', endpoint: '/api/mlb/scores', label: 'MLB' });
  }

  // NBA: Oct 20 – Jun 20 (spans year boundary)
  if (md >= 1020 || md <= 620) {
    sports.push({ key: 'nba', endpoint: '/api/nba/scoreboard', label: 'NBA' });
  }

  // NFL: Aug 1 – Feb 15 (spans year boundary)
  if (md >= 801 || md <= 215) {
    sports.push({ key: 'nfl', endpoint: '/api/nfl/scores', label: 'NFL' });
  }

  // CFB: Aug 25 – Jan 15 (spans year boundary)
  if (md >= 825 || md <= 115) {
    sports.push({ key: 'cfb', endpoint: '/api/cfb/scores', label: 'CFB' });
  }

  return sports;
}

function extractGames(
  sportLabel: string,
  data: Record<string, unknown>,
): { live: HeroGame[]; scheduled: HeroGame[]; final: HeroGame[] } {
  const live: HeroGame[] = [];
  const scheduled: HeroGame[] = [];
  const final: HeroGame[] = [];

  // Handle multiple response shapes (same logic as normalize.ts)
  const scoreboard = data.scoreboard as Record<string, unknown> | undefined;
  const rawData = data.data as Record<string, unknown>[] | undefined;

  let rawGames: Record<string, unknown>[];

  if (Array.isArray(rawData) && rawData.length > 0 && rawData[0].competitions) {
    // ESPN format (college baseball)
    rawGames = rawData;
  } else {
    rawGames = (data.games || scoreboard?.games || []) as Record<string, unknown>[];
  }

  for (const g of rawGames) {
    let homeName = '';
    let homeAbbr = '';
    let homeScore = 0;
    let awayName = '';
    let awayAbbr = '';
    let awayScore = 0;
    let isLive = false;
    let isFinal = false;
    let statusText = 'Scheduled';
    let detail: string | undefined;
    let startTime: string | undefined;

    // ESPN format
    if (g.competitions) {
      const comp = ((g.competitions as Record<string, unknown>[]) || [])[0] as Record<string, unknown> | undefined;
      const competitors = (comp?.competitors || []) as Record<string, unknown>[];
      const homeComp = competitors.find((c) => c.homeAway === 'home');
      const awayComp = competitors.find((c) => c.homeAway === 'away');
      const homeTeam = (homeComp?.team || {}) as Record<string, unknown>;
      const awayTeam = (awayComp?.team || {}) as Record<string, unknown>;

      homeName = (homeTeam.displayName as string) || 'Home';
      homeAbbr = (homeTeam.abbreviation as string) || '';
      homeScore = Number(homeComp?.score ?? 0);
      awayName = (awayTeam.displayName as string) || 'Away';
      awayAbbr = (awayTeam.abbreviation as string) || '';
      awayScore = Number(awayComp?.score ?? 0);

      const status = (comp?.status || g.status || {}) as Record<string, unknown>;
      const statusType = status?.type as Record<string, unknown> | undefined;
      isLive = statusType?.state === 'in';
      isFinal = statusType?.state === 'post' || statusType?.completed === true;
      statusText = (statusType?.shortDetail as string) || (statusType?.description as string) || 'Scheduled';
      startTime = (statusType?.shortDetail as string) || undefined;
    } else {
      // Transformed/scoreboard format
      const rawTeams = g.teams as Record<string, unknown>[] | Record<string, Record<string, unknown>> | undefined;
      let homeEntry: Record<string, unknown> | undefined;
      let awayEntry: Record<string, unknown> | undefined;

      if (Array.isArray(rawTeams)) {
        homeEntry = rawTeams.find((t) => t.homeAway === 'home');
        awayEntry = rawTeams.find((t) => t.homeAway === 'away');
      } else if (rawTeams) {
        homeEntry = rawTeams.home as Record<string, unknown> | undefined;
        awayEntry = rawTeams.away as Record<string, unknown> | undefined;
      }

      const homeTeam = (homeEntry?.team as Record<string, unknown>) || homeEntry || {};
      const awayTeam = (awayEntry?.team as Record<string, unknown>) || awayEntry || {};

      homeName = (homeTeam.displayName as string) || (homeTeam.name as string) || 'Home';
      homeAbbr = (homeTeam.abbreviation as string) || '';
      homeScore = Number(homeEntry?.score ?? 0);
      awayName = (awayTeam.displayName as string) || (awayTeam.name as string) || 'Away';
      awayAbbr = (awayTeam.abbreviation as string) || '';
      awayScore = Number(awayEntry?.score ?? 0);

      const status = g.status as Record<string, unknown> | string | undefined;
      const statusType = typeof status === 'object' ? (status?.type as Record<string, unknown> | undefined) : undefined;
      isLive = typeof status === 'object'
        ? statusType?.state === 'in' || status?.isLive === true
        : typeof status === 'string' && status.toLowerCase().includes('in progress');
      isFinal = typeof status === 'object'
        ? status?.isFinal === true || statusType?.state === 'post'
        : typeof status === 'string' && status.toLowerCase().includes('final');
      statusText = typeof status === 'object'
        ? (status?.detailedState as string) || (statusType?.description as string) || 'Scheduled'
        : (status as string) || 'Scheduled';
      detail = typeof status === 'object' && status?.inning
        ? `${status?.inningState ?? ''} ${status.inning}`
        : undefined;
      startTime = typeof status === 'object'
        ? (status?.startTime as string) || (statusType?.shortDetail as string)
        : undefined;
    }

    const game: HeroGame = {
      sport: sportLabel,
      away: { name: awayName, abbreviation: awayAbbr, score: awayScore },
      home: { name: homeName, abbreviation: homeAbbr, score: homeScore },
      status: statusText,
      detail,
      startTime,
    };

    if (isLive) live.push(game);
    else if (isFinal) final.push(game);
    else scheduled.push(game);
  }

  return { live, scheduled, final };
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const fetchedAt = new Date().toISOString();

  try {
    const result = await cache(
      context.env as Record<string, unknown>,
      'hero-scores',
      async () => {
        const inSeason = getInSeasonSports();
        if (inSeason.length === 0) {
          return { liveNow: null, nextUp: null, recentFinal: null, empty: true } as Omit<HeroScoresResponse, 'meta'>;
        }

        const allLive: HeroGame[] = [];
        const allScheduled: HeroGame[] = [];
        const allFinal: HeroGame[] = [];

        // Fetch all in-season sports in parallel
        const origin = context.request.url.replace(/\/api\/hero-scores.*$/, '');
        const results = await Promise.allSettled(
          inSeason.map(async (sport) => {
            const url = `${origin}${sport.endpoint}`;
            const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
            if (!res.ok) return null;
            return { label: sport.label, data: await res.json() as Record<string, unknown> };
          }),
        );

        for (const r of results) {
          if (r.status === 'fulfilled' && r.value) {
            const { live, scheduled, final: finals } = extractGames(r.value.label, r.value.data);
            allLive.push(...live);
            allScheduled.push(...scheduled);
            allFinal.push(...finals);
          }
        }

        return {
          liveNow: allLive[0] ?? null,
          nextUp: allScheduled[0] ?? null,
          recentFinal: allFinal[0] ?? null,
          empty: allLive.length === 0 && allScheduled.length === 0 && allFinal.length === 0,
        } as Omit<HeroScoresResponse, 'meta'>;
      },
      // 30s if any live games exist, 5 min otherwise (checked after cache miss)
      30,
    );

    return ok({
      ...result,
      meta: { source: 'hero-scores-aggregator', fetched_at: fetchedAt, timezone: 'America/Chicago' },
    });
  } catch (error) {
    return err(error, 500);
  }
};

export const onRequestOptions: PagesFunction = async () => preflight();
