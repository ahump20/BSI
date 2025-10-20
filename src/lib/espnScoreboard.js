const ORDINAL_SUFFIXES = ['th', 'st', 'nd', 'rd']

const getOrdinalSuffix = (value) => {
  const modulo = value % 100
  if (modulo >= 11 && modulo <= 13) {
    return 'th'
  }
  const index = value % 10
  return ORDINAL_SUFFIXES[index] ?? 'th'
}

const formatInning = (period) => {
  if (typeof period !== 'number' || Number.isNaN(period) || period <= 0) {
    return null
  }
  return `${period}${getOrdinalSuffix(period)}`
}

const normalizeRecord = (records = []) => {
  const overall = records.find((record) => record.type === 'total')
  return overall?.summary ?? records[0]?.summary ?? null
}

const parseCompetitor = (competitor) => {
  if (!competitor) {
    return null
  }

  const { team = {}, linescores = [], statistics = [] } = competitor
  const hitsStat = statistics.find((stat) => stat.name === 'hits')
  const errorsStat = statistics.find((stat) => stat.name === 'errors')

  return {
    id: competitor.id,
    side: competitor.homeAway,
    displayName: team.displayName ?? team.name ?? 'Unknown',
    abbreviation: team.abbreviation ?? '',
    logo: team.logo ?? null,
    rank: competitor.rank ?? competitor.curatedRank?.current ?? null,
    record: normalizeRecord(competitor.records),
    score: Number.isFinite(Number(competitor.score)) ? Number(competitor.score) : null,
    linescore: linescores.map((line) => ({
      period: line.period,
      value: line.value
    })),
    hits: hitsStat?.value ?? null,
    errors: errorsStat?.value ?? null
  }
}

const deriveStatusBucket = (state) => {
  switch (state) {
    case 'in':
    case 'live':
      return 'live'
    case 'post':
      return 'final'
    default:
      return 'upcoming'
  }
}

export const mapEspnEventToGame = (event) => {
  if (!event) {
    return null
  }

  const competition = event.competitions?.[0]
  const status = competition?.status ?? event.status ?? {}
  const statusType = status.type ?? {}
  const broadcast = competition?.broadcasts?.[0]
  const situation = competition?.situation ?? {}
  const inning = formatInning(statusType.period ?? situation?.currentInning)

  const home = parseCompetitor(
    competition?.competitors?.find((competitor) => competitor.homeAway === 'home')
  )
  const away = parseCompetitor(
    competition?.competitors?.find((competitor) => competitor.homeAway === 'away')
  )

  return {
    id: event.id,
    name: event.name,
    bucket: deriveStatusBucket(statusType.state),
    detail: statusType.detail ?? statusType.shortDetail ?? 'TBD',
    shortDetail: statusType.shortDetail ?? null,
    startTime: competition?.date ?? event.date ?? null,
    venue: competition?.venue?.fullName ?? null,
    city: competition?.venue?.address?.city ?? null,
    state: competition?.venue?.address?.state ?? null,
    network: Array.isArray(broadcast?.names) ? broadcast.names.join(', ') : null,
    displayClock: status.displayClock ?? null,
    inning,
    balls: typeof situation?.balls === 'number' ? situation.balls : null,
    strikes: typeof situation?.strikes === 'number' ? situation.strikes : null,
    outs: typeof situation?.outs === 'number' ? situation.outs : null,
    home,
    away
  }
}

export const mapEspnEventsToGames = (events = []) =>
  events
    .map((event) => mapEspnEventToGame(event))
    .filter(Boolean)

export const groupGamesByBucket = (games = []) =>
  games.reduce(
    (acc, game) => {
      acc[game.bucket] = acc[game.bucket] ?? []
      acc[game.bucket].push(game)
      return acc
    },
    { live: [], upcoming: [], final: [] }
  )

export const sortGamesChronologically = (games = []) =>
  [...games].sort((a, b) => {
    const aTime = a.startTime ? Date.parse(a.startTime) : Number.MAX_SAFE_INTEGER
    const bTime = b.startTime ? Date.parse(b.startTime) : Number.MAX_SAFE_INTEGER

    return aTime - bTime
  })
