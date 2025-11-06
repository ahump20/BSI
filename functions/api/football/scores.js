/**
 * College Football Live Scores API
 * Endpoint: /api/football/scores
 *
 * Fetches live college football scores from ESPN API
 * with intelligent caching strategy (30s live, 5min final)
 */

import { validateRequest } from '../_validation.js';
import { footballScoresQuerySchema } from '../_schemas.js';
import { rateLimit, rateLimitError, corsHeaders } from '../_utils.js';

export async function onRequest({ request, env, ctx }) {
  // Handle OPTIONS preflight request
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    })
  }

  // Rate limiting: 100 requests per minute per IP
  const limit = await rateLimit(env, request, 100, 60000);
  if (!limit.allowed) {
    return rateLimitError(limit.resetAt, limit.retryAfter);
  }

  // Validate request parameters using Zod
  const validation = await validateRequest(request, {
    query: footballScoresQuerySchema
  });

  if (!validation.success) {
    return validation.errorResponse;
  }

  const { query } = validation.data;
  const week = query.week || 'current';
  const conference = query.conference;
  const team = query.team;

  try {
    // Build ESPN API URL
    let apiUrl = 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard'

    const params = new URLSearchParams()
    if (week && week !== 'current') params.append('week', week)
    if (conference) params.append('group', conference)
    if (team) params.append('team', team)

    if (params.toString()) {
      apiUrl += `?${params.toString()}`
    }

    // Check KV cache first
    const cacheKey = `football:scores:${week}:${conference || 'all'}:${team || 'all'}`

    if (env.KV) {
      const cached = await env.KV.get(cacheKey, 'json')
      if (cached && cached.expires > Date.now()) {
        return new Response(JSON.stringify(cached.data), {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=30',
            'X-Cache': 'HIT'
          }
        })
      }
    }

    // Fetch from ESPN API
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'BlazeSportsIntel/1.0',
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.status}`)
    }

    const data = await response.json()

    // Transform ESPN data to our format
    const transformedData = {
      week: data.week?.number || week,
      season: {
        year: data.season?.year || 2025,
        type: data.season?.type || 2
      },
      games: (data.events || []).map(event => {
        const competition = event.competitions?.[0]
        const homeTeam = competition?.competitors?.find(c => c.homeAway === 'home')
        const awayTeam = competition?.competitors?.find(c => c.homeAway === 'away')
        const status = competition?.status

        return {
          id: event.id,
          uid: event.uid,
          date: event.date,
          name: event.name,
          shortName: event.shortName,
          status: {
            type: status?.type?.name,
            state: status?.type?.state,
            completed: status?.type?.completed,
            detail: status?.type?.detail,
            shortDetail: status?.type?.shortDetail,
            period: status?.period,
            clock: status?.displayClock
          },
          teams: {
            home: {
              id: homeTeam?.id,
              uid: homeTeam?.uid,
              team: {
                id: homeTeam?.team?.id,
                name: homeTeam?.team?.displayName,
                abbreviation: homeTeam?.team?.abbreviation,
                logo: homeTeam?.team?.logo,
                color: homeTeam?.team?.color,
                alternateColor: homeTeam?.team?.alternateColor
              },
              score: homeTeam?.score,
              rank: homeTeam?.curatedRank?.current,
              record: homeTeam?.records?.[0]?.summary,
              winner: homeTeam?.winner
            },
            away: {
              id: awayTeam?.id,
              uid: awayTeam?.uid,
              team: {
                id: awayTeam?.team?.id,
                name: awayTeam?.team?.displayName,
                abbreviation: awayTeam?.team?.abbreviation,
                logo: awayTeam?.team?.logo,
                color: awayTeam?.team?.color,
                alternateColor: awayTeam?.team?.alternateColor
              },
              score: awayTeam?.score,
              rank: awayTeam?.curatedRank?.current,
              record: awayTeam?.records?.[0]?.summary,
              winner: awayTeam?.winner
            }
          },
          venue: {
            id: competition?.venue?.id,
            name: competition?.venue?.fullName,
            city: competition?.venue?.address?.city,
            state: competition?.venue?.address?.state
          },
          broadcast: competition?.broadcasts?.[0]?.names?.[0],
          odds: competition?.odds?.[0] ? {
            provider: competition.odds[0].provider?.name,
            spread: competition.odds[0].spread,
            overUnder: competition.odds[0].overUnder
          } : null
        }
      }),
      meta: {
        dataSource: 'ESPN College Football API',
        lastUpdated: new Date().toISOString(),
        lastUpdatedCDT: new Date().toLocaleString('en-US', {
          timeZone: 'America/Chicago',
          dateStyle: 'medium',
          timeStyle: 'short'
        }),
        cached: false
      }
    }

    // Determine cache TTL based on game status
    const allCompleted = transformedData.games.every(g => g.status.completed)
    const ttl = allCompleted ? 300 : 30 // 5 minutes for completed, 30 seconds for live

    // Cache the result
    if (env.KV) {
      await env.KV.put(cacheKey, JSON.stringify({
        data: transformedData,
        expires: Date.now() + (ttl * 1000)
      }), {
        expirationTtl: ttl
      })
    }

    return new Response(JSON.stringify(transformedData), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${ttl}`,
        'X-Cache': 'MISS'
      }
    })

  } catch (error) {
    console.error('Football scores API error:', error)

    return new Response(JSON.stringify({
      error: 'Failed to fetch college football scores',
      message: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })
  }
}
