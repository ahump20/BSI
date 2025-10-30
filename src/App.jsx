import { useEffect, useMemo, useState } from 'react'
import SportSwitcher from './components/SportSwitcher'
import GameCard from './components/GameCard'
import BranchHighlights from './components/BranchHighlights'
import {
  groupGamesByBucket,
  mapEspnEventsToGames,
  sortGamesChronologically
} from './lib/espnScoreboard'

function App() {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  useEffect(() => {
    // Fetch live college baseball games from ESPN API
    let currentController
    let isMounted = true

    const fetchGames = async (showLoading = false) => {
      try {
        if (showLoading) {
          setLoading(true)
        }

        if (currentController) {
          currentController.abort()
        }

        currentController = new AbortController()

        const response = await fetch(
          'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/scoreboard',
          { signal: currentController.signal }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        if (!isMounted) {
          return
        }

        const mappedGames = sortGamesChronologically(mapEspnEventsToGames(data.events))
        setGames(mappedGames)
        setLastUpdated(new Date().toISOString())
        setError(null)
      } catch (err) {
        if (err.name === 'AbortError') {
          return
        }
        console.error('Failed to fetch games:', err)
        if (isMounted) {
          setError(err.message)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchGames(true)

    // Refresh every minute to respect live update TTL expectations
    const interval = setInterval(() => {
      fetchGames(false)
    }, 60000)

    return () => {
      isMounted = false
      if (currentController) {
        currentController.abort()
      }
      clearInterval(interval)
    }
  }, [])

  const scoreboardBuckets = useMemo(() => {
    const grouped = groupGamesByBucket(games)

    return {
      live: sortGamesChronologically(grouped.live),
      upcoming: sortGamesChronologically(grouped.upcoming),
      final: sortGamesChronologically(grouped.final)
    }
  }, [games])

  const lastUpdatedDisplay = useMemo(() => {
    if (!lastUpdated) {
      return null
    }

    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Chicago',
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(new Date(lastUpdated))
    } catch (err) {
      console.error('Failed to format last updated timestamp', err)
      return null
    }
  }, [lastUpdated])

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
          <h2>Scoreboard</h2>
          {games.length === 0 ? (
            <p className="no-games">No Division I games on the board right now.</p>
          ) : (
            <div className="scoreboard">
              {[
                { key: 'live', title: 'Live Right Now' },
                { key: 'upcoming', title: 'On Deck' },
                { key: 'final', title: 'Finals' }
              ].map((section) => {
                const bucketGames = scoreboardBuckets[section.key]

                if (!bucketGames || bucketGames.length === 0) {
                  return null
                }

                return (
                  <div key={section.key} className="scoreboard-section">
                    <h3>{section.title}</h3>
                    <div className="games-grid">
                      {bucketGames.map((game) => (
                        <GameCard key={game.id} game={game} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <BranchHighlights />

        <footer className="data-source">
          <p>
            Data source: ESPN College Baseball API
            <br />
            {lastUpdatedDisplay ? `Last updated: ${lastUpdatedDisplay}` : 'Awaiting data refresh'}
          </p>
        </footer>
      </main>

      {/* Sport Switcher FAB */}
      <SportSwitcher currentSport="baseball" />
    </div>
  )
}

export default App
