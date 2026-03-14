'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { HeroGlow } from '@/components/ui/HeroGlow';
import { Footer } from '@/components/layout-ds/Footer';
import { ScrollReveal } from '@/components/cinematic';
import { NILDashboardClient } from './NILDashboardClient';

// ── Types ──
interface NILPlayer {
  player_id: string;
  player_name: string;
  team: string;
  conference: string;
  index_score: number;
  performance_score: number | null;
  estimated_low: number;
  estimated_mid: number;
  estimated_high: number;
  nil_tier: string;
}

// ── Helpers ──
function formatValue(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

function tierBadge(tier: string): { text: string; color: string } {
  switch (tier) {
    case 'elite': return { text: 'Elite', color: 'text-burnt-orange' };
    case 'high': return { text: 'High', color: 'text-green-400' };
    case 'mid': return { text: 'Mid', color: 'text-blue-400' };
    case 'emerging': return { text: 'Emerging', color: 'text-yellow-400' };
    default: return { text: 'Dev', color: 'text-text-muted' };
  }
}

// ── SVG Icons ──
const NilDollarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.5}><circle cx="12" cy="12" r="10" /><path d="M12 6v12M9 9.5C9 8.12 10.34 7 12 7s3 1.12 3 2.5S13.66 12 12 12s-3 1.12-3 2.5S10.34 17 12 17s3-1.12 3-2.5" /></svg>
);
const NilChartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.5}><rect x="3" y="3" width="7" height="18" rx="1" /><rect x="14" y="8" width="7" height="13" rx="1" /><path d="M6 7v10M17.5 12v5" /></svg>
);
const NilPortalIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.5}><path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 01-4 4H3" /></svg>
);
const NilTrendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.5}><path d="M3 17l5-5 4 4 9-11" /><path d="M17 5h4v4" /></svg>
);
const NilTargetIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.5}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>
);
const NilGlobeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.5}><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>
);

const NIL_ICONS: Record<string, React.FC> = {
  'Fair Market Value': NilDollarIcon,
  'Program Rankings': NilChartIcon,
  'Transfer Portal Intel': NilPortalIcon,
  'WAR Calculations': NilTrendIcon,
  'Roster Optimization': NilTargetIcon,
  'Market Intelligence': NilGlobeIcon,
};

const features = [
  { title: 'Fair Market Value', description: 'Our proprietary FMNV model calculates what an athlete is actually worth in the NIL marketplace based on performance, exposure, and market demand.' },
  { title: 'Program Rankings', description: 'Total roster NIL value by program. See which schools have built the most valuable collectives and where your program stands.' },
  { title: 'Transfer Portal Intel', description: 'Real-time portal activity with projected NIL values. Identify fits before your competition does.' },
  { title: 'WAR Calculations', description: 'Wins Above Replacement adapted for college athletics. Understand the actual on-field value a player brings to your program.' },
  { title: 'Roster Optimization', description: 'Maximize your NIL budget with data-driven roster construction. Know what positions need investment and where you can find value.' },
  { title: 'Market Intelligence', description: 'Track year-over-year trends, regional variations, and sport-specific dynamics in the NIL marketplace.' },
];

const sportBreakdown = [
  { sport: 'Football', avgValue: '$145K', topValue: '$3.2M', players: '2,400+' },
  { sport: "Men's Basketball", avgValue: '$98K', topValue: '$2.8M', players: '800+' },
  { sport: "Women's Basketball", avgValue: '$72K', topValue: '$1.9M', players: '750+' },
  { sport: 'Baseball', avgValue: '$28K', topValue: '$420K', players: '1,200+' },
];

