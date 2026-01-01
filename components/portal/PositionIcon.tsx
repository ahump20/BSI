'use client';

import { cn } from '@/lib/utils';

export type Sport = 'baseball' | 'football';

export interface PositionIconProps {
  position: string;
  sport?: Sport;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

// Baseball position detection
function getBaseballPositionType(position: string): 'pitcher' | 'catcher' | 'infield' | 'outfield' {
  if (position.includes('P') || position === 'LHP' || position === 'RHP') return 'pitcher';
  if (position === 'C') return 'catcher';
  if (['LF', 'CF', 'RF', 'OF'].includes(position)) return 'outfield';
  return 'infield';
}

// Football position detection
function getFootballPositionType(
  position: string
): 'qb' | 'skill' | 'oline' | 'defense' | 'specialist' {
  if (position === 'QB') return 'qb';
  if (['RB', 'WR', 'TE'].includes(position)) return 'skill';
  if (['OL', 'OT', 'OG', 'C'].includes(position)) return 'oline';
  if (['DL', 'DE', 'DT', 'LB', 'DB', 'CB', 'S'].includes(position)) return 'defense';
  return 'specialist';
}

// Baseball position icons
function BaseballIcon({ type, className }: { type: string; className: string }) {
  switch (type) {
    case 'pitcher':
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="8" r="5" />
          <path d="M8 21V17L12 14L16 17V21" />
        </svg>
      );
    case 'catcher':
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 2L4 7V12C4 16.5 7.5 20.5 12 22C16.5 20.5 20 16.5 20 12V7L12 2Z" />
        </svg>
      );
    case 'outfield':
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="4" />
        </svg>
      );
    default: // infield
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polygon points="12 2 22 12 12 22 2 12" />
        </svg>
      );
  }
}

// Football position icons
function FootballIcon({ type, className }: { type: string; className: string }) {
  switch (type) {
    case 'qb':
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <ellipse cx="12" cy="12" rx="9" ry="5" />
          <path d="M9 12L12 9L15 12L12 15L9 12" />
        </svg>
      );
    case 'skill':
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 2L4 7V17L12 22L20 17V7L12 2Z" />
          <path d="M12 22V12" />
        </svg>
      );
    case 'oline':
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="9" y1="3" x2="9" y2="21" />
          <line x1="15" y1="3" x2="15" y2="21" />
        </svg>
      );
    case 'defense':
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 2L4 7V12C4 16.5 7.5 20.5 12 22C16.5 20.5 20 16.5 20 12V7L12 2Z" />
        </svg>
      );
    default: // specialist
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6V12L16 14" />
        </svg>
      );
  }
}

export function PositionIcon({
  position,
  sport = 'baseball',
  size = 'md',
  className,
}: PositionIconProps) {
  const iconSize = sizeMap[size];
  const iconClass = cn(iconSize, 'text-burnt-orange', className);

  if (sport === 'baseball') {
    const type = getBaseballPositionType(position);
    return <BaseballIcon type={type} className={iconClass} />;
  }

  const type = getFootballPositionType(position);
  return <FootballIcon type={type} className={iconClass} />;
}

// Position container with background
export function PositionIconContainer({
  position,
  sport = 'baseball',
  size = 'md',
  className,
}: PositionIconProps) {
  const containerSize = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  return (
    <div
      className={cn(
        'flex-shrink-0 rounded-lg flex items-center justify-center',
        'bg-gradient-to-br from-charcoal-700/50 to-charcoal-800/50',
        'border border-burnt-orange/10',
        containerSize[size],
        className
      )}
    >
      <PositionIcon position={position} sport={sport} size={size} />
    </div>
  );
}
