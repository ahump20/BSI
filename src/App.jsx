import { useEffect, useRef, useState } from 'react'
import SportSwitcher from './components/SportSwitcher'

function App() {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const isFirstFetchRef = useRef(true)

  useEffect(() => {
    let isActive = true
    let controller = null

    const fetchGames = async () => {
      try {
        if (isFirstFetchRef.current) {
          setLoading(true)
        } else {
          setIsRefreshing(true)
        }

        if (controller) {
          controller.abort()
        }
        controller = new AbortController()

        const response = await fetch(
          'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/scoreboard',
          { signal: controller.signal }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        if (!isActive) return

        setGames(data.events || [])
        setError(null)
        setLastUpdated(new Date().toISOString())
      } catch (err) {
        if (!isActive || err.name === 'AbortError') {
          return
        }
        console.error('Failed to fetch games:', err)
        setError(err.message)
      } finally {
        if (!isActive) return

        if (isFirstFetchRef.current) {
          setLoading(false)
          isFirstFetchRef.current = false
        } else {
          setIsRefreshing(false)
        }
      }
    }

    fetchGames()

    const interval = setInterval(fetchGames, 30000)
    return () => {
      isActive = false
      if (controller) {
        controller.abort()
      }
      clearInterval(interval)
    }
  }, [])

  const formattedLastUpdated = lastUpdated
    ? new Date(lastUpdated).toLocaleString('en-US', {
        timeZone: 'America/Chicago',
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    : null

  if (loading) {
    return (
      <div className="container">
        <header>
          <h1>⚾ College Baseball Live</h1>
          <p className="tagline">Real-time college baseball scores and updates</p>
        </header>
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading live scores...</p>
        </div>
      </div>
    )
  }

  if (error && games.length === 0) {
    return (
      <div className="container">
        <header>
          <h1>⚾ College Baseball Live</h1>
        </header>
        <div className="error">
          <p>⚠️ Failed to load live data</p>
          <p className="error-detail">{error}</p>
          <p className="error-hint">
            Data source: ESPN College Baseball API
            <br />
            Status: Temporarily unavailable
          </p>
          {formattedLastUpdated && (
            <p className="error-last-update">
              Last successful update: {formattedLastUpdated}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <header>
        <h1>⚾ College Baseball Live</h1>
        <p className="tagline">Real-time scores with comprehensive game data</p>
      </header>

      <main>
        <section className="live-scores">
          <div className="section-header">
            <h2>Live Scores</h2>
            {isRefreshing && (
              <span className="refresh-indicator" role="status" aria-live="polite">
                Refreshing…
              </span>
            )}
          </div>
          {error && (
            <div className="inline-error" role="status" aria-live="polite">
              <strong>Live feed delayed.</strong> Showing last update from{' '}
              {formattedLastUpdated || '—'}.
            </div>
          )}
          {games.length === 0 ? (
            <p className="no-games">No games currently in progress</p>
          ) : (
            <div className="games-grid">
              {games.map((event) => {
                const competition = event.competitions?.[0]
                const homeTeam = competition?.competitors?.find(c => c.homeAway === 'home')
                const awayTeam = competition?.competitors?.find(c => c.homeAway === 'away')
                const status = competition?.status

                return (
                  <div key={event.id} className="game-card">
                    <div className="game-status">
                      {status?.type?.completed ? 'Final' : status?.type?.detail || 'Live'}
                    </div>

                    <div className="game-teams">
                      <div className="team">
                        <span className="team-name">{awayTeam?.team?.displayName || 'Away'}</span>
                        <span className="team-score">{awayTeam?.score || '0'}</span>
                      </div>

                      <div className="team">
                        <span className="team-name">{homeTeam?.team?.displayName || 'Home'}</span>
                        <span className="team-score">{homeTeam?.score || '0'}</span>
                      </div>
                    </div>

                    <div className="game-meta">
                      <span className="venue">
                        {competition?.venue?.fullName || 'TBD'}
                      </span>
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
            Last updated: {formattedLastUpdated || '—'}
          </p>
        </footer>
      </main>

      {/* Sport Switcher FAB */}
      <SportSwitcher currentSport="baseball" />
    </div>
  )
}

export default App
