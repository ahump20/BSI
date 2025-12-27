'use client';

/**
 * @fileoverview ScoreCard Component Suite
 *
 * A comprehensive collection of ESPN-style score card components for displaying
 * live sports scores across multiple leagues. This module provides the primary
 * UI components for the BSI sports scores hub.
 *
 * ## Features
 * - Sport-specific color theming (MLB, NFL, NBA, CBB, NCAAF)
 * - Real-time live game indicators with animated status badges
 * - Baseball-specific linescore tables with inning-by-inning breakdowns
 * - Accessible keyboard navigation for interactive cards
 * - Responsive grid layout system for multiple cards
 * - Loading skeleton states for async data fetching
 *
 * ## Components Exported
 * - {@link ScoreCard} - Main score card component
 * - {@link ScoreCardSkeleton} - Loading placeholder with sport theming
 * - {@link ScoreCardGrid} - Responsive grid container for multiple cards
 *
 * ## Usage Example
 * ```tsx
 * import { ScoreCard, ScoreCardGrid } from '@/components/sports/ScoreCard';
 *
 * <ScoreCardGrid>
 *   <ScoreCard
 *     homeTeam={{ name: 'Rangers', abbreviation: 'TEX', score: 5 }}
 *     awayTeam={{ name: 'Astros', abbreviation: 'HOU', score: 3 }}
 *     status="final"
 *     sport="mlb"
 *   />
 * </ScoreCardGrid>
 * ```
 *
 * @module components/sports/ScoreCard
 * @requires next/link - For client-side navigation
 * @requires @/components/ui/Badge - For game status badges
 *
 * @author BSI Development Team
 * @since 1.0.0
 */

import Link from 'next/link';
import { GameStatusBadge, type GameStatus, LiveBadge } from '@/components/ui/Badge';

/**
 * Safely converts an unknown value to a display string.
 *
 * This is a defensive utility function designed to handle data from external
 * sports APIs that may have inconsistent typing. API responses sometimes return
 * numbers where strings are expected, null/undefined values, or nested objects.
 *
 * @param value - The value to convert. Can be any type from API responses.
 * @param fallback - Default string to return if value cannot be converted.
 *                   Defaults to empty string for seamless UI rendering.
 * @returns A string representation of the value, or the fallback.
 *
 * @example
 * // String passthrough
 * safeStr('TEX') // => 'TEX'
 *
 * @example
 * // Number conversion
 * safeStr(42) // => '42'
 *
 * @example
 * // Null handling with fallback
 * safeStr(null, 'TBD') // => 'TBD'
 *
 * @example
 * // Undefined handling
 * safeStr(undefined, '-') // => '-'
 *
 * @internal Used throughout ScoreCard components for defensive rendering
 */
function safeStr(value: unknown, fallback: string = ''): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return fallback;
}

/**
 * Sport-specific color theming configuration.
 *
 * Each sport has a distinct color palette to provide visual differentiation
 * when displaying scores from multiple leagues. The colors are designed to
 * align with common associations (e.g., green for baseball fields, orange
 * for basketball).
 *
 * ## Theme Properties
 * Each sport theme contains the following Tailwind CSS class configurations:
 *
 * | Property     | Purpose                                          | Usage                    |
 * |--------------|--------------------------------------------------|--------------------------|
 * | accent       | Primary text color for sport                     | Headers, time displays   |
 * | accentBg     | Subtle background with 10% opacity               | Status bars, headers     |
 * | accentRing   | Ring/border color with 50% opacity               | Hover states, focus      |
 * | accentGlow   | Box shadow for subtle glow effect                | Interactive hover states |
 * | badgeBg      | Badge background with 20% opacity                | Winner team badges       |
 * | badgeText    | Badge text color matching sport                  | Winner team text         |
 *
 * ## Color Associations
 * - **MLB (Baseball)**: Forest green (#228B22) - evokes baseball field grass
 * - **NFL (Football)**: Saddle brown (Tailwind `text-football`, approx #8B4513) - evokes pigskin leather
 * - **NBA (Basketball)**: Orange - evokes basketball color
 * - **CBB (College Baseball)**: Burnt orange - BSI brand color (Tailwind `burnt-orange`)
 * - **NCAAF (College Football)**: Burnt orange - BSI brand color (Tailwind `burnt-orange`)
 *
 * @constant
 * @type {Record<string, SportTheme>}
 * Keys are expected to align with the SupportedSport union defined below.
 *
 * @example
 * // Access theme for a specific sport
 * const theme = sportThemes['mlb'];
 * // Apply accent color: className={theme.accent}
 *
 * @see {@link ScoreCard} - Main consumer of sport themes
 * @see {@link ScoreCardSkeleton} - Uses themes for loading states
 */
