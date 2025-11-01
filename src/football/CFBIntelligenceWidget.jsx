import { useEffect, useMemo, useState } from 'react'

const API_BASE =
  import.meta.env.VITE_CFB_INTELLIGENCE_URL ||
  'https://blaze-cfb-intelligence.workers.dev'

function formatProbability(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '—'
  }

  return `${Math.round(value * 100)}%`
}

function classifyPriority(game) {
  if (!game) return 'national'

  const fcsInvolved =
    game.home_division === 'FCS' || game.away_division === 'FCS'
  if (fcsInvolved) return 'fcs-priority'

  const groupOfFive = ['MAC', 'Sun Belt', 'C-USA', 'MWC', 'AAC']
  const g5Hit =
    groupOfFive.includes(game.home_conference) ||
    groupOfFive.includes(game.away_conference)
  return g5Hit ? 'group-of-five' : 'national'
}

export default function CFBIntelligenceWidget() {
  const [liveGames, setLiveGames] = useState([])
  const [upsets, setUpsets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let disposed = false
    let intervalId

    const fetchData = async () => {
      setLoading(true)
      const controller = new AbortController()

      try {
        const [liveRes, upsetRes] = await Promise.all([
          fetch(`${API_BASE}/cfb/games/live`, {
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
          }),
          fetch(`${API_BASE}/cfb/games/upsets`, {
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
          }),
        ])

        if (!liveRes.ok) {
          throw new Error(`Live games request failed: ${liveRes.status}`)
        }

        if (!upsetRes.ok) {
          throw new Error(`Upset alert request failed: ${upsetRes.status}`)
        }

        const [liveJson, upsetJson] = await Promise.all([
          liveRes.json(),
          upsetRes.json(),
        ])

        if (disposed) return

        setLiveGames(Array.isArray(liveJson) ? liveJson : [])
        setUpsets(Array.isArray(upsetJson) ? upsetJson : [])
        setError(null)
      } catch (err) {
        if (disposed || err.name === 'AbortError') return
        console.error('CFB intelligence fetch failed', err)
        setError(err.message)
      } finally {
        if (!disposed) {
          setLoading(false)
        }
      }
    }

    fetchData()
    intervalId = window.setInterval(fetchData, 30000)

    return () => {
      disposed = true
      if (intervalId) {
        window.clearInterval(intervalId)
      }
    }
  }, [])

  const timestamp = useMemo(
    () =>
      new Date().toLocaleString('en-US', {
        timeZone: 'America/Chicago',
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    [liveGames.length, upsets.length],
  )

  if (error) {
    return (
      <section className="cfb-intel" aria-labelledby="cfb-intel-heading">
        <div className="cfb-intel__header">
          <div>
            <h2 id="cfb-intel-heading">College Football Intelligence</h2>
            <p className="cfb-intel__subtitle">
              EPA, success rate, and upset detection running on Cloudflare edge
            </p>
          </div>
          <span className="cfb-intel__timestamp">Last attempt: {timestamp}</span>
        </div>
        <div className="cfb-intel__state cfb-intel__state--error" role="alert">
          <p className="cfb-intel__state-title">Couldn&apos;t reach Blaze CFB Worker</p>
          <p className="cfb-intel__state-detail">{error}</p>
        </div>
      </section>
    )
  }

  return (
    <section className="cfb-intel" aria-labelledby="cfb-intel-heading">
      <div className="cfb-intel__header">
        <div>
          <h2 id="cfb-intel-heading">College Football Intelligence</h2>
          <p className="cfb-intel__subtitle">
            FCS-first prioritization with live EPA and upset probabilities
          </p>
        </div>
        <span className="cfb-intel__timestamp">Updated: {timestamp}</span>
      </div>

      {loading ? (
        <div className="cfb-intel__state" role="status" aria-live="polite">
          <div className="cfb-intel__spinner" aria-hidden="true" />
          <p>Crunching latest drives...</p>
        </div>
      ) : (
        <div className="cfb-intel__content">
          <div className="cfb-intel__live">
            <header className="cfb-intel__section-header">
              <h3>Live Games</h3>
              <span>{liveGames.length} tracked</span>
            </header>
            {liveGames.length === 0 ? (
              <p className="cfb-intel__empty">No live games right now.</p>
            ) : (
              <ul className="cfb-intel__games" role="list">
                {liveGames.map((game) => {
                  const priority = classifyPriority(game)
                  return (
                    <li
                      key={game.id}
                      className={`cfb-intel__game cfb-intel__game--${priority}`}
                    >
                      <div className="cfb-intel__game-header">
                        <span className="cfb-intel__situation">
                          Q{game.quarter} • {game.time_remaining || '0:00'}
                        </span>
                        {game.upset_probability > 0.3 && (
                          <span className="cfb-intel__upset">
                            🚨 {formatProbability(game.upset_probability)} upset
                            chance
                          </span>
                        )}
                      </div>
                      <div className="cfb-intel__teams">
                        <div className="cfb-intel__team">
                          <span className="cfb-intel__team-name">
                            {game.away_team}
                          </span>
                          <span className="cfb-intel__team-meta">
                            {game.away_division}
                          </span>
                          <span className="cfb-intel__score">{game.away_score}</span>
                        </div>
                        <div className="cfb-intel__team">
                          <span className="cfb-intel__team-name">
                            {game.home_team}
                          </span>
                          <span className="cfb-intel__team-meta">
                            {game.home_division}
                          </span>
                          <span className="cfb-intel__score">{game.home_score}</span>
                        </div>
                      </div>
                      <dl className="cfb-intel__metrics">
                        <div>
                          <dt>EPA</dt>
                          <dd>
                            {game.away_epa?.toFixed(2) ?? '—'} /{' '}
                            {game.home_epa?.toFixed(2) ?? '—'}
                          </dd>
                        </div>
                        <div>
                          <dt>Success Rate</dt>
                          <dd>
                            {game.away_success_rate?.toFixed(2) ?? '—'} /{' '}
                            {game.home_success_rate?.toFixed(2) ?? '—'}
                          </dd>
                        </div>
                        <div>
                          <dt>Home Win Prob</dt>
                          <dd>{formatProbability(game.home_win_probability)}</dd>
                        </div>
                      </dl>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div className="cfb-intel__upsets">
            <header className="cfb-intel__section-header">
              <h3>Upset Radar</h3>
              <span>{upsets.length} alerts</span>
            </header>
            {upsets.length === 0 ? (
              <p className="cfb-intel__empty">No qualified upset alerts.</p>
            ) : (
              <ul className="cfb-intel__alerts" role="list">
                {upsets.map((alert) => (
                  <li key={alert.id} className="cfb-intel__alert">
                    <div>
                      <p className="cfb-intel__alert-matchup">
                        {alert.away_team} @ {alert.home_team}
                      </p>
                      <p className="cfb-intel__alert-meta">
                        {new Date(alert.scheduled_time).toLocaleString('en-US', {
                          timeZone: 'America/Chicago',
                          hour: 'numeric',
                          minute: '2-digit',
                          month: 'short',
                          day: 'numeric',
                        })}
                        {' • '}
                        {alert.status}
                      </p>
                    </div>
                    <div className="cfb-intel__alert-prob">
                      <span>{formatProbability(alert.upset_probability)}</span>
                      <span className="cfb-intel__alert-underdog">
                        {alert.underdog === 'home_underdog'
                          ? 'Home dog'
                          : 'Road dog'}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
