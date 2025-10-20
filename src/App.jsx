import { useState, useEffect } from 'react'
import SportSwitcher from './components/SportSwitcher'

function App() {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  useEffect(() => {
    let isMounted = true

    // Fetch live college baseball games from ESPN API
    const fetchGames = async ({ initial = false } = {}) => {
      try {
        if (initial) {
          setLoading(true)
        }

        const response = await fetch(
          'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/scoreboard'
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()

        if (!isMounted) {
          return
        }

        setGames(data.events || [])
        setError(null)
      } catch (err) {
        if (!isMounted) {
          return
        }

        console.error('Failed to fetch games:', err)
        setError(err.message)
      } finally {
        if (!isMounted) {
          return
        }

        setLastUpdated(new Date())

        if (initial) {
          setLoading(false)
        }
      }
    }

    fetchGames({ initial: true })

    // Refresh every 30 seconds for live updates
    const interval = setInterval(() => {
      fetchGames()
    }, 30000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

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

  if (error) {
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
        </div>
      </div>
    )
  }

  const sortedGames = [...games].sort((a, b) => {
    const firstDate = a?.date || a?.competitions?.[0]?.date
    const secondDate = b?.date || b?.competitions?.[0]?.date

    if (!firstDate && !secondDate) {
      return 0
    }

    if (!firstDate) {
      return 1
    }

    if (!secondDate) {
      return -1
    }

    return new Date(firstDate) - new Date(secondDate)
  })

  return (
    <div className="container">
      <header>
        <h1>⚾ College Baseball Live</h1>
        <p className="tagline">Real-time scores with comprehensive game data</p>
      </header>

      <main>
        <section className="live-scores">
          <h2>Live Scores</h2>
          {sortedGames.length === 0 ? (
            <p className="no-games">No games currently in progress</p>
          ) : (
            <div className="games-grid">
              {sortedGames.map((event) => {
                const competition = event.competitions?.[0]
                const homeTeam = competition?.competitors?.find(c => c.homeAway === 'home')
                const awayTeam = competition?.competitors?.find(c => c.homeAway === 'away')
                const status = competition?.status
                const competitionDate = competition?.date || event?.date
                const firstPitchTime = competitionDate ? new Date(competitionDate) : null
                const statusDetail = status?.type?.detail || status?.type?.shortDetail

                return (
                  <div key={event.id} className="game-card">
                    <div className="game-status">
                      {status?.type?.completed ? 'Final' : statusDetail || 'Live'}
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
                      {firstPitchTime && !status?.type?.completed && (
                        <span className="start-time">
                          {status?.type?.state === 'in'
                            ? statusDetail
                            : firstPitchTime.toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                timeZone: 'America/Chicago'
                              })}
                        </span>
                      )}
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
            Last updated:{' '}
            {lastUpdated
              ? lastUpdated.toLocaleString('en-US', {
                  timeZone: 'America/Chicago',
                  dateStyle: 'medium',
                  timeStyle: 'short'
                })
              : '—'}
          </p>
        </footer>
      </main>

      {/* Sport Switcher FAB */}
      <SportSwitcher currentSport="baseball" />
    </div>
  )
}

export default App
