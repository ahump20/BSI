'use client';

import { useState, useMemo } from 'react';

interface ParkFactorRow {
  team: string;
  venue_name?: string | null;
  conference?: string | null;
  runs_factor: number;
  hits_factor?: number;
  hr_factor?: number;
  sample_games: number;
}

interface ParkFactorTableProps {
  data: ParkFactorRow[];
  isPro?: boolean;
  className?: string;
}

/**
 * ParkFactorTable — venue table with heat-colored cells.
 * Green = pitcher-friendly. Red = hitter-friendly. White = neutral.
 * Communicates park character at a glance.
 */
function factorColor(factor: number): string {
  if (factor >= 1.15) return '#e74c3c';   // Very hitter-friendly
  if (factor >= 1.05) return '#d4775c';   // Hitter-friendly
  if (factor >= 0.95) return '#aaaaaa';   // Neutral
  if (factor >= 0.85) return '#5b9bd5';   // Pitcher-friendly
  return '#2980b9';                        // Very pitcher-friendly
}

function formatFactor(f: number): string {
  return f.toFixed(3);
}

export function ParkFactorTable({ data, isPro = false, className = '' }: ParkFactorTableProps) {
  const [groupByConf, setGroupByConf] = useState(false);

  const sorted = useMemo(() => {
    const s = [...data].sort((a, b) => b.runs_factor - a.runs_factor);
    if (!groupByConf) return s;
    return s.sort((a, b) => {
      const confA = a.conference || 'Unknown';
      const confB = b.conference || 'Unknown';
      return confA.localeCompare(confB) || b.runs_factor - a.runs_factor;
    });
  }, [data, groupByConf]);

  const displayData = isPro ? sorted : sorted.slice(0, 5);

  return (
    <div className={`bg-[#0D0D0D] border border-white/[0.06] rounded-xl overflow-hidden ${className}`}>
      <div className="px-5 py-4 border-b border-white/[0.04] flex items-center justify-between">
        <h3 className="font-display text-base uppercase tracking-wider text-white">Park Factors</h3>
        <button
          onClick={() => setGroupByConf(!groupByConf)}
          className="text-[10px] font-mono text-white/30 hover:text-white/50 transition-colors"
        >
          {groupByConf ? 'Sort by factor' : 'Group by conference'}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.04]">
              <th className="pl-5 pr-2 py-3 text-left">
                <span className="text-[10px] font-display uppercase tracking-widest text-white/30">Team</span>
              </th>
              <th className="px-2 py-3 text-left hidden sm:table-cell">
                <span className="text-[10px] font-display uppercase tracking-widest text-white/30">Venue</span>
              </th>
              <th className="px-2 py-3 text-center">
                <span className="text-[10px] font-display uppercase tracking-widest text-white/30">Runs</span>
              </th>
              <th className="px-2 py-3 text-center hidden md:table-cell">
                <span className="text-[10px] font-display uppercase tracking-widest text-white/30">Games</span>
              </th>
              <th className="pr-5 pl-2 py-3 text-center hidden md:table-cell">
                <span className="text-[10px] font-display uppercase tracking-widest text-white/30">Character</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {displayData.map((row, i) => (
              <tr key={`${row.team}-${i}`} className="border-b border-white/[0.02]">
                <td className="pl-5 pr-2 py-3">
                  <span className="text-white text-sm font-medium">{row.team}</span>
                  {row.conference && (
                    <span className="ml-1.5 text-[10px] text-white/25">{row.conference}</span>
                  )}
                </td>
                <td className="px-2 py-3 hidden sm:table-cell">
                  <span className="text-white/40 text-xs">{row.venue_name || '—'}</span>
                </td>
                <td className="px-2 py-3 text-center">
                  <span
                    className="font-mono text-xs font-bold tabular-nums"
                    style={{ color: factorColor(row.runs_factor) }}
                  >
                    {formatFactor(row.runs_factor)}
                  </span>
                </td>
                <td className="px-2 py-3 text-center hidden md:table-cell">
                  <span className="text-white/30 text-xs font-mono">{row.sample_games}</span>
                </td>
                <td className="pr-5 pl-2 py-3 text-center hidden md:table-cell">
                  <span className="text-[10px] text-white/40 font-mono uppercase">
                    {row.runs_factor >= 1.05 ? 'Hitter' : row.runs_factor <= 0.95 ? 'Pitcher' : 'Neutral'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!isPro && data.length > 5 && (
        <div className="px-5 py-3 border-t border-white/[0.04] text-center">
          <a
            href="/pricing"
            className="text-xs text-[#BF5700] hover:text-[#FF6B35] font-medium transition-colors"
          >
            Upgrade to Pro for all {data.length} venues
          </a>
        </div>
      )}
    </div>
  );
}
