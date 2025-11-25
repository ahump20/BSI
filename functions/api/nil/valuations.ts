/**
 * NIL Valuations API - Legacy Endpoint
 * GET /api/nil/valuations
 *
 * This endpoint provides backward compatibility for the original valuations API.
 * For full FMNV calculations, use the new endpoints:
 * - GET /api/nil/players
 * - GET /api/nil/valuation/:playerId
 * - POST /api/nil/optimize
 * - GET /api/nil/opportunity-cost/:playerId/:teamId
 *
 * Query Parameters:
 * - conference: Filter by conference (SEC, Big Ten, etc.)
 * - sport: Filter by sport (football, basketball, baseball)
 * - school: Get specific school data
 */

interface Env {
  KV: KVNamespace;
  NIL_CACHE: KVNamespace;
}

const NIL_DATA = {
  metadata: {
    season: '2025-26',
    lastUpdated: '2025-11-25',
    source: 'On3 NIL Valuations',
    disclaimer: 'Valuations reflect athletic brand value, not guaranteed earnings',
    apiVersion: '2.0',
    newEndpoints: {
      players: '/api/nil/players',
      valuation: '/api/nil/valuation/:playerId',
      optimize: '/api/nil/optimize',
      opportunityCost: '/api/nil/opportunity-cost/:playerId/:teamId',
    },
  },
  top50Programs: [
    {
      rank: 1,
      school: 'Texas',
      conference: 'SEC',
      totalRosterValue: 22000000,
      avgPlayerValue: 253000,
      topAthletes: [{ name: 'Arch Manning', position: 'QB', nilValue: 6800000 }],
      collective: 'Texas One Fund',
      trend: 'rising',
      yearOverYearChange: 2100000,
    },
    {
      rank: 2,
      school: 'Alabama',
      conference: 'SEC',
      totalRosterValue: 18400000,
      avgPlayerValue: 206000,
      topAthletes: [{ name: 'Ryan Williams', position: 'WR', nilValue: 2600000 }],
      collective: 'Yellowhammer Fund',
      trend: 'rising',
      yearOverYearChange: 2400000,
    },
    {
      rank: 3,
      school: 'Ohio State',
      conference: 'Big Ten',
      totalRosterValue: 18300000,
      avgPlayerValue: 208000,
      topAthletes: [
        { name: 'Jeremiah Smith', position: 'WR', nilValue: 4200000 },
        { name: 'Caleb Downs', position: 'S', nilValue: 2400000 },
      ],
      collective: 'THE Foundation',
      trend: 'rising',
      yearOverYearChange: 4700000,
    },
    {
      rank: 4,
      school: 'LSU',
      conference: 'SEC',
      totalRosterValue: 17900000,
      avgPlayerValue: 180000,
      topAthletes: [{ name: 'Garrett Nussmeier', position: 'QB', nilValue: 4000000 }],
      collective: 'Bayou Traditions',
      trend: 'surging',
      yearOverYearChange: 7800000,
    },
    {
      rank: 5,
      school: 'Georgia',
      conference: 'SEC',
      totalRosterValue: 15700000,
      avgPlayerValue: 159000,
      topAthletes: [],
      collective: 'Classic City Collective',
      trend: 'rising',
      yearOverYearChange: 2300000,
    },
    {
      rank: 6,
      school: 'Penn State',
      conference: 'Big Ten',
      totalRosterValue: 14600000,
      avgPlayerValue: 120000,
      topAthletes: [{ name: 'Drew Allar', position: 'QB', nilValue: 3300000 }],
      collective: 'Happy Valley United',
      trend: 'rising strongly',
      yearOverYearChange: 4700000,
    },
    {
      rank: 7,
      school: 'Texas A&M',
      conference: 'SEC',
      totalRosterValue: 14300000,
      avgPlayerValue: 159000,
      topAthletes: [],
      collective: 'Texas Aggies United',
      trend: 'rising',
      yearOverYearChange: 5000000,
    },
    {
      rank: 8,
      school: 'Oregon',
      conference: 'Big Ten',
      totalRosterValue: 13700000,
      avgPlayerValue: 149000,
      topAthletes: [{ name: 'Dakorien Moore', position: 'WR', nilValue: 2000000 }],
      collective: 'Division Street',
      trend: 'rising',
      yearOverYearChange: 2100000,
    },
    {
      rank: 9,
      school: 'Michigan',
      conference: 'Big Ten',
      totalRosterValue: 13000000,
      avgPlayerValue: 139000,
      topAthletes: [{ name: 'Bryce Underwood', position: 'QB', nilValue: 3000000 }],
      collective: 'Champions Circle',
      trend: 'rising',
      yearOverYearChange: 1400000,
    },
    {
      rank: 10,
      school: 'Oklahoma',
      conference: 'SEC',
      totalRosterValue: 12600000,
      avgPlayerValue: 146000,
      topAthletes: [{ name: 'David Stone', position: 'DL', nilValue: 1500000 }],
      collective: 'Crimson & Cream',
      trend: 'rising',
      yearOverYearChange: 2900000,
    },
    {
      rank: 11,
      school: 'Tennessee',
      conference: 'SEC',
      totalRosterValue: 11500000,
      avgPlayerValue: 135000,
      topAthletes: [{ name: 'Nico Iamaleava', position: 'QB', nilValue: 8000000 }],
      collective: 'Spyre Sports',
      trend: 'steady',
      yearOverYearChange: -100000,
    },
    {
      rank: 12,
      school: 'South Carolina',
      conference: 'SEC',
      totalRosterValue: 10600000,
      avgPlayerValue: 125000,
      topAthletes: [{ name: 'LaNorris Sellers', position: 'QB', nilValue: 3800000 }],
      collective: 'Garnet Trust',
      trend: 'rising',
      yearOverYearChange: 2600000,
    },
  ],
  trends: {
    biggestGainers: [
      { school: 'LSU', increase: 7800000, percentChange: 77.2 },
      { school: 'Texas A&M', increase: 5000000, percentChange: 53.8 },
      { school: 'Penn State', increase: 4700000, percentChange: 47.5 },
      { school: 'Ohio State', increase: 4700000, percentChange: 34.6 },
    ],
    insights: {
      top50Threshold: 4000000,
      averageTop10Value: 16570000,
      secDominance: 'Half of top 10 programs from SEC',
    },
  },
  topAthletes: {
    football: [
      { name: 'Nico Iamaleava', school: 'Tennessee', position: 'QB', valuation: 8000000 },
      { name: 'Arch Manning', school: 'Texas', position: 'QB', valuation: 6800000 },
      { name: 'Jeremiah Smith', school: 'Ohio State', position: 'WR', valuation: 4200000 },
    ],
    basketball: [{ name: 'Cooper Flagg', school: 'Duke', position: 'F', valuation: 1400000 }],
    baseball: [{ name: 'Travis Sykora', school: 'Texas', position: 'RHP', valuation: 280000 }],
  },
};

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://blazesportsintel.com',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

