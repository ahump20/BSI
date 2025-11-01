import { createCacheKey, getCachedOrHydrate } from '@/lib/cache';

export type GameStatus = 'scheduled' | 'live' | 'final';
export type HalfInning = 'Top' | 'Bottom';

type BaseRunner = '1B' | '2B' | '3B';

export interface ScoreboardTeam {
  id: string;
  sport: 'baseball';
  name: string;
  shortName: string;
  abbreviation: string;
  slug: string;
  record: string;
  rank?: number;
  conference: string;
  score: number;
  hits: number;
  errors: number;
  runsByInning: number[];
}

export interface GameSituation {
  inning: number;
  half: HalfInning;
  outs: number;
  balls: number;
  strikes: number;
  runners: BaseRunner[];
  pitchCount: number;
  winProbabilityHome: number;
}

export interface ScoreboardGame {
  id: string;
  sport: 'baseball';
  status: GameStatus;
  startTime: string;
  venue: string;
  broadcast?: string;
  note?: string;
  conference: string;
  isConferenceGame: boolean;
  isRankedMatchup: boolean;
  teams: [ScoreboardTeam, ScoreboardTeam];
  situation?: GameSituation;
}

export interface ScoreboardMetrics {
  totalGames: number;
  liveGames: number;
  rankedMatchups: number;
  conferences: number;
}

export interface ScoreboardSnapshot {
  sport: 'baseball';
  league: 'ncaa-d1';
  date: string;
  lastUpdated: string;
  games: ScoreboardGame[];
  metrics: ScoreboardMetrics;
  conferences: string[];
}

export interface ScoreboardFilters {
  date?: string;
  conference?: string;
  rankedOnly?: boolean;
}

