'use client';

import { useState } from 'react';
import { getTeamLogoUrl } from '@/lib/team-logos';

type Sport = 'nfl' | 'nba' | 'mlb' | 'ncaaf' | 'ncaab';

interface TeamLogoProps {
  abbreviation: string;
  sport: Sport;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-16 h-16',
};

const textSizeClasses = {
  sm: 'text-xs',
  md: 'text-xs',
  lg: 'text-xl',
};

export function TeamLogo({ abbreviation, sport, size = 'md', className = '' }: TeamLogoProps) {
  const [imageError, setImageError] = useState(false);
  const logoUrl = getTeamLogoUrl(abbreviation, sport);
  const fallbackText = abbreviation.toUpperCase().slice(0, 3);

  if (!logoUrl || imageError) {
    return (
      <div
        className={`${sizeClasses[size]} bg-charcoal rounded-full flex items-center justify-center font-bold text-burnt-orange ${className}`}
      >
        <span className={textSizeClasses[size]}>{fallbackText}</span>
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} relative ${className}`}>
      <img
        src={logoUrl}
        alt={`${abbreviation} logo`}
        className="w-full h-full object-contain"
        onError={() => setImageError(true)}
        loading="lazy"
      />
    </div>
  );
}

export default TeamLogo;
