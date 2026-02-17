'use client';

import { useState, useEffect, useRef } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TeamInfo {
  name: string;
  abbreviation: string;
  score: number;
  logo: string;
  winner: boolean;
}

interface GameStatus {
  state: string;
  detail: string;
  period: number;
  completed: boolean;
}

interface GameSituation {
  balls: number;
  strikes: number;
  outs: number;
  onFirst: boolean;
  onSecond: boolean;
  onThird: boolean;
  batter: string;
  pitcher: string;
}

export interface LiveScoreGame {
  id: string;
  name: string;
  shortName: string;
  date: string;
  status: GameStatus;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  situation?: GameSituation;
}

interface LiveScoreCardProps {
  game: LiveScoreGame;
  /** Optional className override for the outer container. */
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusLabel(status: GameStatus): string {
  if (status.completed) return 'Final';
  if (status.state === 'in') return status.detail || `Inning ${status.period}`;
  if (status.state === 'pre') return status.detail || 'Scheduled';
  if (status.state === 'post') return 'Final';
  return status.detail || status.state;
}

function statusColor(status: GameStatus): string {
  if (status.state === 'in') return 'text-green-400';
  if (status.completed || status.state === 'post') return 'text-text-secondary';
  return 'text-text-tertiary';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LiveScoreCard({ game, className = '' }: LiveScoreCardProps) {
  const { homeTeam, awayTeam, status, situation } = game;
  const isLive = status.state === 'in';

  // Pulse animation when score changes
  const [pulse, setPulse] = useState(false);
  const prevScoreRef = useRef(`${homeTeam.score}-${awayTeam.score}`);

  useEffect(() => {
    const currentScore = `${homeTeam.score}-${awayTeam.score}`;
    if (prevScoreRef.current !== currentScore && prevScoreRef.current !== '0-0') {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 1500);
      return () => clearTimeout(timer);
    }
    prevScoreRef.current = currentScore;
  }, [homeTeam.score, awayTeam.score]);

  return (
    <div
      className={`
        relative bg-charcoal/60 border border-border-subtle rounded-xl p-4
        transition-all duration-300 hover:border-border-strong
        ${pulse ? 'animate-pulse-glow' : ''}
        ${className}
      `}
    >
      {/* Live Indicator */}
      {isLive && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
          </span>
          <span className="text-green-400 text-[10px] font-semibold uppercase tracking-wider">
            Live
          </span>
        </div>
      )}

      {/* Status */}
      <div className="mb-3">
        <span className={`text-xs font-semibold uppercase tracking-wider ${statusColor(status)}`}>
          {statusLabel(status)}
        </span>
      </div>

      {/* Teams */}
      <div className="space-y-2">
        <TeamRow team={awayTeam} isWinner={awayTeam.winner} isLive={isLive} />
        <TeamRow team={homeTeam} isWinner={homeTeam.winner} isLive={isLive} />
      </div>

      {/* Situation (live games only) */}
      {isLive && situation && (
        <div className="mt-3 pt-3 border-t border-border-subtle">
          <div className="flex items-center justify-between text-[10px] text-text-tertiary uppercase tracking-wider">
            <span>
              {situation.outs} {situation.outs === 1 ? 'out' : 'outs'}
            </span>
            <span className="font-mono">
              {situation.balls}-{situation.strikes}
            </span>
            <BaseDiagram
              onFirst={situation.onFirst}
              onSecond={situation.onSecond}
              onThird={situation.onThird}
            />
          </div>
          {situation.batter && (
            <div className="mt-1.5 text-[10px] text-text-tertiary">
              <span className="text-text-secondary">AB:</span> {situation.batter}
              {situation.pitcher && (
                <>
                  {' '}<span className="text-text-secondary">P:</span> {situation.pitcher}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TeamRow({
  team,
  isWinner,
  isLive,
}: {
  team: TeamInfo;
  isWinner: boolean;
  isLive: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {team.logo && (
          <img
            src={team.logo}
            alt={`${team.name} logo`}
            className="w-5 h-5 object-contain shrink-0"
            loading="lazy"
          />
        )}
        <span
          className={`text-sm truncate ${
            isWinner ? 'text-text-primary font-bold' : 'text-text-secondary'
          }`}
        >
          {team.abbreviation || team.name}
        </span>
      </div>
      <span
        className={`font-mono text-lg tabular-nums ${
          isWinner
            ? 'text-burnt-orange font-bold'
            : isLive
              ? 'text-text-primary'
              : 'text-text-secondary'
        }`}
      >
        {team.score}
      </span>
    </div>
  );
}

function BaseDiagram({
  onFirst,
  onSecond,
  onThird,
}: {
  onFirst: boolean;
  onSecond: boolean;
  onThird: boolean;
}) {
  const baseClass = 'w-2.5 h-2.5 rotate-45 border';
  const emptyClass = `${baseClass} border-text-tertiary bg-transparent`;
  const occupiedClass = `${baseClass} border-burnt-orange bg-burnt-orange`;

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className={onSecond ? occupiedClass : emptyClass} />
      <div className="flex gap-2.5">
        <div className={onThird ? occupiedClass : emptyClass} />
        <div className={onFirst ? occupiedClass : emptyClass} />
      </div>
    </div>
  );
}
