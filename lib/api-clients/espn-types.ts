/**
 * BSI shared output types
 *
 * These types define the normalized shapes that all data-source adapters
 * (ESPN, SportsDataIO, Highlightly) transform into. The UI layer consumes
 * only these types — never raw API responses.
 */

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

export interface BSIMeta {
  lastUpdated: string;
  dataSource: string;
}

// ---------------------------------------------------------------------------
// Scoreboard
// ---------------------------------------------------------------------------

export interface BSIScoreboardResult {
  games: BSIGame[];
  timestamp: string;
  date: string;
  meta: BSIMeta;
}

export interface BSIGame {
  id: string | undefined;
  name: string;
  shortName: string;
  date: string | undefined;
  status: {
    type: {
      name: string;
      state: string;
      completed: boolean;
      detail?: string;
    };
  };
  teams: BSIGameTeam[];
  venue: string | undefined;
  broadcasts: { names: string[] }[] | undefined;
  odds: { details: string; overUnder?: number }[] | undefined;
}

export interface BSIGameTeam {
  id: string | undefined;
  team: {
    id: string | undefined;
    displayName: string;
    abbreviation: string;
    shortDisplayName: string;
    logo: string;
    logos: { href: string }[];
    color: string | undefined;
  };
  score: string | undefined;
  homeAway: 'home' | 'away' | undefined;
  winner: boolean | undefined;
  records: unknown | undefined;
}

// ---------------------------------------------------------------------------
// Standings
// ---------------------------------------------------------------------------

export interface BSIStandingsResult {
  standings: unknown;
  meta: BSIMeta;
}

export interface BSIMLBStandingsTeam {
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
  streakCode: string;
  home: string;
  away: string;
  last10: string;
}

export interface BSINFLStandingsTeam {
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
  streak: string;
  divisionRecord: string;
  confRecord: string;
  conference: string;
  division: string;
}

export interface BSINBAStandingsTeam {
  name: string;
  abbreviation: string;
  id: string | undefined;
  logo: string | undefined;
  wins: number;
  losses: number;
  pct: number;
  gb: string;
  home: string;
  away: string;
  last10: string;
  streak: string;
}

export interface BSICFBStandingsTeam {
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
  streak: string;
  confRecord: string;
  conference: string;
}

export interface BSIStandingsGroup<T = unknown> {
  name: string;
  divisions?: { name: string; teams: T[] }[];
  teams?: T[];
}

// ---------------------------------------------------------------------------
// Teams
// ---------------------------------------------------------------------------

export interface BSITeamsResult {
  teams: BSITeam[];
  meta: BSIMeta;
}

export interface BSITeam {
  id: string | undefined;
  name: string;
  abbreviation: string;
  shortDisplayName: string;
  color: string | undefined;
  logos: { href: string }[];
  location: string;
}

// ---------------------------------------------------------------------------
// Roster / Player
// ---------------------------------------------------------------------------

export interface BSIRosterPlayer {
  id: string | undefined;
  name: string;
  jersey: string;
  position: string;
  height: string;
  weight: string;
  headshot: string;
  age: string | undefined;
}

export interface BSIPlayerResult {
  player: {
    id: string | undefined;
    name: string;
    jersey: string;
    position: string;
    height: string;
    weight: string;
    age: string | undefined;
    birthDate: string | undefined;
    birthPlace: string;
    headshot: string;
    team: {
      id: string | undefined;
      name: string;
      abbreviation: string;
    };
    stats: unknown[];
  };
  meta: BSIMeta;
}

// ---------------------------------------------------------------------------
// News
// ---------------------------------------------------------------------------

export interface BSINewsResult {
  articles: BSIArticle[];
  meta: BSIMeta;
}

export interface BSIArticle {
  headline: string;
  description: string;
  link: string;
  published: string;
  images: { url?: string; caption?: string }[];
  categories: { description: string }[];
}

// ---------------------------------------------------------------------------
// Game Summary
// ---------------------------------------------------------------------------

export interface BSIGameSummaryResult {
  game: {
    id: string | undefined;
    status: {
      type: {
        name: string;
        state: string;
        completed: boolean;
      };
    };
    competitors: {
      homeAway: 'home' | 'away';
      team: { abbreviation: string | undefined };
      score: string | undefined;
    }[];
    boxscore: {
      innings: unknown[];
      players: unknown[];
    };
    leaders: unknown[];
    plays: unknown[];
    winProbability: unknown[];
  };
  meta: BSIMeta;
}
