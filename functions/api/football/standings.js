/**
 * College Football Standings API
 * Endpoint: /api/football/standings
 *
 * Fetches college football conference standings from ESPN API
 * with 5-minute cache for efficiency
 */

import { rateLimit, rateLimitError, corsHeaders } from '../_utils.js';

export async function onRequest({ request, env, ctx }) {
  const url = new URL(request.url)
  const conference = url.searchParams.get('conference') || 'all'
  const division = url.searchParams.get('division') || 'fbs'

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  // Rate limiting: 100 requests per minute per IP
  const limit = await rateLimit(env, request, 100, 60000);
  if (!limit.allowed) {
    return rateLimitError(limit.resetAt, limit.retryAfter);
  }

  try {
    // Build ESPN API URL
    let apiUrl = 'https://site.api.espn.com/apis/v2/sports/football/college-football/standings'

    if (conference !== 'all') {
      apiUrl += `?group=${conference}`
    }

    // Check KV cache
    const cacheKey = `football:standings:${conference}:${division}`

    if (env.KV) {
      const cached = await env.KV.get(cacheKey, 'json')
      if (cached && cached.expires > Date.now()) {
        return new Response(JSON.stringify(cached.data), {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=300',
            'X-Cache': 'HIT'
          }
        })
      }
    }

    // Fetch from ESPN API
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'BlazeSportsIntel/1.0',
        Accept: 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.status}`)
    }

    const data = await response.json()

    // Transform ESPN standings data
    const transformedData = {
      season: {
        year: data.season?.year || 2025,
        type: data.season?.type || 2
      },
      conferences: (data.children || []).map(conf => ({
        id: conf.uid,
        name: conf.name,
        abbreviation: conf.abbreviation,
        divisions: (conf.children || []).map(div => ({
          name: div.name,
          teams: (div.standings?.entries || []).map(entry => {
            const team = entry.team
            const stats = entry.stats || []

            return {
              rank: stats.find(s => s.name === 'rank')?.value,
              team: {
                id: team?.id,
                uid: team?.uid,
                name: team?.displayName,
                abbreviation: team?.abbreviation,
                logo: team?.logos?.[0]?.href,
                color: team?.color,
                alternateColor: team?.alternateColor
              },
              record: {
                overall: stats.find(s => s.name === 'overall')?.displayValue,
                conference: stats.find(s => s.name === 'vs. Conf.')?.displayValue,
                home: stats.find(s => s.name === 'home')?.displayValue,
                away: stats.find(s => s.name === 'road')?.displayValue
              },
              stats: {
                wins: stats.find(s => s.name === 'wins')?.value || 0,
                losses: stats.find(s => s.name === 'losses')?.value || 0,
                winPercent: stats.find(s => s.name === 'winPercent')?.value || 0,
                gamesBack: stats.find(s => s.name === 'gamesBehind')?.displayValue,
                streak: stats.find(s => s.name === 'streak')?.displayValue,
                pointsFor: stats.find(s => s.name === 'pointsFor')?.value || 0,
                pointsAgainst: stats.find(s => s.name === 'pointsAgainst')?.value || 0,
                differential: (stats.find(s => s.name === 'pointsFor')?.value || 0) -
                              (stats.find(s => s.name === 'pointsAgainst')?.value || 0)
              }
            }
          })
        }))
      })),
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

    // Cache for 5 minutes
    const ttl = 300

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
    console.error('Football standings API error:', error)

    return new Response(JSON.stringify({
      error: 'Failed to fetch college football standings',
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
