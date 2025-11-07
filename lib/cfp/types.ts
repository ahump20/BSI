export interface CFPTeamRanking {
  rank: number;
  team: string;
  record: string;
  conference: string;
  powerRating: number;
  resumeScore: number;
  playoffProbability: number;
  projectedSeed: number;
  sosRank: number;
  lastWeek: number;
  trend: 'up' | 'down' | 'steady';
  qualityWins: string[];
  stability: number;
}

export interface CFPBaselineTeamProjection {
  team: string;
  playoffOdds: number;
  avgSeed: number;
  topTwoOdds: number;
  medianSeed: number;
}

export interface CFPModelBaseline {
  iterations: number;
  projectedField: Array<{ team: string; seed: number }>;
  bubbleTeams: string[];
  teams: CFPBaselineTeamProjection[];
  notes: string[];
}

export interface CFPTop25Response {
  season: number;
  poll: string;
  lastUpdated: string;
  source: string;
  timezone: string;
  dataStatus: string;
  rankings: CFPTeamRanking[];
  modelBaseline: CFPModelBaseline;
  meta?: {
    fetchedFrom: 'worker' | 'static';
    cache: 'hit' | 'miss' | 'bypass';
  };
}

export interface ScenarioAdjustment {
  team: string;
  winProbabilityDelta?: number;
  resumeBonus?: number;
  autoBid?: boolean;
}

export interface ScenarioSimulationRequest {
  iterations?: number;
  adjustments?: ScenarioAdjustment[];
  protectSeeds?: string[];
  chaosFactor?: number;
}

export interface ScenarioSimulationTeamResult {
  team: string;
  playoffOdds: number;
  avgSeed: number;
  topTwoOdds: number;
  medianSeed: number;
  volatilityIndex: number;
  inclusionCount: number;
}

export interface ScenarioSimulationResponse {
  iterations: number;
  scenarioHash: string;
  generatedAt: string;
  projectedField: Array<{ team: string; seed: number }>;
  teams: ScenarioSimulationTeamResult[];
  bubbleWatch: string[];
  narrative: string[];
}
