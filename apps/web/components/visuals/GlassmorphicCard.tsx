'use client';

import { ReactNode, CSSProperties } from 'react';
import styles from './GlassmorphicCard.module.css';

interface GlassmorphicCardProps {
  children: ReactNode;
  variant?: 'default' | 'elevated' | 'neon' | 'holographic';
  blur?: 'light' | 'medium' | 'heavy';
  glowColor?: string;
  animated?: boolean;
  interactive?: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * Next-Gen Glassmorphic Card Component
 * Features: Frosted glass effect, depth layers, animated gradients
 * Variants: default, elevated, neon, holographic
 */
export default function GlassmorphicCard({
  children,
  variant = 'default',
  blur = 'medium',
  glowColor = '#BF5700',
  animated = true,
  interactive = true,
  className = '',
  style = {},
}: GlassmorphicCardProps) {
  const classNames = [
    styles.card,
    styles[variant],
    styles[`blur-${blur}`],
    animated && styles.animated,
    interactive && styles.interactive,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classNames}
      style={
        {
          ...style,
          '--glow-color': glowColor,
        } as CSSProperties
      }
    >
      <div className={styles.glassLayer}></div>
      <div className={styles.content}>{children}</div>
      {variant === 'neon' && <div className={styles.neonGlow}></div>}
      {variant === 'holographic' && (
        <div className={styles.holographicOverlay}></div>
      )}
    </div>
  );
}

/**
 * Stat Display Component with Glassmorphic Design
 */
interface StatCardProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: ReactNode;
  variant?: 'default' | 'elevated' | 'neon' | 'holographic';
}

export function StatCard({
  label,
  value,
  trend,
  trendValue,
  icon,
  variant = 'default',
}: StatCardProps) {
  return (
    <GlassmorphicCard variant={variant} className={styles.statCard}>
      <div className={styles.statHeader}>
        {icon && <div className={styles.statIcon}>{icon}</div>}
        <span className={styles.statLabel}>{label}</span>
      </div>
      <div className={styles.statValue}>{value}</div>
      {trend && trendValue && (
        <div className={`${styles.statTrend} ${styles[`trend-${trend}`]}`}>
          <span className={styles.trendIndicator}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
          </span>
          <span className={styles.trendValue}>{trendValue}</span>
        </div>
      )}
    </GlassmorphicCard>
  );
}
