import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './SchedulingOptimizerPanel.css';

type StandingTeam = {
  id: string;
  name: string;
  conference?: string;
  rpiValue?: number | string;
  sorValue?: number | string;
  overallWins?: number;
  overallLosses?: number;
};

type ForecastSummary = {
  baseline: { wins: number; losses: number; rpi: number; sor: number };
  expected: { wins: number; losses: number; rpi: number; sor: number };
  delta: { wins: number; rpi: number; sor: number };
  distribution: {
    wins: { mean: number; p75: number; p90: number };
    rpi: { mean: number; p75: number; p90: number };
    sor: { mean: number; p75: number; p90: number };
  };
  scenarios: Array<{
    label: string;
    wins: number;
    losses: number;
    rpi: number;
    sor: number;
    probability: number;
  }>;
  meta: { iterations: number; mode: 'basic' | 'advanced'; cached: boolean; durationMs: number };
};

type OptimizerResponse = {
  success: boolean;
  data?: ForecastSummary;
  tierAccess?: { userTier: 'free' | 'diamond-pro'; advancedUnlocked: boolean };
  upgradeMessage?: string | null;
  performance?: { computeMs: number; totalMs: number; cached: boolean };
  error?: string;
  message?: string;
};

type OpponentSelection = {
  teamId: string;
  name: string;
  conference?: string;
  rpi: number;
  sor: number;
  games: number;
  location: 'home' | 'away' | 'neutral';
};

type SchedulingOptimizerPanelProps = {
  conference: string;
  teams: StandingTeam[];
};

const parseMetric = (value: number | string | undefined, fallback: number): number => {
  const parsed = typeof value === 'string' ? parseFloat(value) : value;
  return Number.isFinite(parsed) ? (parsed as number) : fallback;
};

const DEFAULT_OPPONENTS: OpponentSelection[] = [];

