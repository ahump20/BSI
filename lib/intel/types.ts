export type IntelMode = 'coach' | 'scout' | 'fan';

export type IntelSport = 'all' | 'nfl' | 'nba' | 'mlb' | 'ncaafb' | 'cbb';

export type GameTier = 'hero' | 'marquee' | 'standard';

export type SignalPriority = 'high' | 'medium' | 'low';

export type GameStatus = 'live' | 'final' | 'scheduled';

export interface TeamInfo {
  name: string;
  abbreviation: string;
  score: number;
  logo?: string;
  record?: string;
}

export interface IntelGame {
  id: string;
  sport: Exclude<IntelSport, 'all'>;
  away: TeamInfo;
  home: TeamInfo;
  status: GameStatus;
  statusDetail?: string;
  venue?: string;
  startTime?: string;
  tier: GameTier;
  signalCount: number;
  winProbability?: { home: number; away: number };
  modelEdge?: string;
  keyStats?: Array<{ label: string; away: string | number; home: string | number }>;
  scoring?: Array<Record<string, string | number>>;
  radar?: Array<{ metric: string; away: number; home: number }>;
  explain?: Array<{ name: string; delta: number }>;
}

export interface IntelSignal {
  id: string;
  text: string;
  sport: Exclude<IntelSport, 'all'>;
  priority: SignalPriority;
  type: string;
  confidence?: number;
  modes: IntelMode[];
  gameId?: string;
  teamTags?: string[];
  timestamp: string;
  evidence?: Array<{ label: string; value: string }>;
}

export interface StandingsTeam {
  teamName: string;
  abbreviation?: string;
  wins: number;
  losses: number;
  winPct?: number;
  netRating?: number;
  conference?: string;
  division?: string;
}

export interface ModelHealthPoint {
  week: string;
  accuracy: number;
}

// Maps intel sport keys to API route prefixes
export const SPORT_API_MAP: Record<Exclude<IntelSport, 'all'>, string> = {
  mlb: '/api/mlb',
  nfl: '/api/nfl',
  nba: '/api/nba',
  ncaafb: '/api/nfl', // CFB uses same ESPN pattern
  cbb: '/api/nba',    // CBB uses same ESPN pattern
};

export const SPORT_LABELS: Record<IntelSport, string> = {
  all: 'ALL',
  nfl: 'NFL',
  nba: 'NBA',
  mlb: 'MLB',
  ncaafb: 'CFB',
  cbb: 'CBB',
};

export const SPORT_ACCENT: Record<IntelSport, string> = {
  all: 'var(--bsi-primary, #BF5700)',
  nfl: '#10b981',
  nba: '#3b82f6',
  mlb: '#BF5700',
  ncaafb: '#f59e0b',
  cbb: '#a855f7',
};

export const PRIORITY_ACCENT: Record<SignalPriority, string> = {
  high: '#FF6B35',
  medium: '#f59e0b',
  low: '#737373',
};

export const MODE_LABELS: Record<IntelMode, string> = {
  coach: 'Coach',
  scout: 'Scout',
  fan: 'Fan',
};

export const MODE_DESCRIPTIONS: Record<IntelMode, string> = {
  coach: 'Matchups, edges, game-plan levers',
  scout: 'Availability, usage, role projections',
  fan: 'Narratives, moments, why it matters',
};
