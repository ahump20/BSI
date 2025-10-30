/**
 * StatCard Component
 *
 * Beautiful stat cards for dashboards with trend indicators.
 * Usage: <StatCard label="Total Wins" value={28} trend={+5} />
 */

'use client';

import React from 'react';
import { graphicsTheme } from '@/lib/graphics/theme';
import { useCountUp, useRevealOnScroll } from '@/lib/graphics/hooks';
import { Sparkline } from '@/components/charts/LineChart';

export interface StatCardProps {
  label: string;
  value: number | string;
  trend?: number;
  trendData?: number[];
  icon?: React.ReactNode;
  color?: string;
  format?: (value: number | string) => string;
  subtitle?: string;
  loading?: boolean;
  animate?: boolean;
  className?: string;
}

export function StatCard({
  label,
  value,
  trend,
  trendData,
  icon,
  color = graphicsTheme.colors.primary,
  format,
  subtitle,
  loading = false,
  animate = true,
  className = '',
}: StatCardProps) {
  const ref = useRevealOnScroll({ duration: 400 });
  const numericValue = typeof value === 'number' ? value : parseFloat(String(value));
  const animatedValue = useCountUp(numericValue, 1000);

  const displayValue = animate && typeof value === 'number'
    ? format ? format(animatedValue) : animatedValue
    : format ? format(value) : value;

  const trendColor = trend && trend > 0
    ? graphicsTheme.colors.success
    : trend && trend < 0
    ? graphicsTheme.colors.error
    : graphicsTheme.colors.text.secondary;

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`stat-card ${className}`}
      style={{
        background: graphicsTheme.colors.background.secondary,
        border: `1px solid rgba(148, 163, 184, 0.1)`,
        borderRadius: graphicsTheme.borderRadius.lg,
        padding: '1.5rem',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = graphicsTheme.shadows.md;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      {/* Accent bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: color,
        }}
      />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <span
          style={{
            fontSize: '0.875rem',
            color: graphicsTheme.colors.text.secondary,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: '600',
          }}
        >
          {label}
        </span>
        {icon && (
          <div
            style={{
              color,
              display: 'flex',
              alignItems: 'center',
              fontSize: '1.5rem',
            }}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      {loading ? (
        <div
          className="skeleton"
          style={{
            height: '2.5rem',
            width: '60%',
            borderRadius: graphicsTheme.borderRadius.md,
          }}
        />
      ) : (
        <div
          style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            color: graphicsTheme.colors.text.primary,
            fontFamily: graphicsTheme.typography.fontFamily.mono,
            lineHeight: 1,
            marginBottom: '0.5rem',
          }}
        >
          {displayValue}
        </div>
      )}

      {/* Trend or Sparkline */}
      {trendData && trendData.length > 0 ? (
        <div style={{ marginTop: '1rem' }}>
          <Sparkline data={trendData} color={color} width={150} height={40} />
        </div>
      ) : trend !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
          <span
            style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: trendColor,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend)}
            {typeof trend === 'number' && trend !== Math.floor(trend) ? '' : '%'}
          </span>
          {subtitle && (
            <span
              style={{
                fontSize: '0.75rem',
                color: graphicsTheme.colors.text.tertiary,
              }}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}

      {subtitle && !trend && (
        <div style={{ marginTop: '0.5rem' }}>
          <span
            style={{
              fontSize: '0.875rem',
              color: graphicsTheme.colors.text.secondary,
            }}
          >
            {subtitle}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * MetricGrid - Grid layout for stat cards
 */
export interface MetricGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  gap?: string;
  className?: string;
}

export function MetricGrid({ children, columns = 3, gap = '1.5rem', className = '' }: MetricGridProps) {
  return (
    <div
      className={`metric-grid ${className}`}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fit, minmax(${columns === 4 ? '200px' : columns === 3 ? '250px' : '300px'}, 1fr))`,
        gap,
      }}
    >
      {children}
    </div>
  );
}

/**
 * CompactStatCard - Smaller version for dense dashboards
 */
export interface CompactStatCardProps {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  color?: string;
  className?: string;
}

export function CompactStatCard({
  label,
  value,
  icon,
  color = graphicsTheme.colors.primary,
  className = '',
}: CompactStatCardProps) {
  return (
    <div
      className={`compact-stat-card ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        background: graphicsTheme.colors.background.secondary,
        border: `1px solid rgba(148, 163, 184, 0.1)`,
        borderRadius: graphicsTheme.borderRadius.md,
        padding: '1rem',
      }}
    >
      {icon && (
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: graphicsTheme.borderRadius.md,
            background: `${color}20`,
            color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
          }}
        >
          {icon}
        </div>
      )}
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: '0.75rem',
            color: graphicsTheme.colors.text.secondary,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.25rem',
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: graphicsTheme.colors.text.primary,
            fontFamily: graphicsTheme.typography.fontFamily.mono,
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
