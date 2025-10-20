export interface TeamSummary {
  id: string;
  name: string;
  slug: string | null;
  school: string | null;
  abbreviation: string | null;
  logoUrl: string | null;
  conference: {
    id: string | null;
    name: string | null;
    slug: string | null;
  } | null;
}

export interface DiamondProSnapshot {
  runDifferential: number;
  leverageIndex: number;
  homeWinProbability: number;
  awayWinProbability: number;
  highLeverage: boolean;
}

export interface GameSummary {
  id: string;
  slug: string | null;
  status: string;
  scheduledAt: string | null;
  completedAt: string | null;
  updatedAt: string | null;
  homeScore: number | null;
  awayScore: number | null;
  inning: number | null;
  inningHalf: string | null;
  homeTeam: TeamSummary | null;
  awayTeam: TeamSummary | null;
  venue: {
    name: string | null;
    city: string | null;
    state: string | null;
  } | null;
  tournament: string | null;
  conferenceGame: boolean;
  diamondPro?: DiamondProSnapshot;
}

export interface GamesApiResponse {
  data: GameSummary[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  permissions: {
    diamondPro: boolean;
    diamondProFeatureFlag: boolean;
  };
  meta: {
    generatedAt: string;
    query: Record<string, unknown>;
  };
  error?: string;
  warnings?: string[];
}
