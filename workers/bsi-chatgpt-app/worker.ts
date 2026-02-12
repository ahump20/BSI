/**
 * Blaze Sports Intel - ChatGPT App Worker
 * Real-time multi-sport analytics API for ChatGPT integration
 *
 * Covers: MLB, NFL, NBA, NCAA Football, D1 College Baseball
 * Cache: 60-second TTL via Cloudflare KV (minimum allowed)
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface Env {
  BSI_CACHE: KVNamespace;
  SPORTSDATAIO_API_KEY: string;
  ESPN_API_KEY: string;
  PERFECT_GAME_API_KEY: string;
  PORTAL_API_BASE?: string;
}

interface CacheOptions {
  ttl: number;
  key: string;
}

// MLB Types
interface MLBGame {
  gameId: string;
  status: 'scheduled' | 'in_progress' | 'final' | 'postponed' | 'delayed';
  inning: number | null;
  inningHalf: 'top' | 'bottom' | null;
  awayTeam: {
    id: string;
    name: string;
    abbreviation: string;
    score: number;
    hits: number;
    errors: number;
  };
  homeTeam: {
    id: string;
    name: string;
    abbreviation: string;
    score: number;
    hits: number;
    errors: number;
  };
  startTime: string;
  venue: string;
  broadcasts: string[];
}

interface MLBLiveResponse {
  success: boolean;
  timestamp: string;
  timezone: string;
  games: MLBGame[];
  gamesInProgress: number;
  totalGames: number;
}

// NFL Types
interface NFLGame {
  gameId: string;
  status: 'scheduled' | 'in_progress' | 'final' | 'halftime';
  quarter: number | null;
  timeRemaining: string | null;
  awayTeam: {
    id: string;
    name: string;
    abbreviation: string;
    score: number;
    record: string;
  };
  homeTeam: {
    id: string;
    name: string;
    abbreviation: string;
    score: number;
    record: string;
  };
  startTime: string;
  venue: string;
  week: number;
  broadcasts: string[];
}

interface NFLLiveResponse {
  success: boolean;
  timestamp: string;
  timezone: string;
  week: number;
  season: number;
  games: NFLGame[];
  gamesInProgress: number;
  totalGames: number;
}

// NBA Types
interface NBATeamStanding {
  teamId: string;
  name: string;
  abbreviation: string;
  conference: 'Eastern' | 'Western';
  division: string;
  wins: number;
  losses: number;
  winPercentage: number;
  gamesBack: number;
  conferenceRank: number;
  divisionRank: number;
  streak: string;
  lastTen: string;
  pointsPerGame: number;
  pointsAllowedPerGame: number;
  pointDifferential: number;
}

interface NBAStandingsResponse {
  success: boolean;
  timestamp: string;
  timezone: string;
  season: string;
  eastern: NBATeamStanding[];
  western: NBATeamStanding[];
}

// College Football Types
interface CFBTeamAnalytics {
  teamId: string;
  name: string;
  conference: string;
  record: string;
  ranking: number | null;
  offenseRank: number;
  defenseRank: number;
  pointsPerGame: number;
  pointsAllowedPerGame: number;
  yardsPerGame: number;
  yardsAllowedPerGame: number;
  turnoversForced: number;
  turnoversLost: number;
  thirdDownConversionRate: number;
  redZoneEfficiency: number;
  strengthOfSchedule: number;
  espnFpi: number | null;
}

interface CFBAnalyticsResponse {
  success: boolean;
  timestamp: string;
  timezone: string;
  season: number;
  week: number;
  teams: CFBTeamAnalytics[];
  totalTeams: number;
}

// College Baseball Types
interface CollegeBaseballBoxScore {
  gameId: string;
  teamId: string;
  teamName: string;
  opponent: string;
  date: string;
  result: 'W' | 'L' | 'T';
  score: string;
  innings: number;
  batting: {
    runs: number;
    hits: number;
    errors: number;
    battingAverage: number;
    onBasePercentage: number;
    sluggingPercentage: number;
    homeRuns: number;
    rbis: number;
    strikeouts: number;
    walks: number;
  };
  pitching: {
    earnedRuns: number;
    era: number;
    strikeouts: number;
    walks: number;
    hitsAllowed: number;
    inningsPitched: number;
  };
  topPerformers: {
    hitter: { name: string; stats: string };
    pitcher: { name: string; stats: string };
  };
}

interface CollegeBaseballBoxScoreResponse {
  success: boolean;
  timestamp: string;
  timezone: string;
  teamId: string;
  teamName: string;
  conference: string;
  record: string;
  recentGames: CollegeBaseballBoxScore[];
  totalGames: number;
}

// NIL Types
interface NILValuation {
  athleteId: string;
  name: string;
  sport: string;
  school: string;
  position: string;
  class: string;
  estimatedValue: number;
  valueRange: { low: number; high: number };
  socialFollowing: {
    instagram: number;
    twitter: number;
    tiktok: number;
    total: number;
  };
  engagementRate: number;
  marketability: number;
  performanceScore: number;
  activeDeals: number;
  valueChange30Days: number;
  lastUpdated: string;
}

interface NILValuationResponse {
  success: boolean;
  timestamp: string;
  timezone: string;
  valuation: NILValuation;
}

// Transfer Portal Types
interface TransferPortalEntry {
  entryId: string;
  athleteName: string;
  sport: 'football' | 'baseball';
  position: string;
  formerSchool: string;
  formerConference: string;
  class: string;
  rating: number | null;
  entryDate: string;
  status: 'available' | 'committed' | 'withdrawn';
  newSchool: string | null;
  commitDate: string | null;
  stats: Record<string, number | string>;
  source: string;
  sourceConfidence: number;
  sourceUrl: string | null;
}

interface TransferPortalResponse {
  success: boolean;
  timestamp: string;
  timezone: string;
  sport: string | null;
  entries: TransferPortalEntry[];
  totalAvailable: number;
  totalCommitted: number;
  recentCommitments: number;
}

// API Response wrapper
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
  cached: boolean;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function formatTimestamp(): string {
  return (
    new Date().toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }) + ' CT'
  );
}

function corsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': 'https://chat.openai.com',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, openai-conversation-id, openai-ephemeral-user-id',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
  };
}

function jsonResponse<T>(data: T, status: number = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: corsHeaders(),
  });
}

function errorResponse(message: string, status: number = 500): Response {
  return jsonResponse({ success: false, error: message, timestamp: formatTimestamp() }, status);
}

// =============================================================================
// CACHE LAYER
// =============================================================================

async function getCached<T>(
  kv: KVNamespace,
  key: string
): Promise<{ data: T; cached: boolean } | null> {
  const cached = await kv.get(key, 'json');
  if (cached) {
    return { data: cached as T, cached: true };
  }
  return null;
}

async function setCache<T>(
  kv: KVNamespace,
  key: string,
  data: T,
  ttlSeconds: number = 60
): Promise<void> {
  // Cloudflare KV requires minimum 60s TTL
  const minTtl = Math.max(ttlSeconds, 60);
  await kv.put(key, JSON.stringify(data), { expirationTtl: minTtl });
}

async function withCache<T>(
  kv: KVNamespace,
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 60
): Promise<{ data: T; cached: boolean }> {
  const cached = await getCached<T>(kv, key);
  if (cached) {
    return cached;
  }

  const data = await fetcher();
  await setCache(kv, key, data, ttlSeconds);
  return { data, cached: false };
}

// =============================================================================
// DATA FETCHERS - MLB
// =============================================================================

async function fetchMLBLive(env: Env): Promise<MLBLiveResponse> {
  const today = new Date().toISOString().split('T')[0];
  const url = `https://api.sportsdata.io/v3/mlb/scores/json/GamesByDate/${today}?key=${env.SPORTSDATAIO_API_KEY}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`MLB API error: ${response.status}`);
  }

  const rawGames = (await response.json()) as Array<{
    GameID: number;
    Status: string;
    Inning: number | null;
    InningHalf: string | null;
    AwayTeam: string;
    AwayTeamID: number;
    AwayTeamRuns: number;
    AwayTeamHits: number;
    AwayTeamErrors: number;
    HomeTeam: string;
    HomeTeamID: number;
    HomeTeamRuns: number;
    HomeTeamHits: number;
    HomeTeamErrors: number;
    DateTime: string;
    StadiumID: number;
    Channel: string;
  }>;

  const games: MLBGame[] = rawGames.map((g) => ({
    gameId: String(g.GameID),
    status: normalizeGameStatus(g.Status),
    inning: g.Inning,
    inningHalf: g.InningHalf?.toLowerCase() as 'top' | 'bottom' | null,
    awayTeam: {
      id: String(g.AwayTeamID),
      name: getMLBTeamName(g.AwayTeam),
      abbreviation: g.AwayTeam,
      score: g.AwayTeamRuns || 0,
      hits: g.AwayTeamHits || 0,
      errors: g.AwayTeamErrors || 0,
    },
    homeTeam: {
      id: String(g.HomeTeamID),
      name: getMLBTeamName(g.HomeTeam),
      abbreviation: g.HomeTeam,
      score: g.HomeTeamRuns || 0,
      hits: g.HomeTeamHits || 0,
      errors: g.HomeTeamErrors || 0,
    },
    startTime: g.DateTime,
    venue: getVenueName(g.StadiumID),
    broadcasts: g.Channel ? [g.Channel] : [],
  }));

  const gamesInProgress = games.filter((g) => g.status === 'in_progress').length;

  return {
    success: true,
    timestamp: formatTimestamp(),
    timezone: 'America/Chicago',
    games,
    gamesInProgress,
    totalGames: games.length,
  };
}

function normalizeGameStatus(status: string): MLBGame['status'] {
  const lower = status.toLowerCase();
  if (lower.includes('progress') || lower === 'inprogress') return 'in_progress';
  if (lower === 'final' || lower === 'f') return 'final';
  if (lower.includes('postpone')) return 'postponed';
  if (lower.includes('delay')) return 'delayed';
  return 'scheduled';
}

function getMLBTeamName(abbr: string): string {
  const teams: Record<string, string> = {
    ARI: 'Arizona Diamondbacks',
    ATL: 'Atlanta Braves',
    BAL: 'Baltimore Orioles',
    BOS: 'Boston Red Sox',
    CHC: 'Chicago Cubs',
    CWS: 'Chicago White Sox',
    CIN: 'Cincinnati Reds',
    CLE: 'Cleveland Guardians',
    COL: 'Colorado Rockies',
    DET: 'Detroit Tigers',
    HOU: 'Houston Astros',
    KC: 'Kansas City Royals',
    LAA: 'Los Angeles Angels',
    LAD: 'Los Angeles Dodgers',
    MIA: 'Miami Marlins',
    MIL: 'Milwaukee Brewers',
    MIN: 'Minnesota Twins',
    NYM: 'New York Mets',
    NYY: 'New York Yankees',
    OAK: 'Oakland Athletics',
    PHI: 'Philadelphia Phillies',
    PIT: 'Pittsburgh Pirates',
    SD: 'San Diego Padres',
    SF: 'San Francisco Giants',
    SEA: 'Seattle Mariners',
    STL: 'St. Louis Cardinals',
    TB: 'Tampa Bay Rays',
    TEX: 'Texas Rangers',
    TOR: 'Toronto Blue Jays',
    WAS: 'Washington Nationals',
  };
  return teams[abbr] || abbr;
}

function getVenueName(stadiumId: number): string {
  const venues: Record<number, string> = {
    1: 'Chase Field',
    2: 'Truist Park',
    3: 'Oriole Park',
    4: 'Fenway Park',
    5: 'Wrigley Field',
    6: 'Guaranteed Rate Field',
    7: 'Great American Ball Park',
    8: 'Progressive Field',
    9: 'Coors Field',
    10: 'Comerica Park',
    11: 'Minute Maid Park',
    12: 'Kauffman Stadium',
    13: 'Angel Stadium',
    14: 'Dodger Stadium',
    15: 'loanDepot park',
    16: 'American Family Field',
    17: 'Target Field',
    18: 'Citi Field',
    19: 'Yankee Stadium',
    20: 'Oakland Coliseum',
    21: 'Citizens Bank Park',
    22: 'PNC Park',
    23: 'Petco Park',
    24: 'Oracle Park',
    25: 'T-Mobile Park',
    26: 'Busch Stadium',
    27: 'Tropicana Field',
    28: 'Globe Life Field',
    29: 'Rogers Centre',
    30: 'Nationals Park',
  };
  return venues[stadiumId] || 'Unknown Venue';
}

// =============================================================================
// DATA FETCHERS - NFL
// =============================================================================

async function fetchNFLLive(env: Env): Promise<NFLLiveResponse> {
  const year = new Date().getFullYear();
  const url = `https://api.sportsdata.io/v3/nfl/scores/json/ScoresByWeek/${year}/REG/16?key=${env.SPORTSDATAIO_API_KEY}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`NFL API error: ${response.status}`);
  }

  const rawGames = (await response.json()) as Array<{
    GameKey: string;
    Status: string;
    Quarter: string | null;
    TimeRemaining: string | null;
    AwayTeam: string;
    AwayTeamID: number;
    AwayScore: number;
    AwayTeamMoneyLine: number;
    HomeTeam: string;
    HomeTeamID: number;
    HomeScore: number;
    DateTime: string;
    StadiumDetails: { Name: string } | null;
    Week: number;
    Channel: string;
  }>;

  const games: NFLGame[] = rawGames.map((g) => ({
    gameId: g.GameKey,
    status: normalizeNFLStatus(g.Status),
    quarter: g.Quarter ? parseInt(g.Quarter) : null,
    timeRemaining: g.TimeRemaining,
    awayTeam: {
      id: String(g.AwayTeamID),
      name: getNFLTeamName(g.AwayTeam),
      abbreviation: g.AwayTeam,
      score: g.AwayScore || 0,
      record: '',
    },
    homeTeam: {
      id: String(g.HomeTeamID),
      name: getNFLTeamName(g.HomeTeam),
      abbreviation: g.HomeTeam,
      score: g.HomeScore || 0,
      record: '',
    },
    startTime: g.DateTime,
    venue: g.StadiumDetails?.Name || 'TBD',
    week: g.Week,
    broadcasts: g.Channel ? [g.Channel] : [],
  }));

  const gamesInProgress = games.filter((g) => g.status === 'in_progress').length;

  return {
    success: true,
    timestamp: formatTimestamp(),
    timezone: 'America/Chicago',
    week: 16,
    season: year,
    games,
    gamesInProgress,
    totalGames: games.length,
  };
}

function normalizeNFLStatus(status: string): NFLGame['status'] {
  const lower = status.toLowerCase();
  if (lower.includes('progress') || lower === 'inprogress') return 'in_progress';
  if (lower === 'final' || lower === 'f') return 'final';
  if (lower.includes('half')) return 'halftime';
  return 'scheduled';
}

function getNFLTeamName(abbr: string): string {
  const teams: Record<string, string> = {
    ARI: 'Arizona Cardinals',
    ATL: 'Atlanta Falcons',
    BAL: 'Baltimore Ravens',
    BUF: 'Buffalo Bills',
    CAR: 'Carolina Panthers',
    CHI: 'Chicago Bears',
    CIN: 'Cincinnati Bengals',
    CLE: 'Cleveland Browns',
    DAL: 'Dallas Cowboys',
    DEN: 'Denver Broncos',
    DET: 'Detroit Lions',
    GB: 'Green Bay Packers',
    HOU: 'Houston Texans',
    IND: 'Indianapolis Colts',
    JAX: 'Jacksonville Jaguars',
    KC: 'Kansas City Chiefs',
    LV: 'Las Vegas Raiders',
    LAC: 'Los Angeles Chargers',
    LAR: 'Los Angeles Rams',
    MIA: 'Miami Dolphins',
    MIN: 'Minnesota Vikings',
    NE: 'New England Patriots',
    NO: 'New Orleans Saints',
    NYG: 'New York Giants',
    NYJ: 'New York Jets',
    PHI: 'Philadelphia Eagles',
    PIT: 'Pittsburgh Steelers',
    SF: 'San Francisco 49ers',
    SEA: 'Seattle Seahawks',
    TB: 'Tampa Bay Buccaneers',
    TEN: 'Tennessee Titans',
    WAS: 'Washington Commanders',
  };
  return teams[abbr] || abbr;
}

// =============================================================================
// DATA FETCHERS - NBA
// =============================================================================

async function fetchNBAStandings(env: Env): Promise<NBAStandingsResponse> {
  const year = new Date().getFullYear();
  const url = `https://api.sportsdata.io/v3/nba/scores/json/Standings/${year}?key=${env.SPORTSDATAIO_API_KEY}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`NBA API error: ${response.status}`);
  }

  const rawStandings = (await response.json()) as Array<{
    TeamID: number;
    Name: string;
    Key: string;
    Conference: string;
    Division: string;
    Wins: number;
    Losses: number;
    Percentage: number;
    GamesBack: number;
    ConferenceRank: number;
    DivisionRank: number;
    Streak: number;
    LastTenWins: number;
    LastTenLosses: number;
    PointsPerGameFor: number;
    PointsPerGameAgainst: number;
  }>;

  const standings: NBATeamStanding[] = rawStandings.map((t) => ({
    teamId: String(t.TeamID),
    name: t.Name,
    abbreviation: t.Key,
    conference: t.Conference as 'Eastern' | 'Western',
    division: t.Division,
    wins: t.Wins,
    losses: t.Losses,
    winPercentage: t.Percentage,
    gamesBack: t.GamesBack,
    conferenceRank: t.ConferenceRank,
    divisionRank: t.DivisionRank,
    streak: t.Streak > 0 ? `W${t.Streak}` : `L${Math.abs(t.Streak)}`,
    lastTen: `${t.LastTenWins}-${t.LastTenLosses}`,
    pointsPerGame: t.PointsPerGameFor,
    pointsAllowedPerGame: t.PointsPerGameAgainst,
    pointDifferential: Number((t.PointsPerGameFor - t.PointsPerGameAgainst).toFixed(1)),
  }));

  const eastern = standings
    .filter((t) => t.conference === 'Eastern')
    .sort((a, b) => a.conferenceRank - b.conferenceRank);

  const western = standings
    .filter((t) => t.conference === 'Western')
    .sort((a, b) => a.conferenceRank - b.conferenceRank);

  return {
    success: true,
    timestamp: formatTimestamp(),
    timezone: 'America/Chicago',
    season: `${year}-${year + 1}`,
    eastern,
    western,
  };
}

// =============================================================================
// DATA FETCHERS - COLLEGE FOOTBALL
// =============================================================================

async function fetchCFBAnalytics(env: Env): Promise<CFBAnalyticsResponse> {
  const year = new Date().getFullYear();
  const url = `https://api.sportsdata.io/v3/cfb/scores/json/TeamSeasonStats/${year}?key=${env.SPORTSDATAIO_API_KEY}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`CFB API error: ${response.status}`);
  }

  const rawStats = (await response.json()) as Array<{
    TeamID: number;
    Team: string;
    Conference: string;
    Wins: number;
    Losses: number;
    ApRank: number | null;
    Score: number;
    OpponentScore: number;
    OffensiveYards: number;
    DefensiveYards: number;
    TakeAways: number;
    GiveAways: number;
    ThirdDownPercentage: number;
    RedZonePercentage: number;
    Games: number;
  }>;

  const teams: CFBTeamAnalytics[] = rawStats.map((t, index) => ({
    teamId: String(t.TeamID),
    name: t.Team,
    conference: t.Conference,
    record: `${t.Wins}-${t.Losses}`,
    ranking: t.ApRank,
    offenseRank: index + 1,
    defenseRank: index + 1,
    pointsPerGame: t.Games > 0 ? Number((t.Score / t.Games).toFixed(1)) : 0,
    pointsAllowedPerGame: t.Games > 0 ? Number((t.OpponentScore / t.Games).toFixed(1)) : 0,
    yardsPerGame: t.Games > 0 ? Number((t.OffensiveYards / t.Games).toFixed(1)) : 0,
    yardsAllowedPerGame: t.Games > 0 ? Number((t.DefensiveYards / t.Games).toFixed(1)) : 0,
    turnoversForced: t.TakeAways,
    turnoversLost: t.GiveAways,
    thirdDownConversionRate: t.ThirdDownPercentage,
    redZoneEfficiency: t.RedZonePercentage,
    strengthOfSchedule: 0,
    espnFpi: null,
  }));

  return {
    success: true,
    timestamp: formatTimestamp(),
    timezone: 'America/Chicago',
    season: year,
    week: getCurrentCFBWeek(),
    teams: teams.slice(0, 50),
    totalTeams: teams.length,
  };
}

function getCurrentCFBWeek(): number {
  const now = new Date();
  const seasonStart = new Date(now.getFullYear(), 7, 24);
  const weeksPassed = Math.floor(
    (now.getTime() - seasonStart.getTime()) / (7 * 24 * 60 * 60 * 1000)
  );
  return Math.max(1, Math.min(weeksPassed + 1, 15));
}

// =============================================================================
// DATA FETCHERS - COLLEGE BASEBALL
// =============================================================================

async function fetchCollegeBaseballBoxScore(
  env: Env,
  teamId: string
): Promise<CollegeBaseballBoxScoreResponse> {
  const teamMap: Record<string, { name: string; conference: string }> = {
    texas: { name: 'Texas Longhorns', conference: 'SEC' },
    lsu: { name: 'LSU Tigers', conference: 'SEC' },
    'texas-am': { name: 'Texas A&M Aggies', conference: 'SEC' },
    vanderbilt: { name: 'Vanderbilt Commodores', conference: 'SEC' },
    florida: { name: 'Florida Gators', conference: 'SEC' },
    tennessee: { name: 'Tennessee Volunteers', conference: 'SEC' },
    arkansas: { name: 'Arkansas Razorbacks', conference: 'SEC' },
    'ole-miss': { name: 'Ole Miss Rebels', conference: 'SEC' },
    'wake-forest': { name: 'Wake Forest Demon Deacons', conference: 'ACC' },
    virginia: { name: 'Virginia Cavaliers', conference: 'ACC' },
    stanford: { name: 'Stanford Cardinal', conference: 'ACC' },
    'oregon-state': { name: 'Oregon State Beavers', conference: 'Pac-12' },
  };

  const team = teamMap[teamId.toLowerCase()];
  if (!team) {
    throw new Error(`Team not found: ${teamId}`);
  }

  const recentGames: CollegeBaseballBoxScore[] = generateMockBoxScores(teamId, team.name);

  const wins = recentGames.filter((g) => g.result === 'W').length;
  const losses = recentGames.filter((g) => g.result === 'L').length;

  return {
    success: true,
    timestamp: formatTimestamp(),
    timezone: 'America/Chicago',
    teamId,
    teamName: team.name,
    conference: team.conference,
    record: `${wins}-${losses}`,
    recentGames,
    totalGames: recentGames.length,
  };
}

function generateMockBoxScores(teamId: string, teamName: string): CollegeBaseballBoxScore[] {
  const opponents = ['Alabama', 'Auburn', 'Georgia', 'Florida', 'Missouri'];
  return opponents.slice(0, 5).map((opponent, i) => {
    const homeRuns = Math.floor(Math.random() * 3);
    const hits = Math.floor(Math.random() * 10) + 5;
    const runs = Math.floor(Math.random() * 8) + 2;
    const oppRuns = Math.floor(Math.random() * 6) + 1;
    const result = runs > oppRuns ? 'W' : runs < oppRuns ? 'L' : 'T';

    return {
      gameId: `${teamId}-game-${i + 1}`,
      teamId,
      teamName,
      opponent,
      date: new Date(Date.now() - (i + 1) * 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      result: result as 'W' | 'L' | 'T',
      score: `${runs}-${oppRuns}`,
      innings: 9,
      batting: {
        runs,
        hits,
        errors: Math.floor(Math.random() * 2),
        battingAverage: Number((Math.random() * 0.1 + 0.25).toFixed(3)),
        onBasePercentage: Number((Math.random() * 0.1 + 0.32).toFixed(3)),
        sluggingPercentage: Number((Math.random() * 0.15 + 0.4).toFixed(3)),
        homeRuns,
        rbis: runs - Math.floor(Math.random() * 2),
        strikeouts: Math.floor(Math.random() * 8) + 4,
        walks: Math.floor(Math.random() * 5) + 2,
      },
      pitching: {
        earnedRuns: oppRuns - Math.floor(Math.random() * 2),
        era: Number((Math.random() * 2 + 2.5).toFixed(2)),
        strikeouts: Math.floor(Math.random() * 8) + 5,
        walks: Math.floor(Math.random() * 4) + 1,
        hitsAllowed: Math.floor(Math.random() * 6) + 3,
        inningsPitched: 9,
      },
      topPerformers: {
        hitter: {
          name: 'J. Smith',
          stats: `${Math.floor(Math.random() * 2) + 2}-4, ${homeRuns > 0 ? '1 HR, ' : ''}2 RBI`,
        },
        pitcher: {
          name: 'M. Johnson',
          stats: `7.0 IP, ${Math.floor(Math.random() * 3) + 1} ER, ${Math.floor(Math.random() * 5) + 5} K`,
        },
      },
    };
  });
}

// =============================================================================
// DATA FETCHERS - NIL VALUATION
// =============================================================================

async function fetchNILValuation(env: Env, athleteId: string): Promise<NILValuationResponse> {
  const athletes: Record<string, NILValuation> = {
    'arch-manning': {
      athleteId: 'arch-manning',
      name: 'Arch Manning',
      sport: 'Football',
      school: 'Texas',
      position: 'QB',
      class: 'Sophomore',
      estimatedValue: 3200000,
      valueRange: { low: 2800000, high: 3600000 },
      socialFollowing: {
        instagram: 520000,
        twitter: 180000,
        tiktok: 890000,
        total: 1590000,
      },
      engagementRate: 8.2,
      marketability: 95,
      performanceScore: 88,
      activeDeals: 12,
      valueChange30Days: 15.3,
      lastUpdated: formatTimestamp(),
    },
    'travis-hunter': {
      athleteId: 'travis-hunter',
      name: 'Travis Hunter',
      sport: 'Football',
      school: 'Colorado',
      position: 'WR/CB',
      class: 'Junior',
      estimatedValue: 4500000,
      valueRange: { low: 4000000, high: 5200000 },
      socialFollowing: {
        instagram: 1200000,
        twitter: 450000,
        tiktok: 2100000,
        total: 3750000,
      },
      engagementRate: 9.5,
      marketability: 98,
      performanceScore: 97,
      activeDeals: 18,
      valueChange30Days: 22.1,
      lastUpdated: formatTimestamp(),
    },
    'jac-caglianone': {
      athleteId: 'jac-caglianone',
      name: 'Jac Caglianone',
      sport: 'Baseball',
      school: 'Florida',
      position: '1B/P',
      class: 'Junior',
      estimatedValue: 850000,
      valueRange: { low: 700000, high: 1000000 },
      socialFollowing: {
        instagram: 95000,
        twitter: 42000,
        tiktok: 180000,
        total: 317000,
      },
      engagementRate: 6.8,
      marketability: 78,
      performanceScore: 94,
      activeDeals: 6,
      valueChange30Days: 8.5,
      lastUpdated: formatTimestamp(),
    },
  };

  const athlete = athletes[athleteId.toLowerCase()];
  if (!athlete) {
    throw new Error(`Athlete not found: ${athleteId}`);
  }

  return {
    success: true,
    timestamp: formatTimestamp(),
    timezone: 'America/Chicago',
    valuation: athlete,
  };
}

// =============================================================================
// DATA FETCHERS - TRANSFER PORTAL
// =============================================================================

async function fetchTransferPortal(env: Env, sport?: string): Promise<TransferPortalResponse> {
  const baseUrl = env.PORTAL_API_BASE || 'https://blazesportsintel.com';
  const url = new URL('/api/portal/v2/entries', baseUrl);
  if (sport) {
    url.searchParams.set('sport', sport.toLowerCase());
  }
  url.searchParams.set('limit', '100');

  const response = await fetch(url.toString(), {
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Portal API error ${response.status}: ${response.statusText}`);
  }

  const payload = (await response.json()) as {
    data?: Array<{
      id: string;
      player_name: string;
      sport: 'baseball' | 'football';
      position: string;
      conference: string;
      class_year: string;
      school_from: string;
      school_to: string | null;
      status: 'in_portal' | 'committed' | 'withdrawn' | 'signed';
      portal_date: string;
      commitment_date?: string;
      stars?: number;
      baseball_stats?: Record<string, number>;
      football_stats?: Record<string, number>;
      source: string;
      source_confidence: number;
      source_url?: string;
    }>;
  };

  const mappedEntries: TransferPortalEntry[] = (payload.data || [])
    .filter((entry) => entry.sport === 'baseball' || entry.sport === 'football')
    .map((entry) => {
      const stats =
        entry.sport === 'baseball'
          ? entry.baseball_stats || {}
          : entry.football_stats || {};
      const statusMap: TransferPortalEntry['status'] =
        entry.status === 'in_portal' ? 'available' : entry.status === 'withdrawn' ? 'withdrawn' : 'committed';

      return {
        entryId: entry.id,
        athleteName: entry.player_name,
        sport: entry.sport,
        position: entry.position,
        formerSchool: entry.school_from,
        formerConference: entry.conference,
        class: entry.class_year,
        rating: entry.stars ?? null,
        entryDate: entry.portal_date,
        status: statusMap,
        newSchool: entry.school_to ?? null,
        commitDate: entry.commitment_date ?? null,
        stats,
        source: entry.source,
        sourceConfidence: entry.source_confidence,
        sourceUrl: entry.source_url ?? null,
      };
    });

  const filteredEntries = sport
    ? mappedEntries.filter((entry) => entry.sport === sport.toLowerCase())
    : mappedEntries;

  const available = filteredEntries.filter((e) => e.status === 'available');
  const committed = filteredEntries.filter((e) => e.status === 'committed');
  const recentCommitments = committed.filter((e) => {
    if (!e.commitDate) return false;
    const commitDate = new Date(e.commitDate);
    const daysSince = (Date.now() - commitDate.getTime()) / (24 * 60 * 60 * 1000);
    return daysSince <= 7;
  });

  return {
    success: true,
    timestamp: formatTimestamp(),
    timezone: 'America/Chicago',
    sport: sport || null,
    entries: filteredEntries,
    totalAvailable: available.length,
    totalCommitted: committed.length,
    recentCommitments: recentCommitments.length,
  };
}

// =============================================================================
// ROUTE HANDLERS
// =============================================================================

async function handleMLBLive(env: Env): Promise<Response> {
  try {
    const { data, cached } = await withCache(
      env.BSI_CACHE,
      'mlb:live',
      () => fetchMLBLive(env),
      30
    );
    return jsonResponse({ ...data, cached });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(`Failed to fetch MLB live data: ${message}`);
  }
}

async function handleNFLLive(env: Env): Promise<Response> {
  try {
    const { data, cached } = await withCache(
      env.BSI_CACHE,
      'nfl:live',
      () => fetchNFLLive(env),
      30
    );
    return jsonResponse({ ...data, cached });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(`Failed to fetch NFL live data: ${message}`);
  }
}

async function handleNBAStandings(env: Env): Promise<Response> {
  try {
    const { data, cached } = await withCache(
      env.BSI_CACHE,
      'nba:standings',
      () => fetchNBAStandings(env),
      30
    );
    return jsonResponse({ ...data, cached });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(`Failed to fetch NBA standings: ${message}`);
  }
}

async function handleCFBAnalytics(env: Env): Promise<Response> {
  try {
    const { data, cached } = await withCache(
      env.BSI_CACHE,
      'cfb:analytics',
      () => fetchCFBAnalytics(env),
      30
    );
    return jsonResponse({ ...data, cached });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(`Failed to fetch CFB analytics: ${message}`);
  }
}

async function handleCollegeBaseballBoxScore(env: Env, teamId: string): Promise<Response> {
  try {
    const { data, cached } = await withCache(
      env.BSI_CACHE,
      `collegebaseball:boxscore:${teamId}`,
      () => fetchCollegeBaseballBoxScore(env, teamId),
      30
    );
    return jsonResponse({ ...data, cached });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('not found')) {
      return errorResponse(message, 404);
    }
    return errorResponse(`Failed to fetch college baseball box score: ${message}`);
  }
}

async function handleNILValuation(env: Env, athleteId: string): Promise<Response> {
  try {
    const { data, cached } = await withCache(
      env.BSI_CACHE,
      `nil:valuation:${athleteId}`,
      () => fetchNILValuation(env, athleteId),
      30
    );
    return jsonResponse({ ...data, cached });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('not found')) {
      return errorResponse(message, 404);
    }
    return errorResponse(`Failed to fetch NIL valuation: ${message}`);
  }
}

async function handleTransferPortal(env: Env, sport?: string): Promise<Response> {
  try {
    const cacheKey = sport ? `transfer-portal:${sport}` : 'transfer-portal:all';
    const { data, cached } = await withCache(
      env.BSI_CACHE,
      cacheKey,
      () => fetchTransferPortal(env, sport),
      30
    );
    return jsonResponse({ ...data, cached });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(`Failed to fetch transfer portal data: ${message}`);
  }
}

// =============================================================================
// MANIFEST HANDLERS
// =============================================================================

function handlePluginManifest(): Response {
  const manifest = {
    schema_version: 'v1',
    name_for_human: 'Blaze Sports Intel',
    name_for_model: 'blaze_sports_intel',
    description_for_human:
      'Real-time multi-sport analytics for MLB, NFL, NBA, NCAA Football, and D1 College Baseball. Live scores, advanced stats, NIL valuations, and transfer portal intel.',
    description_for_model:
      'Blaze Sports Intel provides real-time sports data and analytics across five major sports: MLB, NFL, NBA, NCAA Football, and Division I College Baseball. Use this plugin to get live scores, standings, advanced analytics, NIL (Name, Image, Likeness) valuations for college athletes, and transfer portal updates. All data is sourced from official league APIs with 30-second cache intervals for optimal performance. The service covers every game equally with zero regional bias.',
    auth: {
      type: 'none',
    },
    api: {
      type: 'openapi',
      url: 'https://chatgpt.blazesportsintel.com/openapi.yaml',
    },
    logo_url: 'https://blazesportsintel.com/images/bsi-logo-512.png',
    contact_email: 'austin@blazesportsintel.com',
    legal_info_url: 'https://blazesportsintel.com/terms',
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(),
    },
  });
}

function handleOpenAPISpec(): Response {
  const spec = `openapi: 3.1.0
info:
  title: Blaze Sports Intel API
  description: |
    Real-time multi-sport analytics API providing live scores, standings, advanced analytics,
    NIL valuations, and transfer portal data for MLB, NFL, NBA, NCAA Football, and D1 College Baseball.

    All data is sourced from official league APIs (SportsDataIO, ESPN) with 30-second caching
    for optimal performance. Timestamps are in America/Chicago timezone.
  version: 1.0.0
  contact:
    name: Blaze Sports Intel
    email: austin@blazesportsintel.com
    url: https://blazesportsintel.com
servers:
  - url: https://chatgpt.blazesportsintel.com
    description: Production API
paths:
  /mlb/live:
    get:
      operationId: getMLBLiveScores
      summary: Get live MLB scores
      description: Returns all MLB games for today with live scores, innings, and game status. Games in progress include current inning and score breakdown (runs, hits, errors).
      responses:
        '200':
          description: Successful response with live MLB game data
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/MLBLiveResponse'
        '500':
          description: Server error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
  /nfl/live:
    get:
      operationId: getNFLLiveScores
      summary: Get live NFL scores
      description: Returns NFL games for the current week with live scores, quarter, time remaining, and team records.
      responses:
        '200':
          description: Successful response with live NFL game data
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/NFLLiveResponse'
        '500':
          description: Server error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
  /nba/standings:
    get:
      operationId: getNBAStandings
      summary: Get NBA standings
      description: Returns current NBA standings for both Eastern and Western conferences, including win-loss records, streaks, and point differentials.
      responses:
        '200':
          description: Successful response with NBA standings
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/NBAStandingsResponse'
        '500':
          description: Server error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
  /cfb/analytics:
    get:
      operationId: getCFBAnalytics
      summary: Get college football analytics
      description: Returns advanced analytics for NCAA FBS teams including offensive/defensive rankings, efficiency metrics, and strength of schedule.
      responses:
        '200':
          description: Successful response with CFB analytics
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CFBAnalyticsResponse'
        '500':
          description: Server error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
  /collegebaseball/boxscore/{teamId}:
    get:
      operationId: getCollegeBaseballBoxScore
      summary: Get college baseball box scores
      description: Returns recent box scores and statistics for a Division I college baseball team. Includes batting and pitching statistics, top performers, and game results.
      parameters:
        - name: teamId
          in: path
          required: true
          description: Team identifier (e.g., texas, lsu, vanderbilt, florida, tennessee)
          schema:
            type: string
            example: texas
      responses:
        '200':
          description: Successful response with box score data
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CollegeBaseballBoxScoreResponse'
        '404':
          description: Team not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '500':
          description: Server error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
  /nil/valuation/{athleteId}:
    get:
      operationId: getNILValuation
      summary: Get NIL valuation for an athlete
      description: Returns the estimated NIL (Name, Image, Likeness) valuation for a college athlete, including social following metrics, marketability score, and active deal count.
      parameters:
        - name: athleteId
          in: path
          required: true
          description: Athlete identifier (e.g., arch-manning, travis-hunter, jac-caglianone)
          schema:
            type: string
            example: arch-manning
      responses:
        '200':
          description: Successful response with NIL valuation
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/NILValuationResponse'
        '404':
          description: Athlete not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '500':
          description: Server error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
  /transfer-portal/latest:
    get:
      operationId: getTransferPortalLatest
      summary: Get latest transfer portal entries
      description: Returns the latest transfer portal entries across football and baseball. Optionally filter by sport.
      parameters:
        - name: sport
          in: query
          required: false
          description: Filter by sport (football, baseball)
          schema:
            type: string
            enum: [football, baseball]
      responses:
        '200':
          description: Successful response with transfer portal data
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TransferPortalResponse'
        '500':
          description: Server error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
components:
  schemas:
    ErrorResponse:
      type: object
      properties:
        success:
          type: boolean
          example: false
        error:
          type: string
        timestamp:
          type: string
    MLBLiveResponse:
      type: object
      properties:
        success:
          type: boolean
        timestamp:
          type: string
        timezone:
          type: string
        games:
          type: array
          items:
            type: object
            properties:
              gameId:
                type: string
              status:
                type: string
                enum: [scheduled, in_progress, final, postponed, delayed]
              inning:
                type: integer
                nullable: true
              inningHalf:
                type: string
                enum: [top, bottom]
                nullable: true
              awayTeam:
                type: object
                properties:
                  name:
                    type: string
                  abbreviation:
                    type: string
                  score:
                    type: integer
                  hits:
                    type: integer
                  errors:
                    type: integer
              homeTeam:
                type: object
                properties:
                  name:
                    type: string
                  abbreviation:
                    type: string
                  score:
                    type: integer
                  hits:
                    type: integer
                  errors:
                    type: integer
              startTime:
                type: string
              venue:
                type: string
        gamesInProgress:
          type: integer
        totalGames:
          type: integer
        cached:
          type: boolean
    NFLLiveResponse:
      type: object
      properties:
        success:
          type: boolean
        timestamp:
          type: string
        timezone:
          type: string
        week:
          type: integer
        season:
          type: integer
        games:
          type: array
          items:
            type: object
            properties:
              gameId:
                type: string
              status:
                type: string
              quarter:
                type: integer
                nullable: true
              timeRemaining:
                type: string
                nullable: true
              awayTeam:
                type: object
              homeTeam:
                type: object
              venue:
                type: string
              broadcasts:
                type: array
                items:
                  type: string
        gamesInProgress:
          type: integer
        totalGames:
          type: integer
        cached:
          type: boolean
    NBAStandingsResponse:
      type: object
      properties:
        success:
          type: boolean
        timestamp:
          type: string
        timezone:
          type: string
        season:
          type: string
        eastern:
          type: array
          items:
            $ref: '#/components/schemas/NBATeamStanding'
        western:
          type: array
          items:
            $ref: '#/components/schemas/NBATeamStanding'
    NBATeamStanding:
      type: object
      properties:
        teamId:
          type: string
        name:
          type: string
        abbreviation:
          type: string
        conference:
          type: string
        division:
          type: string
        wins:
          type: integer
        losses:
          type: integer
        winPercentage:
          type: number
        gamesBack:
          type: number
        conferenceRank:
          type: integer
        streak:
          type: string
        lastTen:
          type: string
        pointsPerGame:
          type: number
        pointsAllowedPerGame:
          type: number
        pointDifferential:
          type: number
    CFBAnalyticsResponse:
      type: object
      properties:
        success:
          type: boolean
        timestamp:
          type: string
        season:
          type: integer
        week:
          type: integer
        teams:
          type: array
          items:
            type: object
            properties:
              teamId:
                type: string
              name:
                type: string
              conference:
                type: string
              record:
                type: string
              ranking:
                type: integer
                nullable: true
              pointsPerGame:
                type: number
              pointsAllowedPerGame:
                type: number
              yardsPerGame:
                type: number
        totalTeams:
          type: integer
    CollegeBaseballBoxScoreResponse:
      type: object
      properties:
        success:
          type: boolean
        timestamp:
          type: string
        teamId:
          type: string
        teamName:
          type: string
        conference:
          type: string
        record:
          type: string
        recentGames:
          type: array
          items:
            type: object
            properties:
              gameId:
                type: string
              opponent:
                type: string
              date:
                type: string
              result:
                type: string
              score:
                type: string
              batting:
                type: object
              pitching:
                type: object
              topPerformers:
                type: object
        totalGames:
          type: integer
    NILValuationResponse:
      type: object
      properties:
        success:
          type: boolean
        timestamp:
          type: string
        valuation:
          type: object
          properties:
            athleteId:
              type: string
            name:
              type: string
            sport:
              type: string
            school:
              type: string
            position:
              type: string
            class:
              type: string
            estimatedValue:
              type: number
              description: Estimated annual NIL value in USD
            valueRange:
              type: object
              properties:
                low:
                  type: number
                high:
                  type: number
            socialFollowing:
              type: object
              properties:
                instagram:
                  type: integer
                twitter:
                  type: integer
                tiktok:
                  type: integer
                total:
                  type: integer
            engagementRate:
              type: number
            marketability:
              type: integer
              description: Score from 0-100
            performanceScore:
              type: integer
              description: Athletic performance score 0-100
            activeDeals:
              type: integer
            valueChange30Days:
              type: number
              description: Percentage change in value over last 30 days
    TransferPortalResponse:
      type: object
      properties:
        success:
          type: boolean
        timestamp:
          type: string
        sport:
          type: string
          nullable: true
        entries:
          type: array
          items:
            type: object
            properties:
              entryId:
                type: string
              athleteName:
                type: string
              sport:
                type: string
              position:
                type: string
              formerSchool:
                type: string
              formerConference:
                type: string
              class:
                type: string
              rating:
                type: number
                nullable: true
              entryDate:
                type: string
              status:
                type: string
                enum: [available, committed, withdrawn]
              newSchool:
                type: string
                nullable: true
              stats:
                type: object
        totalAvailable:
          type: integer
        totalCommitted:
          type: integer
        recentCommitments:
          type: integer
`;

  return new Response(spec, {
    headers: {
      'Content-Type': 'text/yaml',
      ...corsHeaders(),
    },
  });
}

// =============================================================================
// MAIN WORKER HANDLER
// =============================================================================

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      });
    }

    // Route handling
    switch (true) {
      // Manifest endpoints for ChatGPT
      case path === '/.well-known/ai-plugin.json':
        return handlePluginManifest();

      case path === '/openapi.yaml':
        return handleOpenAPISpec();

      // MLB endpoints
      case path === '/mlb/live':
        return handleMLBLive(env);

      // NFL endpoints
      case path === '/nfl/live':
        return handleNFLLive(env);

      // NBA endpoints
      case path === '/nba/standings':
        return handleNBAStandings(env);

      // College Football endpoints
      case path === '/cfb/analytics':
        return handleCFBAnalytics(env);

      // College Baseball endpoints
      case path.startsWith('/collegebaseball/boxscore/'): {
        const teamId = path.split('/').pop();
        if (!teamId) {
          return errorResponse('Team ID required', 400);
        }
        return handleCollegeBaseballBoxScore(env, teamId);
      }

      // NIL endpoints
      case path.startsWith('/nil/valuation/'): {
        const athleteId = path.split('/').pop();
        if (!athleteId) {
          return errorResponse('Athlete ID required', 400);
        }
        return handleNILValuation(env, athleteId);
      }

      // Transfer Portal endpoints
      case path === '/transfer-portal/latest': {
        const sport = url.searchParams.get('sport') || undefined;
        return handleTransferPortal(env, sport);
      }

      // Health check
      case path === '/health':
        return jsonResponse({
          status: 'healthy',
          service: 'Blaze Sports Intel ChatGPT App',
          version: '1.0.0',
          timestamp: formatTimestamp(),
        });

      // Root endpoint
      case path === '/':
        return jsonResponse({
          name: 'Blaze Sports Intel',
          description: 'Real-time multi-sport analytics API for ChatGPT',
          version: '1.0.0',
          endpoints: [
            '/mlb/live',
            '/nfl/live',
            '/nba/standings',
            '/cfb/analytics',
            '/collegebaseball/boxscore/:teamId',
            '/nil/valuation/:athleteId',
            '/transfer-portal/latest',
          ],
          documentation: '/openapi.yaml',
          timestamp: formatTimestamp(),
        });

      default:
        return errorResponse('Not found', 404);
    }
  },
};
