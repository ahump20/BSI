import { useEffect, useMemo, useRef, useState } from 'react'
import SportSwitcher from './components/SportSwitcher'
import GameCard from './components/GameCard'
import GameCardSkeleton from './components/GameCardSkeleton'
import './App.css'

const SCOREBOARD_ENDPOINT = 'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/scoreboard'
const REFRESH_INTERVAL_MS = 30_000

const DATE_TIME_FORMAT = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Chicago',
  dateStyle: 'medium',
  timeStyle: 'short'
})

const START_TIME_FORMAT = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Chicago',
  hour: 'numeric',
  minute: '2-digit'
})

const DAY_FORMAT = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Chicago',
  weekday: 'short'
})

function App() {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [lastUpdated, setLastUpdated] = useState(null)
  const hasLoadedOnce = useRef(false)

  useEffect(() => {
    let isMounted = true
    let controller = new AbortController()

    const fetchGames = async () => {
      if (!hasLoadedOnce.current) {
        setLoading(true)
      }

      controller.abort()
      controller = new AbortController()

      try {
        const response = await fetch(SCOREBOARD_ENDPOINT, {
          cache: 'no-store',
          signal: controller.signal,
          headers: { 'Cache-Control': 'no-store' }
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status} ${response.statusText}`)
        }

        const payload = await response.json()
        if (!isMounted) {
          return
        }

        const transformed = transformEvents(payload.events ?? [])
        setGames(transformed)
        setLastUpdated(new Date())
        setError(null)
        hasLoadedOnce.current = true
      } catch (err) {
        if (!isMounted) {
          return
        }

        if (err instanceof DOMException && err.name === 'AbortError') {
          return
        }

        console.error('Failed to fetch games:', err)
        setError(err instanceof Error ? err.message : 'Unable to load college baseball scores right now.')
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchGames()
    const interval = setInterval(fetchGames, REFRESH_INTERVAL_MS)

    return () => {
      isMounted = false
      controller.abort()
      clearInterval(interval)
    }
  }, [])

  const summary = useMemo(() => computeSummary(games), [games])
  const filteredGames = useMemo(() => filterGames(games, filter), [games, filter])
  const marqueeGame = useMemo(() => selectMarqueeGame(games), [games])
  const aggregateMetrics = useMemo(() => computeAggregateMetrics(games), [games])

  const filterOptions = useMemo(
    () => [
      { id: 'all', label: 'All Games', count: games.length },
      { id: 'live', label: 'Live', count: summary.live },
      { id: 'scheduled', label: 'Upcoming', count: summary.scheduled },
      { id: 'final', label: 'Final', count: summary.final }
    ],
    [games.length, summary.final, summary.live, summary.scheduled]
  )

  return (
    <div className="app-shell">
      <div className="app-surface" />

      <header className="hero" aria-label="College baseball live engine header">
        <div className="hero__badge">Diamond Insights · College Baseball</div>
        <h1 className="hero__title">Live Score Engine</h1>
        <p className="hero__subtitle">
          Mobile-first scoreboard with live win probability context, extra-inning tracking, and broadcast-ready visuals for D1 baseball.
        </p>

        <div className="hero__metrics" role="list">
          <MetricCard
            title="Live games"
            value={summary.live}
            detail="Refreshed every 30 seconds"
            tone="success"
          />
          <MetricCard
            title="Total runs today"
            value={aggregateMetrics.totalRuns}
            detail="Final + in-progress"
          />
          <MetricCard
            title="Avg margin"
            value={aggregateMetrics.avgMargin.toFixed(1)}
            detail="Runs per decided game"
          />
          <MetricCard
            title="Extra-inning games"
            value={aggregateMetrics.extraInnings}
            detail={
              aggregateMetrics.extraInnings === 0
                ? 'No extras yet'
                : aggregateMetrics.extraInnings === 1
                  ? '1 game beyond 9'
                  : `${aggregateMetrics.extraInnings} games beyond 9`
            }
          />
        </div>

        {marqueeGame && (
          <div className="hero__marquee" role="presentation">
            <div className="marquee__teams">
              <div className="marquee__team">
                <span className="marquee__team-rank">{formatRank(marqueeGame.away.rank)}</span>
                <span className="marquee__team-name">{marqueeGame.away.shortName}</span>
                <span className="marquee__team-score">{marqueeGame.away.score}</span>
              </div>
              <div className="marquee__divider">@</div>
              <div className="marquee__team">
                <span className="marquee__team-rank">{formatRank(marqueeGame.home.rank)}</span>
                <span className="marquee__team-name">{marqueeGame.home.shortName}</span>
                <span className="marquee__team-score">{marqueeGame.home.score}</span>
              </div>
            </div>
            <div className="marquee__meta">
              <span className={`status-pill status-pill--${marqueeGame.status.slug}`}>
                <span className="status-pill__dot" />
                {marqueeGame.status.label}
              </span>
              <span className="marquee__detail">{marqueeGame.status.context}</span>
              {marqueeGame.venue && <span className="marquee__detail">{marqueeGame.venue}</span>}
              {marqueeGame.status.slug === 'scheduled' && marqueeGame.startDisplay && (
                <span className="marquee__detail">First pitch {marqueeGame.startDisplay}</span>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="scoreboard" aria-live={summary.live > 0 ? 'polite' : 'off'}>
        <div className="scoreboard__toolbar">
          <div className="filter-chips" role="tablist" aria-label="Filter games by status">
            {filterOptions.map((option) => (
              <button
                key={option.id}
                role="tab"
                type="button"
                className={`filter-chip ${filter === option.id ? 'filter-chip--active' : ''}`}
                aria-selected={filter === option.id}
                onClick={() => setFilter(option.id)}
              >
                <span className="filter-chip__label">{option.label}</span>
                <span className="filter-chip__count">{option.count}</span>
              </button>
            ))}
          </div>

          <div className="toolbar-meta">
            <span className="toolbar-meta__item">
              Last updated {formatLastUpdated(lastUpdated)}
            </span>
            <span className="toolbar-meta__item">Source: ESPN College Baseball API</span>
          </div>
        </div>

        {error && (
          <div className="error-panel" role="alert">
            <strong>We lost the feed.</strong>
            <span>{error}</span>
            <span className="error-panel__hint">We will retry automatically. Scores resume once the data source recovers.</span>
          </div>
        )}

        {loading ? (
          <div className="games-grid" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, index) => (
              <GameCardSkeleton key={index} />
            ))}
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="empty-state" role="status">
            <h2>No games match this filter</h2>
            <p>Switch filters to view finals, live action, or upcoming first pitches.</p>
          </div>
        ) : (
          <div className="games-grid">
            {filteredGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        )}
      </main>

      <footer className="app-footer">
        <div className="app-footer__content">
          <span>Standard over vibes. Scores normalized to America/Chicago.</span>
          <span>Data refreshed every 30 seconds · Box scores sync nightly.</span>
        </div>
      </footer>

      <SportSwitcher currentSport="baseball" />
    </div>
  )
}

export default App

function MetricCard({ title, value, detail, tone = 'neutral' }) {
  return (
    <div className={`metric-card metric-card--${tone}`} role="listitem">
      <span className="metric-card__label">{title}</span>
      <span className="metric-card__value">{value}</span>
      <span className="metric-card__detail">{detail}</span>
    </div>
  )
}

function computeSummary(games) {
  return games.reduce(
    (acc, game) => {
      acc[game.status.slug] = (acc[game.status.slug] ?? 0) + 1
      return acc
    },
    { live: 0, scheduled: 0, final: 0 }
  )
}

function filterGames(games, filter) {
  if (filter === 'all') {
    return games
  }

  return games.filter((game) => game.status.slug === filter)
}

function selectMarqueeGame(games) {
  if (games.length === 0) {
    return null
  }

  const liveGame = games.find((game) => game.status.slug === 'live')
  if (liveGame) {
    return liveGame
  }

  const upcoming = games
    .filter((game) => game.status.slug === 'scheduled')
    .sort((a, b) => (a.startTime?.getTime() ?? Number.POSITIVE_INFINITY) - (b.startTime?.getTime() ?? Number.POSITIVE_INFINITY))
  if (upcoming.length > 0) {
    return upcoming[0]
  }

  return games[0]
}

function computeAggregateMetrics(games) {
  if (games.length === 0) {
    return { totalRuns: 0, avgMargin: 0, extraInnings: 0 }
  }

  const totals = games.reduce(
    (acc, game) => {
      const homeRuns = Number.isFinite(game.home.score) ? game.home.score : 0
      const awayRuns = Number.isFinite(game.away.score) ? game.away.score : 0
      const runs = homeRuns + awayRuns

      acc.totalRuns += runs

      if (game.status.slug !== 'scheduled') {
        acc.marginSamples += 1
        acc.totalMargin += Math.abs(homeRuns - awayRuns)
      }

      if (game.linescore.hasExtras) {
        acc.extraInnings += 1
      }

      return acc
    },
    { totalRuns: 0, totalMargin: 0, marginSamples: 0, extraInnings: 0 }
  )

  return {
    totalRuns: totals.totalRuns,
    avgMargin: totals.marginSamples > 0 ? totals.totalMargin / totals.marginSamples : 0,
    extraInnings: totals.extraInnings
  }
}

function transformEvents(events) {
  return events
    .map((event) => transformEvent(event))
    .filter(Boolean)
    .sort((a, b) => {
      const order = { live: 0, scheduled: 1, final: 2 }
      if (order[a.status.slug] !== order[b.status.slug]) {
        return order[a.status.slug] - order[b.status.slug]
      }

      if (a.status.slug === 'scheduled') {
        return (a.startTime?.getTime() ?? Number.POSITIVE_INFINITY) - (b.startTime?.getTime() ?? Number.POSITIVE_INFINITY)
      }

      if (a.status.slug === 'live') {
        const diff = Math.abs(a.home.score - a.away.score) - Math.abs(b.home.score - b.away.score)
        if (diff !== 0) {
          return diff
        }
      }

      return (b.startTime?.getTime() ?? 0) - (a.startTime?.getTime() ?? 0)
    })
}

function transformEvent(event) {
  const competition = event?.competitions?.[0]
  if (!competition) {
    return null
  }

  const startTime = event.date ? new Date(event.date) : null
  const statusInfo = getStatusInfo(competition.status?.type ?? event.status?.type, startTime)
  const away = normaliseTeam(competition.competitors?.find((comp) => comp.homeAway === 'away'))
  const home = normaliseTeam(competition.competitors?.find((comp) => comp.homeAway === 'home'))

  const inningCount = Math.max(away.linescores.length, home.linescores.length)
  const showLinescore = inningCount > 0 && statusInfo.slug !== 'scheduled'
  const innings = showLinescore ? Array.from({ length: inningCount }, (_, index) => index + 1) : []

  const situation = competition.situation ? normaliseSituation(competition.situation) : null
  const contextDetail = situation?.displayInning ?? statusInfo.detail

  const locationParts = [
    competition.venue?.fullName,
    competition.venue?.address?.city,
    competition.venue?.address?.state
  ].filter(Boolean)

  const weather = competition.weather?.displayValue ?? formatWeather(competition.weather)

  const note = competition.notes?.[0]?.headline ?? competition.notes?.[0]?.shortText ?? null
  const series = event.series?.summary ?? competition.series?.summary ?? null

  const leader = home.score === away.score ? null : home.score > away.score ? 'home' : 'away'

  return {
    id: event.id ?? competition.id ?? `${away.name}-${home.name}-${event.date}`,
    shortName: event.shortName ?? event.name,
    startTime,
    startDisplay: formatStartTime(startTime),
    status: {
      ...statusInfo,
      context: contextDetail
    },
    venue: locationParts.join(' • '),
    broadcast: formatBroadcasts(competition.broadcasts),
    weather,
    note,
    series,
    away,
    home,
    leader,
    linescore: {
      innings,
      away: showLinescore ? fillInnings(away.linescores, inningCount) : [],
      home: showLinescore ? fillInnings(home.linescores, inningCount) : [],
      hasExtras: inningCount > 9
    },
    totals: {
      away: { runs: away.score, hits: away.hits, errors: away.errors },
      home: { runs: home.score, hits: home.hits, errors: home.errors }
    },
    situation
  }
}

function normaliseTeam(entry) {
  if (!entry || !entry.team) {
    return {
      id: 'tbd',
      name: 'TBD',
      shortName: 'TBD',
      abbreviation: 'TBD',
      record: '—',
      score: 0,
      rank: null,
      logo: null,
      linescores: [],
      hits: null,
      errors: null
    }
  }

  const team = entry.team
  const stats = Array.isArray(entry.statistics) ? entry.statistics : []

  return {
    id: entry.id ?? team.id ?? team.abbreviation ?? team.displayName,
    name: team.displayName ?? team.shortDisplayName ?? team.abbreviation ?? 'TBD',
    shortName: team.shortDisplayName ?? team.displayName ?? team.abbreviation ?? 'TBD',
    abbreviation: team.abbreviation ?? team.shortDisplayName ?? team.displayName ?? 'TBD',
    record: entry.records?.find((record) => record.type === 'total')?.summary ?? entry.records?.[0]?.summary ?? '—',
    score: Number(entry.score ?? 0),
    rank: entry.curatedRank?.current ?? entry.rank ?? null,
    logo: team.logo ?? null,
    color: team.color ? `#${team.color}` : undefined,
    alternateColor: team.alternateColor ? `#${team.alternateColor}` : undefined,
    linescores: Array.isArray(entry.linescores) ? entry.linescores : [],
    hits: extractNumericStat(stats, ['hits', 'H']),
    errors: extractNumericStat(stats, ['errors', 'E', 'fieldingErrors'])
  }
}

function extractNumericStat(stats, names) {
  if (!stats || stats.length === 0) {
    return null
  }

  const lowerNames = names.map((name) => name.toLowerCase())
  const stat = stats.find((item) => {
    const candidates = [item.name, item.displayName, item.abbreviation]
      .map((value) => (typeof value === 'string' ? value.toLowerCase() : ''))
    return candidates.some((candidate) => lowerNames.includes(candidate))
  })

  if (!stat) {
    return null
  }

  const raw = stat.value ?? stat.displayValue ?? stat.text ?? stat.displayText
  const numeric = typeof raw === 'number' ? raw : Number(String(raw).replace(/[^0-9.-]/g, ''))
  return Number.isFinite(numeric) ? numeric : null
}

function fillInnings(linescores, length) {
  return Array.from({ length }, (_, index) => {
    const inning = linescores?.[index]
    if (!inning) {
      return '–'
    }

    const raw = inning.displayValue ?? inning.value ?? inning.runs
    if (raw === undefined || raw === null || raw === '') {
      return '–'
    }

    return String(raw)
  })
}

function normaliseSituation(situation) {
  return {
    balls: situation.balls ?? 0,
    strikes: situation.strikes ?? 0,
    outs: situation.outs ?? 0,
    displayInning: situation.displayInning ?? null,
    half: situation.inningHalf ?? (situation.isTopInning ? 'Top' : situation.isBottomInning ? 'Bot' : null),
    runners: {
      first: Boolean(situation.onFirst),
      second: Boolean(situation.onSecond),
      third: Boolean(situation.onThird)
    },
    lastPlay: situation.lastPlay?.text ?? situation.lastPlay?.shortText ?? situation.lastPlay?.description ?? null
  }
}

function getStatusInfo(statusType, startTime) {
  const state = (statusType?.state ?? '').toLowerCase()

  if (state === 'in') {
    return {
      slug: 'live',
      label: 'LIVE',
      detail: statusType?.shortDetail ?? statusType?.detail ?? 'Live'
    }
  }

  if (state === 'post' || statusType?.completed) {
    return {
      slug: 'final',
      label: 'FINAL',
      detail: statusType?.detail ?? 'Final'
    }
  }

  return {
    slug: 'scheduled',
    label: 'UP NEXT',
    detail: formatStartTime(startTime) ?? statusType?.detail ?? 'Scheduled'
  }
}

function formatBroadcasts(broadcasts) {
  if (!Array.isArray(broadcasts) || broadcasts.length === 0) {
    return null
  }

  const names = broadcasts
    .flatMap((broadcast) => broadcast?.names ?? broadcast?.markets ?? [])
    .map((value) => value?.toString().trim())
    .filter(Boolean)

  if (names.length === 0) {
    return null
  }

  const unique = Array.from(new Set(names))
  return unique.join(' • ')
}

function formatWeather(weather) {
  if (!weather) {
    return null
  }

  const pieces = [weather.temperature ? `${weather.temperature}°` : null, weather.displayValue]
    .filter(Boolean)
    .join(' · ')

  return pieces || null
}

function formatStartTime(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return null
  }

  return `${DAY_FORMAT.format(date)} · ${START_TIME_FORMAT.format(date)} CT`
}

function formatLastUpdated(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '—'
  }

  return DATE_TIME_FORMAT.format(date)
}

function formatRank(rank) {
  if (!rank || rank > 50) {
    return ''
  }

  return `#${rank}`
}
