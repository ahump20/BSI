/**
 * Shared ESPN player stats table — renders multi-group stat tables for any sport.
 *
 * Heritage-styled. Used by CFB, NBA, and NFL BoxScoreClient components:
 * - CFB: split mode with benchLabel="Reserves"
 * - NBA: split mode with benchLabel="Bench"
 * - NFL: flat mode (active players only)
 */

import { useState } from 'react';
import type { BoxscorePlayerAthlete, BoxscorePlayerGroup } from './espn-boxscore-types';

interface EspnPlayerStatsTableProps {
  playerStats: BoxscorePlayerGroup[];
  /** 'split' = starters/bench/DNP sections (CFB, NBA). 'flat' = active players only (NFL). */
  mode?: 'split' | 'flat';
  /** Label for the bench section in split mode. Default: "Bench" */
  benchLabel?: string;
  /** Allow clickable column headers to sort rows within each section. Default: true. */
  sortable?: boolean;
}

type SortDir = 'asc' | 'desc' | null;
interface SortState {
  group: string;
  colIndex: number;
  dir: SortDir;
}

function PlayerRow({
  player,
  isStarter,
}: {
  player: BoxscorePlayerAthlete;
  isStarter?: boolean;
}) {
  return (
    <tr className="border-b border-border-subtle last:border-0 odd:bg-black/10 hover:bg-surface-press-box/60">
      <td
        className={`p-2 text-text-primary font-medium whitespace-nowrap sticky left-0 bg-surface-dugout z-10 ${
          isStarter ? 'border-l-2 border-bsi-primary/60' : ''
        }`}
      >
        <span>{player.athlete?.shortName || player.athlete?.displayName || '-'}</span>
        {player.athlete?.position?.abbreviation && (
          <span className="text-text-tertiary text-xs ml-1.5">
            {player.athlete.position.abbreviation}
          </span>
        )}
      </td>
      {(player.stats || []).map((val, sIdx) => (
        <td key={sIdx} className="p-2 text-center font-mono text-text-secondary text-xs tabular-nums">
          {val}
        </td>
      ))}
    </tr>
  );
}

function SectionHeader({
  label,
  colSpan,
  muted,
}: {
  label: string;
  colSpan: number;
  muted?: boolean;
}) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="px-2 py-1.5 surface-lifted border-y border-border-vintage"
      >
        <span
          className={`heritage-stamp ${muted ? 'opacity-60' : ''}`}
          style={muted ? { color: 'var(--text-tertiary)', borderColor: 'var(--border-vintage)' } : undefined}
        >
          {label}
        </span>
      </td>
    </tr>
  );
}

