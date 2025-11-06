'use client';

import { useMemo } from 'react';
import type { CFPTop25Response } from '@/lib/cfp';

function formatTrend(trend: 'up' | 'down' | 'steady') {
  if (trend === 'up') {
    return { label: '▲', className: 'cfp-trend-up', description: 'Trending Up' };
  }
  if (trend === 'down') {
    return { label: '▼', className: 'cfp-trend-down', description: 'Trending Down' };
  }
  return { label: '■', className: 'cfp-trend-steady', description: 'Holding Steady' };
}

function formatProbability(value: number) {
  return `${Math.round(value * 100)}%`;
}

interface Top25BoardProps {
  data: CFPTop25Response;
}

export function Top25Board({ data }: Top25BoardProps) {
  const topFour = data.rankings.slice(0, 4);
  const avgSos = useMemo(() => {
    const values = topFour.map((entry) => entry.sosRank);
    return (values.reduce((sum, val) => sum + val, 0) / values.length).toFixed(1);
  }, [topFour]);

  const totalPlayoffOdds = useMemo(() => {
    return topFour.reduce((sum, entry) => sum + entry.playoffProbability, 0);
  }, [topFour]);

  return (
    <section className="cfp-board" aria-labelledby="cfp-top25-heading">
      <header className="cfp-board__header">
        <div>
          <span className="di-kicker">Playoff Intelligence · CFP</span>
          <h2 id="cfp-top25-heading" className="di-page-title">
            Blaze Sports Intel Top 25 Composite
          </h2>
          <p className="di-page-subtitle">
            Updated {new Date(data.lastUpdated).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
            {' '}({data.timezone}).
          </p>
        </div>
        <div className="cfp-badge" aria-label={`Data source: ${data.source}`}>
          {data.poll}
        </div>
      </header>

      <div className="cfp-metrics" role="list">
        <article className="cfp-metric" role="listitem">
          <span className="cfp-metric__label">Projected Field</span>
          <span className="cfp-metric__value">
            {data.modelBaseline.projectedField.map((entry) => `${entry.seed} • ${entry.team}`).join(' | ')}
          </span>
          <span className="cfp-metric__caption">Baseline Monte Carlo output</span>
        </article>
        <article className="cfp-metric" role="listitem">
          <span className="cfp-metric__label">Average SOS (Top 4)</span>
          <span className="cfp-metric__value">{avgSos}</span>
          <span className="cfp-metric__caption">Lower is tougher schedule</span>
        </article>
        <article className="cfp-metric" role="listitem">
          <span className="cfp-metric__label">Top 4 Playoff Equity</span>
          <span className="cfp-metric__value">{formatProbability(totalPlayoffOdds / 4)}</span>
          <span className="cfp-metric__caption">Mean berth probability among leaders</span>
        </article>
      </div>

      <div className="cfp-table-wrapper">
        <table className="cfp-table">
          <caption>Composite ranking with resume context, projected seeds, and playoff probabilities.</caption>
          <thead>
            <tr>
              <th scope="col">Rank</th>
              <th scope="col">Program</th>
              <th scope="col">Record</th>
              <th scope="col">Resume Index</th>
              <th scope="col">Strength</th>
              <th scope="col">Playoff Odds</th>
            </tr>
          </thead>
          <tbody>
            {data.rankings.map((entry) => {
              const trend = formatTrend(entry.trend);
              return (
                <tr key={entry.team} className={entry.rank <= 4 ? 'cfp-table__row--playoff' : undefined}>
                  <td data-title="Rank">
                    <span className="cfp-rank">{entry.rank}</span>
                  </td>
                  <td data-title="Program">
                    <div className="cfp-team-cell">
                      <span className={`cfp-trend ${trend.className}`} aria-label={trend.description}>
                        {trend.label}
                      </span>
                      <div>
                        <div className="cfp-team-name">{entry.team}</div>
                        <div className="cfp-team-meta">{entry.conference} • SOS #{entry.sosRank}</div>
                      </div>
                    </div>
                  </td>
                  <td data-title="Record">
                    <span className="cfp-pill">{entry.record}</span>
                  </td>
                  <td data-title="Resume Index">
                    <div className="cfp-progress" aria-label={`Resume score ${entry.resumeScore.toFixed(1)}`}>
                      <div
                        className="cfp-progress__bar"
                        style={{ width: `${Math.min(entry.resumeScore * 3, 100)}%` }}
                      />
                      <span>{entry.resumeScore.toFixed(1)}</span>
                    </div>
                    <p className="cfp-quality-wins">{entry.qualityWins.join(' • ')}</p>
                  </td>
                  <td data-title="Strength">
                    <div className="cfp-strength">
                      <span>{entry.powerRating.toFixed(1)} PWR</span>
                      <span>{entry.projectedSeed} seed</span>
                    </div>
                  </td>
                  <td data-title="Playoff Odds">
                    <span className="cfp-odds">{formatProbability(entry.playoffProbability)}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <footer className="cfp-footnote">
        {data.modelBaseline.notes.map((note) => (
          <p key={note}>{note}</p>
        ))}
      </footer>
    </section>
  );
}
