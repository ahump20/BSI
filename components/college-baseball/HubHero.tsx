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
}: HubHeroProps) {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at 50% 20%, rgba(191, 87, 0, 0.06) 0%, transparent 60%), var(--surface-scoreboard)',
        padding: 'clamp(2rem, 5vw, 4rem) 0 clamp(1.5rem, 3vw, 2rem)',
      }}
    >
      {/* Subtle bottom border */}
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

        {/* Hub Search */}
        <ScrollReveal direction="up" delay={200}>
          <div className="relative max-w-lg mx-auto">
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
                className="w-full pl-10 pr-4 py-2.5 text-sm transition-colors"
                style={{
                  background: 'var(--surface-dugout)',
                  border: '1px solid var(--border-vintage)',
                  color: 'var(--bsi-bone)',
                  fontFamily: 'var(--bsi-font-data)',
                }}
              />
            </div>
            {searchOpen && hasResults && (
              <div
                className="absolute z-50 mt-1 w-full shadow-xl overflow-hidden max-h-80 overflow-y-auto"
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
          </div>
        </ScrollReveal>

        {/* Metric stats bar */}
        <ScrollReveal direction="up" delay={180}>
          <div className="mt-6 flex flex-wrap justify-center gap-x-0 gap-y-3 max-w-3xl mx-auto">
            {[
              { abbr: 'wOBA', label: 'Hitting quality, park-adjusted' },
              { abbr: 'wRC+', label: 'Runs above average, scaled to 100' },
              { abbr: 'FIP', label: 'What a pitcher actually controls' },
              { abbr: 'PF', label: 'How the ballpark shifts the numbers' },
            ].map((metric, i) => (
              <div
                key={metric.abbr}
                className="flex items-center gap-3 px-5 py-3"
                style={i < 3 ? { borderRight: '1px solid rgba(140,98,57,0.15)' } : undefined}
              >
                <span className="font-bold text-sm tracking-wide" style={{ fontFamily: 'var(--bsi-font-data)', color: 'var(--bsi-primary)' }}>
                  {metric.abbr}
                </span>
                <span className="text-xs leading-tight max-w-[140px]" style={{ color: 'var(--bsi-dust)' }}>
                  {metric.label}
                </span>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Labs Portal CTA */}
        <ScrollReveal direction="up" delay={200}>
          <div className="mt-4 text-center">
            <a
              href="https://labs.blazesportsintel.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-heritage inline-flex items-center gap-2 px-5 py-2.5 text-sm group"
            >
              <span className="uppercase tracking-wider font-semibold" style={{ fontFamily: 'var(--bsi-font-display)' }}>BSI Labs Portal</span>
              <span className="text-xs" style={{ color: 'var(--bsi-dust)' }}>Sabermetrics · Leaderboards · Compare</span>
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
