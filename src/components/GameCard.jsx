import { useState } from 'react'
import './GameCard.css'

function GameCard({ game }) {
  const { away, home, status, linescore, totals, broadcast, weather, note, series, situation } = game
  const highlightAway = game.leader === 'away'
  const highlightHome = game.leader === 'home'
  const showLinescore = linescore.innings.length > 0

  const metaChips = [
    game.venue ? { icon: '📍', label: game.venue } : null,
    broadcast ? { icon: '📡', label: broadcast } : null,
    weather ? { icon: '🌡️', label: weather } : null,
    series ? { icon: '🏆', label: series } : null,
    note ? { icon: '📝', label: note } : null
  ].filter(Boolean)

  return (
    <article className={`game-card game-card--${status.slug}`} data-game-id={game.id}>
      <header className="game-card__header">
        <div className="game-card__status-group">
          <span className={`status-pill status-pill--${status.slug}`}>
            <span className="status-pill__dot" />
            {status.label}
          </span>
          <span className="game-card__status-detail">{status.context}</span>
        </div>
        <span className="game-card__timestamp">
          {status.slug === 'scheduled' && game.startDisplay ? game.startDisplay : status.detail}
        </span>
      </header>

      <div className="game-card__teams" role="group" aria-label={`${away.name} at ${home.name}`}>
        <TeamRow team={away} isLeader={highlightAway} status={status.slug} />
        <TeamRow team={home} isLeader={highlightHome} status={status.slug} />
      </div>

      {showLinescore && (
        <div
          className="game-card__linescore"
          style={{ gridTemplateColumns: `auto repeat(${linescore.innings.length}, minmax(2rem, 1fr)) auto auto auto` }}
          aria-label="Linescore by inning"
        >
          <span className="linescore__label" aria-hidden="true">Inning</span>
          {linescore.innings.map((inning) => (
            <span key={`inning-${inning}`} className="linescore__label">
              {inning}
            </span>
          ))}
          <span className="linescore__label linescore__label--totals">R</span>
          <span className="linescore__label linescore__label--totals">H</span>
          <span className="linescore__label linescore__label--totals">E</span>

          <span className="linescore__team">{away.abbreviation}</span>
          {linescore.away.map((value, index) => (
            <span key={`away-${index}`} className="linescore__value">
              {value}
            </span>
          ))}
          <span className="linescore__total">{totals.away.runs}</span>
          <span className="linescore__total">{formatStat(totals.away.hits)}</span>
          <span className="linescore__total">{formatStat(totals.away.errors)}</span>

          <span className="linescore__team">{home.abbreviation}</span>
          {linescore.home.map((value, index) => (
            <span key={`home-${index}`} className="linescore__value">
              {value}
            </span>
          ))}
          <span className="linescore__total">{totals.home.runs}</span>
          <span className="linescore__total">{formatStat(totals.home.hits)}</span>
          <span className="linescore__total">{formatStat(totals.home.errors)}</span>
        </div>
      )}

      {status.slug === 'live' && situation && (
        <div className="game-card__situation" aria-label="Current situation">
          <div
            className="base-diamond"
            role="img"
            aria-label={`Runners on ${describeBases(situation.runners)}`}
          >
            <span className={`base base--first ${situation.runners.first ? 'base--occupied' : ''}`} />
            <span className={`base base--second ${situation.runners.second ? 'base--occupied' : ''}`} />
            <span className={`base base--third ${situation.runners.third ? 'base--occupied' : ''}`} />
          </div>
          <div className="situation-counts" aria-label="Ball strike out count">
            <CountBubble label="B" value={situation.balls} tone="info" />
            <CountBubble label="S" value={situation.strikes} tone="warning" />
            <CountBubble label="O" value={situation.outs} tone="danger" />
          </div>
          {situation.lastPlay && <p className="situation-last-play">{situation.lastPlay}</p>}
        </div>
      )}

      {metaChips.length > 0 && (
        <div className="game-card__meta" role="list">
          {metaChips.map((chip, index) => (
            <MetaChip key={`${chip.icon}-${index}`} icon={chip.icon} label={chip.label} />
          ))}
        </div>
      )}
    </article>
  )
}

export default GameCard

function TeamRow({ team, isLeader, status }) {
  const [logoErrored, setLogoErrored] = useState(false)
  const avatarStyle = team.color ? { background: `${team.color}1f` } : undefined
  const showFallback = logoErrored || !team.logo

  return (
    <div className={`team-row ${isLeader ? 'team-row--leader' : ''}`}>
      <div className="team-row__identity">
        <div className="team-row__avatar" style={avatarStyle}>
          {showFallback ? (
            <span className="team-row__avatar-fallback">{team.abbreviation.slice(0, 2)}</span>
          ) : (
            <img
              src={team.logo}
              alt=""
              loading="lazy"
              onError={() => setLogoErrored(true)}
            />
          )}
        </div>
        <div className="team-row__info">
          <div className="team-row__name">
            {team.rank && team.rank <= 50 && <span className="team-row__rank">#{team.rank}</span>}
            <span>{team.name}</span>
          </div>
          <div className="team-row__record">{team.record}</div>
        </div>
      </div>
      <div className="team-row__score" data-status={status}>
        {Number.isFinite(team.score) ? team.score : '—'}
      </div>
      <div className="team-row__micro-stats">
        {team.hits !== null && <span><abbr title="Hits">H</abbr> {team.hits}</span>}
        {team.errors !== null && <span><abbr title="Errors">E</abbr> {team.errors}</span>}
      </div>
    </div>
  )
}

function MetaChip({ icon, label }) {
  return (
    <span className="meta-chip" role="listitem">
      <span className="meta-chip__icon" aria-hidden="true">{icon}</span>
      <span className="meta-chip__label">{label}</span>
    </span>
  )
}

function CountBubble({ label, value, tone }) {
  return (
    <span className={`count-bubble count-bubble--${tone}`}>
      <span className="count-bubble__label">{label}</span>
      <span className="count-bubble__value">{value}</span>
    </span>
  )
}

function describeBases(runners) {
  const occupied = [
    runners.first ? 'first' : null,
    runners.second ? 'second' : null,
    runners.third ? 'third' : null
  ].filter(Boolean)

  if (occupied.length === 0) {
    return 'empty bases'
  }

  if (occupied.length === 3) {
    return 'bases loaded'
  }

  return occupied.join(' and ')
}

function formatStat(value) {
  if (value === null || value === undefined) {
    return '—'
  }

  return Number.isFinite(value) ? value : '—'
}
