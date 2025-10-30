/**
 * LiveScoreBoard Component
 *
 * Real-time score display with live updates, perfect for game tracking,
 * dashboards, and live event pages.
 *
 * @example
 * <LiveScoreBoard
 *   game={{
 *     home: { name: 'Lakers', score: 98 },
 *     away: { name: 'Warriors', score: 95 },
 *     status: 'Q4 2:34',
 *     isLive: true
 *   }}
 * />
 */

'use client';

import React from 'react';
import { graphicsTheme } from '@/lib/graphics/theme';
import { useDataFlash } from '@/lib/graphics/realtime';
import { useFadeIn } from '@/lib/graphics/hooks';

export interface Team {
  name: string;
  abbr?: string;
  logo?: string;
  score: number;
  color?: string;
  record?: string; // e.g., "12-5"
}

export interface GameInfo {
  home: Team;
  away: Team;
  status: string; // e.g., "Q4 2:34", "Final", "Halftime"
  isLive?: boolean;
  venue?: string;
  broadcast?: string;
  lastPlay?: string;
}

export interface LiveScoreBoardProps {
  game: GameInfo;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact' | 'minimal';
  onTeamClick?: (team: 'home' | 'away') => void;
  className?: string;
}

export function LiveScoreBoard({
  game,
  size = 'md',
  variant = 'default',
  onTeamClick,
  className = '',
}: LiveScoreBoardProps) {
  const ref = useFadeIn<HTMLDivElement>();
  const homeScoreFlashing = useDataFlash(game.home.score);
  const awayScoreFlashing = useDataFlash(game.away.score);

  if (variant === 'minimal') {
    return <MinimalScoreBoard game={game} />;
  }

  if (variant === 'compact') {
    return <CompactScoreBoard game={game} onTeamClick={onTeamClick} />;
  }

  const sizes = {
    sm: { padding: '1rem', fontSize: '0.875rem', scoreFontSize: '2rem' },
    md: { padding: '1.5rem', fontSize: '1rem', scoreFontSize: '3rem' },
    lg: { padding: '2rem', fontSize: '1.125rem', scoreFontSize: '4rem' },
  };

  const sizeConfig = sizes[size];
  const homeColor = game.home.color || graphicsTheme.colors.primary;
  const awayColor = game.away.color || '#1D428A';

  const isHomeWinning = game.home.score > game.away.score;
  const isAwayWinning = game.away.score > game.home.score;

  return (
    <div
      ref={ref}
      className={`live-scoreboard ${className}`}
      style={{
        background: graphicsTheme.colors.background.secondary,
        borderRadius: graphicsTheme.borderRadius.lg,
        padding: sizeConfig.padding,
        boxShadow: graphicsTheme.shadows.lg,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Live indicator */}
      {game.isLive && (
        <div
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.25rem 0.75rem',
            background: '#EF4444',
            color: 'white',
            borderRadius: graphicsTheme.borderRadius.full,
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            animation: 'pulse 2s ease-in-out infinite',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'white',
              animation: 'pulse 1s ease-in-out infinite',
            }}
          />
          Live
        </div>
      )}

      {/* Teams and scores */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          gap: '2rem',
          alignItems: 'center',
          marginBottom: '1rem',
        }}
      >
        {/* Away team */}
        <TeamDisplay
          team={game.away}
          isWinning={isAwayWinning}
          scoreFlashing={awayScoreFlashing}
          size={sizeConfig}
          onClick={() => onTeamClick?.('away')}
        />

        {/* VS divider */}
        <div
          style={{
            textAlign: 'center',
            fontWeight: 600,
            color: graphicsTheme.colors.text.tertiary,
            fontSize: sizeConfig.fontSize,
          }}
        >
          @
        </div>

        {/* Home team */}
        <TeamDisplay
          team={game.home}
          isWinning={isHomeWinning}
          scoreFlashing={homeScoreFlashing}
          size={sizeConfig}
          onClick={() => onTeamClick?.('home')}
        />
      </div>

      {/* Game status */}
      <div
        style={{
          textAlign: 'center',
          padding: '0.75rem',
          background: graphicsTheme.colors.background.tertiary,
          borderRadius: graphicsTheme.borderRadius.md,
          marginBottom: '1rem',
        }}
      >
        <div
          style={{
            fontSize: sizeConfig.fontSize,
            fontWeight: 700,
            color: game.isLive ? '#EF4444' : graphicsTheme.colors.text.primary,
          }}
        >
          {game.status}
        </div>
      </div>

      {/* Additional info */}
      {(game.venue || game.broadcast) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.875rem',
            color: graphicsTheme.colors.text.tertiary,
            paddingTop: '1rem',
            borderTop: `1px solid rgba(148, 163, 184, 0.1)`,
          }}
        >
          {game.venue && <span>📍 {game.venue}</span>}
          {game.broadcast && <span>📺 {game.broadcast}</span>}
        </div>
      )}

      {/* Last play */}
      {game.lastPlay && game.isLive && (
        <div
          style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: `linear-gradient(90deg, ${graphicsTheme.colors.primary}15, transparent)`,
            borderLeft: `3px solid ${graphicsTheme.colors.primary}`,
            borderRadius: graphicsTheme.borderRadius.sm,
            fontSize: '0.875rem',
            color: graphicsTheme.colors.text.secondary,
          }}
        >
          <div
            style={{
              fontSize: '0.625rem',
              fontWeight: 600,
              color: graphicsTheme.colors.text.tertiary,
              marginBottom: '0.25rem',
              textTransform: 'uppercase',
            }}
          >
            Last Play
          </div>
          {game.lastPlay}
        </div>
      )}
    </div>
  );
}

