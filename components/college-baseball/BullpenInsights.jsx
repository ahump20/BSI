import React from 'react';
import './BullpenInsights.css';

function formatNumber(value, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—';
  }
  return Number(value).toFixed(digits);
}

function BullpenCard({ team }) {
  return (
    <article className="bullpen-card">
      <header className="bullpen-card__header">
        <h3>{team.team_name}</h3>
        <span className="bullpen-card__updated">
          Updated {new Date(team.updated_at).toLocaleTimeString()}
        </span>
      </header>
      <div className="bullpen-card__metrics">
        <div className="metric">
          <span className="metric__label">Bullpen Fatigue</span>
          <span className="metric__value">{formatNumber(team.bullpen_fatigue_index)}</span>
        </div>
        <div className="metric">
          <span className="metric__label">Readiness</span>
          <span className="metric__value">{formatNumber(team.bullpen_readiness)}</span>
        </div>
        <div className="metric">
          <span className="metric__label">TTO Penalty</span>
          <span className="metric__value">
            {formatNumber(team.times_through_order_penalty, 2)} runs
          </span>
        </div>
        <div className="metric">
          <span className="metric__label">Leverage Pressure</span>
          <span className="metric__value">{formatNumber(team.leverage_pressure)}</span>
        </div>
        <div className="metric">
          <span className="metric__label">Contact Quality</span>
          <span className="metric__value">{formatNumber(team.contact_quality_index)}</span>
        </div>
        <div className="metric">
          <span className="metric__label">Win Prob Added</span>
          <span className="metric__value">{formatNumber(team.win_probability_added, 3)}</span>
        </div>
      </div>
      <section className="bullpen-card__recommendation">
        <h4>Coaching Read</h4>
        <p>{team.recommendation}</p>
      </section>
      {team.pitching_plan && (
        <section className="bullpen-card__plan">
          <h4>Pitching Plan</h4>
          <ul className="plan-list">
            <li>
              <strong>Hook Window:</strong> {team.pitching_plan.hook_window}
            </li>
            <li>
              <strong>Leverage Focus:</strong> {team.pitching_plan.leverage_focus}
            </li>
            {team.pitching_plan.matchup_flags?.length ? (
              <li>
                <strong>Flags:</strong>
                <ul className="plan-sublist">
                  {team.pitching_plan.matchup_flags.map((flag) => (
                    <li key={flag}>{flag}</li>
                  ))}
                </ul>
              </li>
            ) : null}
            {team.pitching_plan.relief_queue?.length ? (
              <li>
                <strong>Relief Queue:</strong> {team.pitching_plan.relief_queue.join(' → ')}
              </li>
            ) : null}
          </ul>
        </section>
      )}
      {team.notes?.length ? (
        <section className="bullpen-card__notes">
          <h4>Diamond Pro Notes</h4>
          <ul>
            {team.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}

export default function BullpenInsights({ data }) {
  if (!data || !Array.isArray(data.teams) || data.teams.length === 0) {
    return null;
  }

  return (
    <div className="bullpen-insights">
      <header className="bullpen-insights__header">
        <h2>Diamond Pro Bullpen Intel</h2>
        <span className="bullpen-insights__meta">
          Snapshot {new Date(data.generated_at).toLocaleTimeString()} · {data.venue}
        </span>
      </header>
      <div className="bullpen-insights__grid">
        {data.teams.map((team) => (
          <BullpenCard key={team.team_slug} team={team} />
        ))}
      </div>
    </div>
  );
}
