'use client';

import { useState, useMemo } from 'react';
import { HAVFBadge } from './HAVFBadge';

interface HAVFPlayerRow {
  playerId: string;
  playerName: string;
  team: string;
  position?: string;
  conference?: string;
  composite: number;
  hScore: number;
  aScore: number;
  vScore: number;
  fScore: number;
}

interface HAVFLeaderboardProps {
  players: HAVFPlayerRow[];
  title?: string;
  /** Columns to show component bars for */
  showComponents?: boolean;
  /** Max rows before "Show more" */
  initialRows?: number;
  onPlayerClick?: (playerId: string) => void;
  className?: string;
}

type SortKey = 'composite' | 'hScore' | 'aScore' | 'vScore' | 'fScore' | 'playerName';
type SortDir = 'asc' | 'desc';

function ComponentBar({ value, label }: { value: number; label: string }) {
  const intensity = value >= 80 ? 'var(--bsi-accent)' : value >= 60 ? 'var(--bsi-primary)' : 'rgba(255,255,255,0.3)';
  return (
    <div className="flex items-center gap-1.5 min-w-[60px]" title={`${label}: ${value.toFixed(1)}`}>
      <div className="flex-1 h-[6px] rounded-full bg-[var(--surface-press-box)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, backgroundColor: intensity }}
        />
      </div>
      <span className="text-[10px] font-mono text-[rgba(196,184,165,0.35)] tabular-nums w-5 text-right">
        {Math.round(value)}
      </span>
    </div>
  );
}

/**
 * HAVFLeaderboard — sortable player table with inline component visualization.
 *
 * Dense, information-rich, scannable. The composite badge is the anchor;
 * component bars give shape at a glance without requiring a full radar chart.
 */
export function HAVFLeaderboard({
  players,
  title = 'HAV-F Leaderboard',
  showComponents = true,
  initialRows = 25,
  onPlayerClick,
  className = '',
}: HAVFLeaderboardProps) {
  const [sortKey, setSortKey] = useState<SortKey>('composite');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [showAll, setShowAll] = useState(false);

  const sorted = useMemo(() => {
    const s = [...players].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === 'asc'
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
    return showAll ? s : s.slice(0, initialRows);
  }, [players, sortKey, sortDir, showAll, initialRows]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  const SortHeader = ({ k, label, className: cls = '' }: { k: SortKey; label: string; className?: string }) => (
    <button
      onClick={() => handleSort(k)}
      className={`flex items-center gap-1 text-[10px] font-display uppercase tracking-widest transition-colors ${
        sortKey === k ? 'text-[var(--bsi-primary)]' : 'text-[rgba(196,184,165,0.35)] hover:text-[rgba(196,184,165,0.35)]'
      } ${cls}`}
    >
      {label}
      {sortKey === k && (
        <span className="text-[8px]">{sortDir === 'desc' ? '\u25BC' : '\u25B2'}</span>
      )}
    </button>
  );

  return (
    <div className={`bg-[var(--surface-scoreboard)] border border-[var(--border-vintage)] rounded-sm overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--border-vintage)] flex items-center justify-between">
        <h3 className="font-display text-base uppercase tracking-wider text-[var(--bsi-bone)]">{title}</h3>
        <span className="text-[10px] font-mono text-[rgba(196,184,165,0.35)] tabular-nums">
          {players.length} player{players.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border-vintage)]">
              <th className="pl-5 pr-2 py-3 text-left">
                <span className="text-[10px] font-display uppercase tracking-widest text-[rgba(196,184,165,0.35)]">#</span>
              </th>
              <th className="px-2 py-3 text-left">
                <SortHeader k="playerName" label="Player" />
              </th>
              <th className="px-2 py-3 text-left hidden sm:table-cell">
                <span className="text-[10px] font-display uppercase tracking-widest text-[rgba(196,184,165,0.35)]">Team</span>
              </th>
              <th className="px-2 py-3 text-center">
                <SortHeader k="composite" label="HAV-F" className="justify-center" />
              </th>
              {showComponents && (
                <>
                  <th className="px-2 py-3 text-center hidden md:table-cell">
                    <SortHeader k="hScore" label="H" className="justify-center" />
                  </th>
                  <th className="px-2 py-3 text-center hidden md:table-cell">
                    <SortHeader k="aScore" label="A" className="justify-center" />
                  </th>
                  <th className="px-2 py-3 text-center hidden md:table-cell">
                    <SortHeader k="vScore" label="V" className="justify-center" />
                  </th>
                  <th className="pr-5 pl-2 py-3 text-center hidden md:table-cell">
                    <SortHeader k="fScore" label="F" className="justify-center" />
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {sorted.map((player, i) => {
              const rank = i + 1;
              return (
                <tr
                  key={player.playerId}
                  onClick={() => onPlayerClick?.(player.playerId)}
                  className={`border-b border-[var(--border-vintage)] transition-colors ${
                    onPlayerClick ? 'cursor-pointer hover:bg-[var(--surface-press-box)]' : ''
                  } ${rank <= 3 ? 'bg-[var(--bsi-primary)]/[0.03]' : ''}`}
                >
                  <td className="pl-5 pr-2 py-3">
                    <span
                      className={`text-xs font-mono tabular-nums ${
                        rank <= 3 ? 'text-[var(--bsi-primary)] font-bold' : 'text-[rgba(196,184,165,0.35)]'
                      }`}
                    >
                      {rank}
                    </span>
                  </td>
                  <td className="px-2 py-3">
                    <div>
                      <span className="text-[var(--bsi-bone)] font-medium text-sm">{player.playerName}</span>
                      {player.position && (
                        <span className="ml-1.5 text-[10px] text-[rgba(196,184,165,0.35)] uppercase">{player.position}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-3 hidden sm:table-cell">
                    <span className="text-[rgba(196,184,165,0.35)] text-xs">{player.team}</span>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <HAVFBadge score={player.composite} size="sm" />
                  </td>
                  {showComponents && (
                    <>
                      <td className="px-2 py-3 hidden md:table-cell">
                        <ComponentBar value={player.hScore} label="Hitting" />
                      </td>
                      <td className="px-2 py-3 hidden md:table-cell">
                        <ComponentBar value={player.aScore} label="At-Bat Quality" />
                      </td>
                      <td className="px-2 py-3 hidden md:table-cell">
                        <ComponentBar value={player.vScore} label="Velocity" />
                      </td>
                      <td className="pr-5 pl-2 py-3 hidden md:table-cell">
                        <ComponentBar value={player.fScore} label="Fielding" />
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Show more */}
      {!showAll && players.length > initialRows && (
        <div className="px-5 py-3 border-t border-[var(--border-vintage)] text-center">
          <button
            onClick={() => setShowAll(true)}
            className="text-xs text-[var(--bsi-primary)] hover:text-[var(--bsi-primary)] font-medium transition-colors"
          >
            Show all {players.length} players
          </button>
        </div>
      )}
    </div>
  );
}
