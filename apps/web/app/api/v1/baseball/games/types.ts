export type InningHalf = 'top' | 'bottom';

export interface BaseballGameTeamState {
  id: string;
  name: string;
  shortName?: string;
  abbreviation?: string;
  logo?: string;
  record?: string;
  runs: number | null;
  hits?: number | null;
  errors?: number | null;
  winProbability?: number | null;
}

export interface BaseballGameRunnersState {
  first?: boolean;
  second?: boolean;
  third?: boolean;
}

export interface BaseballGameSituation {
  inning?: number | null;
  half?: InningHalf;
  outs?: number | null;
  balls?: number | null;
  strikes?: number | null;
  pitchCount?: number | null;
  description?: string;
  runners?: BaseballGameRunnersState;
}

export interface RegressionContributor {
  id: string;
  label: string;
  delta: number;
  direction: 'home' | 'away';
  description?: string;
}

export interface WinProbabilityPoint {
  frame: string;
  home: number;
  away?: number;
}

export interface RegressionArtifact {
  homeWinProbability?: number | null;
  leverageIndex?: number | null;
  modelVersion?: string;
  winProbabilitySeries?: WinProbabilityPoint[];
  coefficientContributors?: RegressionContributor[];
}

export interface BaseballGameState {
  id: string;
  league: string;
  startTime: string;
  status: 'scheduled' | 'in_progress' | 'final' | string;
  statusText?: string;
  venue?: string;
  broadcast?: string[];
  lastUpdated?: string;
  teams: {
    home: BaseballGameTeamState;
    away: BaseballGameTeamState;
  };
  situation?: BaseballGameSituation;
  regression?: RegressionArtifact;
}

export interface BaseballGamesResponse {
  games: BaseballGameState[];
  fetchedAt: string;
  ttlSeconds: number;
  source: 'cloudflare-worker' | 'node-relay' | string;
}
