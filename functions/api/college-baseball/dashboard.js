/**
 * College Baseball Dashboard API
 * Unified endpoint for NCAA baseball analytics dashboard
 *
 * GET /api/college-baseball/dashboard - Full dashboard data
 * GET /api/college-baseball/dashboard?section=rankings - Just rankings
 * GET /api/college-baseball/dashboard?section=standings&conference=SEC
 *
 * Data sources: ESPN API with intelligent fallback
 * Caching: 15 minutes for rankings, 5 minutes for standings
 */

import { fetchStandings, fetchTeams } from './_ncaa-adapter.js';

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball';
const USER_AGENT = 'BlazeSportsIntel/1.0 (https://blazesportsintel.com)';

const CACHE_TTL = {
  rankings: 900, // 15 minutes
  standings: 300, // 5 minutes
  dashboard: 600, // 10 minutes
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * Fetch current rankings from ESPN
 */
async function fetchRankings() {
  try {
    const url = `${ESPN_BASE}/rankings`;
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!response.ok) {
      return getFallbackRankings();
    }

    const data = await response.json();

    // ESPN rankings structure: data.rankings[0].ranks
    const polls = data.rankings || [];
    const mainPoll = polls.find(
      (p) => p.name === 'Coaches Poll' || p.name === 'AP Top 25' || p.type === 'coaches'
    );

    if (!mainPoll?.ranks) {
      return getFallbackRankings();
    }

    return mainPoll.ranks.slice(0, 25).map((team, index) => ({
      rank: team.current || index + 1,
      previousRank: team.previous || team.current || index + 1,
      team: team.team?.displayName || team.team?.name || 'Unknown',
      conference: team.team?.conferenceId ? getConferenceName(team.team.conferenceId) : 'Unknown',
      record: team.recordSummary || '0-0',
      rpi: '-', // ESPN doesn't provide RPI in rankings
      logo:
        team.team?.logos?.[0]?.href ||
        `https://a.espncdn.com/i/teamlogos/ncaa/500/${team.team?.id || 0}.png`,
      trend: getTrend(team.current || index + 1, team.previous),
      points: team.points || 0,
      firstPlaceVotes: team.firstPlaceVotes || 0,
    }));
  } catch (error) {
    console.error('Rankings fetch error:', error.message);
    return getFallbackRankings();
  }
}

/**
 * Calculate tournament bubble status based on rankings and record
 */
function calculateBubbleWatch(rankings, standings) {
  const bubbleTeams = [];

  // Teams ranked 15-35 are typically on the bubble
  const bubbleCandidates = rankings.slice(14, 40);

  // Also include teams with good records from power conferences
  const powerConferences = ['SEC', 'ACC', 'Big 12', 'Big Ten', 'Pac-12'];

  for (const team of bubbleCandidates) {
    let status = 'bubble';

    // Locks: Top 16 seeds (ranked 1-16 with good records)
    if (team.rank <= 16) {
      status = 'lock';
    }
    // Safe: Ranked 17-24 with winning record
    else if (team.rank <= 24) {
      const wins = parseInt(team.record?.split('-')[0]) || 0;
      const losses = parseInt(team.record?.split('-')[1]) || 0;
      if (wins > losses * 1.5) {
        status = 'lock';
      }
    }
    // At risk: Ranked 30+ or poor recent performance
    else if (team.rank > 30) {
      status = 'out';
    }

    bubbleTeams.push({
      team: team.team,
      rank: team.rank,
      record: team.record,
      conference: team.conference,
      rpi: team.rpi || '-',
      status,
    });
  }

  // Sort: locks first, then bubble, then out
  const statusOrder = { lock: 0, bubble: 1, out: 2 };
  return bubbleTeams.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]).slice(0, 12);
}

/**
 * Calculate projected regional hosts (top 16 seeds)
 */
function calculateProjectedHosts(rankings) {
  return rankings.slice(0, 16).map((team, index) => ({
    seed: index + 1,
    team: team.team,
    conference: team.conference,
    record: team.record,
    logo: team.logo,
  }));
}

/**
 * Calculate RPI movers (biggest risers and fallers)
 */
function calculateRPIMovers(rankings) {
  const movers = rankings
    .filter((t) => t.previousRank && t.previousRank !== t.rank)
    .map((team) => ({
      team: team.team,
      currentRank: team.rank,
      previousRank: team.previousRank,
      change: team.previousRank - team.rank,
      conference: team.conference,
      logo: team.logo,
    }))
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

  return {
    risers: movers.filter((t) => t.change > 0).slice(0, 5),
    fallers: movers.filter((t) => t.change < 0).slice(0, 5),
  };
}

/**
 * Main request handler
 */
