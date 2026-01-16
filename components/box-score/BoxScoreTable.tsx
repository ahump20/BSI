'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

// ============================================================================
// TYPES
// ============================================================================

export interface BattingLine {
  player: {
    id: string;
    name: string;
    position: string;
    jerseyNumber?: string;
  };
  ab: number;
  r: number;
  h: number;
  rbi: number;
  bb: number;
  so: number;
  avg: string;
  obp?: string;
  slg?: string;
  ops?: string;
  hr?: number;
  sb?: number;
}

export interface PitchingLine {
  player: {
    id: string;
    name: string;
    jerseyNumber?: string;
  };
  decision?: 'W' | 'L' | 'S' | 'H' | 'BS' | null;
  ip: string;
  h: number;
  r: number;
  er: number;
  bb: number;
  so: number;
  pitches?: number;
  strikes?: number;
  era: string;
  whip?: string;
}

export interface LinescoreInning {
  away: number | null;
  home: number | null;
}

export interface Linescore {
  innings: LinescoreInning[];
  totals: {
    away: { runs: number; hits: number; errors: number };
    home: { runs: number; hits: number; errors: number };
  };
}

export interface TeamBoxScore {
  batting: BattingLine[];
  pitching: PitchingLine[];
}

export interface BoxScoreData {
  away: TeamBoxScore;
  home: TeamBoxScore;
}

export interface TeamInfo {
  name: string;
  abbreviation: string;
  score: number;
  isWinner?: boolean;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface BoxScoreTableProps {
  linescore?: Linescore;
  boxscore?: BoxScoreData;
  awayTeam: TeamInfo;
  homeTeam: TeamInfo;
  variant?: 'full' | 'compact';
  showLinescore?: boolean;
  defaultTab?: 'batting' | 'pitching';
  className?: string;
}

/**
 * BoxScoreTable Component
 *
 * ESPN-style box score with:
 * - Linescore header
 * - Batting tables for both teams
 * - Pitching tables for both teams
 * - Responsive scrolling on mobile
 */
export function BoxScoreTable({
  linescore,
  boxscore,
  awayTeam,
  homeTeam,
  variant = 'full',
  showLinescore = true,
  defaultTab = 'batting',
  className = '',
}: BoxScoreTableProps) {
  const [activeTab, setActiveTab] = useState<'batting' | 'pitching'>(defaultTab);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Linescore */}
      {showLinescore && linescore && (
        <Card variant="default" padding="md">
          <LinescoreDisplay linescore={linescore} awayTeam={awayTeam} homeTeam={homeTeam} />
        </Card>
      )}

