/**
 * BSI College Baseball Draft Prospects API
 * Endpoint: /api/college-baseball/draft-prospects
 *
 * Query Parameters:
 * - draftClass: Filter by draft year (default: 2026)
 * - position: Filter by position (SS, RHP, LHP, C, OF, 1B, 2B, 3B)
 * - limit: Max results (default: 50, max: 100)
 *
 * Response: Standard BSI APIResponse format
 */

import { rateLimit, rateLimitError, corsHeaders } from '../_utils.js';

const CACHE_KEY_PREFIX = 'college-baseball:draft-prospects';
const CACHE_TTL = 900; // 15 minutes

// 2026 MLB Draft Prospects - Top 10 College Players
const PROSPECTS_2026 = [
  {
    id: 'cholowsky-roch-2026',
    name: 'Roch Cholowsky',
    school: 'UCLA',
    conference: 'Big Ten',
    position: 'SS',
    bats: 'R',
    throws: 'R',
    year: 'JR',
    draftClass: 2026,
    ranking: {
      overall: 1,
      position: 1,
      conference: 1,
      source: 'd1baseball',
    },
    scouting: {
      hit: 70,
      power: 60,
      run: 65,
      arm: 60,
      field: 70,
      overallGrade: 70,
      ceiling: 'All-Star',
      eta: 2028,
    },
    projection: {
      draftRound: 1,
      draftPick: 1,
      slotValue: 10500000,
      comparables: ['Corey Seager', 'Carlos Correa'],
      risk: 'Low',
      upside: 'Elite',
    },
    notes:
      '2025 D1Baseball Player of the Year. Led UCLA from 19-33 to 48-18 turnaround. Elite bat-to-ball skills with plus power potential.',
    lastUpdated: '2026-01-24T00:00:00Z',
  },
  {
    id: 'peterson-nick-2026',
    name: 'Nick Peterson',
    school: 'Texas A&M',
    conference: 'SEC',
    position: 'RHP',
    bats: 'R',
    throws: 'R',
    year: 'JR',
    draftClass: 2026,
    ranking: {
      overall: 2,
      position: 1,
      conference: 1,
      source: 'd1baseball',
    },
    scouting: {
      fastball: 75,
      slider: 65,
      curveball: 55,
      changeup: 50,
      command: 60,
      overallGrade: 70,
      ceiling: 'All-Star',
      eta: 2028,
    },
    projection: {
      draftRound: 1,
      draftPick: 3,
      slotValue: 8200000,
      comparables: ['Spencer Strider', 'Zack Wheeler'],
      risk: 'Medium',
      upside: 'Elite',
    },
    notes:
      'Electric arm with 97-100 mph heat. Plus slider devastates hitters. Slight command concerns but ace upside.',
    lastUpdated: '2026-01-24T00:00:00Z',
  },
  {
    id: 'burress-jac-2026',
    name: 'Jac Burress',
    school: 'Mississippi State',
    conference: 'SEC',
    position: 'RHP',
    bats: 'R',
    throws: 'R',
    year: 'JR',
    draftClass: 2026,
    ranking: {
      overall: 3,
      position: 2,
      conference: 2,
      source: 'd1baseball',
    },
    scouting: {
      fastball: 70,
      slider: 70,
      curveball: 55,
      changeup: 55,
      command: 65,
      overallGrade: 65,
      ceiling: 'All-Star',
      eta: 2028,
    },
    projection: {
      draftRound: 1,
      draftPick: 5,
      slotValue: 6700000,
      comparables: ['Corbin Burnes', 'Brandon Woodruff'],
      risk: 'Low',
      upside: 'Elite',
    },
    notes:
      '2025 SEC Pitcher of the Year. Elite command with devastating slider. Projects as front-line starter.',
    lastUpdated: '2026-01-24T00:00:00Z',
  },
  {
    id: 'flora-carson-2026',
    name: 'Carson Flora',
    school: 'Florida',
    conference: 'SEC',
    position: 'C',
    bats: 'R',
    throws: 'R',
    year: 'JR',
    draftClass: 2026,
    ranking: {
      overall: 4,
      position: 1,
      conference: 3,
      source: 'd1baseball',
    },
    scouting: {
      hit: 60,
      power: 65,
      run: 40,
      arm: 70,
      field: 65,
      overallGrade: 65,
      ceiling: 'All-Star',
      eta: 2028,
    },
    projection: {
      draftRound: 1,
      draftPick: 8,
      slotValue: 5800000,
      comparables: ['Adley Rutschman', 'Will Smith'],
      risk: 'Low',
      upside: 'Elite',
    },
    notes:
      'Elite defensive catcher with plus arm. Improving bat makes him the best college backstop in years.',
    lastUpdated: '2026-01-24T00:00:00Z',
  },
  {
    id: 'sorrell-luke-2026',
    name: 'Luke Sorrell',
    school: 'Kentucky',
    conference: 'SEC',
    position: 'RHP',
    bats: 'R',
    throws: 'R',
    year: 'JR',
    draftClass: 2026,
    ranking: {
      overall: 5,
      position: 3,
      conference: 4,
      source: 'd1baseball',
    },
    scouting: {
      fastball: 70,
      slider: 60,
      curveball: 60,
      changeup: 55,
      command: 60,
      overallGrade: 60,
      ceiling: 'Above-Average Regular',
      eta: 2028,
    },
    projection: {
      draftRound: 1,
      draftPick: 12,
      slotValue: 4900000,
      comparables: ['Logan Gilbert', 'Shane Bieber'],
      risk: 'Low',
      upside: 'High',
    },
    notes: 'Four-pitch mix with excellent command. Workhorse profile with 200+ inning potential.',
    lastUpdated: '2026-01-24T00:00:00Z',
  },
  {
    id: 'lebron-charles-2026',
    name: 'Charles Lebron',
    school: 'Miami',
    conference: 'ACC',
    position: 'SS',
    bats: 'R',
    throws: 'R',
    year: 'JR',
    draftClass: 2026,
    ranking: {
      overall: 6,
      position: 2,
      conference: 1,
      source: 'd1baseball',
    },
    scouting: {
      hit: 65,
      power: 55,
      run: 70,
      arm: 60,
      field: 65,
      overallGrade: 60,
      ceiling: 'Above-Average Regular',
      eta: 2028,
    },
    projection: {
      draftRound: 1,
      draftPick: 15,
      slotValue: 4400000,
      comparables: ['Francisco Lindor', 'Xander Bogaerts'],
      risk: 'Low',
      upside: 'High',
    },
    notes: 'Dynamic athlete with plus speed and defensive versatility. Bat continues to develop.',
    lastUpdated: '2026-01-24T00:00:00Z',
  },
  {
    id: 'doyle-tommy-2026',
    name: 'Tommy Doyle',
    school: 'Virginia',
    conference: 'ACC',
    position: 'LHP',
    bats: 'L',
    throws: 'L',
    year: 'JR',
    draftClass: 2026,
    ranking: {
      overall: 7,
      position: 1,
      conference: 2,
      source: 'd1baseball',
    },
    scouting: {
      fastball: 65,
      slider: 65,
      curveball: 50,
      changeup: 60,
      command: 65,
      overallGrade: 60,
      ceiling: 'Above-Average Regular',
      eta: 2028,
    },
    projection: {
      draftRound: 1,
      draftPick: 20,
      slotValue: 3900000,
      comparables: ['Carlos Rodon', 'Patrick Corbin'],
      risk: 'Low',
      upside: 'High',
    },
    notes:
      'Crafty lefty with plus command and deceptive delivery. High floor mid-rotation starter.',
    lastUpdated: '2026-01-24T00:00:00Z',
  },
  {
    id: 'caraway-jaden-2026',
    name: 'Jaden Caraway',
    school: 'Vanderbilt',
    conference: 'SEC',
    position: 'RHP',
    bats: 'R',
    throws: 'R',
    year: 'SO',
    draftClass: 2026,
    ranking: {
      overall: 8,
      position: 4,
      conference: 5,
      source: 'd1baseball',
    },
    scouting: {
      fastball: 70,
      slider: 55,
      curveball: 55,
      changeup: 50,
      command: 55,
      overallGrade: 60,
      ceiling: 'Above-Average Regular',
      eta: 2029,
    },
    projection: {
      draftRound: 1,
      draftPick: 25,
      slotValue: 3200000,
      comparables: ['Hunter Greene', 'Sixto Sanchez'],
      risk: 'Medium',
      upside: 'Elite',
    },
    notes: 'Elite velocity but still developing secondary stuff. Huge upside if command clicks.',
    lastUpdated: '2026-01-24T00:00:00Z',
  },
  {
    id: 'frederick-ryan-2026',
    name: 'Ryan Frederick',
    school: 'LSU',
    conference: 'SEC',
    position: 'OF',
    bats: 'L',
    throws: 'L',
    year: 'JR',
    draftClass: 2026,
    ranking: {
      overall: 9,
      position: 1,
      conference: 6,
      source: 'd1baseball',
    },
    scouting: {
      hit: 65,
      power: 70,
      run: 55,
      arm: 55,
      field: 55,
      overallGrade: 60,
      ceiling: 'Above-Average Regular',
      eta: 2028,
    },
    projection: {
      draftRound: 1,
      draftPick: 28,
      slotValue: 2900000,
      comparables: ['Kyle Schwarber', 'Yordan Alvarez'],
      risk: 'Low',
      upside: 'High',
    },
    notes:
      'Plus power from left side with improved contact skills. Corner outfield profile with bat carrying the profile.',
    lastUpdated: '2026-01-24T00:00:00Z',
  },
  {
    id: 'arcamone-michael-2026',
    name: 'Michael Arcamone',
    school: 'Duke',
    conference: 'ACC',
    position: '1B',
    bats: 'L',
    throws: 'R',
    year: 'JR',
    draftClass: 2026,
    ranking: {
      overall: 10,
      position: 1,
      conference: 3,
      source: 'd1baseball',
    },
    scouting: {
      hit: 70,
      power: 65,
      run: 40,
      arm: 50,
      field: 55,
      overallGrade: 60,
      ceiling: 'Above-Average Regular',
      eta: 2028,
    },
    projection: {
      draftRound: 2,
      draftPick: 35,
      slotValue: 2400000,
      comparables: ['Freddie Freeman', 'Paul Goldschmidt'],
      risk: 'Low',
      upside: 'High',
    },
    notes:
      'Best pure hitter in college baseball. Elite bat-to-ball skills with plus power. Limited to first base.',
    lastUpdated: '2026-01-24T00:00:00Z',
  },
];

