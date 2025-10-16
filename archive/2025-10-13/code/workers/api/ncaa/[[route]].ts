/**
 * Blaze Sports Intel - NCAA Football Analytics API
 * ESPN NCAA API Integration for Real-time College Football Data
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
        const cacheKey = 'ncaa:teams:all';
        let teams = null;

        if (env.SPORTS_CACHE) {
          const cached = await env.SPORTS_CACHE.get(cacheKey, 'json');
          if (cached) teams = cached;
        }

        if (!teams) {
          const espnResponse = await fetch(
            'https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams?limit=200',
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
              logos: t.team.logos,
              conference: t.team.groups?.[0]?.name
            })),
            meta: {
              dataSource: 'ESPN NCAA API',
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
        const cacheKey = `ncaa:team:${teamId}:full`;
        let teamData = null;

        if (env.SPORTS_CACHE) {
          const cached = await env.SPORTS_CACHE.get(cacheKey, 'json');
          if (cached) teamData = cached;
        }

        if (!teamData) {
          const [teamInfo, roster, schedule] = await Promise.all([
            fetch(`https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/${teamId}`, {
              headers: { 'User-Agent': 'BlazeSportsIntel/1.0', 'Accept': 'application/json' }
            }).then(r => r.json()),
            fetch(`https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/${teamId}/roster`, {
              headers: { 'User-Agent': 'BlazeSportsIntel/1.0', 'Accept': 'application/json' }
            }).then(r => r.json()).catch(() => null),
            fetch(`https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/${teamId}/schedule`, {
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
              conference: teamInfo.team?.groups?.[0],
              record: {
                overall: record.summary || '0-0',
                wins: record.stats?.find((s: any) => s.name === 'wins')?.value || 0,
                losses: record.stats?.find((s: any) => s.name === 'losses')?.value || 0,
                conference: record.stats?.find((s: any) => s.name === 'vsConf')?.displayValue || '0-0'
              }
            },
            roster: roster?.athletes?.map((a: any) => ({
              id: a.id,
              name: a.fullName,
              jersey: a.jersey,
              position: a.position?.abbreviation,
              year: a.experience?.displayValue
            })) || [],
            schedule: schedule?.events || [],
            meta: {
              dataSource: 'ESPN NCAA API',
              lastUpdated: new Date().toISOString(),
              season: '2024'
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
      const week = url.searchParams.get('week') || 'current';
      const cacheKey = `ncaa:scoreboard:${week}`;
      let scoreboard = null;

      if (env.SPORTS_CACHE) {
        const cached = await env.SPORTS_CACHE.get(cacheKey, 'json');
        if (cached) scoreboard = cached;
      }

      if (!scoreboard) {
        const espnUrl = week === 'current'
          ? 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard'
          : `https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?week=${week}`;

        const espnResponse = await fetch(espnUrl, {
          headers: {
            'User-Agent': 'BlazeSportsIntel/1.0',
            'Accept': 'application/json'
          }
        });

        if (!espnResponse.ok) {
          throw new Error('ESPN API returned non-OK status');
        }

        const espnData = await espnResponse.json();

        scoreboard = {
          timestamp: new Date().toISOString(),
          week: espnData.week,
          season: espnData.season,
          games: espnData.events?.map((event: any) => ({
            id: event.id,
            name: event.name,
            date: event.date,
            status: event.status,
            teams: event.competitions?.[0]?.competitors,
            venue: event.competitions?.[0]?.venue
          })) || [],
          meta: {
            dataSource: 'ESPN NCAA API',
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

    // Rankings endpoint
    if (route[0] === 'rankings') {
      const cacheKey = 'ncaa:rankings';
      let rankings = null;

      if (env.SPORTS_CACHE) {
        const cached = await env.SPORTS_CACHE.get(cacheKey, 'json');
        if (cached) rankings = cached;
      }

      if (!rankings) {
        const espnResponse = await fetch(
          'https://site.api.espn.com/apis/site/v2/sports/football/college-football/rankings',
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

        rankings = {
          timestamp: new Date().toISOString(),
          rankings: espnData.rankings?.map((poll: any) => ({
            name: poll.name,
            type: poll.type,
            ranks: poll.ranks?.slice(0, 25)
          })),
          meta: {
            dataSource: 'ESPN NCAA API',
            lastUpdated: new Date().toISOString()
          }
        };

        if (env.SPORTS_CACHE) {
          await env.SPORTS_CACHE.put(cacheKey, JSON.stringify(rankings), {
            expirationTtl: 3600
          });
        }
      }

      return new Response(JSON.stringify(rankings, null, 2), {
        status: 200,
        headers
      });
    }

    return new Response(JSON.stringify({
      error: 'Not found',
      availableEndpoints: [
        '/api/ncaa/teams',
        '/api/ncaa/teams/{teamId}',
        '/api/ncaa/scoreboard?week={week}',
        '/api/ncaa/rankings'
      ]
    }), {
      status: 404,
      headers
    });

  } catch (error: any) {
    console.error('NCAA API error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers
    });
  }
};