/**
 * Shared ESPN team statistics comparison table.
 * Renders away vs home stat comparison from ESPN boxscore data.
 * Heritage visual language with diverging bars for numeric stats.
 */

import type { BoxscoreTeam } from './espn-boxscore-types';

interface EspnTeamStatsTableProps {
  away: BoxscoreTeam;
  home: BoxscoreTeam;
  awayLabel?: string;
  homeLabel?: string;
}

function parseNumeric(value: string | undefined): number | null {
  if (!value) return null;
  // Reject values with separators that indicate non-scalar stats (e.g., "4-12", "3/4", "20:15").
  if (/[\-/:]/.test(value) && !/^-\d/.test(value)) return null;
  const n = parseFloat(value.replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

export function EspnTeamStatsTable({
  away,
  home,
  awayLabel = 'Away',
  homeLabel = 'Home',
}: EspnTeamStatsTableProps) {
  const awayStats = away.statistics || [];
  const homeStats = home.statistics || [];

  return (
    <section className="heritage-card corner-marks relative overflow-hidden">
      <header className="surface-lifted border-b border-border-vintage px-4 md:px-6 py-3 flex items-center justify-between">
        <span className="heritage-stamp">Team Statistics</span>
        <div className="hidden md:flex items-center gap-4 text-[0.65rem] font-display uppercase tracking-widest">
          <span className="text-bsi-primary-light">{awayLabel}</span>
          <span className="text-heritage-columbia-blue">{homeLabel}</span>
        </div>
      </header>

      <div className="px-3 md:px-5 py-3">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Team statistics comparison">
            <thead className="sr-only">
              <tr>
                <th scope="col">{awayLabel}</th>
                <th scope="col">Stat</th>
                <th scope="col">{homeLabel}</th>
              </tr>
            </thead>
            <tbody>
              {awayStats.map((awayStat, idx) => {
                const homeStat = homeStats[idx];
                const label = awayStat.label || awayStat.name || '';
                const awayValue = awayStat.displayValue || '-';
                const homeValue = homeStat?.displayValue || '-';

                const awayN = parseNumeric(awayStat.displayValue);
                const homeN = parseNumeric(homeStat?.displayValue);
                const hasBars = awayN !== null && homeN !== null && (awayN > 0 || homeN > 0);
                const max = hasBars ? Math.max(awayN ?? 0, homeN ?? 0) : 0;
                const awayPct = hasBars && max > 0 ? ((awayN ?? 0) / max) * 40 : 0;
                const homePct = hasBars && max > 0 ? ((homeN ?? 0) / max) * 40 : 0;

                return (
                  <tr key={idx} className="border-b border-border-subtle last:border-0">
                    <td className="p-2 w-[38%] relative">
                      <div className="relative h-6 flex items-center justify-end pr-2">
                        {hasBars && (
                          <div
                            aria-hidden="true"
                            className="absolute right-0 top-1/2 -translate-y-1/2 h-4 bg-bsi-primary/40 rounded-l-sm"
                            style={{ width: `${awayPct}%` }}
                          />
                        )}
                        <span className="relative font-mono tabular-nums text-text-primary text-sm">
                          {awayValue}
                        </span>
                      </div>
                    </td>
                    <td className="p-2 w-[24%] text-center relative">
                      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-bsi-primary/60" />
                      <span className="relative text-text-tertiary text-[0.65rem] font-display uppercase tracking-widest">
                        {label}
                      </span>
                    </td>
                    <td className="p-2 w-[38%] relative">
                      <div className="relative h-6 flex items-center justify-start pl-2">
                        {hasBars && (
                          <div
                            aria-hidden="true"
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-4 bg-heritage-columbia-blue/40 rounded-r-sm"
                            style={{ width: `${homePct}%` }}
                          />
                        )}
                        <span className="relative font-mono tabular-nums text-text-primary text-sm">
                          {homeValue}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
