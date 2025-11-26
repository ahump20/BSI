/**
 * Youth Baseball Rankings API
 * Perfect Game and Texas HS baseball prospect rankings
 *
 * Endpoints:
 * GET /api/youth/rankings - All rankings
 * GET /api/youth/rankings?class=2025 - Specific class year
 * GET /api/youth/rankings?region=texas - Regional rankings
 *
 * Data Source: Perfect Game, MaxPreps
 * Update Frequency: Weekly during season
 */

interface Env {
  KV: KVNamespace;
}

// Static data - in production this would come from D1/R2
const BASEBALL_DATA = {
  timestamp: '2025-09-24T00:00:00.000Z',
  draftClass: { current: 2025, upcoming: 2026 },
  rankings: {
    class2025: {
      national: [
        {
          rank: 1,
          name: 'E. Holliday',
          position: 'SS/3B',
          school: 'Stillwater HS (OK)',
          commitment: 'Oklahoma State',
        },
        {
          rank: 2,
          name: 'C. Smith',
          position: 'OF',
          school: 'Orange Lutheran (CA)',
          commitment: 'UCLA',
        },
        {
          rank: 3,
          name: 'B. Mitchell',
          position: 'C',
          school: 'Sinton HS (TX)',
          commitment: 'LSU',
        },
      ],
      texas: [
        { rank: 1, stateRank: 3, name: 'B. Mitchell', position: 'C', school: 'Sinton' },
        { rank: 2, stateRank: 18, name: 'K. Mayfield', position: 'LHP', school: 'Forney' },
        { rank: 3, stateRank: 24, name: 'D. Ware', position: 'SS', school: 'Arlington Martin' },
      ],
    },
    class2026: {
      earlyRankings: [
        { rank: 1, name: 'J. Arnold', position: 'RHP', school: 'Cypress Ranch (TX)' },
        { rank: 2, name: 'M. Guerra', position: 'SS', school: 'San Antonio Reagan (TX)' },
      ],
    },
  },
  showcases: {
    upcoming: [
      {
        event: 'WWBA World Championship',
        date: '2025-10-21 to 2025-10-28',
        location: 'Jupiter, FL',
        teams: 432,
        ageGroup: '17U',
      },
      {
        event: 'PG National Championship',
        date: '2025-11-14 to 2025-11-17',
        location: 'Phoenix, AZ',
        teams: 256,
        ageGroup: '16U/17U',
      },
    ],
  },
  pipeline: {
    mlbDraft2025: {
      projectedFirstRound: 18,
      texasProspects: 42,
      topTexasProspect: 'B. Mitchell',
      draftDate: '2025-07-13',
    },
    collegeCommitments: {
      sec: 147,
      big12: 98,
      acc: 112,
      texasSchools: { texas: 24, texasAM: 22, rice: 18, houston: 16, tcu: 14 },
    },
  },
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export const onRequest: PagesFunction<Env> = async ({ request }) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(request.url);
  const classYear = url.searchParams.get('class');
  const region = url.searchParams.get('region');

  try {
    let responseData: Record<string, unknown> = {
      success: true,
      dataSource: 'Perfect Game',
      lastUpdated: BASEBALL_DATA.timestamp,
      timezone: 'America/Chicago',
    };

    if (classYear === '2025') {
      responseData.rankings = BASEBALL_DATA.rankings.class2025;
      responseData.classYear = 2025;
    } else if (classYear === '2026') {
      responseData.rankings = BASEBALL_DATA.rankings.class2026;
      responseData.classYear = 2026;
    } else if (region === 'texas') {
      responseData.rankings = BASEBALL_DATA.rankings.class2025.texas;
      responseData.region = 'Texas';
      responseData.pipeline = BASEBALL_DATA.pipeline;
    } else {
      responseData = {
        ...responseData,
        rankings: BASEBALL_DATA.rankings,
        showcases: BASEBALL_DATA.showcases,
        pipeline: BASEBALL_DATA.pipeline,
      };
    }

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { ...corsHeaders, 'Cache-Control': 'public, max-age=3600' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: 'Failed to fetch rankings' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
};
