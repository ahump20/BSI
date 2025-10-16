/**
 * College Baseball Teams API Endpoint
 * Returns team information for NCAA Division I baseball programs
 */

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const conference = url.searchParams.get('conference');
  const teamId = url.searchParams.get('teamId');

  try {
    // Featured SEC baseball programs
    const teams = [
      {
        team_id: 'lsu',
        school_name: 'LSU Tigers',
        conference: 'SEC',
        division: 'West',
        city: 'Baton Rouge',
        state: 'Louisiana',
        stadium_name: 'Alex Box Stadium',
        capacity: 10326,
        colors: ['purple', 'gold'],
        coach_name: 'Jay Johnson',
        conference_titles: 17,
        cws_appearances: 19,
        national_championships: 7
      },
      {
        team_id: 'tennessee',
        school_name: 'Tennessee Volunteers',
        conference: 'SEC',
        division: 'East',
        city: 'Knoxville',
        state: 'Tennessee',
        stadium_name: 'Lindsey Nelson Stadium',
        capacity: 4283,
        colors: ['orange', 'white'],
        coach_name: 'Tony Vitello',
        conference_titles: 4,
        cws_appearances: 10,
        national_championships: 0
      },
      {
        team_id: 'arkansas',
        school_name: 'Arkansas Razorbacks',
        conference: 'SEC',
        division: 'West',
        city: 'Fayetteville',
        state: 'Arkansas',
        stadium_name: 'Baum-Walker Stadium',
        capacity: 11084,
        colors: ['cardinal', 'white'],
        coach_name: 'Dave Van Horn',
        conference_titles: 2,
        cws_appearances: 11,
        national_championships: 0
      },
      {
        team_id: 'vanderbilt',
        school_name: 'Vanderbilt Commodores',
        conference: 'SEC',
        division: 'East',
        city: 'Nashville',
        state: 'Tennessee',
        stadium_name: 'Hawkins Field',
        capacity: 3700,
        colors: ['black', 'gold'],
        coach_name: 'Tim Corbin',
        conference_titles: 4,
        cws_appearances: 12,
        national_championships: 2
      },
      {
        team_id: 'florida',
        school_name: 'Florida Gators',
        conference: 'SEC',
        division: 'East',
        city: 'Gainesville',
        state: 'Florida',
        stadium_name: 'Florida Ballpark',
        capacity: 5500,
        colors: ['orange', 'blue'],
        coach_name: "Kevin O'Sullivan",
        conference_titles: 15,
        cws_appearances: 13,
        national_championships: 1
      },
      {
        team_id: 'texas',
        school_name: 'Texas Longhorns',
        conference: 'SEC',
        division: 'West',
        city: 'Austin',
        state: 'Texas',
        stadium_name: 'UFCU Disch-Falk Field',
        capacity: 7373,
        colors: ['burnt orange', 'white'],
        coach_name: 'Jim Schlossnagle',
        conference_titles: 21,
        cws_appearances: 38,
        national_championships: 6
      }
    ];

    // Filter by specific team ID if provided
    if (teamId) {
      const team = teams.find(t => t.team_id === teamId);
      if (!team) {
        return new Response(JSON.stringify({ error: 'Team not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify(team), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600', // 1 hour
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Filter by conference if provided
    let filteredTeams = teams;
    if (conference) {
      filteredTeams = teams.filter(t => t.conference === conference);
    }

    return new Response(JSON.stringify({
      count: filteredTeams.length,
      teams: filteredTeams
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // 1 hour
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
