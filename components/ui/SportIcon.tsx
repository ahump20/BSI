/**
 * SportIcon Component
 *
 * Professional SVG sport icons to replace emoji usage across BSI.
 * Supports sports (mlb, nfl, nba, ncaa) and utility icons (trending, chart, target, refresh).
 *
 * Last Updated: 2025-01-26
 */

import { cn } from '@/lib/utils';

export type SportIconType =
  | 'mlb'
  | 'nfl'
  | 'nba'
  | 'ncaa'
  | 'cfb'
  | 'college-baseball'
  | 'trending'
  | 'chart'
  | 'target'
  | 'refresh';

export type SportIconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface SportIconProps {
  icon: SportIconType;
  size?: SportIconSize;
  className?: string;
  'aria-label'?: string;
}

const sizeClasses: Record<SportIconSize, string> = {
  xs: 'w-4 h-4',
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

function BaseballIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path
        d="M6 6.5C7.5 8.5 7.5 15.5 6 17.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M18 6.5C16.5 8.5 16.5 15.5 18 17.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Stitching marks */}
      <path
        d="M6.8 8L5.5 7.2M7 10L5.5 9.5M7 14L5.5 14.5M6.8 16L5.5 16.8"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeLinecap="round"
      />
      <path
        d="M17.2 8L18.5 7.2M17 10L18.5 9.5M17 14L18.5 14.5M17.2 16L18.5 16.8"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FootballIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <ellipse
        cx="12"
        cy="12"
        rx="10"
        ry="6"
        fill="currentColor"
        opacity="0.15"
        transform="rotate(-45 12 12)"
      />
      <ellipse
        cx="12"
        cy="12"
        rx="10"
        ry="6"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        transform="rotate(-45 12 12)"
      />
      {/* Center laces */}
      <line
        x1="12"
        y1="8"
        x2="12"
        y2="16"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <line
        x1="10"
        y1="9.5"
        x2="14"
        y2="9.5"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <line
        x1="10"
        y1="12"
        x2="14"
        y2="12"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <line
        x1="10"
        y1="14.5"
        x2="14"
        y2="14.5"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BasketballIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none" />
      {/* Vertical line */}
      <line x1="12" y1="2" x2="12" y2="22" stroke="currentColor" strokeWidth="1" />
      {/* Horizontal line */}
      <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1" />
      {/* Curved lines */}
      <path
        d="M6 2.5C6 7 9 12 12 12C15 12 18 7 18 2.5"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
      />
      <path
        d="M6 21.5C6 17 9 12 12 12C15 12 18 17 18 21.5"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
      />
    </svg>
  );
}

function GraduationCapIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      {/* Cap top */}
      <polygon
        points="12,2 2,8 12,14 22,8"
        fill="currentColor"
        opacity="0.15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Side drape */}
      <path
        d="M6 10V16C6 18 9 20 12 20C15 20 18 18 18 16V10"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Tassel */}
      <line
        x1="22"
        y1="8"
        x2="22"
        y2="14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="22" cy="15" r="1" fill="currentColor" />
    </svg>
  );
}

function TrendingIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function TargetIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

const iconComponents: Record<SportIconType, React.FC<{ className?: string }>> = {
  mlb: BaseballIcon,
  nfl: FootballIcon,
  nba: BasketballIcon,
  ncaa: GraduationCapIcon,
  cfb: FootballIcon,
  'college-baseball': BaseballIcon,
  trending: TrendingIcon,
  chart: ChartIcon,
  target: TargetIcon,
  refresh: RefreshIcon,
};

export function SportIcon({
  icon,
  size = 'md',
  className,
  'aria-label': ariaLabel,
}: SportIconProps) {
  const IconComponent = iconComponents[icon];

  if (!IconComponent) {
    return null;
  }

  const label = ariaLabel || `${icon} icon`;

  return (
    <span role="img" aria-label={label} className={cn('inline-flex', className)}>
      <IconComponent className={sizeClasses[size]} />
    </span>
  );
}

export default SportIcon;
