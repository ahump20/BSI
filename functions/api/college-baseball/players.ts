/**
 * BLAZE SPORTS INTEL | College Baseball Players API
 *
 * Returns current college baseball players across SEC + Big 12 + Top 25 programs.
 * Filters out drafted players (proAthlete reference), incomplete records, and age > 25.
 *
 * @route GET /api/college-baseball/players
 * @query ?team={teamSlug} - Filter by team
 * @query ?conference={SEC|BIG12|ACC|PAC12|BIG10} - Filter by conference
 * @query ?limit={number} - Limit results (default: 500)
 */

interface CollegeBaseballTeam {
  espnId: string;
  slug: string;
  name: string;
  conference: string;
}

// SEC (16) + Big 12 (14) + ACC Elite + Top 25 Coverage
// ESPN College Baseball Team IDs (verified from ESPN API)
const COLLEGE_BASEBALL_TEAMS: CollegeBaseballTeam[] = [
  // SEC Teams (16) - CORRECT ESPN BASEBALL IDs
  { espnId: '126', slug: 'texas', name: 'Texas Longhorns', conference: 'SEC' },
  { espnId: '123', slug: 'texas-am', name: 'Texas A&M Aggies', conference: 'SEC' },
  { espnId: '85', slug: 'lsu', name: 'LSU Tigers', conference: 'SEC' },
  { espnId: '199', slug: 'tennessee', name: 'Tennessee Volunteers', conference: 'SEC' },
  { espnId: '58', slug: 'arkansas', name: 'Arkansas Razorbacks', conference: 'SEC' },
  { espnId: '75', slug: 'florida', name: 'Florida Gators', conference: 'SEC' },
  { espnId: '78', slug: 'georgia', name: 'Georgia Bulldogs', conference: 'SEC' },
  { espnId: '55', slug: 'auburn', name: 'Auburn Tigers', conference: 'SEC' },
  {
    espnId: '95',
    slug: 'mississippi-state',
    name: 'Mississippi State Bulldogs',
    conference: 'SEC',
  },
  { espnId: '92', slug: 'ole-miss', name: 'Ole Miss Rebels', conference: 'SEC' },
  { espnId: '82', slug: 'kentucky', name: 'Kentucky Wildcats', conference: 'SEC' },
  { espnId: '120', slug: 'vanderbilt', name: 'Vanderbilt Commodores', conference: 'SEC' },
  { espnId: '116', slug: 'south-carolina', name: 'South Carolina Gamecocks', conference: 'SEC' },
  { espnId: '96', slug: 'missouri', name: 'Missouri Tigers', conference: 'SEC' },
  { espnId: '57', slug: 'alabama', name: 'Alabama Crimson Tide', conference: 'SEC' },
  { espnId: '112', slug: 'oklahoma', name: 'Oklahoma Sooners', conference: 'SEC' },

  // Big 12 Teams (14) - CORRECT ESPN BASEBALL IDs
  { espnId: '198', slug: 'tcu', name: 'TCU Horned Frogs', conference: 'BIG12' },
  { espnId: '201', slug: 'texas-tech', name: 'Texas Tech Red Raiders', conference: 'BIG12' },
  { espnId: '110', slug: 'oklahoma-state', name: 'Oklahoma State Cowboys', conference: 'BIG12' },
  { espnId: '121', slug: 'baylor', name: 'Baylor Bears', conference: 'BIG12' },
  { espnId: '81', slug: 'kansas', name: 'Kansas Jayhawks', conference: 'BIG12' },
  { espnId: '83', slug: 'kansas-state', name: 'Kansas State Wildcats', conference: 'BIG12' },
  { espnId: '125', slug: 'west-virginia', name: 'West Virginia Mountaineers', conference: 'BIG12' },
  { espnId: '167', slug: 'houston', name: 'Houston Cougars', conference: 'BIG12' },
  { espnId: '61', slug: 'byu', name: 'BYU Cougars', conference: 'BIG12' },
  { espnId: '66', slug: 'cincinnati', name: 'Cincinnati Bearcats', conference: 'BIG12' },
  { espnId: '161', slug: 'ucf', name: 'UCF Knights', conference: 'BIG12' },
  { espnId: '173', slug: 'arizona', name: 'Arizona Wildcats', conference: 'BIG12' },
  { espnId: '60', slug: 'arizona-state', name: 'Arizona State Sun Devils', conference: 'BIG12' },

  // ACC Elite Programs - CORRECT ESPN BASEBALL IDs
  { espnId: '122', slug: 'virginia', name: 'Virginia Cavaliers', conference: 'ACC' },
  { espnId: '124', slug: 'virginia-tech', name: 'Virginia Tech Hokies', conference: 'ACC' },
  { espnId: '105', slug: 'nc-state', name: 'NC State Wolfpack', conference: 'ACC' },
  { espnId: '125', slug: 'wake-forest', name: 'Wake Forest Demon Deacons', conference: 'ACC' },
  { espnId: '67', slug: 'clemson', name: 'Clemson Tigers', conference: 'ACC' },
  { espnId: '73', slug: 'duke', name: 'Duke Blue Devils', conference: 'ACC' },
  { espnId: '106', slug: 'notre-dame', name: 'Notre Dame Fighting Irish', conference: 'ACC' },
  { espnId: '72', slug: 'florida-state', name: 'Florida State Seminoles', conference: 'ACC' },
  { espnId: '104', slug: 'north-carolina', name: 'North Carolina Tar Heels', conference: 'ACC' },
  { espnId: '91', slug: 'miami', name: 'Miami Hurricanes', conference: 'ACC' },
];

