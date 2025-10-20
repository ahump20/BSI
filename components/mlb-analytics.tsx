'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { LineChart, BarChart, TrendingUp, Database, Cpu, Zap, Activity } from 'lucide-react';

type TabKey = 'dashboard' | 'predictions' | 'advanced';

type NarrativeTone = 'positive' | 'neutral' | 'negative';

interface NarrativeSnippet {
  id: string;
  headline?: string;
  body: string;
  tone: NarrativeTone;
}

interface TeamRecord {
  wins?: number;
  losses?: number;
}

interface TeamMetrics {
  runsScored?: number;
  runsAllowed?: number;
  homeRuns?: number;
  stolenBases?: number;
  battingAvg?: number;
  era?: number;
  fip?: number;
  woba?: number;
  wrcPlus?: number;
  babip?: number;
}

interface RegressionCoefficient {
  feature: string;
  coefficient: number;
}

interface CalibratedProbability {
  label: string;
  value: number;
}

interface PythagoreanExpectation {
  expectedWins?: number;
  actualWins?: number;
}

interface RegressionArtifact {
  teamCode: string;
  teamName: string;
  updatedAt?: string;
  record?: TeamRecord;
  metrics?: TeamMetrics;
  pythagoreanDelta?: number;
  pythagoreanExpectation?: PythagoreanExpectation;
  coefficients: RegressionCoefficient[];
  calibratedProbabilities: CalibratedProbability[];
  narratives: NarrativeSnippet[];
}

type UnknownRecord = Record<string, unknown>;

const API_BASE = '/api/v1/baseball/mlb/predictions';

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
};

const toStringValue = (value: unknown): string | undefined => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return undefined;
};

const getRecordProperty = (
  source: UnknownRecord | undefined,
  key: string
): UnknownRecord | undefined => {
  if (!source) {
    return undefined;
  }

  const value = source[key];
  return isRecord(value) ? value : undefined;
};
const normalizeCoefficients = (raw: UnknownRecord): RegressionCoefficient[] => {
  const regressionRecord = getRecordProperty(raw, 'regression') ?? getRecordProperty(raw, 'model');
  const analyticsRecord = getRecordProperty(raw, 'analytics');
  const artifactRecord = getRecordProperty(raw, 'artifact');
  const payloadRecord = getRecordProperty(raw, 'payload');
  const coefficientSources: unknown[] = [
    raw.coefficients,
    regressionRecord?.coefficients,
    analyticsRecord?.coefficients,
    artifactRecord?.coefficients,
    payloadRecord?.coefficients,
    regressionRecord?.feature_importances
  ];

  const coefficients = new Map<string, number>();

  for (const source of coefficientSources) {
    if (!source) {
      continue;
    }

    if (Array.isArray(source)) {
      for (const entry of source) {
        if (!isRecord(entry)) {
          continue;
        }

        const feature =
          toStringValue(entry.feature) ??
          toStringValue(entry.name) ??
          toStringValue(entry.key) ??
          toStringValue(entry.metric);
        const coefficient =
          toNumber(entry.coefficient) ??
          toNumber(entry.value) ??
          toNumber(entry.weight) ??
          toNumber(entry.score);

        if (feature && coefficient !== undefined) {
          coefficients.set(feature, coefficient);
        }
      }
    } else if (isRecord(source)) {
      for (const [feature, value] of Object.entries(source)) {
        const coefficient = toNumber(value);
        if (coefficient !== undefined) {
          coefficients.set(feature, coefficient);
        }
      }
    }
  }

  const intercept =
    toNumber(regressionRecord?.intercept) ??
    toNumber(regressionRecord?.bias) ??
    toNumber(regressionRecord?.base);
  if (intercept !== undefined) {
    coefficients.set('intercept', intercept);
  }

  const normalized = Array.from(coefficients.entries()).map(([feature, coefficient]) => ({
    feature,
    coefficient
  }));

  normalized.sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient));

  return normalized;
};

const normalizeProbabilities = (raw: UnknownRecord): CalibratedProbability[] => {
  const regressionRecord = getRecordProperty(raw, 'regression');
  const analyticsRecord = getRecordProperty(raw, 'analytics');
  const probabilitySources: unknown[] = [
    raw.calibrated_probabilities,
    raw.calibratedProbabilities,
    raw.probabilities,
    raw.win_probabilities,
    regressionRecord?.calibrated_probabilities,
    analyticsRecord?.probabilities,
    analyticsRecord?.calibrated_probabilities
  ];

  const probabilities = new Map<string, number>();

  for (const source of probabilitySources) {
    if (!source) {
      continue;
    }

    if (Array.isArray(source)) {
      for (const entry of source) {
        if (!isRecord(entry)) {
          continue;
        }

        const label =
          toStringValue(entry.label) ??
          toStringValue(entry.name) ??
          toStringValue(entry.key) ??
          toStringValue(entry.type);
        const value =
          toNumber(entry.value) ??
          toNumber(entry.probability) ??
          toNumber(entry.score);

        if (label && value !== undefined) {
          probabilities.set(label, value);
        }
      }
    } else if (isRecord(source)) {
      for (const [label, value] of Object.entries(source)) {
        const numericValue = toNumber(value);
        if (numericValue !== undefined) {
          probabilities.set(label, numericValue);
        }
      }
    }
  }

  const normalized = Array.from(probabilities.entries()).map(([label, value]) => ({
    label,
    value
  }));

  normalized.sort((a, b) => b.value - a.value);

  return normalized;
};

