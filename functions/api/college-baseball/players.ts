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

// SEC (16) + Big 12 (16) + ACC Elite + Top 25 Coverage
const COLLEGE_BASEBALL_TEAMS: CollegeBaseballTeam[] = [
  // SEC Teams (16)
  { espnId: '126', slug: 'texas', name: 'Texas Longhorns', conference: 'SEC' },
  { espnId: '123', slug: 'texas-am', name: 'Texas A&M Aggies', conference: 'SEC' },
  { espnId: '85', slug: 'lsu', name: 'LSU Tigers', conference: 'SEC' },
  { espnId: '199', slug: 'tennessee', name: 'Tennessee Volunteers', conference: 'SEC' },
  { espnId: '6', slug: 'arkansas', name: 'Arkansas Razorbacks', conference: 'SEC' },
  { espnId: '51', slug: 'florida', name: 'Florida Gators', conference: 'SEC' },
  { espnId: '54', slug: 'georgia', name: 'Georgia Bulldogs', conference: 'SEC' },
  { espnId: '2', slug: 'auburn', name: 'Auburn Tigers', conference: 'SEC' },
  {
    espnId: '97',
    slug: 'mississippi-state',
    name: 'Mississippi State Bulldogs',
    conference: 'SEC',
  },
  { espnId: '116', slug: 'ole-miss', name: 'Ole Miss Rebels', conference: 'SEC' },
  { espnId: '77', slug: 'kentucky', name: 'Kentucky Wildcats', conference: 'SEC' },
  { espnId: '219', slug: 'vanderbilt', name: 'Vanderbilt Commodores', conference: 'SEC' },
  { espnId: '2579', slug: 'south-carolina', name: 'South Carolina Gamecocks', conference: 'SEC' },
  { espnId: '101', slug: 'missouri', name: 'Missouri Tigers', conference: 'SEC' },
  { espnId: '333', slug: 'alabama', name: 'Alabama Crimson Tide', conference: 'SEC' },
  { espnId: '145', slug: 'oklahoma', name: 'Oklahoma Sooners', conference: 'SEC' },

  // Big 12 Teams (14)
  { espnId: '190', slug: 'tcu', name: 'TCU Horned Frogs', conference: 'BIG12' },
  { espnId: '218', slug: 'texas-tech', name: 'Texas Tech Red Raiders', conference: 'BIG12' },
  { espnId: '146', slug: 'oklahoma-state', name: 'Oklahoma State Cowboys', conference: 'BIG12' },
  { espnId: '7', slug: 'baylor', name: 'Baylor Bears', conference: 'BIG12' },
  { espnId: '74', slug: 'kansas', name: 'Kansas Jayhawks', conference: 'BIG12' },
  { espnId: '75', slug: 'kansas-state', name: 'Kansas State Wildcats', conference: 'BIG12' },
  { espnId: '260', slug: 'west-virginia', name: 'West Virginia Mountaineers', conference: 'BIG12' },
  { espnId: '62', slug: 'houston', name: 'Houston Cougars', conference: 'BIG12' },
  { espnId: '17', slug: 'byu', name: 'BYU Cougars', conference: 'BIG12' },
  { espnId: '23', slug: 'cincinnati', name: 'Cincinnati Bearcats', conference: 'BIG12' },
  { espnId: '213', slug: 'ucf', name: 'UCF Knights', conference: 'BIG12' },
  { espnId: '66', slug: 'iowa-state', name: 'Iowa State Cyclones', conference: 'BIG12' },
  { espnId: '11', slug: 'arizona', name: 'Arizona Wildcats', conference: 'BIG12' },
  { espnId: '12', slug: 'arizona-state', name: 'Arizona State Sun Devils', conference: 'BIG12' },

  // ACC Elite Programs
  { espnId: '234', slug: 'virginia', name: 'Virginia Cavaliers', conference: 'ACC' },
  { espnId: '228', slug: 'virginia-tech', name: 'Virginia Tech Hokies', conference: 'ACC' },
  { espnId: '103', slug: 'nc-state', name: 'NC State Wolfpack', conference: 'ACC' },
  { espnId: '257', slug: 'wake-forest', name: 'Wake Forest Demon Deacons', conference: 'ACC' },
  { espnId: '26', slug: 'clemson', name: 'Clemson Tigers', conference: 'ACC' },
  { espnId: '147', slug: 'pittsburgh', name: 'Pittsburgh Panthers', conference: 'ACC' },
  { espnId: '44', slug: 'duke', name: 'Duke Blue Devils', conference: 'ACC' },
  { espnId: '130', slug: 'notre-dame', name: 'Notre Dame Fighting Irish', conference: 'ACC' },

  // Other Top 25 Programs
  { espnId: '149', slug: 'oregon-state', name: 'Oregon State Beavers', conference: 'PAC12' },
  { espnId: '184', slug: 'stanford', name: 'Stanford Cardinal', conference: 'PAC12' },
  { espnId: '200', slug: 'ucla', name: 'UCLA Bruins', conference: 'PAC12' },
];

const MAX_COLLEGE_AGE = 25;
const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball';

export interface Env {
  SPORTS_CACHE?: KVNamespace;
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
  if (env.SPORTS_CACHE) {
    const cached = await env.SPORTS_CACHE.get(cacheKey, 'json');
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

    // Fetch rosters in parallel (batched to avoid rate limits)
    const batchSize = 10;
    for (let i = 0; i < teamsToFetch.length; i += batchSize) {
      const batch = teamsToFetch.slice(i, i + batchSize);

      const responses = await Promise.allSettled(
        batch.map(async (team) => {
          const rosterUrl = `${ESPN_BASE}/teams/${team.espnId}/roster`;
          const response = await fetch(rosterUrl, {
            headers: {
              'User-Agent': 'BlazeSportsIntel/1.0',
              Accept: 'application/json',
            },
          });

          if (!response.ok) {
            console.error(`Failed to fetch roster for ${team.name}: ${response.status}`);
            return { team, athletes: [] };
          }

          const data = await response.json();
          return { team, athletes: data.athletes || [] };
        })
      );

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
    if (env.SPORTS_CACHE) {
      await env.SPORTS_CACHE.put(cacheKey, JSON.stringify(response), {
        expirationTtl: 1800,
      });
    }

    // Return just the players array for compatibility with frontend
    return new Response(JSON.stringify(allPlayers.slice(0, limit)), {
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
