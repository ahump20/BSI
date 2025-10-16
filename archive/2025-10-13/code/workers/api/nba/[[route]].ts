/**
 * Blaze Sports Intel - NBA Analytics API
 * ESPN NBA API Integration for Real-time Basketball Data
 */

export interface Env {
  SPORTS_CACHE?: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  const url = new URL(request.url);
  const route = (params.route as string[]) || [];

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=300, s-maxage=600'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    // Teams endpoint
    if (route[0] === 'teams') {
      const teamId = route[1] || url.searchParams.get('teamId');

      if (!teamId) {
        const cacheKey = 'nba:teams:all';
        let teams = null;

        if (env.SPORTS_CACHE) {
          const cached = await env.SPORTS_CACHE.get(cacheKey, 'json');
          if (cached) teams = cached;
        }

        if (!teams) {
          const espnResponse = await fetch(
            'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams',
            {
              headers: {
                'User-Agent': 'BlazeSportsIntel/1.0',
                'Accept': 'application/json'
              }
            }
          );

          if (!espnResponse.ok) {
            throw new Error('ESPN API returned non-OK status');
          }

          const espnData = await espnResponse.json();

          teams = {
            timestamp: new Date().toISOString(),
            teams: espnData.sports[0].leagues[0].teams.map((t: any) => ({
              id: t.team.id,
              name: t.team.displayName,
              abbreviation: t.team.abbreviation,
              location: t.team.location,
              color: t.team.color,
              logos: t.team.logos
            })),
            meta: {
              dataSource: 'ESPN NBA API',
              lastUpdated: new Date().toISOString()
            }
          };

          if (env.SPORTS_CACHE) {
            await env.SPORTS_CACHE.put(cacheKey, JSON.stringify(teams), {
              expirationTtl: 3600
            });
          }
        }

        return new Response(JSON.stringify(teams, null, 2), {
          status: 200,
          headers
        });
      } else {
        const cacheKey = `nba:team:${teamId}:full`;
        let teamData = null;

        if (env.SPORTS_CACHE) {
          const cached = await env.SPORTS_CACHE.get(cacheKey, 'json');
          if (cached) teamData = cached;
        }

        if (!teamData) {
          const [teamInfo, roster, schedule] = await Promise.all([
            fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${teamId}`, {
              headers: { 'User-Agent': 'BlazeSportsIntel/1.0', 'Accept': 'application/json' }
            }).then(r => r.json()),
            fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${teamId}/roster`, {
              headers: { 'User-Agent': 'BlazeSportsIntel/1.0', 'Accept': 'application/json' }
            }).then(r => r.json()).catch(() => null),
            fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${teamId}/schedule`, {
              headers: { 'User-Agent': 'BlazeSportsIntel/1.0', 'Accept': 'application/json' }
            }).then(r => r.json()).catch(() => null)
          ]);

          const record = teamInfo.team?.record?.items?.[0] || {};

          teamData = {
            timestamp: new Date().toISOString(),
            team: {
              id: teamInfo.team?.id,
              name: teamInfo.team?.displayName,
              abbreviation: teamInfo.team?.abbreviation,
              color: teamInfo.team?.color,
              logos: teamInfo.team?.logos,
              record: {
                overall: record.summary || '0-0',
                wins: record.stats?.find((s: any) => s.name === 'wins')?.value || 0,
                losses: record.stats?.find((s: any) => s.name === 'losses')?.value || 0,
                winPercent: record.stats?.find((s: any) => s.name === 'winPercent')?.value || 0,
                home: record.stats?.find((s: any) => s.name === 'home')?.displayValue || '0-0',
                away: record.stats?.find((s: any) => s.name === 'road')?.displayValue || '0-0'
              }
            },
            roster: roster?.athletes?.map((a: any) => ({
              id: a.id,
              name: a.fullName,
              jersey: a.jersey,
              position: a.position?.abbreviation,
              height: a.displayHeight,
              weight: a.displayWeight
            })) || [],
            schedule: schedule?.events || [],
            meta: {
              dataSource: 'ESPN NBA API',
              lastUpdated: new Date().toISOString(),
              season: '2024-25'
            }
          };

          if (env.SPORTS_CACHE) {
            await env.SPORTS_CACHE.put(cacheKey, JSON.stringify(teamData), {
              expirationTtl: 300
            });
          }
        }

        return new Response(JSON.stringify(teamData, null, 2), {
          status: 200,
          headers
        });
      }
    }

    // Scoreboard endpoint
    if (route[0] === 'scoreboard') {
      const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
      const cacheKey = `nba:scoreboard:${date}`;
      let scoreboard = null;

      if (env.SPORTS_CACHE) {
        const cached = await env.SPORTS_CACHE.get(cacheKey, 'json');
        if (cached) scoreboard = cached;
      }

      if (!scoreboard) {
        const espnResponse = await fetch(
          `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${date.replace(/-/g, '')}`,
          {
            headers: {
              'User-Agent': 'BlazeSportsIntel/1.0',
              'Accept': 'application/json'
            }
          }
        );

        if (!espnResponse.ok) {
          throw new Error('ESPN API returned non-OK status');
        }

        const espnData = await espnResponse.json();

        scoreboard = {
          timestamp: new Date().toISOString(),
          date: date,
          games: espnData.events?.map((event: any) => ({
            id: event.id,
            name: event.name,
            date: event.date,
            status: event.status,
            teams: event.competitions?.[0]?.competitors,
            venue: event.competitions?.[0]?.venue
          })) || [],
          meta: {
            dataSource: 'ESPN NBA API',
            lastUpdated: new Date().toISOString()
          }
        };

        const allCompleted = scoreboard.games.every((g: any) => g.status.type.completed);
        const ttl = allCompleted ? 300 : 30;

        if (env.SPORTS_CACHE) {
          await env.SPORTS_CACHE.put(cacheKey, JSON.stringify(scoreboard), {
            expirationTtl: ttl
          });
        }
      }

      return new Response(JSON.stringify(scoreboard, null, 2), {
        status: 200,
        headers
      });
    }

    // Standings endpoint
    if (route[0] === 'standings') {
      const cacheKey = 'nba:standings';
      let standings = null;

      if (env.SPORTS_CACHE) {
        const cached = await env.SPORTS_CACHE.get(cacheKey, 'json');
        if (cached) standings = cached;
      }

      if (!standings) {
        const espnResponse = await fetch(
          'https://site.api.espn.com/apis/v2/sports/basketball/nba/standings',
          {
            headers: {
              'User-Agent': 'BlazeSportsIntel/1.0',
              'Accept': 'application/json'
            }
          }
        );

        if (!espnResponse.ok) {
          throw new Error('ESPN API returned non-OK status');
        }

        const espnData = await espnResponse.json();

        standings = {
          timestamp: new Date().toISOString(),
          conferences: espnData.children?.map((conf: any) => ({
            name: conf.name,
            teams: conf.standings?.entries?.map((entry: any) => ({
              team: entry.team,
              stats: entry.stats
            }))
          })),
          meta: {
            dataSource: 'ESPN NBA API',
            lastUpdated: new Date().toISOString()
          }
        };

        if (env.SPORTS_CACHE) {
          await env.SPORTS_CACHE.put(cacheKey, JSON.stringify(standings), {
            expirationTtl: 300
          });
        }
      }

      return new Response(JSON.stringify(standings, null, 2), {
        status: 200,
        headers
      });
    }

    return new Response(JSON.stringify({
      error: 'Not found',
      availableEndpoints: [
        '/api/nba/teams',
        '/api/nba/teams/{teamId}',
        '/api/nba/scoreboard?date=YYYY-MM-DD',
        '/api/nba/standings'
      ]
    }), {
      status: 404,
      headers
    });

  } catch (error: any) {
    console.error('NBA API error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers
    });
  }
};