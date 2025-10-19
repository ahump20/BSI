import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import SportSwitcher from './components/SportSwitcher'
import type { CollegeBaseballEvent, CollegeBaseballScoreboardResponse } from './types/sports'
import { recordIngestionFailure, recordIngestionSuccess } from './monitoring/ingestion'

const SCOREBOARD_ENDPOINT = 'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/scoreboard'

type FetchState = 'idle' | 'loading' | 'loaded' | 'error'

const App = (): JSX.Element => {
  const [games, setGames] = useState<CollegeBaseballEvent[]>([])
  const [status, setStatus] = useState<FetchState>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const fetchGames = async (): Promise<void> => {
      try {
        setStatus('loading')
        const response = await fetch(SCOREBOARD_ENDPOINT, {
          headers: {
            'Cache-Control': 'no-cache',
          },
        })

        if (!response.ok) {
          recordIngestionFailure(new Error(`HTTP ${response.status}`), {
            source: 'espn-college-baseball-scoreboard',
            endpoint: SCOREBOARD_ENDPOINT,
            status: response.status,
          })
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = (await response.json()) as CollegeBaseballScoreboardResponse
        const events = data.events ?? []

        if (!isMounted) {
          return
        }

        setGames(events)
        setError(null)
        setStatus('loaded')
        recordIngestionSuccess({
          source: 'espn-college-baseball-scoreboard',
          endpoint: SCOREBOARD_ENDPOINT,
          status: response.status,
          metadata: { eventCount: events.length },
        })
      } catch (err: unknown) {
        if (!isMounted) {
          return
        }

        const message = err instanceof Error ? err.message : 'Unknown error occurred'
        setError(message)
        setStatus('error')
        recordIngestionFailure(err, {
          source: 'espn-college-baseball-scoreboard',
          endpoint: SCOREBOARD_ENDPOINT,
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
  }, [])

  if (status === 'loading' || status === 'idle') {
    return (
      <div className="container" aria-live="polite">
        <header>
          <h1>⚾ College Baseball Live</h1>
          <p className="tagline">Real-time college baseball scores and updates</p>
        </header>
        <div className="loading" role="status" aria-label="Loading live college baseball scores">
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
          <h1>⚾ College Baseball Live</h1>
        </header>
        <div className="error" role="alert">
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
        <section className="live-scores" aria-labelledby="live-scores-heading">
          <h2 id="live-scores-heading">Live Scores</h2>
          {games.length === 0 ? (
            <p className="no-games">No games currently in progress</p>
          ) : (
            <div className="games-grid">
              {games.map((event) => {
                const competition = event.competitions?.[0]
                const homeTeam = competition?.competitors?.find((team) => team.homeAway === 'home')
                const awayTeam = competition?.competitors?.find((team) => team.homeAway === 'away')
                const statusDetail = competition?.status?.type?.detail ?? competition?.status?.type?.shortDetail
                const isFinal = Boolean(competition?.status?.type?.completed)

                return (
                  <article key={event.id} className="game-card" aria-label={`Game ${awayTeam?.team?.displayName ?? 'Away'} at ${homeTeam?.team?.displayName ?? 'Home'}`}>
                    <div className="game-status" aria-live="polite">
                      {isFinal ? 'Final' : statusDetail ?? 'Live'}
                    </div>

                    <div className="game-teams">
                      <div className="team">
                        <span className="team-name">{awayTeam?.team?.displayName ?? 'Away'}</span>
                        <span className="team-score" aria-label={`Away score ${awayTeam?.score ?? '0'}`}>
                          {awayTeam?.score ?? '0'}
                        </span>
                      </div>

                      <div className="team">
                        <span className="team-name">{homeTeam?.team?.displayName ?? 'Home'}</span>
                        <span className="team-score" aria-label={`Home score ${homeTeam?.score ?? '0'}`}>
                          {homeTeam?.score ?? '0'}
                        </span>
                      </div>
                    </div>

                    <div className="game-meta">
                      <span className="venue">{competition?.venue?.fullName ?? 'Venue TBA'}</span>
                    </div>
                  </article>
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
            {new Date().toLocaleString('en-US', {
              timeZone: 'America/Chicago',
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </p>
        </footer>
      </main>

      <SportSwitcher currentSport="baseball" />
    </div>
  )
}

export default App
