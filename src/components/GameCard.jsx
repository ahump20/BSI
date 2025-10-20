import PropTypes from 'prop-types'

const formatDateTime = (isoString) => {
  if (!isoString) {
    return null
  }

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      hour: 'numeric',
      minute: '2-digit',
      month: 'short',
      day: 'numeric'
    })

    return formatter.format(new Date(isoString))
  } catch (error) {
    console.error('Failed to format date', error)
    return null
  }
}

const formatCount = (balls, strikes, outs) => {
  if ([balls, strikes, outs].some((value) => typeof value === 'number')) {
    const b = typeof balls === 'number' ? balls : '-'
    const s = typeof strikes === 'number' ? strikes : '-'
    const o = typeof outs === 'number' ? outs : '-'

    return `B${b} • S${s} • O${o}`
  }

  return null
}

const TeamRow = ({ team, emphasise }) => (
  <div className={`team ${emphasise ? 'team--leading' : ''}`}>
    <div className="team-labels">
      {team?.rank ? <span className="team-rank">#{team.rank}</span> : null}
      <span className="team-name">{team?.displayName ?? 'TBD'}</span>
      {team?.record ? <span className="team-record">{team.record}</span> : null}
    </div>
    <span className="team-score">{team?.score ?? '—'}</span>
  </div>
)

TeamRow.propTypes = {
  team: PropTypes.shape({
    displayName: PropTypes.string,
    rank: PropTypes.number,
    record: PropTypes.string,
    score: PropTypes.number
  }),
  emphasise: PropTypes.bool
}

const GameCard = ({ game }) => {
  const upcomingKick = formatDateTime(game.startTime)
  const countSummary = formatCount(game.balls, game.strikes, game.outs)
  const detail = game.shortDetail ?? game.detail
  const homeScore = game.home?.score ?? -Infinity
  const awayScore = game.away?.score ?? -Infinity
  const homeLeading = homeScore > awayScore
  const awayLeading = awayScore > homeScore

  return (
    <article className={`game-card status-${game.bucket}`} aria-label={detail}>
      <header className="game-card__status">
        <span className="game-status">{detail}</span>
        {game.bucket === 'live' ? (
          <div className="game-clock" aria-label="Game situation">
            {game.displayClock ? <span className="clock-value">{game.displayClock}</span> : null}
            {game.inning ? <span className="inning">{game.inning}</span> : null}
            {countSummary ? <span className="count">{countSummary}</span> : null}
          </div>
        ) : null}
        {game.bucket === 'upcoming' && upcomingKick ? (
          <span className="game-start">{upcomingKick}</span>
        ) : null}
      </header>

      <div className="game-teams" role="list">
        <TeamRow team={game.away} emphasise={awayLeading} />
        <TeamRow team={game.home} emphasise={homeLeading} />
      </div>

      <footer className="game-card__meta">
        {game.venue ? <span className="venue">{game.venue}</span> : null}
        {game.network ? <span className="network">{game.network}</span> : null}
      </footer>
    </article>
  )
}

GameCard.propTypes = {
  game: PropTypes.shape({
    id: PropTypes.string,
    bucket: PropTypes.oneOf(['live', 'upcoming', 'final']).isRequired,
    detail: PropTypes.string,
    shortDetail: PropTypes.string,
    startTime: PropTypes.string,
    displayClock: PropTypes.string,
    inning: PropTypes.string,
    balls: PropTypes.number,
    strikes: PropTypes.number,
    outs: PropTypes.number,
    venue: PropTypes.string,
    network: PropTypes.string,
    home: PropTypes.object,
    away: PropTypes.object
  }).isRequired
}

export default GameCard
