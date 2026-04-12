'use client';

import { useState, type ReactNode } from 'react';
import { LeaderStrip } from './LeaderStrip';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TeamInfo {
  name: string;
  abbreviation: string;
  logo?: string;
  score?: number | string;
  isWinner?: boolean;
}

export interface BattingLine {
  player: {
    id?: string;
    name: string;
    position?: string;
    jerseyNumber?: string;
    year?: string;
    ranking?: number;
  };
  ab: number;
  r: number;
  h: number;
  rbi: number;
  bb: number;
  so: number;
  avg: string;
  hr?: number;
  obp?: string;
  slg?: string;
  sb?: number;
  [key: string]: unknown;
}

export interface PitchingLine {
  player: {
    id?: string;
    name: string;
    jerseyNumber?: string;
    year?: string;
    ranking?: number;
  };
  ip: string;
  h: number;
  r: number;
  er: number;
  bb: number;
  so: number;
  era: string;
  decision?: string;
  pitches?: number;
  strikes?: number;
  whip?: string;
  [key: string]: unknown;
}

export interface Linescore {
  innings: { away: number | null; home: number | null }[];
  totals: {
    away: { runs: number; hits: number; errors: number };
    home: { runs: number; hits: number; errors: number };
  };
}

export interface BoxScoreData {
  away: {
    batting: BattingLine[];
    pitching: PitchingLine[];
  };
  home: {
    batting: BattingLine[];
    pitching: PitchingLine[];
  };
}

export type BoxScoreTeamFilter = 'both' | 'away' | 'home';

