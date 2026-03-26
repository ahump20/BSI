'use client';

import Link from 'next/link';
import { ScrollReveal } from '@/components/cinematic';
import { AskBSI } from './AskBSI';

const SUPPORT_RAIL = [
  {
    label: 'Transfer Portal',
    href: '/college-baseball/transfer-portal',
    description: 'Track movement, fit, and roster pressure as players change the league.',
  },
  {
    label: 'NIL Valuation',
    href: '/nil-valuation',
    description: 'See where market leverage, performance, and visibility meet in one board.',
  },
  {
    label: 'Models',
    href: '/models',
    description: 'Move from static numbers to scenario thinking before the game starts.',
  },
];

export function FeatureShowcase() {
  return (
    <section
      data-home-platform
      className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8"
      style={{ background: 'linear-gradient(180deg, rgba(14,14,14,1) 0%, rgba(18,16,14,1) 100%)' }}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(191,87,0,0.18)] to-transparent" />
      <div className="max-w-6xl mx-auto relative z-10">
        <ScrollReveal direction="up">
          <span className="heritage-stamp mb-4">Platform</span>
          <div className="flex items-center gap-3 mt-4 mb-8">
            <div className="section-rule-thick" />
            <h2 className="font-display text-3xl sm:text-4xl font-bold uppercase tracking-[0.05em]" style={{ color: 'var(--bsi-bone)' }}>
              One Platform, Four Ways In
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <ScrollReveal direction="up" delay={80}>
            <div className="heritage-card overflow-hidden p-6 sm:p-8" style={{ borderTop: '2px solid var(--bsi-primary)' }}>
              <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em]" style={{ color: 'var(--bsi-primary)', fontFamily: 'var(--bsi-font-data)' }}>
                    Core Entry Points
                  </p>
                  <h3 className="mt-3 font-display text-2xl font-bold uppercase tracking-[0.06em]" style={{ color: 'var(--bsi-bone)' }}>
                    Savant And Intelligence Carry The Front Door
                  </h3>
                  <p className="mt-4 font-serif text-sm leading-relaxed sm:text-base" style={{ color: 'var(--bsi-dust)' }}>
                    Savant tells you who is actually producing. Intelligence tells you what the matchup means before first pitch.
                    Together they turn a scoreboard visit into a scouting pass.
                  </p>

                  <div className="mt-8 space-y-5">
                    <Link href="/college-baseball/savant" className="group block border-t border-[rgba(245,240,235,0.1)] pt-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--bsi-primary)', fontFamily: 'var(--bsi-font-data)' }}>
                            BSI Savant
                          </p>
                          <p className="mt-2 font-serif text-sm leading-relaxed sm:text-base" style={{ color: 'var(--bsi-bone)' }}>
                            Park-adjusted batting and pitching leaderboards, conference strength, and venue context.
                          </p>
                        </div>
                        <span className="mt-1 text-sm font-semibold uppercase tracking-[0.16em] transition-transform duration-300 group-hover:translate-x-1" style={{ color: 'var(--heritage-columbia-blue)' }}>
                          Open
                        </span>
                      </div>
                    </Link>

                    <Link href="/intel" className="group block border-t border-[rgba(245,240,235,0.1)] pt-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--bsi-primary)', fontFamily: 'var(--bsi-font-data)' }}>
                            Intelligence
                          </p>
                          <p className="mt-2 font-serif text-sm leading-relaxed sm:text-base" style={{ color: 'var(--bsi-bone)' }}>
                            Briefs, editorial, and matchup framing that keep the data tied to baseball decisions.
                          </p>
                        </div>
                        <span className="mt-1 text-sm font-semibold uppercase tracking-[0.16em] transition-transform duration-300 group-hover:translate-x-1" style={{ color: 'var(--heritage-columbia-blue)' }}>
                          Read
                        </span>
                      </div>
                    </Link>
                  </div>
                </div>

                <div className="border-t border-[rgba(245,240,235,0.1)] pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                  <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--bsi-dust)', fontFamily: 'var(--bsi-font-data)' }}>
                    Operating Thesis
                  </p>
                  <p className="mt-3 font-serif text-lg leading-relaxed italic" style={{ color: 'var(--bsi-bone)' }}>
                    The numbers are useful only if they hold up once the game starts moving.
                  </p>
                  <div className="mt-6 space-y-3">
                    {[
                      'Live boards stay visible during the game.',
                      'Analytic surfaces stay source-tagged and timestamped.',
                      'The same platform reaches from scoreboard to scouting context.',
                    ].map((item) => (
                      <div key={item} className="flex gap-3">
                        <span className="mt-1 text-[11px]" style={{ color: 'var(--bsi-primary)' }}>
                          &#9670;
                        </span>
                        <p className="font-serif text-sm leading-relaxed" style={{ color: 'var(--bsi-dust)' }}>
                          {item}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={140}>
            <AskBSI embedded />
          </ScrollReveal>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {SUPPORT_RAIL.map((item, index) => (
            <ScrollReveal key={item.label} direction="up" delay={180 + index * 60}>
              <Link href={item.href} className="group block border-t border-[rgba(245,240,235,0.1)] py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--bsi-primary)', fontFamily: 'var(--bsi-font-data)' }}>
                      {item.label}
                    </p>
                    <p className="mt-2 font-serif text-sm leading-relaxed" style={{ color: 'var(--bsi-bone)' }}>
                      {item.description}
                    </p>
                  </div>
                  <span className="mt-1 text-sm font-semibold uppercase tracking-[0.16em] transition-transform duration-300 group-hover:translate-x-1" style={{ color: 'var(--heritage-columbia-blue)' }}>
                    &rarr;
                  </span>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
