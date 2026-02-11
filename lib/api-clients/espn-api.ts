/**
 * ESPN Public API Client
 *
 * Unified client for MLB, NFL, and NBA data via ESPN's public site API.
 * No API key required. These endpoints power ESPN.com itself.
 *
 * Base: https://site.api.espn.com/apis/site/v2/sports/{category}/{league}
 */

export type ESPNSport = 'mlb' | 'nfl' | 'nba' | 'cfb';

const SPORT_PATHS: Record<ESPNSport, string> = {
  mlb: 'baseball/mlb',
  nfl: 'football/nfl',
  nba: 'basketball/nba',
  cfb: 'football/college-football',
};

const BASE = 'https://site.api.espn.com/apis/site/v2/sports';
const BASE_V2 = 'https://site.api.espn.com/apis/v2/sports';

interface FetchOptions {
  timeout?: number;
}

async function espnFetch<T>(path: string, opts?: FetchOptions): Promise<T> {
  const controller = new AbortController();
  const timeoutMs = opts?.timeout ?? 10000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${BASE}/${path}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`ESPN API ${res.status}: ${res.statusText}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Scoreboard (scores)
// ---------------------------------------------------------------------------

export async function getScoreboard(
  sport: ESPNSport,
  date?: string,
): Promise<unknown> {
  const sportPath = SPORT_PATHS[sport];
  const qs = date ? `?dates=${date.replace(/-/g, '')}` : '';
  return espnFetch(`${sportPath}/scoreboard${qs}`);
}

// ---------------------------------------------------------------------------
// Standings
// ---------------------------------------------------------------------------

export async function getStandings(sport: ESPNSport): Promise<unknown> {
  const sportPath = SPORT_PATHS[sport];
  // Standings uses /apis/v2/ base, not /apis/site/v2/
  const url = `${BASE_V2}/${sportPath}/standings`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`ESPN standings ${res.status}: ${res.statusText}`);
    return (await res.json()) as unknown;
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Teams list
// ---------------------------------------------------------------------------

export async function getTeams(sport: ESPNSport): Promise<unknown> {
  const sportPath = SPORT_PATHS[sport];
  return espnFetch(`${sportPath}/teams`);
}

// ---------------------------------------------------------------------------
// Team detail (includes roster)
// ---------------------------------------------------------------------------

export async function getTeamDetail(
  sport: ESPNSport,
  teamId: string,
): Promise<unknown> {
  const sportPath = SPORT_PATHS[sport];
  return espnFetch(`${sportPath}/teams/${teamId}`);
}

export async function getTeamRoster(
  sport: ESPNSport,
  teamId: string,
): Promise<unknown> {
  const sportPath = SPORT_PATHS[sport];
  return espnFetch(`${sportPath}/teams/${teamId}/roster`);
}

// ---------------------------------------------------------------------------
// Game summary
// ---------------------------------------------------------------------------

export async function getGameSummary(
  sport: ESPNSport,
  gameId: string,
): Promise<unknown> {
  // Game summary lives on a different base path
  const sportPath = SPORT_PATHS[sport];
  return espnFetch(
    `${sportPath}/summary?event=${gameId}`,
  );
}

// ---------------------------------------------------------------------------
// Player / Athlete
// ---------------------------------------------------------------------------

export async function getAthlete(
  sport: ESPNSport,
  athleteId: string,
): Promise<unknown> {
  const sportPath = SPORT_PATHS[sport];
  return espnFetch(`${sportPath}/athletes/${athleteId}`);
}

// ---------------------------------------------------------------------------
// News
// ---------------------------------------------------------------------------

export async function getNews(sport: ESPNSport): Promise<unknown> {
  const sportPath = SPORT_PATHS[sport];
  return espnFetch(`${sportPath}/news`);
}

// ---------------------------------------------------------------------------
// Leaders / Season stats
// ---------------------------------------------------------------------------

export async function getLeaders(sport: ESPNSport): Promise<unknown> {
  const sportPath = SPORT_PATHS[sport];
  return espnFetch(`${sportPath}/leaders`);
}

export async function getTeamSchedule(
  sport: ESPNSport,
  teamId: string,
): Promise<unknown> {
  const sportPath = SPORT_PATHS[sport];
  return espnFetch(`${sportPath}/teams/${teamId}/schedule`);
}

// ---------------------------------------------------------------------------
// Transformation helpers — reshape ESPN responses into BSI contracts
// ---------------------------------------------------------------------------

// Division lookup tables — ESPN standings only group by league/conference,
// so we map team abbreviations to their division.
const MLB_DIVISIONS: Record<string, { league: string; division: string }> = {
  NYY: { league: 'AL', division: 'East' }, BOS: { league: 'AL', division: 'East' },
  TOR: { league: 'AL', division: 'East' }, TB: { league: 'AL', division: 'East' },
  BAL: { league: 'AL', division: 'East' },
  CLE: { league: 'AL', division: 'Central' }, MIN: { league: 'AL', division: 'Central' },
  DET: { league: 'AL', division: 'Central' }, CWS: { league: 'AL', division: 'Central' }, CHW: { league: 'AL', division: 'Central' },
  KC: { league: 'AL', division: 'Central' },
  HOU: { league: 'AL', division: 'West' }, TEX: { league: 'AL', division: 'West' },
  SEA: { league: 'AL', division: 'West' }, LAA: { league: 'AL', division: 'West' },
  OAK: { league: 'AL', division: 'West' }, ATH: { league: 'AL', division: 'West' },
  ATL: { league: 'NL', division: 'East' }, PHI: { league: 'NL', division: 'East' },
  NYM: { league: 'NL', division: 'East' }, MIA: { league: 'NL', division: 'East' },
  WSH: { league: 'NL', division: 'East' },
  CHC: { league: 'NL', division: 'Central' }, STL: { league: 'NL', division: 'Central' },
  MIL: { league: 'NL', division: 'Central' }, CIN: { league: 'NL', division: 'Central' },
  PIT: { league: 'NL', division: 'Central' },
  LAD: { league: 'NL', division: 'West' }, SD: { league: 'NL', division: 'West' },
  SF: { league: 'NL', division: 'West' }, ARI: { league: 'NL', division: 'West' },
  COL: { league: 'NL', division: 'West' },
};

const NFL_DIVISIONS: Record<string, { conference: string; division: string }> = {
  NE: { conference: 'AFC', division: 'East' }, BUF: { conference: 'AFC', division: 'East' },
  MIA: { conference: 'AFC', division: 'East' }, NYJ: { conference: 'AFC', division: 'East' },
  BAL: { conference: 'AFC', division: 'North' }, PIT: { conference: 'AFC', division: 'North' },
  CLE: { conference: 'AFC', division: 'North' }, CIN: { conference: 'AFC', division: 'North' },
  HOU: { conference: 'AFC', division: 'South' }, TEN: { conference: 'AFC', division: 'South' },
  IND: { conference: 'AFC', division: 'South' }, JAX: { conference: 'AFC', division: 'South' },
  KC: { conference: 'AFC', division: 'West' }, LAC: { conference: 'AFC', division: 'West' },
  DEN: { conference: 'AFC', division: 'West' }, LV: { conference: 'AFC', division: 'West' },
  PHI: { conference: 'NFC', division: 'East' }, DAL: { conference: 'NFC', division: 'East' },
  WSH: { conference: 'NFC', division: 'East' }, NYG: { conference: 'NFC', division: 'East' },
  DET: { conference: 'NFC', division: 'North' }, MIN: { conference: 'NFC', division: 'North' },
  GB: { conference: 'NFC', division: 'North' }, CHI: { conference: 'NFC', division: 'North' },
  ATL: { conference: 'NFC', division: 'South' }, TB: { conference: 'NFC', division: 'South' },
  NO: { conference: 'NFC', division: 'South' }, CAR: { conference: 'NFC', division: 'South' },
  SF: { conference: 'NFC', division: 'West' }, SEA: { conference: 'NFC', division: 'West' },
  LAR: { conference: 'NFC', division: 'West' }, ARI: { conference: 'NFC', division: 'West' },
};

/** Transform ESPN standings into BSI standings contract.
 *  MLB/NFL: returns flat array with league/division or conference/division fields.
 *  NBA: returns nested groups (the NBA frontend was built for that format). */
export function transformStandings(
  raw: any,
  sport: ESPNSport,
): { standings: any[]; meta: { lastUpdated: string; dataSource: string } } {
  const groups = raw?.children || [];

  if (sport === 'nba') {
    // NBA: keep nested format — the NBA frontend expects { standings: [{ name, teams }] }
    const standings: any[] = [];
    for (const group of groups) {
      const teams: any[] = [];
      for (const entry of group?.standings?.entries || []) {
        const teamData = entry?.team || {};
        const stats = entry?.stats || [];
        const stat = (name: string): any => {
          const s = stats.find((s: any) => s.name === name || s.abbreviation === name);
          return s?.displayValue ?? s?.value ?? '-';
        };
        teams.push({
          name: teamData.displayName || teamData.name || 'Unknown',
          abbreviation: teamData.abbreviation || '???',
          id: teamData.id,
          logo: teamData.logos?.[0]?.href,
          wins: Number(stat('wins')) || 0,
          losses: Number(stat('losses')) || 0,
          pct: parseFloat(stat('winPercent')) || 0,
          gb: stat('gamesBehind') || '-',
          home: stat('Home') || stat('home') || '-',
          away: stat('Road') || stat('road') || '-',
          last10: stat('Last Ten Games') || stat('L10') || '-',
          streak: stat('streak') || '-',
        });
      }
      teams.sort((a: any, b: any) => b.wins - a.wins || b.pct - a.pct);
      standings.push({ name: group.name || 'Unknown', teams });
    }
    return { standings, meta: { lastUpdated: new Date().toISOString(), dataSource: 'ESPN' } };
  }

  // MLB and NFL: return flat array with division/league fields
  const standings: any[] = [];

  for (const group of groups) {
    const leagueName = group.name || '';
    for (const entry of group?.standings?.entries || []) {
      const teamData = entry?.team || {};
      const stats = entry?.stats || [];
      const abbr = teamData.abbreviation || '???';

      const stat = (name: string): any => {
        const s = stats.find((s: any) => s.name === name || s.abbreviation === name);
        return s?.displayValue ?? s?.value ?? '-';
      };

      const wins = Number(stat('wins')) || 0;
      const losses = Number(stat('losses')) || 0;
      const total = wins + losses;
      const winPct = total > 0 ? wins / total : 0;

      if (sport === 'mlb') {
        const div = MLB_DIVISIONS[abbr] || {
          league: leagueName.includes('American') ? 'AL' : 'NL',
          division: 'Unknown',
        };
        standings.push({
          teamName: teamData.displayName || teamData.name || 'Unknown',
          abbreviation: abbr,
          id: teamData.id,
          logo: teamData.logos?.[0]?.href,
          wins,
          losses,
          winPercentage: winPct,
          gamesBack: stat('gamesBehind') === '-' ? 0 : parseFloat(stat('gamesBehind')) || 0,
          league: div.league,
          division: div.division,
          runsScored: Number(stat('pointsFor')) || 0,
          runsAllowed: Number(stat('pointsAgainst')) || 0,
          streakCode: stat('streak') || '-',
          home: stat('Home') || stat('home') || '-',
          away: stat('Road') || stat('road') || '-',
          last10: stat('Last Ten Games') || stat('L10') || '-',
        });
      } else if (sport === 'cfb') {
        // CFB — conference comes from the group name
        standings.push({
          name: teamData.displayName || teamData.name || 'Unknown',
          abbreviation: abbr,
          id: teamData.id,
          logo: teamData.logos?.[0]?.href,
          wins,
          losses,
          pct: winPct,
          pf: Number(stat('pointsFor')) || 0,
          pa: Number(stat('pointsAgainst')) || 0,
          diff: (Number(stat('pointsFor')) || 0) - (Number(stat('pointsAgainst')) || 0),
          streak: stat('streak') || '-',
          confRecord: stat('conferenceRecord') || stat('Conference') || '-',
          conference: leagueName || 'FBS',
        });
      } else {
        // NFL — collect flat, then group below
        const div = NFL_DIVISIONS[abbr] || {
          conference: leagueName.includes('American') ? 'AFC' : 'NFC',
          division: 'Unknown',
        };
        standings.push({
          name: teamData.displayName || teamData.name || 'Unknown',
          abbreviation: abbr,
          id: teamData.id,
          logo: teamData.logos?.[0]?.href,
          wins,
          losses,
          ties: Number(stat('ties')) || 0,
          pct: winPct,
          pf: Number(stat('pointsFor')) || 0,
          pa: Number(stat('pointsAgainst')) || 0,
          diff: (Number(stat('pointsFor')) || 0) - (Number(stat('pointsAgainst')) || 0),
          streak: stat('streak') || '-',
          divisionRecord: stat('divisionRecord') || stat('Division') || '-',
          confRecord: stat('conferenceRecord') || stat('Conference') || '-',
          conference: div.conference,
          division: div.division,
        });
      }
    }
  }

  // NFL: group flat teams into Conference → Division hierarchy
  if (sport === 'nfl') {
    const confMap: Record<string, Record<string, any[]>> = {};
    for (const team of standings) {
      const conf = team.conference || 'Unknown';
      const div = team.division || 'Unknown';
      const divKey = `${conf} ${div}`;
      if (!confMap[conf]) confMap[conf] = {};
      if (!confMap[conf][divKey]) confMap[conf][divKey] = [];
      confMap[conf][divKey].push(team);
    }
    const nested = ['AFC', 'NFC'].map((conf) => ({
      name: conf,
      divisions: Object.entries(confMap[conf] || {})
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([divName, teams]) => ({
          name: divName,
          teams: teams.sort((a: any, b: any) => b.wins - a.wins || b.pct - a.pct),
        })),
    }));
    return { standings: nested, meta: { lastUpdated: new Date().toISOString(), dataSource: 'ESPN' } };
  }

  // CFB: group by conference like NFL
  if (sport === 'cfb') {
    const confMap: Record<string, any[]> = {};
    for (const team of standings) {
      const conf = team.conference || 'Independent';
      if (!confMap[conf]) confMap[conf] = [];
      confMap[conf].push(team);
    }
    const nested = Object.entries(confMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([confName, teams]) => ({
        name: confName,
        teams: teams.sort((a: any, b: any) => b.wins - a.wins || b.pct - a.pct),
      }));
    return { standings: nested, meta: { lastUpdated: new Date().toISOString(), dataSource: 'ESPN' } };
  }

  return {
    standings,
    meta: { lastUpdated: new Date().toISOString(), dataSource: 'ESPN' },
  };
}

/** Transform ESPN scoreboard into BSI games contract */
export function transformScoreboard(
  raw: any,
): { games: any[]; timestamp: string; date: string; meta: { lastUpdated: string; dataSource: string } } {
  const events = raw?.events || [];
  const games = events.map((event: any) => {
    const competition = event.competitions?.[0] || {};
    const competitors = competition.competitors || [];

    return {
      id: event.id,
      name: event.name || '',
      shortName: event.shortName || '',
      date: event.date,
      status: competition.status || event.status || {},
      teams: competitors.map((c: any) => ({
        id: c.id,
        team: {
          id: c.team?.id || c.id,
          displayName: c.team?.displayName || c.team?.name || '',
          abbreviation: c.team?.abbreviation || '',
          shortDisplayName: c.team?.shortDisplayName || '',
          logo: c.team?.logo || c.team?.logos?.[0]?.href || '',
          logos: c.team?.logos || [],
          color: c.team?.color,
        },
        score: c.score,
        homeAway: c.homeAway,
        winner: c.winner,
        records: c.records,
      })),
      venue: competition.venue,
      broadcasts: competition.broadcasts,
      odds: competition.odds,
    };
  });

  return {
    games,
    timestamp: new Date().toISOString(),
    date: raw?.day?.date || new Date().toISOString().slice(0, 10),
    meta: { lastUpdated: new Date().toISOString(), dataSource: 'espn' },
  };
}

/** Transform ESPN teams list into BSI teams contract */
export function transformTeams(
  raw: any,
): { teams: any[]; meta: { lastUpdated: string; dataSource: string } } {
  const groups = raw?.sports?.[0]?.leagues?.[0]?.teams || [];
  const teams = groups.map((entry: any) => {
    const t = entry.team || entry;
    return {
      id: t.id,
      name: t.displayName || t.name || '',
      abbreviation: t.abbreviation || '',
      shortDisplayName: t.shortDisplayName || '',
      color: t.color,
      logos: t.logos || [],
      location: t.location || '',
    };
  });

  return {
    teams,
    meta: { lastUpdated: new Date().toISOString(), dataSource: 'espn' },
  };
}

/** Transform ESPN team detail + roster into BSI team contract */
export function transformTeamDetail(
  teamRaw: any,
  rosterRaw: any,
): { team: any; roster: any[]; meta: { lastUpdated: string; dataSource: string } } {
  const t = teamRaw?.team || {};
  const team = {
    id: t.id,
    name: t.displayName || t.name || '',
    abbreviation: t.abbreviation || '',
    color: t.color,
    logos: t.logos || [],
    location: t.location || '',
    record: t.record?.items?.[0]?.summary || '',
  };

  const athletes = rosterRaw?.athletes || [];
  const roster: any[] = [];

  for (const group of athletes) {
    for (const player of group.items || []) {
      roster.push({
        id: player.id,
        name: player.displayName || player.fullName || '',
        jersey: player.jersey || '',
        position: player.position?.abbreviation || group.position || '',
        height: player.displayHeight || '',
        weight: player.displayWeight || player.weight?.toString() || '',
        headshot: player.headshot?.href || '',
        age: player.age,
      });
    }
  }

  return {
    team,
    roster,
    meta: { lastUpdated: new Date().toISOString(), dataSource: 'espn' },
  };
}

/** Transform ESPN athlete into BSI player contract */
export function transformAthlete(
  raw: any,
): { player: any; meta: { lastUpdated: string; dataSource: string } } {
  const athlete = raw?.athlete || raw || {};
  return {
    player: {
      id: athlete.id,
      name: athlete.displayName || athlete.fullName || '',
      jersey: athlete.jersey || '',
      position: athlete.position?.abbreviation || '',
      height: athlete.displayHeight || '',
      weight: athlete.displayWeight || athlete.weight?.toString() || '',
      age: athlete.age,
      birthDate: athlete.dateOfBirth,
      birthPlace: athlete.birthPlace
        ? `${athlete.birthPlace.city}, ${athlete.birthPlace.state || athlete.birthPlace.country}`
        : '',
      headshot: athlete.headshot?.href || '',
      team: {
        id: athlete.team?.id,
        name: athlete.team?.displayName || '',
        abbreviation: athlete.team?.abbreviation || '',
      },
      stats: athlete.statistics || [],
    },
    meta: { lastUpdated: new Date().toISOString(), dataSource: 'espn' },
  };
}

/** Transform ESPN news into BSI news contract */
export function transformNews(
  raw: any,
): { articles: any[]; meta: { lastUpdated: string; dataSource: string } } {
  const articles = (raw?.articles || []).map((a: any) => ({
    headline: a.headline || a.title || '',
    description: a.description || '',
    link: a.links?.web?.href || a.link || '',
    published: a.published || '',
    images: a.images || [],
    categories: a.categories || [],
  }));

  return {
    articles,
    meta: { lastUpdated: new Date().toISOString(), dataSource: 'espn' },
  };
}

/** Transform ESPN game summary into BSI game contract */
export function transformGameSummary(
  raw: any,
): { game: any; meta: { lastUpdated: string; dataSource: string } } {
  const header = raw?.header || {};
  const boxscore = raw?.boxscore || {};
  const competition = header?.competitions?.[0] || {};

  return {
    game: {
      id: header.id || raw?.gameId,
      status: competition.status || {},
      competitors: competition.competitors || [],
      boxscore: boxscore,
      leaders: raw?.leaders || [],
      plays: raw?.plays || [],
      winProbability: raw?.winprobability || [],
    },
    meta: { lastUpdated: new Date().toISOString(), dataSource: 'espn' },
  };
}
