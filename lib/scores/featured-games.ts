export interface GameTeam {
  name: string;
  abbreviation: string;
  logo?: string;
  score?: string | number;
}

export interface FeaturedGame {
  id: string;
  away: GameTeam;
  home: GameTeam;
  state: 'live' | 'final' | 'upcoming';
  detail: string;
  href: string;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function firstText(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
    if (typeof value === 'number') {
      return String(value);
    }
  }
  return '';
}

function deriveAbbreviation(name: string, fallback: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return fallback;
  }
  if (words.length === 1) {
    return words[0].slice(0, 3).toUpperCase();
  }
  return words.slice(0, 3).map(word => word[0]).join('').toUpperCase();
}

function normalizeScheduleTeam(
  teamValue: unknown,
  overrides: {
    abbreviation?: unknown;
    logo?: unknown;
    score?: unknown;
  },
  fallbackAbbreviation: string,
): GameTeam {
  const team = asRecord(teamValue);
  const teamName = typeof teamValue === 'string'
    ? teamValue
    : firstText(team?.displayName, team?.name, team?.shortDisplayName, team?.shortName);
  const abbreviation = firstText(
    overrides.abbreviation,
    team?.abbreviation,
    team?.shortName,
    team?.shortDisplayName,
  ) || deriveAbbreviation(teamName, fallbackAbbreviation);
  const logos = Array.isArray(team?.logos) ? team.logos : [];
  const firstLogo = asRecord(logos[0]);

  return {
    name: teamName,
    abbreviation,
    logo: firstText(overrides.logo, team?.logo, firstLogo?.href),
    score: firstText(overrides.score, team?.score),
  };
}

export function extractMLBGames(data: Record<string, unknown>): FeaturedGame[] {
  const games = (data?.games as Array<Record<string, unknown>>) || [];
  return games.slice(0, 4).map(g => {
    const away = (g.teams as Record<string, unknown>)?.away as Record<string, unknown> || {};
    const home = (g.teams as Record<string, unknown>)?.home as Record<string, unknown> || {};
    const status = g.status as Record<string, unknown> || {};
    const isLive = Boolean((status as Record<string, boolean>)?.isLive);
    const isFinal = Boolean((status as Record<string, unknown>)?.type && ((status as Record<string, Record<string, boolean>>).type?.completed));
    return {
      id: String(g.gamePk || g.id || ''),
      away: { name: String(away.name || ''), abbreviation: String(away.abbreviation || 'AWY'), logo: String(away.logo || ''), score: String(away.score ?? '') },
      home: { name: String(home.name || ''), abbreviation: String(home.abbreviation || 'HME'), logo: String(home.logo || ''), score: String(home.score ?? '') },
      state: isLive ? 'live' : isFinal ? 'final' : 'upcoming',
      detail: String((status as Record<string, string>)?.detailedState || ''),
      href: `/mlb/game/${g.gamePk || g.id}`,
    } satisfies FeaturedGame;
  });
}

export function extractESPNGames(data: Record<string, unknown>, sport: string): FeaturedGame[] {
  const games = (data?.games as Array<Record<string, unknown>>) || [];
  return games.slice(0, 4).map(g => {
    const teams = (g.teams || g.competitors) as Array<Record<string, unknown>> || [];
    const away = teams.find(t => t.homeAway === 'away') || teams[0] || {};
    const home = teams.find(t => t.homeAway === 'home') || teams[1] || {};
    const status = g.status as Record<string, Record<string, unknown>> || {};
    const state = String(status?.type?.state || 'pre');
    const completed = Boolean(status?.type?.completed);

    const awayTeam = (away.team || {}) as Record<string, string>;
    const homeTeam = (home.team || {}) as Record<string, string>;
    const awayLogos = (awayTeam.logos || []) as Array<Record<string, string>>;
    const homeLogos = (homeTeam.logos || []) as Array<Record<string, string>>;

    return {
      id: String(g.id || ''),
      away: {
        name: String(awayTeam.displayName || ''),
        abbreviation: String(awayTeam.abbreviation || 'AWY'),
        logo: String(awayTeam.logo || awayLogos[0]?.href || ''),
        score: String((away as Record<string, string>).score ?? ''),
      },
      home: {
        name: String(homeTeam.displayName || ''),
        abbreviation: String(homeTeam.abbreviation || 'HME'),
        logo: String(homeTeam.logo || homeLogos[0]?.href || ''),
        score: String((home as Record<string, string>).score ?? ''),
      },
      state: state === 'in' ? 'live' : completed ? 'final' : 'upcoming',
      detail: String(status?.type?.detail || status?.type?.shortDetail || ''),
      href: `/${sport}/game/${g.id}`,
    } satisfies FeaturedGame;
  });
}

export function extractCBBGames(data: Record<string, unknown>): FeaturedGame[] {
  const games = ((data?.data || data?.games) as Array<Record<string, unknown>>) || [];
  return games.slice(0, 4).map(g => ({
    id: String(g.id || ''),
    away: normalizeScheduleTeam(g.awayTeam, {
      abbreviation: g.awayAbbreviation,
      logo: g.awayLogo,
      score: g.awayScore,
    }, 'AWY'),
    home: normalizeScheduleTeam(g.homeTeam, {
      abbreviation: g.homeAbbreviation,
      logo: g.homeLogo,
      score: g.homeScore,
    }, 'HME'),
    state: g.status === 'live' ? 'live' : g.status === 'final' ? 'final' : 'upcoming',
    detail: String(g.statusDetail || ''),
    href: `/college-baseball/game/${g.id}`,
  }));
}
