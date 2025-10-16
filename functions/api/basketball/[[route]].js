/**
 * Basketball API Endpoints
 *
 * Dynamic routing for basketball data:
 * - /api/basketball/teams - NCAA basketball teams
 * - /api/basketball/standings - Conference standings
 * - /api/basketball/scores - Live/recent scores
 * - /api/basketball/stats - Player statistics
 *
 * Data source: ESPN API
 * Cache: Cloudflare KV (5 minute TTL for live data)
 */

export async function onRequest(context) {
  const { request, params, env } = context
  const route = params.route || []
  const endpoint = route[0] || 'teams'

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'public, max-age=300' // 5 minute cache
  }

  // Handle OPTIONS request
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    let data

    switch (endpoint) {
      case 'teams':
        data = await getTeams(context)
        break
      case 'standings':
        data = await getStandings(context)
        break
      case 'scores':
        data = await getScores(context)
        break
      case 'stats':
        data = await getStats(context)
        break
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid endpoint' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Basketball API error:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

/**
 * Get NCAA basketball teams
 */
async function getTeams(context) {
  const { request, env } = context
  const url = new URL(request.url)
  const conference = url.searchParams.get('conference')

  // Check cache
  const cacheKey = `basketball:teams:${conference || 'all'}`
  if (env.CACHE) {
    const cached = await env.CACHE.get(cacheKey, 'json')
    if (cached) return cached
  }

  // ESPN NCAA Basketball API
  const espnUrl = conference
    ? `https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams?group=${conference}`
    : 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams'

  const response = await fetch(espnUrl, {
    headers: {
      'User-Agent': 'BlazeSportsIntel/1.0',
      'Accept': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`ESPN API error: ${response.status}`)
  }

  const espnData = await response.json()

  // Transform to simplified structure
  const teams = espnData.sports?.[0]?.leagues?.[0]?.teams?.map(t => ({
    id: t.team?.id,
    name: t.team?.displayName,
    abbreviation: t.team?.abbreviation,
    logo: t.team?.logos?.[0]?.href,
    conference: t.team?.groups?.[0]?.name,
    record: t.team?.record?.items?.[0]?.summary || '0-0'
  })) || []

  const data = {
    teams,
    conference: conference || 'All',
    meta: {
      dataSource: 'ESPN NCAA Basketball API',
      lastUpdated: new Date().toISOString()
    }
  }

  // Cache for 5 minutes
  if (env.CACHE) {
    await env.CACHE.put(cacheKey, JSON.stringify(data), { expirationTtl: 300 })
  }

  return data
}

/**
 * Get conference standings
 */
async function getStandings(context) {
  const { request, env } = context
  const url = new URL(request.url)
  const conference = url.searchParams.get('conference')

  // Check cache
  const cacheKey = `basketball:standings:${conference || 'all'}`
  if (env.CACHE) {
    const cached = await env.CACHE.get(cacheKey, 'json')
    if (cached) return cached
  }

  // ESPN standings API
  const espnUrl = conference
    ? `https://site.api.espn.com/apis/v2/sports/basketball/mens-college-basketball/standings?group=${conference}`
    : 'https://site.api.espn.com/apis/v2/sports/basketball/mens-college-basketball/standings'

  const response = await fetch(espnUrl, {
    headers: {
      'User-Agent': 'BlazeSportsIntel/1.0',
      'Accept': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`ESPN API error: ${response.status}`)
  }

  const espnData = await response.json()

  // Transform to simplified structure
  const standings = espnData.children?.map(conf => ({
    conference: conf.name,
    teams: conf.standings?.entries?.map(entry => ({
      rank: entry.stats?.find(s => s.name === 'rank')?.value,
      team: {
        id: entry.team?.id,
        name: entry.team?.displayName,
        logo: entry.team?.logos?.[0]?.href
      },
      conferenceRecord: entry.stats?.find(s => s.name === 'vs. Conf.')?.displayValue || '0-0',
      overallRecord: entry.stats?.find(s => s.name === 'overall')?.displayValue || '0-0',
      gamesBack: entry.stats?.find(s => s.name === 'gamesBehind')?.displayValue || '-',
      streak: entry.stats?.find(s => s.name === 'streak')?.displayValue
    })) || []
  })) || []

  const data = {
    standings,
    meta: {
      dataSource: 'ESPN NCAA Basketball API',
      lastUpdated: new Date().toISOString()
    }
  }

  // Cache for 5 minutes
  if (env.CACHE) {
    await env.CACHE.put(cacheKey, JSON.stringify(data), { expirationTtl: 300 })
  }

  return data
}

/**
 * Get live/recent scores
 */
async function getScores(context) {
  const { request, env } = context
  const url = new URL(request.url)
  const date = url.searchParams.get('date') // YYYYMMDD format

  // Check cache (shorter TTL for live data)
  const cacheKey = `basketball:scores:${date || 'today'}`
  if (env.CACHE) {
    const cached = await env.CACHE.get(cacheKey, 'json')
    if (cached) return cached
  }

  // ESPN scoreboard API
  const espnUrl = date
    ? `https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard?dates=${date}`
    : 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard'

  const response = await fetch(espnUrl, {
    headers: {
      'User-Agent': 'BlazeSportsIntel/1.0',
      'Accept': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`ESPN API error: ${response.status}`)
  }

  const espnData = await response.json()

  // Transform to simplified structure
  const games = espnData.events?.map(event => ({
    id: event.id,
    name: event.name,
    date: event.date,
    status: {
      type: event.status?.type?.name,
      completed: event.status?.type?.completed,
      detail: event.status?.type?.detail,
      clock: event.status?.displayClock,
      period: event.status?.period
    },
    teams: event.competitions?.[0]?.competitors?.map(team => ({
      id: team.id,
      name: team.team?.displayName,
      abbreviation: team.team?.abbreviation,
      logo: team.team?.logos?.[0]?.href,
      score: team.score,
      homeAway: team.homeAway,
      winner: team.winner,
      rank: team.rank,
      record: team.records?.[0]?.summary
    })) || [],
    venue: event.competitions?.[0]?.venue?.fullName,
    broadcast: event.competitions?.[0]?.broadcasts?.[0]?.names?.[0]
  })) || []

  const data = {
    games,
    date: date || 'today',
    meta: {
      dataSource: 'ESPN NCAA Basketball API',
      lastUpdated: new Date().toISOString()
    }
  }

  // Cache for 1 minute for live data, 5 minutes for completed
  const allCompleted = games.every(g => g.status.completed)
  const ttl = allCompleted ? 300 : 60

  if (env.CACHE) {
    await env.CACHE.put(cacheKey, JSON.stringify(data), { expirationTtl: ttl })
  }

  return data
}

/**
 * Get player statistics
 */
async function getStats(context) {
  const { request, env } = context
  const url = new URL(request.url)
  const category = url.searchParams.get('category') || 'scoring'

  // Check cache
  const cacheKey = `basketball:stats:${category}`
  if (env.CACHE) {
    const cached = await env.CACHE.get(cacheKey, 'json')
    if (cached) return cached
  }

  // ESPN statistics API (leaders endpoint)
  const espnUrl = `https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/statistics`

  const response = await fetch(espnUrl, {
    headers: {
      'User-Agent': 'BlazeSportsIntel/1.0',
      'Accept': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`ESPN API error: ${response.status}`)
  }

  const espnData = await response.json()

  // Transform to simplified structure
  const leaders = espnData.leaders?.map(leader => ({
    category: leader.displayName,
    leaders: leader.leaders?.map(player => ({
      rank: player.rank,
      player: {
        id: player.athlete?.id,
        name: player.athlete?.displayName,
        team: player.athlete?.team?.name,
        teamLogo: player.athlete?.team?.logos?.[0]?.href
      },
      value: player.displayValue
    })) || []
  })) || []

  const data = {
    leaders,
    category,
    meta: {
      dataSource: 'ESPN NCAA Basketball API',
      lastUpdated: new Date().toISOString()
    }
  }

  // Cache for 5 minutes
  if (env.CACHE) {
    await env.CACHE.put(cacheKey, JSON.stringify(data), { expirationTtl: 300 })
  }

  return data
}
