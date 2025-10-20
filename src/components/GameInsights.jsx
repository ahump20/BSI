import './GameInsights.css'
import { formatInning } from '../baseball/insights'

function formatPressure(pressureIndex) {
  if (typeof pressureIndex !== 'number' || Number.isNaN(pressureIndex)) {
    return 0
  }
  return Math.round(Math.min(Math.max(pressureIndex, 0), 1) * 100)
}

function describeTraffic(baseRunners) {
  if (!baseRunners) {
    return 'Bases clear'
  }
  if (baseRunners === 1) {
    return 'One runner aboard'
  }
  if (baseRunners === 2) {
    return 'Two in scoring position'
  }
  return 'Bases crowded'
}

function GameInsights({ meta, properties = [] }) {
  if (!meta || properties.length === 0) {
    return null
  }

  const pressure = formatPressure(meta.pressureIndex)
  const isPregame = Boolean(meta.isScheduled)
  const inningLabel = isPregame
    ? 'Pregame'
    : formatInning(Math.max(meta.inning || 1, 1), meta.inningHalf || undefined)
  const trafficDescriptor = isPregame ? 'Awaiting first pitch' : describeTraffic(meta.baseRunners)
  const scoringPaceValue = isPregame
    ? null
    : typeof meta.scoringPace === 'number' && !Number.isNaN(meta.scoringPace)
      ? meta.scoringPace.toFixed(2)
      : '0.00'
  const scoringMetricValue = scoringPaceValue === null ? '—' : `${scoringPaceValue} runs/inning`
  const scoringContext = isPregame
    ? 'Scoreboard opens at first pitch.'
    : `${meta.totalRuns} total runs through ${inningLabel}`
  const pressureContext = isPregame ? 'Pregame tempo check.' : `${inningLabel} • ${trafficDescriptor}`

  return (
    <div className="game-insights">
      <div className="insight-metrics" aria-label="Game leverage and scoring pace">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Leverage Index</span>
            <span className="metric-value">{pressure}%</span>
          </div>
          <div className="metric-bar" role="presentation">
            <div className="metric-bar-fill" style={{ width: `${pressure}%` }} />
          </div>
          <p className="metric-context">{pressureContext}</p>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Scoring Pace</span>
            <span className="metric-value">{scoringMetricValue}</span>
          </div>
          <p className="metric-context">{scoringContext}</p>
        </div>
      </div>

      <ul className="insight-properties">
        {properties.map((property) => (
          <li key={property.id} className="insight-property">
            <h4>{property.title}</h4>
            <p>{property.description}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default GameInsights
