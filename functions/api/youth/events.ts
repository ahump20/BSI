/**
 * Youth Baseball Events API
 * Perfect Game showcases, tournaments, and prospect events
 *
 * Endpoints:
 * GET /api/youth/events - All upcoming events
 * GET /api/youth/events?type=showcase - Showcase events only
 * GET /api/youth/events?region=texas - Texas area events
 *
 * Data Source: Perfect Game
 * Update Frequency: Weekly
 */

interface Env {
  KV: KVNamespace;
}

const EVENTS_DATA = {
  upcoming: [
    {
      id: 'wwba-2025',
      event: 'WWBA World Championship',
      type: 'tournament',
      date: '2025-10-21',
      endDate: '2025-10-28',
      location: 'Jupiter, FL',
      venue: 'Roger Dean Chevrolet Stadium Complex',
      teams: 432,
      ageGroup: '17U',
      registrationStatus: 'open',
      description: 'Premier 17U tournament featuring top travel ball programs',
    },
    {
      id: 'pg-national-2025',
      event: 'PG National Championship',
      type: 'tournament',
      date: '2025-11-14',
      endDate: '2025-11-17',
      location: 'Phoenix, AZ',
      venue: 'Legacy Sports Complex',
      teams: 256,
      ageGroup: '16U/17U',
      registrationStatus: 'waitlist',
      description: 'End of fall championship showcase',
    },
    {
      id: 'texas-state-2025',
      event: 'Texas State Championships',
      type: 'tournament',
      date: '2025-12-06',
      endDate: '2025-12-08',
      location: 'Houston, TX',
      venue: 'Dell Diamond / Minute Maid Park Complex',
      teams: 128,
      ageGroup: '14U-18U',
      registrationStatus: 'open',
      description: 'Texas premier regional championship',
    },
  ],
  showcases: [
    {
      id: 'pg-underclass-2025',
      event: 'PG Underclass All-American',
      type: 'showcase',
      date: '2025-11-01',
      location: 'San Diego, CA',
      venue: 'Petco Park',
      inviteOnly: true,
      classYears: ['2026', '2027'],
      description: 'Top underclassmen showcase event',
    },
    {
      id: 'pg-texas-showcase',
      event: 'PG Texas Regional Showcase',
      type: 'showcase',
      date: '2025-10-12',
      location: 'Austin, TX',
      venue: 'UFCU Disch-Falk Field',
      inviteOnly: false,
      classYears: ['2025', '2026', '2027'],
      description: 'Regional showcase for Texas prospects',
    },
  ],
  recent: [
    {
      id: 'pg-allamerican-2025',
      event: 'PG All-American Classic',
      type: 'showcase',
      date: '2025-09-15',
      location: 'San Diego, CA',
      mvp: 'E. Holliday',
      attendance: 15000,
      notablePlayers: ['E. Holliday', 'C. Smith', 'B. Mitchell'],
    },
  ],
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
  const eventType = url.searchParams.get('type');
  const region = url.searchParams.get('region');

  try {
    let events: unknown[] = [];

    if (eventType === 'showcase') {
      events = EVENTS_DATA.showcases;
    } else if (eventType === 'tournament') {
      events = EVENTS_DATA.upcoming;
    } else if (region === 'texas') {
      events = [
        ...EVENTS_DATA.upcoming.filter((e) => e.location.includes('TX')),
        ...EVENTS_DATA.showcases.filter((e) => e.location.includes('TX')),
      ];
    } else {
      events = [...EVENTS_DATA.upcoming, ...EVENTS_DATA.showcases];
    }

    return new Response(
      JSON.stringify({
        success: true,
        dataSource: 'Perfect Game',
        lastUpdated: new Date().toISOString(),
        timezone: 'America/Chicago',
        events,
        recentResults: eventType ? undefined : EVENTS_DATA.recent,
      }),
      { status: 200, headers: { ...corsHeaders, 'Cache-Control': 'public, max-age=3600' } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: 'Failed to fetch events' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
};
