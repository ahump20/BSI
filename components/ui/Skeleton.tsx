'use client';

import type { HTMLAttributes } from 'react';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'rect' | 'card' | 'stat' | 'fire';
  width?: string | number;
  height?: string | number;
  lines?: number;
  intensity?: 'subtle' | 'normal' | 'fire';
}

const variantStyles = {
  text: 'h-4 rounded',
  circular: 'rounded-full',
  rectangular: 'rounded-lg',
  rect: 'rounded-lg',
  card: 'rounded-xl',
  stat: 'rounded-lg h-8',
  fire: 'rounded-lg bsi-skeleton-fire',
};

const intensityStyles = {
  subtle: 'opacity-40',
  normal: 'opacity-60',
  fire: 'opacity-80',
};

export function Skeleton({
  variant = 'text',
  width,
  height,
  lines = 1,
  intensity = 'normal',
  className = '',
  ...props
}: SkeletonProps) {
  const baseStyles = 'bsi-skeleton';
  const intensityClass = intensityStyles[intensity];

  const style = {
    width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${baseStyles} ${variantStyles.text} ${intensityClass}`}
            style={{
              ...style,
              width: i === lines - 1 ? '75%' : style.width,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${intensityClass} ${className}`}
      style={style}
      {...props}
    />
  );
}

// Premium skeleton card with covenant glass styling
export function SkeletonCard({
  className = '',
  variant = 'default',
}: {
  className?: string;
  variant?: 'default' | 'premium' | 'fire';
}) {
  const cardVariants = {
    default: 'bsi-glass',
    premium:
      'bg-gradient-to-br from-charcoal-800/60 to-charcoal-900/60 backdrop-blur-xl border border-burnt-orange/10',
    fire: 'bsi-glass border-burnt-orange/20',
  };

  return (
    <div className={`${cardVariants[variant]} rounded-xl p-4 ${className}`}>
      <div className="flex items-center gap-4 mb-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1">
          <Skeleton variant="text" width="60%" className="mb-2" />
          <Skeleton variant="text" width="40%" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i}>
            <Skeleton variant="text" width="50%" className="mb-1" intensity="subtle" />
            <Skeleton variant="stat" width="70%" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Skeleton for table rows with covenant styling
export function SkeletonTableRow({
  columns = 4,
  highlight = false,
}: {
  columns?: number;
  highlight?: boolean;
}) {
  return (
    <tr className={highlight ? 'bg-burnt-orange/5' : ''}>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton variant="text" width="70%" intensity={i === 0 ? 'fire' : 'normal'} />
        </td>
      ))}
    </tr>
  );
}

// Skeleton for live score cards
export function SkeletonScoreCard({
  className = '',
  isLive = false,
}: {
  className?: string;
  isLive?: boolean;
}) {
  return (
    <div className={`bsi-glass rounded-xl p-4 ${isLive ? 'border-burnt-orange/30' : ''} ${className}`}>
      <div className="flex justify-between items-center mb-3">
        <Skeleton variant="text" width={80} intensity="subtle" />
        {isLive ? (
          <Skeleton variant="fire" width={50} height={20} />
        ) : (
          <Skeleton variant="text" width={60} />
        )}
      </div>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Skeleton variant="circular" width={32} height={32} />
            <Skeleton variant="text" width={100} />
          </div>
          <Skeleton variant="stat" width={30} height={28} intensity="fire" />
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Skeleton variant="circular" width={32} height={32} />
            <Skeleton variant="text" width={100} />
          </div>
          <Skeleton variant="stat" width={30} height={28} />
        </div>
      </div>
    </div>
  );
}

// Skeleton for stat cards with sport theming
export function SkeletonStatCard({
  sport = 'baseball',
  className = '',
}: {
  sport?: 'baseball' | 'football' | 'basketball' | 'track';
  className?: string;
}) {
  const sportThemes = {
    baseball: 'border-l-4 border-l-[#6B8E23]/50',
    football: 'border-l-4 border-l-[#355E3B]/50',
    basketball: 'border-l-4 border-l-[#E25822]/50',
    track: 'border-l-4 border-l-[#DC143C]/50',
  };

  return (
    <div className={`bsi-glass rounded-xl p-4 ${sportThemes[sport]} ${className}`}>
      <Skeleton variant="text" width="40%" className="mb-2" intensity="subtle" />
      <Skeleton variant="stat" width="60%" height={32} intensity="fire" />
      <Skeleton variant="text" width="30%" className="mt-2" intensity="subtle" />
    </div>
  );
}

// Skeleton for standings table rows
export function SkeletonStandingsRow({ className = '' }: { className?: string }) {
  return (
    <tr className={`border-b border-white/5 ${className}`}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Skeleton variant="text" width={20} intensity="subtle" />
          <Skeleton variant="circular" width={24} height={24} />
          <Skeleton variant="text" width={100} />
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <Skeleton variant="stat" width={40} height={24} className="mx-auto" />
      </td>
      <td className="px-4 py-3 text-center">
        <Skeleton variant="text" width={30} className="mx-auto" intensity="subtle" />
      </td>
      <td className="px-4 py-3 text-center">
        <Skeleton variant="text" width={40} className="mx-auto" />
      </td>
      <td className="px-4 py-3 text-center hidden md:table-cell">
        <Skeleton variant="text" width={50} className="mx-auto" intensity="subtle" />
      </td>
    </tr>
  );
}

// Skeleton for player cards
export function SkeletonPlayerCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bsi-glass rounded-xl p-4 ${className}`}>
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" width={64} height={64} />
        <div className="flex-1">
          <Skeleton variant="text" width="70%" className="mb-1" intensity="fire" />
          <Skeleton variant="text" width="50%" className="mb-2" intensity="subtle" />
          <div className="flex gap-2">
            <Skeleton variant="rectangular" width={60} height={20} />
            <Skeleton variant="rectangular" width={60} height={20} />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-white/10">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="text-center">
            <Skeleton variant="text" width="60%" className="mx-auto mb-1" intensity="subtle" />
            <Skeleton variant="stat" width="80%" height={24} className="mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Skeleton for the hero section
export function SkeletonHero({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-charcoal-800 to-midnight p-8 md:p-12 ${className}`}
    >
      <div className="max-w-2xl">
        <Skeleton variant="text" width={120} height={24} className="mb-4" intensity="fire" />
        <Skeleton variant="text" width="90%" height={48} className="mb-2" />
        <Skeleton variant="text" width="70%" height={48} className="mb-6" />
        <Skeleton variant="text" lines={2} width="80%" className="mb-8" intensity="subtle" />
        <div className="flex gap-4">
          <Skeleton variant="fire" width={160} height={48} />
          <Skeleton variant="rectangular" width={140} height={48} />
        </div>
      </div>
    </div>
  );
}
