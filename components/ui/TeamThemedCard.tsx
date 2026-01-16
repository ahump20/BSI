'use client';

import { type ReactNode, useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getTeamColors, getContrastText, type TeamColors } from '@/lib/team-themes';

export interface TeamThemedCardProps {
  /** Team identifier (e.g., 'texas', 'lsu', 'cardinals') */
  teamId?: string;
  /** Custom team colors (overrides teamId) */
  colors?: TeamColors;
  /** Card content */
  children: ReactNode;
  /** Card variant */
  variant?: 'solid' | 'gradient' | 'border' | 'glow';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Enable hover effects */
  hoverable?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Additional className */
  className?: string;
}

const sizeStyles = {
  sm: 'p-3 rounded-lg',
  md: 'p-4 rounded-xl',
  lg: 'p-6 rounded-2xl',
};

/**
 * TeamThemedCard - Card component with dynamic team color theming
 *
 * Supports:
 * - Automatic team color lookup by ID
 * - Multiple visual variants (solid, gradient, border, glow)
 * - Animated hover effects
 * - Accessible color contrast
 */
export function TeamThemedCard({
  teamId,
  colors: customColors,
  children,
  variant = 'gradient',
  size = 'md',
  hoverable = true,
  onClick,
  className,
}: TeamThemedCardProps): JSX.Element {
  // Get team colors
  const colors = useMemo(() => {
    if (customColors) return customColors;
    if (teamId) return getTeamColors(teamId);
    return { primary: '#bf5700', secondary: '#ffffff' };
  }, [teamId, customColors]);

  // Calculate text color for contrast
  const textColor = useMemo(() => getContrastText(colors.primary), [colors.primary]);

  // Build style object
  const style = useMemo(() => {
    const baseStyle: React.CSSProperties = {
      '--team-primary': colors.primary,
      '--team-secondary': colors.secondary,
      '--team-accent': colors.accent || colors.primary,
    } as React.CSSProperties;

    switch (variant) {
      case 'solid':
        return {
          ...baseStyle,
          backgroundColor: colors.primary,
          color: textColor,
        };
      case 'gradient':
        return {
          ...baseStyle,
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
          color: textColor,
        };
      case 'border':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderColor: colors.primary,
          borderWidth: '2px',
          borderStyle: 'solid',
        };
      case 'glow':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          boxShadow: `0 0 20px ${colors.primary}40, inset 0 1px 0 ${colors.primary}20`,
          borderColor: `${colors.primary}40`,
          borderWidth: '1px',
          borderStyle: 'solid',
        };
      default:
        return baseStyle;
    }
  }, [colors, variant, textColor]);

  const Component = onClick ? motion.button : motion.div;

  return (
    <Component
      className={cn(
        'relative overflow-hidden transition-all duration-300',
        sizeStyles[size],
        hoverable && 'cursor-pointer',
        className
      )}
      style={style}
      onClick={onClick}
      whileHover={
        hoverable
          ? {
              scale: 1.02,
              y: -2,
              boxShadow:
                variant === 'glow'
                  ? `0 0 30px ${colors.primary}60, inset 0 1px 0 ${colors.primary}30`
                  : `0 10px 40px ${colors.primary}30`,
            }
          : undefined
      }
      whileTap={hoverable ? { scale: 0.98 } : undefined}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Gradient overlay for depth */}
      {variant === 'gradient' && (
        <div
          className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `linear-gradient(135deg, transparent 0%, ${colors.primary}20 100%)`,
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </Component>
  );
}

/**
 * TeamBadge - Small team color badge
 */
export function TeamBadge({
  teamId,
  colors: customColors,
  children,
  className,
}: {
  teamId?: string;
  colors?: TeamColors;
  children: ReactNode;
  className?: string;
}): JSX.Element {
  const colors = useMemo(() => {
    if (customColors) return customColors;
    if (teamId) return getTeamColors(teamId);
    return { primary: '#bf5700', secondary: '#ffffff' };
  }, [teamId, customColors]);

  const textColor = useMemo(() => getContrastText(colors.primary), [colors.primary]);

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold',
        className
      )}
      style={{
        backgroundColor: colors.primary,
        color: textColor,
      }}
    >
      {children}
    </span>
  );
}

/**
 * TeamAccentText - Text with team color accent
 */
export function TeamAccentText({
  teamId,
  colors: customColors,
  children,
  className,
}: {
  teamId?: string;
  colors?: TeamColors;
  children: ReactNode;
  className?: string;
}): JSX.Element {
  const colors = useMemo(() => {
    if (customColors) return customColors;
    if (teamId) return getTeamColors(teamId);
    return { primary: '#bf5700', secondary: '#ffffff' };
  }, [teamId, customColors]);

  return (
    <span className={cn('font-semibold', className)} style={{ color: colors.primary }}>
      {children}
    </span>
  );
}

/**
 * TeamDivider - Horizontal divider with team colors
 */
export function TeamDivider({
  teamId,
  colors: customColors,
  className,
}: {
  teamId?: string;
  colors?: TeamColors;
  className?: string;
}): JSX.Element {
  const colors = useMemo(() => {
    if (customColors) return customColors;
    if (teamId) return getTeamColors(teamId);
    return { primary: '#bf5700', secondary: '#ffffff' };
  }, [teamId, customColors]);

  return (
    <div
      className={cn('h-1 rounded-full', className)}
      style={{
        background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
      }}
    />
  );
}

export default TeamThemedCard;
