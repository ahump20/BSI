'use client';

// ---------------------------------------------------------------------------
// SimulationWidget — Monte Carlo probability visualization
// ---------------------------------------------------------------------------

interface SimulationResult {
  outcome: string;
  probability: number;
}

interface SimulationWidgetProps {
  teamName: string;
  simulations: SimulationResult[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SimulationWidget({ teamName, simulations }: SimulationWidgetProps) {
  if (!simulations || simulations.length === 0) {
    return (
      <div className="text-text-tertiary text-xs font-mono py-4 text-center">
        No simulation data available for {teamName}
      </div>
    );
  }

  // Sort by probability descending
  const sorted = [...simulations].sort((a, b) => b.probability - a.probability);

  // Find the max probability for scaling bars relative to it
  const maxProbability = Math.max(...sorted.map((s) => s.probability), 0.01);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-burnt-orange text-[10px] font-semibold uppercase tracking-wider">
          Monte Carlo Projections
        </span>
        <span className="text-text-tertiary text-[10px] font-mono">
          10,000 sims
        </span>
      </div>

      {sorted.map((sim) => {
        const pct = sim.probability * 100;
        const barWidth = (sim.probability / maxProbability) * 100;

        return (
          <div key={sim.outcome} className="group">
            {/* Label row */}
            <div className="flex items-center justify-between mb-1">
              <span className="text-text-secondary text-xs font-serif">
                {sim.outcome}
              </span>
              <span className="text-text-primary font-mono text-xs font-bold">
                {pct < 1 ? pct.toFixed(2) : pct.toFixed(1)}%
              </span>
            </div>

            {/* Bar */}
            <div className="h-2.5 bg-graphite rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out-expo"
                style={{
                  width: `${Math.max(barWidth, 1)}%`,
                  background:
                    pct >= 50
                      ? 'linear-gradient(90deg, #BF5700, #FF9333)'
                      : pct >= 20
                        ? 'linear-gradient(90deg, #BF5700, #BF5700)'
                        : 'linear-gradient(90deg, rgba(191,87,0,0.6), rgba(191,87,0,0.4))',
                }}
              />
            </div>
          </div>
        );
      })}

      {/* Footer */}
      <div className="pt-2 border-t border-border-subtle">
        <span className="text-text-tertiary text-[10px] font-mono">
          Based on current record, RPI, strength of schedule, and run differential
        </span>
      </div>
    </div>
  );
}