const normalizeNarratives = (raw: UnknownRecord): NarrativeSnippet[] => {
  const analyticsRecord = getRecordProperty(raw, 'analytics');
  const analysisRecord = getRecordProperty(raw, 'analysis');
  const narrativeSources: unknown[] = [
    raw.narratives,
    raw.narrative_snippets,
    raw.narrativeSnippets,
    raw.insights,
    analysisRecord?.narratives,
    analyticsRecord?.narratives,
    analyticsRecord?.insights
  ];

  const snippets: NarrativeSnippet[] = [];

  const pushSnippet = (snippet: NarrativeSnippet) => {
    if (!snippets.find((existing) => existing.id === snippet.id)) {
      snippets.push(snippet);
    }
  };

  for (const source of narrativeSources) {
    if (!source) {
      continue;
    }

    if (Array.isArray(source)) {
      for (const entry of source) {
        if (typeof entry === 'string') {
          pushSnippet({
            id: `snippet-${snippets.length}`,
            body: entry,
            tone: 'neutral'
          });
          continue;
        }

        if (!isRecord(entry)) {
          continue;
        }

        const body =
          toStringValue(entry.body) ??
          toStringValue(entry.snippet) ??
          toStringValue(entry.text) ??
          toStringValue(entry.summary) ??
          toStringValue(entry.message);

        if (!body) {
          continue;
        }

        const headline =
          toStringValue(entry.headline) ??
          toStringValue(entry.title) ??
          toStringValue(entry.label);

        const toneValue = toStringValue(entry.tone ?? entry.sentiment);
        const tone: NarrativeTone = toneValue === 'positive' || toneValue === 'negative' ? toneValue : 'neutral';
        const id =
          toStringValue(entry.id) ??
          toStringValue(entry.key) ??
          toStringValue(entry.slug) ??
          toStringValue(entry.code) ??
          `snippet-${snippets.length}`;

        pushSnippet({
          id,
          headline,
          body,
          tone
        });
      }
    } else if (isRecord(source)) {
      const body =
        toStringValue(source.body) ??
        toStringValue(source.snippet) ??
        toStringValue(source.text) ??
        toStringValue(source.summary) ??
        toStringValue(source.message);

      if (!body) {
        continue;
      }

      const headline =
        toStringValue(source.headline) ??
        toStringValue(source.title) ??
        toStringValue(source.label);

      const toneValue = toStringValue(source.tone ?? source.sentiment);
      const tone: NarrativeTone = toneValue === 'positive' || toneValue === 'negative' ? toneValue : 'neutral';
      const id =
        toStringValue(source.id) ??
        toStringValue(source.key) ??
        toStringValue(source.slug) ??
        toStringValue(source.code) ??
        `snippet-${snippets.length}`;

      pushSnippet({
        id,
        headline,
        body,
        tone
      });
    }

    if (snippets.length) {
      break;
    }
  }

  return snippets;
};
const normalizeRecord = (raw: UnknownRecord): TeamRecord | undefined => {
  const metadataRecord = getRecordProperty(raw, 'metadata');
  const standingsRecord = getRecordProperty(raw, 'standings');
  const recordSources: unknown[] = [
    raw.record,
    raw.team_record,
    raw.teamRecord,
    metadataRecord?.record,
    standingsRecord,
    metadataRecord?.overall
  ];

  for (const source of recordSources) {
    if (!isRecord(source)) {
      continue;
    }

    const wins =
      toNumber(source.wins) ??
      toNumber(source.win) ??
      toNumber(source.total_wins) ??
      toNumber(source.overall_wins);
    const losses =
      toNumber(source.losses) ??
      toNumber(source.loss) ??
      toNumber(source.total_losses) ??
      toNumber(source.overall_losses);

    if (wins !== undefined || losses !== undefined) {
      return { wins, losses };
    }

    const overallRecord = getRecordProperty(source, 'overall');
    if (overallRecord) {
      const overallWins = toNumber(overallRecord.wins);
      const overallLosses = toNumber(overallRecord.losses);
      if (overallWins !== undefined || overallLosses !== undefined) {
        return { wins: overallWins, losses: overallLosses };
      }
    }
  }

  return undefined;
};

