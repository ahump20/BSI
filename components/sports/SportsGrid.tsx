'use client';

/**
 * BSI Sports Grid
 *
 * Premium sports coverage grid with equal representation.
 * Each sport gets the same treatment — no bias, no afterthoughts.
 */

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { SportIcon, type SportIconType } from '@/components/ui/SportIcon';

interface Sport {
  name: string;
  icon: SportIconType;
  href: string;
  description: string;
  comingSoon?: boolean;
}

const SPORTS: Sport[] = [
  {
    name: 'MLB',
    icon: 'mlb',
    href: '/mlb',
    description: 'Live scores, standings & Statcast analytics',
  },
  {
    name: 'NFL',
    icon: 'nfl',
    href: '/nfl',
    description: 'Game coverage & team intelligence',
  },
  {
    name: 'NCAA Football',
    icon: 'cfb',
    href: '/cfb',
    description: 'College football analytics',
    comingSoon: true,
  },
  {
    name: 'NBA',
    icon: 'nba',
    href: '/nba',
    description: 'Live scores & standings',
  },
  {
    name: 'College Baseball',
    icon: 'ncaa',
    href: '/college-baseball',
    description: 'D1 rankings, box scores & complete coverage',
  },
];

interface SportsGridProps {
  className?: string;
}

export function SportsGrid({ className }: SportsGridProps) {
  return (
    <section className={cn('py-20 px-4 sm:px-6 lg:px-8 bg-charcoal-950', className)}>
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="kicker block mb-4">What We Cover</span>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
            Equal Coverage · Zero Homerism
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Every sport gets the treatment it deserves. Real analytics, not just scores.
          </p>
        </div>

        {/* Sports Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {SPORTS.map((sport) => (
            <Link
              key={sport.name}
              href={sport.href}
              className={cn(
                'group relative p-6 rounded-xl border border-white/10 bg-charcoal-900/50',
                'hover:border-burnt-orange-500/50 hover:bg-charcoal-900',
                'transition-all duration-300 hover:shadow-glow-sm',
                'flex flex-col items-center text-center h-full'
              )}
            >
              {/* Coming Soon Badge */}
              {sport.comingSoon && (
                <span className="absolute top-3 right-3 px-2 py-0.5 text-xs font-semibold bg-gold/20 text-gold rounded-full">
                  Coming Soon
                </span>
              )}

              {/* Icon */}
              <span className="mb-4 group-hover:scale-110 transition-transform duration-300 text-burnt-orange">
                <SportIcon icon={sport.icon} size="xl" />
              </span>

              {/* Name */}
              <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-burnt-orange-400 transition-colors">
                {sport.name}
              </h3>

              {/* Description */}
              <p className="text-sm text-white/50 group-hover:text-white/70 transition-colors">
                {sport.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default SportsGrid;
