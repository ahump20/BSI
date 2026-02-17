/**
 * Shared game normalization — single source of truth for parsing
 * ESPN, SportsDataIO, and transformed API responses into GameScore[].
 *
 * Used by LiveScoresPanel and SportHubCards.
 */

export interface GameScore {
  id: string | number;
  away: { name: string; abbreviation?: string; score: number; rank?: number };
  home: { name: string; abbreviation?: string; score: number; rank?: number };
  status: string;
  isLive: boolean;
  isFinal: boolean;
  isPostponed?: boolean;
  detail?: string;
  startTime?: string;
}

/**
 * Normalize game data from multiple API formats into a flat GameScore array.
 *
 * Handles three response shapes:
 * 1. Transformed: { games: [...] } with flattened teams[] (MLB, NFL, NBA via ESPN transform)
 * 2. Scoreboard:  { scoreboard: { games: [...] } } (NBA via SportsDataIO)
 * 3. Raw ESPN:    { data: [...events] } with competitions[].competitors[] (College Baseball)
 */
export function normalizeGames(sport: string, data: Record<string, unknown>): GameScore[] {
  const scoreboard = data.scoreboard as Record<string, unknown> | undefined;

  // Shape 3: College baseball raw ESPN format — { data: [...events] }
  const rawData = data.data as Record<string, unknown>[] | undefined;
  if (Array.isArray(rawData) && rawData.length > 0 && rawData[0].competitions) {
    return rawData.map((event, i) => {
      const competitions = event.competitions as Record<string, unknown>[] | undefined;
      const comp = competitions?.[0] as Record<string, unknown> | undefined;
      const competitors = (comp?.competitors || []) as Record<string, unknown>[];

      const homeComp = competitors.find((c) => c.homeAway === 'home');
      const awayComp = competitors.find((c) => c.homeAway === 'away');
      const homeTeam = (homeComp?.team || {}) as Record<string, unknown>;
      const awayTeam = (awayComp?.team || {}) as Record<string, unknown>;

      const homeCurated = (homeComp?.curatedRank as Record<string, unknown>)?.current as number | undefined;
      const awayCurated = (awayComp?.curatedRank as Record<string, unknown>)?.current as number | undefined;
      const homeRank = homeCurated && homeCurated <= 25 ? homeCurated : undefined;
      const awayRank = awayCurated && awayCurated <= 25 ? awayCurated : undefined;

      const status = (comp?.status || event.status || {}) as Record<string, unknown>;
      const statusType = status?.type as Record<string, unknown> | undefined;

      const isLive = statusType?.state === 'in';
      const isFinal = statusType?.state === 'post' || statusType?.completed === true;
      const statusText = (statusType?.shortDetail as string)
        || (statusType?.description as string)
        || 'Scheduled';
      const isPostponed = (statusType?.description as string)?.toLowerCase().includes('postponed')
        || (statusType?.shortDetail as string)?.toLowerCase().includes('postponed');

      return {
        id: (event.id as string | number) || i,
        away: {
          name: (awayTeam.displayName as string) || (awayTeam.name as string) || 'Away',
          abbreviation: (awayTeam.abbreviation as string) || (awayTeam.shortDisplayName as string) || '',
          score: Number(awayComp?.score ?? 0),
          rank: awayRank,
        },
        home: {
          name: (homeTeam.displayName as string) || (homeTeam.name as string) || 'Home',
          abbreviation: (homeTeam.abbreviation as string) || (homeTeam.shortDisplayName as string) || '',
          score: Number(homeComp?.score ?? 0),
          rank: homeRank,
        },
        status: statusText,
        isLive: Boolean(isLive),
        isFinal: Boolean(isFinal),
        isPostponed: Boolean(isPostponed),
        detail: undefined,
        startTime: (statusType?.shortDetail as string) || undefined,
      };
    });
  }

  // Shapes 1 & 2: Transformed/scoreboard format
  const rawGames = (data.games || scoreboard?.games || []) as Record<string, unknown>[];
  return rawGames.map((g: Record<string, unknown>, i: number) => {
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

    const status = g.status as Record<string, unknown> | string | undefined;
    const statusType = typeof status === 'object' ? (status?.type as Record<string, unknown> | undefined) : undefined;

    const isLive = typeof status === 'object'
      ? statusType?.state === 'in' || status?.isLive === true
      : typeof status === 'string' && status.toLowerCase().includes('in progress');

    const isFinal = typeof status === 'object'
      ? status?.isFinal === true || statusType?.state === 'post'
      : typeof status === 'string' && status.toLowerCase().includes('final');

    const statusText = typeof status === 'object'
      ? (status?.detailedState as string) || (statusType?.description as string) || 'Scheduled'
      : (status as string) || 'Scheduled';

    const homeCurated = (homeEntry?.curatedRank as Record<string, unknown>)?.current as number | undefined;
    const awayCurated = (awayEntry?.curatedRank as Record<string, unknown>)?.current as number | undefined;

    const isPostponed = typeof status === 'object'
      ? (status?.detailedState as string)?.toLowerCase().includes('postponed')
      : typeof status === 'string' && status.toLowerCase().includes('postponed');

    const startTime = typeof status === 'object'
      ? (status?.startTime as string) || (statusType?.shortDetail as string)
      : undefined;

    return {
      id: (g.id as string | number) || i,
      away: {
        name: (awayTeam.displayName as string) || (awayTeam.name as string) || 'Away',
        abbreviation: (awayTeam.abbreviation as string) || (awayTeam.shortDisplayName as string) || '',
        score: Number(awayEntry?.score ?? 0),
        rank: awayCurated && awayCurated <= 25 ? awayCurated : undefined,
      },
      home: {
        name: (homeTeam.displayName as string) || (homeTeam.name as string) || 'Home',
        abbreviation: (homeTeam.abbreviation as string) || (homeTeam.shortDisplayName as string) || '',
        score: Number(homeEntry?.score ?? 0),
        rank: homeCurated && homeCurated <= 25 ? homeCurated : undefined,
      },
      status: statusText,
      isLive: Boolean(isLive),
      isFinal: Boolean(isFinal),
      isPostponed: Boolean(isPostponed),
      detail: typeof status === 'object' && status?.inning
        ? `${status?.inningState ?? ''} ${status.inning}`
        : undefined,
      startTime: startTime || undefined,
    };
  });
}

/**
 * Sort priority: live games > ranked matchups > final > scheduled > postponed.
 * Within each tier, higher-ranked matchups sort first (lower rank number = better).
 */
export function sortGames(games: GameScore[]): GameScore[] {
  return [...games].sort((a, b) => {
    // Tier: live (0) > ranked final (1) > ranked scheduled (2) > unranked final (3) > unranked scheduled (4) > postponed (5)
    const tier = (g: GameScore) => {
      if (g.isPostponed) return 5;
      const hasRank = g.away.rank || g.home.rank;
      if (g.isLive) return 0;
      if (g.isFinal && hasRank) return 1;
      if (!g.isFinal && !g.isLive && hasRank) return 2;
      if (g.isFinal) return 3;
      return 4;
    };
    const ta = tier(a);
    const tb = tier(b);
    if (ta !== tb) return ta - tb;

    // Within same tier, sort by best rank (lower = better)
    const bestRank = (g: GameScore) => Math.min(g.away.rank ?? 99, g.home.rank ?? 99);
    return bestRank(a) - bestRank(b);
  });
}