const normalizeMetrics = (raw: UnknownRecord): TeamMetrics | undefined => {
  const metadataRecord = getRecordProperty(raw, 'metadata');
  const analyticsRecord = getRecordProperty(raw, 'analytics');
  const statlineRecord = getRecordProperty(raw, 'statline');
  const metricsSources: unknown[] = [
    raw.metrics,
    raw.team_metrics,
    raw.teamMetrics,
    raw.team_stats,
    raw.teamStats,
    metadataRecord?.metrics,
    analyticsRecord?.team,
    statlineRecord,
    metadataRecord?.statline
  ];

  for (const source of metricsSources) {
    if (!isRecord(source)) {
      continue;
    }

    const metrics: TeamMetrics = {
      runsScored:
        toNumber(source.runs_scored) ??
        toNumber(source.runsScored) ??
        toNumber(source.runs_for) ??
        toNumber(source.runsFor),
      runsAllowed:
        toNumber(source.runs_allowed) ??
        toNumber(source.runsAllowed) ??
        toNumber(source.runs_against) ??
        toNumber(source.runsAgainst),
      homeRuns: toNumber(source.home_runs) ?? toNumber(source.homeRuns),
      stolenBases: toNumber(source.stolen_bases) ?? toNumber(source.stolenBases),
      battingAvg:
        toNumber(source.batting_avg) ??
        toNumber(source.battingAverage) ??
        toNumber(source.avg),
      era: toNumber(source.era),
      fip: toNumber(source.fip),
      woba: toNumber(source.woba) ?? toNumber(source.wOBA),
      wrcPlus: toNumber(source.wrc_plus) ?? toNumber(source.wRCPlus) ?? toNumber(source.wrc),
      babip: toNumber(source.babip)
    };

    if (Object.values(metrics).some((value) => value !== undefined)) {
      return metrics;
    }
  }

  return undefined;
};

const parseRegressionArtifact = (raw: UnknownRecord, fallbackTeam: string): RegressionArtifact => {
  const metadataRecord = getRecordProperty(raw, 'metadata');

  const teamCode =
    (toStringValue(raw.team) ??
      toStringValue(raw.team_code) ??
      toStringValue(raw.teamCode) ??
      toStringValue(metadataRecord?.team) ??
      fallbackTeam)
      .toUpperCase();

  const teamName =
    toStringValue(raw.team_name) ??
    toStringValue(raw.teamName) ??
    toStringValue(metadataRecord?.team_name) ??
    toStringValue(metadataRecord?.displayName) ??
    toStringValue(metadataRecord?.name) ??
    teamCode;

  const updatedAt =
    toStringValue(raw.updated_at) ??
    toStringValue(raw.generated_at) ??
    toStringValue(raw.generatedAt) ??
    toStringValue(raw.timestamp) ??
    toStringValue(metadataRecord?.generated_at);

  const pythagoreanRecord =
    getRecordProperty(raw, 'pythagorean') ??
    getRecordProperty(raw, 'pythagorean_expectation') ??
    getRecordProperty(raw, 'pythagoreanExpectation') ??
    getRecordProperty(raw, 'expectation');

  const pythagoreanDelta =
    toNumber(raw.pythagorean_delta) ??
    toNumber(raw.pythagoreanDelta) ??
    toNumber(pythagoreanRecord?.delta) ??
    toNumber(pythagoreanRecord?.pythagorean_delta);

  const expectedWins =
    toNumber(pythagoreanRecord?.expected_wins) ??
    toNumber(pythagoreanRecord?.expectedWins) ??
    toNumber(pythagoreanRecord?.wins_expected) ??
    toNumber(pythagoreanRecord?.pythagorean_wins);

  const actualWins =
    toNumber(pythagoreanRecord?.actual_wins) ??
    toNumber(pythagoreanRecord?.actualWins) ??
    toNumber(pythagoreanRecord?.observed_wins) ??
    toNumber(pythagoreanRecord?.observedWins) ??
    toNumber(pythagoreanRecord?.wins_actual) ??
    toNumber(pythagoreanRecord?.wins);

  return {
    teamCode,
    teamName,
    updatedAt,
    record: normalizeRecord(raw),
    metrics: normalizeMetrics(raw),
    pythagoreanDelta,
    pythagoreanExpectation:
      expectedWins !== undefined || actualWins !== undefined
        ? { expectedWins, actualWins }
        : undefined,
    coefficients: normalizeCoefficients(raw),
    calibratedProbabilities: normalizeProbabilities(raw),
    narratives: normalizeNarratives(raw)
  };
};

