'use client';

import { ScrollReveal } from '@/components/cinematic';

const DIFFERENTIATORS = [
  {
    label: 'Coverage Gap',
    body: 'Mid-majors, Tuesday night games, overlooked programs — BSI covers what gets cut from the national highlight reel.',
  },
  {
    label: 'Live Sabermetrics',
    body: 'Park-adjusted metrics — wOBA, FIP, ERA− — computed every six hours across all 300+ D1 programs. Free.',
  },
  {
    label: 'Five Sports, One Standard',
    body: 'MLB, NFL, NBA, college football, college baseball. Same rigor, same data infrastructure, same instinct for what the numbers actually mean.',
  },
];

export function WhyBSI() {
  return (
    <section className="py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {DIFFERENTIATORS.map((item, i) => (
            <ScrollReveal key={item.label} direction="up" delay={i * 80}>
              <div
                className="heritage-card p-6 h-full"
                style={{ borderLeft: '3px solid var(--bsi-primary)' }}
              >
                <span className="heritage-stamp mb-3 block">{item.label}</span>
                <p
                  className="font-serif text-sm sm:text-base leading-relaxed"
                  style={{ color: 'var(--bsi-bone)' }}
                >
                  {item.body}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