function SortableHeader({
  label,
  group,
  colIndex,
  sort,
  onSort,
  sortable,
}: {
  label: string;
  group: string;
  colIndex: number;
  sort: SortState | null;
  onSort: (next: SortState | null) => void;
  sortable: boolean;
}) {
  const active = sort?.group === group && sort?.colIndex === colIndex;
  const dir = active ? sort?.dir : null;
  const ariaSort: 'ascending' | 'descending' | 'none' =
    dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : 'none';

  if (!sortable) {
    return (
      <th className="text-center p-2 text-text-tertiary text-xs uppercase">{label}</th>
    );
  }

  const onClick = () => {
    if (!active || dir === null) onSort({ group, colIndex, dir: 'desc' });
    else if (dir === 'desc') onSort({ group, colIndex, dir: 'asc' });
    else onSort(null);
  };

  return (
    <th className="text-center p-2 text-xs uppercase" aria-sort={ariaSort}>
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1 font-display tracking-wider transition-colors ${
          active ? 'text-bsi-primary-light' : 'text-text-tertiary hover:text-text-primary'
        }`}
      >
        {label}
        {active && dir && (
          <span aria-hidden="true" className="text-[0.6rem]">
            {dir === 'asc' ? '\u25B2' : '\u25BC'}
          </span>
        )}
      </button>
    </th>
  );
}

function sortAthletes(
  athletes: BoxscorePlayerAthlete[],
  group: string,
  sort: SortState | null,
): BoxscorePlayerAthlete[] {
  if (!sort || sort.group !== group || !sort.dir) return athletes;
  const copy = [...athletes];
  copy.sort((a, b) => {
    const av = a.stats?.[sort.colIndex] ?? '';
    const bv = b.stats?.[sort.colIndex] ?? '';
    const an = parseFloat(av);
    const bn = parseFloat(bv);
    if (!Number.isNaN(an) && !Number.isNaN(bn)) {
      return sort.dir === 'asc' ? an - bn : bn - an;
    }
    return sort.dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
  });
  return copy;
}

export function EspnPlayerStatsTable({
  playerStats,
  mode = 'split',
  benchLabel = 'Bench',
  sortable = true,
}: EspnPlayerStatsTableProps) {
  const [sort, setSort] = useState<SortState | null>(null);

  return (
    <>
      {playerStats.map((teamGroup, tIdx) => {
        const teamAbbr = teamGroup.team?.abbreviation || (tIdx === 0 ? 'Away' : 'Home');
        const teamName = teamGroup.team?.displayName || teamAbbr;
        const statGroups = (teamGroup.statistics || []).filter(Boolean);

        if (statGroups.length === 0) {
          return (
            <section
              key={tIdx}
              className="heritage-card corner-marks relative overflow-hidden"
            >
              <header className="surface-lifted border-b border-border-vintage px-4 md:px-6 py-3 flex items-center gap-3">
                <span className="heritage-stamp">{teamAbbr}</span>
                <span className="text-text-tertiary text-xs">{teamName}</span>
              </header>
              <div className="px-4 py-6">
                <p className="text-text-tertiary text-sm">No player statistics available</p>
              </div>
            </section>
          );
        }

        return (
          <section
            key={tIdx}
            className="heritage-card corner-marks relative overflow-hidden"
          >
            <header className="surface-lifted border-b border-border-vintage px-4 md:px-6 py-3 flex items-center gap-3">
              <span className="heritage-stamp">{teamAbbr}</span>
              <span className="text-text-tertiary text-xs">{teamName}</span>
            </header>
            <div className="px-3 md:px-5 py-4">
              <div className="space-y-6">
                {statGroups.map((statGroup, gIdx) => {
                  if (!statGroup) return null;
                  const headers = statGroup.labels || statGroup.names || [];
                  const athletes = statGroup.athletes || [];
                  const groupName = statGroup.name || statGroup.type || '';
                  const colSpan = headers.length + 1;
                  const groupKey = `team-${tIdx}-group-${gIdx}`;

                  if (mode === 'flat') {
                    const activePlayers = athletes.filter((a) => !a.didNotPlay);
                    if (activePlayers.length === 0) return null;
                    const sorted = sortAthletes(activePlayers, groupKey, sort);

                    return (
                      <div key={gIdx}>
                        {groupName && (
                          <div className="mb-2">
                            <span className="heritage-stamp">{groupName}</span>
                          </div>
                        )}
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="surface-lifted border-b border-border-vintage">
                                <th className="text-left p-2 text-text-tertiary text-xs uppercase sticky left-0 bg-surface-press-box z-10">
                                  Player
                                </th>
                                {headers.map((h, hIdx) => (
                                  <SortableHeader
                                    key={hIdx}
                                    label={h}
                                    group={groupKey}
                                    colIndex={hIdx}
                                    sort={sort}
                                    onSort={setSort}
                                    sortable={sortable}
                                  />
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {sorted.map((player, pIdx) => (
                                <PlayerRow key={pIdx} player={player} />
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  }

                  // Split mode: starters / bench / DNP
                  const starters = athletes.filter((a) => a.athlete?.starter && !a.didNotPlay);
                  const bench = athletes.filter((a) => !a.athlete?.starter && !a.didNotPlay);
                  const dnp = athletes.filter((a) => a.didNotPlay);

                  if (starters.length + bench.length + dnp.length === 0) return null;

                  const sortedStarters = sortAthletes(starters, `${groupKey}-starters`, sort);
                  const sortedBench = sortAthletes(bench, `${groupKey}-bench`, sort);

                  return (
                    <div key={gIdx}>
                      {groupName && (
                        <div className="mb-2">
                          <span className="heritage-stamp">{groupName}</span>
                        </div>
                      )}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="surface-lifted border-b border-border-vintage">
                              <th className="text-left p-2 text-text-tertiary text-xs uppercase sticky left-0 bg-surface-press-box z-10">
                                Player
                              </th>
                              {headers.map((h, hIdx) => (
                                <SortableHeader
                                  key={hIdx}
                                  label={h}
                                  group={groupKey}
                                  colIndex={hIdx}
                                  sort={sort}
                                  onSort={setSort}
                                  sortable={sortable}
                                />
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {starters.length > 0 && (
                              <>
                                <SectionHeader label="Starters" colSpan={colSpan} />
                                {sortedStarters.map((p, i) => (
                                  <PlayerRow key={i} player={p} isStarter />
                                ))}
                              </>
                            )}
                            {bench.length > 0 && (
                              <>
                                <SectionHeader label={benchLabel} colSpan={colSpan} />
                                {sortedBench.map((p, i) => (
                                  <PlayerRow key={i} player={p} />
                                ))}
                              </>
                            )}
                            {dnp.length > 0 && (
                              <>
                                <SectionHeader label="Did Not Play" colSpan={colSpan} muted />
                                {dnp.map((player, dIdx) => (
                                  <tr
                                    key={dIdx}
                                    className="border-b border-border-subtle last:border-0"
                                  >
                                    <td className="p-2 text-text-tertiary whitespace-nowrap sticky left-0 bg-surface-dugout z-10">
                                      {player.athlete?.shortName ||
                                        player.athlete?.displayName ||
                                        '-'}
                                    </td>
                                    <td
                                      colSpan={headers.length}
                                      className="p-2 text-text-tertiary text-xs italic"
                                    >
                                      {player.reason || 'DNP'}
                                    </td>
                                  </tr>
                                ))}
                              </>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        );
      })}
    </>
  );
}