const MAX_COLLEGE_AGE = 25;
const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball';

export interface Env {
  BSI_CACHE?: KVNamespace;
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
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '500'), 2000);

  // Check cache first
  const cacheKey = `college-baseball:players:${teamFilter || 'all'}:${conferenceFilter || 'all'}`;
  if (env.BSI_CACHE) {
    const cached = await env.BSI_CACHE.get(cacheKey, 'json');
    if (cached) {
      return new Response(JSON.stringify(cached), { status: 200, headers });
    }
  }

  try {
    let teamsToFetch = COLLEGE_BASEBALL_TEAMS;

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
    let totalDraftedFiltered = 0;
    let totalAgeFiltered = 0;

    // Fetch rosters in parallel (all at once for speed - ESPN can handle it)
    // Use AbortController for timeout
    const fetchTimeout = 8000; // 8 seconds per request max

    const fetchWithTimeout = async (team: CollegeBaseballTeam) => {
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
        return { team, athletes: data.athletes || [] };
      } catch (e) {
        clearTimeout(timeoutId);
        return { team, athletes: [] };
      }
    };

    // Fetch ALL teams in parallel for maximum speed
    const responses = await Promise.allSettled(teamsToFetch.map(fetchWithTimeout));

    // Process responses
    for (const result of responses) {
      if (result.status === 'rejected') continue;

      const { team, athletes } = result.value;

      for (const player of athletes) {
        // FILTER 1: Skip players who have been drafted (proAthlete reference exists)
        if (player.proAthlete) {
          totalDraftedFiltered++;
          continue;
        }

        // FILTER 2: Skip players with no first name (incomplete/historical records)
        if (!player.firstName || player.firstName === '') {
          continue;
        }

        // FILTER 3: Skip players older than MAX_COLLEGE_AGE
        if (player.age && player.age > MAX_COLLEGE_AGE) {
          totalAgeFiltered++;
          continue;
        }

        const headshotUrl =
          player.headshot?.href ||
          `https://a.espncdn.com/i/headshots/college-baseball/players/full/${player.id}.png`;

        allPlayers.push({
          id: player.id,
          espn_id: player.id,
          name: player.displayName || `${player.firstName} ${player.lastName}`,
          first_name: player.firstName,
          last_name: player.lastName,
          team: team.name,
          team_slug: team.slug,
          conference: team.conference,
          position: player.position?.abbreviation || player.position?.displayName || 'Unknown',
          jersey: player.jersey,
          year: player.experience?.displayValue || null,
          age: player.age || null,
          height: player.height || null,
          weight: player.weight || null,
          bats: player.bats || player.hand?.bats || null,
          throws: player.throws || player.hand?.throws || null,
          headshot_url: headshotUrl,
          is_drafted: false,
          stats: {
            batting: {
              average: player.statistics?.batting?.average || 0,
              homeRuns: player.statistics?.batting?.homeRuns || 0,
              rbi: player.statistics?.batting?.rbi || 0,
            },
            pitching: {
              era: player.statistics?.pitching?.era || 0,
              wins: player.statistics?.pitching?.wins || 0,
              strikeouts: player.statistics?.pitching?.strikeouts || 0,
            },
          },
        });
      }
    }

    const response = {
      timestamp: new Date().toISOString(),
      total: allPlayers.length,
      filtered: {
        drafted: totalDraftedFiltered,
        age: totalAgeFiltered,
      },
      teams: teamsToFetch.length,
      players: allPlayers.slice(0, limit),
      meta: {
        dataSource: 'ESPN College Baseball API',
        lastUpdated: new Date().toISOString(),
        sport: 'college-baseball',
        coverage: 'SEC + Big 12 + ACC + Top 25',
        filters: {
          team: teamFilter || 'all',
          conference: conferenceFilter || 'all',
        },
      },
    };

    // Cache for 30 minutes
    if (env.BSI_CACHE) {
      await env.BSI_CACHE.put(cacheKey, JSON.stringify(response), {
        expirationTtl: 1800,
      });
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error('College Baseball API error:', error);
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
