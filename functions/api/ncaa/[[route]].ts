import { createTimeoutSignal } from '../_utils.js';

type SportKey = 'football' | 'baseball';

type SportConfig = {
  base: string;
  scoreboard: string;
  rankings: string;
};

const SPORT_PATHS: Record<SportKey, SportConfig> = {
  football: {
    base: 'https://site.api.espn.com/apis/site/v2/sports/football/college-football',
    scoreboard: 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard',
    rankings: 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/rankings',
  },
  baseball: {
    base: 'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball',
    scoreboard: 'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/scoreboard',
    rankings: 'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/rankings',
  },
};

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
    'Cache-Control': 'public, max-age=300, s-maxage=600',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  const sportResult = resolveSport(url.searchParams.get('sport'));
  if ('error' in sportResult) {
    return new Response(JSON.stringify({ error: sportResult.error }), {
      status: 400,
      headers,
    });
  }

  const { sport, endpoints } = sportResult;

  try {
    if (route[0] === 'teams') {
      const teamId = route[1] || url.searchParams.get('teamId');

      if (!teamId) {
        const cacheKey = `ncaa:${sport}:teams:all`;
        let teams: any = null;

        if (env.SPORTS_CACHE) {
          const cached = await env.SPORTS_CACHE.get(cacheKey, 'json');
          if (cached) teams = cached;
        }

        if (!teams) {
          const response = await fetch(`${endpoints.base}/teams?limit=300`, {
            headers: {
              'User-Agent': 'BlazeSportsIntel/1.0',
              Accept: 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error('ESPN API returned non-OK status');
          }

          const payload = await response.json();
          const leagueTeams = payload?.sports?.[0]?.leagues?.[0]?.teams ?? [];

          teams = {
            timestamp: new Date().toISOString(),
            teams: leagueTeams.map((entry: any) => ({
              id: entry?.team?.id ?? null,
              name: entry?.team?.displayName ?? null,
              abbreviation: entry?.team?.abbreviation ?? null,
              location: entry?.team?.location ?? null,
              color: entry?.team?.color ?? null,
              alternateColor: entry?.team?.alternateColor ?? null,
              logos: entry?.team?.logos ?? [],
              conference: entry?.team?.groups?.[0]?.name ?? null,
            })),
            meta: {
              dataSource:
                sport === 'baseball'
                  ? 'ESPN College Baseball API'
                  : 'ESPN College Football API',
              lastUpdated: new Date().toISOString(),
              sport,
            },
          };

          if (env.SPORTS_CACHE) {
            await env.SPORTS_CACHE.put(cacheKey, JSON.stringify(teams), {
              expirationTtl: 3600,
            });
          }
        }

        return new Response(JSON.stringify(teams, null, 2), {
          status: 200,
          headers,
        });
      }

      const cacheKey = `ncaa:${sport}:team:${teamId}:full`;
      let teamData: any = null;

      if (env.SPORTS_CACHE) {
        const cached = await env.SPORTS_CACHE.get(cacheKey, 'json');
        if (cached) teamData = cached;
      }

      if (!teamData) {
        const [teamInfo, roster, schedule] = await Promise.all([
          fetch(`${endpoints.base}/teams/${teamId}`, {
            headers: { 'User-Agent': 'BlazeSportsIntel/1.0', Accept: 'application/json' },
          }).then((r) => r.json()),
          fetch(`${endpoints.base}/teams/${teamId}/roster`, {
            headers: { 'User-Agent': 'BlazeSportsIntel/1.0', Accept: 'application/json' },
          })
            .then((r) => r.json())
            .catch(() => null),
          fetch(`${endpoints.base}/teams/${teamId}/schedule`, {
            headers: { 'User-Agent': 'BlazeSportsIntel/1.0', Accept: 'application/json' },
          })
            .then((r) => r.json())
            .catch(() => null),
        ]);

        const record = teamInfo?.team?.record?.items?.[0] || {};

        teamData = {
          timestamp: new Date().toISOString(),
          team: {
            id: teamInfo?.team?.id ?? null,
            name: teamInfo?.team?.displayName ?? null,
            abbreviation: teamInfo?.team?.abbreviation ?? null,
            color: teamInfo?.team?.color ?? null,
            logos: teamInfo?.team?.logos ?? [],
            conference: teamInfo?.team?.groups?.[0] ?? null,
            record: {
              overall: record?.summary || '0-0',
              wins: record?.stats?.find((s: any) => s.name === 'wins')?.value || 0,
              losses: record?.stats?.find((s: any) => s.name === 'losses')?.value || 0,
              conference:
                record?.stats?.find((s: any) => s.name === 'vsConf' || s.name === 'vs. Conf.')?.displayValue ||
                '0-0',
              neutral:
                record?.stats?.find((s: any) => s.name === 'neutral' || s.name === 'vsNeutral')?.displayValue ||
                null,
            },
          },
          roster:
            roster?.athletes?.map((athlete: any) => ({
              id: athlete?.id ?? null,
              name: athlete?.fullName ?? null,
              jersey: athlete?.jersey ?? null,
              position: athlete?.position?.abbreviation ?? athlete?.position?.displayName ?? null,
              year: athlete?.experience?.displayValue ?? null,
              ...(sport === 'baseball'
                ? {
                    bats: athlete?.bats ?? athlete?.hand?.bats ?? null,
                    throws: athlete?.throws ?? athlete?.hand?.throws ?? null,
                  }
                : {}),
            })) ?? [],
          schedule: schedule?.events ?? [],
          meta: {
            dataSource:
              sport === 'baseball'
                ? 'ESPN College Baseball API'
                : 'ESPN NCAA API',
            lastUpdated: new Date().toISOString(),
            season: schedule?.season?.year || new Date().getFullYear(),
            sport,
          },
        };

        if (env.SPORTS_CACHE) {
          await env.SPORTS_CACHE.put(cacheKey, JSON.stringify(teamData), {
            expirationTtl: 300,
          });
        }
      }

      return new Response(JSON.stringify(teamData, null, 2), {
        status: 200,
        headers,
      });
    }

    if (route[0] === 'scoreboard') {
      const cacheToken = buildScoreboardCacheToken(url.searchParams, sport);
      const cacheKey = `ncaa:${sport}:scoreboard:${cacheToken}`;
      let scoreboard: any = null;

      if (env.SPORTS_CACHE) {
        const cached = await env.SPORTS_CACHE.get(cacheKey, 'json');
        if (cached) scoreboard = cached;
      }

      if (!scoreboard) {
        const scoreboardUrl = buildScoreboardUrl(endpoints.scoreboard, sport, url.searchParams);
        const signal = createTimeoutSignal(8000);
        const response = await fetch(scoreboardUrl, {
          headers: {
            'User-Agent': 'BlazeSportsIntel/1.0',
            Accept: 'application/json',
          },
          signal,
        });

        if (!response.ok) {
          throw new Error('ESPN API returned non-OK status');
        }

        const payload = await response.json();
        scoreboard = {
          timestamp: new Date().toISOString(),
          sport,
          week: payload?.week ?? null,
          season: payload?.season ?? null,
          games:
            payload?.events?.map((event: any) => ({
              id: event?.id ?? null,
              name: event?.name ?? null,
              date: event?.date ?? null,
              status: normalizeScoreboardStatus(event?.status, sport),
              teams: event?.competitions?.[0]?.competitors ?? [],
              venue: event?.competitions?.[0]?.venue ?? null,
              broadcasts: event?.competitions?.[0]?.broadcasts ?? [],
              notes: sport === 'baseball' ? event?.series ?? null : null,
            })) ?? [],
          meta: {
            dataSource:
              sport === 'baseball'
                ? 'ESPN College Baseball API'
                : 'ESPN NCAA API',
            lastUpdated: new Date().toISOString(),
            sport,
          },
        };

        const allCompleted = scoreboard.games.every((game: any) => game?.status?.completed);
        const ttl = allCompleted ? 300 : 30;

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

    if (route[0] === 'rankings') {
      const cacheKey = `ncaa:${sport}:rankings`;
      let rankings: any = null;

      if (env.SPORTS_CACHE) {
        const cached = await env.SPORTS_CACHE.get(cacheKey, 'json');
        if (cached) rankings = cached;
      }

      if (!rankings) {
        const response = await fetch(endpoints.rankings, {
          headers: {
            'User-Agent': 'BlazeSportsIntel/1.0',
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('ESPN API returned non-OK status');
        }

        const payload = await response.json();
        rankings = {
          timestamp: new Date().toISOString(),
          rankings: payload?.rankings?.map((poll: any) => ({
            name: poll?.name ?? null,
            type: poll?.type ?? null,
            ranks: poll?.ranks?.slice(0, 25) ?? [],
          })) ?? [],
          meta: {
            dataSource:
              sport === 'baseball'
                ? 'ESPN College Baseball API'
                : 'ESPN NCAA API',
            lastUpdated: new Date().toISOString(),
            sport,
          },
        };

        if (env.SPORTS_CACHE) {
          await env.SPORTS_CACHE.put(cacheKey, JSON.stringify(rankings), {
            expirationTtl: 3600,
          });
        }
      }

      return new Response(JSON.stringify(rankings, null, 2), {
        status: 200,
        headers,
      });
    }

    return new Response(
      JSON.stringify({
        error: 'Not found',
        availableEndpoints: [
          '/api/ncaa/teams',
          '/api/ncaa/teams/{teamId}',
          '/api/ncaa/scoreboard?week={week}',
          '/api/ncaa/rankings',
        ],
      }),
      {
        status: 404,
        headers,
      },
    );
  } catch (error: any) {
    console.error('NCAA API error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error?.message ?? 'Unknown error',
    }), {
      status: 500,
      headers,
    });
  }
};

function resolveSport(raw: string | null):
  | { sport: SportKey; endpoints: SportConfig }
  | { error: string } {
  const normalized = (raw || 'football').toLowerCase();
  if (normalized in SPORT_PATHS) {
    return {
      sport: normalized as SportKey,
      endpoints: SPORT_PATHS[normalized as SportKey],
    };
  }

  return {
    error: 'Unsupported sport parameter. Supported values are football and baseball.',
  };
}

function buildScoreboardUrl(base: string, sport: SportKey, params: URLSearchParams) {
  if (sport === 'baseball') {
    const date = params.get('date');
    if (date) {
      return `${base}?dates=${date.replace(/-/g, '')}`;
    }
    return base;
  }

  const week = params.get('week') || 'current';
  return week === 'current' ? base : `${base}?week=${week}`;
}

function buildScoreboardCacheToken(params: URLSearchParams, sport: SportKey) {
  if (sport === 'baseball') {
    return `date:${params.get('date') || 'latest'}`;
  }

  return `week:${params.get('week') || 'current'}`;
}

function normalizeScoreboardStatus(status: any, sport: SportKey) {
  if (!status || typeof status !== 'object') {
    return null;
  }

  const base = {
    type: status?.type?.name ?? null,
    description: status?.type?.detail ?? status?.type?.description ?? null,
    shortDetail: status?.type?.shortDetail ?? null,
    completed: Boolean(status?.type?.completed),
  };

  if (sport === 'baseball') {
    return {
      ...base,
      inning: status?.period ?? null,
      inningState: status?.type?.state ?? null,
      balls: status?.balls ?? null,
      strikes: status?.strikes ?? null,
      outs: status?.outs ?? null,
    };
  }

  return {
    ...base,
    clock: status?.displayClock ?? null,
    period: status?.period ?? null,
  };
}
