/**
 * Prediction Types
 * AI-powered prediction models for game outcomes
 */

export interface GamePrediction {
  gameId: string;
  sport: string;
  predictedWinner: string;
  winProbability: number;
  predictedSpread: number;
  predictedTotal: number;
  confidence: 'high' | 'medium' | 'low';
  factors: PredictionFactor[];
  modelVersion: string;
  generatedAt: string;
}

export interface PredictionFactor {
  name: string;
  impact: number;
  description: string;
}

export interface PlayerPropPrediction {
  playerId: string;
  playerName: string;
  gameId: string;
  propType: string;
  predictedValue: number;
  line: number;
  recommendation: 'over' | 'under' | 'neutral';
  confidence: number;
  factors: PredictionFactor[];
}

export interface PredictionMetrics {
  accuracy: number;
  totalPredictions: number;
  correctPredictions: number;
  averageConfidence: number;
  bestSport?: string;
}

export interface PredictionRequest {
  gameId: string;
  sport: string;
  includeProps?: boolean;
}

export interface PredictionResponse {
  prediction: GamePrediction;
  playerProps?: PlayerPropPrediction[];
  metrics?: PredictionMetrics;
}
