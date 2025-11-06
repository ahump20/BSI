import type { CFPTop25Response } from '@/lib/cfp';

interface InsightsPanelProps {
  data: CFPTop25Response;
}

export function InsightsPanel({ data }: InsightsPanelProps) {
  const bubbleTeams = data.modelBaseline.bubbleTeams;
  const leaderBoard = data.modelBaseline.teams.slice(0, 6);

  return (
    <section className="cfp-insights" aria-labelledby="cfp-insights-heading">
      <header>
        <span className="di-kicker">Narrative Console</span>
        <h2 id="cfp-insights-heading" className="di-page-title">
          Selection Committee Pressure Points
        </h2>
        <p className="di-page-subtitle">
          Baseline probabilities and volatility signals from the Blaze CFP engine.
        </p>
      </header>

      <div className="cfp-insights__grid">
        <article className="cfp-insight-card">
          <h3>Bubble Watch</h3>
          <ul>
            {bubbleTeams.map((team) => (
              <li key={team}>{team}</li>
            ))}
          </ul>
          <p className="cfp-insight-note">
            Programs within 40%–65% playoff odds are one result away from reshaping the bracket.
          </p>
        </article>

        <article className="cfp-insight-card">
          <h3>Probability Board</h3>
          <table>
            <thead>
              <tr>
                <th scope="col">Program</th>
                <th scope="col">Berth %</th>
                <th scope="col">Avg Seed</th>
              </tr>
            </thead>
            <tbody>
              {leaderBoard.map((team) => (
                <tr key={team.team}>
                  <td>{team.team}</td>
                  <td>{(team.playoffOdds * 100).toFixed(1)}%</td>
                  <td>{team.avgSeed.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      </div>
    </section>
  );
}
