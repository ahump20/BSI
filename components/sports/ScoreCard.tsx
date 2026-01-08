'use client';

import Link from 'next/link';
import { GameStatusBadge, type GameStatus, LiveBadge } from '@/components/ui/Badge';

// Sport-specific color theming
const sportThemes = {
  mlb: {
    accent: 'text-baseball',
    accentBg: 'bg-baseball/10',
    accentRing: 'ring-baseball/50',
    accentGlow: 'shadow-[0_0_20px_rgba(34,139,34,0.15)]',
    badgeBg: 'bg-baseball/20',
    badgeText: 'text-baseball',
  },
  nfl: {
    accent: 'text-football',
    accentBg: 'bg-football/10',
    accentRing: 'ring-football/50',
    accentGlow: 'shadow-[0_0_20px_rgba(139,69,19,0.15)]',
    badgeBg: 'bg-football/20',
    badgeText: 'text-football',
  },
  nba: {
    accent: 'text-basketball',
    accentBg: 'bg-basketball/10',
    accentRing: 'ring-basketball/50',
    accentGlow: 'shadow-[0_0_20px_rgba(255,107,53,0.15)]',
    badgeBg: 'bg-basketball/20',
    badgeText: 'text-basketball',
  },
  cbb: {
    accent: 'text-burnt-orange',
    accentBg: 'bg-burnt-orange/10',
    accentRing: 'ring-burnt-orange/50',
    accentGlow: 'shadow-[0_0_20px_rgba(191,87,0,0.15)]',
    badgeBg: 'bg-burnt-orange/20',
    badgeText: 'text-burnt-orange',
  },
  ncaaf: {
    accent: 'text-burnt-orange',
    accentBg: 'bg-burnt-orange/10',
    accentRing: 'ring-burnt-orange/50',
    accentGlow: 'shadow-[0_0_20px_rgba(191,87,0,0.15)]',
    badgeBg: 'bg-burnt-orange/20',
    badgeText: 'text-burnt-orange',
  },
};

// Team interface for score cards
interface Team {
  name: string;
  abbreviation: string;
  score: number;
  logo?: string;
  record?: string;
  isWinner?: boolean;
}

// Linescore for baseball
interface LinescoreInning {
  away: number | null;
  home: number | null;
}

interface LineScore {
  innings: LinescoreInning[];
  totals: {
    away: { runs: number; hits: number; errors: number };
    home: { runs: number; hits: number; errors: number };
  };
}

// Props for the ESPN-style ScoreCard
export interface ScoreCardProps {
  gameId?: string | number;
  homeTeam: Team;
  awayTeam: Team;
  status: GameStatus;
  gameTime?: string;
  venue?: string;
  inning?: string;
  inningState?: string;
  quarter?: string;
  period?: string;
  broadcast?: string;
  linescore?: LineScore;
  sport?: 'mlb' | 'nfl' | 'nba' | 'cbb' | 'ncaaf';
  href?: string;
  onClick?: () => void;
  compact?: boolean;
  showLinescore?: boolean;
}

/**
 * ESPN-style ScoreCard Component with Sport-Specific Theming
 *
 * Displays game scores with team info, status, and optional linescore.
 * Supports MLB, NFL, NBA, college baseball, and college football.
 */
