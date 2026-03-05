/**
 * College Baseball Sabermetrics MCP Server
 *
 * JSON-RPC 2.0 MCP endpoint + REST API for college baseball data.
 * Primary data: Highlightly API (330 D1 teams, venue, predictions).
 * Fallback: ESPN direct + BSI main worker proxy.
 *
 * Routes:
 *   GET  /health              — liveness check
 *   POST /mcp                 — JSON-RPC 2.0 MCP endpoint
 *   GET  /v1/scoreboard       — live scores (Highlightly primary)
 *   GET  /v1/standings        — conference standings (Highlightly primary)
 *   GET  /v1/rankings         — national rankings (ESPN direct)
 *   GET  /v1/players          — player search + stats (BSI proxy)
 *   GET  /v1/teams/:t/stats   — team sabermetrics (BSI proxy)
 *   GET  /v1/teams/:t/schedule — team schedule (ESPN direct)
 *   GET  /v1/leaderboard      — stat leaders (BSI + ESPN)
 *   GET  /v1/power-index      — conference strength (Highlightly + ESPN)
 *   GET  /v1/matches/:id      — match detail with venue + predictions (Highlightly)
 *
 * Deploy: wrangler deploy --config workers/college-baseball-mcp/wrangler.toml
 */

export interface Env {
  BSI_API_KEY?: string;
  RATE_LIMIT_KV?: KVNamespace;
  TEAM_STATS_KV?: KVNamespace;
  HIGHLIGHTLY_API_KEY?: string;
  SPORTSDATAIO_API_KEY?: string;
  BSI_WORKER?: Fetcher;
}

// ─── Constants ───────────────────────────────────────────────────────────────

/** site/v2 — rankings, scoreboard, teams, schedule */
const ESPN_BASE =
  'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball';

/** v2 — standings (different from site/v2; returns real win/loss data) */
const ESPN_V2_BASE =
  'https://site.api.espn.com/apis/v2/sports/baseball/college-baseball';

/** Highlightly direct API (requires RapidAPI headers) */
const HL_BASE = 'https://baseball.highlightly.net';
const HL_HOST = 'mlb-college-baseball-api.p.rapidapi.com';

const RATE_LIMIT_WINDOW_S = 60;
const RATE_LIMIT_MAX = 30;

/** Baseball-specific ESPN IDs — NOT the general NCAA logoId */
const TEAM_IDS: Record<string, string> = {
  texas: '126', lsu: '85', florida: '75', tennessee: '199',
  vanderbilt: '120', arkansas: '58', 'ole-miss': '92', auburn: '55',
  alabama: '148', 'mississippi-state': '150', georgia: '78',
  'south-carolina': '193', kentucky: '82', missouri: '91',
  'texas-am': '123', oklahoma: '112',
  tcu: '198', 'texas-tech': '201', 'oklahoma-state': '110',
  baylor: '121', 'west-virginia': '136', 'kansas-state': '264',
  arizona: '60', 'arizona-state': '59',
  ucla: '66', usc: '68',
  'wake-forest': '97', virginia: '131', 'nc-state': '95',
  clemson: '117', 'florida-state': '72', miami: '176',
  louisville: '83', duke: '93', 'north-carolina': '96',
  stanford: '64', 'notre-dame': '81', 'georgia-tech': '77',
  'boston-college': '86', california: '65', 'oregon-state': '113',
  oregon: '115', 'virginia-tech': '433', pittsburgh: '439',
  wisconsin: '132', minnesota: '127', indiana: '161',
  michigan: '334', illinois: '124', iowa: '373',
  maryland: '168', nebraska: '160', purdue: '128',
  'ohio-state': '728', 'penn-state': '750', rutgers: '153',
  'michigan-state': '684',
};

/**
 * ESPN ID → conference. ESPN's college baseball standings are flat (no conference grouping),
 * so we map locally. Built from team-metadata.ts — covers all D1 conferences (~240 teams).
 */
const ESPN_ID_TO_CONF: Record<string, string> = {
  // SEC (16)
  '126': 'SEC', '85': 'SEC', '75': 'SEC', '199': 'SEC', '120': 'SEC',
  '58': 'SEC', '92': 'SEC', '55': 'SEC', '148': 'SEC', '150': 'SEC',
  '78': 'SEC', '193': 'SEC', '82': 'SEC', '91': 'SEC', '123': 'SEC',
  '112': 'SEC',
  // ACC (18)
  '97': 'ACC', '131': 'ACC', '95': 'ACC', '117': 'ACC', '72': 'ACC',
  '176': 'ACC', '83': 'ACC', '93': 'ACC', '96': 'ACC', '64': 'ACC',
  '81': 'ACC', '77': 'ACC', '86': 'ACC', '65': 'ACC', '113': 'ACC',
  '115': 'ACC', '433': 'ACC', '439': 'ACC',
  // Big 12 (10)
  '198': 'Big 12', '201': 'Big 12', '110': 'Big 12', '121': 'Big 12',
  '136': 'Big 12', '264': 'Big 12', '60': 'Big 12', '59': 'Big 12',
  '66': 'Big 12', '68': 'Big 12',
  // Big Ten (13) — baseball-specific IDs
  '132': 'Big Ten', '127': 'Big Ten', '161': 'Big Ten', '334': 'Big Ten',
  '124': 'Big Ten', '373': 'Big Ten', '168': 'Big Ten', '160': 'Big Ten',
  '128': 'Big Ten', '728': 'Big Ten', '750': 'Big Ten', '153': 'Big Ten',
  '684': 'Big Ten',
  // Big Ten — general school IDs (ESPN standings uses these instead of baseball IDs)
  '294': 'Big Ten', '167': 'Big Ten', '87': 'Big Ten', '88': 'Big Ten',
  '89': 'Big Ten', '90': 'Big Ten', '99': 'Big Ten', '411': 'Big Ten',
  '108': 'Big Ten', '273': 'Big Ten', '414': 'Big Ten', '189': 'Big Ten',
  '102': 'Big Ten', '133': 'Big Ten',
  // AAC (10)
  '76': 'AAC', '94': 'AAC', '119': 'AAC', '122': 'AAC', '163': 'AAC',
  '180': 'AAC', '203': 'AAC', '206': 'AAC', '297': 'AAC', '447': 'AAC',
  // Sun Belt (14)
  '57': 'Sun Belt', '129': 'Sun Belt', '138': 'Sun Belt', '140': 'Sun Belt',
  '144': 'Sun Belt', '146': 'Sun Belt', '147': 'Sun Belt', '192': 'Sun Belt',
  '269': 'Sun Belt', '271': 'Sun Belt', '272': 'Sun Belt', '320': 'Sun Belt',
  '358': 'Sun Belt', '384': 'Sun Belt',
  // CUSA (10)
  '84': 'CUSA', '103': 'CUSA', '164': 'CUSA', '172': 'CUSA', '173': 'CUSA',
  '177': 'CUSA', '190': 'CUSA', '197': 'CUSA', '263': 'CUSA', '339': 'CUSA',
  // Mountain West (9)
  '21': 'Mountain West', '63': 'Mountain West', '104': 'Mountain West',
  '134': 'Mountain West', '155': 'Mountain West', '182': 'Mountain West',
  '183': 'Mountain West', '278': 'Mountain West', '360': 'Mountain West',
  // WAC (7)
  '125': 'WAC', '314': 'WAC', '315': 'WAC', '455': 'WAC',
  '1105': 'WAC', '1145': 'WAC', '1146': 'WAC',
  // WCC (10)
  '143': 'WCC', '174': 'WCC', '187': 'WCC', '267': 'WCC', '287': 'WCC',
  '413': 'WCC', '416': 'WCC', '426': 'WCC', '427': 'WCC', '428': 'WCC',
  // A-10 (12)
  '71': 'A-10', '105': 'A-10', '130': 'A-10', '166': 'A-10', '204': 'A-10',
  '300': 'A-10', '337': 'A-10', '338': 'A-10', '354': 'A-10', '376': 'A-10',
  '422': 'A-10', '425': 'A-10',
  // ASUN (12)
  '73': 'ASUN', '74': 'ASUN', '139': 'ASUN', '156': 'ASUN', '296': 'ASUN',
  '307': 'ASUN', '348': 'ASUN', '378': 'ASUN', '1103': 'ASUN', '1143': 'ASUN',
  '1238': 'ASUN', '129699': 'ASUN',
  // Big East (8)
  '69': 'Big East', '98': 'Big East', '195': 'Big East', '268': 'Big East',
  '312': 'Big East', '326': 'Big East', '357': 'Big East', '458': 'Big East',
  // CAA (11)
  '118': 'CAA', '152': 'CAA', '178': 'CAA', '196': 'CAA', '289': 'CAA',
  '293': 'CAA', '303': 'CAA', '305': 'CAA', '365': 'CAA', '401': 'CAA',
  '405': 'CAA',
  // Southern (8)
  '181': 'Southern', '202': 'Southern', '205': 'Southern', '208': 'Southern',
  '274': 'Southern', '295': 'Southern', '304': 'Southern', '459': 'Southern',
  // Southland (11)
  '170': 'Southland', '184': 'Southland', '186': 'Southland', '309': 'Southland',
  '367': 'Southland', '371': 'Southland', '387': 'Southland', '399': 'Southland',
  '438': 'Southland', '443': 'Southland', '932': 'Southland',
  // Missouri Valley (9)
  '80': 'Missouri Valley', '149': 'Missouri Valley', '262': 'Missouri Valley',
  '288': 'Missouri Valley', '302': 'Missouri Valley', '308': 'Missouri Valley',
  '324': 'Missouri Valley', '394': 'Missouri Valley', '432': 'Missouri Valley',
  // Big West (11)
  '61': 'Big West', '67': 'Big West', '79': 'Big West', '141': 'Big West',
  '142': 'Big West', '165': 'Big West', '185': 'Big West', '290': 'Big West',
  '327': 'Big West', '448': 'Big West', '1147': 'Big West',
  // Big South (9)
  '207': 'Big South', '329': 'Big South', '356': 'Big South', '364': 'Big South',
  '380': 'Big South', '418': 'Big South', '421': 'Big South', '452': 'Big South',
  '453': 'Big South',
  // America East (7)
  '154': 'America East', '259': 'America East', '292': 'America East',
  '299': 'America East', '395': 'America East', '449': 'America East',
  '450': 'America East',
  // Summit (6)
  '111': 'Summit', '301': 'Summit', '310': 'Summit', '396': 'Summit',
  '407': 'Summit', '850': 'Summit',
  // Patriot League (6)
  '145': 'Patriot League', '151': 'Patriot League', '179': 'Patriot League',
  '313': 'Patriot League', '366': 'Patriot League', '377': 'Patriot League',
  // Horizon (5)
  '135': 'Horizon', '209': 'Horizon', '270': 'Horizon', '410': 'Horizon',
  '412': 'Horizon',
};

