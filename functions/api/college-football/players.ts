/**
 * BLAZE SPORTS INTEL | College Football Players API
 *
 * Returns current college football players across SEC + Big 12 + Top 25 programs.
 * Uses ESPN API with optional CFBD enhancement.
 *
 * @route GET /api/college-football/players
 * @query ?team={teamSlug} - Filter by team
 * @query ?conference={SEC|BIG12|ACC|BIG10} - Filter by conference
 * @query ?position={QB|RB|WR|...} - Filter by position
 * @query ?limit={number} - Limit results (default: 500)
 */

interface CollegeFootballTeam {
  espnId: string;
  slug: string;
  name: string;
  conference: string;
}

// SEC (16) + Big 12 (16) + ACC Elite + Big Ten Elite + Top 25
const COLLEGE_FOOTBALL_TEAMS: CollegeFootballTeam[] = [
  // SEC Teams (16)
  { espnId: '251', slug: 'texas', name: 'Texas Longhorns', conference: 'SEC' },
  { espnId: '245', slug: 'texas-am', name: 'Texas A&M Aggies', conference: 'SEC' },
  { espnId: '99', slug: 'lsu', name: 'LSU Tigers', conference: 'SEC' },
  { espnId: '2633', slug: 'tennessee', name: 'Tennessee Volunteers', conference: 'SEC' },
  { espnId: '8', slug: 'arkansas', name: 'Arkansas Razorbacks', conference: 'SEC' },
  { espnId: '57', slug: 'florida', name: 'Florida Gators', conference: 'SEC' },
  { espnId: '61', slug: 'georgia', name: 'Georgia Bulldogs', conference: 'SEC' },
  { espnId: '2', slug: 'auburn', name: 'Auburn Tigers', conference: 'SEC' },
  {
    espnId: '344',
    slug: 'mississippi-state',
    name: 'Mississippi State Bulldogs',
    conference: 'SEC',
  },
  { espnId: '145', slug: 'ole-miss', name: 'Ole Miss Rebels', conference: 'SEC' },
  { espnId: '96', slug: 'kentucky', name: 'Kentucky Wildcats', conference: 'SEC' },
  { espnId: '238', slug: 'vanderbilt', name: 'Vanderbilt Commodores', conference: 'SEC' },
  { espnId: '2579', slug: 'south-carolina', name: 'South Carolina Gamecocks', conference: 'SEC' },
  { espnId: '142', slug: 'missouri', name: 'Missouri Tigers', conference: 'SEC' },
  { espnId: '333', slug: 'alabama', name: 'Alabama Crimson Tide', conference: 'SEC' },
  { espnId: '201', slug: 'oklahoma', name: 'Oklahoma Sooners', conference: 'SEC' },

  // Big 12 Teams (16)
  { espnId: '2628', slug: 'tcu', name: 'TCU Horned Frogs', conference: 'BIG12' },
  { espnId: '2641', slug: 'texas-tech', name: 'Texas Tech Red Raiders', conference: 'BIG12' },
  { espnId: '197', slug: 'oklahoma-state', name: 'Oklahoma State Cowboys', conference: 'BIG12' },
  { espnId: '239', slug: 'baylor', name: 'Baylor Bears', conference: 'BIG12' },
  { espnId: '2305', slug: 'kansas', name: 'Kansas Jayhawks', conference: 'BIG12' },
  { espnId: '2306', slug: 'kansas-state', name: 'Kansas State Wildcats', conference: 'BIG12' },
  { espnId: '277', slug: 'west-virginia', name: 'West Virginia Mountaineers', conference: 'BIG12' },
  { espnId: '248', slug: 'houston', name: 'Houston Cougars', conference: 'BIG12' },
  { espnId: '252', slug: 'byu', name: 'BYU Cougars', conference: 'BIG12' },
  { espnId: '2132', slug: 'cincinnati', name: 'Cincinnati Bearcats', conference: 'BIG12' },
  { espnId: '2116', slug: 'ucf', name: 'UCF Knights', conference: 'BIG12' },
  { espnId: '66', slug: 'iowa-state', name: 'Iowa State Cyclones', conference: 'BIG12' },
  { espnId: '12', slug: 'arizona', name: 'Arizona Wildcats', conference: 'BIG12' },
  { espnId: '9', slug: 'arizona-state', name: 'Arizona State Sun Devils', conference: 'BIG12' },
  { espnId: '36', slug: 'colorado', name: 'Colorado Buffaloes', conference: 'BIG12' },
  { espnId: '254', slug: 'utah', name: 'Utah Utes', conference: 'BIG12' },

  // ACC Elite Programs
  { espnId: '52', slug: 'florida-state', name: 'Florida State Seminoles', conference: 'ACC' },
  { espnId: '228', slug: 'clemson', name: 'Clemson Tigers', conference: 'ACC' },
  { espnId: '2390', slug: 'miami', name: 'Miami Hurricanes', conference: 'ACC' },
  { espnId: '152', slug: 'nc-state', name: 'NC State Wolfpack', conference: 'ACC' },
  { espnId: '153', slug: 'unc', name: 'North Carolina Tar Heels', conference: 'ACC' },
  { espnId: '59', slug: 'georgia-tech', name: 'Georgia Tech Yellow Jackets', conference: 'ACC' },
  { espnId: '150', slug: 'duke', name: 'Duke Blue Devils', conference: 'ACC' },

  // Big Ten Elite Programs
  { espnId: '130', slug: 'michigan', name: 'Michigan Wolverines', conference: 'BIG10' },
  { espnId: '194', slug: 'ohio-state', name: 'Ohio State Buckeyes', conference: 'BIG10' },
  { espnId: '213', slug: 'penn-state', name: 'Penn State Nittany Lions', conference: 'BIG10' },
  { espnId: '356', slug: 'usc', name: 'USC Trojans', conference: 'BIG10' },
  { espnId: '26', slug: 'ucla', name: 'UCLA Bruins', conference: 'BIG10' },
  { espnId: '275', slug: 'wisconsin', name: 'Wisconsin Badgers', conference: 'BIG10' },
  { espnId: '2294', slug: 'iowa', name: 'Iowa Hawkeyes', conference: 'BIG10' },
  { espnId: '135', slug: 'minnesota', name: 'Minnesota Golden Gophers', conference: 'BIG10' },
  { espnId: '2509', slug: 'oregon', name: 'Oregon Ducks', conference: 'BIG10' },
  { espnId: '264', slug: 'washington', name: 'Washington Huskies', conference: 'BIG10' },

  // Other Top 25
  { espnId: '87', slug: 'notre-dame', name: 'Notre Dame Fighting Irish', conference: 'IND' },
];

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/football/college-football';