function isoForToday(hour: number, minute: number): string {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

const BASE_GAMES: ScoreboardGame[] = [
  {
    id: 'lsu-texas-2025-03-14',
    sport: 'baseball',
    status: 'live',
    startTime: isoForToday(18, 30),
    venue: 'UFCU Disch-Falk Field — Austin, TX',
    broadcast: 'Longhorn Network',
    conference: 'Big 12',
    isConferenceGame: true,
    isRankedMatchup: true,
    teams: [
      {
        id: 'lsu',
        sport: 'baseball',
        name: 'LSU Tigers',
        shortName: 'LSU',
        abbreviation: 'LSU',
        slug: 'lsu-tigers',
        record: '21-6',
        rank: 3,
        conference: 'SEC',
        score: 4,
        hits: 7,
        errors: 0,
        runsByInning: [1, 0, 0, 1, 0, 2],
      },
      {
        id: 'texas',
        sport: 'baseball',
        name: 'Texas Longhorns',
        shortName: 'Texas',
        abbreviation: 'TEX',
        slug: 'texas-longhorns',
        record: '19-8',
        rank: 8,
        conference: 'Big 12',
        score: 3,
        hits: 6,
        errors: 1,
        runsByInning: [0, 2, 0, 0, 1, 0],
      },
    ],
    situation: {
      inning: 7,
      half: 'Top',
      outs: 1,
      balls: 2,
      strikes: 1,
      runners: ['1B', '3B'],
      pitchCount: 92,
      winProbabilityHome: 0.42,
    },
  },
  {
    id: 'wake-forest-virginia-2025-03-14',
    sport: 'baseball',
    status: 'final',
    startTime: isoForToday(17, 0),
    venue: 'David F. Couch Ballpark — Winston-Salem, NC',
    broadcast: 'ACC Network Extra',
    conference: 'ACC',
    isConferenceGame: true,
    isRankedMatchup: true,
    teams: [
      {
        id: 'wake-forest',
        sport: 'baseball',
        name: 'Wake Forest Demon Deacons',
        shortName: 'Wake Forest',
        abbreviation: 'WF',
        slug: 'wake-forest-demon-deacons',
        record: '23-4',
        rank: 1,
        conference: 'ACC',
        score: 7,
        hits: 11,
        errors: 0,
        runsByInning: [0, 2, 0, 3, 0, 0, 2, 0, 0],
      },
      {
        id: 'virginia',
        sport: 'baseball',
        name: 'Virginia Cavaliers',
        shortName: 'Virginia',
        abbreviation: 'UVA',
        slug: 'virginia-cavaliers',
        record: '20-7',
        rank: 11,
        conference: 'ACC',
        score: 2,
        hits: 5,
        errors: 2,
        runsByInning: [1, 0, 0, 0, 1, 0, 0, 0, 0],
      },
    ],
  },
  {
    id: 'coastal-carolina-south-alabama-2025-03-14',
    sport: 'baseball',
    status: 'scheduled',
    startTime: isoForToday(19, 0),
    venue: 'Stanky Field — Mobile, AL',
    broadcast: 'ESPN+',
    conference: 'Sun Belt',
    isConferenceGame: true,
    isRankedMatchup: false,
    note: 'Projected first pitch delayed 15 minutes for weather.',
    teams: [
      {
        id: 'coastal-carolina',
        sport: 'baseball',
        name: 'Coastal Carolina Chanticleers',
        shortName: 'Coastal',
        abbreviation: 'CCU',
        slug: 'coastal-carolina-chanticleers',
        record: '18-9',
        rank: 22,
        conference: 'Sun Belt',
        score: 0,
        hits: 0,
        errors: 0,
        runsByInning: [],
      },
      {
        id: 'south-alabama',
        sport: 'baseball',
        name: 'South Alabama Jaguars',
        shortName: 'South Alabama',
        abbreviation: 'USA',
        slug: 'south-alabama-jaguars',
        record: '15-11',
        conference: 'Sun Belt',
        score: 0,
        hits: 0,
        errors: 0,
        runsByInning: [],
      },
    ],
  },
  {
    id: 'oregon-state-arizona-2025-03-14',
    sport: 'baseball',
    status: 'live',
    startTime: isoForToday(21, 0),
    venue: 'Hi Corbett Field — Tucson, AZ',
    broadcast: 'Pac-12 Network',
    conference: 'Pac-12',
    isConferenceGame: true,
    isRankedMatchup: true,
    teams: [
      {
        id: 'oregon-state',
        sport: 'baseball',
        name: 'Oregon State Beavers',
        shortName: 'Oregon St.',
        abbreviation: 'OSU',
        slug: 'oregon-state-beavers',
        record: '20-5',
        rank: 5,
        conference: 'Pac-12',
        score: 6,
        hits: 8,
        errors: 0,
        runsByInning: [0, 1, 0, 2, 0, 3],
      },
      {
        id: 'arizona',
        sport: 'baseball',
        name: 'Arizona Wildcats',
        shortName: 'Arizona',
        abbreviation: 'AZ',
        slug: 'arizona-wildcats',
        record: '17-8',
        rank: 17,
        conference: 'Pac-12',
        score: 2,
        hits: 4,
        errors: 1,
        runsByInning: [0, 0, 1, 0, 1, 0],
      },
    ],
    situation: {
      inning: 6,
      half: 'Bottom',
      outs: 2,
      balls: 3,
      strikes: 2,
      runners: ['2B'],
      pitchCount: 78,
      winProbabilityHome: 0.28,
    },
  },
];

async function hydrateScoreboard(date: string): Promise<ScoreboardSnapshot> {
  const games = BASE_GAMES.map((game) => ({ ...game })).sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );

  const conferences = Array.from(new Set(games.map((game) => game.conference))).sort();

  return {
    sport: 'baseball',
    league: 'ncaa-d1',
    date,
    lastUpdated: new Date().toISOString(),
    games,
    conferences,
    metrics: {
      totalGames: games.length,
      liveGames: games.filter((game) => game.status === 'live').length,
      rankedMatchups: games.filter((game) => game.isRankedMatchup || game.teams.some((team) => team.rank)).length,
      conferences: conferences.length,
    },
  };
}

export async function getNcaabScoreboard(filters: ScoreboardFilters = {}): Promise<ScoreboardSnapshot> {
  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const targetDate = filters.date ?? formatter.format(new Date());
  const cacheKey = createCacheKey('scoreboard:ncaa-baseball', { date: targetDate });
  const base = await getCachedOrHydrate(cacheKey, 60, () => hydrateScoreboard(targetDate));

  const rankedOnly = filters.rankedOnly ?? false;
  const conference = filters.conference;

  const filteredGames = base.games.filter((game) => {
    if (conference && game.conference.toLowerCase() !== conference.toLowerCase()) {
      return false;
    }
    if (rankedOnly && !(game.isRankedMatchup || game.teams.some((team) => team.rank))) {
      return false;
    }
    return true;
  });

  return {
    ...base,
    games: filteredGames,
    metrics: {
      totalGames: filteredGames.length,
      liveGames: filteredGames.filter((game) => game.status === 'live').length,
      rankedMatchups: filteredGames.filter((game) => game.isRankedMatchup || game.teams.some((team) => team.rank)).length,
      conferences: base.metrics.conferences,
    },
  };
}