const extractArtifact = (payload: unknown, team: string): UnknownRecord => {
  if (!isRecord(payload)) {
    throw new Error('Invalid payload from predictions service.');
  }

  const normalizedTeam = team.toUpperCase();

  const artifacts = payload.artifacts;
  if (Array.isArray(artifacts)) {
    const matchingArtifact = artifacts.find((entry) => {
      if (!isRecord(entry)) {
        return false;
      }

      const candidateTeam =
        toStringValue(entry.team) ??
        toStringValue(entry.team_code) ??
        toStringValue(entry.teamCode) ??
        toStringValue(entry.code) ??
        toStringValue(entry.slug);

      return candidateTeam?.toUpperCase() === normalizedTeam;
    });

    if (matchingArtifact && isRecord(matchingArtifact)) {
      return matchingArtifact;
    }

    const firstRecord = artifacts.find(isRecord);
    if (firstRecord && isRecord(firstRecord)) {
      return firstRecord;
    }
  }

  const artifact = payload.artifact;
  if (isRecord(artifact)) {
    return artifact;
  }

  const data = payload.data;
  if (isRecord(data)) {
    return data;
  }

  return payload;
};

const formatNumber = (value?: number, digits = 1): string => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toFixed(digits);
  }

  return '—';
};

const formatProbability = (value?: number): string => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `${(value * 100).toFixed(1)}%`;
  }

  return '—';
};

