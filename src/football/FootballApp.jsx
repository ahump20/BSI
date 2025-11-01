import { useState, useEffect } from 'react'
import SportSwitcher from '../components/SportSwitcher'
import CFBIntelligenceWidget from './CFBIntelligenceWidget'

function FootballApp() {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentWeek, setCurrentWeek] = useState('current')

  useEffect(() => {
    // Fetch live college football games from our API
    const fetchGames = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          `/api/football/scores?week=${currentWeek}`
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        setGames(data.games || [])
        setError(null)
      } catch (err) {
        console.error('Failed to fetch football games:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchGames()

    // Refresh every 30 seconds for live updates
    const interval = setInterval(fetchGames, 30000)
    return () => clearInterval(interval)
  }, [currentWeek])

  if (loading) {
    return (
      <div className="container">
        <header role="banner">
          <h1>🏈 College Football Live</h1>
          <p className="tagline">Real-time college football scores and updates</p>
        </header>
        <div className="loading" role="status" aria-live="polite" aria-label="Loading">
          <div className="spinner" aria-hidden="true"></div>
          <p>Loading live scores...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <header role="banner">
          <h1>🏈 College Football Live</h1>
        </header>
        <div className="error" role="alert" aria-live="assertive">
          <p>⚠️ Failed to load live data</p>
          <p className="error-detail">{error}</p>
          <p className="error-hint">
            Data source: ESPN College Football API
            <br />
            Status: Temporarily unavailable
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <header role="banner">
        <h1>🏈 College Football Live</h1>
        <p className="tagline">Real-time scores with comprehensive game data</p>
      </header>

      <main role="main">
        <section className="live-scores" aria-label="College Football Live Scores">
          <div className="section-header">
            <h2>Live Scores</h2>
            <div className="week-selector" role="group" aria-label="Week selection">
              <button
                className={currentWeek === 'current' ? 'active' : ''}
                onClick={() => setCurrentWeek('current')}
                aria-pressed={currentWeek === 'current'}
                aria-label="Show current week games"
              >
                Current Week
              </button>
            </div>
          </div>

          {games.length === 0 ? (
            <p className="no-games" role="status">No games currently in progress</p>
          ) : (
            <div className="games-grid" role="list" aria-live="polite" aria-label="Live football games">
              {games.map((game) => {
                const home = game.teams.home
                const away = game.teams.away
                const isLive = !game.status.completed

                return (
                  <article
                    key={game.id}
                    className="game-card football"
                    role="listitem"
                    aria-label={`${away.team.name} at ${home.team.name}, ${game.status.completed ? 'Final' : game.status.shortDetail || 'Live'}`}
                  >
                    <div className="game-status" role="status" aria-live={isLive ? 'polite' : 'off'}>
                      {game.status.completed ? 'Final' : game.status.shortDetail || 'Live'}
                    </div>

                    {/* Rankings */}
                    <div className="game-teams" role="group" aria-label="Game teams and scores">
                      <div className="team" role="group" aria-label={`Away team: ${away.team.name}`}>
                        <div className="team-info">
                          {away.rank && <span className="rank" aria-label={`Ranked number ${away.rank}`}>#{away.rank}</span>}
                          <span className="team-name">{away.team.name}</span>
                          <span className="team-record" aria-label={`Record: ${away.record}`}>{away.record}</span>
                        </div>
                        <span className="team-score" aria-label={`Score: ${away.score || '0'}`}>{away.score || '0'}</span>
                      </div>

                      <div className="team" role="group" aria-label={`Home team: ${home.team.name}`}>
                        <div className="team-info">
                          {home.rank && <span className="rank" aria-label={`Ranked number ${home.rank}`}>#{home.rank}</span>}
                          <span className="team-name">{home.team.name}</span>
                          <span className="team-record" aria-label={`Record: ${home.record}`}>{home.record}</span>
                        </div>
                        <span className="team-score" aria-label={`Score: ${home.score || '0'}`}>{home.score || '0'}</span>
                      </div>
                    </div>

                    <div className="game-meta" role="group" aria-label="Game information">
                      <span className="venue" aria-label={`Venue: ${game.venue?.name || 'TBD'}`}>
                        {game.venue?.name || 'TBD'}
                      </span>
                      {game.broadcast && (
                        <span className="broadcast" aria-label={`Broadcasting on ${game.broadcast}`}> • {game.broadcast}</span>
                      )}
                    </div>

                    {/* Betting odds if available */}
                    {game.odds && (
                      <div className="odds" aria-label={`Betting odds: Spread ${game.odds.spread}, Over/Under ${game.odds.overUnder}`}>
                        Spread: {game.odds.spread} • O/U: {game.odds.overUnder}
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </section>

        <CFBIntelligenceWidget />

        <footer className="data-source" role="contentinfo">
          <p>
            Data source: ESPN College Football API
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
      <SportSwitcher currentSport="football" />
    </div>
  )
}

export default FootballApp
