'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { TabBar, TabPanel } from '@/components/ui/TabBar';
import { Card, CardContent } from '@/components/ui/Card';
import { WBCHero } from './WBCHero';
import { PowerRankingsTable } from './PowerRankingsTable';
import { PoolGrid } from './PoolGrid';
import { TournamentBracket } from './TournamentBracket';
import { EdgeBotPanel } from './EdgeBotPanel';

type WBCTab = 'rankings' | 'pools' | 'bracket' | 'intelligence';

const wbcFeatures = [
  {
    id: 'rankings' as WBCTab,
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-burnt-orange fill-none stroke-[1.5]">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    title: 'Power Rankings',
    description: '20-team probability model with advancement odds built from 200K simulations.',
    badge: 'BSI Model',
  },
  {
    id: 'pools' as WBCTab,
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-burnt-orange fill-none stroke-[1.5]">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="12" y1="3" x2="12" y2="21" />
        <line x1="3" y1="12" x2="21" y2="12" />
      </svg>
    ),
    title: 'Pool Previews',
    description: 'All four pools with team breakdowns, danger ratings, and advancement scenarios.',
    badge: 'Pool of Death',
  },
  {
    id: 'bracket' as WBCTab,
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-burnt-orange fill-none stroke-[1.5]">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    title: 'Bracket',
    description: 'Quarterfinal crossover routing, Miami bracket structure, and championship path.',
    badge: 'Mar 13–17',
  },
  {
    id: 'intelligence' as WBCTab,
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-burnt-orange fill-none stroke-[1.5]">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
    ),
    title: 'EdgeBot Intelligence',
    description: 'Single-game analysis powered by EdgeBot v3 — win probability, adjustments, bankroll signal.',
    badge: 'EdgeBot v3',
  },
];

const tabs: { id: WBCTab; label: string }[] = [
  { id: 'rankings', label: 'Rankings' },
  { id: 'pools', label: 'Pools' },
  { id: 'bracket', label: 'Bracket' },
  { id: 'intelligence', label: 'Intelligence' },
];

export function WBCPageClient() {
  const [activeTab, setActiveTab] = useState<WBCTab>('rankings');

  return (
    <div className="bsi-theme-baseball">
      {/* Archive Banner */}
      <div className="bg-surface-press-box border-b border-burnt-orange/30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <span className="text-burnt-orange font-display text-sm uppercase tracking-wider">Archived</span>
          <span className="text-bsi-dust text-sm">
            The 2026 World Baseball Classic concluded March 17. Results and analysis below are final.
          </span>
        </div>
      </div>

      {/* Hero */}
      <WBCHero />

      {/* Feature Cards */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-charcoal border-t border-border-subtle">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-10">
              <span className="kicker">2026 World Baseball Classic</span>
              <h2 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display mt-2">
                Full Tournament <span className="text-gradient-blaze">Coverage</span>
              </h2>
              <p className="text-text-secondary mt-4 max-w-xl mx-auto">
                Power rankings, pool breakdowns, bracket math, and betting intelligence — one place.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {wbcFeatures.map((feature, index) => (
              <ScrollReveal key={feature.id} delay={index * 80}>
                <button
                  onClick={() => {
                    setActiveTab(feature.id);
                    document.getElementById('wbc-tabs')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="group block text-left w-full"
                >
                  <Card variant="hover" padding="lg" className="h-full relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-burnt-orange to-ember opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="w-12 h-12 mb-4 bg-burnt-orange/15 rounded-sm flex items-center justify-center">
                      {feature.icon}
                    </div>
                    <h3 className="text-base font-semibold text-text-primary mb-2">{feature.title}</h3>
                    <p className="text-text-tertiary text-sm leading-relaxed mb-4">{feature.description}</p>

                    <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
                      <span className="text-xs font-semibold text-text-muted bg-surface-light px-2 py-0.5 rounded-sm">
                        {feature.badge}
                      </span>
                      <span className="text-burnt-orange text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                        View
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </Card>
                </button>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section
        id="wbc-tabs"
        className="py-12 px-4 sm:px-6 lg:px-8 bg-charcoal border-t border-border-subtle"
      >
        <div className="max-w-7xl mx-auto">
          <TabBar
            tabs={tabs}
            active={activeTab}
            onChange={(id) => setActiveTab(id as WBCTab)}
            size="sm"
          />

          <TabPanel id="rankings" activeTab={activeTab}>
            <Card variant="default" padding="lg">
              <CardContent>
                <PowerRankingsTable />
              </CardContent>
            </Card>
          </TabPanel>

          <TabPanel id="pools" activeTab={activeTab}>
            <Card variant="default" padding="lg">
              <CardContent>
                <PoolGrid />
              </CardContent>
            </Card>
          </TabPanel>

          <TabPanel id="bracket" activeTab={activeTab}>
            <Card variant="default" padding="lg">
              <CardContent>
                <TournamentBracket />
              </CardContent>
            </Card>
          </TabPanel>

          <TabPanel id="intelligence" activeTab={activeTab}>
            <Card variant="default" padding="lg">
              <CardContent>
                <EdgeBotPanel />
              </CardContent>
            </Card>
          </TabPanel>
        </div>
      </section>

      {/* Tournament context */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-midnight border-t border-border-subtle">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="p-5 rounded-sm border border-border-subtle bg-surface-light/5">
              <div className="text-burnt-orange font-semibold text-sm mb-2">Pool of Death</div>
              <p className="text-text-secondary text-sm leading-relaxed">
                Dominican Republic, Venezuela, and Puerto Rico combine for 37% of championship probability in the BSI model. All three play Pool D Miami. One doesn&apos;t make the quarterfinals.
              </p>
            </div>
            <div className="p-5 rounded-sm border border-border-subtle bg-surface-light/5">
              <div className="text-burnt-orange font-semibold text-sm mb-2">Japan&apos;s Edge</div>
              <p className="text-text-secondary text-sm leading-relaxed">
                Defending champions, deepest pitching staff, Ohtani available. Japan reaches the final in 55% of BSI simulations. The question is whether they spend ace arms in Tokyo or save them for Miami.
              </p>
            </div>
            <div className="p-5 rounded-sm border border-border-subtle bg-surface-light/5">
              <div className="text-burnt-orange font-semibold text-sm mb-2">USA&apos;s Ceiling</div>
              <p className="text-text-secondary text-sm leading-relaxed">
                USA gets Pool B Houston — easiest draw of any Tier 1 team. Their 40% Final% vs 15% Championship% reveals the pattern: they reach the final, they don&apos;t finish it. Bullpen management is the recurring problem.
              </p>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/college-baseball"
              className="inline-flex items-center gap-2 text-burnt-orange font-semibold hover:text-ember transition-colors"
            >
              Also covering: D1 College Baseball — Savant metrics, live scores, 330 programs
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
