import { useEffect, useState } from 'react'
import SportSwitcher from './components/SportSwitcher'
import RealTimeFeedbackStudio from './components/RealTimeFeedbackStudio'

function App() {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeView, setActiveView] = useState('scores')

  useEffect(() => {
    if (activeView !== 'scores') {
      return undefined
    }

    let cancelled = false

    const fetchGames = async () => {
      try {
        if (!cancelled) {
          setLoading(true)
        }
        const response = await fetch(
          'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/scoreboard'
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        if (!cancelled) {
          setGames(data.events || [])
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to fetch games:', err)
          setError(err.message)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchGames()

    const interval = setInterval(fetchGames, 30000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [activeView])

  const renderScoreboard = () => {
    if (loading) {
      return (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading live scores...</p>
        </div>
      )
    }

    if (error) {
      return (
        <div className="error">
          <p>⚠️ Failed to load live data</p>
          <p className="error-detail">{error}</p>
          <p className="error-hint">
            Data source: ESPN College Baseball API
            <br />
            Status: Temporarily unavailable
          </p>
        </div>
      )
    }

    return (
      <>
        <section className="live-scores">
          <h2>Live Scores</h2>
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
            Last updated: {new Date().toLocaleString('en-US', {
              timeZone: 'America/Chicago',
              dateStyle: 'medium',
              timeStyle: 'short'
            })}
          </p>
        </footer>
      </>
    )
  }

  return (
    <div className="container">
      <header>
        <h1>⚾ College Baseball Live</h1>
        <p className="tagline">Real-time scores and AI delivery coaching for college baseball voices</p>
        <div className="view-toggle" role="tablist" aria-label="Primary view">
          <button
            type="button"
            role="tab"
            aria-selected={activeView === 'scores'}
            className={`view-toggle__button ${activeView === 'scores' ? 'active' : ''}`}
            onClick={() => setActiveView('scores')}
          >
            Scoreboard
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeView === 'feedback'}
            className={`view-toggle__button ${activeView === 'feedback' ? 'active' : ''}`}
            onClick={() => setActiveView('feedback')}
          >
            AI Feedback Studio
          </button>
        </div>
      </header>

      <main className={activeView === 'feedback' ? 'feedback-main' : ''}>
        {activeView === 'scores' ? renderScoreboard() : <RealTimeFeedbackStudio />}
      </main>

      {/* Sport Switcher FAB */}
      <SportSwitcher currentSport="baseball" />
    </div>
  )
}

export default App