export interface Env {
  BSI_CACHE?: KVNamespace;
  CFBD_API_KEY?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=1800, s-maxage=3600',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  const teamFilter = url.searchParams.get('team')?.toLowerCase();
  const conferenceFilter = url.searchParams.get('conference')?.toUpperCase();
  const positionFilter = url.searchParams.get('position')?.toUpperCase();
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '500'), 2000);

  // Check cache first
  const cacheKey = `college-football:players:${teamFilter || 'all'}:${conferenceFilter || 'all'}:${positionFilter || 'all'}`;
  if (env.BSI_CACHE) {
    const cached = await env.BSI_CACHE.get(cacheKey, 'json');
    if (cached) {
      return new Response(JSON.stringify(cached), { status: 200, headers });
    }
  }

  try {
    let teamsToFetch = COLLEGE_FOOTBALL_TEAMS;

    // Apply conference filter
    if (conferenceFilter) {
      teamsToFetch = teamsToFetch.filter((t) => t.conference === conferenceFilter);
    }

    // Apply team filter
    if (teamFilter) {
      teamsToFetch = teamsToFetch.filter(
        (t) => t.slug.includes(teamFilter) || t.name.toLowerCase().includes(teamFilter)
      );
    }

    const allPlayers: any[] = [];

    // Fetch ALL rosters in parallel for maximum speed
    const fetchTimeout = 8000; // 8 seconds per request max

    const fetchWithTimeout = async (team: CollegeFootballTeam) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), fetchTimeout);

      try {
        const rosterUrl = `${ESPN_BASE}/teams/${team.espnId}/roster`;
        const response = await fetch(rosterUrl, {
          headers: {
            'User-Agent': 'BlazeSportsIntel/1.0',
            Accept: 'application/json',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          return { team, athletes: [] };
        }

        const data = await response.json();
        // College football rosters are nested in position groups
        const athletes: any[] = [];
        if (data.athletes) {
          for (const group of data.athletes) {
            if (group.items) {
              athletes.push(...group.items);
            }
          }
        }
        return { team, athletes };
      } catch (e) {
        clearTimeout(timeoutId);
        return { team, athletes: [] };
      }
    };

    // Fetch ALL teams in parallel
    const responses = await Promise.allSettled(teamsToFetch.map(fetchWithTimeout));

    for (const result of responses) {
      if (result.status === 'rejected') continue;

      const { team, athletes } = result.value;

      for (const player of athletes) {
        // Skip players with no first name (incomplete/historical records)
        if (!player.firstName || player.firstName === '') {
          continue;
        }

        const position = player.position?.abbreviation || player.position?.displayName || 'Unknown';

        // Apply position filter
        if (positionFilter && position.toUpperCase() !== positionFilter) {
          continue;
        }

        const headshotUrl =
          player.headshot?.href ||
          `https://a.espncdn.com/combiner/i?img=/i/headshots/college-football/players/full/${player.id}.png&w=350&h=254`;

        allPlayers.push({
          id: player.id,
          espn_id: player.id,
          name: player.displayName || `${player.firstName} ${player.lastName}`,
          first_name: player.firstName,
          last_name: player.lastName,
          team: team.name,
          team_slug: team.slug,
          conference: team.conference,
          position,
          jersey: player.jersey,
          year: player.experience?.displayValue || null,
          height: player.height || null,
          weight: player.weight || null,
          hometown: player.birthPlace?.city
            ? `${player.birthPlace.city}, ${player.birthPlace.state}`
            : null,
          headshot_url: headshotUrl,
          stats: {
            passing: {
              yards: player.statistics?.passing?.passingYards || 0,
              touchdowns: player.statistics?.passing?.passingTouchdowns || 0,
              interceptions: player.statistics?.passing?.interceptions || 0,
              qbRating: player.statistics?.passing?.qbRating || 0,
            },
            rushing: {
              yards: player.statistics?.rushing?.rushingYards || 0,
              touchdowns: player.statistics?.rushing?.rushingTouchdowns || 0,
              yardsPerCarry: player.statistics?.rushing?.yardsPerCarry || 0,
            },
            receiving: {
              yards: player.statistics?.receiving?.receivingYards || 0,
              touchdowns: player.statistics?.receiving?.receivingTouchdowns || 0,
              receptions: player.statistics?.receiving?.receptions || 0,
            },
          },
        });
      }
    }

    const response = {
      timestamp: new Date().toISOString(),
      total: allPlayers.length,
      teams: teamsToFetch.length,
      players: allPlayers.slice(0, limit),
      meta: {
        dataSource: 'ESPN College Football API',
        lastUpdated: new Date().toISOString(),
        sport: 'college-football',
        coverage: 'SEC + Big 12 + ACC + Big Ten + Top 25',
        filters: {
          team: teamFilter || 'all',
          conference: conferenceFilter || 'all',
          position: positionFilter || 'all',
        },
      },
    };

    // Cache for 30 minutes
    if (env.BSI_CACHE) {
      await env.BSI_CACHE.put(cacheKey, JSON.stringify(response), {
        expirationTtl: 1800,
      });
    }

    // Return just the players array for compatibility with frontend
    return new Response(JSON.stringify(allPlayers.slice(0, limit)), {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error('College Football API error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error?.message || 'Unknown error',
      }),
      {
        status: 500,
        headers,
      }
    );
  }
};
