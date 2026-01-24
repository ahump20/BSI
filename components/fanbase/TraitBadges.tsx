'use client';

import type { HTMLAttributes } from 'react';

export interface TraitBadgesProps extends HTMLAttributes<HTMLDivElement> {
  traits: string[];
  variant?: 'default' | 'compact';
  limit?: number;
}

const traitColorMap: Record<string, string> = {
  passionate: 'bg-error/20 text-error',
  loyal: 'bg-burnt-orange/20 text-burnt-orange',
  traditional: 'bg-texas-soil/20 text-texas-soil',
  demanding: 'bg-warning/20 text-warning',
  optimistic: 'bg-success/20 text-success',
  intense: 'bg-error/20 text-error',
  knowledgeable: 'bg-info/20 text-info',
  supportive: 'bg-success/20 text-success',
  loud: 'bg-ember/20 text-ember',
  dedicated: 'bg-burnt-orange/20 text-burnt-orange',
  critical: 'bg-warning/20 text-warning',
  historic: 'bg-texas-soil/20 text-texas-soil',
  national: 'bg-info/20 text-info',
  regional: 'bg-white/10 text-white/70',
};

function getTraitColor(trait: string): string {
  const normalized = trait.toLowerCase();
  return traitColorMap[normalized] || 'bg-white/10 text-white/70';
}

export function TraitBadges({
  traits,
  variant = 'default',
  limit,
  className = '',
  ...props
}: TraitBadgesProps) {
  const displayedTraits = limit ? traits.slice(0, limit) : traits;
  const hiddenCount = limit && traits.length > limit ? traits.length - limit : 0;

  const sizeStyles = variant === 'compact' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  return (
    <div className={`flex flex-wrap gap-2 ${className}`} {...props}>
      {displayedTraits.map((trait) => (
        <span
          key={trait}
          className={`inline-flex items-center rounded-full font-medium capitalize ${getTraitColor(trait)} ${sizeStyles}`}
        >
          {trait}
        </span>
      ))}
      {hiddenCount > 0 && (
        <span
          className={`inline-flex items-center rounded-full font-medium bg-white/5 text-white/50 ${sizeStyles}`}
        >
          +{hiddenCount} more
        </span>
      )}
    </div>
  );
}

export interface RivalryBadgesProps extends HTMLAttributes<HTMLDivElement> {
  rivalries: string[];
  limit?: number;
}

export function RivalryBadges({
  rivalries,
  limit = 3,
  className = '',
  ...props
}: RivalryBadgesProps) {
  const displayed = rivalries.slice(0, limit);
  const remaining = rivalries.length - limit;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`} {...props}>
      {displayed.map((rivalry) => (
        <span
          key={rivalry}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-error/10 text-error/80 border border-error/20"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
            />
          </svg>
          vs {rivalry}
        </span>
      ))}
      {remaining > 0 && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white/5 text-white/50">
          +{remaining}
        </span>
      )}
    </div>
  );
}

export interface TraditionBadgesProps extends HTMLAttributes<HTMLDivElement> {
  traditions: string[];
  limit?: number;
}

export function TraditionBadges({
  traditions,
  limit = 3,
  className = '',
  ...props
}: TraditionBadgesProps) {
  const displayed = traditions.slice(0, limit);

  return (
    <div className={`flex flex-wrap gap-2 ${className}`} {...props}>
      {displayed.map((tradition) => (
        <span
          key={tradition}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-texas-soil/10 text-texas-soil border border-texas-soil/20"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
            />
          </svg>
          {tradition}
        </span>
      ))}
    </div>
  );
}