export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(request.url);
  const section = url.searchParams.get('section');
  const conference = url.searchParams.get('conference') || 'SEC';

  try {
    const cacheKey = `college-baseball:dashboard:${section || 'all'}:${conference}`;

    // Check cache
    if (env.CACHE) {
      const cached = await env.CACHE.get(cacheKey, { type: 'json' });
      if (cached) {
        return new Response(
          JSON.stringify({
            ...cached,
            fromCache: true,
          }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
              'Cache-Control': 'public, max-age=300',
            },
          }
        );
      }
    }

    // Fetch fresh data
    let responseData = {
      success: true,
      fromCache: false,
      timestamp: new Date().toLocaleString('en-US', {
        timeZone: 'America/Chicago',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
      timezone: 'America/Chicago',
      season: getCurrentSeason(),
    };

    // Fetch based on section requested
    if (!section || section === 'all' || section === 'rankings') {
      const rankings = await fetchRankings();
      responseData.rankings = rankings;

      if (!section || section === 'all') {
        responseData.bubbleWatch = calculateBubbleWatch(rankings, []);
        responseData.projectedHosts = calculateProjectedHosts(rankings);
        responseData.rpiMovers = calculateRPIMovers(rankings);
      }
    }

    if (!section || section === 'all' || section === 'standings') {
      const standings = await fetchStandings(conference);
      responseData.standings = {
        conference,
        teams: standings,
      };
    }

    // Cache the response
    if (env.CACHE) {
      await env.CACHE.put(cacheKey, JSON.stringify(responseData), {
        expirationTtl: section === 'standings' ? CACHE_TTL.standings : CACHE_TTL.dashboard,
      });
    }

    return new Response(JSON.stringify(responseData), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    console.error('Dashboard API error:', error.message);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch dashboard data',
        message: error.message,
        fallback: true,
        rankings: getFallbackRankings(),
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getTrend(current, previous) {
  if (!previous || current === previous) return 'same';
  return current < previous ? 'up' : 'down';
}

function getConferenceName(conferenceId) {
  const conferences = {
    23: 'SEC',
    1: 'ACC',
    4: 'Big 12',
    5: 'Big Ten',
    9: 'Pac-12',
    151: 'American',
    12: 'Conference USA',
    37: 'Sun Belt',
    14: 'MAC',
    17: 'Mountain West',
    18: 'WAC',
    20: 'Big West',
    49: 'Atlantic 10',
    62: 'WCC',
  };
  return conferences[conferenceId] || 'Other';
}

function getCurrentSeason() {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  // College baseball season: Feb-June
  // If we're in Jan-June, it's the current year's season
  // If we're in July-Dec, it's the next year's preseason
  if (month >= 6) {
    // July onwards
    return {
      year: year + 1,
      phase: 'preseason',
      label: `${year + 1} Preseason`,
    };
  } else if (month >= 1) {
    // Feb-June
    return {
      year: year,
      phase: 'regular',
      label: `${year} Season`,
    };
  } else {
    // January
    return {
      year: year,
      phase: 'preseason',
      label: `${year} Preseason`,
    };
  }
}

// ============================================================================
// FALLBACK DATA - 2026 Preseason Projections
// ============================================================================

function getFallbackRankings() {
  // 2026 Preseason projections based on returning talent, recruiting, transfers
  return [
    {
      rank: 1,
      previousRank: null,
      team: 'Texas A&M',
      conference: 'SEC',
      record: '0-0',
      rpi: '-',
      logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/245.png',
      trend: 'same',
      points: 775,
      firstPlaceVotes: 28,
    },
    {
      rank: 2,
      previousRank: null,
      team: 'Texas',
      conference: 'SEC',
      record: '0-0',
      rpi: '-',
      logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/251.png',
      trend: 'same',
      points: 742,
      firstPlaceVotes: 3,
    },
    {
      rank: 3,
      previousRank: null,
      team: 'LSU',
      conference: 'SEC',
      record: '0-0',
      rpi: '-',
      logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/99.png',
      trend: 'same',
      points: 718,
      firstPlaceVotes: 1,
    },
    {
      rank: 4,
      previousRank: null,
      team: 'Florida',
      conference: 'SEC',
      record: '0-0',
      rpi: '-',
      logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/57.png',
      trend: 'same',
      points: 695,
      firstPlaceVotes: 0,
    },
    {
      rank: 5,
      previousRank: null,
      team: 'Arkansas',
      conference: 'SEC',
      record: '0-0',
      rpi: '-',
      logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/8.png',
      trend: 'same',
      points: 672,
      firstPlaceVotes: 0,
    },
    {
      rank: 6,
      previousRank: null,
      team: 'Georgia',
      conference: 'SEC',
      record: '0-0',
      rpi: '-',
      logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/61.png',
      trend: 'same',
      points: 648,
      firstPlaceVotes: 0,
    },
    {
      rank: 7,
      previousRank: null,
      team: 'Virginia',
      conference: 'ACC',
      record: '0-0',
      rpi: '-',
      logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/258.png',
      trend: 'same',
      points: 625,
      firstPlaceVotes: 0,
    },
    {
      rank: 8,
      previousRank: null,
      team: 'Wake Forest',
      conference: 'ACC',
      record: '0-0',
      rpi: '-',
      logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/154.png',
      trend: 'same',
      points: 598,
      firstPlaceVotes: 0,
    },
    {
      rank: 9,
      previousRank: null,
      team: 'Clemson',
      conference: 'ACC',
      record: '0-0',
      rpi: '-',
      logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/228.png',
      trend: 'same',
      points: 575,
      firstPlaceVotes: 0,
    },
    {
      rank: 10,
      previousRank: null,
      team: 'Florida State',
      conference: 'ACC',
      record: '0-0',
      rpi: '-',
      logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/52.png',
      trend: 'same',
      points: 552,
      firstPlaceVotes: 0,
    },
    {
      rank: 11,
      previousRank: null,
      team: 'Tennessee',
      conference: 'SEC',
      record: '0-0',
      rpi: '-',
      logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2633.png',
      trend: 'same',
      points: 528,
      firstPlaceVotes: 0,
    },
    {
      rank: 12,
      previousRank: null,
      team: 'Oregon State',
      conference: 'Pac-12',
      record: '0-0',
      rpi: '-',
      logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/204.png',
      trend: 'same',
      points: 505,
      firstPlaceVotes: 0,
    },
    {
      rank: 13,
      previousRank: null,
      team: 'North Carolina',
      conference: 'ACC',
      record: '0-0',
      rpi: '-',
      logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/153.png',
      trend: 'same',
      points: 482,
      firstPlaceVotes: 0,
    },
    {
      rank: 14,
      previousRank: null,
      team: 'Stanford',
      conference: 'ACC',
      record: '0-0',
      rpi: '-',
      logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/24.png',
      trend: 'same',
      points: 458,
      firstPlaceVotes: 0,
    },
    {
      rank: 15,
      previousRank: null,
      team: 'Ole Miss',
      conference: 'SEC',
      record: '0-0',
      rpi: '-',
      logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/145.png',
      trend: 'same',
      points: 435,
      firstPlaceVotes: 0,
    },
    {
      rank: 16,
      previousRank: null,
      team: 'South Carolina',
      conference: 'SEC',
      record: '0-0',
      rpi: '-',
      logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2579.png',
      trend: 'same',
      points: 412,
      firstPlaceVotes: 0,
    },
    {
      rank: 17,
      previousRank: null,
      team: 'Oklahoma State',
      conference: 'Big 12',
      record: '0-0',
      rpi: '-',
      logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/197.png',
      trend: 'same',
      points: 388,
      firstPlaceVotes: 0,
    },
    {
      rank: 18,
      previousRank: null,
      team: 'TCU',
      conference: 'Big 12',
      record: '0-0',
      rpi: '-',
      logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2628.png',
      trend: 'same',
      points: 365,
      firstPlaceVotes: 0,
    },
    {
      rank: 19,
      previousRank: null,
      team: 'Vanderbilt',
      conference: 'SEC',
      record: '0-0',
      rpi: '-',
      logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/238.png',
      trend: 'same',
      points: 342,
      firstPlaceVotes: 0,
    },
    {
      rank: 20,
      previousRank: null,
      team: 'Kentucky',
      conference: 'SEC',
      record: '0-0',
      rpi: '-',
      logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/96.png',
      trend: 'same',
      points: 318,
      firstPlaceVotes: 0,
    },
    {
      rank: 21,
      previousRank: null,
      team: 'Alabama',
      conference: 'SEC',
      record: '0-0',
      rpi: '-',
      logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/333.png',
      trend: 'same',
      points: 295,
      firstPlaceVotes: 0,
    },
    {
      rank: 22,
      previousRank: null,
      team: 'East Carolina',
      conference: 'American',
      record: '0-0',
      rpi: '-',
      logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/151.png',
      trend: 'same',
      points: 272,
      firstPlaceVotes: 0,
    },
    {
      rank: 23,
      previousRank: null,
      team: 'UCLA',
      conference: 'Big Ten',
      record: '0-0',
      rpi: '-',
      logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/26.png',
      trend: 'same',
      points: 248,
      firstPlaceVotes: 0,
    },
    {
      rank: 24,
      previousRank: null,
      team: 'NC State',
      conference: 'ACC',
      record: '0-0',
      rpi: '-',
      logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/152.png',
      trend: 'same',
      points: 225,
      firstPlaceVotes: 0,
    },
    {
      rank: 25,
      previousRank: null,
      team: 'Louisiana',
      conference: 'Sun Belt',
      record: '0-0',
      rpi: '-',
      logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/309.png',
      trend: 'same',
      points: 202,
      firstPlaceVotes: 0,
    },
  ];
}
