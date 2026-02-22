'use client';

import Link from 'next/link';
import { ScrollReveal } from '@/components/cinematic';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Badge } from '@/components/ui/Badge';
import { DataFreshnessIndicator } from '@/components/ui/DataFreshnessIndicator';

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
    <Section padding="lg" className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/15 via-transparent to-transparent pointer-events-none" />
      <Container center>
        <ScrollReveal direction="up">
          <Badge variant="success" className="mb-4">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2" />
            NCAA Division I Baseball
          </Badge>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={100}>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-center uppercase tracking-wide mb-4">
            NCAA Division I <span className="text-gradient-blaze">Baseball</span>
          </h1>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={120}>
          <DataFreshnessIndicator
            lastUpdated={lastUpdated ? new Date(lastUpdated) : undefined}
            source={dataSource}
            refreshInterval={30}
          />
        </ScrollReveal>
        <ScrollReveal direction="up" delay={150}>
          <p className="text-[#C9A227] font-semibold text-lg tracking-wide text-center mb-6">
            Coverage this sport has always deserved.
          </p>
        </ScrollReveal>

        {/* Hub Search */}
        <ScrollReveal direction="up" delay={200}>
          <div className="relative max-w-lg mx-auto">
            <div className="relative">
              <svg viewBox="0 0 24 24" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { onSearchChange(e.target.value); onSearchOpen(true); }}
                onFocus={() => onSearchOpen(true)}
                onBlur={() => setTimeout(() => onSearchOpen(false), 200)}
                placeholder="Search teams, players, articles..."
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-burnt-orange/50 focus:bg-white/8 transition-colors"
              />
            </div>
            {searchOpen && hasResults && (
              <div className="absolute z-50 mt-1 w-full bg-charcoal border border-white/10 rounded-xl shadow-xl overflow-hidden max-h-80 overflow-y-auto">
                {Array.from(groupedSearchResults.entries()).map(([category, items]) => (
                  <div key={category}>
                    <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/30 bg-white/5">{category}</div>
                    {items.map((item) => (
                      <Link key={item.href} href={item.href} className="block px-3 py-2 text-sm text-white/80 hover:bg-burnt-orange/15 hover:text-white transition-colors">
                        {item.name}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* Stats Bar */}
        <ScrollReveal direction="up" delay={250}>
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-white/5 border border-white/10 rounded-2xl">
            <div className="text-center p-4">
              <div className="font-display text-3xl font-bold text-burnt-orange">300+</div>
              <div className="text-xs uppercase tracking-wider text-white/40 mt-1">Division I Teams</div>
            </div>
            <div className="text-center p-4">
              <div className="font-display text-3xl font-bold text-burnt-orange">32</div>
              <div className="text-xs uppercase tracking-wider text-white/40 mt-1">Conferences</div>
            </div>
            <div className="text-center p-4">
              <div className="font-display text-3xl font-bold text-burnt-orange">Live</div>
              <div className="text-xs uppercase tracking-wider text-white/40 mt-1">Real-Time Scores</div>
            </div>
            <div className="text-center p-4">
              <div className="font-display text-3xl font-bold text-burnt-orange">RPI</div>
              <div className="text-xs uppercase tracking-wider text-white/40 mt-1">Advanced Data</div>
            </div>
          </div>
        </ScrollReveal>
      </Container>
    </Section>
  );
}