function getCurrentTimestamp(): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
    .format(new Date())
    .replace(/(\d+)\/(\d+)\/(\d+),?\s*/, '$3-$1-$2T')
    .replace(/\s/g, '');
}

export const onRequest: PagesFunction<Env> = async ({ request }) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  const url = new URL(request.url);
  const conference = url.searchParams.get('conference');
  const sport = url.searchParams.get('sport');
  const school = url.searchParams.get('school');

  try {
    const responseData: Record<string, unknown> = {
      success: true,
      ...NIL_DATA.metadata,
      timezone: 'America/Chicago',
      timestamp: getCurrentTimestamp(),
    };

    if (school) {
      const program = NIL_DATA.top50Programs.find(
        (p) => p.school.toLowerCase() === school.toLowerCase()
      );
      if (program) {
        responseData.program = program;
        // Include link to detailed valuation endpoint
        responseData.detailedValuationUrl = `/api/nil/valuation/${program.school.toLowerCase().replace(/\s+/g, '-')}`;
      } else {
        return new Response(
          JSON.stringify({ success: false, error: 'School not found in top 50' }),
          { status: 404, headers: corsHeaders }
        );
      }
    } else if (conference) {
      const programs = NIL_DATA.top50Programs.filter(
        (p) => p.conference.toLowerCase() === conference.toLowerCase()
      );
      responseData.programs = programs;
      responseData.conference = conference.toUpperCase();
    } else if (sport) {
      const athletes = NIL_DATA.topAthletes[sport as keyof typeof NIL_DATA.topAthletes];
      if (athletes) {
        responseData.athletes = athletes;
        responseData.sport = sport;
      } else {
        return new Response(JSON.stringify({ success: false, error: 'Sport not found' }), {
          status: 404,
          headers: corsHeaders,
        });
      }
    } else {
      responseData.programs = NIL_DATA.top50Programs;
      responseData.trends = NIL_DATA.trends;
      responseData.topAthletes = NIL_DATA.topAthletes;
    }

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { ...corsHeaders, 'Cache-Control': 'public, max-age=86400' },
    });
  } catch (error) {
    console.error('NIL Valuations error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to fetch NIL data' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
};
