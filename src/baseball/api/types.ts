export interface UmpireZoneProbability {
  zone: 'inner' | 'outer' | 'high' | 'low';
  calledStrikeProbability: number;
  chaseRate: number;
  swingRate: number;
  sampleSize: number;
}

export interface UmpireZoneProbabilityResponse {
  gameId: string;
  umpireId: string;
  sampleSize: number;
  baselineStrikeProbability: number;
  zones: UmpireZoneProbability[];
  confidence: number;
  updatedAt: string;
  source: 'kv' | 'derived';
}

export interface PitcherWorkloadRiskResponse {
  pitcherId: string;
  season: string | null;
  workloadIndex: number;
  riskTier: 'low' | 'medium' | 'high';
  recommendedRestDays: number;
  rollingAveragePitches: number;
  shortRestAppearances: number;
  recentAppearances: Array<{
    gameId: number;
    gameDate: string;
    pitches: number;
    innings: number;
    strikeouts: number;
    walks: number;
  }>;
  seasonTotals: {
    totalPitches: number;
    totalInnings: number;
    appearances: number;
  };
  lastUpdated: string;
}

export interface SituationalPredictionEntry {
  context: string;
  homeTeamProbability: number;
  awayTeamProbability: number;
  leverageIndex: number;
  supportingMetrics: Record<string, number>;
}

export interface SituationalPredictionsResponse {
  gameId: string;
  scenario: string;
  inning: number | null;
  outs: number | null;
  baseState: string;
  predictions: SituationalPredictionEntry[];
  confidence: number;
  generatedAt: string;
  modelVersion: string;
}

export interface ApiErrorPayload {
  error: string | { code: string; message: string };
}
