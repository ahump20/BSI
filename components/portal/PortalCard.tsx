'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { StatusBadge } from './StatusBadge';
import { StarRating, EliteBadge } from './StarRating';
import { PositionIconContainer, type Sport } from './PositionIcon';
import type { PortalEntry } from '@/lib/portal/types';

// Re-export PortalEntry for backwards compatibility
export type { PortalEntry } from '@/lib/portal/types';

export interface PortalCardProps {
  entry: PortalEntry;
  sport?: Sport;
  showStats?: boolean;
  href?: string;
  variant?: 'default' | 'compact' | 'featured';
  className?: string;
}

// Hot badge component
function HotBadge() {
  return (
    <span
      className={cn(
        'px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
        'bg-gradient-to-r from-burnt-orange to-ember text-white',
        'rounded-full shadow-lg',
        'animate-pulse'
      )}
    >
      Hot
    </span>
  );
}

// Transfer arrow with animation
function TransferArrow() {
  return (
    <svg
      className="w-4 h-4 text-burnt-orange transition-transform group-hover:translate-x-0.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M5 12H19M19 12L12 5M19 12L12 19" />
    </svg>
  );
}

// Stat display
function StatDisplay({
  label,
  value,
  mono = true,
}: {
  label: string;
  value: string | number;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-text-muted">{label}</span>
      <span className={cn('text-text-primary font-medium', mono && 'font-mono')}>{value}</span>
    </div>
  );
}

export function PortalCard({
  entry,
  sport = 'baseball',
  showStats = true,
  href,
  variant = 'default',
  className,
}: PortalCardProps) {
  const isPitcher =
    entry.position.includes('P') || entry.position === 'LHP' || entry.position === 'RHP';
  const isHot = entry.engagement_score && entry.engagement_score >= 85;
  const isElite = entry.stars && entry.stars >= 5;

  const cardContent = (
    <div
      className={cn(
        'group relative rounded-xl transition-all duration-300',
        'bg-gradient-to-br from-charcoal-800/50 to-charcoal-900/50',
        'border border-border-subtle',
        'hover:border-burnt-orange/40 hover:shadow-glow-sm',
        variant === 'featured' && [
          'border-burnt-orange/30',
          'bg-gradient-to-br from-burnt-orange/5 to-transparent',
        ],
        variant === 'compact' ? 'p-3' : 'p-4 md:p-5',
        className
      )}
    >
      {/* Hot/Elite badges */}
      {(isHot || isElite) && (
        <div className="absolute -top-2 -right-2 flex gap-1">
          {isElite && <EliteBadge />}
          {isHot && !isElite && <HotBadge />}
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Position icon */}
        <PositionIconContainer
          position={entry.position}
          sport={sport}
          size={variant === 'compact' ? 'sm' : 'md'}
        />

        <div className="flex-grow min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h3
                className={cn(
                  'font-semibold text-text-primary transition-colors',
                  'group-hover:text-burnt-orange',
                  variant === 'compact' ? 'text-sm' : 'text-base md:text-lg'
                )}
              >
                {entry.player_name}
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <p
                  className={cn(
                    'text-text-secondary',
                    variant === 'compact' ? 'text-xs' : 'text-sm'
                  )}
                >
                  {entry.position} • {entry.class_year} • {entry.conference}
                </p>
                {entry.stars && sport === 'football' && (
                  <StarRating stars={entry.stars} size="sm" />
                )}
              </div>
            </div>
            <StatusBadge
              status={entry.status}
              size={variant === 'compact' ? 'sm' : 'md'}
              variant={entry.status === 'in_portal' ? 'glow' : 'default'}
            />
          </div>

          {/* Transfer path */}
          <div
            className={cn('flex items-center gap-2', variant === 'compact' ? 'text-xs' : 'text-sm')}
          >
            <span className="text-text-tertiary">{entry.school_from}</span>
            <TransferArrow />
            {entry.school_to ? (
              <span className="text-success-light font-medium">{entry.school_to}</span>
            ) : (
              <span className="text-dust italic">TBD</span>
            )}
          </div>

          {/* Stats (baseball only, when enabled) */}
          {showStats && sport === 'baseball' && entry.stats && variant !== 'compact' && (
            <div className="mt-3 pt-3 border-t border-border-subtle">
              <div className="flex gap-4 text-xs">
                {isPitcher ? (
                  <>
                    {entry.stats.era !== undefined && (
                      <StatDisplay label="ERA" value={entry.stats.era.toFixed(2)} />
                    )}
                    {entry.stats.wins !== undefined && entry.stats.losses !== undefined && (
                      <StatDisplay
                        label="W-L"
                        value={`${entry.stats.wins}-${entry.stats.losses}`}
                      />
                    )}
                    {entry.stats.strikeouts !== undefined && (
                      <StatDisplay label="K" value={entry.stats.strikeouts} />
                    )}
                  </>
                ) : (
                  <>
                    {entry.stats.avg !== undefined && (
                      <StatDisplay label="AVG" value={entry.stats.avg.toFixed(3)} />
                    )}
                    {entry.stats.hr !== undefined && (
                      <StatDisplay label="HR" value={entry.stats.hr} />
                    )}
                    {entry.stats.rbi !== undefined && (
                      <StatDisplay label="RBI" value={entry.stats.rbi} />
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div
            className={cn(
              'flex items-center justify-between mt-3',
              variant === 'compact' && 'mt-2'
            )}
          >
            <span className="text-text-muted text-xs">
              Entered:{' '}
              {new Date(entry.portal_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
            {href && (
              <span className="text-burnt-orange text-xs flex items-center gap-1 group-hover:gap-2 transition-all">
                View Profile
                <svg
                  viewBox="0 0 24 24"
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Fire glow effect on hover */}
      <div
        className={cn(
          'absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300',
          'bg-gradient-to-br from-burnt-orange/5 to-transparent',
          'pointer-events-none',
          'group-hover:opacity-100'
        )}
      />
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}

// Grid wrapper for portal cards
export function PortalCardGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4', className)}>
      {children}
    </div>
  );
}
