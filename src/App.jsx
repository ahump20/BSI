import { useState, useEffect, useMemo } from 'react'
import SportSwitcher from './components/SportSwitcher'
import HyperScorecard from './components/HyperScorecard'

function App() {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Fetch live college baseball games from ESPN API
    const fetchGames = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/scoreboard'
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        setGames(data.events || [])
        setError(null)
      } catch (err) {
        console.error('Failed to fetch games:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchGames()

    // Refresh every 30 seconds for live updates
    const interval = setInterval(fetchGames, 30000)
    return () => clearInterval(interval)
  }, [])

  const categorizedGames = useMemo(() => {
    const buckets = {
      live: [],
      final: [],
      upcoming: [],
      other: []
    }

    games.forEach((event) => {
      const competition = event.competitions?.[0]
      const status = competition?.status
      const state = status?.type?.state

      if (status?.type?.completed) {
        buckets.final.push(event)
      } else if (state === 'in') {
        buckets.live.push(event)
      } else if (state === 'pre') {
        buckets.upcoming.push(event)
      } else {
        buckets.other.push(event)
      }
    })

    return buckets
  }, [games])

  const scoreboardInsights = useMemo(() => {
    if (!Array.isArray(games) || games.length === 0) {
      return {
        totalRuns: 0,
        totalGames: 0,
        extrasCount: 0,
        nailBiters: 0,
        walkoffWatch: 0,
        highlight: null
      }
    }

    let totalRuns = 0
    let extrasCount = 0
    let nailBiters = 0
    let walkoffWatch = 0
    let highlight = null

    games.forEach((event) => {
      const competition = event.competitions?.[0]
      if (!competition) return

      const homeTeam = competition.competitors?.find((c) => c.homeAway === 'home')
      const awayTeam = competition.competitors?.find((c) => c.homeAway === 'away')

      const homeScore = Number(homeTeam?.score ?? 0)
      const awayScore = Number(awayTeam?.score ?? 0)
      const runs = homeScore + awayScore
      totalRuns += runs

      const status = competition.status
      const situation = competition.situation
      const inning = Number(status?.period ?? situation?.inning ?? 0)
      const isLive = status?.type?.state === 'in'
      const detailText = (status?.type?.detail || '').toLowerCase()

      if (inning > 9 || detailText.includes('extra')) {
        extrasCount += 1
      }

      if (isLive && Math.abs(homeScore - awayScore) <= 1) {
        nailBiters += 1
      }

      const isBottomFrame = situation?.isTopInning === false
      const frameNumber = Number(situation?.inning ?? inning)
      if (isLive && isBottomFrame && (frameNumber >= 9 || detailText.includes('9th')) && homeScore <= awayScore) {
        walkoffWatch += 1
      }

      if (!highlight || runs > highlight.runs) {
        const awayName = awayTeam?.team?.shortDisplayName || awayTeam?.team?.displayName || 'Away'
        const homeName = homeTeam?.team?.shortDisplayName || homeTeam?.team?.displayName || 'Home'
        highlight = {
          runs,
          matchup: `${awayName} @ ${homeName}`,
          detail: status?.type?.shortDetail || status?.type?.detail || 'Pregame'
        }
      }
    })

    return {
      totalRuns,
      totalGames: games.length,
      extrasCount,
      nailBiters,
      walkoffWatch,
      highlight
    }
  }, [games])

  const lastUpdated = useMemo(() => {
    return new Date().toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      dateStyle: 'medium',
      timeStyle: 'short'
    })
  }, [games])

  const renderLoading = (message) => (
    <div className="state-shell">
      <div className="loading">
        <div className="spinner" aria-hidden="true"></div>
        <p>{message}</p>
      </div>
    </div>
  )

  const renderError = (details) => (
    <div className="state-shell">
      <div className="error" role="alert">
        <h2>⚠️ Failed to load live data</h2>
        <p className="error-detail">{details}</p>
        <p className="error-hint">
          Data source: ESPN College Baseball API
          <br />
          Status: Temporarily unavailable
        </p>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="container">
        <header>
          <div className="header-content">
            <div className="title-block">
              <p className="kicker">Diamond Matrix // Blaze Sports Intel</p>
              <h1>College Baseball Signal Wall</h1>
            </div>
            <p className="tagline">Mobile-first, dark-mode war room translating live pitch data into clear marching orders.</p>
          </div>
        </header>
        {renderLoading('Pulling the latest scores...')}
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <header>
          <div className="header-content">
            <div className="title-block">
              <p className="kicker">Diamond Matrix // Blaze Sports Intel</p>
              <h1>College Baseball Signal Wall</h1>
            </div>
            <p className="tagline">Mobile-first, dark-mode war room translating live pitch data into clear marching orders.</p>
          </div>
        </header>
        {renderError(error)}
      </div>
    )
  }

  return (
    <div className="container">
      <header>
        <div className="header-content">
          <div className="title-block">
            <p className="kicker">Diamond Matrix // Blaze Sports Intel</p>
            <h1>College Baseball Signal Wall</h1>
          </div>
          <p className="tagline">Mobile-first, dark-mode war room translating live pitch data into clear marching orders.</p>
        </div>
        <div className="header-metrics" role="status" aria-live="polite">
          <div className="metric">
            <span className="metric-value">{categorizedGames.live.length}</span>
            <span className="metric-label">Live</span>
          </div>
          <div className="metric">
            <span className="metric-value">{categorizedGames.final.length}</span>
            <span className="metric-label">Final</span>
          </div>
          <div className="metric">
            <span className="metric-value">{categorizedGames.upcoming.length}</span>
            <span className="metric-label">Upcoming</span>
          </div>
        </div>
        <div className="insight-grid">
          <div className="insight-card">
            <span className="insight-label">Total Runs Logged</span>
            <span className="insight-value">{scoreboardInsights.totalRuns}</span>
            <span className="insight-caption">Across {scoreboardInsights.totalGames} tracked games</span>
          </div>
          <div className="insight-card">
            <span className="insight-label">Live Nail-Biters</span>
            <span className="insight-value">{scoreboardInsights.nailBiters}</span>
            <span className="insight-caption">≤ 1 run margin right now</span>
          </div>
          <div className="insight-card">
            <span className="insight-label">Walkoff Watch</span>
            <span className="insight-value">{scoreboardInsights.walkoffWatch}</span>
            <span className="insight-caption">Bottom-frame chaos brewing</span>
          </div>
          <div className="insight-card highlight">
            <span className="insight-label">Highest Octane Game</span>
            <span className="insight-value">{scoreboardInsights.highlight?.runs ?? 0}</span>
            <span className="insight-caption">{scoreboardInsights.highlight?.matchup || 'Awaiting first pitch'}</span>
            <span className="insight-detail">{scoreboardInsights.highlight?.detail || '—'}</span>
          </div>
        </div>
      </header>

      <main>
        <section className="live-scores">
          <div className="section-header">
            <div>
              <h2>Signal Streams</h2>
              <p className="section-subtitle">Streaming college baseball telemetry with 60-second refresh loops and real-time base-state visuals.</p>
            </div>
            <div className="legend">
              <span className="legend-item">
                <span className="legend-swatch live" aria-hidden="true"></span>Live
              </span>
              <span className="legend-item">
                <span className="legend-swatch final" aria-hidden="true"></span>Final
              </span>
              <span className="legend-item">
                <span className="legend-swatch upcoming" aria-hidden="true"></span>Upcoming
              </span>
            </div>
          </div>

          {games.length === 0 ? (
            <p className="no-games">No games currently in progress</p>
          ) : (
            <div className="games-grid" role="list">
              {games.map((event) => (
                <HyperScorecard key={event.id} event={event} />
              ))}
            </div>
          )}
        </section>

        <footer className="data-source">
          <p>
            Data source: ESPN College Baseball API
            <br />
            Last updated: {lastUpdated}
          </p>
        </footer>
      </main>

      <SportSwitcher currentSport="baseball" />
    </div>
  )
}

export default App
