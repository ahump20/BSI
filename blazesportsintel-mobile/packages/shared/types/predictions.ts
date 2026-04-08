export interface Prediction {
  gameId: string;
  sport: string;
  confidence: number;
  model: string;
  predictedWinner: string;
  raw?: unknown;
}

export interface Player {
  id: string;
  name: string;
  team: string;
  position?: string | null;
  stats?: unknown;
}
