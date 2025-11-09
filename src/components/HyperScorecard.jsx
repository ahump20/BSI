import { memo, useMemo } from 'react'
import './HyperScorecard.css'

const clamp = (value, min, max) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return min
  }
  return Math.min(Math.max(value, min), max)
}

const formatStartTime = (isoDate) => {
  if (!isoDate) return 'TBD'
  try {
    return new Date(isoDate).toLocaleTimeString('en-US', {
      timeZone: 'America/Chicago',
      hour: 'numeric',
      minute: '2-digit'
    })
  } catch (error) {
    return 'TBD'
  }
}

const buildInningLabel = (situation, status) => {
  if (status?.type?.completed) {
    return 'Final'
  }

  if (situation?.inning) {
    const frame = situation?.isTopInning ? 'Top' : 'Bot'
    return `${frame} ${situation.inning}`
  }

  if (status?.type?.shortDetail) {
    return status.type.shortDetail
  }

  return status?.type?.detail || 'Pregame'
}

const getTeamBadge = (team) => {
  if (!team?.team) return null
  const { abbreviation, color } = team.team
  const primaryColor = color ? `#${color}` : 'var(--accent-gold)'
  const initials = abbreviation || team.team.shortDisplayName?.slice(0, 3) || '---'

  return { initials, primaryColor }
}

const computeEdgeIndex = (homeScore, awayScore, status) => {
  const delta = homeScore - awayScore
  const absDelta = Math.abs(delta)
  const inningMultiplier = status?.period ? Math.min(status.period / 9, 1.2) : 0.6
  const raw = clamp((3 - absDelta) * 18 * inningMultiplier, 0, 100)
  return { raw: Math.round(raw), delta }
}

const buildBaseState = (situation) => {
  const occupied = new Set()
  if (Array.isArray(situation?.baseRunners)) {
    situation.baseRunners.forEach((runner) => {
      const base = runner?.endingBase || runner?.base || runner?.startBase
      if (typeof base === 'number') {
        occupied.add(base)
      }
    })
  }
  return occupied
}

