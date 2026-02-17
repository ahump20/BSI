'use client';

import { AnimatedCounter } from '@/components/ui/AnimatedCounter';

const STATS = [
  { value: '6', label: 'Sports Covered' },
  { value: '14', label: 'Live Workers' },
  { value: '24/7', label: 'Data Pipeline' },
  { value: '100%', label: 'Independent' },
];

/** Parse "53", "100%", "300+" into { num, suffix }. Returns null for non-numeric like "24/7". */
function parseNumeric(value: string): { num: number; suffix: string } | null {
  const match = value.match(/^(\d+)([+%]?)$/);
  if (!match) return null;
  return { num: parseInt(match[1], 10), suffix: match[2] };
}

/**
 * StatsBand — horizontal trust metrics strip.
 * Numeric values animate on scroll; non-numeric render static.
 */
export function StatsBand() {
  return (
    <section className="py-10 border-y border-white/5 bg-[#0D0D12]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map((stat) => {
            const parsed = parseNumeric(stat.value);

            return (
              <div key={stat.label}>
                <p className="text-3xl md:text-4xl font-display font-bold text-[#BF5700]">
                  {parsed ? (
                    <AnimatedCounter end={parsed.num} suffix={parsed.suffix} />
                  ) : (
                    stat.value
                  )}
                </p>
                <p className="text-sm text-white/50 mt-1 uppercase tracking-wider">
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
