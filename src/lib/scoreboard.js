const CENTRAL_TIME_ZONE = 'America/Chicago'

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: CENTRAL_TIME_ZONE,
  hour: 'numeric',
  minute: '2-digit'
})

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: CENTRAL_TIME_ZONE,
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit'
})

const sortPriority = {
  in: 0,
  pre: 1,
  post: 2
}

const toNumberOrNull = (value) => {
  if (value === null || value === undefined) {
    return null
  }

  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

const extractCompetitor = (competitors = [], side, gameState) => {
  const competitor = competitors.find((team) => team.homeAway === side) || {}
  const team = competitor.team || {}
  const curatedRank = competitor.curatedRank || {}
  const rank = curatedRank.current ?? curatedRank.previous ?? team.rank ?? null
  const fallbackName = side === 'home' ? 'Home' : 'Away'

  return {
    id: competitor.id || team.id || team.uid || `${side}-${team.abbreviation || 'team'}`,
    name: team.displayName || team.shortDisplayName || team.nickname || fallbackName,
    abbreviation: team.abbreviation || team.shortDisplayName || null,
    record: competitor.records?.[0]?.summary || null,
    score: gameState === 'pre' ? null : toNumberOrNull(competitor.score),
    rank: typeof rank === 'number' && rank > 0 ? rank : null
  }
}

const formatStartTime = (date) => {
  if (!date) {
    return 'TBD'
  }

  return `${dateTimeFormatter.format(date)} CT`
}

const buildLiveContext = (statusType, situation = {}) => {
  const baseDetailText = statusType?.detail || statusType?.shortDetail || 'Live'
  const balls = situation?.balls ?? null
  const strikes = situation?.strikes ?? null
  const outs = situation?.outs ?? null

  const counts = []

  if (balls !== null && strikes !== null) {
    counts.push(`${balls}-${strikes}`)
  }

  if (outs !== null) {
    counts.push(`${outs} Out${outs === 1 ? '' : 's'}`)
  }

  const situationDetail = counts.length > 0 ? counts.join(' • ') : null

  if (situationDetail) {
    return `${baseDetailText} • ${situationDetail}`
  }

  return baseDetailText
}

const buildContextLabel = (state, statusType, situation, startTime) => {
  if (state === 'in') {
    return buildLiveContext(statusType, situation)
  }

  if (state === 'post') {
    return statusType?.detail || statusType?.shortDetail || 'Final'
  }

  return formatStartTime(startTime)
}

const buildSecondaryNote = (state, startTime, network) => {
  if (state === 'pre') {
    const pieces = []

    if (startTime) {
      pieces.push(`First pitch ${timeFormatter.format(startTime)} CT`)
    }

    if (network) {
      pieces.push(network)
    }

    return pieces.join(' • ')
  }

  return network || null
}

export const normalizeScoreboardEvents = (events = []) => {
  const normalized = events.map((event) => {
    const competition = event?.competitions?.[0] || {}
    const competitors = competition?.competitors || []
    const status = competition?.status || event?.status || {}
    const statusType = status?.type || {}
    const state = statusType?.state || 'pre'
    const startTime = event?.date ? new Date(event.date) : null
    const situation = competition?.situation || {}
    const broadcast = competition?.broadcasts?.[0] || null
    const network = broadcast?.shortName || broadcast?.names?.[0] || null

    const home = extractCompetitor(competitors, 'home', state)
    const away = extractCompetitor(competitors, 'away', state)

    return {
      id: event?.id || competition?.id || Math.random().toString(36).slice(2),
      state,
      statusLabel: statusType?.shortDetail || statusType?.detail || (state === 'post' ? 'Final' : state === 'in' ? 'Live' : 'Scheduled'),
      contextLabel: buildContextLabel(state, statusType, situation, startTime),
      secondaryNote: buildSecondaryNote(state, startTime, network),
      venue: competition?.venue?.fullName || 'TBD',
      startTime,
      network,
      home,
      away
    }
  })

  return normalized.sort((a, b) => {
    const stateDiff = (sortPriority[a.state] ?? 3) - (sortPriority[b.state] ?? 3)

    if (stateDiff !== 0) {
      return stateDiff
    }

    if (a.startTime && b.startTime) {
      return a.startTime - b.startTime
    }

    if (a.startTime) {
      return -1
    }

    if (b.startTime) {
      return 1
    }

    return a.id.localeCompare(b.id)
  })
}
