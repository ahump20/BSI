'use client';

import { useState } from 'react';

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
  player: { id?: string; name: string; position?: string; jerseyNumber?: string };
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
  player: { id?: string; name: string; jerseyNumber?: string };
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

export interface BoxScoreTableProps {
  linescore?: Linescore;
  boxscore?: BoxScoreData;
  awayTeam: TeamInfo;
  homeTeam: TeamInfo;
  variant?: 'compact' | 'full';
  showLinescore?: boolean;
  defaultTab?: 'batting' | 'pitching';
  sport?: string;
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function BoxScoreTableSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-4">
      <div className="h-6 bg-surface rounded w-1/3" />
      <div className="h-32 bg-surface-light rounded" />
      <div className="h-48 bg-surface-light rounded" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sumBatting(lines: BattingLine[], key: 'ab' | 'r' | 'h' | 'rbi' | 'bb' | 'so'): number {
  return lines.reduce((sum, l) => sum + (l[key] as number), 0);
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
}: BoxScoreTableProps) {
  const [activeTab, setActiveTab] = useState<'batting' | 'pitching'>(defaultTab);
  const isCompact = variant === 'compact';

  if (!boxscore) {
    return (
      <div className="bg-background-primary rounded-xl overflow-hidden border border-border-subtle">
        <div className="px-4 py-8 text-center text-text-muted text-sm">
          Box score data not available yet
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background-primary rounded-xl overflow-hidden border border-border-subtle">
      {/* Linescore */}
      {showLinescore && linescore && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-text-primary" aria-label="Linescore">
            <thead>
              <tr className="border-b border-border text-xs text-text-muted uppercase">
                <th scope="col" className="text-left px-4 py-2 w-32">Team</th>
                {linescore.innings.map((_, i) => (
                  <th scope="col" key={i} className="px-2 py-2 text-center w-8">
                    {i + 1}
                  </th>
                ))}
                <th scope="col" className="px-3 py-2 text-center font-bold">R</th>
                <th scope="col" className="px-3 py-2 text-center font-bold">H</th>
                <th scope="col" className="px-3 py-2 text-center font-bold">E</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/5">
                <td className="px-4 py-2 font-medium">{awayTeam.abbreviation}</td>
                {linescore.innings.map((inn, i) => (
                  <td key={i} className="px-2 py-2 text-center tabular-nums">{inn.away ?? '-'}</td>
                ))}
                <td className="px-3 py-2 text-center font-bold tabular-nums">{linescore.totals.away.runs}</td>
                <td className="px-3 py-2 text-center tabular-nums">{linescore.totals.away.hits}</td>
                <td className="px-3 py-2 text-center tabular-nums">{linescore.totals.away.errors}</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-medium">{homeTeam.abbreviation}</td>
                {linescore.innings.map((inn, i) => (
                  <td key={i} className="px-2 py-2 text-center tabular-nums">{inn.home ?? '-'}</td>
                ))}
                <td className="px-3 py-2 text-center font-bold tabular-nums">{linescore.totals.home.runs}</td>
                <td className="px-3 py-2 text-center tabular-nums">{linescore.totals.home.hits}</td>
                <td className="px-3 py-2 text-center tabular-nums">{linescore.totals.home.errors}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex border-b border-border">
        {(['batting', 'pitching'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-xs font-display uppercase tracking-wider transition-colors ${
              activeTab === tab ? 'text-burnt-orange border-b-2 border-burnt-orange' : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Batting tables */}
      {activeTab === 'batting' && (
        <div className="divide-y divide-border-subtle">
          {[
            { label: awayTeam.name, abbr: awayTeam.abbreviation, batting: boxscore.away.batting },
            { label: homeTeam.name, abbr: homeTeam.abbreviation, batting: boxscore.home.batting },
          ].map((side) => (
            side.batting.length > 0 && (
              <div key={side.abbr} className="p-4">
                <h4 className="text-sm font-display text-text-secondary uppercase tracking-wider mb-3">
                  {side.abbr}
                </h4>
                <table className="w-full text-xs text-text-secondary" aria-label={`${side.abbr} batting statistics`}>
                  <thead>
                    <tr className="text-white/40 uppercase">
                      <th scope="col" className="text-left py-1">Batter</th>
                      <th scope="col" className="text-center py-1">AB</th>
                      <th scope="col" className="text-center py-1">R</th>
                      <th scope="col" className="text-center py-1">H</th>
                      <th scope="col" className="text-center py-1">RBI</th>
                      <th scope="col" className="text-center py-1">HR</th>
                      <th scope="col" className="text-center py-1">BB</th>
                      <th scope="col" className="text-center py-1">SO</th>
                      <th scope="col" className="text-center py-1">AVG</th>
                      {!isCompact && <th scope="col" className="text-center py-1">OBP</th>}
                      {!isCompact && <th scope="col" className="text-center py-1">SLG</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {side.batting.map((b, i) => (
                      <tr key={i} className="border-t border-white/5">
                        <td className="py-1">{b.player.name}</td>
                        <td className="text-center tabular-nums">{b.ab}</td>
                        <td className="text-center tabular-nums">{b.r}</td>
                        <td className="text-center tabular-nums">{b.h}</td>
                        <td className="text-center tabular-nums">{b.rbi}</td>
                        <td className="text-center tabular-nums">{b.hr ?? 0}</td>
                        <td className="text-center tabular-nums">{b.bb}</td>
                        <td className="text-center tabular-nums">{b.so}</td>
                        <td className="text-center tabular-nums">{b.avg}</td>
                        {!isCompact && <td className="text-center tabular-nums">{b.obp ?? '-'}</td>}
                        {!isCompact && <td className="text-center tabular-nums">{b.slg ?? '-'}</td>}
                      </tr>
                    ))}
                    <tr className="border-t border-white/10 font-bold">
                      <td className="py-1">TOTALS</td>
                      <td className="text-center tabular-nums">{sumBatting(side.batting, 'ab')}</td>
                      <td className="text-center tabular-nums">{sumBatting(side.batting, 'r')}</td>
                      <td className="text-center tabular-nums">{sumBatting(side.batting, 'h')}</td>
                      <td className="text-center tabular-nums">{sumBatting(side.batting, 'rbi')}</td>
                      <td className="text-center tabular-nums">{side.batting.reduce((s, b) => s + (b.hr ?? 0), 0)}</td>
                      <td className="text-center tabular-nums">{sumBatting(side.batting, 'bb')}</td>
                      <td className="text-center tabular-nums">{sumBatting(side.batting, 'so')}</td>
                      <td />
                      {!isCompact && <td />}
                      {!isCompact && <td />}
                    </tr>
                  </tbody>
                </table>
              </div>
            )
          ))}
        </div>
      )}

      {/* Pitching tables */}
      {activeTab === 'pitching' && (
        <div className="divide-y divide-border-subtle">
          {[
            { label: awayTeam.name, abbr: awayTeam.abbreviation, pitching: boxscore.away.pitching },
            { label: homeTeam.name, abbr: homeTeam.abbreviation, pitching: boxscore.home.pitching },
          ].map((side) => (
            side.pitching.length > 0 && (
              <div key={side.abbr} className="p-4">
                <h4 className="text-sm font-display text-text-secondary uppercase tracking-wider mb-3">
                  {side.abbr}
                </h4>
                <table className="w-full text-xs text-text-secondary" aria-label={`${side.abbr} pitching statistics`}>
                  <thead>
                    <tr className="text-white/40 uppercase">
                      <th scope="col" className="text-left py-1">Pitcher</th>
                      <th scope="col" className="text-center py-1">IP</th>
                      <th scope="col" className="text-center py-1">H</th>
                      <th scope="col" className="text-center py-1">R</th>
                      <th scope="col" className="text-center py-1">ER</th>
                      <th scope="col" className="text-center py-1">BB</th>
                      <th scope="col" className="text-center py-1">SO</th>
                      <th scope="col" className="text-center py-1">ERA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {side.pitching.map((p, i) => (
                      <tr key={i} className="border-t border-white/5">
                        <td className="py-1">
                          {p.player.name}
                          {p.decision && <span className="text-white/40 ml-1">({p.decision})</span>}
                        </td>
                        <td className="text-center tabular-nums">{p.ip}</td>
                        <td className="text-center tabular-nums">{p.h}</td>
                        <td className="text-center tabular-nums">{p.r}</td>
                        <td className="text-center tabular-nums">{p.er}</td>
                        <td className="text-center tabular-nums">{p.bb}</td>
                        <td className="text-center tabular-nums">{p.so}</td>
                        <td className="text-center tabular-nums">{p.era}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
}
