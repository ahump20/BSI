export type IntelMode = 'coach' | 'scout' | 'fan';

export type IntelSport = 'all' | 'nfl' | 'nba' | 'mlb' | 'ncaafb' | 'cbb' | 'd1bb';

export type GameTier = 'hero' | 'marquee' | 'standard';

export type SignalPriority = 'high' | 'medium' | 'low';

export type GameStatus = 'live' | 'final' | 'scheduled';

export interface TeamInfo {
  name: string;
  abbreviation: string;
  score: number;
  logo?: string;
  rank?: number;
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
  headline?: string;
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
  logo?: string;
  rank?: number;
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
  ncaafb: '/api/cfb',
  cbb: '/api/cbb',
  'd1bb': '/api/college-baseball',
};

export const SPORT_LABELS: Record<IntelSport, string> = {
  all: 'ALL',
  nfl: 'NFL',
  nba: 'NBA',
  mlb: 'MLB',
  ncaafb: 'CFB',
  cbb: 'CBB',
  'd1bb': 'NCAABB',
};

export const SPORT_ACCENT: Record<IntelSport, string> = {
  all: 'var(--bsi-primary, #BF5700)',
  nfl: '#10b981',
  nba: '#3b82f6',
  mlb: '#BF5700',
  ncaafb: '#f59e0b',
  cbb: '#dc2626',
  'd1bb': '#C75B12',
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

// ─── News ────────────────────────────────────────────────────────────────

export interface NewsItem {
  id: string;
  headline: string;
  description?: string;
  link: string;
  image?: string;
  published?: string;
}

export const ESPN_NEWS_MAP: Record<Exclude<IntelSport, 'all'>, string> = {
  nfl: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/news',
  nba: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/news',
  mlb: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/news',
  ncaafb: 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/news',
  cbb: 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/news',
  'd1bb': 'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/news',
};

export const ESPN_SCORES_MAP: Record<Exclude<IntelSport, 'all'>, string> = {
  nfl: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
  nba: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard',
  mlb: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard',
  ncaafb: 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard',
  cbb: 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard',
  d1bb: 'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/scoreboard',
};

export const ESPN_STANDINGS_MAP: Record<Exclude<IntelSport, 'all'>, string> = {
  nfl: 'https://site.api.espn.com/apis/v2/sports/football/nfl/standings',
  nba: 'https://site.api.espn.com/apis/v2/sports/basketball/nba/standings',
  mlb: 'https://site.api.espn.com/apis/v2/sports/baseball/mlb/standings',
  ncaafb: 'https://site.api.espn.com/apis/v2/sports/football/college-football/standings',
  cbb: 'https://site.api.espn.com/apis/v2/sports/basketball/mens-college-basketball/standings',
  d1bb: 'https://site.api.espn.com/apis/v2/sports/baseball/college-baseball/standings',
};

// ─── Command Palette ──────────────────────────────────────────────────────

export interface CommandPaletteItem {
  id: string;
  label: string;
  type: 'game' | 'signal' | 'team';
  sport?: Exclude<IntelSport, 'all'>;
  data: IntelGame | IntelSignal | string;
}