export interface BoxScoreTableProps {
  linescore?: Linescore;
  boxscore?: BoxScoreData;
  awayTeam: TeamInfo;
  homeTeam: TeamInfo;
  variant?: 'compact' | 'full';
  showLinescore?: boolean;
  defaultTab?: 'batting' | 'pitching';
  sport?: string;
  showLeaders?: boolean;
  sortable?: boolean;
  teamFilter?: BoxScoreTeamFilter;
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function BoxScoreTableSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-4">
      <div className="h-6 bg-surface-dugout rounded-sm w-1/3" />
      <div className="h-32 bg-surface-press-box rounded-sm" />
      <div className="h-48 bg-surface-press-box rounded-sm" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type BattingKey = 'ab' | 'r' | 'h' | 'rbi' | 'bb' | 'so';

function sumBatting(lines: BattingLine[], key: BattingKey): number {
  return lines.reduce((sum, l) => sum + (l[key] as number), 0);
}

function ipToOuts(ip: string): number {
  const [full, frac] = ip.split('.');
  const fullN = Number(full) || 0;
  const fracN = Number(frac) || 0;
  return fullN * 3 + fracN;
}

function teamTopHit(batting: BattingLine[]): number {
  return batting.reduce((max, b) => (b.h > max ? b.h : max), 0);
}

type SortDir = 'asc' | 'desc' | null;
interface SortState {
  group: string;
  key: string;
  dir: SortDir;
}

function sortRows<T extends Record<string, unknown>>(
  rows: T[],
  group: string,
  sort: SortState | null,
  accessor: (row: T, key: string) => unknown,
): T[] {
  if (!sort || sort.group !== group || !sort.dir) return rows;
  const copy = [...rows];
  copy.sort((a, b) => {
    const av = accessor(a, sort.key);
    const bv = accessor(b, sort.key);
    const an = typeof av === 'number' ? av : Number(av);
    const bn = typeof bv === 'number' ? bv : Number(bv);
    if (!Number.isNaN(an) && !Number.isNaN(bn)) {
      return sort.dir === 'asc' ? an - bn : bn - an;
    }
    const as = String(av ?? '');
    const bs = String(bv ?? '');
    return sort.dir === 'asc' ? as.localeCompare(bs) : bs.localeCompare(as);
  });
  return copy;
}

// ---------------------------------------------------------------------------
// Sortable header cell
// ---------------------------------------------------------------------------

interface SortableThProps {
  children: ReactNode;
  sortKey: string;
  group: string;
  sort: SortState | null;
  onSort: (next: SortState | null) => void;
  sortable: boolean;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

function SortableTh({
  children,
  sortKey,
  group,
  sort,
  onSort,
  sortable,
  align = 'center',
  className = '',
}: SortableThProps) {
  const active = sort?.group === group && sort?.key === sortKey;
  const dir = active ? sort?.dir : null;
  const ariaSort: 'ascending' | 'descending' | 'none' =
    dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : 'none';
  const alignClass =
    align === 'left' ? 'text-left' : align === 'right' ? 'text-right' : 'text-center';

  if (!sortable) {
    return (
      <th scope="col" className={`${alignClass} py-1.5 px-1 ${className}`}>
        {children}
      </th>
    );
  }

  const handleClick = () => {
    if (!active || dir === null) {
      onSort({ group, key: sortKey, dir: 'desc' });
    } else if (dir === 'desc') {
      onSort({ group, key: sortKey, dir: 'asc' });
    } else {
      onSort(null);
    }
  };

  return (
    <th scope="col" aria-sort={ariaSort} className={`${alignClass} py-1.5 px-1 ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center gap-1 font-display uppercase tracking-wider transition-colors ${
          active ? 'text-bsi-primary-light' : 'text-text-tertiary hover:text-text-primary'
        }`}
      >
        {children}
        {active && dir && (
          <span aria-hidden="true" className="text-[0.6rem]">
            {dir === 'asc' ? '\u25B2' : '\u25BC'}
          </span>
        )}
      </button>
    </th>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BoxScoreTable({
  linescore,
  boxscore,
  awayTeam,
  homeTeam,
  variant = 'full',
  showLinescore = true,
  defaultTab = 'batting',
  showLeaders = false,
  sortable = true,
  teamFilter = 'both',
}: BoxScoreTableProps) {
  const [activeTab, setActiveTab] = useState<'batting' | 'pitching'>(defaultTab);
  const [sort, setSort] = useState<SortState | null>(null);
  const isCompact = variant === 'compact';

  if (!boxscore) {
    return (
      <div className="heritage-card rounded-sm overflow-hidden">
        <div className="px-4 py-8 text-center text-text-tertiary text-sm">
          Box score data not available yet
        </div>
      </div>
    );
  }

  const battingAccessor = (row: BattingLine, key: string): unknown => {
    if (key === 'player') return row.player.name;
    return row[key];
  };
  const pitchingAccessor = (row: PitchingLine, key: string): unknown => {
    if (key === 'player') return row.player.name;
    if (key === 'ip') return ipToOuts(row.ip);
    return row[key];
  };

  const teamSides = [
    {
      label: awayTeam.name,
      abbr: awayTeam.abbreviation,
      side: 'away' as const,
      data: boxscore.away,
      teamInfo: awayTeam,
    },
    {
      label: homeTeam.name,
      abbr: homeTeam.abbreviation,
      side: 'home' as const,
      data: boxscore.home,
      teamInfo: homeTeam,
    },
  ].filter((t) => teamFilter === 'both' || teamFilter === t.side);

  return (
    <div className="space-y-3">
      {/* Linescore */}
      {showLinescore && linescore && (
        <div className="heritage-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-text-primary" aria-label="Linescore">
              <thead>
                <tr className="surface-lifted border-b border-border-vintage text-xs text-text-tertiary font-display uppercase tracking-wider">
                  <th scope="col" className="text-left px-4 py-2 w-32">
                    Team
                  </th>
                  {linescore.innings.map((_, i) => (
                    <th scope="col" key={i} className="px-2 py-2 text-center w-8">
                      {i + 1}
                    </th>
                  ))}
                  <th scope="col" className="px-3 py-2 text-center font-bold text-text-primary">
                    R
                  </th>
                  <th scope="col" className="px-3 py-2 text-center font-bold text-text-primary">
                    H
                  </th>
                  <th scope="col" className="px-3 py-2 text-center font-bold text-text-primary">
                    E
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border-subtle">
                  <td className="px-4 py-2 font-medium">{awayTeam.abbreviation}</td>
                  {linescore.innings.map((inn, i) => (
                    <td key={i} className="px-2 py-2 text-center tabular-nums">
                      {inn.away ?? '-'}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-center font-bold tabular-nums text-bsi-primary-light">
                    {linescore.totals.away.runs}
                  </td>
                  <td className="px-3 py-2 text-center tabular-nums">
                    {linescore.totals.away.hits}
                  </td>
                  <td className="px-3 py-2 text-center tabular-nums">
                    {linescore.totals.away.errors}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium">{homeTeam.abbreviation}</td>
                  {linescore.innings.map((inn, i) => (
                    <td key={i} className="px-2 py-2 text-center tabular-nums">
                      {inn.home ?? '-'}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-center font-bold tabular-nums text-bsi-primary-light">
                    {linescore.totals.home.runs}
                  </td>
                  <td className="px-3 py-2 text-center tabular-nums">
                    {linescore.totals.home.hits}
                  </td>
                  <td className="px-3 py-2 text-center tabular-nums">
                    {linescore.totals.home.errors}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Leader Strip */}
      {showLeaders && (
        <LeaderStrip
          variant="baseball"
          boxscore={boxscore}
          awayTeam={awayTeam}
          homeTeam={homeTeam}
        />
      )}

      <div className="heritage-card overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-border-vintage surface-lifted">
          {(['batting', 'pitching'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-xs font-display uppercase tracking-[0.2em] transition-colors ${
                activeTab === tab
                  ? 'text-bsi-primary border-b-2 border-bsi-primary'
                  : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Batting tables */}
        {activeTab === 'batting' && (
          <div className="divide-y divide-border-subtle">
            {teamSides.map((side) => {
              if (side.data.batting.length === 0) return null;
              const group = `batting-${side.abbr}`;
              const topH = teamTopHit(side.data.batting);
              const sortedBatting = sortRows(side.data.batting, group, sort, battingAccessor);
              return (
                <div key={side.abbr} className="p-3 md:p-4">
                  <BattingTable
                    teamAbbr={side.abbr}
                    teamName={side.teamInfo.name}
                    batting={sortedBatting}
                    rawBatting={side.data.batting}
                    topH={topH}
                    isCompact={isCompact}
                    group={group}
                    sort={sort}
                    onSort={setSort}
                    sortable={sortable}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Pitching tables */}
        {activeTab === 'pitching' && (
          <div className="divide-y divide-border-subtle">
            {teamSides.map((side) => {
              if (side.data.pitching.length === 0) return null;
              const group = `pitching-${side.abbr}`;
              const sortedPitching = sortRows(side.data.pitching, group, sort, pitchingAccessor);
              return (
                <div key={side.abbr} className="p-3 md:p-4">
                  <PitchingTable
                    teamAbbr={side.abbr}
                    pitching={sortedPitching}
                    group={group}
                    sort={sort}
                    onSort={setSort}
                    sortable={sortable}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Batting sub-table
// ---------------------------------------------------------------------------

interface BattingTableProps {
  teamAbbr: string;
  teamName: string;
  batting: BattingLine[];
  rawBatting: BattingLine[];
  topH: number;
  isCompact: boolean;
  group: string;
  sort: SortState | null;
  onSort: (next: SortState | null) => void;
  sortable: boolean;
}

function BattingTable({
  teamAbbr,
  teamName,
  batting,
  rawBatting,
  topH,
  isCompact,
  group,
  sort,
  onSort,
  sortable,
}: BattingTableProps) {
  return (
    <>
      <h4 className="flex items-center gap-2 mb-2">
        <span className="heritage-stamp">{teamAbbr}</span>
        <span className="text-text-tertiary text-xs">{teamName}</span>
      </h4>
      <div className="overflow-x-auto">
        <table
          className="w-full text-xs text-text-secondary"
          aria-label={`${teamAbbr} batting statistics`}
        >
          <thead>
            <tr className="surface-lifted text-[0.65rem]">
              <SortableTh
                sortKey="player"
                group={group}
                sort={sort}
                onSort={onSort}
                sortable={sortable}
                align="left"
                className="pl-2 sticky left-0 bg-surface-press-box z-10 min-w-[9rem]"
              >
                Batter
              </SortableTh>
              <SortableTh sortKey="ab" group={group} sort={sort} onSort={onSort} sortable={sortable}>
                AB
              </SortableTh>
              <SortableTh sortKey="r" group={group} sort={sort} onSort={onSort} sortable={sortable}>
                R
              </SortableTh>
              <SortableTh sortKey="h" group={group} sort={sort} onSort={onSort} sortable={sortable}>
                H
              </SortableTh>
              <SortableTh sortKey="rbi" group={group} sort={sort} onSort={onSort} sortable={sortable}>
                RBI
              </SortableTh>
              <SortableTh sortKey="hr" group={group} sort={sort} onSort={onSort} sortable={sortable}>
                HR
              </SortableTh>
              <SortableTh sortKey="bb" group={group} sort={sort} onSort={onSort} sortable={sortable}>
                BB
              </SortableTh>
              <SortableTh sortKey="so" group={group} sort={sort} onSort={onSort} sortable={sortable}>
                SO
              </SortableTh>
              <SortableTh sortKey="avg" group={group} sort={sort} onSort={onSort} sortable={sortable}>
                AVG
              </SortableTh>
              {!isCompact && (
                <SortableTh sortKey="obp" group={group} sort={sort} onSort={onSort} sortable={sortable}>
                  OBP
                </SortableTh>
              )}
              {!isCompact && (
                <SortableTh sortKey="slg" group={group} sort={sort} onSort={onSort} sortable={sortable}>
                  SLG
                </SortableTh>
              )}
            </tr>
          </thead>
          <tbody>
            {batting.map((b, i) => {
              const isTopH = b.h === topH && topH > 0;
              return (
                <tr
                  key={i}
                  className="border-t border-border-subtle odd:bg-black/10 hover:bg-surface-press-box/60"
                >
                  <td className="py-1.5 pl-2 pr-3 sticky left-0 bg-surface-dugout z-10 min-w-[9rem]">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {b.player.position && (
                        <span className="text-text-tertiary text-[0.65rem] font-mono uppercase">
                          {b.player.position}
                        </span>
                      )}
                      <span className="text-text-primary font-medium">{b.player.name}</span>
                      {b.player.year && (
                        <span className="text-text-tertiary text-[0.65rem]">({b.player.year})</span>
                      )}
                      {typeof b.player.ranking === 'number' && (
                        <span className="text-bsi-primary-light text-[0.65rem] font-display">
                          #{b.player.ranking}
                        </span>
                      )}
                      {(b.hr ?? 0) > 0 && (
                        <span className="text-[0.6rem] font-display uppercase tracking-wider text-bsi-primary-light border border-bsi-primary/60 px-1 rounded-sm">
                          HR
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="text-center tabular-nums">{b.ab}</td>
                  <td className="text-center tabular-nums">{b.r}</td>
                  <td
                    className={`text-center tabular-nums ${isTopH ? 'text-bsi-primary-light font-bold' : ''}`}
                  >
                    {b.h}
                  </td>
                  <td className="text-center tabular-nums">{b.rbi}</td>
                  <td className="text-center tabular-nums">{b.hr ?? 0}</td>
                  <td className="text-center tabular-nums">{b.bb}</td>
                  <td className="text-center tabular-nums">{b.so}</td>
                  <td className="text-center tabular-nums">{b.avg}</td>
                  {!isCompact && <td className="text-center tabular-nums">{b.obp ?? '-'}</td>}
                  {!isCompact && <td className="text-center tabular-nums">{b.slg ?? '-'}</td>}
                </tr>
              );
            })}
            <tr className="border-t border-border-vintage font-bold surface-lifted">
              <td className="py-1.5 pl-2 pr-3 sticky left-0 bg-surface-press-box z-10 font-display uppercase tracking-wider text-text-primary">
                TOTALS
              </td>
              <td className="text-center tabular-nums">{sumBatting(rawBatting, 'ab')}</td>
              <td className="text-center tabular-nums">{sumBatting(rawBatting, 'r')}</td>
              <td className="text-center tabular-nums">{sumBatting(rawBatting, 'h')}</td>
              <td className="text-center tabular-nums">{sumBatting(rawBatting, 'rbi')}</td>
              <td className="text-center tabular-nums">
                {rawBatting.reduce((s, b) => s + (b.hr ?? 0), 0)}
              </td>
              <td className="text-center tabular-nums">{sumBatting(rawBatting, 'bb')}</td>
              <td className="text-center tabular-nums">{sumBatting(rawBatting, 'so')}</td>
              <td />
              {!isCompact && <td />}
              {!isCompact && <td />}
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Pitching sub-table
// ---------------------------------------------------------------------------

interface PitchingTableProps {
  teamAbbr: string;
  pitching: PitchingLine[];
  group: string;
  sort: SortState | null;
  onSort: (next: SortState | null) => void;
  sortable: boolean;
}

function PitchingTable({
  teamAbbr,
  pitching,
  group,
  sort,
  onSort,
  sortable,
}: PitchingTableProps) {
  return (
    <>
      <h4 className="flex items-center gap-2 mb-2">
        <span className="heritage-stamp">{teamAbbr}</span>
      </h4>
      <div className="overflow-x-auto">
        <table
          className="w-full text-xs text-text-secondary"
          aria-label={`${teamAbbr} pitching statistics`}
        >
          <thead>
            <tr className="surface-lifted text-[0.65rem]">
              <SortableTh
                sortKey="player"
                group={group}
                sort={sort}
                onSort={onSort}
                sortable={sortable}
                align="left"
                className="pl-2 sticky left-0 bg-surface-press-box z-10 min-w-[9rem]"
              >
                Pitcher
              </SortableTh>
              <SortableTh sortKey="ip" group={group} sort={sort} onSort={onSort} sortable={sortable}>
                IP
              </SortableTh>
              <SortableTh sortKey="h" group={group} sort={sort} onSort={onSort} sortable={sortable}>
                H
              </SortableTh>
              <SortableTh sortKey="r" group={group} sort={sort} onSort={onSort} sortable={sortable}>
                R
              </SortableTh>
              <SortableTh sortKey="er" group={group} sort={sort} onSort={onSort} sortable={sortable}>
                ER
              </SortableTh>
              <SortableTh sortKey="bb" group={group} sort={sort} onSort={onSort} sortable={sortable}>
                BB
              </SortableTh>
              <SortableTh sortKey="so" group={group} sort={sort} onSort={onSort} sortable={sortable}>
                SO
              </SortableTh>
              <SortableTh sortKey="era" group={group} sort={sort} onSort={onSort} sortable={sortable}>
                ERA
              </SortableTh>
            </tr>
          </thead>
          <tbody>
            {pitching.map((p, i) => {
              const isQS = p.er === 0 && ipToOuts(p.ip) >= 15;
              return (
                <tr
                  key={i}
                  className="border-t border-border-subtle odd:bg-black/10 hover:bg-surface-press-box/60"
                >
                  <td className="py-1.5 pl-2 pr-3 sticky left-0 bg-surface-dugout z-10 min-w-[9rem]">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-text-primary font-medium">{p.player.name}</span>
                      {p.decision && <span className="text-text-tertiary">({p.decision})</span>}
                      {p.player.year && (
                        <span className="text-text-tertiary text-[0.65rem]">({p.player.year})</span>
                      )}
                      {isQS && (
                        <span className="text-[0.6rem] font-display uppercase tracking-wider text-heritage-columbia-blue border border-heritage-columbia-blue/60 px-1 rounded-sm">
                          QS
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="text-center tabular-nums">{p.ip}</td>
                  <td className="text-center tabular-nums">{p.h}</td>
                  <td className="text-center tabular-nums">{p.r}</td>
                  <td className="text-center tabular-nums">{p.er}</td>
                  <td className="text-center tabular-nums">{p.bb}</td>
                  <td className="text-center tabular-nums">{p.so}</td>
                  <td className="text-center tabular-nums">{p.era}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
