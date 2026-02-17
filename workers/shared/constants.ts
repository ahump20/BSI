export const PROD_ORIGINS = new Set([
  'https://blazesportsintel.com',
  'https://www.blazesportsintel.com',
  'https://blazesportsintel.pages.dev',
  'https://austinhumphrey.com',
  'https://www.austinhumphrey.com',
  'https://blazecraft.app',
]);

export const DEV_ORIGINS = new Set([
  'http://localhost:3000',
  'http://localhost:8787',
  'http://localhost:5173',
]);

export const ALLOWED_PAGES_DOMAINS = ['blazesportsintel.pages.dev', 'blazecraft.pages.dev', 'austinhumphrey.com'];

export const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://js.stripe.com https://challenges.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.posthog.com https://us.i.posthog.com https://api.stripe.com wss://live.blazesportsintel.com",
    "frame-src 'self' https://*.cloudflarestream.com https://js.stripe.com https://challenges.cloudflare.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "report-uri /_csp/report",
  ].join('; '),
};

export const HTTP_CACHE: Record<string, number> = {
  scores: 30,
  standings: 300,
  rankings: 300,
  team: 600,
  player: 600,
  game: 30,
  trending: 120,
  schedule: 3600,
  news: 120,
};

export const CACHE_TTL: Record<string, number> = {
  scores: 60,
  standings: 1800,
  rankings: 1800,
  teams: 86400,
  players: 86400,
  games: 60,
  schedule: 300,
  trending: 300,
};

export const RATE_LIMIT_WINDOW = 60;
export const RATE_LIMIT_MAX_REQUESTS = 30;
export const LEAD_TTL_SECONDS = 90 * 24 * 60 * 60;

export const ESPN_NEWS_ENDPOINTS: Record<string, string> = {
  mlb: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/news',
  nfl: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/news',
  nba: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/news',
  cfb: 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/news',
  ncaafb: 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/news',
  cbb: 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/news',
  'college-baseball': 'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/news',
};

export const INTEL_ESPN_NEWS: Record<string, string> = {
  nfl: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/news',
  nba: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/news',
  mlb: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/news',
  ncaafb: 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/news',
  cbb: 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/news',
  d1bb: 'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/news',
};

export const GHOST_REDIRECTS: Record<string, string> = {
  '/coverage': '/analytics',
  '/daily': '/',
  '/hourly': '/',
  '/dashboard/daily': '/dashboard',
  '/mlb/daily': '/mlb',
  '/mlb/standings/daily': '/mlb',
  '/nfl/daily': '/nfl',
  '/nba/daily': '/nba',
  '/cfb/daily': '/cfb',
  '/college-baseball/daily/latest': '/college-baseball',
  '/scores/daily': '/scores',
  '/baseball/rankings': '/college-baseball/rankings',
  '/baseball/rankings/': '/college-baseball/rankings',
};

export const MCP_SERVER_INFO = {
  name: 'bsi-sports',
  version: '1.0.0',
};

export const MCP_TOOLS = [
  {
    name: 'bsi_college_baseball_scores',
    description: 'Get live and recent college baseball scores. Optionally filter by date (YYYY-MM-DD).',
    inputSchema: { type: 'object' as const, properties: { date: { type: 'string', description: 'Date in YYYY-MM-DD format (default: today)' } } },
  },
  {
    name: 'bsi_college_baseball_standings',
    description: 'Get college baseball standings, optionally filtered by conference.',
    inputSchema: { type: 'object' as const, properties: { conference: { type: 'string', description: 'Conference name (default: NCAA)' } } },
  },
  {
    name: 'bsi_college_baseball_rankings',
    description: 'Get current college baseball rankings (top 25).',
    inputSchema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'bsi_college_baseball_team',
    description: 'Get team details and roster by team ID.',
    inputSchema: { type: 'object' as const, properties: { team_id: { type: 'string', description: 'Numeric team ID' } }, required: ['team_id'] },
  },
  {
    name: 'bsi_college_baseball_game',
    description: 'Get game details and box score by game ID.',
    inputSchema: { type: 'object' as const, properties: { game_id: { type: 'string', description: 'Numeric game ID' } }, required: ['game_id'] },
  },
  {
    name: 'bsi_college_baseball_player',
    description: 'Get player info and statistics by player ID.',
    inputSchema: { type: 'object' as const, properties: { player_id: { type: 'string', description: 'Numeric player ID' } }, required: ['player_id'] },
  },
  {
    name: 'bsi_college_baseball_schedule',
    description: 'Get the college baseball schedule for a date range.',
    inputSchema: { type: 'object' as const, properties: { date: { type: 'string', description: 'Start date YYYY-MM-DD (default: today)' }, range: { type: 'string', description: '"day" or "week" (default: week)' } } },
  },
  {
    name: 'bsi_mlb_scores',
    description: 'Get MLB scores for a given date.',
    inputSchema: { type: 'object' as const, properties: { date: { type: 'string', description: 'Date in YYYY-MM-DD format (default: today)' } } },
  },
  {
    name: 'bsi_mlb_standings',
    description: 'Get current MLB standings.',
    inputSchema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'bsi_nfl_scores',
    description: 'Get NFL scores by week.',
    inputSchema: { type: 'object' as const, properties: { week: { type: 'string', description: 'Week number (default: 1)' }, season: { type: 'string', description: 'Season year (default: current)' } } },
  },
  {
    name: 'bsi_nfl_standings',
    description: 'Get current NFL standings.',
    inputSchema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'bsi_nba_scores',
    description: 'Get NBA scores for a given date.',
    inputSchema: { type: 'object' as const, properties: { date: { type: 'string', description: 'Date in YYYY-MM-DD format (default: today)' } } },
  },
  {
    name: 'bsi_nba_standings',
    description: 'Get current NBA standings.',
    inputSchema: { type: 'object' as const, properties: {} },
  },
];
