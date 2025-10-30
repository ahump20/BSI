/**
 * TeamComparison Component
 *
 * Side-by-side comparison of team statistics with visual indicators.
 * Perfect for matchup previews, head-to-head analysis, and team rankings.
 *
 * @example
 * <TeamComparison
 *   teams={[
 *     { name: 'Lakers', stats: { ppg: 112.3, rpg: 45.2 }, color: '#552583' },
 *     { name: 'Warriors', stats: { ppg: 115.8, rpg: 42.1 }, color: '#1D428A' }
 *   ]}
 * />
 */

'use client';

import React from 'react';
import { graphicsTheme } from '@/lib/graphics/theme';
import { useFadeIn } from '@/lib/graphics/hooks';

export interface TeamData {
  name: string;
  abbr?: string;
  logo?: string;
  color?: string;
  stats: Record<string, number>;
  record?: string;
}

export interface TeamComparisonProps {
  teams: [TeamData, TeamData]; // Exactly 2 teams
  highlightWinner?: boolean; // Highlight the team with better stats
  showPercentages?: boolean; // Show stat bars as percentages
  className?: string;
}

export function TeamComparison({
  teams,
  highlightWinner = true,
  showPercentages = true,
  className = '',
}: TeamComparisonProps) {
  const ref = useFadeIn<HTMLDivElement>();

  const [team1, team2] = teams;
  const color1 = team1.color || graphicsTheme.colors.primary;
  const color2 = team2.color || '#1D428A';

  // Get all unique stat keys
  const statKeys = Array.from(
    new Set([...Object.keys(team1.stats), ...Object.keys(team2.stats)])
  );

  const formatStatKey = (key: string): string => {
    return key.toUpperCase();
  };

  return (
    <div
      ref={ref}
      className={`team-comparison ${className}`}
      style={{
        background: graphicsTheme.colors.background.secondary,
        borderRadius: graphicsTheme.borderRadius.lg,
        padding: '2rem',
        boxShadow: graphicsTheme.shadows.md,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          gap: '2rem',
          marginBottom: '2rem',
          paddingBottom: '1.5rem',
          borderBottom: `2px solid rgba(148, 163, 184, 0.2)`,
        }}
      >
        {/* Team 1 */}
        <TeamHeader team={team1} color={color1} align="left" />

        {/* VS */}
        <div
          style={{
            alignSelf: 'center',
            fontSize: '1.5rem',
            fontWeight: 700,
            color: graphicsTheme.colors.text.tertiary,
          }}
        >
          VS
        </div>

        {/* Team 2 */}
        <TeamHeader team={team2} color={color2} align="right" />
      </div>

      {/* Stats comparison */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {statKeys.map((statKey) => {
          const value1 = team1.stats[statKey] || 0;
          const value2 = team2.stats[statKey] || 0;
          const maxValue = Math.max(value1, value2);
          const percentage1 = maxValue > 0 ? (value1 / maxValue) * 100 : 0;
          const percentage2 = maxValue > 0 ? (value2 / maxValue) * 100 : 0;
          const team1Better = value1 > value2;
          const team2Better = value2 > value1;

          return (
            <StatComparison
              key={statKey}
              label={formatStatKey(statKey)}
              value1={value1}
              value2={value2}
              percentage1={percentage1}
              percentage2={percentage2}
              color1={color1}
              color2={color2}
              team1Better={team1Better}
              team2Better={team2Better}
              highlightWinner={highlightWinner}
              showPercentages={showPercentages}
            />
          );
        })}
      </div>
    </div>
  );
}

/**
 * TeamHeader - Header display for each team
 */
interface TeamHeaderProps {
  team: TeamData;
  color: string;
  align: 'left' | 'right';
}

function TeamHeader({ team, color, align }: TeamHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: align === 'left' ? 'flex-start' : 'flex-end',
        gap: '0.5rem',
      }}
    >
      {/* Logo */}
      {team.logo ? (
        <img
          src={team.logo}
          alt={team.name}
          style={{
            width: '50px',
            height: '50px',
          }}
        />
      ) : (
        <div
          style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            background: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'white',
          }}
        >
          {team.abbr || team.name.substring(0, 2).toUpperCase()}
        </div>
      )}

      {/* Name */}
      <div
        style={{
          fontSize: '1.25rem',
          fontWeight: 700,
          color: graphicsTheme.colors.text.primary,
        }}
      >
        {team.name}
      </div>

      {/* Record */}
      {team.record && (
        <div
          style={{
            fontSize: '0.875rem',
            color: graphicsTheme.colors.text.tertiary,
            fontWeight: 600,
          }}
        >
          {team.record}
        </div>
      )}
    </div>
  );
}

/**
 * StatComparison - Individual stat comparison bar
 */
