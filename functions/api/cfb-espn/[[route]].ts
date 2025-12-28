/**
 * Blaze Sports Intel - CFB Analytics API (ESPN Integration)
 * Bowl Season Real-Time Data for College Football
 *
 * Endpoints:
 *   GET /api/cfb-espn/scoreboard - Current bowl games with live scores
 *   GET /api/cfb-espn/rankings - CFP Rankings, AP Top 25, Coaches Poll
 *   GET /api/cfb-espn/teams - All FBS teams
 *   GET /api/cfb-espn/teams/{teamId} - Team details with roster and schedule
 *   GET /api/cfb-espn/games/{gameId} - Game details with box score
 */

export interface Env {
  SPORTS_CACHE?: KVNamespace;
}

const ESPN_CFB_BASE = 'https://site.api.espn.com/apis/site/v2/sports/football/college-football';

// Texas Longhorns ID for special highlighting
const LONGHORNS_TEAM_ID = '251';

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  const url = new URL(request.url);
  const route = (params.route as string[]) || [];

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=300, s-maxage=600',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    // ==================== SCOREBOARD ====================
    if (route[0] === 'scoreboard') {
      const dateParam = url.searchParams.get('date');
      const cacheKey = `cfb:scoreboard:${dateParam || 'current'}`;
      let scoreboard = null;

      if (env.SPORTS_CACHE) {
        const cached = await env.SPORTS_CACHE.get(cacheKey, 'json');
        if (cached) scoreboard = cached;
      }

      if (!scoreboard) {
        const espnUrl = dateParam
          ? `${ESPN_CFB_BASE}/scoreboard?dates=${dateParam.replace(/-/g, '')}`
          : `${ESPN_CFB_BASE}/scoreboard`;

        const espnResponse = await fetch(espnUrl, {
          headers: {
            'User-Agent': 'BlazeSportsIntel/1.0',
            Accept: 'application/json',
          },
        });

        if (!espnResponse.ok) {
          throw new Error('ESPN CFB API returned non-OK status');
        }

        const espnData = await espnResponse.json();

        // Categorize games
        const games = espnData.events?.map((event: any) => {
          const competition = event.competitions?.[0];
          const homeTeam = competition?.competitors?.find((c: any) => c.homeAway === 'home');
          const awayTeam = competition?.competitors?.find((c: any) => c.homeAway === 'away');

          const isLonghornsGame =
            homeTeam?.team?.id === LONGHORNS_TEAM_ID ||
            awayTeam?.team?.id === LONGHORNS_TEAM_ID;

          return {
            id: event.id,
            name: event.name,
            shortName: event.shortName,
            date: event.date,
            bowlName: event.notes?.[0]?.headline || null,
            status: {
              state: event.status?.type?.state,
              completed: event.status?.type?.completed,
              detail: event.status?.type?.detail,
              displayClock: event.status?.displayClock,
              period: event.status?.period,
            },
            venue: {
              name: competition?.venue?.fullName,
              city: competition?.venue?.address?.city,
              state: competition?.venue?.address?.state,
            },
            homeTeam: homeTeam
              ? {
                  id: homeTeam.team?.id,
                  name: homeTeam.team?.displayName,
                  abbreviation: homeTeam.team?.abbreviation,
                  logo: homeTeam.team?.logo,
                  color: homeTeam.team?.color,
                  score: homeTeam.score,
                  winner: homeTeam.winner,
                  isLonghorns: homeTeam.team?.id === LONGHORNS_TEAM_ID,
                  records: homeTeam.records?.[0]?.summary,
                }
              : null,
            awayTeam: awayTeam
              ? {
                  id: awayTeam.team?.id,
                  name: awayTeam.team?.displayName,
                  abbreviation: awayTeam.team?.abbreviation,
                  logo: awayTeam.team?.logo,
                  color: awayTeam.team?.color,
                  score: awayTeam.score,
                  winner: awayTeam.winner,
                  isLonghorns: awayTeam.team?.id === LONGHORNS_TEAM_ID,
                  records: awayTeam.records?.[0]?.summary,
                }
              : null,
            isLonghornsGame,
            broadcast: competition?.broadcasts?.[0]?.names?.join(', ') || null,
            odds: competition?.odds?.[0]
              ? {
                  line: competition.odds[0].details,
                  overUnder: competition.odds[0].overUnder,
                }
              : null,
          };
        }) || [];

        // Sort: Live games first, then upcoming, then completed
        const liveGames = games.filter((g: any) => g.status.state === 'in');
        const upcomingGames = games.filter((g: any) => g.status.state === 'pre');
        const completedGames = games.filter((g: any) => g.status.state === 'post');

        scoreboard = {
          timestamp: new Date().toISOString(),
          season: espnData.season?.year || 2025,
          seasonType: espnData.season?.type?.name || 'postseason',
          totalGames: games.length,
          liveGames: liveGames.length,
          upcomingGames: upcomingGames.length,
          completedGames: completedGames.length,
          longhornsGame: games.find((g: any) => g.isLonghornsGame) || null,
          games,
          bowlSchedule: {
            live: liveGames,
            upcoming: upcomingGames,
            completed: completedGames,
          },
          meta: {
            dataSource: 'ESPN College Football API',
            lastUpdated: new Date().toISOString(),
            timezone: 'America/Chicago',
          },
        };

        // Cache based on live games
        const hasLiveGames = liveGames.length > 0;
        const ttl = hasLiveGames ? 30 : 300;

        if (env.SPORTS_CACHE) {
          await env.SPORTS_CACHE.put(cacheKey, JSON.stringify(scoreboard), {
            expirationTtl: ttl,
          });
        }
      }

      return new Response(JSON.stringify(scoreboard, null, 2), {
        status: 200,
        headers,
      });
    }

    // ==================== RANKINGS ====================
    if (route[0] === 'rankings') {
      const cacheKey = 'cfb:rankings';
      let rankings = null;

      if (env.SPORTS_CACHE) {
        const cached = await env.SPORTS_CACHE.get(cacheKey, 'json');
        if (cached) rankings = cached;
      }

      if (!rankings) {
        const espnResponse = await fetch(`${ESPN_CFB_BASE}/rankings`, {
          headers: {
            'User-Agent': 'BlazeSportsIntel/1.0',
            Accept: 'application/json',
          },
        });

        if (!espnResponse.ok) {
          throw new Error('ESPN Rankings API returned non-OK status');
        }

        const espnData = await espnResponse.json();

        // Process each poll
        const polls = espnData.rankings?.map((poll: any) => ({
          name: poll.name,
          type: poll.type,
          headline: poll.headline,
          teams: poll.ranks?.map((rank: any) => ({
            rank: rank.current,
            previousRank: rank.previous,
            trend: rank.trend,
            team: {
              id: rank.team?.id,
              name: rank.team?.displayName,
              abbreviation: rank.team?.abbreviation,
              logo: rank.team?.logos?.[0]?.href,
              color: rank.team?.color,
              isLonghorns: rank.team?.id === LONGHORNS_TEAM_ID,
            },
            record: rank.recordSummary,
            points: rank.points,
          })),
        })) || [];

        // Find Longhorns ranking across all polls
        const longhornsRankings: any = {};
        polls.forEach((poll: any) => {
          const longhornsEntry = poll.teams?.find((t: any) => t.team?.isLonghorns);
          if (longhornsEntry) {
            longhornsRankings[poll.name] = longhornsEntry.rank;
          }
        });

        rankings = {
          timestamp: new Date().toISOString(),
          season: espnData.season?.year || 2025,
          polls,
          longhornsRankings,
          cfpTop12: polls.find((p: any) => p.name?.includes('Playoff'))?.teams?.slice(0, 12) || [],
          apTop25: polls.find((p: any) => p.name === 'AP Top 25')?.teams || [],
          coachesTop25: polls.find((p: any) => p.name?.includes('Coaches'))?.teams || [],
          meta: {
            dataSource: 'ESPN College Football Rankings API',
            lastUpdated: new Date().toISOString(),
            timezone: 'America/Chicago',
          },
        };

        if (env.SPORTS_CACHE) {
          await env.SPORTS_CACHE.put(cacheKey, JSON.stringify(rankings), {
            expirationTtl: 1800, // 30 minutes
          });
        }
      }

      return new Response(JSON.stringify(rankings, null, 2), {
        status: 200,
        headers,
      });
    }

    // ==================== TEAMS ====================
    if (route[0] === 'teams') {
      const teamId = route[1];

      if (!teamId) {
        // Return all teams
        const cacheKey = 'cfb:teams:all';
        let teams = null;

        if (env.SPORTS_CACHE) {
          const cached = await env.SPORTS_CACHE.get(cacheKey, 'json');
          if (cached) teams = cached;
        }

        if (!teams) {
          const espnResponse = await fetch(`${ESPN_CFB_BASE}/teams?limit=200`, {
            headers: {
              'User-Agent': 'BlazeSportsIntel/1.0',
              Accept: 'application/json',
            },
          });

          if (!espnResponse.ok) {
            throw new Error('ESPN Teams API returned non-OK status');
          }

          const espnData = await espnResponse.json();

          // Group by conference
          const byConference: Record<string, any[]> = {};

          espnData.sports?.[0]?.leagues?.[0]?.teams?.forEach((t: any) => {
            const team = t.team;
            const conf = team.groups?.name || 'Independent';

            if (!byConference[conf]) {
              byConference[conf] = [];
            }

            byConference[conf].push({
              id: team.id,
              name: team.displayName,
              abbreviation: team.abbreviation,
              nickname: team.name,
              location: team.location,
              color: team.color,
              logo: team.logos?.[0]?.href,
              isLonghorns: team.id === LONGHORNS_TEAM_ID,
            });
          });

          teams = {
            timestamp: new Date().toISOString(),
            totalTeams: espnData.sports?.[0]?.leagues?.[0]?.teams?.length || 0,
            byConference,
            longhorns: byConference['Big 12 Conference']?.find((t: any) => t.isLonghorns) || null,
            meta: {
              dataSource: 'ESPN College Football API',
              lastUpdated: new Date().toISOString(),
            },
          };

          if (env.SPORTS_CACHE) {
            await env.SPORTS_CACHE.put(cacheKey, JSON.stringify(teams), {
              expirationTtl: 86400, // 24 hours
            });
          }
        }

        return new Response(JSON.stringify(teams, null, 2), {
          status: 200,
          headers,
        });
      } else {
        // Return specific team
        const cacheKey = `cfb:team:${teamId}`;
        let teamData = null;

        if (env.SPORTS_CACHE) {
          const cached = await env.SPORTS_CACHE.get(cacheKey, 'json');
          if (cached) teamData = cached;
        }

        if (!teamData) {
          const [teamInfo, roster, schedule] = await Promise.all([
            fetch(`${ESPN_CFB_BASE}/teams/${teamId}`, {
              headers: { 'User-Agent': 'BlazeSportsIntel/1.0', Accept: 'application/json' },
            }).then((r) => r.json()),
            fetch(`${ESPN_CFB_BASE}/teams/${teamId}/roster`, {
              headers: { 'User-Agent': 'BlazeSportsIntel/1.0', Accept: 'application/json' },
            })
              .then((r) => r.json())
              .catch(() => null),
            fetch(`${ESPN_CFB_BASE}/teams/${teamId}/schedule`, {
              headers: { 'User-Agent': 'BlazeSportsIntel/1.0', Accept: 'application/json' },
            })
              .then((r) => r.json())
              .catch(() => null),
          ]);

          const team = teamInfo.team;
          const isLonghorns = teamId === LONGHORNS_TEAM_ID;

          teamData = {
            timestamp: new Date().toISOString(),
            team: {
              id: team?.id,
              name: team?.displayName,
              abbreviation: team?.abbreviation,
              nickname: team?.name,
              location: team?.location,
              color: team?.color,
              alternateColor: team?.alternateColor,
              logos: team?.logos,
              conference: team?.groups?.name,
              isLonghorns,
              record: team?.record?.items?.[0]?.summary,
              venue: team?.venue,
            },
            roster: roster?.athletes?.map((a: any) => ({
              id: a.id,
              name: a.fullName,
              jersey: a.jersey,
              position: a.position?.abbreviation,
              height: a.displayHeight,
              weight: a.displayWeight,
              year: a.experience?.displayValue,
              hometown: a.birthPlace?.city ? `${a.birthPlace.city}, ${a.birthPlace.state}` : null,
            })) || [],
            schedule: schedule?.events?.map((e: any) => ({
              id: e.id,
              name: e.name,
              date: e.date,
              completed: e.competitions?.[0]?.status?.type?.completed,
              result: e.competitions?.[0]?.competitors?.find((c: any) => c.team?.id === teamId)?.winner
                ? 'W'
                : 'L',
              score: e.competitions?.[0]?.competitors
                ?.map((c: any) => `${c.team?.abbreviation} ${c.score}`)
                .join(' - '),
            })) || [],
            meta: {
              dataSource: 'ESPN College Football API',
              lastUpdated: new Date().toISOString(),
            },
          };

          if (env.SPORTS_CACHE) {
            await env.SPORTS_CACHE.put(cacheKey, JSON.stringify(teamData), {
              expirationTtl: 1800, // 30 minutes
            });
          }
        }

        return new Response(JSON.stringify(teamData, null, 2), {
          status: 200,
          headers,
        });
      }
    }

    // ==================== GAMES ====================
    if (route[0] === 'games') {
      const gameId = route[1];

      if (!gameId) {
        return new Response(
          JSON.stringify({ error: 'Game ID required' }),
          { status: 400, headers }
        );
      }

      const cacheKey = `cfb:game:${gameId}`;
      let gameData = null;

      if (env.SPORTS_CACHE) {
        const cached = await env.SPORTS_CACHE.get(cacheKey, 'json');
        if (cached) gameData = cached;
      }

      if (!gameData) {
        const espnResponse = await fetch(`${ESPN_CFB_BASE}/summary?event=${gameId}`, {
          headers: {
            'User-Agent': 'BlazeSportsIntel/1.0',
            Accept: 'application/json',
          },
        });

        if (!espnResponse.ok) {
          throw new Error('ESPN Game API returned non-OK status');
        }

        const espnData = await espnResponse.json();
        const header = espnData.header;
        const boxscore = espnData.boxscore;
        const competition = header?.competitions?.[0];

        const homeTeam = competition?.competitors?.find((c: any) => c.homeAway === 'home');
        const awayTeam = competition?.competitors?.find((c: any) => c.homeAway === 'away');

        gameData = {
          timestamp: new Date().toISOString(),
          game: {
            id: gameId,
            name: header?.name,
            bowlName: header?.notes?.[0]?.headline,
            status: {
              completed: competition?.status?.type?.completed,
              state: competition?.status?.type?.state,
              detail: competition?.status?.type?.detail,
              displayClock: competition?.status?.displayClock,
              period: competition?.status?.period,
            },
            venue: {
              name: competition?.venue?.fullName,
              city: competition?.venue?.address?.city,
            },
          },
          homeTeam: homeTeam
            ? {
                id: homeTeam.team?.id,
                name: homeTeam.team?.displayName,
                abbreviation: homeTeam.team?.abbreviation,
                logo: homeTeam.team?.logos?.[0]?.href,
                color: homeTeam.team?.color,
                score: homeTeam.score,
                winner: homeTeam.winner,
                isLonghorns: homeTeam.team?.id === LONGHORNS_TEAM_ID,
                linescores: homeTeam.linescores?.map((l: any) => l.displayValue),
              }
            : null,
          awayTeam: awayTeam
            ? {
                id: awayTeam.team?.id,
                name: awayTeam.team?.displayName,
                abbreviation: awayTeam.team?.abbreviation,
                logo: awayTeam.team?.logos?.[0]?.href,
                color: awayTeam.team?.color,
                score: awayTeam.score,
                winner: awayTeam.winner,
                isLonghorns: awayTeam.team?.id === LONGHORNS_TEAM_ID,
                linescores: awayTeam.linescores?.map((l: any) => l.displayValue),
              }
            : null,
          leaders: boxscore?.teams?.map((team: any) => ({
            team: team.team?.displayName,
            stats: team.statistics?.slice(0, 5)?.map((stat: any) => ({
              name: stat.displayName,
              leader: stat.leaders?.[0]
                ? {
                    name: stat.leaders[0].athlete?.displayName,
                    value: stat.leaders[0].displayValue,
                  }
                : null,
            })),
          })) || [],
          drives: espnData.drives?.previous?.map((drive: any) => ({
            team: drive.team?.displayName,
            description: drive.description,
            result: drive.result,
            plays: drive.plays?.length,
            yards: drive.yards,
            timeOfPossession: drive.displayResult,
          })) || [],
          meta: {
            dataSource: 'ESPN College Football API',
            lastUpdated: new Date().toISOString(),
          },
        };

        const isCompleted = gameData.game.status.completed;
        const ttl = isCompleted ? 3600 : 30;

        if (env.SPORTS_CACHE) {
          await env.SPORTS_CACHE.put(cacheKey, JSON.stringify(gameData), {
            expirationTtl: ttl,
          });
        }
      }

      return new Response(JSON.stringify(gameData, null, 2), {
        status: 200,
        headers,
      });
    }

    // ==================== BOWL SCHEDULE ====================
    if (route[0] === 'bowls') {
      const cacheKey = 'cfb:bowls:2025';
      let bowls = null;

      if (env.SPORTS_CACHE) {
        const cached = await env.SPORTS_CACHE.get(cacheKey, 'json');
        if (cached) bowls = cached;
      }

      if (!bowls) {
        // Get all bowl games
        const espnResponse = await fetch(`${ESPN_CFB_BASE}/scoreboard`, {
          headers: {
            'User-Agent': 'BlazeSportsIntel/1.0',
            Accept: 'application/json',
          },
        });

        if (!espnResponse.ok) {
          throw new Error('ESPN CFB API returned non-OK status');
        }

        const espnData = await espnResponse.json();

        // Filter for bowl games
        const allBowls = espnData.events
          ?.filter((e: any) => e.notes?.[0]?.headline)
          ?.map((event: any) => {
            const competition = event.competitions?.[0];
            const homeTeam = competition?.competitors?.find((c: any) => c.homeAway === 'home');
            const awayTeam = competition?.competitors?.find((c: any) => c.homeAway === 'away');

            return {
              id: event.id,
              bowlName: event.notes?.[0]?.headline,
              date: event.date,
              status: event.status?.type?.state,
              completed: event.status?.type?.completed,
              venue: competition?.venue?.fullName,
              homeTeam: {
                name: homeTeam?.team?.displayName,
                abbreviation: homeTeam?.team?.abbreviation,
                score: homeTeam?.score,
                winner: homeTeam?.winner,
                isLonghorns: homeTeam?.team?.id === LONGHORNS_TEAM_ID,
              },
              awayTeam: {
                name: awayTeam?.team?.displayName,
                abbreviation: awayTeam?.team?.abbreviation,
                score: awayTeam?.score,
                winner: awayTeam?.winner,
                isLonghorns: awayTeam?.team?.id === LONGHORNS_TEAM_ID,
              },
              isLonghornsGame:
                homeTeam?.team?.id === LONGHORNS_TEAM_ID ||
                awayTeam?.team?.id === LONGHORNS_TEAM_ID,
            };
          }) || [];

        // Find Texas Longhorns bowl game
        const longhornsGame = allBowls.find((b: any) => b.isLonghornsGame);

        // Group by date
        const byDate: Record<string, any[]> = {};
        allBowls.forEach((bowl: any) => {
          const date = new Date(bowl.date).toLocaleDateString('en-US', {
            timeZone: 'America/Chicago',
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          });
          if (!byDate[date]) byDate[date] = [];
          byDate[date].push(bowl);
        });

        bowls = {
          timestamp: new Date().toISOString(),
          season: '2025-26',
          totalBowls: allBowls.length,
          longhornsGame,
          byDate,
          cfpGames: allBowls.filter((b: any) =>
            b.bowlName?.toLowerCase().includes('playoff') ||
            b.bowlName?.toLowerCase().includes('semifinal') ||
            b.bowlName?.toLowerCase().includes('championship')
          ),
          meta: {
            dataSource: 'ESPN College Football API',
            lastUpdated: new Date().toISOString(),
            timezone: 'America/Chicago',
          },
        };

        if (env.SPORTS_CACHE) {
          await env.SPORTS_CACHE.put(cacheKey, JSON.stringify(bowls), {
            expirationTtl: 600, // 10 minutes
          });
        }
      }

      return new Response(JSON.stringify(bowls, null, 2), {
        status: 200,
        headers,
      });
    }

    // ==================== 404 ====================
    return new Response(
      JSON.stringify({
        error: 'Not found',
        availableEndpoints: [
          '/api/cfb-espn/scoreboard',
          '/api/cfb-espn/scoreboard?date=YYYYMMDD',
          '/api/cfb-espn/rankings',
          '/api/cfb-espn/teams',
          '/api/cfb-espn/teams/{teamId}',
          '/api/cfb-espn/games/{gameId}',
          '/api/cfb-espn/bowls',
        ],
        longhornsTeamId: LONGHORNS_TEAM_ID,
      }),
      {
        status: 404,
        headers,
      }
    );
  } catch (error: any) {
    console.error('CFB ESPN API error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
      {
        status: 500,
        headers,
      }
    );
  }
};