export default function NILValuationPage() {
  const [leaders, setLeaders] = useState<NILPlayer[]>([]);
  const [totalScored, setTotalScored] = useState(0);

  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    fetch('/api/nil/leaderboard?limit=50')
      .then(r => {
        if (!r.ok) throw new Error(`Leaderboard API returned ${r.status}`);
        return r.json();
      })
      .then((d: { data?: NILPlayer[]; total?: number }) => {
        setLeaders(d.data || []);
        setTotalScored(d.total || 0);
      })
      .catch(() => {
        setFetchError(true);
      });
  }, []);

  const topTen = leaders.slice(0, 10);

  const undervalued = useMemo(() => {
    return leaders
      .filter(p => p.performance_score !== null && p.performance_score !== undefined)
      .map(p => ({ ...p, gap: (p.performance_score ?? 0) - p.index_score }))
      .filter(p => p.gap > 0)
      .sort((a, b) => b.gap - a.gap)
      .slice(0, 3);
  }, [leaders]);

  const conferences = useMemo(() => new Set(leaders.map(p => p.conference)).size, [leaders]);

  return (
    <>
      <div className="min-h-screen bg-background-primary text-text-primary">
        {/* Hero */}
        <Section className="pt-6 pb-12 relative overflow-hidden">
          <HeroGlow />
          <Container>
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="primary" className="mb-4">NIL Intelligence</Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6" style={{ fontFamily: 'Georgia, serif' }}>
                <span className="text-burnt-orange">NIL Valuation</span> Engine
              </h1>
              <p className="text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
                Fair Market Value calculations, transfer portal intelligence, and roster optimization tools for the 2025-26 season. Know what athletes are worth before you make offers.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/nil-valuation/tools">
                  <Button size="lg" className="bg-burnt-orange">Explore Tools</Button>
                </Link>
                <Link href="/nil-valuation/methodology">
                  <Button variant="outline" size="lg">View Methodology</Button>
                </Link>
              </div>
            </div>
          </Container>
        </Section>

      {/* Live Stats Bar */}
      <div className="bg-background-secondary border-y border-border py-8">
        <Container>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <ScrollReveal>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-burnt-orange">
                  {totalScored > 0 ? totalScored : '500+'}
                </div>
                <p className="text-text-tertiary mt-1">Players Scored</p>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-burnt-orange">
                  {conferences > 0 ? conferences : '20+'}
                </div>
                <p className="text-text-tertiary mt-1">Conferences</p>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-burnt-orange">9</div>
                <p className="text-text-tertiary mt-1">Analysis Tools</p>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-burnt-orange">Every 6h</div>
                <p className="text-text-tertiary mt-1">Score Updates</p>
              </div>
            </ScrollReveal>
          </div>
        </Container>
      </div>

      {/* Live Leaderboard + Undervalued Spotlight */}
      {topTen.length > 0 && (
        <Section className="py-16">
          <Container>
            <div className="grid md:grid-cols-3 gap-8">
              {/* Leaderboard — 2/3 width */}
              <div className="md:col-span-2">
                <ScrollReveal>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-text-primary">Top NIL Valuations</h2>
                      <p className="text-sm text-text-muted mt-1">Live from BSI Savant compute</p>
                    </div>
                    <Link href="/nil-valuation/tools">
                      <Button variant="outline" size="sm">All Tools →</Button>
                    </Link>
                  </div>
                </ScrollReveal>
                <ScrollReveal delay={100}>
                  <Card>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border text-text-muted">
                              <th className="text-left p-4 font-medium w-8">#</th>
                              <th className="text-left p-4 font-medium">Player</th>
                              <th className="text-left p-4 font-medium">Team</th>
                              <th className="text-right p-4 font-medium">Index</th>
                              <th className="text-right p-4 font-medium">Est. Value</th>
                              <th className="text-right p-4 font-medium">Tier</th>
                            </tr>
                          </thead>
                          <tbody>
                            {topTen.map((p, i) => {
                              const tb = tierBadge(p.nil_tier);
                              return (
                                <tr key={p.player_id} className="border-b border-border/50 hover:bg-background-secondary transition-colors">
                                  <td className="p-4 text-text-muted font-mono">{i + 1}</td>
                                  <td className="p-4 font-semibold text-text-primary">{p.player_name}</td>
                                  <td className="p-4 text-text-secondary">{p.team}</td>
                                  <td className="p-4 text-right font-bold text-text-primary">{p.index_score}</td>
                                  <td className="p-4 text-right font-bold text-burnt-orange">{formatValue(p.estimated_mid)}</td>
                                  <td className="p-4 text-right">
                                    <span className={`text-xs font-semibold ${tb.color}`}>{tb.text}</span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              </div>

              {/* Undervalued Spotlight — 1/3 width */}
              <div>
                <ScrollReveal delay={200}>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-text-primary">Undervalued</h2>
                    <p className="text-sm text-text-muted mt-1">Performance outpacing market value</p>
                  </div>
                </ScrollReveal>
                <div className="space-y-4">
                  {undervalued.length > 0 ? undervalued.map((p, i) => (
                    <ScrollReveal key={p.player_id} delay={250 + i * 80}>
                      <Card className="border-l-4 border-l-green-500 hover:border-l-burnt-orange transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <span className="text-xs font-bold text-green-400">#{i + 1} Value Gap</span>
                              <h3 className="font-semibold text-text-primary">{p.player_name}</h3>
                              <p className="text-xs text-text-muted">{p.team} · {p.conference}</p>
                            </div>
                            <span className="text-lg font-bold text-green-400">+{p.gap.toFixed(1)}</span>
                          </div>
                          <div className="flex justify-between text-xs mt-3 pt-2 border-t border-border/50">
                            <span className="text-text-muted">Est. Value</span>
                            <span className="font-bold text-burnt-orange">{formatValue(p.estimated_mid)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </ScrollReveal>
                  )) : (
                    <ScrollReveal delay={250}>
                      <Card className="border-l-4 border-l-green-500">
                        <CardContent className="p-6 text-center">
                          <p className="text-sm text-text-muted">Undervalued spotlight appears with Pro access.</p>
                          <Link href="/pricing" className="block mt-3">
                            <Button variant="outline" size="sm">Upgrade</Button>
                          </Link>
                        </CardContent>
                      </Card>
                    </ScrollReveal>
                  )}
                  <ScrollReveal delay={500}>
                    <Link href="/nil-valuation/undervalued" className="block text-center">
                      <Button variant="outline" size="sm" className="w-full">See All Undervalued →</Button>
                    </Link>
                  </ScrollReveal>
                </div>
              </div>
            </div>
          </Container>
        </Section>
      )}

      {/* Features Grid */}
      <Section className="py-20">
        <Container>
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-text-primary mb-4">NIL Intelligence Tools</h2>
              <p className="text-text-tertiary max-w-2xl mx-auto">
                Everything programs and agents need to navigate the NIL landscape with confidence.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = NIL_ICONS[feature.title];
              return (
                <ScrollReveal key={feature.title} delay={index * 100}>
                  <Card className="h-full">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        {Icon && <div className="text-burnt-orange"><Icon /></div>}
                        <h3 className="text-lg font-semibold text-text-primary">{feature.title}</h3>
                      </div>
                      <p className="text-text-tertiary text-sm">{feature.description}</p>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              );
            })}
          </div>
        </Container>
      </Section>

        {/* Charts Section — client component */}
        <NILDashboardClient />

      {/* Sport Breakdown */}
      <Section className="py-20 bg-background-secondary">
        <Container>
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-text-primary mb-4">NIL by Sport</h2>
              <p className="text-text-tertiary max-w-2xl mx-auto">
                How NIL values vary across different sports. Football dominates, but every sport has its market.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {sportBreakdown.map((sport, index) => (
              <ScrollReveal key={sport.sport} delay={index * 100}>
                <Card className="text-center">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-text-primary mb-4">{sport.sport}</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="text-2xl font-bold text-burnt-orange">{sport.avgValue}</div>
                        <div className="text-xs text-text-muted">Average Value</div>
                      </div>
                      <div className="border-t border-border pt-3">
                        <div className="text-lg font-semibold text-text-primary">{sport.topValue}</div>
                        <div className="text-xs text-text-muted">Top Player</div>
                      </div>
                      <div className="border-t border-border pt-3">
                        <div className="text-sm text-text-tertiary">{sport.players} tracked</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>

          <p className="text-center text-xs text-text-muted mt-8">
            Market overview based on public reporting. College baseball NIL scores powered by BSI Savant.
          </p>
        </Container>
      </Section>

      {/* Methodology Section */}
      <Section className="py-20">
        <Container>
          <ScrollReveal>
            <div className="max-w-3xl mx-auto">
              <Card className="border-l-4 border-l-burnt-orange">
                <CardContent className="p-8">
                  <Badge variant="secondary" className="mb-4">Transparency</Badge>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">Our Methodology</h2>
                  <p className="text-text-tertiary mb-6">
                    BSI&apos;s FMNV model combines on-field performance data from our Savant compute
                    pipeline with exposure and market factors to estimate what an athlete&apos;s NIL
                    is worth. Every input is sourced from live data — no fabricated metrics.
                  </p>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-background-secondary rounded-lg">
                      <div className="text-xl font-bold text-text-primary">40%</div>
                      <div className="text-xs text-text-muted">Performance</div>
                      <div className="text-[10px] text-text-muted/50 mt-1">wOBA, wRC+, FIP</div>
                    </div>
                    <div className="text-center p-4 bg-background-secondary rounded-lg">
                      <div className="text-xl font-bold text-text-primary">30%</div>
                      <div className="text-xs text-text-muted">Exposure</div>
                      <div className="text-[10px] text-text-muted/50 mt-1">Conference, Social</div>
                    </div>
                    <div className="text-center p-4 bg-background-secondary rounded-lg">
                      <div className="text-xl font-bold text-text-primary">30%</div>
                      <div className="text-xs text-text-muted">Market</div>
                      <div className="text-[10px] text-text-muted/50 mt-1">Metro, Program</div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link href="/nil-valuation/methodology" className="flex-1">
                      <Button variant="outline" className="w-full">
                        Read Full Methodology →
                      </Button>
                    </Link>
                    <Link href="/nil-valuation/performance-index" className="flex-1">
                      <Button className="w-full bg-burnt-orange">
                        Try the Calculator
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      {/* CTA Section */}
      <Section className="py-20 bg-gradient-to-b from-background-secondary to-background-primary">
        <Container>
          <ScrollReveal>
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{ fontFamily: 'Georgia, serif' }}>
                Ready to Navigate <span className="text-burnt-orange">NIL</span> with Data?
              </h2>
              <p className="text-xl text-text-tertiary mb-8">
                Pro access includes full NIL Valuation tools, transfer portal alerts, and the interactive NIL Explorer on BSI Labs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/pricing">
                  <Button size="lg" className="bg-burnt-orange">Get Pro Access</Button>
                </Link>
                <Link href="/nil-valuation/tools">
                  <Button variant="outline" size="lg">Browse Tools →</Button>
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </Container>
      </Section>
      </div>
      <Footer />
    </>
  );
}
