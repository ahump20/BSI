import { useMemo } from 'react'
import './BaseballCoachingHub.css'

type Trend = 'up' | 'down' | 'stable'

type UmpireMetric = {
  label: string
  value: string
  context: string
  trend?: Trend
}

type StressIndicator = {
  unit: string
  load: number
  band: 'low' | 'moderate' | 'high'
  note: string
}

type BullpenArm = {
  name: string
  availability: 'fresh' | 'limited' | 'unavailable'
  lastUsed: string
  pitches: number
}

type SituationalPlay = {
  scenario: string
  runValue: number
  winProbability: number
  recommendation: string
  trigger: string
}

type MatchupSignal = {
  opponent: string
  edge: string
  focus: string
  leverageWindow: string
}

const BaseballCoachingHub = () => {
  const umpireReport = useMemo(
    () => ({
      crewChief: 'Marcus Tillman',
      crewTendencies: 'Tight on the high edge, expansive away to right-handed hitters.',
      pace: '19.6s between pitches',
      heatMapSummary: 'Lower-outside quadrant rewarded early; elevate with two strikes only when ahead in the count.',
      metrics: [
        {
          label: 'Edge Strike Rate',
          value: '64% (+8 vs SEC avg)',
          context: 'Leans into the glove-side corner for right-handed pitchers.',
          trend: 'up'
        },
        {
          label: 'Called Zone Height',
          value: '2.8 ft (-0.3)',
          context: 'Top of the zone is compressed—force ground-ball contact.',
          trend: 'down'
        },
        {
          label: 'Game Pace',
          value: '2h 41m',
          context: 'Aggressive strike calling—be ready to attack early in counts.',
          trend: 'stable'
        },
        {
          label: 'Walk Rate Impact',
          value: '-5.2%',
          context: 'Opponents draw fewer free passes when this crew works the plate.',
          trend: 'down'
        }
      ] as UmpireMetric[]
    }),
    []
  )

  const stressProfile = useMemo(
    () => ({
      readinessLabel: 'Roster Stress Index',
      overallLoad: 82,
      overallBand: 'high' as const,
      seriesNotes: 'Rotation stretched after doubleheader; leverage bullpen depth and small-ball tactics.',
      indicators: [
        {
          unit: 'Starting Rotation',
          load: 88,
          band: 'high',
          note: 'Friday ace at 104 pitches last outing—cap at 85 tonight.'
        },
        {
          unit: 'Bullpen Core',
          load: 76,
          band: 'high',
          note: 'Sidewinder Settleman rested, consider him as bridge through 6th.'
        },
        {
          unit: 'Catcher Durability',
          load: 69,
          band: 'moderate',
          note: 'Stagger blocking drills during BP; heavy workload vs run game.'
        }
      ] as StressIndicator[],
      bullpen: [
        {
          name: 'RHP Cole Sanderson',
          availability: 'fresh',
          lastUsed: 'Idle 3 days',
          pitches: 12
        },
        {
          name: 'LHP Mateo Ruiz',
          availability: 'limited',
          lastUsed: '32 pitches yesterday',
          pitches: 32
        },
        {
          name: 'RHP Devin Brooks',
          availability: 'unavailable',
          lastUsed: 'Closed Game 2 — 28 pitches',
          pitches: 28
        }
      ] as BullpenArm[]
    }),
    []
  )

  const situationalPlays = useMemo(
    () =>
      [
        {
          scenario: 'Runners on 1st/2nd, <2 outs',
          runValue: 1.78,
          winProbability: 0.62,
          recommendation: 'Push bunt toward third; LSU shifts middle infield deep.',
          trigger: 'Use vs LHP with FB <93 mph'
        },
        {
          scenario: 'Runner on 3rd, 1 out',
          runValue: 0.94,
          winProbability: 0.57,
          recommendation: 'Safety squeeze when Ruiz is on mound—opponent infield corners play back.',
          trigger: 'If count is 1-1 or better'
        },
        {
          scenario: 'Late leverage (7th+), tie or better',
          runValue: 1.12,
          winProbability: 0.69,
          recommendation: 'Deploy pinch hitter Lawson vs lefty relievers—1.045 OPS vs spin < 2,400 RPM.',
          trigger: 'Opponent bullpen shifts to southpaw'
        }
      ] as SituationalPlay[],
    []
  )

  const matchupSignals = useMemo(
    () =>
      [
        {
          opponent: 'LSU — Game 1',
          edge: 'Attack early count fastballs; 62% first-pitch strikes from starter.',
          focus: 'Dial up hit-and-run with top of order.',
          leverageWindow: 'Innings 2-4'
        },
        {
          opponent: 'LSU — Game 2',
          edge: 'Bullpen thin vs left-handed bats.',
          focus: 'Load lineup with lefties 6-9; chase starters by pitch 75.',
          leverageWindow: 'Middle innings'
        },
        {
          opponent: 'Midweek vs Tulane',
          edge: 'Aggressive baserunners, limited pop.',
          focus: 'Prioritize defensive alignments; give freshmen ABs.',
          leverageWindow: 'Full game development'
        }
      ] as MatchupSignal[],
    []
  )

  const overallBandLabel = {
    low: 'Stable',
    moderate: 'Manageable',
    high: 'Critical'
  }[stressProfile.overallBand]

  return (
    <div className="coaching-hub" role="main">
      <header className="hub-header">
        <div className="hub-header__title">
          <p className="hub-header__eyebrow">Diamond Insights // College Baseball</p>
          <h1>Game Management Command Center</h1>
          <p className="hub-header__subtitle">
            Mobile-first operations dashboard combining umpire scouting, roster workload, and situation-first tactics.
          </p>
        </div>
        <div className={`hub-header__status hub-header__status--${stressProfile.overallBand}`} aria-label="Roster stress gauge">
          <span className="status-label">{stressProfile.readinessLabel}</span>
          <span className="status-value">{stressProfile.overallLoad}</span>
          <span className="status-band">{overallBandLabel}</span>
        </div>
      </header>

      <section className="section">
        <div className="section-heading">
          <h2>Umpire Intelligence Brief</h2>
          <span className="section-tag">Crew Chief: {umpireReport.crewChief}</span>
        </div>
        <p className="section-description">{umpireReport.crewTendencies}</p>
        <div className="umpire-grid" role="list">
          {umpireReport.metrics.map((metric) => (
            <article key={metric.label} className="card metric-card" role="listitem">
              <header className="metric-card__header">
                <h3>{metric.label}</h3>
                {metric.trend && <span className={`trend trend--${metric.trend}`}>{metric.trend}</span>}
              </header>
              <p className="metric-card__value">{metric.value}</p>
              <p className="metric-card__context">{metric.context}</p>
            </article>
          ))}
        </div>
        <div className="umpire-footnote">
          <span className="footnote-label">Tempo Read</span>
          <p>{umpireReport.pace} · {umpireReport.heatMapSummary}</p>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>Roster Stress Monitor</h2>
          <span className={`section-tag section-tag--${stressProfile.overallBand}`}>{overallBandLabel}</span>
        </div>
        <p className="section-description">{stressProfile.seriesNotes}</p>
        <div className="stress-grid">
          {stressProfile.indicators.map((indicator) => (
            <article key={indicator.unit} className="card stress-card" aria-live="polite">
              <header className="stress-card__header">
                <h3>{indicator.unit}</h3>
                <span className={`badge badge--${indicator.band}`}>{indicator.load}</span>
              </header>
              <p className="stress-card__note">{indicator.note}</p>
              <div className="stress-card__meter" role="img" aria-label={`${indicator.unit} load ${indicator.load} out of 100`}>
                <div className={`stress-card__meter-fill stress-card__meter-fill--${indicator.band}`} style={{ width: `${indicator.load}%` }} />
              </div>
            </article>
          ))}
        </div>
        <div className="bullpen-panel card">
          <h3>Bullpen Availability</h3>
          <ul className="bullpen-list">
            {stressProfile.bullpen.map((arm) => (
              <li key={arm.name} className={`bullpen-list__item bullpen-list__item--${arm.availability}`}>
                <div className="bullpen-list__meta">
                  <span className="bullpen-list__name">{arm.name}</span>
                  <span className="bullpen-list__tag">{arm.availability}</span>
                </div>
                <div className="bullpen-list__details">
                  <span>{arm.lastUsed}</span>
                  <span>{arm.pitches} pitches</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>Situational Analytics</h2>
          <span className="section-tag">Win Probabilities &amp; Run Value</span>
        </div>
        <div className="situational-table" role="table" aria-label="Situational tactics table">
          <div className="table-row table-row--head" role="row">
            <span role="columnheader">Scenario</span>
            <span role="columnheader">Run Value</span>
            <span role="columnheader">Win %</span>
            <span role="columnheader">Recommendation</span>
            <span role="columnheader">Trigger</span>
          </div>
          {situationalPlays.map((play) => (
            <div key={play.scenario} className="table-row" role="row">
              <span role="cell">{play.scenario}</span>
              <span role="cell">{play.runValue.toFixed(2)}</span>
              <span role="cell">{Math.round(play.winProbability * 100)}%</span>
              <span role="cell">{play.recommendation}</span>
              <span role="cell">{play.trigger}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>Series Signals</h2>
          <span className="section-tag">Upcoming Opponents</span>
        </div>
        <div className="matchup-grid">
          {matchupSignals.map((signal) => (
            <article key={signal.opponent} className="card matchup-card">
              <header>
                <h3>{signal.opponent}</h3>
                <p className="matchup-card__edge">{signal.edge}</p>
              </header>
              <dl className="matchup-card__insights">
                <div>
                  <dt>Primary Focus</dt>
                  <dd>{signal.focus}</dd>
                </div>
                <div>
                  <dt>Leverage Window</dt>
                  <dd>{signal.leverageWindow}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <footer className="hub-footer">
        <div>
          <h2>Diamond Pro Recommendations</h2>
          <p>
            Gate premium adjustments behind Pro: advanced matchup simulations, bullpen AI pairings, and player wellness
            overlays ready for activation.
          </p>
        </div>
        <button type="button" className="cta-button">Unlock Diamond Pro Tools</button>
      </footer>
    </div>
  )
}

export default BaseballCoachingHub
