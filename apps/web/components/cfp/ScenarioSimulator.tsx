'use client';

import { useMemo, useState, useTransition } from 'react';
import type {
  CFPTop25Response,
  ScenarioSimulationResponse,
  ScenarioAdjustment
} from '@/lib/cfp';

interface ScenarioSimulatorProps {
  baseline: CFPTop25Response;
}

const chaosOptions = [
  { label: 'Coaching Chalk', value: 0.6 },
  { label: 'Balanced Reality', value: 1 },
  { label: 'Championship Chaos', value: 1.6 }
];

export function ScenarioSimulator({ baseline }: ScenarioSimulatorProps) {
  const [teamToBoost, setTeamToBoost] = useState(baseline.modelBaseline.bubbleTeams[0] ?? baseline.rankings[4]?.team ?? '');
  const [teamToFade, setTeamToFade] = useState(baseline.modelBaseline.bubbleTeams[1] ?? baseline.rankings[5]?.team ?? '');
  const [iterations, setIterations] = useState(4000);
  const [chaosFactor, setChaosFactor] = useState<number>(1);
  const [autoBidTeam, setAutoBidTeam] = useState('');
  const [result, setResult] = useState<ScenarioSimulationResponse | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const baselineMap = useMemo(() => {
    return new Map(baseline.modelBaseline.teams.map((team) => [team.team, team.playoffOdds]));
  }, [baseline.modelBaseline.teams]);

  const selectableTeams = useMemo(() => baseline.rankings.map((entry) => entry.team), [baseline.rankings]);

  async function runSimulation() {
    setError(null);
    startTransition(async () => {
      try {
        const adjustments = (
          [
            teamToBoost
              ? {
                  team: teamToBoost,
                  winProbabilityDelta: 0.12,
                  resumeBonus: 2,
                  autoBid: autoBidTeam === teamToBoost
                }
              : undefined,
            teamToFade
              ? {
                  team: teamToFade,
                  winProbabilityDelta: -0.12,
                  resumeBonus: -1.5,
                  autoBid: false
                }
              : undefined,
            autoBidTeam && autoBidTeam !== teamToBoost
              ? {
                  team: autoBidTeam,
                  winProbabilityDelta: 0.08,
                  resumeBonus: 1.2,
                  autoBid: true
                }
              : undefined
          ] as Array<ScenarioAdjustment | undefined>
        ).filter((item): item is ScenarioAdjustment => Boolean(item));

        const response = await fetch('/api/cfp/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            iterations,
            chaosFactor,
            adjustments,
            protectSeeds: baseline.modelBaseline.projectedField.slice(0, 2).map((entry) => entry.team)
          })
        });

        if (!response.ok) {
          throw new Error(`Simulation failed: ${response.status}`);
        }

        const payload = (await response.json()) as ScenarioSimulationResponse;
        setResult(payload);
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  return (
    <section className="cfp-simulator" aria-labelledby="cfp-simulator-heading">
      <header className="cfp-simulator__header">
        <div>
          <span className="di-kicker">Scenario Lab</span>
          <h2 id="cfp-simulator-heading" className="di-page-title">
            Monte Carlo Playoff Projection Engine
          </h2>
          <p className="di-page-subtitle">
            Adjust program momentum, declare auto-bids, and dial chaos to see how the CFP field shifts in seconds.
          </p>
        </div>
        <button
          type="button"
          className="cfp-run-button"
          onClick={runSimulation}
          disabled={isPending}
        >
          {isPending ? 'Running Simulation…' : 'Run Scenario'}
        </button>
      </header>

      <div className="cfp-simulator__grid">
        <form className="cfp-form" aria-label="Scenario inputs" onSubmit={(event) => event.preventDefault()}>
          <label className="cfp-field">
            <span>Boost Program</span>
            <select value={teamToBoost} onChange={(event) => setTeamToBoost(event.target.value)}>
              {selectableTeams.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
            <p>Simulate a marquee win or conference title surge.</p>
          </label>

          <label className="cfp-field">
            <span>Fade Program</span>
            <select value={teamToFade} onChange={(event) => setTeamToFade(event.target.value)}>
              {selectableTeams.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
            <p>Model an upset loss or resume slip.</p>
          </label>

          <label className="cfp-field">
            <span>Auto-Bid Lock</span>
            <select value={autoBidTeam} onChange={(event) => setAutoBidTeam(event.target.value)}>
              <option value="">None</option>
              {selectableTeams.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
            <p>Force a program into the bracket via league title.</p>
          </label>

          <label className="cfp-field">
            <span>Iterations</span>
            <input
              type="number"
              min={500}
              max={20000}
              step={500}
              value={iterations}
              onChange={(event) => {
                const nextValue = Number.parseInt(event.target.value, 10);
                const safeValue = Number.isFinite(nextValue) ? nextValue : 2000;
                setIterations(Math.min(Math.max(safeValue, 500), 20000));
              }}
            />
            <p>More iterations increase accuracy but take longer.</p>
          </label>

          <fieldset className="cfp-field">
            <legend>Chaos Factor</legend>
            <div className="cfp-radio-group">
              {chaosOptions.map((option) => (
                <label key={option.value} className="cfp-radio">
                  <input
                    type="radio"
                    name="chaos"
                    value={option.value}
                    checked={chaosFactor === option.value}
                    onChange={() => setChaosFactor(option.value)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            <p>Chaos increases variance to model wild finish scenarios.</p>
          </fieldset>
        </form>

        <div className="cfp-results" aria-live="polite">
          {error ? (
            <div className="cfp-error" role="alert">{error}</div>
          ) : result ? (
            <div className="cfp-results__inner">
              <div className="cfp-projected-field">
                <h3>Projected Field</h3>
                <ol>
                  {result.projectedField.map((entry) => (
                    <li key={entry.team}>
                      <span>{entry.seed}</span>
                      <strong>{entry.team}</strong>
                    </li>
                  ))}
                </ol>
              </div>

              <table className="cfp-results-table">
                <thead>
                  <tr>
                    <th scope="col">Program</th>
                    <th scope="col">Berth %</th>
                    <th scope="col">Δ vs Baseline</th>
                    <th scope="col">Avg Seed</th>
                    <th scope="col">Volatility</th>
                  </tr>
                </thead>
                <tbody>
                  {result.teams.slice(0, 12).map((team) => {
                    const baselineOdds = baselineMap.get(team.team) ?? 0;
                    const delta = (team.playoffOdds - baselineOdds) * 100;
                    const deltaLabel = `${delta >= 0 ? '+' : ''}${delta.toFixed(1)} pts`;
                    return (
                      <tr key={team.team}>
                        <td>{team.team}</td>
                        <td>{(team.playoffOdds * 100).toFixed(1)}%</td>
                        <td className={delta >= 0 ? 'cfp-delta-positive' : 'cfp-delta-negative'}>{deltaLabel}</td>
                        <td>{team.avgSeed.toFixed(1)}</td>
                        <td>{team.volatilityIndex.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="cfp-narrative">
                <h3>Intelligence Notes</h3>
                <ul>
                  {result.narrative.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="cfp-placeholder">
              <h3>Awaiting Scenario</h3>
              <p>Configure your adjustments and run the Monte Carlo engine to populate results.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
