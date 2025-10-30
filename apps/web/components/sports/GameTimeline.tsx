/**
 * GameTimeline Component
 *
 * Visual timeline showing scoring progression and key events during a game.
 * Perfect for displaying game flow, momentum shifts, and highlight moments.
 *
 * @example
 * <GameTimeline
 *   events={gameEvents}
 *   teams={{ home: 'Lakers', away: 'Warriors' }}
 *   colors={{ home: '#552583', away: '#1D428A' }}
 * />
 */

'use client';

import React, { useMemo } from 'react';
import { graphicsTheme } from '@/lib/graphics/theme';
import { usePrefersReducedMotion, useRevealOnScroll } from '@/lib/graphics/hooks';

export interface TimelineEvent {
  time: number; // Minutes elapsed in game
  type: 'score' | 'timeout' | 'substitution' | 'quarter' | 'highlight';
  team: 'home' | 'away';
  description: string;
  points?: number;
  homeScore?: number;
  awayScore?: number;
}

export interface GameTimelineProps {
  events: TimelineEvent[];
  teams: {
    home: string;
    away: string;
  };
  colors?: {
    home?: string;
    away?: string;
  };
  duration?: number; // Total game duration in minutes (default: 48 for basketball)
  className?: string;
}

export function GameTimeline({
  events,
  teams,
  colors = {},
  duration = 48,
  className = '',
}: GameTimelineProps) {
  const prefersReduced = usePrefersReducedMotion();
  const ref = useRevealOnScroll<HTMLDivElement>({ threshold: 0.2 });

  const homeColor = colors.home || graphicsTheme.colors.primary;
  const awayColor = colors.away || '#1D428A';

  // Sort events by time
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => a.time - b.time);
  }, [events]);

  // Calculate score progression
  const scoreProgression = useMemo(() => {
    let homeScore = 0;
    let awayScore = 0;
    return sortedEvents.map((event) => {
      if (event.homeScore !== undefined) homeScore = event.homeScore;
      if (event.awayScore !== undefined) awayScore = event.awayScore;
      return { time: event.time, home: homeScore, away: awayScore };
    });
  }, [sortedEvents]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'score':
        return '🏀';
      case 'timeout':
        return '⏸️';
      case 'substitution':
        return '↔️';
      case 'highlight':
        return '⭐';
      case 'quarter':
        return '📍';
      default:
        return '•';
    }
  };

  return (
    <div
      ref={ref}
      className={`game-timeline ${className}`}
      style={{
        padding: '2rem',
        background: graphicsTheme.colors.background.secondary,
        borderRadius: graphicsTheme.borderRadius.lg,
        boxShadow: graphicsTheme.shadows.md,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          paddingBottom: '1rem',
          borderBottom: `1px solid rgba(148, 163, 184, 0.2)`,
        }}
      >
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div
            style={{
              display: 'inline-block',
              padding: '0.5rem 1rem',
              background: homeColor,
              color: 'white',
              borderRadius: graphicsTheme.borderRadius.md,
              fontWeight: 600,
            }}
          >
            {teams.home}
          </div>
        </div>
        <div
          style={{
            fontWeight: 600,
            color: graphicsTheme.colors.text.secondary,
            alignSelf: 'center',
          }}
        >
          VS
        </div>
        <div style={{ flex: 1, textAlign: 'right' }}>
          <div
            style={{
              display: 'inline-block',
              padding: '0.5rem 1rem',
              background: awayColor,
              color: 'white',
              borderRadius: graphicsTheme.borderRadius.md,
              fontWeight: 600,
            }}
          >
            {teams.away}
          </div>
        </div>
      </div>

      {/* Score progression line chart */}
      <div
        style={{
          position: 'relative',
          height: '120px',
          marginBottom: '2rem',
          padding: '1rem',
          background: graphicsTheme.colors.background.tertiary,
          borderRadius: graphicsTheme.borderRadius.md,
        }}
      >
        <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
          {/* Grid lines */}
          {[0, 12, 24, 36, 48].map((time) => (
            <g key={time}>
              <line
                x1={`${(time / duration) * 100}%`}
                y1="0"
                x2={`${(time / duration) * 100}%`}
                y2="100%"
                stroke="rgba(148, 163, 184, 0.1)"
                strokeWidth="1"
              />
              <text
                x={`${(time / duration) * 100}%`}
                y="100%"
                dy="20"
                textAnchor="middle"
                fill={graphicsTheme.colors.text.tertiary}
                fontSize="12"
              >
                {time}m
              </text>
            </g>
          ))}

          {/* Score lines */}
          {scoreProgression.length > 1 && (
            <>
              <polyline
                points={scoreProgression
                  .map((point, i) => {
                    const x = (point.time / duration) * 100;
                    const maxScore = Math.max(
                      ...scoreProgression.map((p) => Math.max(p.home, p.away))
                    );
                    const y = 100 - (point.home / maxScore) * 90;
                    return `${x}%,${y}%`;
                  })
                  .join(' ')}
                fill="none"
                stroke={homeColor}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points={scoreProgression
                  .map((point, i) => {
                    const x = (point.time / duration) * 100;
                    const maxScore = Math.max(
                      ...scoreProgression.map((p) => Math.max(p.home, p.away))
                    );
                    const y = 100 - (point.away / maxScore) * 90;
                    return `${x}%,${y}%`;
                  })
                  .join(' ')}
                fill="none"
                stroke={awayColor}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}
        </svg>
      </div>

      {/* Timeline events */}
      <div style={{ position: 'relative' }}>
        {/* Timeline bar */}
        <div
          style={{
            position: 'absolute',
            left: '2rem',
            top: 0,
            bottom: 0,
            width: '2px',
            background: 'rgba(148, 163, 184, 0.2)',
          }}
        />

        {/* Events */}
        {sortedEvents.map((event, index) => (
          <div
            key={index}
            style={{
              position: 'relative',
              paddingLeft: '4rem',
              paddingBottom: '1.5rem',
              opacity: prefersReduced ? 1 : 0,
              animation: prefersReduced ? 'none' : `fadeInUp 0.4s ease-out ${index * 0.05}s forwards`,
            }}
          >
            {/* Time marker */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: '0.25rem',
                width: '2rem',
                textAlign: 'right',
                fontSize: '0.75rem',
                color: graphicsTheme.colors.text.tertiary,
                fontWeight: 600,
              }}
            >
              {Math.floor(event.time)}'
            </div>

            {/* Event dot */}
            <div
              style={{
                position: 'absolute',
                left: 'calc(2rem - 6px)',
                top: '0.5rem',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                background: event.team === 'home' ? homeColor : awayColor,
                border: `2px solid ${graphicsTheme.colors.background.secondary}`,
                zIndex: 1,
              }}
            />

            {/* Event content */}
            <div
              style={{
                background: graphicsTheme.colors.background.tertiary,
                padding: '0.75rem 1rem',
                borderRadius: graphicsTheme.borderRadius.md,
                borderLeft: `3px solid ${event.team === 'home' ? homeColor : awayColor}`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.25rem',
                }}
              >
                <span style={{ fontSize: '1rem' }}>{getEventIcon(event.type)}</span>
                <span
                  style={{
                    fontWeight: 600,
                    color: graphicsTheme.colors.text.primary,
                    textTransform: 'capitalize',
                  }}
                >
                  {event.type}
                </span>
                {event.points && (
                  <span
                    style={{
                      marginLeft: 'auto',
                      padding: '0.125rem 0.5rem',
                      background: event.team === 'home' ? homeColor : awayColor,
                      color: 'white',
                      borderRadius: graphicsTheme.borderRadius.sm,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    +{event.points}
                  </span>
                )}
              </div>
              <div
                style={{
                  fontSize: '0.875rem',
                  color: graphicsTheme.colors.text.secondary,
                }}
              >
                {event.description}
              </div>
              {(event.homeScore !== undefined || event.awayScore !== undefined) && (
                <div
                  style={{
                    marginTop: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: graphicsTheme.colors.text.tertiary,
                  }}
                >
                  Score: {event.homeScore} - {event.awayScore}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * CompactTimeline - Condensed version for smaller spaces
 */
export interface CompactTimelineProps {
  events: TimelineEvent[];
  teams: { home: string; away: string };
  colors?: { home?: string; away?: string };
}

export function CompactTimeline({ events, teams, colors = {} }: CompactTimelineProps) {
  const homeColor = colors.home || graphicsTheme.colors.primary;
  const awayColor = colors.away || '#1D428A';

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => a.time - b.time).slice(-5); // Last 5 events
  }, [events]);

  return (
    <div
      style={{
        background: graphicsTheme.colors.background.secondary,
        borderRadius: graphicsTheme.borderRadius.md,
        padding: '1rem',
      }}
    >
      <div
        style={{
          fontSize: '0.75rem',
          fontWeight: 600,
          color: graphicsTheme.colors.text.tertiary,
          marginBottom: '0.75rem',
          textTransform: 'uppercase',
        }}
      >
        Recent Events
      </div>
      {sortedEvents.map((event, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem',
            marginBottom: '0.5rem',
            background: graphicsTheme.colors.background.tertiary,
            borderRadius: graphicsTheme.borderRadius.sm,
            borderLeft: `2px solid ${event.team === 'home' ? homeColor : awayColor}`,
          }}
        >
          <span
            style={{
              fontSize: '0.625rem',
              fontWeight: 600,
              color: graphicsTheme.colors.text.tertiary,
              minWidth: '2rem',
            }}
          >
            {Math.floor(event.time)}'
          </span>
          <span style={{ fontSize: '0.875rem', color: graphicsTheme.colors.text.secondary }}>
            {event.description}
          </span>
        </div>
      ))}
    </div>
  );
}