const sportThemes = {
  /** Major League Baseball - Forest green theme */
  mlb: {
    /** Primary accent text color class */
    accent: 'text-baseball',
    /** Subtle background for headers/status bars */
    accentBg: 'bg-baseball/10',
    /** Ring color for focus/hover states */
    accentRing: 'ring-baseball/50',
    /** Glow shadow for interactive elements */
    accentGlow: 'shadow-[0_0_20px_rgba(34,139,34,0.15)]',
    /** Badge background for winner highlighting */
    badgeBg: 'bg-baseball/20',
    /** Badge text color */
    badgeText: 'text-baseball',
  },
  /** National Football League - Brown/leather theme */
  nfl: {
    accent: 'text-football',
    accentBg: 'bg-football/10',
    accentRing: 'ring-football/50',
    accentGlow: 'shadow-[0_0_20px_rgba(139,69,19,0.15)]',
    badgeBg: 'bg-football/20',
    badgeText: 'text-football',
  },
  /** National Basketball Association - Orange theme */
  nba: {
    accent: 'text-basketball',
    accentBg: 'bg-basketball/10',
    accentRing: 'ring-basketball/50',
    accentGlow: 'shadow-[0_0_20px_rgba(255,107,53,0.15)]',
    badgeBg: 'bg-basketball/20',
    badgeText: 'text-basketball',
  },
  /** College Baseball - BSI burnt orange brand theme */
  cbb: {
    accent: 'text-burnt-orange',
    accentBg: 'bg-burnt-orange/10',
    accentRing: 'ring-burnt-orange/50',
    accentGlow: 'shadow-[0_0_20px_rgba(191,87,0,0.15)]',
    badgeBg: 'bg-burnt-orange/20',
    badgeText: 'text-burnt-orange',
  },
  /** NCAA Football - BSI burnt orange brand theme */
  ncaaf: {
    accent: 'text-burnt-orange',
    accentBg: 'bg-burnt-orange/10',
    accentRing: 'ring-burnt-orange/50',
    accentGlow: 'shadow-[0_0_20px_rgba(191,87,0,0.15)]',
    badgeBg: 'bg-burnt-orange/20',
    badgeText: 'text-burnt-orange',
  },
} as const;

/**
 * Represents a team in a sports game for score card display.
 *
 * This interface defines the minimum required data structure for rendering
 * a team's information within a ScoreCard component. Data is typically
 * sourced from sports APIs (ESPN, SportsDataIO, etc.) and normalized
 * into this format.
 *
 * @interface Team
 * @example
 * const texasRangers: Team = {
 *   name: 'Texas Rangers',
 *   abbreviation: 'TEX',
 *   score: 7,
 *   logo: '/logos/mlb/tex.svg',
 *   record: '95-67',
 *   isWinner: true
 * };
 */
interface Team {
  /**
   * Full team name for display.
   * @example "Texas Rangers", "Dallas Cowboys"
   */
  name: string;

  /**
   * Short team abbreviation (2-4 characters).
   * Used in compact displays and linescore tables.
   * @example "TEX", "DAL", "NYY"
   */
  abbreviation: string;

  /**
   * Current score in the game.
   * For scheduled games, this is typically 0.
   */
  score: number;

  /**
   * URL or path to the team logo image.
   * Optional - component gracefully handles missing logos.
   */
  logo?: string;

  /**
   * Team's current season record.
   * Format varies by sport (e.g., "95-67" for MLB, "11-5" for NFL).
   */
  record?: string;

