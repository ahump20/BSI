/**
 * ESPN Public API Client
 *
 * Unified client for MLB, NFL, and NBA data via ESPN's public site API.
 * No API key required. These endpoints power ESPN.com itself.
 *
 * Base: https://site.api.espn.com/apis/site/v2/sports/{category}/{league}
 */

import { EspnScoreboardSchema, EspnStandingsSchema, validateApiResponse } from './schemas';
import { transformCollegeBaseballStandings, type CollegeBaseballStandingTeam } from './espn-college-baseball';

export type ESPNSport = 'mlb' | 'nfl' | 'nba' | 'cfb' | 'college-baseball';

const SPORT_PATHS: Record<ESPNSport, string> = {
  mlb: 'baseball/mlb',
  nfl: 'football/nfl',
  nba: 'basketball/nba',
  cfb: 'football/college-football',
  'college-baseball': 'baseball/college-baseball',
};

const BASE = 'https://site.api.espn.com/apis/site/v2/sports';
const BASE_V2 = 'https://site.api.espn.com/apis/v2/sports';

interface FetchOptions {
  timeout?: number;
}

export async function espnFetch<T>(path: string, opts?: FetchOptions): Promise<T> {
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
  seasonType?: number,
): Promise<unknown> {
  const sportPath = SPORT_PATHS[sport];
  const params = new URLSearchParams();
  if (date) params.set('dates', date.replace(/-/g, ''));
  if (seasonType) params.set('seasontype', String(seasonType));
  const qs = params.toString() ? `?${params.toString()}` : '';
  const raw = await espnFetch(`${sportPath}/scoreboard${qs}`);
  return validateApiResponse(EspnScoreboardSchema, raw, 'espn', `${sport}/scoreboard`);
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
    const raw = await res.json();
    return validateApiResponse(EspnStandingsSchema, raw, 'espn', `${sport}/standings`);
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

// Interfaces for transformed standings teams
interface NbaStandingTeam {
  name: string;
  abbreviation: string;
  id: string | undefined;
  logo: string | undefined;
  wins: number;
  losses: number;
  pct: number;
  gb: string | number;
  home: string | number;
  away: string | number;
  last10: string | number;
  streak: string | number;
}

interface MlbStandingTeam {
  teamName: string;
  abbreviation: string;
  id: string | undefined;
  logo: string | undefined;
  wins: number;
  losses: number;
  winPercentage: number;
  gamesBack: number;
  league: string;
  division: string;
  runsScored: number;
  runsAllowed: number;
  streakCode: string | number;
  home: string | number;
  away: string | number;
  last10: string | number;
}

interface NflStandingTeam {
  name: string;
  abbreviation: string;
  id: string | undefined;
  logo: string | undefined;
  wins: number;
  losses: number;
  ties: number;
  pct: number;
  pf: number;
  pa: number;
  diff: number;
  streak: string | number;
  divisionRecord: string | number;
  confRecord: string | number;
  conference: string;
  division: string;
}

interface CfbStandingTeam {
  name: string;
  abbreviation: string;
  id: string | undefined;
  logo: string | undefined;
  wins: number;
  losses: number;
  pct: number;
  pf: number;
  pa: number;
  diff: number;
  streak: string | number;
  confRecord: string | number;
  conference: string;
}

type StandingTeam = NbaStandingTeam | MlbStandingTeam | NflStandingTeam | CfbStandingTeam | CollegeBaseballStandingTeam;

interface NbaStandingsGroup {
  name: string;
  teams: NbaStandingTeam[];
}

interface NflStandingsGroup {
  name: string;
  divisions: { name: string; teams: NflStandingTeam[] }[];
}

interface CfbStandingsGroup {
  name: string;
  teams: CfbStandingTeam[];
}

interface CbbStandingsGroup {
  name: string;
  teams: CollegeBaseballStandingTeam[];
}

type StandingsGroup = NbaStandingsGroup | NflStandingsGroup | CfbStandingsGroup | CbbStandingsGroup;

interface TransformedGame {
  id: string | undefined;
  name: string;
  shortName: string;
  date: string | undefined;
  status: Record<string, unknown>;
  teams: TransformedCompetitor[];
  venue: unknown;
  broadcasts: unknown;
  odds: unknown;
}

interface TransformedCompetitor {
  id: string | undefined;
  team: {
    id: string;
    displayName: string;
    abbreviation: string;
    shortDisplayName: string;
    logo: string;
    logos: unknown[];
    color: string | undefined;
  };
  score: string | undefined;
  homeAway: string | undefined;
  winner: boolean | undefined;
  records: unknown;
}

interface TransformedTeam {
  id: string | undefined;
  name: string;
  abbreviation: string;
  shortDisplayName: string;
  color: string | undefined;
  logos: unknown[];
  location: string;
}

interface TransformedTeamDetail {
  id: string | undefined;
  name: string;
  abbreviation: string;
  color: string | undefined;
  logos: unknown[];
  location: string;
  record: string;
}

interface TransformedRosterEntry {
  id: string | undefined;
  name: string;
  jersey: string;
  position: string;
  height: string;
  weight: string;
  headshot: string;
  age: number | undefined;
}

interface TransformedPlayer {
  id: string | undefined;
  name: string;
  jersey: string;
  position: string;
  height: string;
  weight: string;
  age: number | undefined;
  birthDate: string | undefined;
  birthPlace: string;
  headshot: string;
  team: {
    id: string | undefined;
    name: string;
    abbreviation: string;
  };
  stats: unknown[];
}

interface TransformedArticle {
  headline: string;
  description: string;
  link: string;
  published: string;
  images: unknown[];
  categories: unknown[];
}

interface TransformedGameSummary {
  id: string | undefined;
  status: Record<string, unknown>;
  competitors: unknown[];
  boxscore: Record<string, unknown>;
  leaders: unknown[];
  plays: unknown[];
  winProbability: unknown[];
}

interface ApiMeta {
  lastUpdated: string;
  dataSource: string;
}

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
  raw: Record<string, unknown>,
  sport: ESPNSport,
): { standings: StandingTeam[] | StandingsGroup[]; meta: ApiMeta } {
  const groups = (raw?.children || []) as Record<string, unknown>[];

  if (sport === 'nba') {
    // NBA: keep nested format — the NBA frontend expects { standings: [{ name, teams }] }
    const standings: StandingsGroup[] = [];
    for (const group of groups) {
      const teams: NbaStandingTeam[] = [];
      const standingsData = group?.standings as Record<string, unknown> | undefined;
      const entries = (standingsData?.entries || []) as Record<string, unknown>[];
      for (const entry of entries) {
        const teamData = (entry?.team || {}) as Record<string, unknown>;
        const stats = (entry?.stats || []) as Record<string, unknown>[];
        const stat = (name: string): string | number => {
          const s = stats.find((s: Record<string, unknown>) => s.name === name || s.abbreviation === name);
          return (s?.displayValue ?? s?.value ?? '-') as string | number;
        };
        const logos = teamData.logos as Record<string, unknown>[] | undefined;
        teams.push({
          name: (teamData.displayName || teamData.name || 'Unknown') as string,
          abbreviation: (teamData.abbreviation || '???') as string,
          id: teamData.id as string | undefined,
          logo: logos?.[0]?.href as string | undefined,
          wins: Number(stat('wins')) || 0,
          losses: Number(stat('losses')) || 0,
          pct: parseFloat(String(stat('winPercent'))) || 0,
          gb: stat('gamesBehind') || '-',
          home: stat('Home') || stat('home') || '-',
          away: stat('Road') || stat('road') || '-',
          last10: stat('Last Ten Games') || stat('L10') || '-',
          streak: stat('streak') || '-',
        });
      }
      teams.sort((a: NbaStandingTeam, b: NbaStandingTeam) => b.wins - a.wins || b.pct - a.pct);
      standings.push({ name: (group.name || 'Unknown') as string, teams });
    }
    return { standings, meta: { lastUpdated: new Date().toISOString(), dataSource: 'ESPN' } };
  }

  // College baseball: group by conference with conf W-L and run differential
  if (sport === 'college-baseball') {
    return transformCollegeBaseballStandings(raw);
  }

  // MLB and NFL: return flat array with division/league fields
  const standings: StandingTeam[] = [];

  for (const group of groups) {
    const leagueName = (group.name || '') as string;
    const standingsData = group?.standings as Record<string, unknown> | undefined;
    const entries = (standingsData?.entries || []) as Record<string, unknown>[];
    for (const entry of entries) {
      const teamData = (entry?.team || {}) as Record<string, unknown>;
      const stats = (entry?.stats || []) as Record<string, unknown>[];
      const abbr = (teamData.abbreviation || '???') as string;

      const stat = (name: string): string | number => {
        const s = stats.find((s: Record<string, unknown>) => s.name === name || s.abbreviation === name);
        return (s?.displayValue ?? s?.value ?? '-') as string | number;
      };

      const wins = Number(stat('wins')) || 0;
      const losses = Number(stat('losses')) || 0;
      const total = wins + losses;
      const winPct = total > 0 ? wins / total : 0;

      const teamLogos = teamData.logos as Record<string, unknown>[] | undefined;

      if (sport === 'mlb') {
        const div = MLB_DIVISIONS[abbr] || {
          league: leagueName.includes('American') ? 'AL' : 'NL',
          division: 'Unknown',
        };
        standings.push({
          teamName: (teamData.displayName || teamData.name || 'Unknown') as string,
          abbreviation: abbr,
          id: teamData.id as string | undefined,
          logo: teamLogos?.[0]?.href as string | undefined,
          wins,
          losses,
          winPercentage: winPct,
          gamesBack: stat('gamesBehind') === '-' ? 0 : parseFloat(String(stat('gamesBehind'))) || 0,
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
          name: (teamData.displayName || teamData.name || 'Unknown') as string,
          abbreviation: abbr,
          id: teamData.id as string | undefined,
          logo: teamLogos?.[0]?.href as string | undefined,
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
          name: (teamData.displayName || teamData.name || 'Unknown') as string,
          abbreviation: abbr,
          id: teamData.id as string | undefined,
          logo: teamLogos?.[0]?.href as string | undefined,
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
    const confMap: Record<string, Record<string, NflStandingTeam[]>> = {};
    for (const team of standings as NflStandingTeam[]) {
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
          teams: teams.sort((a: NflStandingTeam, b: NflStandingTeam) => b.wins - a.wins || b.pct - a.pct),
        })),
    }));
    return { standings: nested, meta: { lastUpdated: new Date().toISOString(), dataSource: 'ESPN' } };
  }

  // CFB: group by conference like NFL
  if (sport === 'cfb') {
    const confMap: Record<string, CfbStandingTeam[]> = {};
    for (const team of standings as CfbStandingTeam[]) {
      const conf = team.conference || 'Independent';
      if (!confMap[conf]) confMap[conf] = [];
      confMap[conf].push(team);
    }
    const nested = Object.entries(confMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([confName, teams]) => ({
        name: confName,
        teams: teams.sort((a: CfbStandingTeam, b: CfbStandingTeam) => b.wins - a.wins || b.pct - a.pct),
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
  raw: Record<string, unknown>,
): { games: TransformedGame[]; timestamp: string; date: string; meta: ApiMeta } {
  const events = (raw?.events || []) as Record<string, unknown>[];
  const games: TransformedGame[] = events.map((event: Record<string, unknown>) => {
    const competitions = event.competitions as Record<string, unknown>[] | undefined;
    const competition = competitions?.[0] || {};
    const competitors = ((competition as Record<string, unknown>).competitors || []) as Record<string, unknown>[];

    return {
      id: event.id as string | undefined,
      name: (event.name || '') as string,
      shortName: (event.shortName || '') as string,
      date: event.date as string | undefined,
      status: ((competition as Record<string, unknown>).status || event.status || {}) as Record<string, unknown>,
      teams: competitors.map((c: Record<string, unknown>) => {
        const cTeam = (c.team || {}) as Record<string, unknown>;
        const cTeamLogos = cTeam.logos as Record<string, unknown>[] | undefined;
        return {
          id: c.id as string | undefined,
          team: {
            id: (cTeam.id || c.id) as string,
            displayName: (cTeam.displayName || cTeam.name || '') as string,
            abbreviation: (cTeam.abbreviation || '') as string,
            shortDisplayName: (cTeam.shortDisplayName || '') as string,
            logo: (cTeam.logo || cTeamLogos?.[0]?.href || '') as string,
            logos: (cTeam.logos || []) as unknown[],
            color: cTeam.color as string | undefined,
          },
          score: c.score as string | undefined,
          homeAway: c.homeAway as string | undefined,
          winner: c.winner as boolean | undefined,
          records: c.records as unknown,
        };
      }),
      venue: (competition as Record<string, unknown>).venue as unknown,
      broadcasts: (competition as Record<string, unknown>).broadcasts as unknown,
      odds: (competition as Record<string, unknown>).odds as unknown,
    };
  });

  const day = raw?.day as Record<string, unknown> | undefined;
  return {
    games,
    timestamp: new Date().toISOString(),
    date: (day?.date || new Date().toISOString().slice(0, 10)) as string,
    meta: { lastUpdated: new Date().toISOString(), dataSource: 'espn' },
  };
}

/** Transform ESPN teams list into BSI teams contract */
export function transformTeams(
  raw: Record<string, unknown>,
): { teams: TransformedTeam[]; meta: ApiMeta } {
  const sports = raw?.sports as Record<string, unknown>[] | undefined;
  const leagues = (sports?.[0] as Record<string, unknown> | undefined)?.leagues as Record<string, unknown>[] | undefined;
  const groups = ((leagues?.[0] as Record<string, unknown> | undefined)?.teams || []) as Record<string, unknown>[];
  const teams: TransformedTeam[] = groups.map((entry: Record<string, unknown>) => {
    const t = (entry.team || entry) as Record<string, unknown>;
    return {
      id: t.id as string | undefined,
      name: (t.displayName || t.name || '') as string,
      abbreviation: (t.abbreviation || '') as string,
      shortDisplayName: (t.shortDisplayName || '') as string,
      color: t.color as string | undefined,
      logos: (t.logos || []) as unknown[],
      location: (t.location || '') as string,
    };
  });

  return {
    teams,
    meta: { lastUpdated: new Date().toISOString(), dataSource: 'espn' },
  };
}

/** Transform ESPN team detail + roster into BSI team contract */
export function transformTeamDetail(
  teamRaw: Record<string, unknown>,
  rosterRaw: Record<string, unknown>,
): { team: TransformedTeamDetail; roster: TransformedRosterEntry[]; meta: ApiMeta } {
  const t = (teamRaw?.team || {}) as Record<string, unknown>;
  const tRecord = t.record as Record<string, unknown> | undefined;
  const tRecordItems = tRecord?.items as Record<string, unknown>[] | undefined;
  const team: TransformedTeamDetail = {
    id: t.id as string | undefined,
    name: (t.displayName || t.name || '') as string,
    abbreviation: (t.abbreviation || '') as string,
    color: t.color as string | undefined,
    logos: (t.logos || []) as unknown[],
    location: (t.location || '') as string,
    record: (tRecordItems?.[0]?.summary || '') as string,
  };

  const athletes = (rosterRaw?.athletes || []) as Record<string, unknown>[];
  const roster: TransformedRosterEntry[] = [];

  for (const group of athletes) {
    const items = (group.items || []) as Record<string, unknown>[];
    for (const player of items) {
      const position = player.position as Record<string, unknown> | undefined;
      const headshot = player.headshot as Record<string, unknown> | undefined;
      roster.push({
        id: player.id as string | undefined,
        name: (player.displayName || player.fullName || '') as string,
        jersey: (player.jersey || '') as string,
        position: (position?.abbreviation || group.position || '') as string,
        height: (player.displayHeight || '') as string,
        weight: (player.displayWeight || player.weight?.toString() || '') as string,
        headshot: (headshot?.href || '') as string,
        age: player.age as number | undefined,
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
  raw: Record<string, unknown>,
): { player: TransformedPlayer; meta: ApiMeta } {
  const athlete = (raw?.athlete || raw || {}) as Record<string, unknown>;
  const position = athlete.position as Record<string, unknown> | undefined;
  const headshot = athlete.headshot as Record<string, unknown> | undefined;
  const birthPlace = athlete.birthPlace as Record<string, unknown> | undefined;
  const athleteTeam = athlete.team as Record<string, unknown> | undefined;
  return {
    player: {
      id: athlete.id as string | undefined,
      name: (athlete.displayName || athlete.fullName || '') as string,
      jersey: (athlete.jersey || '') as string,
      position: (position?.abbreviation || '') as string,
      height: (athlete.displayHeight || '') as string,
      weight: (athlete.displayWeight || athlete.weight?.toString() || '') as string,
      age: athlete.age as number | undefined,
      birthDate: athlete.dateOfBirth as string | undefined,
      birthPlace: birthPlace
        ? `${birthPlace.city}, ${birthPlace.state || birthPlace.country}`
        : '',
      headshot: (headshot?.href || '') as string,
      team: {
        id: athleteTeam?.id as string | undefined,
        name: (athleteTeam?.displayName || '') as string,
        abbreviation: (athleteTeam?.abbreviation || '') as string,
      },
      stats: (athlete.statistics || []) as unknown[],
    },
    meta: { lastUpdated: new Date().toISOString(), dataSource: 'espn' },
  };
}

/** Transform ESPN news into BSI news contract */
export function transformNews(
  raw: Record<string, unknown>,
): { articles: TransformedArticle[]; meta: ApiMeta } {
  const rawArticles = (raw?.articles || []) as Record<string, unknown>[];
  const articles: TransformedArticle[] = rawArticles.map((a: Record<string, unknown>) => {
    const links = a.links as Record<string, unknown> | undefined;
    const web = links?.web as Record<string, unknown> | undefined;
    return {
      headline: (a.headline || a.title || '') as string,
      description: (a.description || '') as string,
      link: (web?.href || a.link || '') as string,
      published: (a.published || '') as string,
      images: (a.images || []) as unknown[],
      categories: (a.categories || []) as unknown[],
    };
  });

  return {
    articles,
    meta: { lastUpdated: new Date().toISOString(), dataSource: 'espn' },
  };
}

/** Transform ESPN game summary into BSI game contract */
export function transformGameSummary(
  raw: Record<string, unknown>,
): { game: TransformedGameSummary; meta: ApiMeta } {
  const header = (raw?.header || {}) as Record<string, unknown>;
  const boxscore = (raw?.boxscore || {}) as Record<string, unknown>;
  const competitions = header?.competitions as Record<string, unknown>[] | undefined;
  const competition = (competitions?.[0] || {}) as Record<string, unknown>;

  return {
    game: {
      id: (header.id || raw?.gameId) as string | undefined,
      status: (competition.status || {}) as Record<string, unknown>,
      competitors: (competition.competitors || []) as unknown[],
      boxscore: boxscore,
      leaders: (raw?.leaders || []) as unknown[],
      plays: (raw?.plays || []) as unknown[],
      winProbability: (raw?.winprobability || []) as unknown[],
    },
    meta: { lastUpdated: new Date().toISOString(), dataSource: 'espn' },
  };
}
