import { useState, useEffect, useMemo } from 'react'
import SportSwitcher from './components/SportSwitcher'

function App() {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    // Fetch live college baseball games from Cloudflare Worker proxying ESPN
    const fetchGames = async (withSpinner = false) => {
      try {
        if (withSpinner) {
          setLoading(true)
        }

        const response = await fetch('/api/games/live', {
          headers: {
            Accept: 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        if (!cancelled) {
          setGames(Array.isArray(data.games) ? data.games : [])
          setError(null)
        }
      } catch (err) {
        console.error('Failed to fetch games:', err)
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load live games')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchGames(true)

    // Refresh every 30 seconds for live updates
    const interval = setInterval(() => {
      fetchGames(false)
    }, 30000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const formattedGames = useMemo(() => games.map((game) => ({
    ...game,
    statusLabel: deriveStatusLabel(game),
    secondaryLabel: deriveSecondaryLabel(game),
  })), [games])

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

  return (
    <div className="container">
      <header>
        <h1>⚾ College Baseball Live</h1>
        <p className="tagline">Real-time scores with comprehensive game data</p>
      </header>

      <main>
        <section className="live-scores">
          <h2>Live Scores</h2>
          {formattedGames.length === 0 ? (
            <p className="no-games">No games currently in progress</p>
          ) : (
            <div className="games-grid">
              {formattedGames.map((game) => {
                const { awayTeam, homeTeam } = game
                return (
                  <div key={game.id} className="game-card">
                    <div className={`game-status game-status--${game.status}`}>
                      {game.statusLabel}
                    </div>

                    <div className="game-teams">
                      <div className="team">
                        <span className="team-name">{awayTeam?.name || 'Away'}</span>
                        <span className="team-score">{formatScore(awayTeam?.score)}</span>
                        {awayTeam?.record && (
                          <span className="team-record">{awayTeam.record}</span>
                        )}
                      </div>

                      <div className="team">
                        <span className="team-name">{homeTeam?.name || 'Home'}</span>
                        <span className="team-score">{formatScore(homeTeam?.score)}</span>
                        {homeTeam?.record && (
                          <span className="team-record">{homeTeam.record}</span>
                        )}
                      </div>
                    </div>

                    <div className="game-meta">
                      <span className="venue">{game.venue || 'Venue TBD'}</span>
                      {game.secondaryLabel && (
                        <span className="game-secondary">{game.secondaryLabel}</span>
                      )}
                      {game.status === 'live' && game.situation && (
                        <span className="game-situation">
                          {game.situation.runners}
                          {typeof game.situation.outs === 'number' && (
                            <> • {game.situation.outs} {game.situation.outs === 1 ? 'out' : 'outs'}</>
                          )}
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
            Data source: ESPN College Baseball API via Diamond Insights Cloudflare Worker
            <br />
            Last updated: {new Date().toLocaleString('en-US', {
              timeZone: 'America/Chicago',
              dateStyle: 'medium',
              timeStyle: 'short'
            })}
          </p>
        </footer>
      </main>

      {/* Sport Switcher FAB */}
      <SportSwitcher currentSport="baseball" />
    </div>
  )
}

export default App

function deriveStatusLabel(game) {
  if (!game) return 'Scheduled'

  switch (game.status) {
    case 'live':
      return game.statusText || formatInningLabel(game.inning) || 'Live'
    case 'final':
      return 'Final'
    case 'delayed':
      return game.statusText || 'Delayed'
    default:
      return game.scheduledTime ? `Starts ${game.scheduledTime}` : 'Scheduled'
  }
}

function deriveSecondaryLabel(game) {
  if (!game) return null

  if (game.status === 'scheduled') {
    return game.statusText || game.scheduledTime || null
  }

  if (game.status === 'live') {
    const inningLabel = formatInningLabel(game.inning)
    if (game.statusText && inningLabel && game.statusText !== inningLabel) {
      return `${inningLabel} • ${game.statusText}`
    }
    return game.statusText || inningLabel
  }

  return game.statusText || null
}

function formatInningLabel(inning) {
  if (!inning?.number) return null
  const half = inning.half ? `${inning.half} ` : ''
  return `${half}${toOrdinal(inning.number)}`
}

function toOrdinal(value) {
  if (typeof value !== 'number') return value
  const suffixes = ['th', 'st', 'nd', 'rd']
  const remainder = value % 100
  const suffix = suffixes[(remainder - 20) % 10] || suffixes[remainder] || suffixes[0]
  return `${value}${suffix}`
}

function formatScore(score) {
  if (score === null || score === undefined) return '0'
  return String(score)
}