  /**
   * Whether this team won the game.
   * Only meaningful when game status is 'final'.
   * Triggers winner styling (highlighted score, checkmark icon).
   */
  isWinner?: boolean;
}

/**
 * Represents a single inning's scores in a baseball linescore.
 *
 * Used to display the inning-by-inning breakdown in baseball games.
 * Null values indicate the inning hasn't been played yet (common for
 * the bottom of the current inning or future innings in live games).
 *
 * @interface LinescoreInning
 * @example
 * // Completed 3rd inning: Away scored 2, Home scored 1
 * const inning3: LinescoreInning = { away: 2, home: 1 };
 *
 * @example
 * // Top of 7th (home hasn't batted): Away scored 0, Home pending
 * const inning7: LinescoreInning = { away: 0, home: null };
 */
interface LinescoreInning {
  /**
   * Runs scored by the away team in this inning.
   * Null if the top of this inning hasn't been completed.
   */
  away: number | null;

  /**
   * Runs scored by the home team in this inning.
   * Null if the bottom of this inning hasn't been played.
   */
  home: number | null;
}

/**
 * Complete linescore data for a baseball game.
 *
 * Contains both the inning-by-inning breakdown and the R-H-E totals
 * (Runs, Hits, Errors) that are traditionally displayed in baseball
 * scoreboards. This structure supports games of any length, including
 * extra innings.
 *
 * @interface LineScore
 * @example
 * const linescore: LineScore = {
 *   innings: [
 *     { away: 0, home: 1 },
 *     { away: 2, home: 0 },
 *     { away: 1, home: 0 },
 *     // ... additional innings
 *   ],
 *   totals: {
 *     away: { runs: 3, hits: 8, errors: 1 },
 *     home: { runs: 5, hits: 10, errors: 0 }
 *   }
 * };
 */
interface LineScore {
  /**
   * Array of inning scores.
   * Length matches the number of innings played (or scheduled).
   * Standard games have 9 innings; extra innings extend the array.
   */
  innings: LinescoreInning[];

  /**
   * Aggregate totals for runs, hits, and errors.
   * The classic R-H-E display seen on all baseball scoreboards.
   */
  totals: {
    /** Away team's totals */
    away: {
      /** Total runs scored */
      runs: number;
      /** Total hits */
      hits: number;
      /** Total errors committed */
      errors: number;
    };
    /** Home team's totals */
    home: {
      /** Total runs scored */
      runs: number;
      /** Total hits */
      hits: number;
      /** Total errors committed */
      errors: number;
    };
  };
}

/**
 * Supported sport types for score card theming and behavior.
 *
 * @typedef {'mlb' | 'nfl' | 'nba' | 'cbb' | 'ncaaf'} SupportedSport
 */
export type SupportedSport = 'mlb' | 'nfl' | 'nba' | 'cbb' | 'ncaaf';

/**
 * Props for the ESPN-style ScoreCard component.
 *
 * This interface defines all configuration options for rendering a score card.
 * Most props are optional with sensible defaults to enable quick usage while
 * allowing detailed customization when needed.
 *
 * ## Required vs Optional Props
 * - **Required**: `homeTeam`, `awayTeam`, `status`
 * - **Optional**: All other props have defaults or are conditionally displayed
 *
 * ## Sport-Specific Props
 * Different sports use different period terminology:
 * - Baseball: `inning`, `inningState` (e.g., "Top 7", "Bot 9")
 * - Football: `quarter` (e.g., "Q1", "Q4")
 * - Basketball: `period` (e.g., "1st", "OT")
 *
 * @interface ScoreCardProps
 * @example
 * // Minimal usage (scheduled game)
 * <ScoreCard
 *   homeTeam={{ name: 'Rangers', abbreviation: 'TEX', score: 0 }}
 *   awayTeam={{ name: 'Astros', abbreviation: 'HOU', score: 0 }}
 *   status="scheduled"
 *   gameTime="7:05 PM"
 * />
 *
 * @example
 * // Live baseball game with linescore
 * <ScoreCard
 *   homeTeam={{ name: 'Rangers', abbreviation: 'TEX', score: 5 }}
 *   awayTeam={{ name: 'Astros', abbreviation: 'HOU', score: 3 }}
 *   status="live"
 *   sport="mlb"
 *   inning="7"
 *   inningState="Top"
 *   linescore={gameLineScore}
 *   href={`/games/${gameId}`}
 * />
 */
