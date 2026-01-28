'use client';

/**
 * ESPN-style ScoreCard Component
 *
 * Displays game scores with team info, status, and optional linescore.
 * Supports timezone-aware game time display via useUserSettings hook.
 *
 * Last Updated: 2025-01-07
 */

import Link from 'next/link';
import { type GameStatus } from '@/components/ui/Badge';
import { useUserSettings } from '@/lib/hooks';

import { getSportConfig } from '@/lib/config/sport-config';

// Sport-specific color theming - supports all unified sport keys
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
  // Added: CFB alias for ncaaf
  cfb: {
    accent: 'text-burnt-orange',
    accentBg: 'bg-burnt-orange/10',
    accentRing: 'ring-burnt-orange/50',
    accentGlow: 'shadow-[0_0_20px_rgba(191,87,0,0.15)]',
    badgeBg: 'bg-burnt-orange/20',
    badgeText: 'text-burnt-orange',
  },
  // Added: NCAA Men's Basketball
  ncaab: {
    accent: 'text-burnt-orange',
    accentBg: 'bg-burnt-orange/10',
    accentRing: 'ring-burnt-orange/50',
    accentGlow: 'shadow-[0_0_20px_rgba(191,87,0,0.15)]',
    badgeBg: 'bg-burnt-orange/20',
    badgeText: 'text-burnt-orange',
  },
  // Added: NCAA Women's Basketball
  wcbb: {
    accent: 'text-burnt-orange',
    accentBg: 'bg-burnt-orange/10',
    accentRing: 'ring-burnt-orange/50',
    accentGlow: 'shadow-[0_0_20px_rgba(191,87,0,0.15)]',
    badgeBg: 'bg-burnt-orange/20',
    badgeText: 'text-burnt-orange',
  },
  // Added: WNBA
  wnba: {
    accent: 'text-basketball',
    accentBg: 'bg-basketball/10',
    accentRing: 'ring-basketball/50',
    accentGlow: 'shadow-[0_0_20px_rgba(255,107,53,0.15)]',
    badgeBg: 'bg-basketball/20',
    badgeText: 'text-basketball',
  },
  // Added: NHL
  nhl: {
    accent: 'text-blue-400',
    accentBg: 'bg-blue-400/10',
    accentRing: 'ring-blue-400/50',
    accentGlow: 'shadow-[0_0_20px_rgba(96,165,250,0.15)]',
    badgeBg: 'bg-blue-400/20',
    badgeText: 'text-blue-400',
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

// Period scores for football/basketball
interface PeriodScores {
  away: (number | null)[];
  home: (number | null)[];
}

// All supported sport keys
type SupportedSport =
  | 'mlb'
  | 'nfl'
  | 'nba'
  | 'cbb'
  | 'ncaaf'
  | 'cfb'
  | 'ncaab'
  | 'wcbb'
  | 'wnba'
  | 'nhl';

// Intel props for prediction/sentiment display
interface ScoreCardIntel {
  prediction?: {
    homeWinProb: number;
    confidence: 'high' | 'medium' | 'low';
    topFactor?: string;
  };
  sentiment?: {
    homeTemp: number; // -1 to 1
    awayTemp: number; // -1 to 1
  };
}

// Props for the ESPN-style ScoreCard
export interface ScoreCardProps {
  gameId?: string | number;
  homeTeam: Team;
  awayTeam: Team;
  status: GameStatus;
  gameTime?: string;
  /** Raw ISO datetime for timezone-aware formatting (optional) */
  startTime?: string;
  venue?: string;
  inning?: string;
  inningState?: string;
  quarter?: string;
  period?: string;
  broadcast?: string;
  linescore?: LineScore;
  /** Period/quarter scores for football/basketball */
  periodScores?: PeriodScores;
  sport?: SupportedSport;
  href?: string;
  onClick?: () => void;
  compact?: boolean;
  showLinescore?: boolean;
  /** Show period-by-period scores for football/basketball */
  showPeriodScores?: boolean;
  /** Intel data: prediction probabilities and sentiment */
  intel?: ScoreCardIntel;
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
  startTime,
  venue,
  inning,
  inningState,
  quarter,
  period,
  broadcast,
  linescore,
  periodScores,
  sport = 'mlb',
  href,
  onClick,
  compact = false,
  showLinescore = true,
  showPeriodScores = true,
  intel,
}: ScoreCardProps) {
  // Get sport-specific theme
  const theme = sportThemes[sport] || sportThemes.mlb;
  const sportConfig = getSportConfig(sport === 'cfb' ? 'ncaaf' : (sport as any));

  // Get user's timezone preference for formatting
  const { formatGame, isLoaded: timezoneLoaded } = useUserSettings();

  // Format game time with user's timezone if we have raw startTime
  const displayTime = (() => {
    // If we have gameTime from ESPN (already formatted), use it
    if (gameTime) return gameTime;

    // If we have raw startTime, format it with user's timezone
    if (startTime && timezoneLoaded) {
      return formatGame(startTime);
    }

    // Fallback - show "Scheduled" instead of ambiguous "TBD"
    return 'Scheduled';
  })();

  // Defensive null checks - ensure team objects have required properties
  const safeHomeTeam: Team = {
    name: homeTeam?.name || 'Home',
    abbreviation: homeTeam?.abbreviation || 'HOM',
    score: homeTeam?.score ?? 0,
    logo: homeTeam?.logo,
    record: homeTeam?.record,
    isWinner: homeTeam?.isWinner,
  };

  const safeAwayTeam: Team = {
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
              {isFinal ? 'FINAL' : displayTime}
            </span>
          )}
        </div>
        {venue && (
          <span className="text-xs text-text-tertiary truncate max-w-[150px]">{venue}</span>
        )}
      </div>

      {/* Intel Badge */}
      {intel && <IntelBadge intel={intel} status={status} theme={theme} isFinal={isFinal} />}

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

        {/* Period Scores (Football/Basketball) */}
        {!isBaseball && showPeriodScores && periodScores && !compact && (isFinal || isLive) && (
          <div className="mt-4 pt-3 border-t border-border-subtle overflow-x-auto">
            <PeriodScoresTable
              periodScores={periodScores}
              awayAbbr={safeAwayTeam.abbreviation}
              homeAbbr={safeHomeTeam.abbreviation}
              awayTotal={safeAwayTeam.score}
              homeTotal={safeHomeTeam.score}
              periodLabel={sportConfig.periodLabel}
              periodCount={sportConfig.periodCount}
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
 * Team Row Component with winner styling and optional logo
 */
interface TeamRowProps {
  team: {
    name: string;
    abbreviation: string;
    score: number;
    logo?: string;
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
        {team.logo ? (
          <img
            src={team.logo}
            alt={`${team.name} logo`}
            className="w-10 h-10 object-contain flex-shrink-0"
            loading="lazy"
          />
        ) : (
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
              isWinner ? `${theme.badgeBg} ${theme.badgeText}` : 'bg-charcoal text-burnt-orange'
            }`}
          >
            {team.abbreviation.slice(0, 3)}
          </div>
        )}
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
            aria-hidden="true"
            role="img"
          >
            <title>Winner</title>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        )}
        {!isScheduled && (
          <span
            className={`text-2xl font-bold font-mono tabular-nums min-w-[2ch] text-right ${
              isWinner ? 'text-white' : 'text-text-secondary'
            }`}
          >
            {team.score}
          </span>
        )}
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
    <table
      className="w-full min-w-[400px] text-xs"
      role="table"
      aria-label={`Linescore for ${awayAbbr} vs ${homeAbbr}`}
    >
      <thead>
        <tr className="text-text-tertiary">
          <th scope="col" className="text-left font-medium py-1 pr-2 w-12">
            Team
          </th>
          {Array.from({ length: displayInnings }, (_, i) => (
            <th key={i} scope="col" className="text-center font-medium py-1 w-6">
              {i + 1}
            </th>
          ))}
          <th
            scope="col"
            className={`text-center font-bold py-1 w-6 border-l border-border-subtle ${theme.accent}`}
          >
            R
          </th>
          <th scope="col" className="text-center font-medium py-1 w-6">
            H
          </th>
          <th scope="col" className="text-center font-medium py-1 w-6">
            E
          </th>
        </tr>
      </thead>
      <tbody>
        {/* Away Team */}
        <tr className="text-text-secondary">
          <th scope="row" className="font-semibold text-white py-1 pr-2">
            {awayAbbr}
          </th>
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
          <th scope="row" className="font-semibold text-white py-1 pr-2">
            {homeAbbr}
          </th>
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
 * Period Scores Table for Football/Basketball
 */
interface PeriodScoresTableProps {
  periodScores: PeriodScores;
  awayAbbr: string;
  homeAbbr: string;
  awayTotal: number;
  homeTotal: number;
  periodLabel: string;
  periodCount: number;
  theme: typeof sportThemes.mlb;
}

function PeriodScoresTable({
  periodScores,
  awayAbbr,
  homeAbbr,
  awayTotal,
  homeTotal,
  periodLabel,
  periodCount,
  theme,
}: PeriodScoresTableProps) {
  // Determine periods to display (regular + any OT)
  const maxPeriods = Math.max(periodScores.away.length, periodScores.home.length, periodCount);

  return (
    <table
      className="w-full min-w-[300px] text-xs"
      role="table"
      aria-label={`Period scores for ${awayAbbr} vs ${homeAbbr}`}
    >
      <thead>
        <tr className="text-text-tertiary">
          <th scope="col" className="text-left font-medium py-1 pr-2 w-12">
            Team
          </th>
          {Array.from({ length: maxPeriods }, (_, i) => (
            <th key={i} scope="col" className="text-center font-medium py-1 w-8">
              {i < periodCount
                ? periodLabel === 'Half'
                  ? i === 0
                    ? '1st'
                    : '2nd'
                  : i + 1
                : `OT${i - periodCount + 1}`}
            </th>
          ))}
          <th
            scope="col"
            className={`text-center font-bold py-1 w-10 border-l border-border-subtle ${theme.accent}`}
          >
            T
          </th>
        </tr>
      </thead>
      <tbody>
        {/* Away Team */}
        <tr className="text-text-secondary">
          <th scope="row" className="font-semibold text-white py-1 pr-2">
            {awayAbbr}
          </th>
          {Array.from({ length: maxPeriods }, (_, i) => (
            <td key={i} className="text-center py-1 font-mono tabular-nums">
              {periodScores.away[i] ?? '-'}
            </td>
          ))}
          <td className="text-center py-1 font-mono tabular-nums font-bold text-white border-l border-border-subtle">
            {awayTotal}
          </td>
        </tr>
        {/* Home Team */}
        <tr className="text-text-secondary">
          <th scope="row" className="font-semibold text-white py-1 pr-2">
            {homeAbbr}
          </th>
          {Array.from({ length: maxPeriods }, (_, i) => (
            <td key={i} className="text-center py-1 font-mono tabular-nums">
              {periodScores.home[i] ?? '-'}
            </td>
          ))}
          <td className="text-center py-1 font-mono tabular-nums font-bold text-white border-l border-border-subtle">
            {homeTotal}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

/**
 * Intel Badge Component - Displays prediction/sentiment data
 */
interface IntelBadgeProps {
  intel: ScoreCardIntel;
  status: GameStatus;
  theme: typeof sportThemes.mlb;
  isFinal: boolean;
}

function IntelBadge({ intel, status, theme, isFinal }: IntelBadgeProps) {
  const { prediction, sentiment } = intel;

  // No intel data to display
  if (!prediction && !sentiment) return null;

  // Get sentiment trend text
  const getSentimentTrend = (homeTemp: number, awayTemp: number): string | null => {
    const avg = (homeTemp + awayTemp) / 2;
    if (avg > 0.2) return 'Rising';
    if (avg < -0.2) return 'Falling';
    return 'Stable';
  };

  // Scheduled: Show prediction percentage + sentiment trend
  if (status === 'scheduled' && prediction) {
    const prob = Math.round(prediction.homeWinProb * 100);
    const trend = sentiment ? getSentimentTrend(sentiment.homeTemp, sentiment.awayTemp) : null;

    return (
      <div className="px-4 py-1.5 bg-charcoal-800/50 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className={`font-semibold ${theme.accent}`}>{prob}%</span>
          <span className="text-text-tertiary">win prob</span>
          {prediction.confidence === 'high' && (
            <span className="text-success text-[10px] font-medium">HIGH</span>
          )}
        </div>
        {trend && (
          <div className="flex items-center gap-1">
            <span className="text-text-tertiary">{trend}</span>
            <TrendIcon trend={trend} />
          </div>
        )}
      </div>
    );
  }

  // Live: Show live win probability with pulsing indicator
  if (status === 'live' && prediction) {
    const prob = Math.round(prediction.homeWinProb * 100);

    return (
      <div className="px-4 py-1.5 bg-success/5 border-b border-success/20 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
          <span className="text-white font-semibold">{prob}%</span>
          <span className="text-text-tertiary">live win prob</span>
        </div>
        {prediction.topFactor && (
          <span className="text-text-tertiary truncate max-w-[120px]">{prediction.topFactor}</span>
        )}
      </div>
    );
  }

  // Final: Show calibration feedback (predicted vs actual)
  if (isFinal && prediction) {
    const prob = Math.round(prediction.homeWinProb * 100);
    const predictedHome = prob >= 50;
    // Note: For full calibration feedback, we'd need the actual result
    // For now, just show what we predicted

    return (
      <div className="px-4 py-1.5 bg-charcoal-800/30 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="text-text-tertiary">Predicted</span>
          <span className="text-white font-semibold">{prob}%</span>
          <span className="text-text-tertiary">{predictedHome ? 'home' : 'away'}</span>
        </div>
      </div>
    );
  }

  return null;
}

/**
 * Trend Icon Component
 */
function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'Rising') {
    return (
      <svg
        className="w-3 h-3 text-success"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M7 17l5-5 5 5" />
      </svg>
    );
  }
  if (trend === 'Falling') {
    return (
      <svg
        className="w-3 h-3 text-error"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M7 7l5 5 5-5" />
      </svg>
    );
  }
  return (
    <svg
      className="w-3 h-3 text-text-tertiary"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M5 12h14" />
    </svg>
  );
}

/**
 * Loading Skeleton for ScoreCard with sport-specific theming
 */
export function ScoreCardSkeleton({ sport = 'mlb' }: { sport?: SupportedSport }) {
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