      {/* Box Score Tabs */}
      {boxscore && (
        <>
          <div className="flex gap-2 border-b border-border-subtle pb-px">
            <button
              onClick={() => setActiveTab('batting')}
              className={`px-6 py-3 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px ${
                activeTab === 'batting'
                  ? 'text-burnt-orange border-burnt-orange'
                  : 'text-text-tertiary border-transparent hover:text-white'
              }`}
            >
              Batting
            </button>
            <button
              onClick={() => setActiveTab('pitching')}
              className={`px-6 py-3 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px ${
                activeTab === 'pitching'
                  ? 'text-burnt-orange border-burnt-orange'
                  : 'text-text-tertiary border-transparent hover:text-white'
              }`}
            >
              Pitching
            </button>
          </div>

          {/* Batting Tables */}
          {activeTab === 'batting' && (
            <div className="space-y-6">
              <BattingTable team={awayTeam} batting={boxscore.away.batting} variant={variant} />
              <BattingTable team={homeTeam} batting={boxscore.home.batting} variant={variant} />
            </div>
          )}

          {/* Pitching Tables */}
          {activeTab === 'pitching' && (
            <div className="space-y-6">
              <PitchingTable team={awayTeam} pitching={boxscore.away.pitching} variant={variant} />
              <PitchingTable team={homeTeam} pitching={boxscore.home.pitching} variant={variant} />
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!boxscore && (
        <Card variant="default" padding="lg">
          <div className="text-center py-8">
            <svg
              viewBox="0 0 24 24"
              className="w-16 h-16 text-text-tertiary mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-text-secondary">Box score data not available yet</p>
            <p className="text-text-tertiary text-sm mt-2">
              Stats will appear once the game gets underway
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// LINESCORE DISPLAY
// ============================================================================

interface LinescoreDisplayProps {
  linescore: Linescore;
  awayTeam: TeamInfo;
  homeTeam: TeamInfo;
}

function LinescoreDisplay({ linescore, awayTeam, homeTeam }: LinescoreDisplayProps) {
  const innings = linescore.innings;
  const maxInnings = Math.max(innings.length, 9);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] text-sm">
        <thead>
          <tr className="border-b border-border-subtle">
            <th className="text-left p-2 text-text-tertiary font-medium w-32">Team</th>
            {Array.from({ length: maxInnings }, (_, i) => (
              <th key={i} className="text-center p-2 text-text-tertiary font-medium w-8">
                {i + 1}
              </th>
            ))}
            <th className="text-center p-2 text-burnt-orange font-bold w-10 border-l border-border-subtle">
              R
            </th>
            <th className="text-center p-2 text-text-tertiary font-medium w-10">H</th>
            <th className="text-center p-2 text-text-tertiary font-medium w-10">E</th>
          </tr>
        </thead>
        <tbody>
          {/* Away Team */}
          <tr className="border-b border-border-subtle">
            <td className="p-2">
              <span
                className={`font-semibold ${awayTeam.isWinner ? 'text-white' : 'text-text-secondary'}`}
              >
                {awayTeam.abbreviation}
              </span>
            </td>
            {Array.from({ length: maxInnings }, (_, i) => (
              <td key={i} className="text-center p-2 text-text-secondary font-mono">
                {innings[i]?.away ?? '-'}
              </td>
            ))}
            <td className="text-center p-2 text-white font-bold font-mono border-l border-border-subtle">
              {linescore.totals.away.runs}
            </td>
            <td className="text-center p-2 text-text-secondary font-mono">
              {linescore.totals.away.hits}
            </td>
            <td className="text-center p-2 text-text-secondary font-mono">
              {linescore.totals.away.errors}
            </td>
          </tr>
          {/* Home Team */}
          <tr>
            <td className="p-2">
              <span
                className={`font-semibold ${homeTeam.isWinner ? 'text-white' : 'text-text-secondary'}`}
              >
                {homeTeam.abbreviation}
              </span>
            </td>
            {Array.from({ length: maxInnings }, (_, i) => (
              <td key={i} className="text-center p-2 text-text-secondary font-mono">
                {innings[i]?.home ?? '-'}
              </td>
            ))}
            <td className="text-center p-2 text-white font-bold font-mono border-l border-border-subtle">
              {linescore.totals.home.runs}
            </td>
            <td className="text-center p-2 text-text-secondary font-mono">
              {linescore.totals.home.hits}
            </td>
            <td className="text-center p-2 text-text-secondary font-mono">
              {linescore.totals.home.errors}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// BATTING TABLE
// ============================================================================

interface BattingTableProps {
  team: TeamInfo;
  batting: BattingLine[];
  variant: 'full' | 'compact';
}

function BattingTable({ team, batting, variant }: BattingTableProps) {
  const columns =
    variant === 'compact'
      ? ['AB', 'R', 'H', 'RBI', 'BB', 'SO', 'AVG']
      : ['AB', 'R', 'H', 'RBI', 'HR', 'BB', 'SO', 'SB', 'AVG', 'OBP', 'SLG'];

  // Calculate team totals
  const totals = batting.reduce(
    (acc, line) => ({
      ab: acc.ab + line.ab,
      r: acc.r + line.r,
      h: acc.h + line.h,
      rbi: acc.rbi + line.rbi,
      bb: acc.bb + line.bb,
      so: acc.so + line.so,
      hr: acc.hr + (line.hr || 0),
      sb: acc.sb + (line.sb || 0),
    }),
    { ab: 0, r: 0, h: 0, rbi: 0, bb: 0, so: 0, hr: 0, sb: 0 }
  );

  return (
    <Card variant="default" padding="md">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <span className="w-8 h-8 bg-charcoal rounded-full flex items-center justify-center text-xs font-bold text-burnt-orange">
            {team.abbreviation}
          </span>
          {team.name} Batting
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b-2 border-burnt-orange">
                <th className="text-left p-2 text-burnt-orange/80 font-semibold">Batter</th>
                {columns.map((col) => (
                  <th key={col} className="text-center p-2 text-burnt-orange/80 font-semibold w-12">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {batting.map((line, idx) => {
                const hasMultiHit = line.h >= 2;
                const hasHR = (line.hr || 0) > 0;

                return (
                  <tr
                    key={`${line.player.id}-${idx}`}
                    className={`border-b border-border-subtle hover:bg-white/5 transition-colors ${
                      hasMultiHit ? 'bg-success/5' : ''
                    }`}
                  >
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{line.player.name}</span>
                        <span className="text-text-tertiary text-xs">{line.player.position}</span>
                        {hasHR && (
                          <Badge variant="warning" size="sm">
                            HR
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="text-center p-2 text-text-secondary font-mono">{line.ab}</td>
                    <td className="text-center p-2 text-text-secondary font-mono">{line.r}</td>
                    <td
                      className={`text-center p-2 font-mono ${hasMultiHit ? 'text-success font-bold' : 'text-text-secondary'}`}
                    >
                      {line.h}
                    </td>
                    <td className="text-center p-2 text-text-secondary font-mono">{line.rbi}</td>
                    {variant === 'full' && (
                      <td
                        className={`text-center p-2 font-mono ${hasHR ? 'text-warning font-bold' : 'text-text-secondary'}`}
                      >
                        {line.hr || 0}
                      </td>
                    )}
                    <td className="text-center p-2 text-text-secondary font-mono">{line.bb}</td>
                    <td className="text-center p-2 text-text-secondary font-mono">{line.so}</td>
                    {variant === 'full' && (
                      <td className="text-center p-2 text-text-secondary font-mono">
                        {line.sb || 0}
                      </td>
                    )}
                    <td className="text-center p-2 text-text-secondary font-mono">{line.avg}</td>
                    {variant === 'full' && (
                      <>
                        <td className="text-center p-2 text-text-secondary font-mono">
                          {line.obp || '-'}
                        </td>
                        <td className="text-center p-2 text-text-secondary font-mono">
                          {line.slg || '-'}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
              {/* Totals Row */}
              <tr className="border-t-2 border-burnt-orange bg-charcoal">
                <td className="p-2 font-bold text-white">TOTALS</td>
                <td className="text-center p-2 text-white font-mono font-bold">{totals.ab}</td>
                <td className="text-center p-2 text-white font-mono font-bold">{totals.r}</td>
                <td className="text-center p-2 text-white font-mono font-bold">{totals.h}</td>
                <td className="text-center p-2 text-white font-mono font-bold">{totals.rbi}</td>
                {variant === 'full' && (
                  <td className="text-center p-2 text-white font-mono font-bold">{totals.hr}</td>
                )}
                <td className="text-center p-2 text-white font-mono font-bold">{totals.bb}</td>
                <td className="text-center p-2 text-white font-mono font-bold">{totals.so}</td>
                {variant === 'full' && (
                  <>
                    <td className="text-center p-2 text-white font-mono font-bold">{totals.sb}</td>
                    <td className="text-center p-2 text-text-tertiary">-</td>
                    <td className="text-center p-2 text-text-tertiary">-</td>
                    <td className="text-center p-2 text-text-tertiary">-</td>
                  </>
                )}
                {variant === 'compact' && <td className="text-center p-2 text-text-tertiary">-</td>}
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// PITCHING TABLE
// ============================================================================

interface PitchingTableProps {
  team: TeamInfo;
  pitching: PitchingLine[];
  variant: 'full' | 'compact';
}

function PitchingTable({ team, pitching, variant }: PitchingTableProps) {
  const columns =
    variant === 'compact'
      ? ['IP', 'H', 'R', 'ER', 'BB', 'SO', 'ERA']
      : ['IP', 'H', 'R', 'ER', 'BB', 'SO', 'PC-ST', 'ERA', 'WHIP'];

  return (
    <Card variant="default" padding="md">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <span className="w-8 h-8 bg-charcoal rounded-full flex items-center justify-center text-xs font-bold text-burnt-orange">
            {team.abbreviation}
          </span>
          {team.name} Pitching
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b-2 border-burnt-orange">
                <th className="text-left p-2 text-burnt-orange/80 font-semibold">Pitcher</th>
                {columns.map((col) => (
                  <th key={col} className="text-center p-2 text-burnt-orange/80 font-semibold w-14">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pitching.map((line, idx) => {
                const decisionColor =
                  line.decision === 'W'
                    ? 'text-success'
                    : line.decision === 'L'
                      ? 'text-error'
                      : line.decision === 'S'
                        ? 'text-burnt-orange'
                        : 'text-text-tertiary';

                return (
                  <tr
                    key={`${line.player.id}-${idx}`}
                    className="border-b border-border-subtle hover:bg-white/5 transition-colors"
                  >
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{line.player.name}</span>
                        {line.decision && (
                          <span className={`text-xs font-bold ${decisionColor}`}>
                            ({line.decision})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-center p-2 text-text-secondary font-mono">{line.ip}</td>
                    <td className="text-center p-2 text-text-secondary font-mono">{line.h}</td>
                    <td className="text-center p-2 text-text-secondary font-mono">{line.r}</td>
                    <td className="text-center p-2 text-text-secondary font-mono">{line.er}</td>
                    <td className="text-center p-2 text-text-secondary font-mono">{line.bb}</td>
                    <td className="text-center p-2 text-text-secondary font-mono">{line.so}</td>
                    {variant === 'full' && (
                      <td className="text-center p-2 text-text-secondary font-mono">
                        {line.pitches && line.strikes ? `${line.pitches}-${line.strikes}` : '-'}
                      </td>
                    )}
                    <td className="text-center p-2 text-text-secondary font-mono">{line.era}</td>
                    {variant === 'full' && (
                      <td className="text-center p-2 text-text-secondary font-mono">
                        {line.whip || '-'}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// SKELETON
// ============================================================================

export function BoxScoreTableSkeleton() {
  return (
    <div className="space-y-6">
      {/* Linescore Skeleton */}
      <Card variant="default" padding="md">
        <div className="overflow-x-auto">
          <div className="skeleton w-full h-24 rounded" />
        </div>
      </Card>

      {/* Tabs Skeleton */}
      <div className="flex gap-2 border-b border-border-subtle pb-px">
        <div className="skeleton w-24 h-10 rounded" />
        <div className="skeleton w-24 h-10 rounded" />
      </div>

      {/* Tables Skeleton */}
      <Card variant="default" padding="md">
        <div className="skeleton w-48 h-6 rounded mb-4" />
        <div className="skeleton w-full h-64 rounded" />
      </Card>
      <Card variant="default" padding="md">
        <div className="skeleton w-48 h-6 rounded mb-4" />
        <div className="skeleton w-full h-64 rounded" />
      </Card>
    </div>
  );
}

export default BoxScoreTable;
