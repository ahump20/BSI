'use client';

import Link from 'next/link';
import { ScrollReveal } from '@/components/cinematic';

interface HubHeroProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchOpen: boolean;
  onSearchOpen: (open: boolean) => void;
  groupedSearchResults: Map<string, Array<{ name: string; href: string }>>;
  hasResults: boolean;
  lastUpdated: string;
  dataSource: string;
  coverageCount: number;
  conferenceCount: number;
  rankingsCount: number;
}

export function HubHero({
  searchQuery,
  onSearchChange,
  searchOpen,
  onSearchOpen,
  groupedSearchResults,
  hasResults,
  lastUpdated,
  dataSource,
  coverageCount,
  conferenceCount,
  rankingsCount,
}: HubHeroProps) {
  const proofCards = [
    {
      label: 'Programs Tracked',
      value: `${coverageCount}+`,
      detail: 'Every D1 roster lives inside the same board.',
    },
    {
      label: 'Conference Reach',
      value: `${conferenceCount}`,
      detail: 'From the SEC to the one-bid race nobody else is watching.',
    },
    {
      label: 'Top Board',
      value: `${rankingsCount}`,
      detail: 'Rankings, schedule, standings, and player search in one lane.',
    },
  ];

  const metricCards = [
    { abbr: 'wOBA', label: 'Hitting quality, park-adjusted' },
    { abbr: 'wRC+', label: 'Runs above average, scaled to 100' },
    { abbr: 'FIP', label: 'What a pitcher actually controls' },
    { abbr: 'PF', label: 'How the ballpark shifts the numbers' },
  ];

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: 'var(--surface-scoreboard)',
        padding: 'clamp(2rem, 5vw, 4rem) 0 clamp(1.5rem, 3vw, 2rem)',
      }}
    >
      {/* R2 stadium photography */}
      <img
        src="/api/assets/images/blaze-stadium-hero.png"
        alt=""
        aria-hidden="true"
        loading="eager"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ opacity: 0.18 }}
      />

      {/* Gradient: readability + stadium mid-reveal */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(
            to bottom,
            rgba(10,10,10,0.55) 0%,
            rgba(10,10,10,0.3) 30%,
            rgba(10,10,10,0.45) 65%,
            var(--surface-scoreboard) 100%
          )`,
        }}
      />

      {/* Olive-green warmth for baseball identity */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 55% 55% at 50% 30%, rgba(107,142,35,0.08) 0%, transparent 70%)',
        }}
      />

      {/* Grain */}
      <div className="absolute inset-0 pointer-events-none grain-overlay" style={{ opacity: 0.3 }} />

      {/* Bottom border */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[rgba(191,87,0,0.15)] to-transparent" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <ScrollReveal direction="up">
          <span className="heritage-stamp mb-2">NCAA Division I Baseball</span>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={80}>
          <h1
            className="mt-3 font-bold uppercase tracking-tight leading-none mb-2"
            style={{
              fontFamily: 'var(--bsi-font-display-hero)',
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              color: 'var(--bsi-bone)',
              textShadow: '1px 1px 0px rgba(0,0,0,0.5)',
            }}
          >
            College Baseball
          </h1>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={100}>
          <div className="flex justify-center mb-3">
            <div className="section-rule-thick w-12" />
          </div>
        </ScrollReveal>

        {/* Data freshness */}
        {lastUpdated && (
          <ScrollReveal direction="up" delay={110}>
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--bsi-primary)] opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--bsi-primary)]" />
              </span>
              <span className="text-[10px] uppercase tracking-wider" style={{ fontFamily: 'var(--bsi-font-data)', color: 'var(--bsi-dust)' }}>
                Live &middot; {dataSource}
              </span>
            </div>
          </ScrollReveal>
        )}

        <ScrollReveal direction="up" delay={120}>
          <p className="font-serif italic text-base leading-relaxed mb-4" style={{ color: 'var(--bsi-primary)' }}>
            Park-adjusted advanced metrics. Updated every 6 hours. Free.
          </p>
        </ScrollReveal>

        <div className="mt-8 grid gap-4 md:grid-cols-[minmax(0,1.35fr)_minmax(0,0.9fr)] md:items-start">
          {/* Hub Search + metric language */}
          <ScrollReveal direction="up" delay={200}>
            <div
              className="relative rounded-sm border p-4 text-left"
              style={{
                background:
                  'linear-gradient(180deg, rgba(191,87,0,0.08) 0%, rgba(20,20,20,0.94) 100%)',
                borderColor: 'rgba(140,98,57,0.28)',
              }}
            >
              <div className="relative">
                <svg viewBox="0 0 24 24" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--bsi-dust)' }} fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { onSearchChange(e.target.value); onSearchOpen(true); }}
                  onFocus={() => onSearchOpen(true)}
                  onBlur={() => setTimeout(() => onSearchOpen(false), 200)}
                  placeholder="Search teams, players, articles..."
                  aria-label="Search teams, players, and articles"
                  className="w-full pl-10 pr-4 py-3 text-sm transition-colors"
                  style={{
                    background: 'var(--surface-dugout)',
                    border: '1px solid var(--border-vintage)',
                    color: 'var(--bsi-bone)',
                    fontFamily: 'var(--bsi-font-data)',
                  }}
                />
              </div>
              <p className="mt-3 text-xs leading-relaxed" style={{ color: 'var(--bsi-dust)' }}>
                Jump straight to a team page, player table, or editorial file instead of hunting through tabs.
              </p>
              {searchOpen && hasResults && (
                <div
                  className="absolute z-50 mt-1 w-full max-h-80 overflow-y-auto overflow-hidden shadow-xl"
                  style={{ background: 'var(--surface-dugout)', border: '1px solid var(--border-vintage)' }}
                >
                  {Array.from(groupedSearchResults.entries()).map(([category, items]) => (
                    <div key={category}>
                      <div
                        className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest"
                        style={{ color: 'var(--bsi-dust)', background: 'var(--surface-press-box)', fontFamily: 'var(--bsi-font-data)' }}
                      >
                        {category}
                      </div>
                      {items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="block px-3 py-2 text-sm transition-colors hover:bg-[rgba(191,87,0,0.1)]"
                          style={{ color: 'var(--bsi-bone)' }}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {metricCards.map((metric) => (
                  <div
                    key={metric.abbr}
                    className="rounded-sm border px-4 py-3"
                    style={{
                      borderColor: 'rgba(140,98,57,0.22)',
                      background: 'rgba(10,10,10,0.44)',
                    }}
                  >
                    <span className="font-bold text-sm tracking-wide" style={{ fontFamily: 'var(--bsi-font-data)', color: 'var(--bsi-primary)' }}>
                      {metric.abbr}
                    </span>
                    <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--bsi-dust)' }}>
                      {metric.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* Proof cards */}
          <ScrollReveal direction="up" delay={240}>
            <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1">
              {proofCards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-sm border px-4 py-4 text-left"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(191,87,0,0.1) 0%, rgba(16,16,16,0.92) 100%)',
                    borderColor: 'rgba(140,98,57,0.24)',
                  }}
                >
                  <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--bsi-dust)' }}>
                    {card.label}
                  </p>
                  <div
                    className="mt-3 font-bold uppercase leading-none"
                    style={{
                      fontFamily: 'var(--bsi-font-display-hero)',
                      fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
                      color: 'var(--bsi-bone)',
                    }}
                  >
                    {card.value}
                  </div>
                  <p className="mt-3 text-xs leading-relaxed" style={{ color: 'var(--bsi-dust)' }}>
                    {card.detail}
                  </p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>

        <ScrollReveal direction="up" delay={260}>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {[
              { href: '/college-baseball?tab=rankings', label: 'Top 25' },
              { href: '/college-baseball?tab=schedule', label: 'Today’s Schedule' },
              { href: '/college-baseball/players', label: 'Player Leaders' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-2 rounded-sm border px-3 py-2 text-[11px] uppercase tracking-[0.16em] transition-colors hover:bg-[rgba(191,87,0,0.12)]"
                style={{
                  borderColor: 'rgba(140,98,57,0.22)',
                  color: 'var(--bsi-bone)',
                  background: 'rgba(10,10,10,0.28)',
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </ScrollReveal>

        {/* Savant Visuals CTA */}
        <ScrollReveal direction="up" delay={280}>
          <div className="mt-4 text-center">
            <a
              href="/college-baseball/savant/visuals/"
              className="btn-heritage inline-flex items-center gap-2 px-5 py-2.5 text-sm group"
            >
              <span className="uppercase tracking-wider font-semibold" style={{ fontFamily: 'var(--bsi-font-display)' }}>Visualization Tools</span>
              <span className="text-xs" style={{ color: 'var(--bsi-dust)' }}>16 interactive charts · D3 · Live data</span>
              <svg viewBox="0 0 24 24" className="w-4 h-4 opacity-60 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 17L17 7M17 7H7M17 7v10" />
              </svg>
            </a>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
