import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import SportSwitcher from './components/SportSwitcher'
import { normalizeScoreboardEvents } from './lib/scoreboard'

const CENTRAL_DATE_TIME_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Chicago',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit'
})

function App() {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const activeRequestRef = useRef(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const fetchGames = useCallback(async ({ signal, skipLoading = false } = {}) => {
    if (!skipLoading && isMountedRef.current) {
      setLoading(true)
    }

    try {
      const response = await fetch(
        'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/scoreboard',
        { signal }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      if (signal?.aborted || !isMountedRef.current) {
        return
      }

      setGames(normalizeScoreboardEvents(data.events || []))
      setError(null)
      setLastUpdated(new Date())
    } catch (err) {
      if (err.name === 'AbortError') {
        return
      }

      console.error('Failed to fetch games:', err)
      if (!signal?.aborted && isMountedRef.current) {
        setError(err.message)
      }
    } finally {
      if (!skipLoading && isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    const startRequest = (skipLoading = false) => {
      if (activeRequestRef.current) {
        activeRequestRef.current.abort()
      }

      const controller = new AbortController()
      activeRequestRef.current = controller
      fetchGames({ signal: controller.signal, skipLoading }).catch((err) => {
        if (err && err.name !== 'AbortError') {
          console.error('Unhandled scoreboard fetch error:', err)
        }
      })
    }

    startRequest(false)

    // Refresh every 30 seconds for live updates
    const interval = setInterval(() => startRequest(true), 30000)

    return () => {
      clearInterval(interval)
      if (activeRequestRef.current) {
        activeRequestRef.current.abort()
      }
    }
  }, [fetchGames])

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)

    const controller = new AbortController()
    if (activeRequestRef.current) {
      activeRequestRef.current.abort()
    }

    activeRequestRef.current = controller

    fetchGames({ signal: controller.signal, skipLoading: true })
      .catch((err) => {
        if (err && err.name !== 'AbortError') {
          console.error('Manual refresh failed:', err)
        }
      })
      .finally(() => {
        if (isMountedRef.current) {
          setIsRefreshing(false)
        }
      })
  }, [fetchGames])

  const formattedLastUpdated = useMemo(() => {
    if (!lastUpdated) {
      return null
    }

    return `${CENTRAL_DATE_TIME_FORMATTER.format(lastUpdated)} CT`
  }, [lastUpdated])

  const isStale = useMemo(() => {
    if (!lastUpdated) {
      return false
    }

    return Date.now() - lastUpdated.getTime() > 60000
  }, [lastUpdated])

  const renderHeaderActions = useCallback((forceStale = false) => (
    <div className="header-actions">
      <button
        className="refresh-button"
        onClick={handleRefresh}
        disabled={loading || isRefreshing}
        type="button"
      >
        {isRefreshing ? 'Refreshing…' : 'Refresh'}
      </button>
      <span className={`last-updated ${forceStale || isStale ? 'stale' : ''}`} aria-live="polite">
        Updated {formattedLastUpdated || '—'}
      </span>
    </div>
  ), [formattedLastUpdated, handleRefresh, isRefreshing, isStale, loading])

  if (loading) {
    return (
      <div className="container">
        <header>
          <h1>⚾ College Baseball Live</h1>
          <p className="tagline">Real-time college baseball scores and updates</p>
          {renderHeaderActions()}
        </header>
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading live scores...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <header>
          <h1>⚾ College Baseball Live</h1>
          <p className="tagline">Real-time college baseball scores and updates</p>
          {renderHeaderActions(true)}
        </header>
        <div className="error">
          <p>⚠️ Failed to load live data</p>
          <p className="error-detail">{error}</p>
          <p className="error-hint">
            Data source: ESPN College Baseball API
            <br />
            Status: Temporarily unavailable
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <header>
        <h1>⚾ College Baseball Live</h1>
        <p className="tagline">Real-time scores with comprehensive game data</p>
        {renderHeaderActions()}
      </header>

      <main>
        <section className="live-scores">
          <h2>Live Scores</h2>
          {games.length === 0 ? (
            <p className="no-games">No games currently in progress</p>
          ) : (
            <div className="games-grid">
              {games.map((game) => {
                const teams = [game.away, game.home]

                return (
                  <div key={game.id} className={`game-card ${game.state === 'in' ? 'live' : ''}`}>
                    <div className={`game-status ${game.state}`}>
                      {game.statusLabel}
                    </div>

                    <div className="game-context">
                      <span className="context-primary">{game.contextLabel}</span>
                      {game.secondaryNote && (
                        <span className="game-note">{game.secondaryNote}</span>
                      )}
                    </div>

                    <div className="game-teams">
                      {teams.map((team, index) => {
                        const displayScore = typeof team.score === 'number' ? team.score : game.state === 'pre' ? '—' : '0'

                        return (
                          <div key={team.id || `${game.id}-${index}`} className="team">
                            <div className="team-info">
                              <div className="team-name-row">
                                {team.rank ? <span className="team-rank">#{team.rank}</span> : null}
                                <span className="team-name">{team.name}</span>
                              </div>
                              {team.record ? <span className="team-record">{team.record}</span> : null}
                            </div>
                            <span className="team-score">{displayScore}</span>
                          </div>
                        )
                      })}
                    </div>

                    <div className="game-meta">
                      <span className="venue">{game.venue}</span>
                      {game.network ? <span className="broadcast">{game.network}</span> : null}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <footer className="data-source">
          <p>
            Data source: ESPN College Baseball API
            <br />
            Last updated: {formattedLastUpdated || 'Awaiting latest data'}
          </p>
        </footer>
      </main>

      {/* Sport Switcher FAB */}
      <SportSwitcher currentSport="baseball" />
    </div>
  )
}

export default App