export interface ScoreCardProps {
  /**
   * Unique identifier for the game.
   * Used for tracking and as a React key when rendering lists.
   */
  gameId?: string | number;

  /**
   * Home team information.
   * Always displayed second (bottom) in the card layout.
   */
  homeTeam: Team;

  /**
   * Away/visiting team information.
   * Always displayed first (top) in the card layout.
   */
  awayTeam: Team;

  /**
   * Current game status.
   * Controls the visual presentation and which elements are shown:
   * - 'scheduled': Shows game time, hides scores
   * - 'live': Shows pulsing indicator, current period, scores
   * - 'final': Shows "FINAL", winner highlighting, complete scores
   *
   * @see GameStatus from '@/components/ui/Badge'
   */
  status: GameStatus;

  /**
   * Scheduled start time for the game.
   * Displayed for scheduled games in the status bar.
   * @example "7:05 PM", "1:10 PM CT"
   */
  gameTime?: string;

  /**
   * Venue or stadium name.
   * Displayed in the status bar when provided.
   * @example "Globe Life Field", "AT&T Stadium"
   */
  venue?: string;

  /**
   * Current inning number (baseball only).
   * Combined with `inningState` to show "Top 7", "Bot 9", etc.
   * @example "1", "7", "9"
   */
  inning?: string;

  /**
   * Inning half indicator (baseball only).
   * Used with `inning` to display current game position.
   * @example "Top", "Bot", "Mid"
   */
  inningState?: string;

  /**
   * Current quarter (football only).
   * @example "Q1", "Q2", "Q3", "Q4", "OT"
   */
  quarter?: string;

  /**
   * Current period (basketball or generic).
   * @example "1st", "2nd", "3rd", "4th", "OT"
   */
  period?: string;

  /**
   * Broadcast network for the game.
   * Displayed in the footer when linescore is hidden.
   * @example "ESPN", "FOX", "TNT"
   */
  broadcast?: string;

  /**
   * Baseball-specific linescore data.
   * When provided with `showLinescore=true`, displays the inning-by-inning
   * breakdown table for baseball games.
   */
  linescore?: LineScore;

  /**
   * Sport type for theming and sport-specific behavior.
   * Determines color scheme and which game period fields are relevant.
   * @default 'mlb'
   */
  sport?: SupportedSport;

  /**
   * Navigation URL when card is clicked.
   * When provided, wraps the card in a Next.js Link component.
   * Takes precedence over `onClick` for navigation.
   * @example "/games/12345", "/mlb/boxscore/12345"
   */
  href?: string;

  /**
   * Click handler for card interactions.
   * Called when card is clicked (if no `href` is provided).
   * Card becomes focusable and keyboard-accessible when provided.
   */
  onClick?: () => void;

  /**
   * Enable compact display mode.
   * When true, hides the linescore table to save vertical space.
   * Useful for sidebar widgets or mobile views.
   * @default false
   */
  compact?: boolean;

  /**
   * Show the baseball linescore table.
   * Only applies to baseball sports (mlb, cbb).
   * When false, shows condensed R-H-E summary in footer instead.
   * @default true
   */
  showLinescore?: boolean;
}

