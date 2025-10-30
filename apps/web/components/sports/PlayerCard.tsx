/**
 * PlayerCard Component
 *
 * Rich player statistics card with visualizations, perfect for player profiles,
 * comparison views, and team rosters.
 *
 * @example
 * <PlayerCard
 *   player={{
 *     name: 'LeBron James',
 *     number: 23,
 *     position: 'F',
 *     team: 'Lakers',
 *     stats: { ppg: 25.7, rpg: 7.3, apg: 7.3 }
 *   }}
 * />
 */

'use client';

import React from 'react';
import { graphicsTheme } from '@/lib/graphics/theme';
import { Sparkline } from '@/components/charts/LineChart';
import { useFadeIn, useCountUp } from '@/lib/graphics/hooks';

export interface PlayerStats {
  [key: string]: number | string;
}

export interface Player {
  name: string;
  number?: number;
  position?: string;
  team: string;
  teamColor?: string;
  photo?: string;
  stats: PlayerStats;
  trend?: number[]; // Historical performance data
  status?: 'active' | 'injured' | 'inactive';
}

export interface PlayerCardProps {
  player: Player;
  highlightStats?: string[]; // Keys of stats to highlight
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
}

export function PlayerCard({
  player,
  highlightStats = [],
  size = 'md',
  onClick,
  className = '',
}: PlayerCardProps) {
  const ref = useFadeIn<HTMLDivElement>();

  const sizes = {
    sm: { padding: '1rem', photoSize: '60px', fontSize: '0.875rem' },
    md: { padding: '1.5rem', photoSize: '80px', fontSize: '1rem' },
    lg: { padding: '2rem', photoSize: '100px', fontSize: '1.125rem' },
  };

  const sizeConfig = sizes[size];
  const teamColor = player.teamColor || graphicsTheme.colors.primary;

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active':
        return '#10B981';
      case 'injured':
        return '#EF4444';
      case 'inactive':
        return '#6B7280';
      default:
        return graphicsTheme.colors.text.tertiary;
    }
  };

  const formatStatValue = (value: number | string): string => {
    if (typeof value === 'number') {
      return value % 1 === 0 ? value.toString() : value.toFixed(1);
    }
    return value;
  };

  const formatStatKey = (key: string): string => {
    return key.toUpperCase();
  };

  return (
    <div
      ref={ref}
      className={`player-card ${className}`}
      onClick={onClick}
      style={{
        background: graphicsTheme.colors.background.secondary,
        borderRadius: graphicsTheme.borderRadius.lg,
        padding: sizeConfig.padding,
        boxShadow: graphicsTheme.shadows.md,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden',
        ...(onClick && {
          ':hover': {
            transform: 'translateY(-2px)',
            boxShadow: graphicsTheme.shadows.lg,
          },
        }),
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = graphicsTheme.shadows.lg;
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = graphicsTheme.shadows.md;
        }
      }}
    >
      {/* Team color accent */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: teamColor,
        }}
      />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
        {/* Photo/Number */}
        <div
          style={{
            width: sizeConfig.photoSize,
            height: sizeConfig.photoSize,
            borderRadius: '50%',
            background: player.photo
              ? `url(${player.photo}) center/cover`
              : `linear-gradient(135deg, ${teamColor}, ${graphicsTheme.colors.primary})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: size === 'sm' ? '1.5rem' : size === 'md' ? '2rem' : '2.5rem',
            fontWeight: 700,
            color: 'white',
            flexShrink: 0,
            border: `3px solid ${graphicsTheme.colors.background.primary}`,
          }}
        >
          {!player.photo && player.number}
        </div>

        {/* Player info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: sizeConfig.fontSize,
              fontWeight: 700,
              color: graphicsTheme.colors.text.primary,
              marginBottom: '0.25rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {player.name}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              flexWrap: 'wrap',
            }}
          >
            {player.number && (
              <span
                style={{
                  fontSize: size === 'sm' ? '0.75rem' : '0.875rem',
                  fontWeight: 600,
                  color: graphicsTheme.colors.text.secondary,
                }}
              >
                #{player.number}
              </span>
            )}
            {player.position && (
              <span
                style={{
                  fontSize: size === 'sm' ? '0.75rem' : '0.875rem',
                  padding: '0.125rem 0.5rem',
                  background: teamColor,
                  color: 'white',
                  borderRadius: graphicsTheme.borderRadius.sm,
                  fontWeight: 600,
                }}
              >
                {player.position}
              </span>
            )}
            {player.status && (
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: getStatusColor(player.status),
                  display: 'inline-block',
                }}
              />
            )}
          </div>
          <div
            style={{
              fontSize: size === 'sm' ? '0.75rem' : '0.875rem',
              color: graphicsTheme.colors.text.tertiary,
              marginTop: '0.25rem',
            }}
          >
            {player.team}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: size === 'sm' ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
          gap: '1rem',
          marginTop: '1rem',
        }}
      >
        {Object.entries(player.stats).map(([key, value]) => {
          const isHighlighted = highlightStats.includes(key);
          return (
            <StatDisplay
              key={key}
              label={formatStatKey(key)}
              value={formatStatValue(value)}
              highlighted={isHighlighted}
              color={teamColor}
            />
          );
        })}
      </div>

      {/* Trend sparkline */}
      {player.trend && player.trend.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: graphicsTheme.colors.text.tertiary,
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
            }}
          >
            Recent Performance
          </div>
          <Sparkline
            data={player.trend}
            height={40}
            color={teamColor}
            showLastValue={false}
          />
        </div>
      )}
    </div>
  );
}

/**
 * StatDisplay - Individual stat display component
 */
interface StatDisplayProps {
  label: string;
  value: string;
  highlighted?: boolean;
  color?: string;
}

function StatDisplay({ label, value, highlighted = false, color }: StatDisplayProps) {
  const animatedValue = useCountUp(parseFloat(value) || 0);

  return (
    <div
      style={{
        textAlign: 'center',
        padding: '0.75rem',
        background: highlighted
          ? `linear-gradient(135deg, ${color}15, ${color}05)`
          : graphicsTheme.colors.background.tertiary,
        borderRadius: graphicsTheme.borderRadius.md,
        border: highlighted ? `2px solid ${color}` : 'none',
      }}
    >
      <div
        style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: highlighted ? color : graphicsTheme.colors.text.primary,
          marginBottom: '0.25rem',
        }}
      >
        {isNaN(parseFloat(value)) ? value : animatedValue.toFixed(1)}
      </div>
      <div
        style={{
          fontSize: '0.75rem',
          fontWeight: 600,
          color: graphicsTheme.colors.text.tertiary,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
    </div>
  );
}

/**
 * CompactPlayerCard - Minimal player card for lists/grids
 */
export interface CompactPlayerCardProps {
  player: Player;
  primaryStat?: string;
  onClick?: () => void;
}

export function CompactPlayerCard({ player, primaryStat, onClick }: CompactPlayerCardProps) {
  const teamColor = player.teamColor || graphicsTheme.colors.primary;

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem',
        background: graphicsTheme.colors.background.secondary,
        borderRadius: graphicsTheme.borderRadius.md,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        borderLeft: `3px solid ${teamColor}`,
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.background = graphicsTheme.colors.background.tertiary;
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.background = graphicsTheme.colors.background.secondary;
        }
      }}
    >
      {/* Number circle */}
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: teamColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1rem',
          fontWeight: 700,
          color: 'white',
          flexShrink: 0,
        }}
      >
        {player.number}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: graphicsTheme.colors.text.primary,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {player.name}
        </div>
        <div
          style={{
            fontSize: '0.75rem',
            color: graphicsTheme.colors.text.tertiary,
          }}
        >
          {player.position} • {player.team}
        </div>
      </div>

      {/* Primary stat */}
      {primaryStat && player.stats[primaryStat] !== undefined && (
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: teamColor,
            }}
          >
            {formatStatValue(player.stats[primaryStat])}
          </div>
          <div
            style={{
              fontSize: '0.625rem',
              fontWeight: 600,
              color: graphicsTheme.colors.text.tertiary,
              textTransform: 'uppercase',
            }}
          >
            {primaryStat}
          </div>
        </div>
      )}
    </div>
  );
}

function formatStatValue(value: number | string): string {
  if (typeof value === 'number') {
    return value % 1 === 0 ? value.toString() : value.toFixed(1);
  }
  return value;
}
