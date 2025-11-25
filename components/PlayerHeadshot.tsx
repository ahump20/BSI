'use client';

import React, { useState } from 'react';
import { User } from 'lucide-react';

/**
 * BLAZE SPORTS INTEL | Player Headshot Component
 *
 * Displays official league headshots from:
 * - MLB: img.mlbstatic.com
 * - NFL: a.espncdn.com
 * - NCAA: Official team sites / ESPN
 *
 * Features:
 * - Lazy loading for performance
 * - Error fallback to silhouette/initials
 * - Multiple size variants
 * - Team color ring option
 */

interface PlayerHeadshotProps {
  src?: string;
  playerName: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fallback?: 'silhouette' | 'initials';
  teamColor?: string;
  className?: string;
  showRing?: boolean;
}

const SIZE_MAP = {
  xs: { container: 'w-8 h-8', icon: 'w-4 h-4', text: 'text-xs' },
  sm: { container: 'w-12 h-12', icon: 'w-6 h-6', text: 'text-sm' },
  md: { container: 'w-16 h-16', icon: 'w-8 h-8', text: 'text-base' },
  lg: { container: 'w-24 h-24', icon: 'w-12 h-12', text: 'text-xl' },
  xl: { container: 'w-32 h-32', icon: 'w-16 h-16', text: 'text-2xl' },
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function PlayerHeadshot({
  src,
  playerName,
  size = 'md',
  fallback = 'silhouette',
  teamColor,
  className = '',
  showRing = false,
}: PlayerHeadshotProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const sizeStyles = SIZE_MAP[size];
  const initials = getInitials(playerName);

  const ringStyle = showRing && teamColor ? { boxShadow: `0 0 0 3px ${teamColor}` } : {};

  // Show fallback if no src or image failed to load
  if (!src || imageError) {
    return (
      <div
        className={`
          ${sizeStyles.container}
          rounded-full
          bg-gradient-to-br from-gray-600 to-gray-800
          flex items-center justify-center
          ${className}
        `}
        style={ringStyle}
        title={playerName}
      >
        {fallback === 'initials' ? (
          <span className={`${sizeStyles.text} font-bold text-white/80`}>{initials}</span>
        ) : (
          <User className={`${sizeStyles.icon} text-white/60`} />
        )}
      </div>
    );
  }

  return (
    <div
      className={`
        ${sizeStyles.container}
        rounded-full
        overflow-hidden
        bg-gray-700
        ${className}
      `}
      style={ringStyle}
    >
      {/* Loading placeholder */}
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-700 animate-pulse">
          <User className={`${sizeStyles.icon} text-white/40`} />
        </div>
      )}

      <img
        src={src}
        alt={`${playerName} headshot`}
        loading="lazy"
        className={`
          w-full h-full object-cover
          transition-opacity duration-300
          ${imageLoaded ? 'opacity-100' : 'opacity-0'}
        `}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
      />
    </div>
  );
}

/**
 * Compact headshot for list views
 */
export function PlayerHeadshotCompact({
  src,
  playerName,
  className = '',
}: {
  src?: string;
  playerName: string;
  className?: string;
}) {
  return (
    <PlayerHeadshot
      src={src}
      playerName={playerName}
      size="sm"
      fallback="initials"
      className={className}
    />
  );
}

/**
 * Large headshot for detail views
 */
export function PlayerHeadshotLarge({
  src,
  playerName,
  teamColor,
  className = '',
}: {
  src?: string;
  playerName: string;
  teamColor?: string;
  className?: string;
}) {
  return (
    <PlayerHeadshot
      src={src}
      playerName={playerName}
      size="xl"
      fallback="silhouette"
      teamColor={teamColor}
      showRing={!!teamColor}
      className={className}
    />
  );
}
