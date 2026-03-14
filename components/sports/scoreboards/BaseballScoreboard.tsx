'use client';

import type { ReactNode } from 'react';
import { Badge, FreshnessBadge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import type { DataMeta } from '@/lib/types/data-meta';

// ============================================================================
// TYPES — Baseball-shaped game data (MLB, College Baseball)
// ============================================================================

interface BaseballTeamSide {
  name: string;
  abbreviation: string;
  score: number;
  isWinner: boolean;
  record?: string;
  conference?: string;
  ranking?: number;
}

export interface BaseballGameData {
  id: number | string;
  date: string;
  status: {
    state: string;
    detailedState: string;
    inning?: number;
    inningState?: string;
    isLive: boolean;
    isFinal: boolean;
  };
  teams: {
    away: BaseballTeamSide;
    home: BaseballTeamSide;
  };
  venue: { name: string; city?: string; state?: string };
  linescore?: {
    innings: Array<{ away: number; home: number }>;
    totals: {
      away: { runs: number; hits: number; errors: number };
      home: { runs: number; hits: number; errors: number };
    };
  };
  boxscore?: Record<string, unknown>;
  plays?: unknown[];
}

// ============================================================================
// COMPONENT
// ============================================================================

interface BaseballScoreboardProps {
  game: BaseballGameData;
  meta: DataMeta | null;
  /** Show conference badge (college baseball). */
  showConference?: boolean;
  /** Show ranking badges on team circles (college baseball). */
  showRankings?: boolean;
  /** Minimum innings to display in linescore (defaults to 9). */
  minInnings?: number;
}

export function BaseballScoreboard({
  game,
  meta,
  showConference = false,
  showRankings = false,
  minInnings = 9,
}: BaseballScoreboardProps): ReactNode {
  const { away, home } = game.teams;
  const inningCount = game.linescore
    ? Math.max(game.linescore.innings.length, minInnings)
    : minInnings;

  return (
    <>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <Badge variant="secondary">
          {new Date(game.date).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
          })}
        </Badge>
        {game.status.isLive && <FreshnessBadge isLive fetchedAt={meta?.lastUpdated} />}
        {showConference && away.conference && (
          <Badge variant="outline">{away.conference}</Badge>
        )}
      </div>

      {/* Scoreboard */}
      <div className="flex items-center justify-center gap-8 md:gap-16 py-6">
        {/* Away Team */}
        <div className="text-center">
          <div className="w-16 h-16 bg-background-secondary rounded-full flex items-center justify-center text-xl font-bold text-burnt-orange mx-auto mb-2 relative">
            {away.abbreviation}
            {showRankings && away.ranking && (
              <span className="absolute -top-1 -right-1 w-6 h-6 bg-burnt-orange text-white text-xs font-bold rounded-full flex items-center justify-center">
                {away.ranking}
              </span>
            )}
          </div>
          <p className="font-semibold text-text-primary">{away.name}</p>
          <p className="text-xs text-text-tertiary">{away.record || ''}</p>
          <p
            className={`text-4xl font-bold font-mono mt-2 ${
              game.status.isFinal && away.isWinner
                ? 'text-text-primary'
                : 'text-text-secondary'
            }`}
          >
            {away.score}
          </p>
        </div>

        {/* Status */}
        <div className="text-center">
          {game.status.isLive ? (
            <span className="flex items-center justify-center gap-1.5 text-success font-semibold">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
              {game.status.inningState} {game.status.inning}
            </span>
          ) : game.status.isFinal ? (
            <span className="text-text-tertiary font-semibold">FINAL</span>
          ) : (
            <span className="text-burnt-orange font-semibold">
              {game.status.detailedState}
            </span>
          )}
          <p className="text-xs text-text-tertiary mt-1">{game.venue?.name}</p>
        </div>

        {/* Home Team */}
        <div className="text-center">
          <div className="w-16 h-16 bg-background-secondary rounded-full flex items-center justify-center text-xl font-bold text-burnt-orange mx-auto mb-2 relative">
            {home.abbreviation}
            {showRankings && home.ranking && (
              <span className="absolute -top-1 -right-1 w-6 h-6 bg-burnt-orange text-white text-xs font-bold rounded-full flex items-center justify-center">
                {home.ranking}
              </span>
            )}
          </div>
          <p className="font-semibold text-text-primary">{home.name}</p>
          <p className="text-xs text-text-tertiary">{home.record || ''}</p>
          <p
            className={`text-4xl font-bold font-mono mt-2 ${
              game.status.isFinal && home.isWinner
                ? 'text-text-primary'
                : 'text-text-secondary'
            }`}
          >
            {home.score}
          </p>
        </div>
      </div>

      {/* Innings Linescore with R/H/E */}
      {game.linescore && (
        <Card variant="default" padding="sm" className="mt-4 max-w-2xl mx-auto">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border-subtle text-text-tertiary">
                  <th className="text-left p-1.5 w-12">Team</th>
                  {Array.from({ length: inningCount }, (_, i) => (
                    <th key={i} className="text-center p-1.5 w-5">
                      {i + 1}
                    </th>
                  ))}
                  <th className="text-center p-1.5 w-6 border-l border-border-subtle text-burnt-orange font-bold">
                    R
                  </th>
                  <th className="text-center p-1.5 w-6">H</th>
                  <th className="text-center p-1.5 w-6">E</th>
                </tr>
              </thead>
              <tbody className="text-text-secondary">
                <tr className="border-b border-border-subtle">
                  <td className="p-1.5 font-semibold text-text-primary">
                    {away.abbreviation}
                  </td>
                  {Array.from({ length: inningCount }, (_, i) => (
                    <td key={i} className="text-center p-1.5 font-mono">
                      {game.linescore?.innings[i]?.away ?? '-'}
                    </td>
                  ))}
                  <td className="text-center p-1.5 font-mono font-bold text-text-primary border-l border-border-subtle">
                    {game.linescore.totals.away.runs}
                  </td>
                  <td className="text-center p-1.5 font-mono">
                    {game.linescore.totals.away.hits}
                  </td>
                  <td className="text-center p-1.5 font-mono">
                    {game.linescore.totals.away.errors}
                  </td>
                </tr>
                <tr>
                  <td className="p-1.5 font-semibold text-text-primary">
                    {home.abbreviation}
                  </td>
                  {Array.from({ length: inningCount }, (_, i) => (
                    <td key={i} className="text-center p-1.5 font-mono">
                      {game.linescore?.innings[i]?.home ?? '-'}
                    </td>
                  ))}
                  <td className="text-center p-1.5 font-mono font-bold text-text-primary border-l border-border-subtle">
                    {game.linescore.totals.home.runs}
                  </td>
                  <td className="text-center p-1.5 font-mono">
                    {game.linescore.totals.home.hits}
                  </td>
                  <td className="text-center p-1.5 font-mono">
                    {game.linescore.totals.home.errors}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
