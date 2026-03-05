/**
 * SportsDataIO API Client
 *
 * Primary data source for MLB, NFL, NBA, CFB, and CBB.
 * Auth: Ocp-Apim-Subscription-Key header.
 * Base: https://api.sportsdata.io/v3/{sport}/scores/json/{endpoint}
 */

import type {
  SDIOSport,
  SDIOMLBGame,
  SDIOMLBStanding,
  SDIOMLBTeam,
  SDIOMLBPlayer,
  SDIOMLBBoxScore,
  SDIOMLBNews,
  SDIONFLGame,
  SDIONFLStanding,
  SDIONFLTeam,
  SDIONFLPlayer,
  SDIONFLBoxScore,
  SDIONFLNews,
  SDIONBAGame,
  SDIONBAStanding,
  SDIONBATeam,
  SDIONBAPlayer,
  SDIONBABoxScore,
  SDIONBANews,
  SDIOCFBGame,
  SDIOCFBStanding,
  SDIOCFBTeam,
  SDIOCFBConference,
  SDIOCBBGame,
  SDIOCBBStanding,
  SDIOCBBTeam,
} from './sportsdataio-types';
import { SDIO_SPORT_PATHS } from './sportsdataio-types';
import type {
  BSIMeta,
  BSIScoreboardResult,
  BSIGame,
  BSIGameTeam,
  BSIStandingsResult,
  BSIMLBStandingsTeam,
  BSINFLStandingsTeam,
  BSINBAStandingsTeam,
  BSICFBStandingsTeam,
  BSIStandingsGroup,
  BSITeamsResult,
  BSITeam,
  BSIRosterPlayer,
  BSIPlayerResult,
  BSINewsResult,
  BSIArticle,
  BSIGameSummaryResult,
} from './espn-types';

export type { SDIOSport } from './sportsdataio-types';

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

const BASE = 'https://api.sportsdata.io/v3';
const TIMEOUT_MS = 10_000;

export class SportsDataIOError extends Error {
  constructor(
    message: string,
    public status: number,
    public sport: string,
    public endpoint: string,
  ) {
    super(message);
    this.name = 'SportsDataIOError';
  }
}

