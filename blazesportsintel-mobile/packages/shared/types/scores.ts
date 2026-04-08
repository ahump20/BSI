export type GameStatus = 'live' | 'final' | 'upcoming';

export interface TeamScore {
  id: string;
  name: string;
  abbreviation: string;
  score: number;
  record?: string | null;
}

export interface Game {
  id: string;
  sport: string;
  status: GameStatus;
  startTime: string;
  period?: string | null;
  clock?: string | null;
  homeTeam: TeamScore;
  awayTeam: TeamScore;
  sourceUpdatedAt?: string | null;
  raw?: unknown;
}

export interface Score {
  gameId: string;
  sport: string;
  status: GameStatus;
  startTime: string;
  homeTeam: TeamScore;
  awayTeam: TeamScore;
  periodLabel?: string | null;
  sourceUpdatedAt?: string | null;
  raw?: unknown;
}

export interface Standing {
  teamId: string;
  teamName: string;
  wins: number;
  losses: number;
  conference?: string | null;
  raw?: unknown;
}
