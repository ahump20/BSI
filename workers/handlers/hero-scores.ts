import type { Env } from '../shared/types';
import { buildMeta, cachedJson, cachedPayloadHeaders, freshDataHeaders, json, kvGet, kvPut } from '../shared/helpers';

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

const HERO_SCORES_CACHE_KEY = 'hero-scores';

function getInSeasonSports(): Array<{ endpoint: string; label: string }> {
  const now = new Date();
  const md = (now.getMonth() + 1) * 100 + now.getDate();
  const sports: Array<{ endpoint: string; label: string }> = [];

  if (md >= 214 && md <= 630) {
    sports.push({ endpoint: '/api/college-baseball/scores', label: 'College Baseball' });
  }
  if (md >= 215 && md <= 1105) {
    sports.push({ endpoint: '/api/mlb/scores', label: 'MLB' });
  }
  if (md >= 1020 || md <= 620) {
    sports.push({ endpoint: '/api/nba/scoreboard', label: 'NBA' });
  }
  if (md >= 801 || md <= 215) {
    sports.push({ endpoint: '/api/nfl/scores', label: 'NFL' });
  }
  if (md >= 825 || md <= 115) {
    sports.push({ endpoint: '/api/cfb/scores', label: 'CFB' });
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

  const scoreboard = data.scoreboard as Record<string, unknown> | undefined;
  const rawData = data.data as Record<string, unknown>[] | undefined;
  const rawGames =
    Array.isArray(rawData) && rawData.length > 0 && rawData[0].competitions
      ? rawData
      : ((data.games || scoreboard?.games || []) as Record<string, unknown>[]);

  for (const gameRecord of rawGames) {
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

    if (gameRecord.competitions) {
      const competition = ((gameRecord.competitions as Record<string, unknown>[]) || [])[0] as Record<string, unknown> | undefined;
      const competitors = (competition?.competitors || []) as Record<string, unknown>[];
      const homeComp = competitors.find((entry) => entry.homeAway === 'home');
      const awayComp = competitors.find((entry) => entry.homeAway === 'away');
      const homeTeam = (homeComp?.team || {}) as Record<string, unknown>;
      const awayTeam = (awayComp?.team || {}) as Record<string, unknown>;
      const status = (competition?.status || gameRecord.status || {}) as Record<string, unknown>;
      const statusType = status.type as Record<string, unknown> | undefined;

      homeName = (homeTeam.displayName as string) || 'Home';
      homeAbbr = (homeTeam.abbreviation as string) || '';
      homeScore = Number(homeComp?.score ?? 0);
      awayName = (awayTeam.displayName as string) || 'Away';
      awayAbbr = (awayTeam.abbreviation as string) || '';
      awayScore = Number(awayComp?.score ?? 0);
      isLive = statusType?.state === 'in';
      isFinal = statusType?.state === 'post' || statusType?.completed === true;
      statusText = (statusType?.shortDetail as string) || (statusType?.description as string) || 'Scheduled';
      startTime = (statusType?.shortDetail as string) || undefined;
    } else {
      const rawTeams = gameRecord.teams as Record<string, unknown>[] | Record<string, Record<string, unknown>> | undefined;
      let homeEntry: Record<string, unknown> | undefined;
      let awayEntry: Record<string, unknown> | undefined;

      if (Array.isArray(rawTeams)) {
        homeEntry = rawTeams.find((entry) => entry.homeAway === 'home');
        awayEntry = rawTeams.find((entry) => entry.homeAway === 'away');
      } else if (rawTeams) {
        homeEntry = rawTeams.home as Record<string, unknown> | undefined;
        awayEntry = rawTeams.away as Record<string, unknown> | undefined;
      }

      const homeTeam = (homeEntry?.team as Record<string, unknown>) || homeEntry || {};
      const awayTeam = (awayEntry?.team as Record<string, unknown>) || awayEntry || {};
      const status = gameRecord.status as Record<string, unknown> | string | undefined;
      const statusType = typeof status === 'object' ? (status?.type as Record<string, unknown> | undefined) : undefined;

      homeName = (homeTeam.displayName as string) || (homeTeam.name as string) || 'Home';
      homeAbbr = (homeTeam.abbreviation as string) || '';
      homeScore = Number(homeEntry?.score ?? 0);
      awayName = (awayTeam.displayName as string) || (awayTeam.name as string) || 'Away';
      awayAbbr = (awayTeam.abbreviation as string) || '';
      awayScore = Number(awayEntry?.score ?? 0);
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

    if (isLive) {
      live.push(game);
    } else if (isFinal) {
      final.push(game);
    } else {
      scheduled.push(game);
    }
  }

  return { live, scheduled, final };
}

export async function handleHeroScores(url: URL, env: Env): Promise<Response> {
  const cached = await kvGet<HeroScoresResponse>(env.KV, HERO_SCORES_CACHE_KEY);
  if (cached) {
    return cachedJson(cached, 200, 30, cachedPayloadHeaders(cached));
  }

  const fetchedAt = new Date().toISOString();

  try {
    const inSeason = getInSeasonSports();
    if (inSeason.length === 0) {
      const payload = {
        liveNow: null,
        nextUp: null,
        recentFinal: null,
        empty: true,
        meta: buildMeta('hero-scores-aggregator', { fetchedAt }),
      } as HeroScoresResponse;
      await kvPut(env.KV, HERO_SCORES_CACHE_KEY, payload, 300);
      return json(payload, 200, freshDataHeaders('hero-scores-aggregator'));
    }

    const allLive: HeroGame[] = [];
    const allScheduled: HeroGame[] = [];
    const allFinal: HeroGame[] = [];

    const responses = await Promise.allSettled(
      inSeason.map(async (sport) => {
        const endpointUrl = `${url.origin}${sport.endpoint}`;
        const response = await fetch(endpointUrl, { signal: AbortSignal.timeout(5000) });
        if (!response.ok) return null;
        return {
          label: sport.label,
          data: (await response.json()) as Record<string, unknown>,
        };
      }),
    );

    for (const result of responses) {
      if (result.status !== 'fulfilled' || !result.value) continue;
      const bucket = extractGames(result.value.label, result.value.data);
      allLive.push(...bucket.live);
      allScheduled.push(...bucket.scheduled);
      allFinal.push(...bucket.final);
    }

    const payload = {
      liveNow: allLive[0] ?? null,
      nextUp: allScheduled[0] ?? null,
      recentFinal: allFinal[0] ?? null,
      empty: allLive.length === 0 && allScheduled.length === 0 && allFinal.length === 0,
      meta: buildMeta('hero-scores-aggregator', { fetchedAt }),
    } as HeroScoresResponse;

    await kvPut(env.KV, HERO_SCORES_CACHE_KEY, payload, payload.liveNow ? 30 : 300);
    return json(payload, 200, freshDataHeaders('hero-scores-aggregator'));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load hero scores';
    return json({ error: message }, 500);
  }
}
