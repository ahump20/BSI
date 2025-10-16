/**
 * BLAZE SPORTS INTEL - MLB 3D DATA API ENDPOINT
 * Provides formatted roster and team data for 3D Baseball Diamond visualization
 *
 * Endpoint: GET /api/mlb/3d-data
 *
 * Query Parameters:
 * - team: Team identifier (e.g., 'cardinals', 'STL', '138')
 * - season: Season year (default: current year)
 * - includeStats: Include player stats (default: false)
 *
 * Response Format:
 * {
 *   team: { name, primaryColor, secondaryColor, ... },
 *   roster: [{ position, name, number, ... }],
 *   meta: { mode, dataSource, lastUpdated, ... }
 * }
 *
 * @author Austin Humphrey <austin@blazesportsintel.com>
 * @version 1.0.0
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

/**
 * MLB team configurations with colors and identifiers
 */
const MLB_TEAMS = {
  // Cardinals
  cardinals: { id: 138, code: 'STL', name: 'St. Louis Cardinals', primaryColor: '#C41E3A', secondaryColor: '#0C2340' },
  stl: { id: 138, code: 'STL', name: 'St. Louis Cardinals', primaryColor: '#C41E3A', secondaryColor: '#0C2340' },
  138: { id: 138, code: 'STL', name: 'St. Louis Cardinals', primaryColor: '#C41E3A', secondaryColor: '#0C2340' },

  // Yankees
  yankees: { id: 147, code: 'NYY', name: 'New York Yankees', primaryColor: '#003087', secondaryColor: '#E4002B' },
  nyy: { id: 147, code: 'NYY', name: 'New York Yankees', primaryColor: '#003087', secondaryColor: '#E4002B' },
  147: { id: 147, code: 'NYY', name: 'New York Yankees', primaryColor: '#003087', secondaryColor: '#E4002B' },

  // Dodgers
  dodgers: { id: 119, code: 'LAD', name: 'Los Angeles Dodgers', primaryColor: '#005A9C', secondaryColor: '#EF3E42' },
  lad: { id: 119, code: 'LAD', name: 'Los Angeles Dodgers', primaryColor: '#005A9C', secondaryColor: '#EF3E42' },
  119: { id: 119, code: 'LAD', name: 'Los Angeles Dodgers', primaryColor: '#005A9C', secondaryColor: '#EF3E42' },

  // Red Sox
  redsox: { id: 111, code: 'BOS', name: 'Boston Red Sox', primaryColor: '#BD3039', secondaryColor: '#0C2340' },
  bos: { id: 111, code: 'BOS', name: 'Boston Red Sox', primaryColor: '#BD3039', secondaryColor: '#0C2340' },
  111: { id: 111, code: 'BOS', name: 'Boston Red Sox', primaryColor: '#BD3039', secondaryColor: '#0C2340' },

  // Cubs
  cubs: { id: 112, code: 'CHC', name: 'Chicago Cubs', primaryColor: '#0E3386', secondaryColor: '#CC3433' },
  chc: { id: 112, code: 'CHC', name: 'Chicago Cubs', primaryColor: '#0E3386', secondaryColor: '#CC3433' },
  112: { id: 112, code: 'CHC', name: 'Chicago Cubs', primaryColor: '#0E3386', secondaryColor: '#CC3433' },

  // Astros
  astros: { id: 117, code: 'HOU', name: 'Houston Astros', primaryColor: '#002D62', secondaryColor: '#EB6E1F' },
  hou: { id: 117, code: 'HOU', name: 'Houston Astros', primaryColor: '#002D62', secondaryColor: '#EB6E1F' },
  117: { id: 117, code: 'HOU', name: 'Houston Astros', primaryColor: '#002D62', secondaryColor: '#EB6E1F' },

  // Rangers
  rangers: { id: 140, code: 'TEX', name: 'Texas Rangers', primaryColor: '#003278', secondaryColor: '#C0111F' },
  tex: { id: 140, code: 'TEX', name: 'Texas Rangers', primaryColor: '#003278', secondaryColor: '#C0111F' },
  140: { id: 140, code: 'TEX', name: 'Texas Rangers', primaryColor: '#003278', secondaryColor: '#C0111F' },

  // Braves
  braves: { id: 144, code: 'ATL', name: 'Atlanta Braves', primaryColor: '#CE1141', secondaryColor: '#13274F' },
  atl: { id: 144, code: 'ATL', name: 'Atlanta Braves', primaryColor: '#CE1141', secondaryColor: '#13274F' },
  144: { id: 144, code: 'ATL', name: 'Atlanta Braves', primaryColor: '#CE1141', secondaryColor: '#13274F' },
};

