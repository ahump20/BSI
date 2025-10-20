import { useEffect, useMemo, useState } from 'react';
import './RegressionAnalytics.css';

type TeamOption = {
  slug: string;
  name: string;
  abbreviation: string;
  conference: string;
  record: string;
  conferenceRecord: string;
  overallWins: number;
  overallLosses: number;
  conferenceWins: number;
  conferenceLosses: number;
  overallWinPct: number;
  conferenceWinPct: number;
  gamesBack: number;
  streak: string;
};

type Contribution = {
  feature: string;
  weight: number;
  impact: number;
  zScore: number;
};

type ReliabilityPoint = {
  bucketStart: number;
  bucketEnd: number;
  predicted: number;
  actual: number;
  count: number;
};

type RegressionModel = {
  modelKey: string;
  predictedWinPct?: number;
  actualWinPct?: number;
  residual?: number;
  leagueAverage?: number;
  probability?: number;
  actual?: number;
  contributions: Contribution[];
  artifact: {
    model_key: string;
    model_id: string;
    algo: string;
    coefficients: Record<string, number>;
    metrics: Record<string, number>;
    calibration?: {
      type: string;
      params?: { a: number; b: number };
      reliabilityCurve?: ReliabilityPoint[];
      note?: string;
    };
  };
};

type RegressionAnalyticsPayload = {
  regression?: {
    dataset: {
      conference: string;
      season: number;
      lastUpdated: string;
      source?: string;
    };
    team: {
      name: string;
      slug: string;
      abbreviation: string;
      conference: string;
      record: string;
      conferenceRecord: string;
      overallWins: number;
      overallLosses: number;
      conferenceWins: number;
      conferenceLosses: number;
      overallWinPct: number;
      conferenceWinPct: number;
      gamesBack: number;
      streak: string;
    };
    models: {
      winPctRidge: RegressionModel;
      topEightLogit: RegressionModel;
    };
  };
  mlPredictions?: {
    seasonWinPct?: {
      predictedWinPct: number;
      actualWinPct: number;
      residual: number;
      leagueAverage: number;
      topContributors: Contribution[];
      modelKey: string;
      modelId: string;
    };
    topEightSeed?: {
      probability: number;
      actual: number;
      topContributors: Contribution[];
      modelKey: string;
      modelId: string;
      calibration?: {
        type: string;
        params?: { a: number; b: number };
        reliabilityCurve?: ReliabilityPoint[];
      };
    };
  };
  composite?: {
    compositeRating: number;
    components: Record<string, number>;
    interpretation: string;
  };
};

const DEFAULT_TEAM = 'texas-longhorns';

const formatPercent = (value: number | undefined, digits = 1) =>
  typeof value === 'number' ? `${(value * 100).toFixed(digits)}%` : '—';

const formatNumber = (value: number | undefined, digits = 2) =>
  typeof value === 'number' ? value.toFixed(digits) : '—';

type RegressionTeam = NonNullable<RegressionAnalyticsPayload['regression']>['team'];

const formatRecord = (team?: RegressionTeam) =>
  team ? `${team.record} (${formatPercent(team.overallWinPct, 1)})` : '—';

const formatGamesBack = (value?: number) =>
  typeof value === 'number' ? value.toFixed(1) : '—';

