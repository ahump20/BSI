export interface SimulationTeamInput {
  id: string;
  name: string;
  attackStrength?: number;
  defenseStrength?: number;
  recentForm?: number[];
  offensiveEPA?: number;
  defensiveEPA?: number;
  successRate?: number;
  teamOPS?: number;
  startingPitcher?: {
    name: string;
    era: number;
    whip?: number;
  };
  recentRecord?: {
    wins: number;
    losses: number;
  };
  [key: string]: unknown;
}

export interface SimulationScoreEntry {
  score: string;
  probability: number;
  count: number;
}

export interface SimulationResults {
  iterations: number;
  homeWinProbability: number;
  awayWinProbability: number;
  drawProbability?: number;
  expectedValue: {
    home: number;
    away: number;
  };
  mostLikelyScores: SimulationScoreEntry[];
  scoreDistribution: SimulationScoreEntry[];
  outcomes: number[];
  rawCounts: Record<string, number>;
  model: string;
}

export interface TeamPerformanceRow {
  id?: number;
  team_id: string;
  opponent_id?: string | null;
  date: string;
  sport: string;
  points_scored: number | null;
  points_allowed: number | null;
  offensive_epa?: number | null;
  defensive_epa?: number | null;
  success_rate?: number | null;
}

export interface TeamStrengthProfile {
  teamId: string;
  teamName?: string;
  attackStrength: number;
  defenseStrength: number;
  recentForm: number[];
  offensiveEPA: number;
  defensiveEPA: number;
  successRate: number;
  baselineRating: number;
  formRating: number;
  teamOPS?: number;
}

export interface ConfidenceIntervalResult {
  pointEstimate: number;
  lowerBound: number;
  upperBound: number;
  standardError: number;
}

export interface BootstrapConfidenceInterval extends ConfidenceIntervalResult {
  bootstrapIterations: number;
}