/**
 * ESPN-style ScoreCard Component with Sport-Specific Theming.
 *
 * A comprehensive score card component that displays game information in a
 * visually rich, ESPN-inspired format. Supports multiple sports with automatic
 * color theming, live game indicators, and baseball-specific linescore tables.
 *
 * ## Features
 * - **Sport Theming**: Automatic color schemes based on sport type
 * - **Live Indicators**: Pulsing green badge and current period display
 * - **Winner Styling**: Highlighted scores and checkmark icons for victors
 * - **Baseball Linescores**: Inning-by-inning breakdown with R-H-E totals
 * - **Accessibility**: Full keyboard navigation and ARIA labels
 * - **Responsive**: Works in grids, sidebars, and compact layouts
 *
 * ## Visual States
 * The card renders differently based on game status:
 *
 * | Status    | Header              | Scores | Winner Styling | Linescore |
 * |-----------|---------------------|--------|----------------|-----------|
 * | scheduled | Game time + venue   | Hidden | No             | No        |
 * | live      | Pulsing + period    | Shown  | No             | Yes       |
 * | final     | "FINAL" + venue     | Shown  | Yes            | Yes       |
 *
 * ## Accessibility
 * - Interactive cards (with `href` or `onClick`) are focusable
 * - Keyboard navigation with Enter/Space activation
 * - ARIA labels describe matchup for screen readers
 *
 * @component
 * @param props - See {@link ScoreCardProps} for all available props
 * @returns A styled score card React element
 *
 * @example
 * // Scheduled game
 * <ScoreCard
 *   homeTeam={{ name: 'Rangers', abbreviation: 'TEX', score: 0 }}
 *   awayTeam={{ name: 'Astros', abbreviation: 'HOU', score: 0 }}
 *   status="scheduled"
 *   gameTime="7:05 PM CT"
 *   venue="Globe Life Field"
 *   sport="mlb"
 * />
 *
 * @example
 * // Live game with navigation
 * <ScoreCard
 *   homeTeam={{ name: 'Cowboys', abbreviation: 'DAL', score: 21 }}
 *   awayTeam={{ name: 'Eagles', abbreviation: 'PHI', score: 17 }}
 *   status="live"
 *   quarter="Q3"
 *   sport="nfl"
 *   href="/nfl/games/12345"
 * />
 *
 * @example
 * // Final game with winner styling
 * <ScoreCard
 *   homeTeam={{ name: 'Mavericks', abbreviation: 'DAL', score: 115, isWinner: true }}
 *   awayTeam={{ name: 'Spurs', abbreviation: 'SAS', score: 102 }}
 *   status="final"
 *   sport="nba"
 * />
 *
 * @see {@link ScoreCardGrid} - Grid container for multiple cards
 * @see {@link ScoreCardSkeleton} - Loading state placeholder
 * @see {@link TeamRow} - Internal component for team display
 * @see {@link LinescoreTable} - Internal component for baseball linescores
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
        isClickable ? `cursor-pointer hover:ring-1 hover:${theme.accentRing} hover:shadow-glow-sm` : ''
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
          isLive
            ? 'bg-success/15'
            : isFinal
              ? 'bg-charcoal-700'
              : theme.accentBg
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
                R: {linescore.totals.away.runs}-{linescore.totals.home.runs} |
                H: {linescore.totals.away.hits}-{linescore.totals.home.hits} |
                E: {linescore.totals.away.errors}-{linescore.totals.home.errors}
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
 * Props for the TeamRow internal component.
 *
 * @interface TeamRowProps
 * @internal Used only by ScoreCard component
 */
interface TeamRowProps {
  /**
   * Team data to display.
   * Contains the minimum information needed to render a team row.
   */
  team: {
    /** Full team name */
    name: string;
    /** Short abbreviation (2-4 chars) */
    abbreviation: string;
    /** Current score */
    score: number;
    /** Season record (e.g., "95-67") */
    record?: string;
    /** Whether this team won (from Team interface) */
    isWinner?: boolean;
  };
  /**
   * Whether to apply winner styling.
   * Computed by parent: `isFinal && team.isWinner`
   */
  isWinner?: boolean;
  /**
   * Whether the game is scheduled (not started).
   * When true, score is hidden and shows "-" instead.
   */
  isScheduled: boolean;
  /**
   * Sport theme for color styling.
   * Passed from parent ScoreCard based on sport prop.
   */
  theme: typeof sportThemes.mlb;
}

