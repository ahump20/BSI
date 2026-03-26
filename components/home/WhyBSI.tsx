'use client';

import { ScrollReveal } from '@/components/cinematic';

const DIFFERENTIATORS = [
  {
    label: 'Coverage Gap',
    body: 'Mid-majors, Tuesday night games, overlooked programs — BSI covers what gets cut from the national highlight reel.',
  },
  {
    label: 'Live Sabermetrics',
    body: 'Park-adjusted metrics — wOBA, FIP, ERA− — computed every six hours across every D1 program. Free.',
  },
  {
    label: 'Five Sports, One Standard',
    body: 'MLB, NFL, NBA, college football, college baseball. Same rigor, same data infrastructure, same instinct for what the numbers actually mean.',
  },
];

const SPORTS_RAIL = ['College Baseball', 'College Football', 'MLB', 'NFL', 'NBA'];

export function WhyBSI() {
  return (
    <section
      data-home-proof
      className="border-y border-[rgba(245,240,235,0.08)] px-4 py-16 sm:py-20 sm:px-6 lg:px-8"
      style={{ background: 'linear-gradient(180deg, rgba(18,18,18,0.98) 0%, rgba(12,12,12,1) 100%)' }}
    >
      <div className="mx-auto max-w-6xl">
        <ScrollReveal direction="up">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div className="max-w-md">
              <span className="heritage-stamp">Why BSI</span>
              <h2
                className="mt-4 font-display text-3xl font-bold uppercase tracking-[0.05em] sm:text-4xl"
                style={{ color: 'var(--bsi-bone)' }}
              >
                Three Reasons The Homepage Can Talk Fast
              </h2>
            </div>
            <p className="max-w-2xl font-serif text-base leading-relaxed sm:text-lg" style={{ color: 'var(--bsi-dust)' }}>
              BSI is built for the overlooked middle of the sports map: the games, rosters, and programs fans actually care about but the national cycle keeps flattening.
            </p>
          </div>
        </ScrollReveal>

        <div className="mt-10 grid gap-6 border-t border-[rgba(245,240,235,0.08)] pt-8 md:grid-cols-3 md:gap-0">
          {DIFFERENTIATORS.map((item, i) => (
            <ScrollReveal key={item.label} direction="up" delay={i * 80}>
              <div
                className="h-full px-0 md:px-6"
                style={i === 0 ? undefined : { borderLeft: '1px solid rgba(245,240,235,0.08)' }}
              >
                <span className="heritage-stamp mb-3 block">{item.label}</span>
                <p className="font-serif text-sm leading-relaxed sm:text-base" style={{ color: 'var(--bsi-bone)' }}>
                  {item.body}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal direction="up" delay={220}>
          <div className="mt-10 flex flex-col gap-4 border-t border-[rgba(245,240,235,0.08)] pt-5 lg:flex-row lg:items-center lg:justify-between">
            <p
              className="text-[10px] uppercase tracking-[0.24em] sm:text-xs"
              style={{ color: 'var(--bsi-dust)', fontFamily: 'var(--bsi-font-data)' }}
            >
              Coverage Rail
            </p>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              {SPORTS_RAIL.map((sport, index) => (
                <div key={sport} className="flex items-center gap-3 sm:gap-4">
                  <span className="text-sm font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--bsi-bone)' }}>
                    {sport}
                  </span>
                  {index < SPORTS_RAIL.length - 1 && (
                    <span className="text-[10px]" style={{ color: 'rgba(245,240,235,0.24)' }}>
                      &#9670;
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