const TeamRow = ({ label, team, score, leader }) => {
  const badge = getTeamBadge(team)
  const record = team?.records?.[0]?.summary || '—'
  const displayName = team?.team?.displayName || label
  const rank = team?.curatedRank?.current || team?.team?.rank

  return (
    <div className={`hyper-card__team-row ${leader ? 'leader' : ''}`}> 
      <div className="hyper-card__team-id">
        {badge ? (
          <span
            className="hyper-card__team-badge"
            style={{ '--team-accent': badge.primaryColor }}
          >
            {badge.initials}
          </span>
        ) : (
          <span className="hyper-card__team-badge placeholder">{label.slice(0, 3)}</span>
        )}
        <div className="hyper-card__team-meta">
          <span className="hyper-card__team-name">
            {rank ? <span className="hyper-card__team-rank">#{rank}</span> : null}
            {displayName}
          </span>
          <span className="hyper-card__team-record">{record}</span>
        </div>
      </div>
      <div className="hyper-card__team-score">{Number.isFinite(score) ? score : '—'}</div>
    </div>
  )
}

const HyperScorecard = ({ event }) => {
  const competition = event?.competitions?.[0] ?? {}
  const status = competition?.status ?? {}
  const situation = competition?.situation ?? {}
  const homeTeam = competition?.competitors?.find((team) => team.homeAway === 'home')
  const awayTeam = competition?.competitors?.find((team) => team.homeAway === 'away')

  const homeScore = Number(homeTeam?.score ?? 0)
  const awayScore = Number(awayTeam?.score ?? 0)

  const state = status?.type?.state
  const tone = status?.type?.completed
    ? 'final'
    : state === 'in'
      ? 'live'
      : state === 'pre'
        ? 'upcoming'
        : 'other'

  const statusLabel = status?.type?.completed
    ? 'Final'
    : status?.type?.shortDetail || status?.type?.detail || 'Scheduled'

  const inningLabel = buildInningLabel(situation, status)
  const startTime = formatStartTime(competition?.date || event?.date)
  const broadcast = competition?.broadcasts?.[0]?.names?.[0]

  const baseState = useMemo(() => buildBaseState(situation), [situation])

  const balls = clamp(Number(situation?.balls ?? 0), 0, 3)
  const strikes = clamp(Number(situation?.strikes ?? 0), 0, 2)
  const outsRaw = status?.type?.completed ? 3 : situation?.outs
  const outs = clamp(Number(outsRaw ?? 0), 0, 3)
  const pitchCount = Number(situation?.pitchCount?.total ?? situation?.pitchCount ?? 0)

  const countStyle = {
    '--balls-deg': `${(balls / 3) * 360}deg`,
    '--strikes-deg': `${(strikes / 3) * 360}deg`,
    '--outs-deg': `${(outs / 3) * 360}deg`,
    '--balls-ratio': balls / 3,
    '--strikes-ratio': strikes / 3,
    '--outs-ratio': outs / 3
  }

  const edge = computeEdgeIndex(homeScore, awayScore, status)
  const edgeStyle = {
    '--edge-fill': `${edge.raw}%`,
    '--edge-direction': edge.delta >= 0 ? 'var(--accent-gold)' : 'var(--accent-crimson)'
  }

  const lastPlay = situation?.lastPlay?.text || status?.type?.detail || statusLabel

  return (
    <article className={`hyper-card tone-${tone}`} role="listitem">
      <div className="hyper-card__halo" aria-hidden="true"></div>
      <header className="hyper-card__header">
        <span className="hyper-card__status">{statusLabel}</span>
        <div className="hyper-card__header-meta">
          <span className="hyper-card__start">{startTime}</span>
          <span className="hyper-card__inning">{inningLabel}</span>
        </div>
      </header>

      <div className="hyper-card__body">
        <div className="hyper-card__teams" role="group" aria-label="Score by team">
          <TeamRow label="Away" team={awayTeam} score={awayScore} leader={awayScore >= homeScore} />
          <TeamRow label="Home" team={homeTeam} score={homeScore} leader={homeScore >= awayScore} />
        </div>

        <div className="hyper-card__viz" role="group" aria-label="Situation visualization">
          <div className="diamond-viz" aria-hidden="true">
            <div className={`diamond-base first ${baseState.has(1) ? 'occupied' : ''}`}></div>
            <div className={`diamond-base second ${baseState.has(2) ? 'occupied' : ''}`}></div>
            <div className={`diamond-base third ${baseState.has(3) ? 'occupied' : ''}`}></div>
            <div className="diamond-base home"></div>
            <div className="diamond-grid"></div>
          </div>

          <div className="count-meter" style={countStyle}>
            <div className="count-ring">
              <span className="count-ring__label">Count</span>
              <div className="count-ring__values">
                <span>B {Number.isFinite(balls) ? balls : '–'}</span>
                <span>S {Number.isFinite(strikes) ? strikes : '–'}</span>
                <span>O {Number.isFinite(outs) ? outs : '–'}</span>
              </div>
            </div>
            <div className="count-progress balls" aria-hidden="true"></div>
            <div className="count-progress strikes" aria-hidden="true"></div>
            <div className="count-progress outs" aria-hidden="true"></div>
          </div>
        </div>
      </div>

      <footer className="hyper-card__footer">
        <div className="edge-index" style={edgeStyle}>
          <div className="edge-index__bar">
            <div className="edge-index__fill"></div>
          </div>
          <div className="edge-index__meta">
            <span className="edge-index__label">Edge Index</span>
            <span className="edge-index__value">{edge.raw}</span>
          </div>
          <p className="edge-index__descriptor">
            {edge.delta === 0
              ? 'Deadlocked — every pitch swings the series.'
              : edge.delta > 0
                ? `Home +${edge.delta} holding serve.`
                : `Visitors +${Math.abs(edge.delta)} pressuring the home crowd.`}
          </p>
        </div>

        <div className="hyper-card__detail">
          <p className="hyper-card__detail-text">{lastPlay}</p>
          {pitchCount > 0 ? (
            <span className="hyper-card__detail-pill">Pitch count: {pitchCount}</span>
          ) : null}
          {broadcast ? (
            <span className="hyper-card__detail-pill">{broadcast}</span>
          ) : null}
        </div>
      </footer>
    </article>
  )
}

export default memo(HyperScorecard)
