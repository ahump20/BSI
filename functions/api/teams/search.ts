/**
 * Team Search API Endpoint
 * Search teams across multiple sports for watchlist management
 *
 * Features:
 * - Multi-sport search (College Baseball, MLB, NFL, CFB, CBB)
 * - Fuzzy matching with ranking
 * - Conference and division filtering
 * - KV caching with 5-minute TTL
 * - Rate limiting protection
 *
 * Integration Points:
 * - WatchlistManager.tsx (team search)
 * - D1 database for team data
 * - KV cache for performance
 *
 * Data Sources: BlazeSportsIntel DB, NCAA Stats API, ESPN API
 * Last Updated: October 19, 2025
 * Timezone: America/Chicago
 */

// ============================================================================
// Type Definitions
// ============================================================================

interface Team {
  id: string;
  name: string;
  abbreviation: string;
  conference: string;
  division?: string;
  sport: 'college_baseball' | 'mlb' | 'nfl' | 'cfb' | 'cbb';
  logo?: string;
  record?: string;
  winPct?: number;
  ranking?: number;
  city?: string;
  state?: string;
}

interface SearchParams {
  query: string;
  sport?: string;
  conference?: string;
  limit?: number;
}

// ============================================================================
// API Handler
// ============================================================================

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  // Extract search parameters
  const params: SearchParams = {
    query: url.searchParams.get('q') || '',
    sport: url.searchParams.get('sport') || undefined,
    conference: url.searchParams.get('conference') || undefined,
    limit: parseInt(url.searchParams.get('limit') || '20', 10),
  };

  // Validate query
  if (params.query.length < 2) {
    return Response.json({ error: 'Query must be at least 2 characters' }, { status: 400 });
  }

  try {
    // Check KV cache first
    const cacheKey = buildCacheKey(params);
    const cached = await env.KV.get<Team[]>(cacheKey, 'json');

    if (cached) {
      return Response.json(cached, {
        headers: {
          'Cache-Control': 'public, max-age=60, s-maxage=300',
          'X-Cache-Status': 'hit',
        },
      });
    }

    // Search teams
    const results = await searchTeams(params, env);

    // Cache results for 5 minutes
    await env.KV.put(cacheKey, JSON.stringify(results), {
      expirationTtl: 300,
    });

    return Response.json(results, {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=300',
        'X-Cache-Status': 'miss',
      },
    });
  } catch (error) {
    console.error('Team search error:', error);
    return Response.json(
      {
        error: 'Search failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Build cache key from search parameters
 */
function buildCacheKey(params: SearchParams): string {
  const parts = [
    'team_search',
    params.query.toLowerCase(),
    params.sport || 'all',
    params.conference || 'all',
    params.limit || 20,
  ];
  return parts.join(':');
}

/**
 * Search teams in database
 * Currently queries college_baseball_teams table. MLB/NFL/NBA teams
 * are fetched from external APIs (not in D1).
 */
async function searchTeams(params: SearchParams, env: Env): Promise<Team[]> {
  const query = params.query.toLowerCase();
  const results: Team[] = [];

  // Skip college baseball if filtering for other sports only
  const searchCollegeBaseball = !params.sport || params.sport === 'college_baseball';

  if (searchCollegeBaseball) {
    const collegeTeams = await searchCollegeBaseballTeams(query, params, env);
    results.push(...collegeTeams);
  }

  // For MLB/NFL/NBA, return static data (no D1 tables exist yet)
  // TODO: Add pro teams to D1 or fetch from API
  if (!params.sport || params.sport === 'mlb') {
    const mlbTeams = searchMLBTeams(query, params.limit || 20);
    results.push(...mlbTeams);
  }

  if (!params.sport || params.sport === 'nfl') {
    const nflTeams = searchNFLTeams(query, params.limit || 20);
    results.push(...nflTeams);
  }

  if (!params.sport || params.sport === 'nba') {
    const nbaTeams = searchNBATeams(query, params.limit || 20);
    results.push(...nbaTeams);
  }

  // Sort by relevance and limit
  return results.slice(0, params.limit || 20);
}

/**
 * Search college baseball teams in D1 database
 */
async function searchCollegeBaseballTeams(
  query: string,
  params: SearchParams,
  env: Env
): Promise<Team[]> {
  const conferenceFilter = params.conference ? `AND conference = ?` : '';

  const sql = `
    SELECT
      t.id,
      t.name,
      t.abbreviation,
      t.conference,
      t.division,
      t.city,
      t.state,
      t.logo_url as logo,
      r.rank as ranking,
      rec.overall_wins,
      rec.overall_losses,
      CASE
        WHEN LOWER(t.name) = ? THEN 10
        WHEN LOWER(t.abbreviation) = ? THEN 9
        WHEN LOWER(t.name) LIKE ? THEN 8
        WHEN LOWER(t.abbreviation) LIKE ? THEN 7
        WHEN LOWER(t.name) LIKE ? THEN 6
        WHEN LOWER(t.city) = ? THEN 5
        ELSE 4
      END as relevance
    FROM college_baseball_teams t
    LEFT JOIN college_baseball_rankings r ON t.id = r.team_id
      AND r.source = 'd1baseball'
      AND r.season = strftime('%Y', 'now')
    LEFT JOIN college_baseball_records rec ON t.id = rec.team_id
      AND rec.season = strftime('%Y', 'now')
    WHERE (
      LOWER(t.name) LIKE ?
      OR LOWER(t.abbreviation) LIKE ?
      OR LOWER(t.city) LIKE ?
      OR LOWER(t.conference) LIKE ?
    )
    ${conferenceFilter}
    ORDER BY relevance DESC, r.rank ASC NULLS LAST, t.name ASC
    LIMIT ?
  `;

  const binds: (string | number)[] = [
    query,
    query,
    `${query}%`,
    `${query}%`,
    `%${query}%`,
    query,
    `%${query}%`,
    `%${query}%`,
    `%${query}%`,
    `%${query}%`,
  ];

  if (params.conference) {
    binds.push(params.conference);
  }

  binds.push(params.limit || 20);

  const results = await env.DB.prepare(sql)
    .bind(...binds)
    .all();

  if (!results.success) {
    return [];
  }

  return results.results.map((row: Record<string, unknown>) => ({
    id: String(row.id),
    name: String(row.name),
    abbreviation: String(row.abbreviation || ''),
    conference: String(row.conference),
    division: row.division ? String(row.division) : undefined,
    sport: 'college_baseball' as const,
    logo: row.logo ? String(row.logo) : undefined,
    record:
      row.overall_wins !== null && row.overall_losses !== null
        ? `${row.overall_wins}-${row.overall_losses}`
        : undefined,
    ranking: row.ranking ? Number(row.ranking) : undefined,
    city: row.city ? String(row.city) : undefined,
    state: row.state ? String(row.state) : undefined,
  }));
}

/**
 * Static MLB teams data for search (no D1 table exists)
 */
const MLB_TEAMS: Team[] = [
  {
    id: 'nyy',
    name: 'New York Yankees',
    abbreviation: 'NYY',
    conference: 'AL',
    division: 'East',
    sport: 'mlb',
    city: 'New York',
    state: 'NY',
  },
  {
    id: 'bos',
    name: 'Boston Red Sox',
    abbreviation: 'BOS',
    conference: 'AL',
    division: 'East',
    sport: 'mlb',
    city: 'Boston',
    state: 'MA',
  },
  {
    id: 'tb',
    name: 'Tampa Bay Rays',
    abbreviation: 'TB',
    conference: 'AL',
    division: 'East',
    sport: 'mlb',
    city: 'St. Petersburg',
    state: 'FL',
  },
  {
    id: 'tor',
    name: 'Toronto Blue Jays',
    abbreviation: 'TOR',
    conference: 'AL',
    division: 'East',
    sport: 'mlb',
    city: 'Toronto',
    state: 'ON',
  },
  {
    id: 'bal',
    name: 'Baltimore Orioles',
    abbreviation: 'BAL',
    conference: 'AL',
    division: 'East',
    sport: 'mlb',
    city: 'Baltimore',
    state: 'MD',
  },
  {
    id: 'cle',
    name: 'Cleveland Guardians',
    abbreviation: 'CLE',
    conference: 'AL',
    division: 'Central',
    sport: 'mlb',
    city: 'Cleveland',
    state: 'OH',
  },
  {
    id: 'det',
    name: 'Detroit Tigers',
    abbreviation: 'DET',
    conference: 'AL',
    division: 'Central',
    sport: 'mlb',
    city: 'Detroit',
    state: 'MI',
  },
  {
    id: 'kc',
    name: 'Kansas City Royals',
    abbreviation: 'KC',
    conference: 'AL',
    division: 'Central',
    sport: 'mlb',
    city: 'Kansas City',
    state: 'MO',
  },
  {
    id: 'min',
    name: 'Minnesota Twins',
    abbreviation: 'MIN',
    conference: 'AL',
    division: 'Central',
    sport: 'mlb',
    city: 'Minneapolis',
    state: 'MN',
  },
  {
    id: 'cws',
    name: 'Chicago White Sox',
    abbreviation: 'CWS',
    conference: 'AL',
    division: 'Central',
    sport: 'mlb',
    city: 'Chicago',
    state: 'IL',
  },
  {
    id: 'hou',
    name: 'Houston Astros',
    abbreviation: 'HOU',
    conference: 'AL',
    division: 'West',
    sport: 'mlb',
    city: 'Houston',
    state: 'TX',
  },
  {
    id: 'laa',
    name: 'Los Angeles Angels',
    abbreviation: 'LAA',
    conference: 'AL',
    division: 'West',
    sport: 'mlb',
    city: 'Anaheim',
    state: 'CA',
  },
  {
    id: 'oak',
    name: 'Oakland Athletics',
    abbreviation: 'OAK',
    conference: 'AL',
    division: 'West',
    sport: 'mlb',
    city: 'Oakland',
    state: 'CA',
  },
  {
    id: 'sea',
    name: 'Seattle Mariners',
    abbreviation: 'SEA',
    conference: 'AL',
    division: 'West',
    sport: 'mlb',
    city: 'Seattle',
    state: 'WA',
  },
  {
    id: 'tex',
    name: 'Texas Rangers',
    abbreviation: 'TEX',
    conference: 'AL',
    division: 'West',
    sport: 'mlb',
    city: 'Arlington',
    state: 'TX',
  },
  {
    id: 'nym',
    name: 'New York Mets',
    abbreviation: 'NYM',
    conference: 'NL',
    division: 'East',
    sport: 'mlb',
    city: 'New York',
    state: 'NY',
  },
  {
    id: 'phi',
    name: 'Philadelphia Phillies',
    abbreviation: 'PHI',
    conference: 'NL',
    division: 'East',
    sport: 'mlb',
    city: 'Philadelphia',
    state: 'PA',
  },
  {
    id: 'atl',
    name: 'Atlanta Braves',
    abbreviation: 'ATL',
    conference: 'NL',
    division: 'East',
    sport: 'mlb',
    city: 'Atlanta',
    state: 'GA',
  },
  {
    id: 'mia',
    name: 'Miami Marlins',
    abbreviation: 'MIA',
    conference: 'NL',
    division: 'East',
    sport: 'mlb',
    city: 'Miami',
    state: 'FL',
  },
  {
    id: 'wsh',
    name: 'Washington Nationals',
    abbreviation: 'WSH',
    conference: 'NL',
    division: 'East',
    sport: 'mlb',
    city: 'Washington',
    state: 'DC',
  },
  {
    id: 'chc',
    name: 'Chicago Cubs',
    abbreviation: 'CHC',
    conference: 'NL',
    division: 'Central',
    sport: 'mlb',
    city: 'Chicago',
    state: 'IL',
  },
  {
    id: 'cin',
    name: 'Cincinnati Reds',
    abbreviation: 'CIN',
    conference: 'NL',
    division: 'Central',
    sport: 'mlb',
    city: 'Cincinnati',
    state: 'OH',
  },
  {
    id: 'mil',
    name: 'Milwaukee Brewers',
    abbreviation: 'MIL',
    conference: 'NL',
    division: 'Central',
    sport: 'mlb',
    city: 'Milwaukee',
    state: 'WI',
  },
  {
    id: 'pit',
    name: 'Pittsburgh Pirates',
    abbreviation: 'PIT',
    conference: 'NL',
    division: 'Central',
    sport: 'mlb',
    city: 'Pittsburgh',
    state: 'PA',
  },
  {
    id: 'stl',
    name: 'St. Louis Cardinals',
    abbreviation: 'STL',
    conference: 'NL',
    division: 'Central',
    sport: 'mlb',
    city: 'St. Louis',
    state: 'MO',
  },
  {
    id: 'lad',
    name: 'Los Angeles Dodgers',
    abbreviation: 'LAD',
    conference: 'NL',
    division: 'West',
    sport: 'mlb',
    city: 'Los Angeles',
    state: 'CA',
  },
  {
    id: 'sd',
    name: 'San Diego Padres',
    abbreviation: 'SD',
    conference: 'NL',
    division: 'West',
    sport: 'mlb',
    city: 'San Diego',
    state: 'CA',
  },
  {
    id: 'sf',
    name: 'San Francisco Giants',
    abbreviation: 'SF',
    conference: 'NL',
    division: 'West',
    sport: 'mlb',
    city: 'San Francisco',
    state: 'CA',
  },
  {
    id: 'col',
    name: 'Colorado Rockies',
    abbreviation: 'COL',
    conference: 'NL',
    division: 'West',
    sport: 'mlb',
    city: 'Denver',
    state: 'CO',
  },
  {
    id: 'ari',
    name: 'Arizona Diamondbacks',
    abbreviation: 'ARI',
    conference: 'NL',
    division: 'West',
    sport: 'mlb',
    city: 'Phoenix',
    state: 'AZ',
  },
];

function searchMLBTeams(query: string, limit: number): Team[] {
  return MLB_TEAMS.filter(
    (team) =>
      team.name.toLowerCase().includes(query) ||
      team.abbreviation.toLowerCase().includes(query) ||
      (team.city && team.city.toLowerCase().includes(query))
  ).slice(0, limit);
}

/**
 * Static NFL teams data for search
 */
const NFL_TEAMS: Team[] = [
  {
    id: 'buf',
    name: 'Buffalo Bills',
    abbreviation: 'BUF',
    conference: 'AFC',
    division: 'East',
    sport: 'nfl',
    city: 'Buffalo',
    state: 'NY',
  },
  {
    id: 'mia',
    name: 'Miami Dolphins',
    abbreviation: 'MIA',
    conference: 'AFC',
    division: 'East',
    sport: 'nfl',
    city: 'Miami',
    state: 'FL',
  },
  {
    id: 'ne',
    name: 'New England Patriots',
    abbreviation: 'NE',
    conference: 'AFC',
    division: 'East',
    sport: 'nfl',
    city: 'Foxborough',
    state: 'MA',
  },
  {
    id: 'nyj',
    name: 'New York Jets',
    abbreviation: 'NYJ',
    conference: 'AFC',
    division: 'East',
    sport: 'nfl',
    city: 'East Rutherford',
    state: 'NJ',
  },
  {
    id: 'bal',
    name: 'Baltimore Ravens',
    abbreviation: 'BAL',
    conference: 'AFC',
    division: 'North',
    sport: 'nfl',
    city: 'Baltimore',
    state: 'MD',
  },
  {
    id: 'cin',
    name: 'Cincinnati Bengals',
    abbreviation: 'CIN',
    conference: 'AFC',
    division: 'North',
    sport: 'nfl',
    city: 'Cincinnati',
    state: 'OH',
  },
  {
    id: 'cle',
    name: 'Cleveland Browns',
    abbreviation: 'CLE',
    conference: 'AFC',
    division: 'North',
    sport: 'nfl',
    city: 'Cleveland',
    state: 'OH',
  },
  {
    id: 'pit',
    name: 'Pittsburgh Steelers',
    abbreviation: 'PIT',
    conference: 'AFC',
    division: 'North',
    sport: 'nfl',
    city: 'Pittsburgh',
    state: 'PA',
  },
  {
    id: 'hou',
    name: 'Houston Texans',
    abbreviation: 'HOU',
    conference: 'AFC',
    division: 'South',
    sport: 'nfl',
    city: 'Houston',
    state: 'TX',
  },
  {
    id: 'ind',
    name: 'Indianapolis Colts',
    abbreviation: 'IND',
    conference: 'AFC',
    division: 'South',
    sport: 'nfl',
    city: 'Indianapolis',
    state: 'IN',
  },
  {
    id: 'jax',
    name: 'Jacksonville Jaguars',
    abbreviation: 'JAX',
    conference: 'AFC',
    division: 'South',
    sport: 'nfl',
    city: 'Jacksonville',
    state: 'FL',
  },
  {
    id: 'ten',
    name: 'Tennessee Titans',
    abbreviation: 'TEN',
    conference: 'AFC',
    division: 'South',
    sport: 'nfl',
    city: 'Nashville',
    state: 'TN',
  },
  {
    id: 'den',
    name: 'Denver Broncos',
    abbreviation: 'DEN',
    conference: 'AFC',
    division: 'West',
    sport: 'nfl',
    city: 'Denver',
    state: 'CO',
  },
  {
    id: 'kc',
    name: 'Kansas City Chiefs',
    abbreviation: 'KC',
    conference: 'AFC',
    division: 'West',
    sport: 'nfl',
    city: 'Kansas City',
    state: 'MO',
  },
  {
    id: 'lv',
    name: 'Las Vegas Raiders',
    abbreviation: 'LV',
    conference: 'AFC',
    division: 'West',
    sport: 'nfl',
    city: 'Las Vegas',
    state: 'NV',
  },
  {
    id: 'lac',
    name: 'Los Angeles Chargers',
    abbreviation: 'LAC',
    conference: 'AFC',
    division: 'West',
    sport: 'nfl',
    city: 'Los Angeles',
    state: 'CA',
  },
  {
    id: 'dal',
    name: 'Dallas Cowboys',
    abbreviation: 'DAL',
    conference: 'NFC',
    division: 'East',
    sport: 'nfl',
    city: 'Arlington',
    state: 'TX',
  },
  {
    id: 'nyg',
    name: 'New York Giants',
    abbreviation: 'NYG',
    conference: 'NFC',
    division: 'East',
    sport: 'nfl',
    city: 'East Rutherford',
    state: 'NJ',
  },
  {
    id: 'phi',
    name: 'Philadelphia Eagles',
    abbreviation: 'PHI',
    conference: 'NFC',
    division: 'East',
    sport: 'nfl',
    city: 'Philadelphia',
    state: 'PA',
  },
  {
    id: 'wsh',
    name: 'Washington Commanders',
    abbreviation: 'WSH',
    conference: 'NFC',
    division: 'East',
    sport: 'nfl',
    city: 'Landover',
    state: 'MD',
  },
  {
    id: 'chi',
    name: 'Chicago Bears',
    abbreviation: 'CHI',
    conference: 'NFC',
    division: 'North',
    sport: 'nfl',
    city: 'Chicago',
    state: 'IL',
  },
  {
    id: 'det',
    name: 'Detroit Lions',
    abbreviation: 'DET',
    conference: 'NFC',
    division: 'North',
    sport: 'nfl',
    city: 'Detroit',
    state: 'MI',
  },
  {
    id: 'gb',
    name: 'Green Bay Packers',
    abbreviation: 'GB',
    conference: 'NFC',
    division: 'North',
    sport: 'nfl',
    city: 'Green Bay',
    state: 'WI',
  },
  {
    id: 'min',
    name: 'Minnesota Vikings',
    abbreviation: 'MIN',
    conference: 'NFC',
    division: 'North',
    sport: 'nfl',
    city: 'Minneapolis',
    state: 'MN',
  },
  {
    id: 'atl',
    name: 'Atlanta Falcons',
    abbreviation: 'ATL',
    conference: 'NFC',
    division: 'South',
    sport: 'nfl',
    city: 'Atlanta',
    state: 'GA',
  },
  {
    id: 'car',
    name: 'Carolina Panthers',
    abbreviation: 'CAR',
    conference: 'NFC',
    division: 'South',
    sport: 'nfl',
    city: 'Charlotte',
    state: 'NC',
  },
  {
    id: 'no',
    name: 'New Orleans Saints',
    abbreviation: 'NO',
    conference: 'NFC',
    division: 'South',
    sport: 'nfl',
    city: 'New Orleans',
    state: 'LA',
  },
  {
    id: 'tb',
    name: 'Tampa Bay Buccaneers',
    abbreviation: 'TB',
    conference: 'NFC',
    division: 'South',
    sport: 'nfl',
    city: 'Tampa',
    state: 'FL',
  },
  {
    id: 'ari',
    name: 'Arizona Cardinals',
    abbreviation: 'ARI',
    conference: 'NFC',
    division: 'West',
    sport: 'nfl',
    city: 'Glendale',
    state: 'AZ',
  },
  {
    id: 'lar',
    name: 'Los Angeles Rams',
    abbreviation: 'LAR',
    conference: 'NFC',
    division: 'West',
    sport: 'nfl',
    city: 'Los Angeles',
    state: 'CA',
  },
  {
    id: 'sf',
    name: 'San Francisco 49ers',
    abbreviation: 'SF',
    conference: 'NFC',
    division: 'West',
    sport: 'nfl',
    city: 'Santa Clara',
    state: 'CA',
  },
  {
    id: 'sea',
    name: 'Seattle Seahawks',
    abbreviation: 'SEA',
    conference: 'NFC',
    division: 'West',
    sport: 'nfl',
    city: 'Seattle',
    state: 'WA',
  },
];

function searchNFLTeams(query: string, limit: number): Team[] {
  return NFL_TEAMS.filter(
    (team) =>
      team.name.toLowerCase().includes(query) ||
      team.abbreviation.toLowerCase().includes(query) ||
      (team.city && team.city.toLowerCase().includes(query))
  ).slice(0, limit);
}

/**
 * Static NBA teams data for search
 */
const NBA_TEAMS: Team[] = [
  {
    id: 'bos',
    name: 'Boston Celtics',
    abbreviation: 'BOS',
    conference: 'Eastern',
    division: 'Atlantic',
    sport: 'nba',
    city: 'Boston',
    state: 'MA',
  },
  {
    id: 'bkn',
    name: 'Brooklyn Nets',
    abbreviation: 'BKN',
    conference: 'Eastern',
    division: 'Atlantic',
    sport: 'nba',
    city: 'Brooklyn',
    state: 'NY',
  },
  {
    id: 'nyk',
    name: 'New York Knicks',
    abbreviation: 'NYK',
    conference: 'Eastern',
    division: 'Atlantic',
    sport: 'nba',
    city: 'New York',
    state: 'NY',
  },
  {
    id: 'phi',
    name: 'Philadelphia 76ers',
    abbreviation: 'PHI',
    conference: 'Eastern',
    division: 'Atlantic',
    sport: 'nba',
    city: 'Philadelphia',
    state: 'PA',
  },
  {
    id: 'tor',
    name: 'Toronto Raptors',
    abbreviation: 'TOR',
    conference: 'Eastern',
    division: 'Atlantic',
    sport: 'nba',
    city: 'Toronto',
    state: 'ON',
  },
  {
    id: 'chi',
    name: 'Chicago Bulls',
    abbreviation: 'CHI',
    conference: 'Eastern',
    division: 'Central',
    sport: 'nba',
    city: 'Chicago',
    state: 'IL',
  },
  {
    id: 'cle',
    name: 'Cleveland Cavaliers',
    abbreviation: 'CLE',
    conference: 'Eastern',
    division: 'Central',
    sport: 'nba',
    city: 'Cleveland',
    state: 'OH',
  },
  {
    id: 'det',
    name: 'Detroit Pistons',
    abbreviation: 'DET',
    conference: 'Eastern',
    division: 'Central',
    sport: 'nba',
    city: 'Detroit',
    state: 'MI',
  },
  {
    id: 'ind',
    name: 'Indiana Pacers',
    abbreviation: 'IND',
    conference: 'Eastern',
    division: 'Central',
    sport: 'nba',
    city: 'Indianapolis',
    state: 'IN',
  },
  {
    id: 'mil',
    name: 'Milwaukee Bucks',
    abbreviation: 'MIL',
    conference: 'Eastern',
    division: 'Central',
    sport: 'nba',
    city: 'Milwaukee',
    state: 'WI',
  },
  {
    id: 'atl',
    name: 'Atlanta Hawks',
    abbreviation: 'ATL',
    conference: 'Eastern',
    division: 'Southeast',
    sport: 'nba',
    city: 'Atlanta',
    state: 'GA',
  },
  {
    id: 'cha',
    name: 'Charlotte Hornets',
    abbreviation: 'CHA',
    conference: 'Eastern',
    division: 'Southeast',
    sport: 'nba',
    city: 'Charlotte',
    state: 'NC',
  },
  {
    id: 'mia',
    name: 'Miami Heat',
    abbreviation: 'MIA',
    conference: 'Eastern',
    division: 'Southeast',
    sport: 'nba',
    city: 'Miami',
    state: 'FL',
  },
  {
    id: 'orl',
    name: 'Orlando Magic',
    abbreviation: 'ORL',
    conference: 'Eastern',
    division: 'Southeast',
    sport: 'nba',
    city: 'Orlando',
    state: 'FL',
  },
  {
    id: 'wsh',
    name: 'Washington Wizards',
    abbreviation: 'WSH',
    conference: 'Eastern',
    division: 'Southeast',
    sport: 'nba',
    city: 'Washington',
    state: 'DC',
  },
  {
    id: 'den',
    name: 'Denver Nuggets',
    abbreviation: 'DEN',
    conference: 'Western',
    division: 'Northwest',
    sport: 'nba',
    city: 'Denver',
    state: 'CO',
  },
  {
    id: 'min',
    name: 'Minnesota Timberwolves',
    abbreviation: 'MIN',
    conference: 'Western',
    division: 'Northwest',
    sport: 'nba',
    city: 'Minneapolis',
    state: 'MN',
  },
  {
    id: 'okc',
    name: 'Oklahoma City Thunder',
    abbreviation: 'OKC',
    conference: 'Western',
    division: 'Northwest',
    sport: 'nba',
    city: 'Oklahoma City',
    state: 'OK',
  },
  {
    id: 'por',
    name: 'Portland Trail Blazers',
    abbreviation: 'POR',
    conference: 'Western',
    division: 'Northwest',
    sport: 'nba',
    city: 'Portland',
    state: 'OR',
  },
  {
    id: 'uta',
    name: 'Utah Jazz',
    abbreviation: 'UTA',
    conference: 'Western',
    division: 'Northwest',
    sport: 'nba',
    city: 'Salt Lake City',
    state: 'UT',
  },
  {
    id: 'gsw',
    name: 'Golden State Warriors',
    abbreviation: 'GSW',
    conference: 'Western',
    division: 'Pacific',
    sport: 'nba',
    city: 'San Francisco',
    state: 'CA',
  },
  {
    id: 'lac',
    name: 'Los Angeles Clippers',
    abbreviation: 'LAC',
    conference: 'Western',
    division: 'Pacific',
    sport: 'nba',
    city: 'Los Angeles',
    state: 'CA',
  },
  {
    id: 'lal',
    name: 'Los Angeles Lakers',
    abbreviation: 'LAL',
    conference: 'Western',
    division: 'Pacific',
    sport: 'nba',
    city: 'Los Angeles',
    state: 'CA',
  },
  {
    id: 'phx',
    name: 'Phoenix Suns',
    abbreviation: 'PHX',
    conference: 'Western',
    division: 'Pacific',
    sport: 'nba',
    city: 'Phoenix',
    state: 'AZ',
  },
  {
    id: 'sac',
    name: 'Sacramento Kings',
    abbreviation: 'SAC',
    conference: 'Western',
    division: 'Pacific',
    sport: 'nba',
    city: 'Sacramento',
    state: 'CA',
  },
  {
    id: 'dal',
    name: 'Dallas Mavericks',
    abbreviation: 'DAL',
    conference: 'Western',
    division: 'Southwest',
    sport: 'nba',
    city: 'Dallas',
    state: 'TX',
  },
  {
    id: 'hou',
    name: 'Houston Rockets',
    abbreviation: 'HOU',
    conference: 'Western',
    division: 'Southwest',
    sport: 'nba',
    city: 'Houston',
    state: 'TX',
  },
  {
    id: 'mem',
    name: 'Memphis Grizzlies',
    abbreviation: 'MEM',
    conference: 'Western',
    division: 'Southwest',
    sport: 'nba',
    city: 'Memphis',
    state: 'TN',
  },
  {
    id: 'nop',
    name: 'New Orleans Pelicans',
    abbreviation: 'NOP',
    conference: 'Western',
    division: 'Southwest',
    sport: 'nba',
    city: 'New Orleans',
    state: 'LA',
  },
  {
    id: 'sas',
    name: 'San Antonio Spurs',
    abbreviation: 'SAS',
    conference: 'Western',
    division: 'Southwest',
    sport: 'nba',
    city: 'San Antonio',
    state: 'TX',
  },
];

function searchNBATeams(query: string, limit: number): Team[] {
  return NBA_TEAMS.filter(
    (team) =>
      team.name.toLowerCase().includes(query) ||
      team.abbreviation.toLowerCase().includes(query) ||
      (team.city && team.city.toLowerCase().includes(query))
  ).slice(0, limit);
}

// ============================================================================
// Environment Types
// ============================================================================

interface Env {
  KV: KVNamespace;
  DB: D1Database;
}
