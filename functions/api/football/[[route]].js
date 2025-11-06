/**
 * College Football API Endpoints
 *
 * Fetches real data from ESPN College Football API
 * No caching - direct fetch each time (like NBA API)
 */

import { rateLimit, rateLimitError, corsHeaders } from '../_utils.js';

export async function onRequest(context) {
  const { request, params, env } = context
  const route = params.route || []
  const endpoint = route[0] || 'scores'

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Rate limiting: 100 requests per minute per IP
  const limit = await rateLimit(env, request, 100, 60000);
  if (!limit.allowed) {
    return rateLimitError(limit.resetAt, limit.retryAfter);
  }

  try {
    let data

    switch (endpoint) {
      case 'scores':
        data = await fetchScores(request)
        break
      case 'teams':
        data = await fetchTeams(request)
        break
      case 'standings':
        data = await fetchStandings(request)
        break
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid endpoint' }),
          { status: 404, headers: corsHeaders }
        )
    }

    return new Response(JSON.stringify(data), {
      headers: corsHeaders,
      status: 200
    })
  } catch (error) {
    console.error('[FOOTBALL API] Error:', error)
    return new Response(JSON.stringify({
      error: 'Failed to fetch college football data',
      message: error.message || 'Unknown error',
      endpoint: endpoint
    }), {
      headers: corsHeaders,
      status: 500
    })
  }
}

async function fetchScores(request) {
  const url = new URL(request.url)
  const week = url.searchParams.get('week') || 'current'

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.espn.com/',
    'Origin': 'https://www.espn.com'
  }

  let scoresUrl = 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard'
  if (week !== 'current') scoresUrl += `?week=${week}`

  const response = await fetch(scoresUrl, { headers })

  if (!response.ok) {
    throw new Error(`ESPN API returned ${response.status}`)
  }

  const espnData = await response.json()

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

  return {
    success: true,
    games,
    week: espnData.week?.number || week,
    season: espnData.season?.year,
    meta: {
      timestamp: new Date().toISOString(),
      source: 'ESPN College Football API',
      version: '1.0',
      noFallbacks: true,
      allDataReal: true
    }
  }
}

async function fetchTeams(request) {
  const url = new URL(request.url)
  const conference = url.searchParams.get('conference')

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.espn.com/',
    'Origin': 'https://www.espn.com'
  }

  const teamsUrl = conference
    ? `https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams?group=${conference}`
    : 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams'

  const response = await fetch(teamsUrl, { headers })

  if (!response.ok) {
    throw new Error(`ESPN API returned ${response.status}`)
  }

  const espnData = await response.json()

  const teams = espnData.sports?.[0]?.leagues?.[0]?.teams?.map(t => ({
    id: t.team?.id,
    name: t.team?.displayName,
    abbreviation: t.team?.abbreviation,
    logo: t.team?.logos?.[0]?.href,
    conference: t.team?.groups?.[0]?.name,
    record: t.team?.record?.items?.[0]?.summary || '0-0'
  })) || []

  return {
    success: true,
    teams,
    conference: conference || 'All',
    meta: {
      timestamp: new Date().toISOString(),
      source: 'ESPN College Football API',
      version: '1.0'
    }
  }
}

async function fetchStandings(request) {
  const url = new URL(request.url)
  const conference = url.searchParams.get('conference')

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.espn.com/',
    'Origin': 'https://www.espn.com'
  }

  const standingsUrl = conference
    ? `https://site.api.espn.com/apis/v2/sports/football/college-football/standings?group=${conference}`
    : 'https://site.api.espn.com/apis/v2/sports/football/college-football/standings'

  const response = await fetch(standingsUrl, { headers })

  if (!response.ok) {
    throw new Error(`ESPN API returned ${response.status}`)
  }

  const espnData = await response.json()

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

  return {
    success: true,
    standings,
    meta: {
      timestamp: new Date().toISOString(),
      source: 'ESPN College Football API',
      version: '1.0'
    }
  }
}
