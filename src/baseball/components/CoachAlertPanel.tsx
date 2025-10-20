import { useEffect, useMemo, useState } from 'react';
import type { CombinedPitcherIntel } from '../analytics/biomechAlertEngine';
import { fetchBiomechMetrics } from '../analytics/biomechRepository';
import { generateIntelReport } from '../analytics/biomechAlertEngine';
import { samplePitcherWorkload, sampleUmpireReport } from '../analytics/sampleData';
import './CoachAlertPanel.css';

export function CoachAlertPanel() {
  const [intel, setIntel] = useState<CombinedPitcherIntel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetchBiomechMetrics({ signal: controller.signal })
      .then((payload) => {
        const report = generateIntelReport(samplePitcherWorkload, payload.pitchers, sampleUmpireReport);
        setIntel(report);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, []);

  const headline = useMemo(() => {
    if (!intel.length) {
      return 'No actionable pitching alerts right now.';
    }
    const hottest = intel[0];
    if (hottest.riskTier === 'red') {
      return `${hottest.name} is at redline fatigue. Start bullpen backup and throttle usage.`;
    }
    if (hottest.riskTier === 'amber') {
      return `${hottest.name} trending toward stress. Plan leverage innings carefully.`;
    }
    return `${hottest.name} remains efficient. Keep attacking the plan.`;
  }, [intel]);

  return (
    <section className="coach-alert-panel">
      <header className="coach-alert-panel__header">
        <h2>Diamond Pro — Pitching Intel</h2>
        <p>{loading ? 'Loading biomechanics and workload trends…' : headline}</p>
      </header>

      {error && (
        <div className="coach-alert-panel__error" role="alert">
          <strong>Unable to pull biomechanics feed:</strong> {error}
        </div>
      )}

      {!loading && !error && (
        <ul className="coach-alert-panel__list">
          {intel.map((entry) => (
            <li key={entry.pitcherId} className={`coach-alert-panel__card coach-alert-panel__card--${entry.riskTier}`}>
              <div className="coach-alert-panel__card-header">
                <div>
                  <h3>{entry.name}</h3>
                  <span className="coach-alert-panel__team">{entry.team}</span>
                </div>
                <div className="coach-alert-panel__score">
                  <span className="coach-alert-panel__score-value">{Math.round(entry.combinedRiskScore * 100)}%</span>
                  <span className="coach-alert-panel__score-label">Risk</span>
                </div>
              </div>

              <dl className="coach-alert-panel__metrics">
                <div>
                  <dt>Workload Index</dt>
                  <dd>{entry.workloadIndex}</dd>
                </div>
                <div>
                  <dt>Biomech Stress</dt>
                  <dd>{Math.round(entry.biomechStressScore * 100)}%</dd>
                </div>
                <div>
                  <dt>Rest Days</dt>
                  <dd>{entry.recommendedRestDays}</dd>
                </div>
              </dl>

              {entry.leverageZone && (
                <div className="coach-alert-panel__leverage">
                  <strong>Leverage Edge:</strong> {entry.leverageZone.message}
                </div>
              )}

              {entry.alerts.length > 0 && (
                <ul className="coach-alert-panel__alerts">
                  {entry.alerts.map((alert, index) => (
                    <li key={index}>{alert}</li>
                  ))}
                </ul>
              )}

              <footer className="coach-alert-panel__footer">
                Last biomechanics capture: {new Date(entry.metadata.lastBiomechCapture).toLocaleString()} · Trend {entry.metadata.efficiencyTrend > 0 ? '+' : ''}{(entry.metadata.efficiencyTrend * 100).toFixed(1)}%
              </footer>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default CoachAlertPanel;