/**
 * Displays a single team's information within a ScoreCard.
 *
 * This internal component renders one row in the matchup display,
 * showing the team abbreviation badge, full name, optional record,
 * and score. Styling adapts based on game state and winner status.
 *
 * ## Visual Elements
 * - **Abbreviation Badge**: Circular badge with 2-3 letter abbreviation
 * - **Team Name**: Full name with text truncation for long names
 * - **Record**: Optional season record displayed below name
 * - **Winner Checkmark**: SVG checkmark icon for winning teams
 * - **Score**: Large monospace number (or "-" for scheduled games)
 *
 * ## Styling States
 * | State      | Badge              | Name Color  | Score Color |
 * |------------|--------------------| ------------|-------------|
 * | Default    | charcoal bg        | secondary   | secondary   |
 * | Winner     | sport-themed bg    | white       | white       |
 * | Scheduled  | charcoal bg        | secondary   | tertiary    |
 *
 * @component
 * @internal Not exported - used only within ScoreCard
 * @param props - {@link TeamRowProps}
 * @returns A styled team row React element
 */
function TeamRow({ team, isWinner, isScheduled, theme }: TeamRowProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
          isWinner ? `${theme.badgeBg} ${theme.badgeText}` : 'bg-charcoal text-burnt-orange'
        }`}>
          {safeStr(team.abbreviation, 'TBD').slice(0, 3)}
        </div>
        <div className="min-w-0">
          <p
            className={`font-semibold truncate ${
              isWinner ? 'text-white' : 'text-text-secondary'
            }`}
          >
            {team.name}
          </p>
          {team.record && (
            <p className="text-xs text-text-tertiary">{team.record}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isWinner && (
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-success flex-shrink-0" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        )}
        <span
          className={`text-2xl font-bold font-mono tabular-nums min-w-[2ch] text-right ${
            isScheduled
              ? 'text-text-tertiary'
              : isWinner
                ? 'text-white'
                : 'text-text-secondary'
          }`}
        >
          {isScheduled ? '-' : team.score}
        </span>
      </div>
    </div>
  );
}

/**
 * Props for the LinescoreTable internal component.
 *
 * @interface LinescoreTableProps
 * @internal Used only by ScoreCard for baseball games
 */
interface LinescoreTableProps {
  /**
   * Complete linescore data including innings and R-H-E totals.
   * @see {@link LineScore}
   */
  linescore: LineScore;
  /**
   * Away team abbreviation for row label.
   * @example "HOU", "TEX"
   */
  awayAbbr: string;
  /**
   * Home team abbreviation for row label.
   * @example "TEX", "HOU"
   */
  homeAbbr: string;
  /**
   * Minimum number of innings to display.
   * Table will show this many columns even if fewer innings played.
   * Allows extra innings to extend beyond this number.
   * @default 9
   */
  maxInnings?: number;
  /**
   * Sport theme for accent colors on the Runs column.
   */
  theme: typeof sportThemes.mlb;
}

/**
 * Displays an inning-by-inning baseball linescore table.
 *
 * This internal component renders the traditional baseball scoreboard format
 * showing scores for each inning plus R-H-E (Runs, Hits, Errors) totals.
 * The table is horizontally scrollable for mobile devices.
 *
 * ## Table Structure
 * ```
 * Team | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | R | H | E
 * -----|---|---|---|---|---|---|---|---|---|---|---|---
 * HOU  | 0 | 2 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 3 | 8 | 1
 * TEX  | 1 | 0 | 0 | 2 | 0 | 1 | 1 | 0 | x | 5 |10 | 0
 * ```
 *
 * ## Features
 * - **Dynamic Columns**: Shows minimum 9 innings, expands for extra innings
 * - **Null Handling**: Unplayed innings show "-" placeholder
 * - **R-H-E Totals**: Final three columns with runs in sport accent color
 * - **Monospace Numbers**: Tabular-nums for aligned score display
 * - **Horizontal Scroll**: min-width ensures readability on small screens
 *
 * ## Styling Notes
 * - Team abbreviations are white for visibility
 * - Runs column uses sport theme accent color
 * - Subtle border separates R-H-E from inning scores
 * - All numbers use monospace font for alignment
 *
 * @component
 * @internal Not exported - used only within ScoreCard for baseball sports
 * @param props - {@link LinescoreTableProps}
 * @returns An HTML table element with linescore data
 */
function LinescoreTable({ linescore, awayAbbr, homeAbbr, maxInnings = 9, theme }: LinescoreTableProps) {
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
          <th className={`text-center font-bold py-1 w-6 border-l border-border-subtle ${theme.accent}`}>R</th>
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
          <td className="text-center py-1 font-mono tabular-nums">{linescore.totals.away.errors}</td>
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
          <td className="text-center py-1 font-mono tabular-nums">{linescore.totals.home.errors}</td>
        </tr>
      </tbody>
    </table>
  );
}

/**
 * Loading skeleton placeholder for ScoreCard with sport-specific theming.
 *
 * Displays an animated skeleton that mimics the ScoreCard layout while
 * game data is being fetched. Uses the same sport theming as ScoreCard
 * for visual consistency during loading states.
 *
 * ## Structure
 * The skeleton replicates the ScoreCard layout:
 * - Status bar with placeholder blocks
 * - Two team rows with badge, name, record, and score placeholders
 * - Animated shimmer effect via CSS `.skeleton` class
 *
 * ## Usage
 * Typically used within `ScoreCardGrid` while loading game data:
 * ```tsx
 * {isLoading ? (
 *   <ScoreCardGrid>
 *     {Array.from({ length: 6 }).map((_, i) => (
 *       <ScoreCardSkeleton key={i} sport="mlb" />
 *     ))}
 *   </ScoreCardGrid>
 * ) : (
 *   <ScoreCardGrid>
 *     {games.map(game => <ScoreCard key={game.id} {...game} />)}
 *   </ScoreCardGrid>
 * )}
 * ```
 *
 * @component
 * @param props - Component props
 * @param props.sport - Sport type for theme-consistent header color
 * @returns A skeleton placeholder element matching ScoreCard dimensions
 *
 * @see {@link ScoreCard} - The component this skeleton represents
 * @see {@link ScoreCardGrid} - Common parent container
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
 * Props for the ScoreCardGrid layout component.
 *
 * @interface ScoreCardGridProps
 */
interface ScoreCardGridProps {
  /**
   * ScoreCard components or skeletons to display in the grid.
   * Typically an array of ScoreCard or ScoreCardSkeleton elements.
   */
  children: React.ReactNode;
  /**
   * Additional CSS classes to apply to the grid container.
   * Useful for spacing adjustments or custom responsive breakpoints.
   */
  className?: string;
}

/**
 * Responsive grid container for displaying multiple ScoreCards.
 *
 * Provides a consistent, responsive layout for score cards that adapts
 * to different screen sizes. Cards flow naturally and maintain equal
 * widths within their column.
 *
 * ## Responsive Breakpoints
 * | Breakpoint | Columns | Typical Use                    |
 * |------------|---------|--------------------------------|
 * | < 768px    | 1       | Mobile phones                  |
 * | ≥ 768px    | 2       | Tablets, small laptops         |
 * | ≥ 1024px   | 3       | Desktops, large screens        |
 *
 * ## Usage
 * ```tsx
 * import { ScoreCard, ScoreCardGrid } from '@/components/sports/ScoreCard';
 *
 * function GamesPage({ games }) {
 *   return (
 *     <ScoreCardGrid className="mt-4">
 *       {games.map(game => (
 *         <ScoreCard
 *           key={game.id}
 *           homeTeam={game.homeTeam}
 *           awayTeam={game.awayTeam}
 *           status={game.status}
 *           sport="mlb"
 *         />
 *       ))}
 *     </ScoreCardGrid>
 *   );
 * }
 * ```
 *
 * @component
 * @param props - {@link ScoreCardGridProps}
 * @returns A responsive CSS grid container
 *
 * @see {@link ScoreCard} - Primary content for the grid
 * @see {@link ScoreCardSkeleton} - Loading placeholders for the grid
 */
export function ScoreCardGrid({
  children,
  className = '',
}: ScoreCardGridProps) {
  return (
    <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {children}
    </div>
  );
}

export default ScoreCard;
