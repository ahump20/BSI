import { useEffect, useMemo, useState } from 'react'
import SportSwitcher from './components/SportSwitcher'

const STATUS_FILTERS = [
  { id: 'all', label: 'All games' },
  { id: 'live', label: 'Live now' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'final', label: 'Final' }
]

function App() {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('live')
  const [rankedOnly, setRankedOnly] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)

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
        setLastUpdated(new Date())
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

  const enhancedGames = useMemo(() => {
    const toNumber = (value) => {
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : 0
    }

    return games.map((event) => {
      const competition = event.competitions?.[0] || {}
      const status = competition.status || event.status || {}
      const homeTeam = competition.competitors?.find((c) => c.homeAway === 'home') || {}
      const awayTeam = competition.competitors?.find((c) => c.homeAway === 'away') || {}

      const startDate = competition.date ? new Date(competition.date) : null
      const state = status?.type?.state
      const isLive = state === 'in'
      const isFinal = Boolean(status?.type?.completed)
      const gameState = isLive ? 'live' : isFinal ? 'final' : 'upcoming'

      const getRank = (team) => {
        const curatedRank = team?.curatedRank?.current
        const altRank = team?.curatedRank?.rank || team?.curatedRank?.default
        const fallbackRank = team?.team?.rank
        return curatedRank ?? altRank ?? fallbackRank ?? null
      }

      const homeRank = getRank(homeTeam)
      const awayRank = getRank(awayTeam)
      const isRanked = [homeRank, awayRank].some((rank) => Number(rank) && Number(rank) <= 25)

      const homeScore = toNumber(homeTeam?.score)
      const awayScore = toNumber(awayTeam?.score)
      const scoreMargin = Math.abs(homeScore - awayScore)
      const inningNumber = toNumber(status?.period) || 0
      const baseRunners = competition?.situation?.onBase?.occupied?.length || 0
      const outs = toNumber(competition?.situation?.outs)

      let momentumPulse = null
      if (isLive) {
        const rawPulse = 6 - scoreMargin * 1.25 + inningNumber * 0.35 + baseRunners - outs * 0.3
        momentumPulse = Math.max(2, Math.min(10, Number(rawPulse.toFixed(1))))
      }

      const statusText =
        status?.type?.shortDetail || status?.type?.detail || status?.displayClock || 'Scheduled'

      const lastPlay = competition?.situation?.lastPlay?.text || competition?.details?.[0]?.text

      return {
        id: event.id,
        gameState,
        statusText,
        isRanked,
        homeTeam: {
          name: homeTeam?.team?.displayName || 'Home',
          abbreviation: homeTeam?.team?.abbreviation,
          score: homeScore,
          record: homeTeam?.records?.[0]?.summary,
          rank: homeRank
        },
        awayTeam: {
          name: awayTeam?.team?.displayName || 'Away',
          abbreviation: awayTeam?.team?.abbreviation,
          score: awayScore,
          record: awayTeam?.records?.[0]?.summary,
          rank: awayRank
        },
        venue: competition?.venue?.fullName || 'Venue TBA',
        startDate,
        momentumPulse,
        lastPlay,
        conferenceName: competition?.conference?.name || event?.group?.name,
        neutralSite: Boolean(competition?.venue?.indoor)
      }
    })
  }, [games])

  const filteredGames = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return enhancedGames
      .filter((game) => {
        if (statusFilter !== 'all' && game.gameState !== statusFilter) {
          return false
        }

        if (rankedOnly && !game.isRanked) {
          return false
        }

        if (query) {
          const haystack = [
            game.homeTeam.name,
            game.homeTeam.abbreviation,
            game.awayTeam.name,
            game.awayTeam.abbreviation,
            game.conferenceName
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()

          return haystack.includes(query)
        }

        return true
      })
      .sort((a, b) => {
        const order = { live: 0, upcoming: 1, final: 2 }
        if (a.gameState !== b.gameState) {
          return order[a.gameState] - order[b.gameState]
        }

        if (a.startDate && b.startDate) {
          return a.startDate - b.startDate
        }

        return a.homeTeam.name.localeCompare(b.homeTeam.name)
      })
  }, [enhancedGames, rankedOnly, searchTerm, statusFilter])

  const renderedTimestamp = lastUpdated
    ? lastUpdated.toLocaleString('en-US', {
        timeZone: 'America/Chicago',
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    : new Date().toLocaleString('en-US', {
        timeZone: 'America/Chicago',
        dateStyle: 'medium',
        timeStyle: 'short'
      })

  return (
    <div className="container">
      <header>
        <h1>⚾ College Baseball Live</h1>
        <p className="tagline">Real-time scores with comprehensive game data</p>
      </header>

      <main>
        <section className="live-scores">
          <div className="section-heading">
            <h2>Live Scores</h2>
            <p className="section-subtitle">
              Dial into every D1 matchup, filter for Top 25, and track the hottest leverage moments.
            </p>
          </div>

          <div className="score-controls" aria-label="Scoreboard filters">
            <div className="filter-group" role="tablist">
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  className={`filter-chip ${statusFilter === filter.id ? 'active' : ''}`}
                  onClick={() => setStatusFilter(filter.id)}
                  type="button"
                  role="tab"
                  aria-selected={statusFilter === filter.id}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="control-row">
              <label className="toggle" htmlFor="top25-toggle">
                <input
                  id="top25-toggle"
                  type="checkbox"
                  checked={rankedOnly}
                  onChange={(event) => setRankedOnly(event.target.checked)}
                />
                <span>Top 25 spotlight</span>
              </label>

              <input
                type="search"
                className="search-field"
                placeholder="Search teams or conferences"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                aria-label="Search teams"
              />
            </div>
          </div>

          {filteredGames.length === 0 ? (
            <p className="no-games">No games match the current filters</p>
          ) : (
            <div className="games-grid">
              {filteredGames.map((game) => (
                <article key={game.id} className="game-card" aria-label={`${game.awayTeam.name} at ${game.homeTeam.name}`}>
                  <header className="game-card-header">
                    <span className={`status-chip ${game.gameState}`}>{game.statusText}</span>
                    {game.isRanked && <span className="rank-badge">Top 25 clash</span>}
                  </header>

                  <div className="game-teams">
                    <div className="team">
                      <div className="team-label">
                        {game.awayTeam.rank && <span className="team-rank">#{game.awayTeam.rank}</span>}
                        <span className="team-name">{game.awayTeam.name}</span>
                      </div>
                      <div className="team-score-block">
                        <span className="team-score">{game.awayTeam.score}</span>
                        {game.awayTeam.record && <span className="team-record">{game.awayTeam.record}</span>}
                      </div>
                    </div>

                    <div className="team">
                      <div className="team-label">
                        {game.homeTeam.rank && <span className="team-rank">#{game.homeTeam.rank}</span>}
                        <span className="team-name">{game.homeTeam.name}</span>
                      </div>
                      <div className="team-score-block">
                        <span className="team-score">{game.homeTeam.score}</span>
                        {game.homeTeam.record && <span className="team-record">{game.homeTeam.record}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="game-meta">
                    <div className="meta-line">
                      <span className="meta-label">Venue</span>
                      <span className="meta-value">{game.venue}</span>
                    </div>
                    {game.conferenceName && (
                      <div className="meta-line">
                        <span className="meta-label">Conference</span>
                        <span className="meta-value">{game.conferenceName}</span>
                      </div>
                    )}
                    {game.startDate && (
                      <div className="meta-line">
                        <span className="meta-label">First pitch</span>
                        <span className="meta-value">
                          {game.startDate.toLocaleTimeString('en-US', {
                            timeZone: 'America/Chicago',
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    )}
                    {game.lastPlay && game.gameState === 'live' && (
                      <div className="meta-line">
                        <span className="meta-label">Last play</span>
                        <span className="meta-value meta-value--wrap">{game.lastPlay}</span>
                      </div>
                    )}
                  </div>

                  {game.momentumPulse && (
                    <div className="pulse">
                      <div className="pulse-header">
                        <span className="meta-label">Momentum pulse</span>
                        <span className="pulse-value">{game.momentumPulse}/10</span>
                      </div>
                      <div className="pulse-meter" role="presentation">
                        <span
                          className="pulse-fill"
                          style={{ width: `${(game.momentumPulse / 10) * 100}%` }}
                        ></span>
                      </div>
                      <p className="pulse-copy">
                        Tight margin + base traffic = high leverage. Stay locked in.
                      </p>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="upgrade-highlights">
          <h3>Branch upgrades</h3>
          <ul>
            <li>
              <strong>Momentum pulse</strong> quantifies leverage in real time so you never miss a
              turning point.
            </li>
            <li>
              <strong>Top 25 spotlight</strong> filters the board to ranked heavyweight tilts in one
              tap.
            </li>
            <li>
              <strong>Smart search</strong> locks onto programs or conferences instantly—no scroll
              marathon.
            </li>
          </ul>
        </section>

        <footer className="data-source">
          <p>
            Data source: ESPN College Baseball API
            <br />
            Last updated: {renderedTimestamp}
          </p>
        </footer>
      </main>

      {/* Sport Switcher FAB */}
      <SportSwitcher currentSport="baseball" />
    </div>
  )
}

export default App