/** ESPN group IDs (not used for standings — kept for potential future use) */
const CONFERENCE_IDS: Record<string, number> = {
  sec: 8, acc: 2, 'big 12': 4, 'big 10': 5, 'big ten': 5,
  'pac-12': 9, 'pac 12': 9, aac: 62, american: 62, 'sun belt': 37,
  cusa: 11, 'conference usa': 11, 'c-usa': 11, 'mountain west': 44,
  mwc: 44, wac: 30, wcc: 46, 'a-10': 3, asun: 114, 'big east': 6,
  caa: 10, southern: 29, southland: 26, 'missouri valley': 18,
  'big west': 7, 'big south': 40, 'america east': 1, summit: 49,
  'patriot league': 22, horizon: 45,
};

/**
 * Highlightly displayName → conference. Used to group Highlightly's flat
 * standings into conferences. Covers Power 4 + major mid-major conferences.
 * Teams not listed here fall back to "Other" grouping.
 */
const DISPLAY_NAME_TO_CONF: Record<string, string> = {
  // SEC (16)
  'Texas': 'SEC', 'Texas Longhorns': 'SEC', 'LSU': 'SEC',
  'Florida': 'SEC', 'Tennessee': 'SEC', 'Vanderbilt': 'SEC',
  'Arkansas': 'SEC', 'Ole Miss': 'SEC', 'Auburn': 'SEC',
  'Alabama': 'SEC', 'Mississippi State': 'SEC', 'Georgia': 'SEC',
  'South Carolina': 'SEC', 'Kentucky': 'SEC', 'Missouri': 'SEC',
  'Texas A&M': 'SEC', 'Oklahoma': 'SEC',
  // ACC (18)
  'Wake Forest': 'ACC', 'Virginia': 'ACC', 'NC State': 'ACC',
  'Clemson': 'ACC', 'Florida State': 'ACC', 'Miami': 'ACC',
  'Louisville': 'ACC', 'Duke': 'ACC', 'North Carolina': 'ACC',
  'Stanford': 'ACC', 'Notre Dame': 'ACC', 'Georgia Tech': 'ACC',
  'Boston College': 'ACC', 'California': 'ACC', 'Oregon State': 'ACC',
  'Oregon': 'ACC', 'Virginia Tech': 'ACC', 'Pittsburgh': 'ACC', 'Pitt': 'ACC',
  'SMU': 'ACC',
  // Big 12 (16)
  'TCU': 'Big 12', 'Texas Tech': 'Big 12', 'Oklahoma State': 'Big 12',
  'Baylor': 'Big 12', 'West Virginia': 'Big 12', 'Kansas State': 'Big 12',
  'Arizona': 'Big 12', 'Arizona State': 'Big 12', 'UCLA': 'Big 12',
  'USC': 'Big 12', 'BYU': 'Big 12', 'Cincinnati': 'Big 12',
  'Houston': 'Big 12', 'UCF': 'Big 12', 'Iowa State': 'Big 12',
  'Kansas': 'Big 12', 'Colorado': 'Big 12',
  // Big Ten (13)
  'Wisconsin': 'Big Ten', 'Minnesota': 'Big Ten', 'Indiana': 'Big Ten',
  'Michigan': 'Big Ten', 'Illinois': 'Big Ten', 'Iowa': 'Big Ten',
  'Maryland': 'Big Ten', 'Nebraska': 'Big Ten', 'Purdue': 'Big Ten',
  'Ohio State': 'Big Ten', 'Penn State': 'Big Ten', 'Rutgers': 'Big Ten',
  'Michigan State': 'Big Ten', 'Northwestern': 'Big Ten',
  // AAC (10)
  'East Carolina': 'AAC', 'Wichita State': 'AAC', 'Tulane': 'AAC',
  'Memphis': 'AAC', 'Charlotte': 'AAC', 'Rice': 'AAC',
  'South Florida': 'AAC', 'UAB': 'AAC', 'UTSA': 'AAC',
  'North Texas': 'AAC', 'Temple': 'AAC', 'Navy': 'AAC',
  'Tulsa': 'AAC', 'FAU': 'AAC',
  // Sun Belt (14)
  'South Alabama': 'Sun Belt', 'Texas State': 'Sun Belt', 'Troy': 'Sun Belt',
  'Louisiana': 'Sun Belt', 'Coastal Carolina': 'Sun Belt',
  'Georgia Southern': 'Sun Belt', 'Appalachian State': 'Sun Belt',
  'Arkansas State': 'Sun Belt', 'ULM': 'Sun Belt', 'Southern Miss': 'Sun Belt',
  'Marshall': 'Sun Belt', 'James Madison': 'Sun Belt',
  'Old Dominion': 'Sun Belt', 'Georgia State': 'Sun Belt',
  'Louisiana-Monroe': 'Sun Belt', 'App State': 'Sun Belt',
  // CUSA (10)
  'Liberty': 'CUSA', 'Sam Houston': 'CUSA', 'Sam Houston State': 'CUSA',
  'Louisiana Tech': 'CUSA', 'Western Kentucky': 'CUSA',
  'Middle Tennessee': 'CUSA', 'FIU': 'CUSA', 'NMSU': 'CUSA',
  'New Mexico State': 'CUSA', 'Jacksonville State': 'CUSA',
  'Kennesaw State': 'CUSA',
  // Mountain West (9)
  'San Diego State': 'Mountain West', 'Fresno State': 'Mountain West',
  'Nevada': 'Mountain West', 'New Mexico': 'Mountain West',
  'UNLV': 'Mountain West', 'Air Force': 'Mountain West',
  'San José State': 'Mountain West', 'San Jose State': 'Mountain West',
  'Utah State': 'Mountain West',
  // WCC (10)
  'Gonzaga': 'WCC', 'San Diego': 'WCC', 'Pepperdine': 'WCC',
  'Santa Clara': 'WCC', 'San Francisco': 'WCC', 'Portland': 'WCC',
  'Loyola Marymount': 'WCC', "Saint Mary's": 'WCC',
  'Pacific': 'WCC',
  // ASUN (12)
  'Jacksonville': 'ASUN', 'Stetson': 'ASUN', 'Lipscomb': 'ASUN',
  'Bellarmine': 'ASUN', 'Central Arkansas': 'ASUN',
  'Eastern Kentucky': 'ASUN', 'North Alabama': 'ASUN',
  'Queens': 'ASUN', 'Austin Peay': 'ASUN',
  // Big East (8)
  'Connecticut': 'Big East', 'UConn': 'Big East', 'Creighton': 'Big East',
  "St. John's": 'Big East', 'Xavier': 'Big East', 'Seton Hall': 'Big East',
  'Georgetown': 'Big East', 'Butler': 'Big East', 'Villanova': 'Big East',
  'Providence': 'Big East', 'Marquette': 'Big East',
  // WAC
  'Grand Canyon': 'WAC', 'Utah Valley': 'WAC', 'Tarleton State': 'WAC',
  'Abilene Christian': 'WAC', 'Seattle': 'WAC', 'UTRGV': 'WAC',
  'Stephen F. Austin': 'WAC', 'California Baptist': 'WAC', 'Cal Baptist': 'WAC',
  'Lamar': 'WAC', 'SFA': 'WAC',
  // A-10
  'George Mason': 'A-10', 'George Washington': 'A-10', 'VCU': 'A-10',
  'Fordham': 'A-10', 'Dayton': 'A-10', 'Davidson': 'A-10',
  'La Salle': 'A-10', 'Saint Louis': 'A-10', 'Rhode Island': 'A-10',
  'Massachusetts': 'A-10', 'UMass': 'A-10', "Saint Joseph's": 'A-10',
  'Duquesne': 'A-10',
  // CAA
  'Elon': 'CAA', 'UNCW': 'CAA', 'UNC Wilmington': 'CAA',
  'William & Mary': 'CAA', 'Hofstra': 'CAA', 'Delaware': 'CAA',
  'Drexel': 'CAA', 'Northeastern': 'CAA', 'Towson': 'CAA',
  'Stony Brook': 'CAA', 'Hampton': 'CAA', 'Campbell': 'CAA',
  'Monmouth': 'CAA',
  // Missouri Valley
  'Dallas Baptist': 'Missouri Valley', 'DBU': 'Missouri Valley',
  'Indiana State': 'Missouri Valley', 'Illinois State': 'Missouri Valley',
  'Southern Illinois': 'Missouri Valley', 'Evansville': 'Missouri Valley',
  'Bradley': 'Missouri Valley', 'Missouri State': 'Missouri Valley',
  'Valparaiso': 'Missouri Valley', 'Belmont': 'Missouri Valley',
  'Murray State': 'Missouri Valley', 'Eastern Illinois': 'Missouri Valley',
  // Big West
  'Cal Poly': 'Big West', 'Long Beach State': 'Big West',
  'UC Santa Barbara': 'Big West', 'UC Irvine': 'Big West',
  'UC Riverside': 'Big West', 'Cal State Fullerton': 'Big West',
  'Cal State Northridge': 'Big West', 'CSUN': 'Big West',
  'UC San Diego': 'Big West', "Hawai'i": 'Big West',
  'UC Davis': 'Big West', 'Cal State Bakersfield': 'Big West',
  // Big South
  'High Point': 'Big South', 'Presbyterian': 'Big South',
  'Radford': 'Big South', 'Longwood': 'Big South', 'Winthrop': 'Big South',
  'Gardner-Webb': 'Big South', 'UNC Asheville': 'Big South',
  'Charleston Southern': 'Big South',
  // Southern Conference
  'Mercer': 'Southern', 'VMI': 'Southern', 'Western Carolina': 'Southern',
  'East Tennessee State': 'Southern', 'ETSU': 'Southern',
  'Furman': 'Southern', 'Samford': 'Southern', 'The Citadel': 'Southern',
  'Wofford': 'Southern',
  // Southland
  'McNeese': 'Southland', 'McNeese State': 'Southland',
  'Nicholls': 'Southland', 'Nicholls State': 'Southland',
  'Texas A&M-Corpus Christi': 'Southland', 'Texas A&M-CC': 'Southland',
  'Northwestern State': 'Southland', 'Houston Baptist': 'Southland',
  'New Orleans': 'Southland', 'Incarnate Word': 'Southland',
  'UIW': 'Southland', 'Southeastern Louisiana': 'Southland',
  // America East
  'Albany': 'America East', 'UAlbany': 'America East',
  'Binghamton': 'America East', 'Hartford': 'America East',
  'Maine': 'America East', 'UMBC': 'America East',
  'New Hampshire': 'America East', 'Vermont': 'America East',
  // Summit League
  'Oral Roberts': 'Summit', 'North Dakota State': 'Summit',
  'South Dakota State': 'Summit', 'Kansas City': 'Summit',
  'Denver': 'Summit', 'Western Illinois': 'Summit',
  'Omaha': 'Summit', 'St. Thomas': 'Summit',
  // Patriot League
  'Army': 'Patriot League', 'Lehigh': 'Patriot League',
  'Bucknell': 'Patriot League', 'Lafayette': 'Patriot League',
  'Holy Cross': 'Patriot League', 'Boston University': 'Patriot League',
  'Colgate': 'Patriot League',
  // Horizon League
  'Wright State': 'Horizon', 'Northern Kentucky': 'Horizon',
  'Milwaukee': 'Horizon', 'Ball State': 'Horizon', 'Oakland': 'Horizon',
  'Northern Illinois': 'Horizon', 'Illinois-Chicago': 'Horizon',
  'UIC': 'Horizon', 'Youngstown State': 'Horizon',
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface Meta {
  source: string;
  fetched_at: string;
  timezone: string;
}

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

// ─── Utility Functions ───────────────────────────────────────────────────────

function makeMeta(source: string): Meta {
  return {
    source,
    fetched_at: new Date().toISOString(),
    timezone: 'America/Chicago',
  };
}

function rpcOk(id: string | number | null, result: unknown): JsonRpcResponse {
  return { jsonrpc: '2.0', id, result };
}

function rpcErr(
  id: string | number | null,
  code: number,
  message: string,
  data?: unknown
): JsonRpcResponse {
  return { jsonrpc: '2.0', id, error: { code, message, data } };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

function errorResponse(msg: string, status: number): Response {
  return jsonResponse(
    { error: msg, status, request_id: crypto.randomUUID() },
    status
  );
}

/** Fetch ESPN with 8s timeout. Use base='v2' for standings endpoint. */
async function espnFetch(path: string, base: 'site' | 'v2' = 'site'): Promise<unknown> {
  const root = base === 'v2' ? ESPN_V2_BASE : ESPN_BASE;
  const url = `${root}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'BSI-MCP/3.0' },
    });
    if (!res.ok) {
      throw new Error(`ESPN ${res.status} for ${path}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Fetch Highlightly API via RapidAPI proxy.
 * Requires HIGHLIGHTLY_API_KEY secret (RapidAPI key).
 * Direct URL (baseball.highlightly.net) with RapidAPI headers.
 */
async function hlFetch(path: string, env: Env): Promise<unknown> {
  if (!env.HIGHLIGHTLY_API_KEY) {
    throw new Error('HIGHLIGHTLY_API_KEY not configured');
  }

  const url = `${HL_BASE}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'x-rapidapi-key': env.HIGHLIGHTLY_API_KEY,
        'x-rapidapi-host': HL_HOST,
        'User-Agent': 'BSI-MCP/3.0',
      },
    });
    if (!res.ok) {
      throw new Error(`Highlightly ${res.status} for ${path}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Resolve Highlightly team displayName → conference using the DISPLAY_NAME_TO_CONF map.
 * Tries exact match first, then partial match for common variations.
 */
function resolveConference(displayName: string): string {
  if (DISPLAY_NAME_TO_CONF[displayName]) return DISPLAY_NAME_TO_CONF[displayName];

  // Try without common suffixes/prefixes
  const normalized = displayName
    .replace(/\s*(Longhorns|Tigers|Gators|Volunteers|Commodores|Razorbacks|Rebels|Bulldogs|Crimson Tide|Wildcats|Aggies|Sooners|Horned Frogs|Red Raiders|Cowboys|Bears|Mountaineers|Sun Devils|Bruins|Trojans|Cougars|Bearcats|Knights|Cyclones|Jayhawks|Buffaloes)\s*$/i, '')
    .trim();
  if (normalized && DISPLAY_NAME_TO_CONF[normalized]) return DISPLAY_NAME_TO_CONF[normalized];

  return 'Other';
}

/** KV cache wrapper — check cache, run fetcher on miss, store result */
async function kvCached<T>(
  env: Env,
  key: string,
  ttl: number,
  fetcher: () => Promise<T>
): Promise<T> {
  if (env.TEAM_STATS_KV) {
    const cached = await env.TEAM_STATS_KV.get(key);
    if (cached) {
      try {
        return JSON.parse(cached) as T;
      } catch {
        // corrupt cache — fall through
      }
    }
  }

  const data = await fetcher();

  if (env.TEAM_STATS_KV) {
    await env.TEAM_STATS_KV.put(key, JSON.stringify(data), {
      expirationTtl: ttl,
    });
  }

  return data;
}

/** Proxy fetch to BSI's main worker via service binding (or HTTP fallback) */
async function bsiFetch(path: string, env: Env): Promise<unknown> {
  const url = `https://blazesportsintel.com${path}`;
  let res: Response;

  if (env.BSI_WORKER) {
    res = await env.BSI_WORKER.fetch(
      new Request(url, { headers: { 'User-Agent': 'BSI-MCP/3.0' } })
    );
  } else {
    res = await fetch(url, { headers: { 'User-Agent': 'BSI-MCP/3.0' } });
  }

  if (!res.ok) {
    throw new Error(`BSI ${res.status} ${res.statusText} for ${path}`);
  }

  return await res.json();
}

/**
 * Build Highlightly team ID → displayName map from the teams endpoint.
 * Cached in KV for 24h to avoid repeated team list fetches.
 */
async function getHlTeamMap(env: Env): Promise<Record<string, string>> {
  return kvCached(env, 'hl:team-map', 86400, async () => {
    const data = (await hlFetch('/teams?league=NCAA', env)) as
      | { data: Array<{ id: number; displayName: string }> }
      | Array<{ id: number; displayName: string }>;

    const teams = Array.isArray(data) ? data : data.data ?? [];
    const map: Record<string, string> = {};
    for (const t of teams) {
      map[String(t.id)] = t.displayName;
    }
    return map;
  });
}

// ─── Auth + Rate Limiting ────────────────────────────────────────────────────

function extractBearer(req: Request): string | null {
  const auth =
    req.headers.get('Authorization') ?? req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  return auth.slice(7).trim();
}

function validateAuth(req: Request, env: Env): boolean {
  if (!env.BSI_API_KEY) return true;
  const token = extractBearer(req);
  return token === env.BSI_API_KEY;
}

async function checkRateLimit(token: string, env: Env): Promise<boolean> {
  if (!env.RATE_LIMIT_KV) return true;

  const key = `rl:${token}:${Math.floor(Date.now() / (RATE_LIMIT_WINDOW_S * 1000))}`;
  const raw = await env.RATE_LIMIT_KV.get(key);
  const count = raw ? parseInt(raw, 10) : 0;

  if (count >= RATE_LIMIT_MAX) return false;

  await env.RATE_LIMIT_KV.put(key, String(count + 1), {
    expirationTtl: RATE_LIMIT_WINDOW_S * 2,
  });
  return true;
}

// ─── Slug Resolution ─────────────────────────────────────────────────────────

function resolveTeamSlug(input: string): string {
  return input.toLowerCase().trim().replace(/\s+/g, '-');
}

function resolveEspnId(slug: string): string | null {
  return TEAM_IDS[slug] ?? null;
}

// ─── Handler: Scoreboard (Highlightly primary → BSI fallback → ESPN fallback)

async function handleScoreboard(
  args: { date?: string; conference?: string },
  env: Env
): Promise<unknown> {
  const qs = new URLSearchParams();
  if (args.date) qs.set('date', args.date);
  if (args.conference) qs.set('conference', args.conference);
  const query = qs.toString() ? `?${qs}` : '';
  const confFilter = args.conference?.toLowerCase().trim();

  return kvCached(env, `scoreboard:${query}`, 60, async () => {
    // Highlightly primary — 330 D1 teams, venue, predictions
    if (env.HIGHLIGHTLY_API_KEY) {
      try {
        const dateParam = args.date ?? new Date().toISOString().split('T')[0];
        const hlData = (await hlFetch(`/matches?league=NCAA&date=${dateParam}`, env)) as
          | { data: Array<Record<string, unknown>> }
          | Array<Record<string, unknown>>;

        const matches = Array.isArray(hlData) ? hlData : hlData.data ?? [];

        // Map Highlightly matches to a clean scoreboard format
        let games = matches.map((m) => {
          const homeTeam = m.homeTeam as Record<string, unknown>;
          const awayTeam = m.awayTeam as Record<string, unknown>;
          const state = m.state as Record<string, unknown>;
          const score = state?.score as Record<string, unknown>;
          const homeScore = score?.home as Record<string, unknown>;
          const awayScore = score?.away as Record<string, unknown>;
          const venue = m.venue as Record<string, unknown>;

          // Parse run scores from "away - home" current score string (e.g. "10 - 7")
          const currentScoreStr = (score?.current as string) ?? '';
          const scoreParts = currentScoreStr.split(' - ');
          const awayRuns = scoreParts.length === 2 ? parseInt(scoreParts[0].trim(), 10) : NaN;
          const homeRuns = scoreParts.length === 2 ? parseInt(scoreParts[1].trim(), 10) : NaN;

          return {
            id: m.id,
            date: m.date,
            status: (state?.description as string) ?? 'Unknown',
            statusDetail: (state?.report as string) ?? '',
            home: {
              id: homeTeam?.id,
              name: (homeTeam?.displayName as string) ?? '',
              abbreviation: (homeTeam?.abbreviation as string) ?? '',
              logo: (homeTeam?.logo as string) ?? '',
              score: isNaN(homeRuns) ? null : homeRuns,
              hits: (homeScore?.hits as number) ?? 0,
              errors: (homeScore?.errors as number) ?? 0,
              innings: (homeScore?.innings as unknown[]) ?? [],
            },
            away: {
              id: awayTeam?.id,
              name: (awayTeam?.displayName as string) ?? '',
              abbreviation: (awayTeam?.abbreviation as string) ?? '',
              logo: (awayTeam?.logo as string) ?? '',
              score: isNaN(awayRuns) ? null : awayRuns,
              hits: (awayScore?.hits as number) ?? 0,
              errors: (awayScore?.errors as number) ?? 0,
              innings: (awayScore?.innings as unknown[]) ?? [],
            },
            currentScore: currentScoreStr,
            venue: venue
              ? {
                  name: (venue.name as string) ?? '',
                  city: (venue.city as string) ?? '',
                  state: (venue.state as string) ?? '',
                }
              : null,
            round: (m.round as string) ?? '',
          };
        });

        // Conference filter: match team displayName to conference
        if (confFilter) {
          games = games.filter((g) => {
            const homeConf = resolveConference(g.home.name);
            const awayConf = resolveConference(g.away.name);
            return (
              homeConf.toLowerCase() === confFilter ||
              awayConf.toLowerCase() === confFilter
            );
          });
        }

        return {
          games,
          date: args.date ?? new Date().toISOString().split('T')[0],
          count: games.length,
          meta: makeMeta('highlightly'),
        };
      } catch {
        // Highlightly failed — fall through to BSI proxy
      }
    }

    // BSI proxy fallback
    try {
      return await bsiFetch(`/api/college-baseball/scores${query}`, env);
    } catch {
      // BSI also failed — fall through to ESPN
    }

    // ESPN last resort
    const dateParam = args.date ? args.date.replace(/-/g, '') : '';
    const espnPath = dateParam
      ? `/scoreboard?dates=${dateParam}`
      : '/scoreboard';
    const data = (await espnFetch(espnPath)) as Record<string, unknown>;
    const events = (data.events as Array<Record<string, unknown>>) ?? [];

    return {
      games: events.map((e) => ({
        id: e.id,
        name: e.name,
        shortName: e.shortName,
        status: (e.status as Record<string, unknown>)?.type,
        competitions: e.competitions,
      })),
      meta: makeMeta('espn-fallback'),
    };
  });
}

// ─── Handler: Standings (Highlightly primary → ESPN fallback) ────────────────

interface StandingsEntry {
  team: string;
  abbreviation: string;
  logo: string;
  wins: number;
  losses: number;
  winPct: number;
  confWins: number;
  confLosses: number;
  runsScored: number;
  runsAllowed: number;
  runDiff: string;
  streak: string;
  gamesBack: string;
  gamesPlayed: number;
  record: string;
}

async function handleStandings(
  args: { conference?: string },
  env: Env
): Promise<unknown> {
  const confFilter = args.conference?.trim() ?? 'all';

  return kvCached(env, `standings:${confFilter.toLowerCase()}`, 3600, async () => {
    // Try Highlightly first — richer stats (RS, RA, DIFF, STRK, GB)
    if (env.HIGHLIGHTLY_API_KEY) {
      try {
        const hlData = (await hlFetch('/standings?abbreviation=NCAA', env)) as
          | { data: Array<Record<string, unknown>> }
          | Record<string, unknown>;

        // Highlightly wraps in {data: [{leagueName, abbreviation, data: [...teams]}]}
        let teams: Array<Record<string, unknown>> = [];
        if (hlData && typeof hlData === 'object' && 'data' in hlData) {
          const outer = (hlData as { data: unknown[] }).data;
          if (Array.isArray(outer) && outer.length > 0) {
            const league = outer[0] as Record<string, unknown>;
            teams = (league.data as Array<Record<string, unknown>>) ?? [];
          }
        }

        if (teams.length > 0) {
          // Build ID → displayName map for conference resolution
          let teamMap: Record<string, string> = {};
          try {
            teamMap = await getHlTeamMap(env);
          } catch {
            // If team map fetch fails, use name field directly
          }

          // Parse Highlightly standings stats
          const parseStat = (
            stats: Array<Record<string, unknown>>,
            abbr: string
          ): string => {
            const s = stats.find((st) => st.abbreviation === abbr);
            return (s?.displayValue as string) ?? '0';
          };

          const allTeams: (StandingsEntry & { conference: string })[] = teams.map(
            (t) => {
              const stats = (t.stats as Array<Record<string, unknown>>) ?? [];
              const hlId = String(t.id ?? '');
              const displayName = teamMap[hlId] || (t.name as string) || 'Unknown';

              return {
                team: displayName,
                abbreviation: '', // Highlightly standings don't include abbreviation
                logo: (t.logo as string) ?? '',
                wins: parseInt(parseStat(stats, 'W'), 10) || 0,
                losses: parseInt(parseStat(stats, 'L'), 10) || 0,
                winPct: (() => {
                  const p = parseStat(stats, 'PCT');
                  return parseFloat(p.startsWith('.') ? '0' + p : p) || 0;
                })(),
                confWins: 0,
                confLosses: 0,
                runsScored: parseInt(parseStat(stats, 'RS'), 10) || 0,
                runsAllowed: parseInt(parseStat(stats, 'RA'), 10) || 0,
                runDiff: parseStat(stats, 'DIFF'),
                streak: parseStat(stats, 'STRK'),
                gamesBack: parseStat(stats, 'GB'),
                gamesPlayed: parseInt(parseStat(stats, 'GP'), 10) || 0,
                record: parseStat(stats, 'Total'),
                conference: resolveConference(displayName),
              };
            }
          );

          // Group by conference
          const grouped = new Map<string, (StandingsEntry & { conference: string })[]>();
          for (const t of allTeams) {
            if (!grouped.has(t.conference)) grouped.set(t.conference, []);
            grouped.get(t.conference)!.push(t);
          }

          // Filter
          const confFilterNorm = confFilter.toLowerCase();
          let conferenceNames = [...grouped.keys()];
          if (confFilter !== 'all') {
            conferenceNames = conferenceNames.filter(
              (c) => c.toLowerCase() === confFilterNorm
            );
            if (conferenceNames.length === 0) {
              conferenceNames = [...grouped.keys()].filter((c) =>
                c.toLowerCase().includes(confFilterNorm)
              );
            }
          }

          // Sort: Power 4 first, then alphabetical, "Other" last
          const confOrder = ['SEC', 'ACC', 'Big 12', 'Big Ten'];
          conferenceNames.sort((a, b) => {
            if (a === 'Other') return 1;
            if (b === 'Other') return -1;
            const ai = confOrder.indexOf(a);
            const bi = confOrder.indexOf(b);
            if (ai !== -1 && bi !== -1) return ai - bi;
            if (ai !== -1) return -1;
            if (bi !== -1) return 1;
            return a.localeCompare(b);
          });

          // When a specific conference is requested, return a flat teams array.
          // When "all", return grouped [{conference, teams}] format.
          if (confFilter !== 'all' && conferenceNames.length === 1) {
            const cTeams = grouped.get(conferenceNames[0]) ?? [];
            cTeams.sort((a, b) => b.winPct - a.winPct || b.wins - a.wins);
            return {
              standings: cTeams,
              conference: conferenceNames[0],
              teamCount: cTeams.length,
              meta: makeMeta('highlightly'),
            };
          }

          const standings = conferenceNames.map((conf) => {
            const cTeams = grouped.get(conf) ?? [];
            cTeams.sort((a, b) => b.winPct - a.winPct || b.wins - a.wins);
            return { conference: conf, teams: cTeams };
          });

          return {
            standings,
            conference: confFilter,
            teamCount: allTeams.length,
            meta: makeMeta('highlightly'),
          };
        }
      } catch {
        // Highlightly failed — fall through to ESPN
      }
    }

    // ESPN fallback (existing logic)
    const data = (await espnFetch('/standings', 'v2')) as Record<string, unknown>;
    const children =
      (data.children as Array<Record<string, unknown>>) ?? [];
    const group = children[0] as Record<string, unknown> | undefined;
    const standingsData = group?.standings as Record<string, unknown>;
    const entries =
      (standingsData?.entries as Array<Record<string, unknown>>) ?? [];

    const allTeams: (StandingsEntry & { conference: string })[] = entries.map(
      (entry) => {
        const team = entry.team as Record<string, unknown>;
        const stats = (entry.stats as Array<Record<string, unknown>>) ?? [];

        const findStat = (name: string, abbr?: string): number => {
          const s = stats.find(
            (st) => st.name === name || (abbr && st.abbreviation === abbr)
          );
          return s ? Number(s.value ?? 0) : 0;
        };

        const logos = (team?.logos as Array<Record<string, unknown>>) ?? [];
        const espnId = String(team?.id ?? '');

        return {
          team:
            (team?.displayName as string) ??
            (team?.name as string) ??
            'Unknown',
          abbreviation: (team?.abbreviation as string) ?? '',
          logo: (logos[0]?.href as string) ?? '',
          wins: findStat('wins', 'W'),
          losses: findStat('losses', 'L'),
          winPct: findStat('winPercent', 'PCT'),
          confWins: 0,
          confLosses: 0,
          runsScored: 0,
          runsAllowed: 0,
          runDiff: '0',
          streak: '',
          gamesBack: '',
          gamesPlayed: 0,
          record: '',
          conference: ESPN_ID_TO_CONF[espnId] ?? 'Other',
        };
      }
    );

    const grouped = new Map<string, (StandingsEntry & { conference: string })[]>();
    for (const t of allTeams) {
      if (!grouped.has(t.conference)) grouped.set(t.conference, []);
      grouped.get(t.conference)!.push(t);
    }

    const confFilterNorm = confFilter.toLowerCase();
    let conferenceNames = [...grouped.keys()];
    if (confFilter !== 'all') {
      conferenceNames = conferenceNames.filter(
        (c) => c.toLowerCase() === confFilterNorm
      );
      if (conferenceNames.length === 0) {
        conferenceNames = [...grouped.keys()].filter((c) =>
          c.toLowerCase().includes(confFilterNorm)
        );
      }
    }

    const confOrder = ['SEC', 'ACC', 'Big 12', 'Big Ten'];
    conferenceNames.sort((a, b) => {
      if (a === 'Other') return 1;
      if (b === 'Other') return -1;
      const ai = confOrder.indexOf(a);
      const bi = confOrder.indexOf(b);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.localeCompare(b);
    });

    const standings = conferenceNames.map((conf) => {
      const cTeams = grouped.get(conf) ?? [];
      cTeams.sort((a, b) => b.winPct - a.winPct || b.wins - a.wins);
      return { conference: conf, teams: cTeams };
    });

    return {
      standings,
      conference: confFilter,
      meta: makeMeta('espn-fallback'),
    };
  });
}

// ─── Handler: Rankings (ESPN direct — Highlightly 404s on /rankings) ─────────

async function handleRankings(env: Env): Promise<unknown> {
  return kvCached(env, 'rankings:latest', 3600, async () => {
    const data = (await espnFetch('/rankings')) as Record<string, unknown>;

    const rankingsArr =
      (data.rankings as Array<Record<string, unknown>>) ?? [];
    const poll = rankingsArr[0] ?? {};
    const ranks =
      (poll.ranks as Array<Record<string, unknown>>) ?? [];

    const rankings = ranks.map((rank) => {
      const team = rank.team as Record<string, unknown>;
      const logos = (team?.logos as Array<Record<string, unknown>>) ?? [];

      return {
        rank: rank.current ?? rank.previous,
        previousRank: rank.previous,
        team: (team?.displayName as string) ?? (team?.name as string) ?? 'Unknown',
        abbreviation: (team?.abbreviation as string) ?? '',
        logo: (logos[0]?.href as string) ?? '',
        record: (rank.recordSummary as string) ?? '',
        trend: rank.trend,
        points: rank.points,
        firstPlaceVotes: rank.firstPlaceVotes,
      };
    });

    return {
      rankings,
      poll: (poll.name as string) ?? 'College Baseball Rankings',
      season: poll.season,
      meta: makeMeta('espn'),
    };
  });
}

// ─── Handler: Player Stats (BSI proxy) ───────────────────────────────────────

async function handlePlayerStats(
  args: { player: string; team?: string },
  env: Env
): Promise<unknown> {
  const name = args.player.trim();
  const cacheKey = `player:${name.toLowerCase().replace(/\s+/g, '-')}`;

  return kvCached(env, cacheKey, 3600, async () => {
    // ESPN doesn't support athlete search for college baseball.
    // Try BSI main worker's player endpoint (which queries D1).
    try {
      const teamParam = args.team
        ? `&team=${encodeURIComponent(args.team)}`
        : '';
      const data = (await bsiFetch(
        `/api/college-baseball/players?search=${encodeURIComponent(name)}${teamParam}`,
        env
      )) as Record<string, unknown>;

      const players = (data.players as Array<Record<string, unknown>>) ?? [];
      if (players.length > 0) {
        return data;
      }
    } catch {
      // BSI proxy failed — fall through to team-based search
    }

    // Fallback: if team is provided, try fetching that team's sabermetrics
    // and searching the hitters/pitchers lists for a name match.
    if (args.team) {
      try {
        const slug = resolveTeamSlug(args.team);
        const teamData = (await bsiFetch(
          `/api/college-baseball/teams/${slug}/sabermetrics`,
          env
        )) as Record<string, unknown>;

        const batting = teamData.batting as Record<string, unknown>;
        const allHitters =
          (teamData.all_hitters as Array<Record<string, unknown>>) ??
          (batting?.top_hitters as Array<Record<string, unknown>>) ??
          [];

        const nameNorm = name.toLowerCase();
        const match = allHitters.find((h) =>
          (h.name as string)?.toLowerCase().includes(nameNorm)
        );

        if (match) {
          return {
            player: {
              name: match.name,
              team: slug,
              position: match.position ?? null,
              stats: match,
              source: 'bsi-savant',
            },
            meta: makeMeta('bsi-savant'),
          };
        }
      } catch {
        // Team sabermetrics also failed
      }
    }

    return {
      player: null,
      message: `No results found for "${name}". ESPN does not support athlete search for college baseball. Try providing a team name to search BSI's sabermetric data, or visit blazesportsintel.com/college-baseball/teams for player stats.`,
      meta: makeMeta('unavailable'),
    };
  });
}

// ─── Handler: Team Sabermetrics (BSI proxy — fixed path) ─────────────────────

async function handleTeamSabermetrics(
  args: { team: string },
  env: Env
): Promise<unknown> {
  const slug = resolveTeamSlug(args.team);

  return kvCached(env, `team:${slug}:saber`, 21600, async () => {
    try {
      return await bsiFetch(
        `/api/college-baseball/teams/${slug}/sabermetrics`,
        env
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        team: slug,
        error: `Team sabermetrics unavailable: ${msg}. This endpoint requires BSI's savant-compute worker to have processed data for this team.`,
        meta: makeMeta('bsi-proxy-error'),
      };
    }
  });
}

// ─── Handler: Leaderboard (BSI savant + ESPN leaders) ────────────────────────

async function handleLeaderboard(
  args: { metric?: string; type?: string; limit?: number; conference?: string },
  env: Env
): Promise<unknown> {
  const metric = args.metric ?? 'woba';
  const type = args.type ?? 'batting';
  const limit = Math.min(args.limit ?? 20, 50);
  const cacheKey = `leaderboard:${metric}:${type}:${limit}`;

  return kvCached(env, cacheKey, 21600, async () => {
    // Try BSI savant leaderboard first
    let bsiData: Record<string, unknown> | null = null;
    try {
      const conf = args.conference
        ? `&conference=${encodeURIComponent(args.conference)}`
        : '';
      bsiData = (await bsiFetch(
        `/api/college-baseball/sabermetrics/${type}?metric=${metric}&limit=${limit}${conf}`,
        env
      )) as Record<string, unknown>;
    } catch {
      // BSI unavailable — fall through to ESPN leaders
    }

    if (bsiData && !bsiData.error) {
      return bsiData;
    }

    // Fallback: ESPN traditional leaders
    try {
      const data = (await espnFetch('/leaders')) as Record<string, unknown>;
      const categories =
        (data.categories as Array<Record<string, unknown>>) ?? [];

      const leaders = categories.map((cat) => ({
        name: cat.name ?? cat.displayName,
        abbreviation: cat.abbreviation,
        leaders: ((cat.leaders as Array<Record<string, unknown>>) ?? [])
          .slice(0, limit)
          .map((l) => {
            const athlete = l.athlete as Record<string, unknown>;
            const team = athlete?.team as Record<string, unknown>;
            return {
              rank: l.rank,
              value: l.value ?? l.displayValue,
              player: (athlete?.displayName as string) ?? 'Unknown',
              team: (team?.displayName as string) ?? '',
              headshot:
                (athlete?.headshot as Record<string, unknown>)?.href ?? null,
            };
          }),
      }));

      return {
        leaders,
        metric,
        type,
        note: 'BSI advanced metric leaderboard unavailable. Showing ESPN traditional stat leaders.',
        meta: makeMeta('espn-fallback'),
      };
    } catch {
      return {
        leaders: [],
        metric,
        type,
        error:
          'Per-player advanced metric leaderboards require BSI savant-compute data (D1 binding). ESPN leaders also unavailable.',
        meta: makeMeta('unavailable'),
      };
    }
  });
}

// ─── Handler: Conference Power Index (Highlightly + ESPN) ────────────────────

interface ConferencePower {
  conference: string;
  rank: number;
  avgWinPct: number;
  totalWins: number;
  totalLosses: number;
  totalRunsScored: number;
  totalRunsAllowed: number;
  avgRunDiff: number;
  teamCount: number;
}

async function handlePowerIndex(env: Env): Promise<unknown> {
  return kvCached(env, 'power-index:latest', 21600, async () => {
    // Try Highlightly first — has RS/RA/DIFF for richer power index
    if (env.HIGHLIGHTLY_API_KEY) {
      try {
        const hlData = (await hlFetch('/standings?abbreviation=NCAA', env)) as Record<string, unknown>;

        let teams: Array<Record<string, unknown>> = [];
        if (hlData && typeof hlData === 'object' && 'data' in hlData) {
          const outer = (hlData as { data: unknown[] }).data;
          if (Array.isArray(outer) && outer.length > 0) {
            const league = outer[0] as Record<string, unknown>;
            teams = (league.data as Array<Record<string, unknown>>) ?? [];
          }
        }

        if (teams.length > 0) {
          let teamMap: Record<string, string> = {};
          try {
            teamMap = await getHlTeamMap(env);
          } catch {
            // fallback to name field
          }

          const parseStat = (
            stats: Array<Record<string, unknown>>,
            abbr: string
          ): string => {
            const s = stats.find((st) => st.abbreviation === abbr);
            return (s?.displayValue as string) ?? '0';
          };

          // Aggregate by conference
          const confAgg = new Map<
            string,
            { wins: number; losses: number; rs: number; ra: number; teams: number }
          >();

          for (const t of teams) {
            const stats = (t.stats as Array<Record<string, unknown>>) ?? [];
            const hlId = String(t.id ?? '');
            const displayName = teamMap[hlId] || (t.name as string) || '';
            const conf = resolveConference(displayName);
            if (conf === 'Other') continue;

            if (!confAgg.has(conf))
              confAgg.set(conf, { wins: 0, losses: 0, rs: 0, ra: 0, teams: 0 });
            const agg = confAgg.get(conf)!;
            agg.wins += parseInt(parseStat(stats, 'W'), 10) || 0;
            agg.losses += parseInt(parseStat(stats, 'L'), 10) || 0;
            agg.rs += parseInt(parseStat(stats, 'RS'), 10) || 0;
            agg.ra += parseInt(parseStat(stats, 'RA'), 10) || 0;
            agg.teams += 1;
          }

          const conferences: ConferencePower[] = [];
          for (const [conf, agg] of confAgg) {
            const total = agg.wins + agg.losses;
            const runDiffPerTeam =
              agg.teams > 0 ? (agg.rs - agg.ra) / agg.teams : 0;
            conferences.push({
              conference: conf,
              rank: 0,
              avgWinPct:
                total > 0 ? Math.round((agg.wins / total) * 1000) / 1000 : 0,
              totalWins: agg.wins,
              totalLosses: agg.losses,
              totalRunsScored: agg.rs,
              totalRunsAllowed: agg.ra,
              avgRunDiff: Math.round(runDiffPerTeam * 10) / 10,
              teamCount: agg.teams,
            });
          }

          conferences.sort((a, b) => b.avgWinPct - a.avgWinPct);
          conferences.forEach((c, i) => {
            c.rank = i + 1;
          });

          return {
            conferences,
            note: 'Conference Power Index with run differential from Highlightly standings. True CPI uses inter-conference game results.',
            meta: makeMeta('highlightly-computed'),
          };
        }
      } catch {
        // Highlightly failed — fall through to ESPN
      }
    }

    // ESPN fallback
    const data = (await espnFetch('/standings', 'v2')) as Record<string, unknown>;
    const children =
      (data.children as Array<Record<string, unknown>>) ?? [];
    const group = children[0] as Record<string, unknown> | undefined;
    const standingsData = group?.standings as Record<string, unknown>;
    const entries =
      (standingsData?.entries as Array<Record<string, unknown>>) ?? [];

    const confAgg = new Map<
      string,
      { wins: number; losses: number; teams: number }
    >();

    for (const entry of entries) {
      const team = entry.team as Record<string, unknown>;
      const stats = (entry.stats as Array<Record<string, unknown>>) ?? [];
      const espnId = String(team?.id ?? '');
      const conf = ESPN_ID_TO_CONF[espnId];
      if (!conf) continue;

      const findStat = (name: string, abbr?: string): number => {
        const s = stats.find(
          (st) => st.name === name || (abbr && st.abbreviation === abbr)
        );
        return s ? Number(s.value ?? 0) : 0;
      };

      if (!confAgg.has(conf)) confAgg.set(conf, { wins: 0, losses: 0, teams: 0 });
      const agg = confAgg.get(conf)!;
      agg.wins += findStat('wins', 'W');
      agg.losses += findStat('losses', 'L');
      agg.teams += 1;
    }

    const conferences: ConferencePower[] = [];
    for (const [conf, agg] of confAgg) {
      const total = agg.wins + agg.losses;
      conferences.push({
        conference: conf,
        rank: 0,
        avgWinPct: total > 0 ? Math.round((agg.wins / total) * 1000) / 1000 : 0,
        totalWins: agg.wins,
        totalLosses: agg.losses,
        totalRunsScored: 0,
        totalRunsAllowed: 0,
        avgRunDiff: 0,
        teamCount: agg.teams,
      });
    }

    conferences.sort((a, b) => b.avgWinPct - a.avgWinPct);
    conferences.forEach((c, i) => {
      c.rank = i + 1;
    });

    return {
      conferences,
      note: 'Estimated from ESPN overall win%. Highlightly unavailable for run differential enrichment.',
      meta: makeMeta('espn-computed'),
    };
  });
}

// ─── Handler: Team Schedule (ESPN direct) ────────────────────────────────────

async function handleTeamSchedule(
  args: { team: string },
  env: Env
): Promise<unknown> {
  const slug = resolveTeamSlug(args.team);
  const espnId = resolveEspnId(slug);

  if (!espnId) {
    return {
      schedule: [],
      team: slug,
      error: `Team "${args.team}" not found in team map. Try a common slug like "texas", "lsu", "florida-state".`,
      meta: makeMeta('error'),
    };
  }

  return kvCached(env, `schedule:${slug}`, 3600, async () => {
    const data = (await espnFetch(
      `/teams/${espnId}/schedule`
    )) as Record<string, unknown>;

    const events =
      (data.events as Array<Record<string, unknown>>) ?? [];

    const schedule = events.map((event) => {
      const competitions =
        (event.competitions as Array<Record<string, unknown>>) ?? [];
      const comp = competitions[0] as Record<string, unknown> | undefined;
      const competitors =
        (comp?.competitors as Array<Record<string, unknown>>) ?? [];
      const status = comp?.status as Record<string, unknown>;
      const statusType = status?.type as Record<string, unknown>;

      return {
        id: event.id,
        date: event.date,
        name: event.name ?? event.shortName,
        homeAway: competitors.find(
          (c) => String((c.team as Record<string, unknown>)?.id) === espnId
        )?.homeAway ?? null,
        competitors: competitors.map((c) => {
          const t = c.team as Record<string, unknown>;
          const logos = (t?.logos as Array<Record<string, unknown>>) ?? [];
          return {
            team: (t?.displayName as string) ?? '',
            abbreviation: (t?.abbreviation as string) ?? '',
            logo: (logos[0]?.href as string) ?? '',
            score: typeof c.score === 'object'
              ? (c.score as Record<string, unknown>)?.displayValue ?? (c.score as Record<string, unknown>)?.value ?? null
              : c.score ?? null,
            homeAway: c.homeAway,
            winner: c.winner,
          };
        }),
        status: {
          completed: (statusType?.completed as boolean) ?? false,
          description: (statusType?.description as string) ?? '',
        },
        venue: (comp?.venue as Record<string, unknown>)?.fullName ?? null,
      };
    });

    return {
      schedule,
      team: slug,
      meta: makeMeta('espn'),
    };
  });
}

// ─── Handler: Match Detail (Highlightly — venue, predictions, plays) ─────────

async function handleMatchDetail(
  args: { matchId: string },
  env: Env
): Promise<unknown> {
  const matchId = args.matchId;

  return kvCached(env, `match:${matchId}`, 120, async () => {
    if (!env.HIGHLIGHTLY_API_KEY) {
      return {
        error: 'Match detail requires Highlightly API key.',
        meta: makeMeta('unavailable'),
      };
    }

    const data = (await hlFetch(`/matches/${matchId}`, env)) as
      | Array<Record<string, unknown>>
      | Record<string, unknown>;

    // Highlightly returns an array with one element for single match
    const match = Array.isArray(data) ? data[0] : data;
    if (!match) {
      return {
        error: `Match ${matchId} not found.`,
        meta: makeMeta('highlightly'),
      };
    }

    const homeTeam = match.homeTeam as Record<string, unknown>;
    const awayTeam = match.awayTeam as Record<string, unknown>;
    const state = match.state as Record<string, unknown>;
    const score = state?.score as Record<string, unknown>;
    const venue = match.venue as Record<string, unknown>;
    const forecast = match.forecast as Record<string, unknown>;
    const predictions = match.predictions as Record<string, unknown>;
    const prematch = (predictions?.prematch as Array<Record<string, unknown>>) ?? [];
    const live = (predictions?.live as Array<Record<string, unknown>>) ?? [];
    const plays = (match.plays as Array<Record<string, unknown>>) ?? [];
    const stats = (match.stats as Array<Record<string, unknown>>) ?? [];

    return {
      id: match.id,
      date: match.date,
      season: match.season,
      round: match.round,
      status: (state?.description as string) ?? 'Unknown',
      statusDetail: (state?.report as string) ?? '',
      currentScore: (score?.current as string) ?? '',
      home: {
        id: homeTeam?.id,
        name: (homeTeam?.displayName as string) ?? '',
        abbreviation: (homeTeam?.abbreviation as string) ?? '',
        logo: (homeTeam?.logo as string) ?? '',
        score: score?.home,
      },
      away: {
        id: awayTeam?.id,
        name: (awayTeam?.displayName as string) ?? '',
        abbreviation: (awayTeam?.abbreviation as string) ?? '',
        logo: (awayTeam?.logo as string) ?? '',
        score: score?.away,
      },
      venue: venue
        ? {
            name: (venue.name as string) ?? '',
            city: (venue.city as string) ?? '',
            state: (venue.state as string) ?? '',
          }
        : null,
      weather: forecast
        ? {
            status: forecast.status,
            temperature: forecast.temperature,
          }
        : null,
      predictions: {
        prematch: prematch.map((p) => ({
          description: p.description,
          probabilities: p.probabilities,
          generatedAt: p.generatedAt,
        })),
        live: live.map((p) => ({
          description: p.description,
          probabilities: p.probabilities,
          generatedAt: p.generatedAt,
        })),
      },
      plays: plays.slice(0, 50), // Cap at 50 plays to keep response reasonable
      teamStats: stats,
      meta: makeMeta('highlightly'),
    };
  });
}

// ─── MCP Tool Definitions ────────────────────────────────────────────────────

const MCP_TOOLS = [
  {
    name: 'get_college_baseball_scoreboard',
    description:
      "Get today's college baseball scores and game results. Returns live and final games with team names, scores, venue, and game status. Covers all 330 D1 teams.",
    inputSchema: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description:
            'Date in YYYY-MM-DD format. Defaults to today (America/Chicago).',
        },
        conference: {
          type: 'string',
          description:
            'Filter by conference (e.g., "SEC", "Big 12", "ACC"). Optional.',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_college_baseball_standings',
    description:
      'Get current college baseball conference standings including wins, losses, win percentage, runs scored, runs allowed, run differential, streak, and games back.',
    inputSchema: {
      type: 'object',
      properties: {
        conference: {
          type: 'string',
          description:
            'Conference name (e.g., "SEC", "Big 12", "ACC", "Big Ten"). Optional — omit for all conferences.',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_college_baseball_rankings',
    description:
      'Get the latest national college baseball rankings (Top 25). Returns rank, team, record, and trend.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_team_sabermetrics',
    description:
      'Get advanced sabermetric batting and pitching metrics for a college baseball team: wOBA, wRC+, FIP, ERA-, BABIP, ISO, and more.',
    inputSchema: {
      type: 'object',
      properties: {
        team: {
          type: 'string',
          description:
            'Team name or slug (e.g., "texas", "tennessee", "lsu").',
        },
      },
      required: ['team'],
    },
  },
  {
    name: 'get_sabermetrics_leaderboard',
    description:
      'Get the top college baseball hitters or pitchers by an advanced metric. Returns a ranked leaderboard with player names, teams, and stat values.',
    inputSchema: {
      type: 'object',
      properties: {
        metric: {
          type: 'string',
          description:
            'Metric to rank by: "woba", "wrc_plus", "ops_plus", "fip", "era_minus", "babip", "iso". Default: "woba".',
          enum: [
            'woba',
            'wrc_plus',
            'ops_plus',
            'fip',
            'era_minus',
            'babip',
            'iso',
          ],
        },
        type: {
          type: 'string',
          description: '"batting" or "pitching". Default: "batting".',
          enum: ['batting', 'pitching'],
        },
        limit: {
          type: 'number',
          description: 'Number of results to return. Default: 20, max: 50.',
        },
        conference: {
          type: 'string',
          description: 'Filter by conference. Optional.',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_conference_power_index',
    description:
      'Get the Conference Power Index — a ranking of D1 conferences by average win percentage and run differential. Uses Highlightly standings data when available.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_player_stats',
    description:
      'Search for a college baseball player by name and get their stats, position, team, and headshot. Searches BSI sabermetric data.',
    inputSchema: {
      type: 'object',
      properties: {
        player: {
          type: 'string',
          description: 'Player name (e.g., "Jac Caglianone", "Charlie Condon").',
        },
        team: {
          type: 'string',
          description:
            'Team name to disambiguate when multiple players share a name. Optional.',
        },
      },
      required: ['player'],
    },
  },
  {
    name: 'get_team_schedule',
    description:
      "Get the full schedule for a college baseball team, including past results and upcoming games.",
    inputSchema: {
      type: 'object',
      properties: {
        team: {
          type: 'string',
          description: 'Team name or slug (e.g., "texas", "lsu", "florida-state").',
        },
      },
      required: ['team'],
    },
  },
  {
    name: 'get_match_detail',
    description:
      'Get detailed information about a specific college baseball game including venue, weather, win predictions, play-by-play, and team stats. Use a match ID from the scoreboard.',
    inputSchema: {
      type: 'object',
      properties: {
        matchId: {
          type: 'string',
          description:
            'Highlightly match ID (from scoreboard results). e.g., "993144".',
        },
      },
      required: ['matchId'],
    },
  },
];

// ─── Tool Dispatch ───────────────────────────────────────────────────────────

async function executeTool(
  name: string,
  args: Record<string, unknown>,
  env: Env
): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
  let data: unknown;

  try {
    switch (name) {
      case 'get_college_baseball_scoreboard':
        data = await handleScoreboard(
          { date: args.date as string, conference: args.conference as string },
          env
        );
        break;

      case 'get_college_baseball_standings':
        data = await handleStandings(
          { conference: args.conference as string },
          env
        );
        break;

      case 'get_college_baseball_rankings':
        data = await handleRankings(env);
        break;

      case 'get_team_sabermetrics':
        data = await handleTeamSabermetrics(
          { team: args.team as string },
          env
        );
        break;

      case 'get_sabermetrics_leaderboard':
        data = await handleLeaderboard(
          {
            metric: args.metric as string,
            type: args.type as string,
            limit: args.limit as number,
            conference: args.conference as string,
          },
          env
        );
        break;

      case 'get_conference_power_index':
        data = await handlePowerIndex(env);
        break;

      case 'get_player_stats':
        data = await handlePlayerStats(
          { player: args.player as string, team: args.team as string },
          env
        );
        break;

      case 'get_team_schedule':
        data = await handleTeamSchedule({ team: args.team as string }, env);
        break;

      case 'get_match_detail':
        data = await handleMatchDetail(
          { matchId: String(args.matchId) },
          env
        );
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      content: [{ type: 'text', text: `Error: ${msg}` }],
      isError: true,
    };
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
  };
}

// ─── MCP Method Dispatch ─────────────────────────────────────────────────────

async function handleMcpMethod(
  req: JsonRpcRequest,
  env: Env
): Promise<JsonRpcResponse> {
  const { id, method, params = {} } = req;

  switch (method) {
    case 'initialize':
      return rpcOk(id, {
        protocolVersion: '2024-11-05',
        capabilities: { tools: { listChanged: false } },
        serverInfo: {
          name: 'college-baseball-sabermetrics',
          version: '3.0.0',
        },
        instructions:
          'BSI College Baseball MCP — provides live scores, standings, national rankings, match detail with venue and predictions, and advanced sabermetric analytics (wOBA, wRC+, FIP, ERA-) for D1 college baseball. Data sourced from Highlightly (330 teams), ESPN, and BSI Savant. Updated every 30–60 seconds during live games.',
      });

    case 'notifications/initialized':
      return rpcOk(id, null);

    case 'tools/list':
      return rpcOk(id, { tools: MCP_TOOLS });

    case 'tools/call': {
      const toolName = params.name as string;
      const toolArgs = (params.arguments as Record<string, unknown>) ?? {};

      if (!toolName) {
        return rpcErr(id, -32602, 'Missing required param: name');
      }

      const toolDef = MCP_TOOLS.find((t) => t.name === toolName);
      if (!toolDef) {
        return rpcErr(id, -32602, `Unknown tool: ${toolName}`);
      }

      const result = await executeTool(toolName, toolArgs, env);
      return rpcOk(id, result);
    }

    case 'resources/list':
      return rpcOk(id, { resources: [] });

    case 'prompts/list':
      return rpcOk(id, { prompts: [] });

    default:
      return rpcErr(id, -32601, `Method not found: ${method}`);
  }
}

// ─── REST Route Helpers ──────────────────────────────────────────────────────

/** Extract path segments: /v1/teams/texas/stats → ['v1','teams','texas','stats'] */
function pathSegments(pathname: string): string[] {
  return pathname.split('/').filter(Boolean);
}

// ─── Main Handler ────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method.toUpperCase();

    // CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // ─── Health ────────────────────────────────────────────────────────
    if (pathname === '/health') {
      return jsonResponse({
        status: 'ok',
        service: 'college-baseball-sabermetrics-mcp',
        version: '3.0.0',
        timestamp: new Date().toISOString(),
        endpoints: 9,
        highlightly: !!env.HIGHLIGHTLY_API_KEY,
      });
    }

    // ─── MCP Endpoint ──────────────────────────────────────────────────
    if (pathname === '/mcp') {
      if (method === 'GET') {
        return jsonResponse(
          { error: 'SSE streaming not supported. Use POST for JSON-RPC 2.0.' },
          405
        );
      }
      if (method !== 'POST') {
        return jsonResponse({ error: 'Method not allowed' }, 405);
      }

      const token =
        extractBearer(request) ??
        request.headers.get('CF-Connecting-IP') ??
        'anonymous';
      const allowed = await checkRateLimit(token, env);
      if (!allowed) {
        return jsonResponse(
          rpcErr(
            null,
            -32029,
            `Rate limit exceeded: max ${RATE_LIMIT_MAX} req/min`
          ),
          429
        );
      }

      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return jsonResponse(
          rpcErr(null, -32700, 'Parse error: invalid JSON'),
          400
        );
      }

      const rpc = body as JsonRpcRequest;
      if (rpc.jsonrpc !== '2.0' || !rpc.method) {
        return jsonResponse(
          rpcErr(
            rpc.id ?? null,
            -32600,
            'Invalid Request: must be JSON-RPC 2.0'
          ),
          400
        );
      }

      const response = await handleMcpMethod(rpc, env);
      return jsonResponse(response);
    }

    // ─── REST API Routes ───────────────────────────────────────────────
    if (pathname.startsWith('/v1/')) {
      const segs = pathSegments(pathname);

      try {
        // GET /v1/scoreboard
        if (segs[1] === 'scoreboard') {
          const data = await handleScoreboard(
            {
              date: url.searchParams.get('date') ?? undefined,
              conference: url.searchParams.get('conference') ?? undefined,
            },
            env
          );
          return jsonResponse(data);
        }

        // GET /v1/standings
        if (segs[1] === 'standings') {
          const data = await handleStandings(
            { conference: url.searchParams.get('conference') ?? undefined },
            env
          );
          return jsonResponse(data);
        }

        // GET /v1/rankings
        if (segs[1] === 'rankings') {
          const data = await handleRankings(env);
          return jsonResponse(data);
        }

        // GET /v1/players
        if (segs[1] === 'players') {
          const name = url.searchParams.get('name');
          if (!name) {
            return errorResponse('Missing required query param: name', 400);
          }
          const data = await handlePlayerStats(
            {
              player: name,
              team: url.searchParams.get('team') ?? undefined,
            },
            env
          );
          return jsonResponse(data);
        }

        // GET /v1/teams/:team/stats
        if (segs[1] === 'teams' && segs[2] && segs[3] === 'stats') {
          const data = await handleTeamSabermetrics(
            { team: segs[2] },
            env
          );
          return jsonResponse(data);
        }

        // GET /v1/teams/:team/schedule
        if (segs[1] === 'teams' && segs[2] && segs[3] === 'schedule') {
          const data = await handleTeamSchedule({ team: segs[2] }, env);
          return jsonResponse(data);
        }

        // GET /v1/leaderboard
        if (segs[1] === 'leaderboard') {
          const data = await handleLeaderboard(
            {
              metric: url.searchParams.get('metric') ?? undefined,
              type: url.searchParams.get('type') ?? undefined,
              limit: url.searchParams.get('limit')
                ? parseInt(url.searchParams.get('limit')!, 10)
                : undefined,
              conference: url.searchParams.get('conference') ?? undefined,
            },
            env
          );
          return jsonResponse(data);
        }

        // GET /v1/power-index
        if (segs[1] === 'power-index') {
          const data = await handlePowerIndex(env);
          return jsonResponse(data);
        }

        // GET /v1/matches/:id
        if (segs[1] === 'matches' && segs[2]) {
          const data = await handleMatchDetail({ matchId: segs[2] }, env);
          return jsonResponse(data);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return errorResponse(msg, 500);
      }

      return errorResponse(`Unknown endpoint: ${pathname}`, 404);
    }

    // ─── Root ──────────────────────────────────────────────────────────
    if (pathname === '/') {
      return jsonResponse({
        service: 'BSI College Baseball Sabermetrics MCP',
        version: '3.0.0',
        dataSources: {
          primary: 'Highlightly (330 D1 teams)',
          fallback: 'ESPN + BSI Savant',
        },
        endpoints: {
          health: 'GET /health',
          mcp: 'POST /mcp (JSON-RPC 2.0)',
          scoreboard: 'GET /v1/scoreboard?date=&conference=',
          standings: 'GET /v1/standings?conference=',
          rankings: 'GET /v1/rankings',
          players: 'GET /v1/players?name=&team=',
          teamStats: 'GET /v1/teams/:team/stats',
          teamSchedule: 'GET /v1/teams/:team/schedule',
          leaderboard: 'GET /v1/leaderboard?metric=&type=&limit=&conference=',
          powerIndex: 'GET /v1/power-index',
          matchDetail: 'GET /v1/matches/:id',
        },
        docs: 'https://blazesportsintel.com',
      });
    }

    return errorResponse('Not found', 404);
  },
};
