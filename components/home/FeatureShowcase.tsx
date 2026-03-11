'use client';

import Link from 'next/link';
import { ScrollReveal } from '@/components/cinematic';

interface FeatureItem {
  label: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  hero?: boolean;
}

const FEATURES: FeatureItem[] = [
  {
    label: 'BSI Savant',
    description: 'Find the real best hitters and pitchers using park-adjusted wOBA, wRC+, and FIP across 300+ D1 teams.',
    href: '/college-baseball/savant',
    hero: true,
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 3v18h18" /><path d="M7 16l4-8 4 4 5-9" />
      </svg>
    ),
  },
  {
    label: 'Intelligence',
    description: 'Get AI-generated game briefs and matchup analysis before first pitch — know what to watch for.',
    href: '/intel',
    hero: true,
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="3" /><path d="M12 1v4m0 14v4M4.22 4.22l2.83 2.83m9.9 9.9l2.83 2.83M1 12h4m14 0h4M4.22 19.78l2.83-2.83m9.9-9.9l2.83-2.83" />
      </svg>
    ),
  },
  {
    label: 'Editorial',
    description: 'Read weekend recaps, series previews, and conference deep dives written with real scouting context.',
    href: '/college-baseball/editorial',
    hero: true,
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 4h16v16H4z" /><path d="M8 8h8M8 12h5" />
      </svg>
    ),
  },
  {
    label: 'Transfer Portal',
    description: 'See who entered the portal, where they landed, and what it means for your team.',
    href: '/college-baseball/transfer-portal',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M16 3h5v5M14 10l7-7M8 21H3v-5M10 14l-7 7" />
      </svg>
    ),
  },
  {
    label: 'NIL Valuation',
    description: 'Check what players are worth in the NIL market — data-driven valuations.',
    href: '/nil-valuation',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
  },
  {
    label: 'Models',
    description: 'Run win probability simulations and see how games are likely to unfold.',
    href: '/models',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    label: 'Arcade',
    description: 'Play college baseball games in the browser. Pick your team, step up to the plate.',
    href: 'https://arcade.blazesportsintel.com',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="6" width="20" height="12" rx="2" /><path d="M6 12h4m-2-2v4M15 11h.01M18 13h.01" />
      </svg>
    ),
  },
];

export function FeatureShowcase() {
  const heroFeatures = FEATURES.filter(f => f.hero);
  const compactFeatures = FEATURES.filter(f => !f.hero);

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 relative surface-deep accent-glow-warm-right">
      <div className="max-w-6xl mx-auto relative z-10">
        <ScrollReveal direction="up">
          <span className="heritage-stamp mb-2">Platform</span>
          <div className="flex items-center gap-3 mt-2 mb-8">
            <div className="section-rule-thick" />
            <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide" style={{ color: 'var(--bsi-bone)' }}>
              What You Can Do Here
            </h2>
          </div>
        </ScrollReveal>

        {/* Hero tier — 3 crown jewels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {heroFeatures.map((feat, idx) => (
            <ScrollReveal key={feat.label} direction="up" delay={idx * 80}>
              <Link href={feat.href} className="group block h-full">
                <div
                  className="heritage-card relative p-6 h-full flex flex-col transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                  style={{ borderTop: '2px solid var(--bsi-primary)' }}
                >
                  {/* Icon background watermark */}
                  <div className="absolute top-3 right-3 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity duration-300" aria-hidden="true">
                    <div className="w-20 h-20" style={{ color: 'var(--bsi-primary)' }}>
                      {feat.icon}
                    </div>
                  </div>
                  {/* Hover glow */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                      border: '1px solid rgba(191, 87, 0, 0.35)',
                      borderRadius: '2px',
                      boxShadow: 'inset 0 1px 0 rgba(191, 87, 0, 0.1), 0 0 24px rgba(191, 87, 0, 0.06)',
                    }}
                    aria-hidden="true"
                  />
                  <div className="mb-4 transition-colors" style={{ color: 'var(--bsi-primary)' }}>
                    {feat.icon}
                  </div>
                  <h3 className="text-base font-semibold uppercase tracking-wider mb-2 transition-colors" style={{ fontFamily: 'var(--bsi-font-data)', color: 'var(--bsi-bone)' }}>
                    {feat.label}
                  </h3>
                  <p className="text-sm leading-relaxed font-serif flex-1" style={{ color: 'var(--bsi-dust)' }}>
                    {feat.description}
                  </p>
                  <span className="mt-4 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 group-hover:gap-3 transition-all" style={{ color: 'var(--bsi-primary)' }}>
                    Explore &rarr;
                  </span>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>

        {/* Compact tier — remaining tools */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {compactFeatures.map((feat, idx) => {
            const isExternal = feat.href.startsWith('http');
            const Tag = isExternal ? 'a' : Link;
            const extra = isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {};
            return (
              <ScrollReveal key={feat.label} direction="up" delay={idx * 60}>
                <Tag
                  href={feat.href}
                  {...extra}
                  className="group heritage-card flex items-start gap-3 p-4 hover:border-[rgba(191,87,0,0.4)] transition-all duration-300"
                >
                  <div className="mt-0.5 shrink-0 transition-colors" style={{ color: 'var(--bsi-dust)' }}>
                    {feat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold uppercase tracking-wider transition-colors" style={{ fontFamily: 'var(--bsi-font-data)', color: 'var(--bsi-bone)' }}>
                        {feat.label}
                      </span>
                      {isExternal && (
                        <span className="text-[9px] opacity-40" style={{ color: 'var(--bsi-dust)' }}>{'\u2197'}</span>
                      )}
                    </div>
                    <p className="text-xs leading-relaxed font-serif" style={{ color: 'var(--bsi-dust)' }}>
                      {feat.description}
                    </p>
                  </div>
                  <span className="shrink-0 mt-1 transition-colors" style={{ color: 'rgba(191, 87, 0, 0.3)' }}>
                    &rarr;
                  </span>
                </Tag>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