export class SportsDataIOClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async fetch<T>(sport: SDIOSport, endpoint: string): Promise<T> {
    const sportPath = SDIO_SPORT_PATHS[sport];
    const url = `${BASE}/${sportPath}/scores/json/${endpoint}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        headers: {
          'Ocp-Apim-Subscription-Key': this.apiKey,
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new SportsDataIOError(
          `SDIO ${res.status}: ${res.statusText}`,
          res.status,
          sport,
          endpoint,
        );
      }

      return (await res.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  }

  // -------------------------------------------------------------------------
  // MLB
  // -------------------------------------------------------------------------

  async getMLBScores(date?: string): Promise<SDIOMLBGame[]> {
    const d = date || todayString();
    return this.fetch<SDIOMLBGame[]>('mlb', `GamesByDate/${d}`);
  }

  async getMLBStandings(season?: number): Promise<SDIOMLBStanding[]> {
    const s = season || currentYear();
    return this.fetch<SDIOMLBStanding[]>('mlb', `Standings/${s}`);
  }

  async getMLBTeams(): Promise<SDIOMLBTeam[]> {
    return this.fetch<SDIOMLBTeam[]>('mlb', 'teams');
  }

  async getMLBPlayers(teamKey: string): Promise<SDIOMLBPlayer[]> {
    return this.fetch<SDIOMLBPlayer[]>('mlb', `Players/${teamKey}`);
  }

  async getMLBBoxScore(gameId: number): Promise<SDIOMLBBoxScore> {
    return this.fetch<SDIOMLBBoxScore>('mlb', `BoxScore/${gameId}`);
  }

  async getMLBNews(): Promise<SDIOMLBNews[]> {
    return this.fetch<SDIOMLBNews[]>('mlb', 'News');
  }

  // -------------------------------------------------------------------------
  // NFL
  // -------------------------------------------------------------------------

  async getNFLScores(season?: number, week?: number): Promise<SDIONFLGame[]> {
    const s = season || currentYear();
    const w = week || 1;
    return this.fetch<SDIONFLGame[]>('nfl', `ScoresByWeek/${s}/${w}`);
  }

  async getNFLScoresByDate(date?: string): Promise<SDIONFLGame[]> {
    const d = date || todayString();
    return this.fetch<SDIONFLGame[]>('nfl', `ScoresByDate/${d}`);
  }

  async getNFLStandings(season?: number): Promise<SDIONFLStanding[]> {
    const s = season || currentYear();
    return this.fetch<SDIONFLStanding[]>('nfl', `Standings/${s}`);
  }

  async getNFLTeams(): Promise<SDIONFLTeam[]> {
    return this.fetch<SDIONFLTeam[]>('nfl', 'Teams');
  }

  async getNFLPlayers(teamKey: string): Promise<SDIONFLPlayer[]> {
    return this.fetch<SDIONFLPlayer[]>('nfl', `Players/${teamKey}`);
  }

  async getNFLBoxScore(
    season: number,
    week: number,
    homeTeam: string,
  ): Promise<SDIONFLBoxScore> {
    return this.fetch<SDIONFLBoxScore>(
      'nfl',
      `BoxScore/${season}/${week}/${homeTeam}`,
    );
  }

  async getNFLNews(): Promise<SDIONFLNews[]> {
    return this.fetch<SDIONFLNews[]>('nfl', 'News');
  }

  // -------------------------------------------------------------------------
  // NBA
  // -------------------------------------------------------------------------

  async getNBAScores(date?: string): Promise<SDIONBAGame[]> {
    const d = date || todayString();
    return this.fetch<SDIONBAGame[]>('nba', `GamesByDate/${d}`);
  }

  async getNBAStandings(season?: number): Promise<SDIONBAStanding[]> {
    const s = season || currentYear();
    return this.fetch<SDIONBAStanding[]>('nba', `Standings/${s}`);
  }

  async getNBATeams(): Promise<SDIONBATeam[]> {
    return this.fetch<SDIONBAGame[]>('nba', 'teams') as Promise<SDIONBATeam[]>;
  }

  async getNBAPlayers(teamKey: string): Promise<SDIONBAPlayer[]> {
    return this.fetch<SDIONBAPlayer[]>('nba', `Players/${teamKey}`);
  }

  async getNBABoxScore(gameId: number): Promise<SDIONBABoxScore> {
    return this.fetch<SDIONBABoxScore>('nba', `BoxScore/${gameId}`);
  }

  async getNBANews(): Promise<SDIONBANews[]> {
    return this.fetch<SDIONBANews[]>('nba', 'News');
  }

  // -------------------------------------------------------------------------
  // CFB
  // -------------------------------------------------------------------------

  async getCFBScores(
    season?: number,
    week?: number,
  ): Promise<SDIOCFBGame[]> {
    const s = season || currentYear();
    const w = week || 1;
    return this.fetch<SDIOCFBGame[]>('cfb', `GamesByWeek/${s}/${w}`);
  }

  async getCFBStandings(season?: number): Promise<SDIOCFBStanding[]> {
    const s = season || currentYear();
    return this.fetch<SDIOCFBStanding[]>('cfb', `Standings/${s}`);
  }

  async getCFBTeams(): Promise<SDIOCFBTeam[]> {
    return this.fetch<SDIOCFBTeam[]>('cfb', 'Teams');
  }

  async getCFBConferences(): Promise<SDIOCFBConference[]> {
    return this.fetch<SDIOCFBConference[]>('cfb', 'LeagueHierarchy');
  }

  // -------------------------------------------------------------------------
  // CBB
  // -------------------------------------------------------------------------

  async getCBBScores(date?: string): Promise<SDIOCBBGame[]> {
    const d = date || todayString();
    return this.fetch<SDIOCBBGame[]>('cbb', `GamesByDate/${d}`);
  }

  async getCBBStandings(season?: number): Promise<SDIOCBBStanding[]> {
    const s = season || currentYear();
    return this.fetch<SDIOCBBStanding[]>('cbb', `Standings/${s}`);
  }

  async getCBBTeams(): Promise<SDIOCBBTeam[]> {
    return this.fetch<SDIOCBBTeam[]>('cbb', 'Teams');
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function todayString(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function currentYear(): number {
  return new Date().getFullYear();
}

function makeMeta(source = 'sportsdataio'): BSIMeta {
  return { lastUpdated: new Date().toISOString(), dataSource: source };
}

// ---------------------------------------------------------------------------
// Transformers — SDIO raw → BSI output types
// ---------------------------------------------------------------------------

/** Transform SDIO MLB games into BSI scoreboard */
export function transformSDIOMLBScores(
  games: SDIOMLBGame[],
): BSIScoreboardResult {
  const bsiGames: BSIGame[] = games.map((g) => ({
    id: g.GameID?.toString(),
    name: `${g.AwayTeam} @ ${g.HomeTeam}`,
    shortName: `${g.AwayTeam} @ ${g.HomeTeam}`,
    date: g.DateTime || g.Day,
    status: {
      type: {
        name: mapSDIOStatus(g.Status),
        state: mapSDIOState(g.Status),
        completed: g.IsClosed ?? false,
        detail: g.InningHalf
          ? `${g.InningHalf} ${g.Inning}`
          : g.Status || '',
      },
    },
    teams: [
      sdioTeamEntry(g.AwayTeam, g.AwayTeamID, g.AwayTeamRuns, 'away'),
      sdioTeamEntry(g.HomeTeam, g.HomeTeamID, g.HomeTeamRuns, 'home'),
    ],
    venue: undefined,
    broadcasts: g.Channel
      ? [{ names: [g.Channel] }]
      : undefined,
    odds: g.PointSpread != null
      ? [{ details: `Spread: ${g.PointSpread}`, overUnder: g.OverUnder }]
      : undefined,
  }));

  return {
    games: bsiGames,
    timestamp: new Date().toISOString(),
    date: todayString(),
    meta: makeMeta(),
  };
}

/** Transform SDIO MLB standings into BSI standings */
export function transformSDIOMLBStandings(
  standings: SDIOMLBStanding[],
): BSIStandingsResult {
  const teams: BSIMLBStandingsTeam[] = standings.map((s) => ({
    teamName: `${s.City} ${s.Name}`,
    abbreviation: s.Key || '???',
    id: s.TeamID?.toString(),
    logo: undefined,
    wins: s.Wins || 0,
    losses: s.Losses || 0,
    winPercentage: s.Percentage || 0,
    gamesBack: s.GamesBack || 0,
    league: s.League || '',
    division: s.Division || '',
    runsScored: s.RunsScored || 0,
    runsAllowed: s.RunsAgainst || 0,
    streakCode: s.Streak || '-',
    home: s.HomeWins != null ? `${s.HomeWins}-${s.HomeLosses}` : '-',
    away: s.AwayWins != null ? `${s.AwayWins}-${s.AwayLosses}` : '-',
    last10: s.LastTenGamesWins != null
      ? `${s.LastTenGamesWins}-${s.LastTenGamesLosses}`
      : '-',
  }));

  return { standings: teams, meta: makeMeta() };
}

/** Transform SDIO NFL standings into BSI standings */
export function transformSDIONFLStandings(
  standings: SDIONFLStanding[],
): BSIStandingsResult {
  const teams: BSINFLStandingsTeam[] = standings.map((s) => ({
    name: `${s.City} ${s.Name}`,
    abbreviation: s.Key || '???',
    id: s.TeamID?.toString(),
    logo: undefined,
    wins: s.Wins || 0,
    losses: s.Losses || 0,
    ties: s.Ties || 0,
    pct: s.Percentage || 0,
    pf: s.PointsFor || 0,
    pa: s.PointsAgainst || 0,
    diff: s.NetPoints || 0,
    streak: s.StreakDescription || '-',
    divisionRecord: s.DivisionWins != null
      ? `${s.DivisionWins}-${s.DivisionLosses}`
      : '-',
    confRecord: s.ConferenceWins != null
      ? `${s.ConferenceWins}-${s.ConferenceLosses}`
      : '-',
    conference: s.Conference || '',
    division: s.Division || '',
  }));

  // Group into conference -> division hierarchy
  const confMap: Record<string, Record<string, BSINFLStandingsTeam[]>> = {};
  for (const team of teams) {
    const conf = team.conference || 'Unknown';
    const divKey = `${conf} ${team.division || 'Unknown'}`;
    if (!confMap[conf]) confMap[conf] = {};
    if (!confMap[conf][divKey]) confMap[conf][divKey] = [];
    confMap[conf][divKey].push(team);
  }

  const nested: BSIStandingsGroup<BSINFLStandingsTeam>[] = ['AFC', 'NFC'].map(
    (conf) => ({
      name: conf,
      divisions: Object.entries(confMap[conf] || {})
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([divName, divTeams]) => ({
          name: divName,
          teams: divTeams.sort((a, b) => b.wins - a.wins || b.pct - a.pct),
        })),
    }),
  );

  return { standings: nested, meta: makeMeta() };
}

/** Transform SDIO NBA standings into BSI standings */
export function transformSDIONBAStandings(
  standings: SDIONBAStanding[],
): BSIStandingsResult {
  const confMap: Record<string, BSINBAStandingsTeam[]> = {};

  for (const s of standings) {
    const conf = s.Conference || 'Unknown';
    if (!confMap[conf]) confMap[conf] = [];
    confMap[conf].push({
      name: `${s.City} ${s.Name}`,
      abbreviation: s.Key || '???',
      id: s.TeamID?.toString(),
      logo: undefined,
      wins: s.Wins || 0,
      losses: s.Losses || 0,
      pct: s.Percentage || 0,
      gb: s.GamesBack != null ? String(s.GamesBack) : '-',
      home: s.HomeWins != null ? `${s.HomeWins}-${s.HomeLosses}` : '-',
      away: s.AwayWins != null ? `${s.AwayWins}-${s.AwayLosses}` : '-',
      last10: s.LastTenWins != null
        ? `${s.LastTenWins}-${s.LastTenLosses}`
        : '-',
      streak: s.StreakDescription || '-',
    });
  }

  const groups: BSIStandingsGroup<BSINBAStandingsTeam>[] = Object.entries(
    confMap,
  ).map(([name, teams]) => ({
    name,
    teams: teams.sort((a, b) => b.wins - a.wins || b.pct - a.pct),
  }));

  return { standings: groups, meta: makeMeta() };
}

/** Transform SDIO NBA games into BSI scoreboard */
export function transformSDIONBAScores(
  games: SDIONBAGame[],
): BSIScoreboardResult {
  const bsiGames: BSIGame[] = games.map((g) => ({
    id: g.GameID?.toString(),
    name: `${g.AwayTeam} @ ${g.HomeTeam}`,
    shortName: `${g.AwayTeam} @ ${g.HomeTeam}`,
    date: g.DateTime || g.Day,
    status: {
      type: {
        name: mapSDIOStatus(g.Status),
        state: mapSDIOState(g.Status),
        completed: g.IsClosed ?? false,
        detail: g.Quarter || g.Status || '',
      },
    },
    teams: [
      sdioTeamEntry(g.AwayTeam, g.AwayTeamID, g.AwayTeamScore, 'away'),
      sdioTeamEntry(g.HomeTeam, g.HomeTeamID, g.HomeTeamScore, 'home'),
    ],
    venue: undefined,
    broadcasts: g.Channel ? [{ names: [g.Channel] }] : undefined,
    odds: g.PointSpread != null
      ? [{ details: `Spread: ${g.PointSpread}`, overUnder: g.OverUnder }]
      : undefined,
  }));

  return {
    games: bsiGames,
    timestamp: new Date().toISOString(),
    date: todayString(),
    meta: makeMeta(),
  };
}

/** Transform SDIO NFL games into BSI scoreboard */
export function transformSDIONFLScores(
  games: SDIONFLGame[],
): BSIScoreboardResult {
  const bsiGames: BSIGame[] = games.map((g) => ({
    id: g.GameID?.toString(),
    name: `${g.AwayTeam} @ ${g.HomeTeam}`,
    shortName: `${g.AwayTeam} @ ${g.HomeTeam}`,
    date: g.DateTime || g.Day,
    status: {
      type: {
        name: mapSDIOStatus(g.Status),
        state: mapSDIOState(g.Status),
        completed: g.IsClosed ?? false,
        detail: g.Quarter
          ? `${g.Quarter} ${g.TimeRemaining || ''}`
          : g.Status || '',
      },
    },
    teams: [
      sdioTeamEntry(g.AwayTeam, g.AwayTeamID, g.AwayScore, 'away'),
      sdioTeamEntry(g.HomeTeam, g.HomeTeamID, g.HomeScore, 'home'),
    ],
    venue: undefined,
    broadcasts: g.Channel ? [{ names: [g.Channel] }] : undefined,
    odds: g.PointSpread != null
      ? [{ details: `Spread: ${g.PointSpread}`, overUnder: g.OverUnder }]
      : undefined,
  }));

  return {
    games: bsiGames,
    timestamp: new Date().toISOString(),
    date: todayString(),
    meta: makeMeta(),
  };
}

/** Transform SDIO CFB standings into BSI standings */
export function transformSDIOCFBStandings(
  standings: SDIOCFBStanding[],
): BSIStandingsResult {
  const confMap: Record<string, BSICFBStandingsTeam[]> = {};

  for (const s of standings) {
    const conf = s.Conference || 'Independent';
    if (!confMap[conf]) confMap[conf] = [];
    confMap[conf].push({
      name: `${s.Name}`,
      abbreviation: s.Key || '???',
      id: s.TeamID?.toString(),
      logo: undefined,
      wins: s.Wins || 0,
      losses: s.Losses || 0,
      pct: s.Percentage || 0,
      pf: s.PointsFor || 0,
      pa: s.PointsAgainst || 0,
      diff: (s.PointsFor || 0) - (s.PointsAgainst || 0),
      streak: '-',
      confRecord: s.ConferenceWins != null
        ? `${s.ConferenceWins}-${s.ConferenceLosses}`
        : '-',
      conference: conf,
    });
  }

  const nested = Object.entries(confMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([confName, teams]) => ({
      name: confName,
      teams: teams.sort((a, b) => b.wins - a.wins || b.pct - a.pct),
    }));

  return { standings: nested, meta: makeMeta() };
}

/** Transform SDIO CFB games into BSI scoreboard */
export function transformSDIOCFBScores(
  games: SDIOCFBGame[],
): BSIScoreboardResult {
  const bsiGames: BSIGame[] = games.map((g) => ({
    id: g.GameID?.toString(),
    name: g.Title || `${g.AwayTeam} @ ${g.HomeTeam}`,
    shortName: `${g.AwayTeam} @ ${g.HomeTeam}`,
    date: g.DateTime || g.Day,
    status: {
      type: {
        name: mapSDIOStatus(g.Status),
        state: mapSDIOState(g.Status),
        completed: g.IsClosed ?? false,
        detail: g.Period || g.Status || '',
      },
    },
    teams: [
      sdioTeamEntry(g.AwayTeam, g.AwayTeamID, g.AwayTeamScore, 'away'),
      sdioTeamEntry(g.HomeTeam, g.HomeTeamID, g.HomeTeamScore, 'home'),
    ],
    venue: undefined,
    broadcasts: undefined,
    odds: undefined,
  }));

  return {
    games: bsiGames,
    timestamp: new Date().toISOString(),
    date: todayString(),
    meta: makeMeta(),
  };
}

/** Transform SDIO teams (any sport) into BSI teams */
export function transformSDIOTeams(
  teams: Array<{
    TeamID?: number;
    Key?: string;
    Name?: string;
    City?: string;
    School?: string;
    FullName?: string;
    PrimaryColor?: string;
    WikipediaLogoUrl?: string;
    TeamLogoUrl?: string;
    ShortDisplayName?: string;
  }>,
): BSITeamsResult {
  const bsiTeams: BSITeam[] = teams.map((t) => ({
    id: t.TeamID?.toString(),
    name: t.FullName || (t.City ? `${t.City} ${t.Name}` : t.School || t.Name || ''),
    abbreviation: t.Key || '',
    shortDisplayName: t.ShortDisplayName || t.Name || '',
    color: t.PrimaryColor,
    logos: t.WikipediaLogoUrl
      ? [{ href: t.WikipediaLogoUrl }]
      : t.TeamLogoUrl
        ? [{ href: t.TeamLogoUrl }]
        : [],
    location: t.City || t.School || '',
  }));

  return { teams: bsiTeams, meta: makeMeta() };
}

/** Transform SDIO news (any sport) into BSI news */
export function transformSDIONews(
  news: Array<{
    NewsID?: number;
    Title?: string;
    Content?: string;
    Url?: string;
    Updated?: string;
    OriginalSource?: string;
  }>,
): BSINewsResult {
  const articles: BSIArticle[] = news.map((n) => ({
    headline: n.Title || '',
    description: n.Content?.slice(0, 300) || '',
    link: n.Url || '',
    published: n.Updated || '',
    images: [],
    categories: n.OriginalSource
      ? [{ description: n.OriginalSource }]
      : [],
  }));

  return { articles, meta: makeMeta() };
}

/** Transform SDIO MLB box score into BSI game summary */
export function transformSDIOMLBBoxScore(
  box: SDIOMLBBoxScore,
): BSIGameSummaryResult {
  const game = box.Game;
  return {
    game: {
      id: game?.GameID?.toString(),
      status: {
        type: {
          name: mapSDIOStatus(game?.Status),
          state: mapSDIOState(game?.Status),
          completed: game?.IsClosed ?? false,
        },
      },
      competitors: (box.TeamGames || []).map((tg) => ({
        homeAway: tg.HomeOrAway === 'HOME' ? 'home' : 'away',
        team: { abbreviation: tg.Team },
        score: tg.Runs?.toString(),
      })),
      boxscore: {
        innings: box.Innings || [],
        players: box.PlayerGames || [],
      },
      leaders: [],
      plays: [],
      winProbability: [],
    },
    meta: makeMeta(),
  };
}

/** Transform SDIO players into BSI roster */
export function transformSDIOPlayers(
  players: Array<{
    PlayerID?: number;
    FirstName?: string;
    LastName?: string;
    Jersey?: number;
    Number?: number;
    Position?: string;
    Height?: number | string;
    Weight?: number;
    PhotoUrl?: string;
    BirthDate?: string;
    Team?: string;
  }>,
): BSIRosterPlayer[] {
  return players.map((p) => ({
    id: p.PlayerID?.toString(),
    name: `${p.FirstName || ''} ${p.LastName || ''}`.trim(),
    jersey: (p.Jersey ?? p.Number ?? '').toString(),
    position: p.Position || '',
    height: typeof p.Height === 'number'
      ? `${Math.floor(p.Height / 12)}'${p.Height % 12}"`
      : (p.Height || ''),
    weight: p.Weight?.toString() || '',
    headshot: p.PhotoUrl || '',
    age: undefined,
  }));
}

