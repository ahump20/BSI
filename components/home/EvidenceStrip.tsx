'use client';

import { ScrollReveal } from '@/components/cinematic';

const stats = [
  { value: '297', label: 'D1 Teams Tracked' },
  { value: '30s', label: 'Portal Refresh' },
  { value: '6', label: 'Sports Covered' },
  { value: '100%', label: 'Independent' },
] as const;

/**
 * EvidenceStrip — compact horizontal stat strip.
 * Numbers speak; no descriptions needed.
 */
export function EvidenceStrip() {
  return (
    <section className="py-10 px-4 sm:px-6 lg:px-8 border-y border-border-subtle bg-background-primary/80">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, i) => (
            <ScrollReveal key={stat.label} direction="up" delay={i * 80}>
              <div className="text-center">
                <div className="font-mono text-3xl md:text-4xl font-bold text-text-primary tracking-tight">
                  {stat.value}
                </div>
                <div className="text-xs uppercase tracking-widest text-text-muted mt-1">
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
