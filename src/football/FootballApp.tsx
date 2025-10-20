import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import SportSwitcher from '../components/SportSwitcher'
import type { FootballGame, FootballScoreApiResponse } from '../types/sports'
import { recordIngestionFailure, recordIngestionSuccess } from '../monitoring/ingestion'

const FOOTBALL_ENDPOINT = '/api/football/scores'

type FetchState = 'idle' | 'loading' | 'loaded' | 'error'

type WeekFilter = 'current'

const FootballApp = (): JSX.Element => {
  const [games, setGames] = useState<FootballGame[]>([])
  const [status, setStatus] = useState<FetchState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [currentWeek, setCurrentWeek] = useState<WeekFilter>('current')

  useEffect(() => {
    let isMounted = true

    const fetchGames = async (): Promise<void> => {
      try {
        setStatus('loading')
        const response = await fetch(`${FOOTBALL_ENDPOINT}?week=${currentWeek}`)

        if (!response.ok) {
          recordIngestionFailure(new Error(`HTTP ${response.status}`), {
            source: 'football-scores-api',
            endpoint: FOOTBALL_ENDPOINT,
            status: response.status,
            metadata: { week: currentWeek },
          })
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = (await response.json()) as FootballScoreApiResponse
        const gamesResponse = data.games ?? []

        if (!isMounted) {
          return
        }

        setGames(gamesResponse)
        setError(null)
        setStatus('loaded')
        recordIngestionSuccess({
          source: 'football-scores-api',
          endpoint: FOOTBALL_ENDPOINT,
          status: response.status,
          metadata: { week: currentWeek, gameCount: gamesResponse.length },
        })
      } catch (err: unknown) {
        if (!isMounted) {
          return
        }
        const message = err instanceof Error ? err.message : 'Unknown error occurred'
        setError(message)
        setStatus('error')
        recordIngestionFailure(err, {
          source: 'football-scores-api',
          endpoint: FOOTBALL_ENDPOINT,
          metadata: { week: currentWeek },
        })
      }
    }

    void fetchGames()

    const interval = window.setInterval(() => {
      void fetchGames()
    }, 30000)
    return () => {
      isMounted = false
      window.clearInterval(interval)
    }
  }, [currentWeek])

  if (status === 'loading' || status === 'idle') {
    return (
      <div className="container" aria-live="polite">
        <header>
          <h1>🏈 College Football Live</h1>
          <p className="tagline">Real-time college football scores and updates</p>
        </header>
        <div className="loading" role="status" aria-label="Loading live college football scores">
          <div className="spinner" aria-hidden="true"></div>
          <p>Loading live scores...</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="container" aria-live="assertive">
        <header>
          <h1>🏈 College Football Live</h1>
        </header>
        <div className="error" role="alert">
          <p>⚠️ Failed to load live data</p>
          <p className="error-detail">{error}</p>
          <p className="error-hint">
            Data source: Blaze Sports Intel API
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
        <h1>🏈 College Football Live</h1>
        <p className="tagline">Real-time scores with comprehensive game data</p>
      </header>

      <main>
        <section className="live-scores" aria-labelledby="football-live-scores">
          <div className="section-header">
            <h2 id="football-live-scores">Live Scores</h2>
            <div className="week-selector" role="radiogroup" aria-label="Select schedule week">
              <button
                className={currentWeek === 'current' ? 'active' : ''}
                onClick={() => setCurrentWeek('current')}
                type="button"
                role="radio"
                aria-checked={currentWeek === 'current'}
              >
                Current Week
              </button>
            </div>
          </div>

          {games.length === 0 ? (
            <p className="no-games">No games currently in progress</p>
          ) : (
            <div className="games-grid">
              {games.map((game) => {
                const home = game.teams.home
                const away = game.teams.away

                return (
                  <article key={game.id} className="game-card football" aria-label={`${away.team.name} at ${home.team.name}`}>
                    <div className="game-status" aria-live="polite">
                      {game.status.completed ? 'Final' : game.status.shortDetail ?? 'Live'}
                    </div>

                    <div className="game-teams">
                      <div className="team">
                        <div className="team-info">
                          {away.rank ? <span className="rank">#{away.rank}</span> : null}
                          <span className="team-name">{away.team.name}</span>
                          <span className="team-record">{away.record}</span>
                        </div>
                        <span className="team-score" aria-label={`Away score ${away.score ?? '0'}`}>
                          {away.score ?? '0'}
                        </span>
                      </div>

                      <div className="team">
                        <div className="team-info">
                          {home.rank ? <span className="rank">#{home.rank}</span> : null}
                          <span className="team-name">{home.team.name}</span>
                          <span className="team-record">{home.record}</span>
                        </div>
                        <span className="team-score" aria-label={`Home score ${home.score ?? '0'}`}>
                          {home.score ?? '0'}
                        </span>
                      </div>
                    </div>

                    <div className="game-meta">
                      <span className="venue">{game.venue?.name ?? 'Venue TBA'}</span>
                      {game.broadcast ? <span className="broadcast"> • {game.broadcast}</span> : null}
                    </div>

                    {game.odds ? (
                      <div className="odds">
                        Spread: {game.odds.spread} • O/U: {game.odds.overUnder}
                      </div>
                    ) : null}
                  </article>
                )
              })}
            </div>
          )}
        </section>

        <footer className="data-source">
          <p>
            Data source: Blaze Sports Intel API
            <br />
            Last updated:{' '}
            {new Date().toLocaleString('en-US', {
              timeZone: 'America/Chicago',
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </p>
        </footer>
      </main>

      <SportSwitcher currentSport="football" />
    </div>
  )
}

export default FootballApp