/**
 * Helper: Get cache key
 */
function getCacheKey(draftClass, position) {
  const parts = [CACHE_KEY_PREFIX, `class:${draftClass}`];
  if (position) parts.push(`pos:${position}`);
  return parts.join(':');
}

/**
 * Helper: Filter prospects
 */
function filterProspects(prospects, { draftClass, position, limit }) {
  let filtered = prospects;

  if (draftClass) {
    filtered = filtered.filter((p) => p.draftClass === parseInt(draftClass));
  }

  if (position) {
    const pos = position.toUpperCase();
    filtered = filtered.filter((p) => p.position === pos);
  }

  const maxLimit = Math.min(parseInt(limit) || 50, 100);
  return filtered.slice(0, maxLimit);
}

/**
 * Main request handler
 */
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Rate limiting: 100 requests per minute per IP
  const limit = await rateLimit(env, request, 100, 60000);
  if (!limit.allowed) {
    return rateLimitError(limit.resetAt, limit.retryAfter);
  }

  try {
    // Parse query parameters
    const draftClass = url.searchParams.get('draftClass') || '2026';
    const position = url.searchParams.get('position');
    const limit = url.searchParams.get('limit') || '50';

    // Check KV cache first
    const cacheKey = getCacheKey(draftClass, position);
    let cached = null;

    if (env.BSI_CACHE) {
      cached = await env.BSI_CACHE.get(cacheKey, { type: 'json' });
    }

    if (cached) {
      return new Response(JSON.stringify(cached), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Cache': 'HIT',
        },
      });
    }

    // Filter prospects
    const prospects = filterProspects(PROSPECTS_2026, {
      draftClass,
      position,
      limit,
    });

    // Build response
    const response = {
      data: prospects,
      status: 'ok',
      source: 'bsi-curated',
      lastUpdated: new Date().toISOString(),
      meta: {
        total: prospects.length,
        draftClass: parseInt(draftClass),
        position: position || 'all',
        cached: false,
      },
    };

    // Cache response
    if (env.BSI_CACHE) {
      await env.BSI_CACHE.put(cacheKey, JSON.stringify(response), {
        expirationTtl: CACHE_TTL,
      });
    }

    return new Response(JSON.stringify(response), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.error('Draft prospects error:', error);

    return new Response(
      JSON.stringify({
        data: null,
        status: 'unavailable',
        source: 'bsi-curated',
        lastUpdated: new Date().toISOString(),
        reason: 'Internal server error',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