const formatDelta = (value?: number): string => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)} wins`;
  }

  return '—';
};

const formatRecord = (record?: TeamRecord): string => {
  if (!record) {
    return '—';
  }

  const { wins, losses } = record;

  if (typeof wins === 'number' && typeof losses === 'number') {
    return `${wins}-${losses}`;
  }

  if (typeof wins === 'number') {
    return `${wins}-?`;
  }

  if (typeof losses === 'number') {
    return `?- ${losses}`;
  }

  return '—';
};
const MLBAnalyticsEngine: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [selectedTeam, setSelectedTeam] = useState<string>('STL');
  const [artifact, setArtifact] = useState<RegressionArtifact | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState<number>(0);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const loadArtifact = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE}?team=${encodeURIComponent(selectedTeam)}`, {
          headers: {
            Accept: 'application/json'
          },
          signal: controller.signal
        });

        if (!response.ok) {
          let message = `Unable to load regression data (status ${response.status}).`;

          try {
            const errorPayload = await response.json();
            if (isRecord(errorPayload) && typeof errorPayload.error === 'string') {
              message = errorPayload.error;
            }
          } catch {
            // Ignore JSON parse errors and retain the default message.
          }

          throw new Error(message);
        }

        const payload = (await response.json()) as unknown;
        if (!isActive) {
          return;
        }

        const artifactSource = extractArtifact(payload, selectedTeam);
        const parsedArtifact = parseRegressionArtifact(artifactSource, selectedTeam);
        setArtifact(parsedArtifact);
      } catch (caughtError) {
        if (caughtError instanceof DOMException && caughtError.name === 'AbortError') {
          return;
        }

        if (!isActive) {
          return;
        }

        const message = caughtError instanceof Error ? caughtError.message : 'Unexpected error while loading predictions.';
        setArtifact(null);
        setError(message);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void loadArtifact();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [selectedTeam, refreshIndex]);

  const record = artifact?.record;
  const metrics = artifact?.metrics;
  const primaryNarrative = artifact?.narratives[0];
  const probabilities = artifact?.calibratedProbabilities ?? [];
  const coefficients = artifact?.coefficients ?? [];

  const winProbability = useMemo(() => {
    if (!probabilities.length) {
      return null;
    }

    const priorityKeys = ['win', 'next_game', 'nextGame', 'moneyline', 'game_win', 'gameWin'];
    for (const key of priorityKeys) {
      const match = probabilities.find((probability) => probability.label.toLowerCase() === key.toLowerCase());
      if (match) {
        return match;
      }
    }

    return probabilities[0];
  }, [probabilities]);

  const winPct = useMemo(() => {
    if (!record || typeof record.wins !== 'number' || typeof record.losses !== 'number') {
      return undefined;
    }

    const games = record.wins + record.losses;
    if (games === 0) {
      return undefined;
    }

    return record.wins / games;
  }, [record]);

  const updatedAtLabel = useMemo(() => {
    if (!artifact?.updatedAt) {
      return null;
    }

    try {
      const date = new Date(artifact.updatedAt);
      if (Number.isNaN(date.getTime())) {
        return artifact.updatedAt;
      }

      return date.toLocaleString('en-US', {
        timeZone: 'America/Chicago',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    } catch {
      return artifact.updatedAt;
    }
  }, [artifact?.updatedAt]);

  const handleRefresh = () => {
    setRefreshIndex((index) => index + 1);
  };

  return (
    <div className="analytics-container">
      <div className="header">
        <div className="header-content">
          <h1>🔥 BlazeS MLB Analytics</h1>
          <p className="subtitle">Advanced Baseball Intelligence • Powered by Cloudflare Edge</p>
          <div className="tech-badges">
            <span className="badge"><Database size={14} /> D1 Database</span>
            <span className="badge"><Zap size={14} /> Workers KV</span>
            <span className="badge"><Cpu size={14} /> Workers AI</span>
            <span className="badge"><Activity size={14} /> Edge Analytics</span>
          </div>
          {updatedAtLabel && <div className="updated-at">Refreshed {updatedAtLabel} CT</div>}
        </div>
      </div>

      <div className="nav-tabs">
        <button
          className={activeTab === 'dashboard' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('dashboard')}
        >
          <TrendingUp size={16} /> Dashboard
        </button>
        <button
          className={activeTab === 'predictions' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('predictions')}
        >
          <LineChart size={16} /> Predictions
        </button>
        <button
          className={activeTab === 'advanced' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('advanced')}
        >
          <BarChart size={16} /> Advanced Stats
        </button>
      </div>

      <div className="team-selector">
        <label htmlFor="team-select">Select Team:</label>
        <select
          id="team-select"
          value={selectedTeam}
          onChange={(event) => setSelectedTeam(event.target.value)}
        >
          <option value="STL">St. Louis Cardinals</option>
          <option value="NYY">New York Yankees</option>
          <option value="LAD">Los Angeles Dodgers</option>
          <option value="BOS">Boston Red Sox</option>
        </select>
        <button className="refresh-button" onClick={handleRefresh} disabled={loading}>
          Refresh
        </button>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="loading-pulse" aria-hidden />
          <p>Crunching regression outputs at the edge…</p>
        </div>
      )}

      {!loading && error && (
        <div className="error-state">
          <p>{error}</p>
          <button className="retry-button" onClick={handleRefresh}>Retry</button>
        </div>
      )}
      {!loading && !error && artifact && (
        <>
          {activeTab === 'dashboard' && (
            <div className="content">
              <div className="team-header">
                <div>
                  <h2>{artifact.teamName}</h2>
                  <div className="record">
                    {formatRecord(record)}
                    {winPct !== undefined && (
                      <span className="pct">({(winPct * 100).toFixed(1)}%)</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="stats-grid">
                <div className="stat-card highlight">
                  <div className="stat-label">Pythagorean Delta</div>
                  <div className="stat-value">{formatDelta(artifact.pythagoreanDelta)}</div>
                  <div className="stat-meta">
                    Expected Wins: {formatNumber(artifact.pythagoreanExpectation?.expectedWins, 1)}
                  </div>
                </div>

                <div className="stat-card highlight">
                  <div className="stat-label">{winProbability ? winProbability.label : 'Win Probability'}</div>
                  <div className="stat-value">{formatProbability(winProbability?.value)}</div>
                  <div className="stat-meta">Edge-calibrated</div>
                </div>

                <div className="stat-card">
                  <div className="stat-label">Run Differential</div>
                  <div className="stat-value">
                    {typeof metrics?.runsScored === 'number' && typeof metrics?.runsAllowed === 'number'
                      ? (metrics.runsScored - metrics.runsAllowed).toFixed(0)
                      : '—'}
                  </div>
                  <div className="stat-meta">
                    {formatNumber(metrics?.runsScored, 0)} scored / {formatNumber(metrics?.runsAllowed, 0)} allowed
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-label">wOBA</div>
                  <div className="stat-value">{formatNumber(metrics?.woba, 3)}</div>
                  <div className="stat-meta">Weighted On-Base Avg</div>
                </div>

                <div className="stat-card">
                  <div className="stat-label">Team ERA</div>
                  <div className="stat-value">{formatNumber(metrics?.era, 2)}</div>
                  <div className="stat-meta">Earned Run Average</div>
                </div>

                <div className="stat-card">
                  <div className="stat-label">FIP</div>
                  <div className="stat-value">{formatNumber(metrics?.fip, 2)}</div>
                  <div className="stat-meta">Fielding Independent Pitching</div>
                </div>

                <div className="stat-card">
                  <div className="stat-label">Home Runs</div>
                  <div className="stat-value">{formatNumber(metrics?.homeRuns, 0)}</div>
                  <div className="stat-meta">
                    {typeof metrics?.homeRuns === 'number' ? (metrics.homeRuns / 162).toFixed(1) : '—'} per game
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-label">wRC+</div>
                  <div className="stat-value">{formatNumber(metrics?.wrcPlus, 0)}</div>
                  <div className="stat-meta">Weighted Runs Created+</div>
                </div>
              </div>

              <div className="ai-section">
                <div className="ai-header">
                  <h3><Cpu size={20} /> AI-Powered Insights</h3>
                  <button
                    className="btn-primary"
                    onClick={handleRefresh}
                    disabled={loading}
                  >
                    Refresh Insight
                  </button>
                </div>
                {primaryNarrative ? (
                  <div className={`ai-insight tone-${primaryNarrative.tone}`}>
                    <div className="insight-badge">Cloudflare Workers AI</div>
                    {primaryNarrative.headline && <strong>{primaryNarrative.headline}</strong>}
                    <p>{primaryNarrative.body}</p>
                  </div>
                ) : (
                  <div className="ai-insight empty">
                    <div className="insight-badge muted">Cloudflare Workers AI</div>
                    <p>No narrative returned yet. Tap refresh to run the edge model again.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'predictions' && (
            <div className="content">
              <h2>Monte Carlo Win Projections</h2>
              <div className="prediction-container">
                <div className="prediction-chart">
                  <div className="chart-title">Calibrated Win Probabilities</div>
                  <div className="bars dynamic">
                    {probabilities.map((probability) => (
                      <div key={probability.label} className="bar-item">
                        <div className="bar-label">{probability.label}</div>
                        <div className="bar-container">
                          <div
                            className="bar-fill"
                            style={{ width: `${Math.min(100, probability.value * 100)}%` }}
                          />
                        </div>
                        <div className="bar-pct">{formatProbability(probability.value)}</div>
                      </div>
                    ))}
                    {!probabilities.length && (
                      <div className="empty-state">No calibrated probabilities returned for this club.</div>
                    )}
                  </div>
                </div>

                <div className="prediction-stats">
                  <div className="pred-stat">
                    <div className="pred-label">Pythagorean Delta</div>
                    <div className="pred-value">{formatDelta(artifact.pythagoreanDelta)}</div>
                  </div>
                  <div className="pred-stat">
                    <div className="pred-label">Expected Wins</div>
                    <div className="pred-value">{formatNumber(artifact.pythagoreanExpectation?.expectedWins, 1)}</div>
                  </div>
                  <div className="pred-stat">
                    <div className="pred-label">Actual Wins</div>
                    <div className="pred-value">{formatNumber(artifact.pythagoreanExpectation?.actualWins ?? record?.wins, 1)}</div>
                  </div>
                </div>
              </div>

              <div className="methodology">
                <h4>Regression Coefficients</h4>
                <div className="coefficients-grid">
                  {coefficients.slice(0, 6).map((coefficient) => (
                    <div key={coefficient.feature} className="coefficient-card">
                      <span className="coefficient-feature">{coefficient.feature}</span>
                      <span className="coefficient-value">{formatNumber(coefficient.coefficient, 3)}</span>
                    </div>
                  ))}
                  {!coefficients.length && (
                    <div className="empty-state">Edge worker did not return coefficient weights for this request.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="content">
              <h2>Advanced Sabermetrics</h2>

              <div className="advanced-grid">
                <div className="advanced-section">
                  <h3>Offensive Metrics</h3>
                  <table className="stats-table">
                    <tbody>
                      <tr>
                        <td>Batting Average</td>
                        <td>{formatNumber(metrics?.battingAvg, 3)}</td>
                        <td className="rank">—</td>
                      </tr>
                      <tr>
                        <td>wOBA</td>
                        <td>{formatNumber(metrics?.woba, 3)}</td>
                        <td className="rank">—</td>
                      </tr>
                      <tr>
                        <td>wRC+</td>
                        <td>{formatNumber(metrics?.wrcPlus, 0)}</td>
                        <td className="rank">—</td>
                      </tr>
                      <tr>
                        <td>BABIP</td>
                        <td>{formatNumber(metrics?.babip, 3)}</td>
                        <td className="rank">—</td>
                      </tr>
                      <tr>
                        <td>ISO</td>
                        <td>0.148</td>
                        <td className="rank">—</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="advanced-section">
                  <h3>Pitching Metrics</h3>
                  <table className="stats-table">
                    <tbody>
                      <tr>
                        <td>ERA</td>
                        <td>{formatNumber(metrics?.era, 2)}</td>
                        <td className="rank bad">—</td>
                      </tr>
                      <tr>
                        <td>FIP</td>
                        <td>{formatNumber(metrics?.fip, 2)}</td>
                        <td className="rank bad">—</td>
                      </tr>
                      <tr>
                        <td>WHIP</td>
                        <td>1.42</td>
                        <td className="rank bad">—</td>
                      </tr>
                      <tr>
                        <td>K/9</td>
                        <td>8.2</td>
                        <td className="rank">—</td>
                      </tr>
                      <tr>
                        <td>HR/9</td>
                        <td>1.3</td>
                        <td className="rank bad">—</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="performance-analysis">
                <h3>Performance Analysis</h3>
                <div className="analysis-box">
                  <div className="analysis-item">
                    <div className="analysis-label">Offense vs League</div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: '45%', background: '#ef4444' }} />
                    </div>
                    <div className="analysis-value">Below Average (-5%)</div>
                  </div>
                  <div className="analysis-item">
                    <div className="analysis-label">Pitching vs League</div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: '38%', background: '#ef4444' }} />
                    </div>
                    <div className="analysis-value">Well Below Average (-12%)</div>
                  </div>
                  <div className="analysis-item">
                    <div className="analysis-label">Defense vs League</div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: '52%', background: '#fbbf24' }} />
                    </div>
                    <div className="analysis-value">Slightly Above Average (+2%)</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      <div className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>Architecture</h4>
            <ul>
              <li>Cloudflare Workers - Edge API</li>
              <li>D1 - SQL Database</li>
              <li>Workers KV - Cache Layer</li>
              <li>Workers AI - ML Inference</li>
              <li>R2 - Historical Data</li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Performance</h4>
            <ul>
              <li>Global edge deployment</li>
              <li>&lt;50ms API response time</li>
              <li>Intelligent caching strategy</li>
              <li>Real-time stat updates</li>
              <li>99.99% uptime SLA</li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Data Sources</h4>
            <ul>
              <li>MLB Stats API</li>
              <li>FanGraphs Leaderboards</li>
              <li>Baseball Reference</li>
              <li>Statcast Database</li>
              <li>Custom aggregations</li>
            </ul>
          </div>
        </div>
        <div className="footer-note">
          © 2025 blazesportsintel.com • Built with Cloudflare Developer Platform
        </div>
      </div>

      <style jsx>{`
        .analytics-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 50%, #0a0a0a 100%);
          color: #fff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .header {
          background: rgba(255, 255, 255, 0.03);
          border-bottom: 1px solid rgba(255, 140, 0, 0.2);
          padding: 30px 20px;
        }

        .header-content {
          max-width: 1400px;
          margin: 0 auto;
        }

        h1 {
          margin: 0 0 10px 0;
          font-size: 2.5em;
          background: linear-gradient(45deg, #ff8c00, #ff4500);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .subtitle {
          margin: 0 0 15px 0;
          color: #aaa;
          font-size: 1.1em;
        }

        .tech-badges {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          background: rgba(255, 140, 0, 0.1);
          border: 1px solid rgba(255, 140, 0, 0.3);
          border-radius: 15px;
          font-size: 0.85em;
          color: #ff8c00;
        }

        .updated-at {
          margin-top: 12px;
          color: #fbbf24;
          font-size: 0.9em;
          letter-spacing: 0.02em;
        }

        .nav-tabs {
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .tab {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #aaa;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .tab:hover {
          border-color: rgba(255, 191, 36, 0.4);
          color: #fbbf24;
        }

        .tab.active {
          background: rgba(255, 191, 36, 0.12);
          border-color: rgba(255, 191, 36, 0.5);
          color: #fbbf24;
        }

        .team-selector {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 20px 10px;
          display: flex;
          align-items: center;
          gap: 12px;
          color: #ddd;
        }

        .team-selector select {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #fff;
          padding: 8px 12px;
          border-radius: 6px;
        }

        .refresh-button {
          padding: 8px 16px;
          background: rgba(251, 191, 36, 0.16);
          border: 1px solid rgba(251, 191, 36, 0.45);
          border-radius: 6px;
          color: #fbbf24;
          font-weight: 600;
          letter-spacing: 0.02em;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .refresh-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
        }

        .team-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 20px;
        }

        .team-header h2 {
          margin: 0;
          font-size: 2em;
        }

        .record {
          font-size: 1.2em;
          color: #fbbf24;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .pct {
          color: #9ca3af;
          font-size: 0.85em;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 16px;
        }

        .stat-card {
          background: rgba(15, 23, 42, 0.65);
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.3);
        }

        .stat-card.highlight {
          border-color: rgba(251, 191, 36, 0.5);
          background: rgba(251, 191, 36, 0.12);
        }

        .stat-label {
          font-size: 0.9em;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 10px;
        }

        .stat-value {
          font-size: 1.8em;
          font-weight: 700;
        }

        .stat-meta {
          margin-top: 10px;
          font-size: 0.85em;
          color: #cbd5f5;
        }

        .ai-section {
          margin-top: 30px;
          background: rgba(17, 24, 39, 0.75);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 16px;
          padding: 24px;
        }

        .ai-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .btn-primary {
          padding: 10px 18px;
          border-radius: 8px;
          border: 1px solid rgba(59, 130, 246, 0.4);
          background: rgba(59, 130, 246, 0.15);
          color: #93c5fd;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .ai-insight {
          border-radius: 12px;
          padding: 18px;
          background: rgba(30, 41, 59, 0.9);
          border: 1px solid rgba(59, 130, 246, 0.3);
          line-height: 1.6;
        }

        .ai-insight strong {
          display: block;
          margin-bottom: 8px;
          font-size: 1.1em;
        }

        .ai-insight.empty {
          border-color: rgba(148, 163, 184, 0.2);
          color: #cbd5f5;
        }

        .insight-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 0.75em;
          letter-spacing: 0.05em;
          background: rgba(59, 130, 246, 0.15);
          border: 1px solid rgba(59, 130, 246, 0.3);
          color: #93c5fd;
          margin-bottom: 10px;
        }

        .insight-badge.muted {
          color: #a1a1aa;
          border-color: rgba(148, 163, 184, 0.2);
          background: rgba(148, 163, 184, 0.08);
        }

        .prediction-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }

        .prediction-chart {
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid rgba(148, 163, 184, 0.25);
          border-radius: 16px;
          padding: 20px;
        }

        .chart-title {
          font-weight: 600;
          margin-bottom: 12px;
        }

        .bars.dynamic {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .bar-item {
          display: grid;
          grid-template-columns: 120px 1fr 70px;
          align-items: center;
          gap: 12px;
        }

        .bar-container {
          background: rgba(255, 255, 255, 0.06);
          border-radius: 999px;
          overflow: hidden;
          height: 12px;
        }

        .bar-fill {
          background: linear-gradient(90deg, #fbbf24 0%, #f97316 100%);
          height: 100%;
        }

        .bar-pct {
          text-align: right;
          color: #fbbf24;
          font-variant-numeric: tabular-nums;
        }

        .prediction-stats {
          background: rgba(17, 24, 39, 0.8);
          border: 1px solid rgba(251, 191, 36, 0.25);
          border-radius: 16px;
          padding: 20px;
          display: grid;
          gap: 16px;
        }

        .pred-label {
          font-size: 0.85em;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .pred-value {
          font-size: 1.6em;
          font-weight: 700;
        }

        .coefficients-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
          margin-top: 16px;
        }

        .coefficient-card {
          background: rgba(15, 23, 42, 0.75);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 12px;
          padding: 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .coefficient-feature {
          color: #cbd5f5;
        }

        .coefficient-value {
          color: #93c5fd;
          font-variant-numeric: tabular-nums;
        }

        .advanced-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }

        .advanced-section {
          background: rgba(17, 24, 39, 0.8);
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 16px;
          padding: 20px;
        }

        .stats-table {
          width: 100%;
          border-collapse: collapse;
          color: #e5e7eb;
        }

        .stats-table td {
          padding: 8px 0;
          border-bottom: 1px solid rgba(148, 163, 184, 0.1);
        }

        .rank {
          text-align: right;
          color: #9ca3af;
        }

        .rank.bad {
          color: #f87171;
        }

        .performance-analysis {
          margin-top: 24px;
        }

        .analysis-box {
          background: rgba(15, 23, 42, 0.65);
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 16px;
          padding: 20px;
          display: grid;
          gap: 16px;
        }

        .analysis-label {
          font-size: 0.9em;
          color: #cbd5f5;
        }

        .analysis-value {
          color: #fbbf24;
          margin-top: 6px;
        }

        .progress-bar {
          background: rgba(255, 255, 255, 0.06);
          border-radius: 999px;
          overflow: hidden;
          height: 10px;
          margin-top: 6px;
        }

        .progress-fill {
          height: 100%;
        }

        .loading-state,
        .error-state {
          max-width: 600px;
          margin: 40px auto;
          padding: 24px;
          border-radius: 16px;
          text-align: center;
        }

        .loading-state {
          background: rgba(30, 41, 59, 0.75);
          border: 1px solid rgba(59, 130, 246, 0.3);
          color: #93c5fd;
        }

        .loading-pulse {
          width: 32px;
          height: 32px;
          margin: 0 auto 16px;
          border-radius: 50%;
          background: radial-gradient(circle, #fbbf24 0%, rgba(251, 191, 36, 0) 70%);
          animation: pulse 1.2s ease-in-out infinite;
        }

        .error-state {
          background: rgba(55, 6, 6, 0.6);
          border: 1px solid rgba(220, 38, 38, 0.4);
          color: #fecaca;
        }

        .retry-button {
          margin-top: 12px;
          padding: 8px 16px;
          border-radius: 6px;
          border: 1px solid rgba(220, 38, 38, 0.4);
          background: rgba(220, 38, 38, 0.15);
          color: #fecaca;
          cursor: pointer;
        }

        .empty-state {
          color: #9ca3af;
          font-size: 0.9em;
          padding: 12px;
        }

        .footer {
          background: rgba(0, 0, 0, 0.6);
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          margin-top: 40px;
        }

        .footer-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 30px 20px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
        }

        .footer-section h4 {
          margin-bottom: 12px;
          color: #fbbf24;
          letter-spacing: 0.05em;
        }

        .footer-section ul {
          list-style: none;
          padding: 0;
          margin: 0;
          color: #9ca3af;
          line-height: 1.8;
        }

        .footer-note {
          text-align: center;
          padding: 20px;
          color: #6b7280;
          font-size: 0.85em;
        }

        @keyframes pulse {
          0% {
            transform: scale(0.9);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.1);
            opacity: 1;
          }
          100% {
            transform: scale(0.9);
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
};

export default MLBAnalyticsEngine;