export function ScoreCard({
  gameId,
  homeTeam,
  awayTeam,
  status,
  gameTime,
  venue,
  inning,
  inningState,
  quarter,
  period,
  broadcast,
  linescore,
  sport = 'mlb',
  href,
  onClick,
  compact = false,
  showLinescore = true,
}: ScoreCardProps) {
  // Get sport-specific theme
  const theme = sportThemes[sport] || sportThemes.mlb;

  // Defensive null checks - ensure team objects have required properties
  const safeHomeTeam = {
    name: homeTeam?.name || 'Home',
    abbreviation: homeTeam?.abbreviation || 'HOM',
    score: homeTeam?.score ?? 0,
    logo: homeTeam?.logo,
    record: homeTeam?.record,
    isWinner: homeTeam?.isWinner,
  };

  const safeAwayTeam = {
    name: awayTeam?.name || 'Away',
    abbreviation: awayTeam?.abbreviation || 'AWY',
    score: awayTeam?.score ?? 0,
    logo: awayTeam?.logo,
    record: awayTeam?.record,
    isWinner: awayTeam?.isWinner,
  };

  const currentPeriod = inning ? `${inningState || ''} ${inning}`.trim() : quarter || period;
  const isClickable = !!onClick || !!href;
  const isLive = status === 'live';
  const isFinal = status === 'final';
  const isScheduled = status === 'scheduled';
  const isBaseball = sport === 'mlb' || sport === 'cbb';

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      if (onClick) onClick();
    }
  };

  const cardContent = (
    <div
      className={`glass-card transition-all duration-200 ${
        isClickable
          ? `cursor-pointer hover:ring-1 hover:${theme.accentRing} hover:shadow-glow-sm`
          : ''
      } ${isLive ? 'ring-1 ring-success/30' : ''}`}
      onClick={!href ? handleClick : undefined}
      onKeyDown={!href ? handleKeyDown : undefined}
      role={isClickable && !href ? 'button' : undefined}
      tabIndex={isClickable && !href ? 0 : undefined}
      aria-label={
        isClickable ? `View ${safeAwayTeam.name} vs ${safeHomeTeam.name} game details` : undefined
      }
    >
      {/* Status Bar */}
      <div
        className={`px-4 py-2 rounded-t-lg flex items-center justify-between ${
          isLive ? 'bg-success/15' : isFinal ? 'bg-charcoal-700' : theme.accentBg
        }`}
      >
        <div className="flex items-center gap-2">
          {isLive ? (
            <span className="flex items-center gap-1.5 text-success font-semibold text-xs">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
              {currentPeriod || 'LIVE'}
            </span>
          ) : (
            <span
              className={`text-xs font-semibold uppercase ${
                isFinal ? 'text-text-tertiary' : theme.accent
              }`}
            >
              {isFinal ? 'FINAL' : gameTime || 'TBD'}
            </span>
          )}
        </div>
        {venue && (
          <span className="text-xs text-text-tertiary truncate max-w-[150px]">{venue}</span>
        )}
      </div>

      {/* Teams Section */}
      <div className="p-4">
        {/* Away Team */}
        <TeamRow
          team={safeAwayTeam}
          isWinner={isFinal && safeAwayTeam.isWinner}
          isScheduled={isScheduled}
          theme={theme}
        />

        {/* Home Team */}
        <div className="mt-3">
          <TeamRow
            team={safeHomeTeam}
            isWinner={isFinal && safeHomeTeam.isWinner}
            isScheduled={isScheduled}
            theme={theme}
          />
        </div>

        {/* Linescore (Baseball) */}
        {isBaseball && showLinescore && linescore && !compact && (isFinal || isLive) && (
          <div className="mt-4 pt-3 border-t border-border-subtle overflow-x-auto">
            <LinescoreTable
              linescore={linescore}
              awayAbbr={safeAwayTeam.abbreviation}
              homeAbbr={safeHomeTeam.abbreviation}
              theme={theme}
            />
          </div>
        )}

        {/* Footer with RHE or link */}
        {(isFinal || isLive) && (
          <div className="mt-3 pt-3 border-t border-border-subtle flex items-center justify-between text-xs">
            {linescore && !showLinescore ? (
              <span className="text-text-tertiary">
                R: {linescore.totals.away.runs}-{linescore.totals.home.runs} | H:{' '}
                {linescore.totals.away.hits}-{linescore.totals.home.hits} | E:{' '}
                {linescore.totals.away.errors}-{linescore.totals.home.errors}
              </span>
            ) : (
              <span className="text-text-tertiary">{broadcast || ''}</span>
            )}
            {isClickable && (
              <span className={`${theme.accent} font-semibold hover:opacity-80 transition-opacity`}>
                Box Score
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // Wrap in Link if href provided
  if (href) {
    return (
      <Link href={href} className="block">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}

/**
 * Team Row Component with winner styling
 */
interface TeamRowProps {
  team: {
    name: string;
    abbreviation: string;
    score: number;
    record?: string;
    isWinner?: boolean;
  };
  isWinner?: boolean;
  isScheduled: boolean;
  theme: typeof sportThemes.mlb;
}

function TeamRow({ team, isWinner, isScheduled, theme }: TeamRowProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
            isWinner ? `${theme.badgeBg} ${theme.badgeText}` : 'bg-charcoal text-burnt-orange'
          }`}
        >
          {team.abbreviation.slice(0, 3)}
        </div>
        <div className="min-w-0">
          <p
            className={`font-semibold truncate ${isWinner ? 'text-white' : 'text-text-secondary'}`}
          >
            {team.name}
          </p>
          {team.record && <p className="text-xs text-text-tertiary">{team.record}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isWinner && (
          <svg
            viewBox="0 0 24 24"
            className="w-4 h-4 text-success flex-shrink-0"
            fill="currentColor"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        )}
        <span
          className={`text-2xl font-bold font-mono tabular-nums min-w-[2ch] text-right ${
            isScheduled ? 'text-text-tertiary' : isWinner ? 'text-white' : 'text-text-secondary'
          }`}
        >
          {isScheduled ? '-' : team.score}
        </span>
      </div>
    </div>
  );
}

/**
 * Compact Linescore Table for Baseball
 */
interface LinescoreTableProps {
  linescore: LineScore;
  awayAbbr: string;
  homeAbbr: string;
  maxInnings?: number;
  theme: typeof sportThemes.mlb;
}

function LinescoreTable({
  linescore,
  awayAbbr,
  homeAbbr,
  maxInnings = 9,
  theme,
}: LinescoreTableProps) {
  const innings = linescore.innings;
  const displayInnings = Math.max(innings.length, maxInnings);

  return (
    <table className="w-full min-w-[400px] text-xs">
      <thead>
        <tr className="text-text-tertiary">
          <th className="text-left font-medium py-1 pr-2 w-12">Team</th>
          {Array.from({ length: displayInnings }, (_, i) => (
            <th key={i} className="text-center font-medium py-1 w-6">
              {i + 1}
            </th>
          ))}
          <th
            className={`text-center font-bold py-1 w-6 border-l border-border-subtle ${theme.accent}`}
          >
            R
          </th>
          <th className="text-center font-medium py-1 w-6">H</th>
          <th className="text-center font-medium py-1 w-6">E</th>
        </tr>
      </thead>
      <tbody>
        {/* Away Team */}
        <tr className="text-text-secondary">
          <td className="font-semibold text-white py-1 pr-2">{awayAbbr}</td>
          {Array.from({ length: displayInnings }, (_, i) => (
            <td key={i} className="text-center py-1 font-mono tabular-nums">
              {innings[i]?.away ?? '-'}
            </td>
          ))}
          <td className="text-center py-1 font-mono tabular-nums font-bold text-white border-l border-border-subtle">
            {linescore.totals.away.runs}
          </td>
          <td className="text-center py-1 font-mono tabular-nums">{linescore.totals.away.hits}</td>
          <td className="text-center py-1 font-mono tabular-nums">
            {linescore.totals.away.errors}
          </td>
        </tr>
        {/* Home Team */}
        <tr className="text-text-secondary">
          <td className="font-semibold text-white py-1 pr-2">{homeAbbr}</td>
          {Array.from({ length: displayInnings }, (_, i) => (
            <td key={i} className="text-center py-1 font-mono tabular-nums">
              {innings[i]?.home ?? '-'}
            </td>
          ))}
          <td className="text-center py-1 font-mono tabular-nums font-bold text-white border-l border-border-subtle">
            {linescore.totals.home.runs}
          </td>
          <td className="text-center py-1 font-mono tabular-nums">{linescore.totals.home.hits}</td>
          <td className="text-center py-1 font-mono tabular-nums">
            {linescore.totals.home.errors}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

/**
 * Loading Skeleton for ScoreCard with sport-specific theming
 */
export function ScoreCardSkeleton({
  sport = 'mlb',
}: {
  sport?: 'mlb' | 'nfl' | 'nba' | 'cbb' | 'ncaaf';
}) {
  const theme = sportThemes[sport] || sportThemes.mlb;

  return (
    <div className="glass-card">
      <div className={`px-4 py-2 ${theme.accentBg} rounded-t-lg flex justify-between`}>
        <div className="skeleton w-16 h-4 rounded" />
        <div className="skeleton w-24 h-4 rounded" />
      </div>
      <div className="p-4 space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="skeleton w-10 h-10 rounded-full" />
            <div>
              <div className="skeleton w-28 h-4 rounded mb-1" />
              <div className="skeleton w-16 h-3 rounded" />
            </div>
          </div>
          <div className="skeleton w-8 h-8 rounded" />
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="skeleton w-10 h-10 rounded-full" />
            <div>
              <div className="skeleton w-28 h-4 rounded mb-1" />
              <div className="skeleton w-16 h-3 rounded" />
            </div>
          </div>
          <div className="skeleton w-8 h-8 rounded" />
        </div>
      </div>
    </div>
  );
}

/**
 * Score Card Grid for displaying multiple games
 */
export function ScoreCardGrid({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-3 ${className}`}>{children}</div>;
}

export default ScoreCard;