/**
 * Position mapping from MLB Stats API to 3D visualization
 */
const POSITION_MAPPING = {
  '1': 'P',    // Pitcher
  '2': 'C',    // Catcher
  '3': '1B',   // First Base
  '4': '2B',   // Second Base
  '5': '3B',   // Third Base
  '6': 'SS',   // Shortstop
  '7': 'LF',   // Left Field
  '8': 'CF',   // Center Field
  '9': 'RF',   // Right Field
  '10': 'DH',  // Designated Hitter
};

/**
 * Demo roster data for fallback
 */
const DEMO_ROSTERS = {
  STL: [
    { position: 'P', name: 'Jack Flaherty', number: 22, stats: { era: 3.52, whip: 1.18 } },
    { position: 'C', name: 'Willson Contreras', number: 40, stats: { avg: 0.285, hr: 18 } },
    { position: '1B', name: 'Paul Goldschmidt', number: 46, stats: { avg: 0.265, hr: 22 } },
    { position: '2B', name: 'Nolan Gorman', number: 16, stats: { avg: 0.242, hr: 16 } },
    { position: '3B', name: 'Nolan Arenado', number: 28, stats: { avg: 0.272, hr: 26 } },
    { position: 'SS', name: 'Tommy Edman', number: 19, stats: { avg: 0.248, hr: 6 } },
    { position: 'LF', name: 'Tyler O\'Neill', number: 27, stats: { avg: 0.228, hr: 31 } },
    { position: 'CF', name: 'Harrison Bader', number: 48, stats: { avg: 0.256, hr: 12 } },
    { position: 'RF', name: 'Dylan Carlson', number: 3, stats: { avg: 0.235, hr: 8 } }
  ],
  NYY: [
    { position: 'P', name: 'Gerrit Cole', number: 45, stats: { era: 2.63, whip: 0.98 } },
    { position: 'C', name: 'Jose Trevino', number: 39, stats: { avg: 0.248, hr: 11 } },
    { position: '1B', name: 'Anthony Rizzo', number: 48, stats: { avg: 0.244, hr: 22 } },
    { position: '2B', name: 'Gleyber Torres', number: 25, stats: { avg: 0.273, hr: 25 } },
    { position: '3B', name: 'DJ LeMahieu', number: 26, stats: { avg: 0.243, hr: 8 } },
    { position: 'SS', name: 'Anthony Volpe', number: 11, stats: { avg: 0.209, hr: 12 } },
    { position: 'LF', name: 'Alex Verdugo', number: 24, stats: { avg: 0.280, hr: 13 } },
    { position: 'CF', name: 'Aaron Judge', number: 99, stats: { avg: 0.322, hr: 58 } },
    { position: 'RF', name: 'Juan Soto', number: 22, stats: { avg: 0.288, hr: 35 } }
  ]
};

/**
 * Fetch roster from MLB Stats API
 */