interface StatComparisonProps {
  label: string;
  value1: number;
  value2: number;
  percentage1: number;
  percentage2: number;
  color1: string;
  color2: string;
  team1Better: boolean;
  team2Better: boolean;
  highlightWinner: boolean;
  showPercentages: boolean;
}

function StatComparison({
  label,
  value1,
  value2,
  percentage1,
  percentage2,
  color1,
  color2,
  team1Better,
  team2Better,
  highlightWinner,
  showPercentages,
}: StatComparisonProps) {
  return (
    <div>
      {/* Label */}
      <div
        style={{
          textAlign: 'center',
          fontSize: '0.75rem',
          fontWeight: 600,
          color: graphicsTheme.colors.text.tertiary,
          marginBottom: '0.5rem',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>

      {/* Comparison bars */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          gap: '1rem',
          alignItems: 'center',
        }}
      >
        {/* Team 1 bar */}
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              marginBottom: '0.5rem',
              fontSize: '1.25rem',
              fontWeight: 700,
              color: highlightWinner && team1Better ? color1 : graphicsTheme.colors.text.primary,
            }}
          >
            {value1.toFixed(1)}
          </div>
          <div
            style={{
              height: '8px',
              borderRadius: graphicsTheme.borderRadius.full,
              background: graphicsTheme.colors.background.tertiary,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: `${showPercentages ? percentage1 : 100}%`,
                background:
                  highlightWinner && team1Better
                    ? color1
                    : graphicsTheme.colors.text.tertiary,
                transition: 'width 0.6s ease-out',
                borderRadius: graphicsTheme.borderRadius.full,
              }}
            />
          </div>
        </div>

        {/* Winner indicator */}
        <div
          style={{
            width: '24px',
            textAlign: 'center',
            fontSize: '1rem',
          }}
        >
          {highlightWinner && (team1Better ? '◀' : team2Better ? '▶' : '=')}
        </div>

        {/* Team 2 bar */}
        <div style={{ textAlign: 'left' }}>
          <div
            style={{
              marginBottom: '0.5rem',
              fontSize: '1.25rem',
              fontWeight: 700,
              color: highlightWinner && team2Better ? color2 : graphicsTheme.colors.text.primary,
            }}
          >
            {value2.toFixed(1)}
          </div>
          <div
            style={{
              height: '8px',
              borderRadius: graphicsTheme.borderRadius.full,
              background: graphicsTheme.colors.background.tertiary,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: `${showPercentages ? percentage2 : 100}%`,
                background:
                  highlightWinner && team2Better
                    ? color2
                    : graphicsTheme.colors.text.tertiary,
                transition: 'width 0.6s ease-out',
                borderRadius: graphicsTheme.borderRadius.full,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * CompactTeamComparison - Minimal comparison view
 */
export interface CompactTeamComparisonProps {
  teams: [TeamData, TeamData];
  primaryStat: string;
  className?: string;
}

export function CompactTeamComparison({
  teams,
  primaryStat,
  className = '',
}: CompactTeamComparisonProps) {
  const [team1, team2] = teams;
  const color1 = team1.color || graphicsTheme.colors.primary;
  const color2 = team2.color || '#1D428A';

  const value1 = team1.stats[primaryStat] || 0;
  const value2 = team2.stats[primaryStat] || 0;
  const maxValue = Math.max(value1, value2);
  const percentage1 = (value1 / maxValue) * 100;
  const percentage2 = (value2 / maxValue) * 100;

  return (
    <div
      className={className}
      style={{
        padding: '1rem',
        background: graphicsTheme.colors.background.secondary,
        borderRadius: graphicsTheme.borderRadius.md,
      }}
    >
      {/* Teams */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '0.75rem',
        }}
      >
        <span
          style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: graphicsTheme.colors.text.primary,
          }}
        >
          {team1.abbr || team1.name}
        </span>
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: graphicsTheme.colors.text.tertiary,
            textTransform: 'uppercase',
          }}
        >
          {primaryStat}
        </span>
        <span
          style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: graphicsTheme.colors.text.primary,
          }}
        >
          {team2.abbr || team2.name}
        </span>
      </div>

      {/* Values */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '0.5rem',
        }}
      >
        <span
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: value1 > value2 ? color1 : graphicsTheme.colors.text.secondary,
          }}
        >
          {value1.toFixed(1)}
        </span>
        <span
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: value2 > value1 ? color2 : graphicsTheme.colors.text.secondary,
          }}
        >
          {value2.toFixed(1)}
        </span>
      </div>

      {/* Bars */}
      <div
        style={{
          position: 'relative',
          height: '6px',
          background: graphicsTheme.colors.background.tertiary,
          borderRadius: graphicsTheme.borderRadius.full,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${percentage1}%`,
            background: color1,
            transition: 'width 0.6s ease-out',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: `${percentage2}%`,
            background: color2,
            transition: 'width 0.6s ease-out',
          }}
        />
      </div>
    </div>
  );
}