export default function RegressionAnalytics() {
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [metadata, setMetadata] = useState<{ conference?: string; season?: number; lastUpdated?: string } | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string>(DEFAULT_TEAM);
  const [analytics, setAnalytics] = useState<RegressionAnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTeams = async () => {
      try {
        const response = await fetch('/api/analytics/ncaa_baseball/teams');
        const payload = await response.json();
        if (!payload.success) {
          throw new Error(payload.error || 'Unable to load teams');
        }
        const teamOptions: TeamOption[] = payload.data ?? [];
        setTeams(teamOptions);
        setMetadata(payload.metadata ?? null);

        if (!teamOptions.find((team) => team.slug === DEFAULT_TEAM) && teamOptions[0]) {
          setSelectedTeam(teamOptions[0].slug);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load team options');
      }
    };

    loadTeams();
  }, []);

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!selectedTeam) return;
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/team/ncaa_baseball/${selectedTeam}/analytics`);
        const payload = await response.json();
        if (!payload.success) {
          throw new Error(payload.error || 'Analytics unavailable');
        }
        setAnalytics(payload.data?.analytics as RegressionAnalyticsPayload);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
        setAnalytics(null);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [selectedTeam]);

  const ridgeModel = analytics?.regression?.models.winPctRidge;
  const logitModel = analytics?.regression?.models.topEightLogit;
  const composite = analytics?.composite;

  const coefficientRows = useMemo(() => {
    if (!ridgeModel || !logitModel) return [];
    const featureKeys = Array.from(
      new Set([
        ...Object.keys(ridgeModel.artifact.coefficients),
        ...Object.keys(logitModel.artifact.coefficients),
      ]),
    );
    return featureKeys.map((feature) => ({
      feature,
      ridge: ridgeModel.artifact.coefficients[feature],
      logit: logitModel.artifact.coefficients[feature],
    }));
  }, [ridgeModel, logitModel]);

  const reliability = logitModel?.artifact.calibration?.reliabilityCurve || [];

  return (
    <div className="regression-analytics">
      <header className="regression-header">
        <div>
          <h2>College Baseball Regression Engine</h2>
          <p>Ridge win percentage and logistic host probability driven by SEC 2025 standings</p>
        </div>
        <div className="metadata-grid">
          <div>
            <span className="label">Conference</span>
            <span className="value">{metadata?.conference ?? '—'}</span>
          </div>
          <div>
            <span className="label">Season</span>
            <span className="value">{metadata?.season ?? '—'}</span>
          </div>
          <div>
            <span className="label">Dataset Updated</span>
            <span className="value">{metadata?.lastUpdated ?? '—'}</span>
          </div>
        </div>
      </header>

      <section className="team-selector">
        <label htmlFor="regression-team">Select Program</label>
        <select
          id="regression-team"
          value={selectedTeam}
          onChange={(event) => setSelectedTeam(event.target.value)}
        >
          {teams.map((team) => (
            <option key={team.slug} value={team.slug}>
              {team.name} ({team.record})
            </option>
          ))}
        </select>
      </section>

      {error && <div className="regression-error">{error}</div>}

      {loading ? (
        <div className="regression-loading">Crunching ridge/logit outputs…</div>
      ) : (
        analytics && ridgeModel && logitModel && (
          <>
            <section className="summary-cards">
              <article className="summary-card">
                <h3>Season Win Percentage</h3>
                <div className="summary-values">
                  <div>
                    <span className="label">Predicted</span>
                    <span className="value emphasize">{formatPercent(ridgeModel.predictedWinPct)}</span>
                  </div>
                  <div>
                    <span className="label">Actual</span>
                    <span className="value">{formatPercent(ridgeModel.actualWinPct)}</span>
                  </div>
                </div>
                <div className="summary-footer">
                  <span>League Avg: {formatPercent(ridgeModel.leagueAverage)}</span>
                  <span>
                    Delta: {formatPercent(ridgeModel.residual !== undefined ? ridgeModel.residual : undefined)}
                  </span>
                </div>
              </article>

              <article className="summary-card">
                <h3>Top-8 Host Probability</h3>
                <div className="summary-values">
                  <div>
                    <span className="label">Probability</span>
                    <span className="value emphasize">{formatPercent(logitModel.probability)}</span>
                  </div>
                  <div>
                    <span className="label">Outcome</span>
                    <span className="value">{logitModel.actual === 1 ? 'Hosted' : 'Did not host'}</span>
                  </div>
                </div>
                {logitModel.artifact.calibration?.params && (
                  <div className="summary-footer">
                    <span>
                      Platt a: {formatNumber(logitModel.artifact.calibration.params.a, 3)} · b:{' '}
                      {formatNumber(logitModel.artifact.calibration.params.b, 3)}
                    </span>
                  </div>
                )}
              </article>

              {composite && (
                <article className="summary-card">
                  <h3>Composite Rating</h3>
                  <div className="summary-values">
                    <div>
                      <span className="label">Rating</span>
                      <span className="value emphasize">{composite.compositeRating}</span>
                    </div>
                    <div>
                      <span className="label">Tier</span>
                      <span className="value">{composite.interpretation}</span>
                    </div>
                  </div>
                  <div className="summary-footer">
                    {Object.entries(composite.components).map(([key, value]) => (
                      <span key={key}>{`${key}: ${formatNumber(value, 1)}`}</span>
                    ))}
                  </div>
                </article>
              )}
            </section>

            <section className="detail-grid">
              <article className="detail-card">
                <h3>Ridge Model — Top Contributors</h3>
                <ul className="contribution-list">
                  {ridgeModel.contributions.map((item) => (
                    <li key={item.feature}>
                      <span className="feature">{item.feature}</span>
                      <span className="impact">Impact: {formatNumber(item.impact, 3)}</span>
                      <span className="zscore">z: {formatNumber(item.zScore, 2)}</span>
                    </li>
                  ))}
                </ul>
              </article>

              <article className="detail-card">
                <h3>Logistic Model — Top Contributors</h3>
                <ul className="contribution-list">
                  {logitModel.contributions.map((item) => (
                    <li key={item.feature}>
                      <span className="feature">{item.feature}</span>
                      <span className="impact">Impact: {formatNumber(item.impact, 3)}</span>
                      <span className="zscore">z: {formatNumber(item.zScore, 2)}</span>
                    </li>
                  ))}
                </ul>
              </article>

              <article className="detail-card detail-span">
                <h3>Coefficient Table</h3>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Feature</th>
                        <th>Ridge Weight</th>
                        <th>Logit Weight</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coefficientRows.map((row) => (
                        <tr key={row.feature}>
                          <td>{row.feature}</td>
                          <td>{formatNumber(row.ridge, 4)}</td>
                          <td>{formatNumber(row.logit, 4)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>

              <article className="detail-card detail-span">
                <h3>Logistic Reliability (Platt Calibration)</h3>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Bucket</th>
                        <th>Predicted</th>
                        <th>Actual</th>
                        <th>Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reliability.map((point) => (
                        <tr key={`${point.bucketStart}-${point.bucketEnd}`}>
                          <td>
                            {formatNumber(point.bucketStart, 2)} – {formatNumber(point.bucketEnd, 2)}
                          </td>
                          <td>{formatPercent(point.predicted)}</td>
                          <td>{formatPercent(point.actual)}</td>
                          <td>{point.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            </section>

            <section className="team-context">
              <h3>Program Context</h3>
              <div className="context-grid">
                <div>
                  <span className="label">Overall</span>
                  <span className="value">{formatRecord(analytics.regression?.team)}</span>
                </div>
                <div>
                  <span className="label">Conference</span>
                  <span className="value">
                    {analytics.regression?.team.conferenceRecord} (
                    {formatPercent(analytics.regression?.team.conferenceWinPct, 1)})
                  </span>
                </div>
                <div>
                  <span className="label">Games Back</span>
                  <span className="value">{formatGamesBack(analytics.regression?.team.gamesBack)}</span>
                </div>
                <div>
                  <span className="label">Streak</span>
                  <span className="value">{analytics.regression?.team.streak ?? '—'}</span>
                </div>
              </div>
            </section>
          </>
        )
      )}
    </div>
  );
}
