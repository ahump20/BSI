'use client';

import { ScrollReveal } from '@/components/cinematic';

const stats = [
  { value: '14', label: 'Live Workers' },
  { value: '6', label: 'Sports Covered' },
  { value: '30s', label: 'Update Cycle' },
  { value: '100%', label: 'Independent' },
] as const;

/**
 * EvidenceStrip — compact horizontal stat strip.
 * Numbers speak; no descriptions needed.
 */
export function EvidenceStrip() {
  return (
    <section className="py-10 px-4 sm:px-6 lg:px-8 border-y border-white/5 bg-[#0D0D0D]/80">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, i) => (
            <ScrollReveal key={stat.label} direction="up" delay={i * 80}>
              <div className="text-center">
                <div className="font-mono text-3xl md:text-4xl font-bold text-white tracking-tight">
                  {stat.value}
                </div>
                <div className="text-xs uppercase tracking-widest text-white/40 mt-1">
                  {stat.label}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