/** Transform a single SDIO player into BSI player result */
export function transformSDIOPlayer(
  player: {
    PlayerID?: number;
    FirstName?: string;
    LastName?: string;
    Jersey?: number;
    Number?: number;
    Position?: string;
    Height?: number | string;
    Weight?: number;
    PhotoUrl?: string;
    BirthDate?: string;
    BirthCity?: string;
    BirthState?: string;
    BirthCountry?: string;
    Team?: string;
    TeamID?: number;
  },
): BSIPlayerResult {
  const birthParts = [player.BirthCity, player.BirthState || player.BirthCountry]
    .filter(Boolean);

  return {
    player: {
      id: player.PlayerID?.toString(),
      name: `${player.FirstName || ''} ${player.LastName || ''}`.trim(),
      jersey: (player.Jersey ?? player.Number ?? '').toString(),
      position: player.Position || '',
      height: typeof player.Height === 'number'
        ? `${Math.floor(player.Height / 12)}'${player.Height % 12}"`
        : (player.Height || ''),
      weight: player.Weight?.toString() || '',
      age: undefined,
      birthDate: player.BirthDate,
      birthPlace: birthParts.join(', '),
      headshot: player.PhotoUrl || '',
      team: {
        id: player.TeamID?.toString(),
        name: player.Team || '',
        abbreviation: player.Team || '',
      },
      stats: [],
    },
    meta: makeMeta(),
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function sdioTeamEntry(
  abbr?: string,
  teamId?: number,
  score?: number,
  homeAway?: 'home' | 'away',
): BSIGameTeam {
  return {
    id: teamId?.toString(),
    team: {
      id: teamId?.toString(),
      displayName: abbr || '',
      abbreviation: abbr || '',
      shortDisplayName: abbr || '',
      logo: '',
      logos: [],
      color: undefined,
    },
    score: score?.toString(),
    homeAway,
    winner: undefined,
    records: undefined,
  };
}

function mapSDIOStatus(status?: string): string {
  if (!status) return 'Unknown';
  const s = status.toLowerCase();
  if (s === 'final' || s === 'f' || s === 'f/ot') return 'Final';
  if (s === 'inprogress' || s === 'in progress') return 'In Progress';
  if (s === 'scheduled') return 'Scheduled';
  if (s === 'postponed') return 'Postponed';
  if (s === 'canceled' || s === 'cancelled') return 'Canceled';
  if (s === 'suspended') return 'Suspended';
  return status;
}

function mapSDIOState(status?: string): string {
  if (!status) return 'pre';
  const s = status.toLowerCase();
  if (s === 'final' || s === 'f' || s === 'f/ot') return 'post';
  if (s === 'inprogress' || s === 'in progress') return 'in';
  return 'pre';
}
