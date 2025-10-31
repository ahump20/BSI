import { useState, useEffect } from 'react'
import SportSwitcher from './components/SportSwitcher'
import './App.css'
import {
  fetchLiveGames,
  fetchConferenceStandings,
  fetchHistoricalOverview,
  fetchDiamondInsightsSnapshot
} from './services/collegeBaseballApi'

const NAV_ITEMS = [
  { id: 'scores', label: 'Scores', icon: '📡' },
  { id: 'standings', label: 'Standings', icon: '🏆' },
  { id: 'insights', label: 'Insights', icon: '🧠' }
]

const CONFERENCES = [
  { value: 'SEC', label: 'SEC' },
  { value: 'ACC', label: 'ACC' },
  { value: 'Big12', label: 'Big 12' },
  { value: 'Big Ten', label: 'Big Ten' },
  { value: 'Pac-12', label: 'Pac-12' },
  { value: 'American', label: 'American' },
  { value: 'SunBelt', label: 'Sun Belt' },
  { value: 'CAA', label: 'CAA' }
]

const SEASONS = Array.from({ length: 6 }, (_, idx) => new Date().getFullYear() - idx)

function App() {
  const [activeTab, setActiveTab] = useState('scores')
  const [conference, setConference] = useState('SEC')
  const [season, setSeason] = useState(SEASONS[0])

  const [gamesState, setGamesState] = useState({
    data: [],
    loading: true,
    error: null,
    meta: null
  })

  const [standingsState, setStandingsState] = useState({
    data: [],
    loading: true,
    error: null,
    meta: null
  })

  const [historicalState, setHistoricalState] = useState({
    topTeams: [],
    battingLeaders: [],
    loading: true,
    error: null,
    meta: null
  })

  const [insightsState, setInsightsState] = useState({
    data: null,
    loading: true,
    error: null
  })

  // Live games refresh loop (45s cadence to align with ingest worker TTL)
  useEffect(() => {
    let cancelled = false

    const loadGames = async ({ withSpinner } = { withSpinner: false }) => {
      if (withSpinner) {
        setGamesState((prev) => ({ ...prev, loading: true, error: null }))
      }

      try {
        const result = await fetchLiveGames()
        if (cancelled) return

        setGamesState({
          data: result.games,
          meta: result.meta,
          loading: false,
          error: null
        })
      } catch (error) {
        console.error('[App] Failed to load games', error)
        if (cancelled) return
        setGamesState((prev) => ({
          ...prev,
          loading: false,
          error: error.message || 'Unable to load live games'
        }))
      }
    }

    loadGames({ withSpinner: true })
    const interval = setInterval(() => loadGames(), 45000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  // Conference standings refresh whenever conference changes
  useEffect(() => {
    let cancelled = false

    const loadStandings = async () => {
      setStandingsState((prev) => ({ ...prev, loading: true, error: null }))

      try {
        const result = await fetchConferenceStandings({ conference })
        if (cancelled) return

        setStandingsState({
          data: result.standings,
          meta: result.meta,
          loading: false,
          error: null
        })
      } catch (error) {
        console.error('[App] Failed to load standings', error)
        if (cancelled) return
        setStandingsState((prev) => ({
          ...prev,
          loading: false,
          error: error.message || 'Unable to load standings'
        }))
      }
    }

    loadStandings()
    const interval = setInterval(loadStandings, 15 * 60 * 1000) // 15 minutes cadence

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [conference])

  // Historical overview refresh when season changes
  useEffect(() => {
    let cancelled = false

    const loadHistorical = async () => {
      setHistoricalState((prev) => ({ ...prev, loading: true, error: null }))

      try {
        const result = await fetchHistoricalOverview({ season })
        if (cancelled) return

        setHistoricalState({
          topTeams: result.topTeams,
          battingLeaders: result.battingLeaders,
          meta: result.meta,
          loading: false,
          error: null
        })
      } catch (error) {
        console.error('[App] Failed to load historical data', error)
        if (cancelled) return
        setHistoricalState((prev) => ({
          ...prev,
          loading: false,
          error: error.message || 'Unable to load historical data'
        }))
      }
    }

    loadHistorical()

    return () => {
      cancelled = true
    }
  }, [season])

  // Diamond insights snapshot (optional) – refresh hourly
  useEffect(() => {
    let cancelled = false

    const loadInsights = async () => {
      try {
        const data = await fetchDiamondInsightsSnapshot()
        if (cancelled) return
        setInsightsState({ data, loading: false, error: null })
      } catch (error) {
        console.error('[App] Failed to load insights', error)
        if (cancelled) return
        setInsightsState({ data: null, loading: false, error: error.message || 'Unable to load insights' })
      }
    }

    loadInsights()
    const interval = setInterval(loadInsights, 60 * 60 * 1000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const renderScores = () => {
    if (gamesState.loading) {
      return (
        <div className="panel">
          <div className="loading-state">
            <div className="spinner" />
            <p className="muted">Pulling live scoreboard…</p>
          </div>
        </div>
      )
    }

    if (gamesState.error) {
      return (
        <div className="panel error-panel">
          <h2>Scoreboard unavailable</h2>
          <p className="muted">{gamesState.error}</p>
          <p className="muted">Our edge cache will retry automatically.</p>
        </div>
      )
    }

    if (!gamesState.data.length) {
      return (
        <div className="panel empty-panel">
          <h2>No games live</h2>
          <p className="muted">We refresh every 45 seconds. Check back soon.</p>
        </div>
      )
    }

    return (
      <div className="panel">
        <div className="panel-header">
          <div>
            <h2>Live + Final Scores</h2>
            <p className="muted">Direct from our ingest worker with provider failover.</p>
          </div>
          {gamesState.meta?.timestamp && (
            <div className="timestamp-chip">
              Updated {formatTimestamp(gamesState.meta.timestamp)}
            </div>
          )}
        </div>
        <div className="games-grid">
          {gamesState.data.map((game) => {
            const statusLabel = formatStatus(game.status, game.situation)
            const statusClass = getStatusClass(game.status)

            return (
              <article key={game.id ?? game.uid} className="game-card">
                <header className="game-card-header">
                  <span className={statusClass}>{statusLabel}</span>
                  {game.tv && <span className="tv">{game.tv}</span>}
                </header>
                <div className="team-row">
                  <span className="team-name">{game.awayTeam?.name ?? game.awayTeam?.displayName ?? 'Away'}</span>
                  <span className="team-score">{valueOrDash(game.awayTeam?.score)}</span>
                </div>
                <div className="team-row">
                  <span className="team-name">{game.homeTeam?.name ?? game.homeTeam?.displayName ?? 'Home'}</span>
                  <span className="team-score">{valueOrDash(game.homeTeam?.score)}</span>
                </div>
                <footer className="game-meta">
                  {game.situation && <span>{game.situation}</span>}
                  <span>{game.venue ?? 'Venue TBA'}</span>
                  <span className="muted">{formatGameDate(game.date, game.time)}</span>
                </footer>
              </article>
            )
          })}
        </div>
      </div>
    )
  }

  const renderStandings = () => {
    return (
      <div className="panel">
        <div className="panel-header">
          <div>
            <h2>{conference} Standings</h2>
            <p className="muted">Conference table with win%, RPI, and streak context.</p>
          </div>
          <div className="panel-controls">
            <label className="sr-only" htmlFor="conference-select">Conference</label>
            <select
              id="conference-select"
              className="control-select"
              value={conference}
              onChange={(event) => setConference(event.target.value)}
            >
              {CONFERENCES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {standingsState.loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p className="muted">Syncing conference table…</p>
          </div>
        ) : standingsState.error ? (
          <div className="error-panel">
            <h3>Standings unavailable</h3>
            <p className="muted">{standingsState.error}</p>
          </div>
        ) : (
          <div className="standings-table" role="table">
            <div className="standings-header" role="row">
              <span role="columnheader">#</span>
              <span role="columnheader">Team</span>
              <span role="columnheader">Conf</span>
              <span role="columnheader">Overall</span>
              <span role="columnheader">Streak</span>
            </div>
            {standingsState.data.map((team) => (
              <div key={team.team?.id ?? team.team ?? team.rank} className="standings-row" role="row">
                <span role="cell">{team.rank ?? '-'}</span>
                <span role="cell" className="team-cell">
                  <strong>{team.team?.name ?? team.team}</strong>
                  {team.rpi && <small className="muted">RPI {Number(team.rpi).toFixed(3)}</small>}
                </span>
                <span role="cell">{formatRecord(team.conferenceRecord || team.confRecord, team.confWins, team.confLosses)}</span>
                <span role="cell">{formatRecord(team.overallRecord, team.overallWins, team.overallLosses)}</span>
                <span role="cell">{formatStreak(team)}</span>
              </div>
            ))}
          </div>
        )}

        {standingsState.meta?.timestamp && (
          <footer className="panel-footer">
            Updated {formatTimestamp(standingsState.meta.timestamp)} (edge cache)
          </footer>
        )}
      </div>
    )
  }

  const renderInsights = () => {
    return (
      <div className="panel insights-panel">
        <div className="panel-header">
          <div>
            <h2>Season {season} Intelligence</h2>
            <p className="muted">Top teams, batting efficiency, and automated insights.</p>
          </div>
          <div className="panel-controls">
            <label className="sr-only" htmlFor="season-select">Season</label>
            <select
              id="season-select"
              className="control-select"
              value={season}
              onChange={(event) => setSeason(Number(event.target.value))}
            >
              {SEASONS.map((yr) => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>
        </div>

        {historicalState.loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p className="muted">Crunching the archive…</p>
          </div>
        ) : historicalState.error ? (
          <div className="error-panel">
            <h3>Historical data unavailable</h3>
            <p className="muted">{historicalState.error}</p>
          </div>
        ) : (
          <div className="insights-grid">
            <section className="insight-card">
              <h3>Win Leaders</h3>
              <ul className="stat-list">
                {historicalState.topTeams.map((team) => (
                  <li key={team.team}>
                    <span className="stat-primary">{team.team}</span>
                    <span className="stat-secondary">{team.wins}-{team.losses} • RPI {Number(team.rpi ?? 0).toFixed(3)}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="insight-card">
              <h3>Batting Leaders</h3>
              <ul className="stat-list">
                {historicalState.battingLeaders.map((player) => (
                  <li key={player.player}>
                    <span className="stat-primary">{player.player}</span>
                    <span className="stat-secondary">{player.team} • AVG {Number(player.batting_average).toFixed(3)} • HR {player.home_runs}</span>
                  </li>
                ))}
              </ul>
            </section>

            {insightsState.loading ? (
              <section className="insight-card">
                <h3>Diamond Insights</h3>
                <p className="muted">Loading automated scouting notes…</p>
              </section>
            ) : insightsState.error ? (
              <section className="insight-card">
                <h3>Diamond Insights</h3>
                <p className="muted">{insightsState.error}</p>
              </section>
            ) : insightsState.data ? (
              <section className="insight-card">
                <h3>{insightsState.data.title ?? 'Diamond Insights'}</h3>
                <ul className="stat-list">
                  {(insightsState.data.highlights ?? []).map((item) => (
                    <li key={item.id ?? item.title}>
                      <span className="stat-primary">{item.title}</span>
                      {item.summary && <span className="stat-secondary">{item.summary}</span>}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        )}

        {historicalState.meta?.timestamp && (
          <footer className="panel-footer">
            Historical warehouse synced {formatTimestamp(historicalState.meta.timestamp)}
          </footer>
        )}
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>BlazeSportsIntel • College Baseball Command Center</h1>
        <p className="muted">Mobile-first intel: live scores, conference tables, and archive-backed insights.</p>
      </header>

      <main className="app-content">
        {activeTab === 'scores' && renderScores()}
        {activeTab === 'standings' && renderStandings()}
        {activeTab === 'insights' && renderInsights()}
      </main>

      <nav className="bottom-nav" aria-label="Primary">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={item.id === activeTab ? 'active' : ''}
            onClick={() => setActiveTab(item.id)}
            type="button"
          >
            <span className="nav-icon" aria-hidden>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <SportSwitcher currentSport="baseball" />
    </div>
  )
}

function formatTimestamp(timestamp) {
  try {
    return new Date(timestamp).toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      dateStyle: 'medium',
      timeStyle: 'short'
    })
  } catch (error) {
    return timestamp
  }
}

function formatStatus(status, detail) {
  if (!status && detail) return detail
  if (!status) return 'Scheduled'

  const normalized = status.toLowerCase()
  if (normalized === 'live') {
    return detail || 'Live'
  }
  if (normalized === 'final') {
    return 'Final'
  }
  if (normalized === 'scheduled') {
    return detail || 'Scheduled'
  }
  if (normalized === 'postponed') {
    return 'Postponed'
  }
  if (normalized === 'canceled') {
    return 'Canceled'
  }
  return status
}

function formatRecord(record, wins, losses) {
  if (typeof record === 'string') {
    return record
  }
  if (record && typeof record === 'object') {
    if (record.wins != null && record.losses != null) {
      return `${record.wins}-${record.losses}`
    }
    if (record.text) {
      return record.text
    }
  }
  if (wins != null && losses != null) {
    return `${wins}-${losses}`
  }
  return '-'
}

function formatStreak(team) {
  if (team.streak) {
    return team.streak
  }
  if (team.streakType && team.streakCount != null) {
    return `${team.streakType}${team.streakCount}`
  }
  if (team.streakType) {
    return team.streakType
  }
  return '-'
}

function getStatusClass(status) {
  const normalized = (status || 'scheduled').toString().toLowerCase()
  if (normalized === 'live' || normalized.includes('progress')) {
    return 'status status-live'
  }
  if (normalized === 'final') {
    return 'status status-final'
  }
  return `status status-${normalized.replace(/[^a-z0-9]+/g, '-')}`
}

function valueOrDash(value) {
  if (value === null || value === undefined) {
    return '-'
  }
  return value
}

function formatGameDate(date, time) {
  const datePart = date ? formatDate(date) : ''
  if (datePart && time) {
    return `${datePart} • ${time}`
  }
  if (time) {
    return time
  }
  return datePart || 'Time TBD'
}

function formatDate(date) {
  try {
    return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', {
      timeZone: 'America/Chicago',
      month: 'short',
      day: 'numeric'
    })
  } catch (error) {
    return date
  }
}

export default App