async function fetchMLBRoster(teamId, season, includeStats = false) {
  try {
    const rosterUrl = `https://statsapi.mlb.com/api/v1/teams/${teamId}/roster?rosterType=active&season=${season}`;
    const response = await fetch(rosterUrl, {
      headers: {
        'User-Agent': 'BlazeSportsIntel/1.0',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`MLB API returned ${response.status}`);
    }

    const data = await response.json();

    // Transform roster data for 3D visualization
    const roster = data.roster
      ?.filter(player => player.position?.abbreviation in POSITION_MAPPING)
      .map(player => ({
        position: POSITION_MAPPING[player.position.code] || player.position.abbreviation,
        name: player.person.fullName,
        number: player.jerseyNumber,
        playerId: player.person.id,
        ...(includeStats && { stats: {} }) // Stats would require additional API call
      })) || [];

    return {
      roster,
      source: 'MLB Stats API',
      cached: false
    };
  } catch (error) {
    console.error('MLB API fetch error:', error);
    return null;
  }
}

/**
 * Get demo roster for team
 */
function getDemoRoster(teamCode) {
  return DEMO_ROSTERS[teamCode] || DEMO_ROSTERS.STL;
}

/**
 * Main handler
 */
export async function onRequest({ request, env, ctx }) {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const url = new URL(request.url);
    const teamParam = url.searchParams.get('team') || 'cardinals';
    const season = url.searchParams.get('season') || new Date().getFullYear().toString();
    const includeStats = url.searchParams.get('includeStats') === 'true';

    // Resolve team configuration
    const teamConfig = MLB_TEAMS[teamParam.toLowerCase()];

    if (!teamConfig) {
      return new Response(
        JSON.stringify({
          error: 'Invalid team',
          availableTeams: Object.keys(MLB_TEAMS).filter(k => isNaN(k)),
          meta: { timestamp: new Date().toISOString() }
        }),
        {
          status: 400,
          headers: CORS_HEADERS
        }
      );
    }

    // Try to fetch from cache (KV)
    const cacheKey = `mlb:3d-data:${teamConfig.code}:${season}:${includeStats}`;
    let cachedData = null;

    if (env?.CACHE) {
      try {
        cachedData = await env.CACHE.get(cacheKey, 'json');
        if (cachedData && cachedData.expires > Date.now()) {
          return new Response(
            JSON.stringify({
              ...cachedData.data,
              meta: {
                ...cachedData.data.meta,
                cached: true,
                cacheAge: Math.floor((Date.now() - cachedData.timestamp) / 1000)
              }
            }),
            {
              headers: {
                ...CORS_HEADERS,
                'Cache-Control': 'public, max-age=300',
                'X-Cache': 'HIT'
              }
            }
          );
        }
      } catch (error) {
        console.error('KV cache read error:', error);
      }
    }

    // Try to fetch live roster
    const liveData = await fetchMLBRoster(teamConfig.id, season, includeStats);

    let roster, mode, dataSource;

    if (liveData && liveData.roster.length > 0) {
      // Use live data
      roster = liveData.roster;
      mode = 'LIVE';
      dataSource = 'MLB Stats API (statsapi.mlb.com)';
    } else {
      // Fallback to demo data
      roster = getDemoRoster(teamConfig.code);
      mode = 'DEMO';
      dataSource = 'Demo Data (MLB API Unavailable)';
    }

    const responseData = {
      team: {
        id: teamConfig.id,
        code: teamConfig.code,
        name: teamConfig.name,
        primaryColor: teamConfig.primaryColor,
        secondaryColor: teamConfig.secondaryColor
      },
      roster,
      meta: {
        mode,
        dataSource,
        season,
        lastUpdated: new Date().toISOString(),
        cached: false,
        renderEngine: 'React Three Fiber + Three.js',
        visualizationType: '3D Baseball Diamond',
        fieldDimensions: {
          basePath: '90 feet (27.43m)',
          pitcherDistance: '60\'6" (18.44m)',
          outfieldDepth: '~400 feet (122m)'
        }
      }
    };

    // Cache the response (5 minutes for live, 30 minutes for demo)
    if (env?.CACHE) {
      const ttl = mode === 'LIVE' ? 300 : 1800;
      try {
        await env.CACHE.put(
          cacheKey,
          JSON.stringify({
            data: responseData,
            timestamp: Date.now(),
            expires: Date.now() + (ttl * 1000)
          }),
          { expirationTtl: ttl }
        );
      } catch (error) {
        console.error('KV cache write error:', error);
      }
    }

    return new Response(JSON.stringify(responseData), {
      headers: {
        ...CORS_HEADERS,
        'Cache-Control': `public, max-age=${mode === 'LIVE' ? 300 : 1800}`,
        'X-Cache': 'MISS'
      }
    });
  } catch (error) {
    console.error('3D data endpoint error:', error);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message,
        meta: {
          mode: 'ERROR',
          timestamp: new Date().toISOString()
        }
      }),
      {
        status: 500,
        headers: CORS_HEADERS
      }
    );
  }
}