const SchedulingOptimizerPanel: React.FC<SchedulingOptimizerPanelProps> = ({
  conference,
  teams,
}) => {
  const [selectedTeamId, setSelectedTeamId] = useState<string>(() => teams?.[0]?.id ?? '');
  const [opponents, setOpponents] = useState<OpponentSelection[]>(DEFAULT_OPPONENTS);
  const [seriesLength, setSeriesLength] = useState<number>(3);
  const [iterations, setIterations] = useState<number>(900);
  const [isDiamondPro, setIsDiamondPro] = useState<boolean>(false);
  const [projection, setProjection] = useState<ForecastSummary | null>(null);
  const [upgradeMessage, setUpgradeMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const storedTier = window.localStorage.getItem('bsi.diamondPro');
        setIsDiamondPro(storedTier === 'true');
      }
    } catch (_storageError) {
      // Storage access can fail in private browsing; Diamond Pro defaults to false
    }
  }, []);

  useEffect(() => {
    if (!teams?.length) {
      return;
    }
    if (!selectedTeamId) {
      setSelectedTeamId(teams[0].id);
    }
  }, [teams, selectedTeamId]);

  const selectedTeam = useMemo(
    () => teams.find((team) => team.id === selectedTeamId),
    [teams, selectedTeamId]
  );

  const availableOpponents = useMemo(() => {
    return teams
      .filter((team) => team.id !== selectedTeamId)
      .map((team) => ({
        id: team.id,
        name: team.name,
        conference: team.conference ?? 'non-conference',
        rpi: parseMetric(team.rpiValue, 0.5),
        // If SOR value is missing, fall back to RPI value. This fallback is intentional and should be documented for maintainers.
        sor: parseMetric(team.sorValue ?? team.rpiValue, 0.5),
      }));
  }, [teams, selectedTeamId]);

  const addOpponent = useCallback(
    (teamId: string) => {
      if (!teamId) return;
      const opponentTeam = availableOpponents.find((team) => team.id === teamId);
      if (!opponentTeam) return;
      if (opponents.find((opponent) => opponent.teamId === teamId)) return;

      setOpponents((prev) => [
        ...prev,
        {
          teamId: opponentTeam.id,
          name: opponentTeam.name,
          conference: opponentTeam.conference,
          rpi: opponentTeam.rpi,
          sor: opponentTeam.sor,
          games: seriesLength,
          location: 'neutral',
        },
      ]);
    },
    [availableOpponents, opponents, seriesLength]
  );

  const updateOpponent = useCallback((teamId: string, updates: Partial<OpponentSelection>) => {
    setOpponents((prev) =>
      prev.map((opponent) => (opponent.teamId === teamId ? { ...opponent, ...updates } : opponent))
    );
  }, []);

  const removeOpponent = useCallback((teamId: string) => {
    setOpponents((prev) => prev.filter((opponent) => opponent.teamId !== teamId));
  }, []);

  const handleRunSimulation = useCallback(async () => {
    if (!selectedTeam) {
      setError('Select a team to optimize.');
      return;
    }

    if (!opponents.length) {
      setError('Add at least one proposed opponent.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        teamId: selectedTeam.id,
        conference,
        currentMetrics: {
          wins: parseMetric(selectedTeam.overallWins, 0),
          losses: parseMetric(selectedTeam.overallLosses, 0),
          rpi: parseMetric(selectedTeam.rpiValue, 0.5),
          sor: parseMetric(selectedTeam.sorValue ?? selectedTeam.rpiValue, 0.5),
        },
        futureOpponents: opponents.map((opponent) => ({
          teamId: opponent.teamId,
          name: opponent.name,
          conference: opponent.conference,
          rpi: opponent.rpi,
          sor: opponent.sor,
          games: opponent.games,
          location: opponent.location,
        })),
        userTier: isDiamondPro ? 'diamond-pro' : 'free',
        iterations: isDiamondPro ? iterations : undefined,
      };

      const response = await fetch('/api/v1/scheduling/optimizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result: OptimizerResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || result.error || 'Simulation failed');
      }

      if (result.tierAccess) {
        setIsDiamondPro(result.tierAccess.advancedUnlocked);
      }

      setProjection(result.data ?? null);
      setUpgradeMessage(result.upgradeMessage ?? null);
    } catch (simulationError) {
      // Error is surfaced via setError below
      setError(
        simulationError instanceof Error ? simulationError.message : 'Unable to run simulation'
      );
    } finally {
      setIsLoading(false);
    }
  }, [conference, selectedTeam, opponents, isDiamondPro, iterations]);

  const renderMetricBar = useCallback(
    (
      label: string,
      baseValue: number,
      change: number,
      format: (value: number) => string,
      positiveBetter = true
    ) => {
      const magnitude = Math.min(Math.abs(change) * (positiveBetter ? 160 : 220), 160);
      const directionClass = change >= 0 ? 'positive' : 'negative';
      return (
        <div className="optimizer-bar" key={label}>
          <div className="optimizer-bar-header">
            <span>{label}</span>
            <span className={`optimizer-delta ${directionClass}`}>
              {change >= 0 ? '+' : ''}
              {format(change)}
            </span>
          </div>
          <div className="optimizer-bar-track">
            <div
              className={`optimizer-bar-fill ${directionClass}`}
              style={{ width: `${magnitude}%` }}
            />
            <span className="optimizer-bar-baseline">Baseline: {format(baseValue)}</span>
          </div>
        </div>
      );
    },
    []
  );

  const scenarioHighlights = useMemo(() => {
    if (!projection?.scenarios?.length) return [];
    return projection.scenarios.filter((scenario) => scenario.label !== 'baseline').slice(0, 3);
  }, [projection]);

  return (
    <section className="scheduling-optimizer" aria-label="Scheduling optimizer">
      <header className="optimizer-header">
        <div>
          <h3>Scheduling Optimizer</h3>
          <p>Project RPI/SOR impact before you lock non-conference dates.</p>
        </div>
        <div className="optimizer-tier" role="status">
          <span className={isDiamondPro ? 'tier-pro' : 'tier-free'}>
            {isDiamondPro ? 'Diamond Pro Monte Carlo' : 'Free Tier Snapshot'}
          </span>
        </div>
      </header>

      <div className="optimizer-grid">
        <div className="optimizer-control">
          <label htmlFor="team-select">Target program</label>
          <select
            id="team-select"
            className="optimizer-select"
            value={selectedTeamId}
            onChange={(event) => {
              setSelectedTeamId(event.target.value);
              setProjection(null);
            }}
          >
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>

        <div className="optimizer-control">
          <label htmlFor="series-length">Series length</label>
          <input
            id="series-length"
            type="range"
            min={1}
            max={4}
            step={1}
            value={seriesLength}
            onChange={(event) => {
              const value = Number(event.target.value);
              setSeriesLength(value);
              setOpponents((prev) => prev.map((opponent) => ({ ...opponent, games: value })));
            }}
          />
          <span className="optimizer-range-value">{seriesLength}-game sets</span>
        </div>

        <div className="optimizer-control">
          <label htmlFor="opponent-select">Add opponent</label>
          <select
            id="opponent-select"
            className="optimizer-select"
            value=""
            onChange={(event) => addOpponent(event.target.value)}
          >
            <option value="" disabled>
              Select non-conference matchup
            </option>
            {availableOpponents.map((opponent) => (
              <option key={opponent.id} value={opponent.id}>
                {opponent.name}
              </option>
            ))}
          </select>
        </div>

        <div className="optimizer-control">
          <label htmlFor="iteration-slider">Simulation depth</label>
          <input
            id="iteration-slider"
            type="range"
            min={100}
            max={2500}
            step={100}
            value={iterations}
            disabled={!isDiamondPro}
            onChange={(event) => setIterations(Number(event.target.value))}
          />
          <span className="optimizer-range-value">
            {isDiamondPro
              ? `${iterations.toLocaleString()} runs`
              : 'Upgrade to Diamond Pro for Monte Carlo'}
          </span>
        </div>
      </div>

      {opponents.length > 0 && (
        <div className="optimizer-opponents">
          {opponents.map((opponent) => (
            <div className="opponent-card" key={opponent.teamId}>
              <div className="opponent-header">
                <div>
                  <h4>{opponent.name}</h4>
                  <p>{opponent.conference}</p>
                </div>
                <button type="button" onClick={() => removeOpponent(opponent.teamId)}>
                  Remove
                </button>
              </div>
              <div className="opponent-grid">
                <label>
                  Location
                  <select
                    value={opponent.location}
                    onChange={(event) =>
                      updateOpponent(opponent.teamId, {
                        location: event.target.value as OpponentSelection['location'],
                      })
                    }
                  >
                    <option value="home">Home</option>
                    <option value="away">Away</option>
                    <option value="neutral">Neutral</option>
                  </select>
                </label>
                <label>
                  RPI
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    value={opponent.rpi}
                    onChange={(event) =>
                      updateOpponent(opponent.teamId, { rpi: Number(event.target.value) })
                    }
                  />
                </label>
                <label>
                  SOR
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    value={opponent.sor}
                    onChange={(event) =>
                      updateOpponent(opponent.teamId, { sor: Number(event.target.value) })
                    }
                  />
                </label>
                <label>
                  Games
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={opponent.games}
                    onChange={(event) =>
                      updateOpponent(opponent.teamId, { games: Number(event.target.value) })
                    }
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <div className="optimizer-error">{error}</div>}

      <div className="optimizer-actions">
        <button type="button" onClick={handleRunSimulation} disabled={isLoading}>
          {isLoading ? 'Running simulation…' : 'Run projection'}
        </button>
        {!isDiamondPro && (
          <span className="optimizer-upgrade-hint">
            Diamond Pro unlocks deeper simulations and full distributions.
          </span>
        )}
      </div>

      {projection && (
        <div className="optimizer-results">
          <h4>Scenario outlook</h4>
          <div className="optimizer-bars">
            {renderMetricBar(
              'Expected wins',
              projection.baseline.wins,
              projection.delta.wins,
              (value) => value.toFixed(2)
            )}
            {renderMetricBar('RPI shift', projection.baseline.rpi, projection.delta.rpi, (value) =>
              value.toFixed(3)
            )}
            {renderMetricBar('SOR shift', projection.baseline.sor, projection.delta.sor, (value) =>
              value.toFixed(3)
            )}
          </div>

          {scenarioHighlights.length > 0 && (
            <div className="optimizer-scenarios">
              {scenarioHighlights.map((scenario) => (
                <div key={scenario.label} className="scenario-card">
                  <h5>{scenario.label.replace('-', ' ')}</h5>
                  <p>
                    {scenario.wins.toFixed(1)}-{scenario.losses.toFixed(1)}
                    <span> • RPI {scenario.rpi.toFixed(3)}</span>
                  </p>
                  <span className="scenario-probability">
                    {Math.round(scenario.probability * 100)}% likelihood
                  </span>
                </div>
              ))}
            </div>
          )}

          <footer className="optimizer-footer">
            <span>
              {projection.meta.mode === 'advanced'
                ? `${projection.meta.iterations.toLocaleString()} Monte Carlo runs`
                : 'Deterministic snapshot'}{' '}
              • {projection.meta.durationMs.toFixed(1)}ms
            </span>
            {projection.meta.cached && <span className="optimizer-cache">cached</span>}
          </footer>
        </div>
      )}

      {upgradeMessage && !isDiamondPro && (
        <div className="optimizer-upgrade-callout">{upgradeMessage}</div>
      )}
    </section>
  );
};

export default SchedulingOptimizerPanel;
