'use client';

import { useMemo } from 'react';

// =============================================================================
// Types
// =============================================================================

interface LinescoreTeam {
  name: string;
  abbreviation?: string;
  logo?: string;
}

interface LinescoreTotals {
  runs: number;
  hits: number;
  errors: number;
}

export interface LinescoreProps {
  homeTeam: LinescoreTeam;
  awayTeam: LinescoreTeam;
  innings: Array<{ away: number | null; home: number | null }>;
  totals: {
    away: LinescoreTotals;
    home: LinescoreTotals;
  };
  currentInning?: number;
  isTopInning?: boolean;
  isLive?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export default function Linescore({
  homeTeam,
  awayTeam,
  innings,
  totals,
  currentInning,
  isTopInning,
  isLive,
}: LinescoreProps) {
  // Ensure at least 9 columns, expand for extras
  const columnCount = useMemo(
    () => Math.max(innings.length, 9),
    [innings.length]
  );

  const isCurrentInning = (inningIndex: number) =>
    isLive && currentInning != null && inningIndex + 1 === currentInning;

  return (
    <div className="bg-[var(--surface-scoreboard)] rounded-sm border border-[var(--border-vintage)] overflow-hidden">
      {/* Live indicator */}
      {isLive && (
        <div className="flex items-center gap-2 px-4 py-2 bg-success/10 border-b border-[var(--border-vintage)]">
          <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
          <span className="text-success text-xs font-semibold uppercase tracking-wide">
            Live{currentInning != null && ` - ${isTopInning ? 'Top' : 'Bot'} ${currentInning}`}
          </span>
        </div>
      )}

      {/* Scrollable linescore table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[500px]">
          <thead>
            <tr className="border-b border-[var(--border-vintage)]">
              {/* Team name column */}
              <th className="text-left px-3 py-2.5 text-[rgba(196,184,165,0.5)] font-medium w-20 sticky left-0 bg-[var(--surface-scoreboard)] z-10">
                Team
              </th>

              {/* Inning columns */}
              {Array.from({ length: columnCount }, (_, i) => (
                <th
                  key={i}
                  className={`text-center px-1.5 py-2.5 w-8 font-mono text-xs font-medium transition-colors ${
                    isCurrentInning(i)
                      ? 'text-[var(--bsi-primary)] bg-[var(--bsi-primary)]/10'
                      : 'text-[rgba(196,184,165,0.5)]'
                  }`}
                >
                  {i + 1}
                </th>
              ))}

              {/* R H E totals */}
              <th className="text-center px-2 py-2.5 w-10 border-l border-[var(--border-vintage)] text-[var(--bsi-primary)] font-bold">
                R
              </th>
              <th className="text-center px-2 py-2.5 w-10 text-[rgba(196,184,165,0.5)] font-medium">
                H
              </th>
              <th className="text-center px-2 py-2.5 w-10 text-[rgba(196,184,165,0.5)] font-medium">
                E
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Away team row */}
            <tr className="border-b border-[var(--border-vintage)]">
              <td className="px-3 py-2.5 sticky left-0 bg-[var(--surface-scoreboard)] z-10">
                <div className="flex items-center gap-2">
                  {awayTeam.logo && (
                    <img
                      src={awayTeam.logo}
                      alt={awayTeam.name}
                      className="w-5 h-5 object-contain"
                      width={20}
                      height={20}
                      loading="lazy"
                    />
                  )}
                  <span className="font-semibold text-bone text-xs uppercase tracking-wide">
                    {awayTeam.abbreviation || awayTeam.name.slice(0, 4).toUpperCase()}
                  </span>
                </div>
              </td>

              {Array.from({ length: columnCount }, (_, i) => {
                const value = innings[i]?.away;
                const isActive = isCurrentInning(i) && isTopInning;
                return (
                  <td
                    key={i}
                    className={`text-center px-1.5 py-2.5 font-mono text-sm transition-colors ${
                      isActive
                        ? 'text-[var(--bsi-primary)] font-bold bg-[var(--bsi-primary)]/10'
                        : value != null
                          ? 'text-bone'
                          : 'text-[rgba(196,184,165,0.5)]'
                    }`}
                  >
                    {value != null ? value : i < innings.length ? 0 : '-'}
                  </td>
                );
              })}

              {/* Totals */}
              <td className="text-center px-2 py-2.5 font-mono font-bold text-[var(--bsi-bone)] border-l border-[var(--border-vintage)]">
                {totals.away.runs}
              </td>
              <td className="text-center px-2 py-2.5 font-mono text-bone">
                {totals.away.hits}
              </td>
              <td className="text-center px-2 py-2.5 font-mono text-bone">
                {totals.away.errors}
              </td>
            </tr>

            {/* Home team row */}
            <tr>
              <td className="px-3 py-2.5 sticky left-0 bg-[var(--surface-scoreboard)] z-10">
                <div className="flex items-center gap-2">
                  {homeTeam.logo && (
                    <img
                      src={homeTeam.logo}
                      alt={homeTeam.name}
                      className="w-5 h-5 object-contain"
                      width={20}
                      height={20}
                      loading="lazy"
                    />
                  )}
                  <span className="font-semibold text-bone text-xs uppercase tracking-wide">
                    {homeTeam.abbreviation || homeTeam.name.slice(0, 4).toUpperCase()}
                  </span>
                </div>
              </td>

              {Array.from({ length: columnCount }, (_, i) => {
                const value = innings[i]?.home;
                const isActive = isCurrentInning(i) && !isTopInning;
                return (
                  <td
                    key={i}
                    className={`text-center px-1.5 py-2.5 font-mono text-sm transition-colors ${
                      isActive
                        ? 'text-[var(--bsi-primary)] font-bold bg-[var(--bsi-primary)]/10'
                        : value != null
                          ? 'text-bone'
                          : 'text-[rgba(196,184,165,0.5)]'
                    }`}
                  >
                    {value != null ? value : i < innings.length ? 0 : '-'}
                  </td>
                );
              })}

              {/* Totals */}
              <td className="text-center px-2 py-2.5 font-mono font-bold text-[var(--bsi-bone)] border-l border-[var(--border-vintage)]">
                {totals.home.runs}
              </td>
              <td className="text-center px-2 py-2.5 font-mono text-bone">
                {totals.home.hits}
              </td>
              <td className="text-center px-2 py-2.5 font-mono text-bone">
                {totals.home.errors}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