/**
 * TeamDisplay - Individual team display within scoreboard
 */
interface TeamDisplayProps {
  team: Team;
  isWinning: boolean;
  scoreFlashing: boolean;
  size: { fontSize: string; scoreFontSize: string };
  onClick?: () => void;
}

function TeamDisplay({ team, isWinning, scoreFlashing, size, onClick }: TeamDisplayProps) {
  const teamColor = team.color || graphicsTheme.colors.primary;

  return (
    <div
      onClick={onClick}
      style={{
        textAlign: 'center',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s ease',
        ...(isWinning && {
          opacity: 1,
        }),
        ...(!isWinning && {
          opacity: 0.6,
        }),
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'scale(1.05)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'scale(1)';
        }
      }}
    >
      {/* Logo */}
      {team.logo ? (
        <img
          src={team.logo}
          alt={team.name}
          style={{
            width: '60px',
            height: '60px',
            margin: '0 auto 0.5rem',
            display: 'block',
          }}
        />
      ) : (
        <div
          style={{
            width: '60px',
            height: '60px',
            margin: '0 auto 0.5rem',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${teamColor}, ${graphicsTheme.colors.primary})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'white',
          }}
        >
          {team.abbr || team.name.substring(0, 2).toUpperCase()}
        </div>
      )}

      {/* Team name */}
      <div
        style={{
          fontSize: size.fontSize,
          fontWeight: 700,
          color: graphicsTheme.colors.text.primary,
          marginBottom: '0.25rem',
        }}
      >
        {team.name}
      </div>

      {/* Record */}
      {team.record && (
        <div
          style={{
            fontSize: '0.75rem',
            color: graphicsTheme.colors.text.tertiary,
            marginBottom: '0.5rem',
          }}
        >
          {team.record}
        </div>
      )}

      {/* Score */}
      <div
        style={{
          fontSize: size.scoreFontSize,
          fontWeight: 800,
          color: isWinning ? teamColor : graphicsTheme.colors.text.secondary,
          transition: 'all 0.3s ease',
          ...(scoreFlashing && {
            animation: 'flash 0.5s ease-out',
          }),
        }}
      >
        {team.score}
      </div>
    </div>
  );
}

/**
 * CompactScoreBoard - Condensed horizontal layout
 */
function CompactScoreBoard({
  game,
  onTeamClick,
}: {
  game: GameInfo;
  onTeamClick?: (team: 'home' | 'away') => void;
}) {
  const homeScoreFlashing = useDataFlash(game.home.score);
  const awayScoreFlashing = useDataFlash(game.away.score);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '1rem',
        background: graphicsTheme.colors.background.secondary,
        borderRadius: graphicsTheme.borderRadius.md,
        boxShadow: graphicsTheme.shadows.sm,
      }}
    >
      {/* Live indicator */}
      {game.isLive && (
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#EF4444',
            animation: 'pulse 1s ease-in-out infinite',
            flexShrink: 0,
          }}
        />
      )}

      {/* Away team */}
      <div
        onClick={() => onTeamClick?.('away')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          cursor: onTeamClick ? 'pointer' : 'default',
        }}
      >
        <span
          style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: graphicsTheme.colors.text.primary,
          }}
        >
          {game.away.abbr || game.away.name}
        </span>
        <span
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: game.away.score > game.home.score ? game.away.color : graphicsTheme.colors.text.secondary,
            ...(awayScoreFlashing && { animation: 'flash 0.5s ease-out' }),
          }}
        >
          {game.away.score}
        </span>
      </div>

      {/* VS */}
      <span
        style={{
          fontSize: '0.75rem',
          color: graphicsTheme.colors.text.tertiary,
        }}
      >
        @
      </span>

      {/* Home team */}
      <div
        onClick={() => onTeamClick?.('home')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          cursor: onTeamClick ? 'pointer' : 'default',
        }}
      >
        <span
          style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: graphicsTheme.colors.text.primary,
          }}
        >
          {game.home.abbr || game.home.name}
        </span>
        <span
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: game.home.score > game.away.score ? game.home.color : graphicsTheme.colors.text.secondary,
            ...(homeScoreFlashing && { animation: 'flash 0.5s ease-out' }),
          }}
        >
          {game.home.score}
        </span>
      </div>

      {/* Status */}
      <div
        style={{
          marginLeft: 'auto',
          fontSize: '0.75rem',
          fontWeight: 600,
          color: game.isLive ? '#EF4444' : graphicsTheme.colors.text.tertiary,
        }}
      >
        {game.status}
      </div>
    </div>
  );
}

/**
 * MinimalScoreBoard - Bare minimum score display
 */
function MinimalScoreBoard({ game }: { game: GameInfo }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '0.875rem',
      }}
    >
      <span style={{ fontWeight: 600 }}>{game.away.abbr || game.away.name}</span>
      <span style={{ fontWeight: 700 }}>{game.away.score}</span>
      <span style={{ color: graphicsTheme.colors.text.tertiary }}>-</span>
      <span style={{ fontWeight: 700 }}>{game.home.score}</span>
      <span style={{ fontWeight: 600 }}>{game.home.abbr || game.home.name}</span>
      {game.isLive && (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#EF4444',
          }}
        />
      )}
    </div>
  );
}
