'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';

// ── SVG Feature Icons ──
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
  {
    title: 'Fair Market Value',
    description:
      'Our proprietary FMNV model calculates what an athlete is actually worth in the NIL marketplace based on performance, exposure, and market demand.',
  },
  {
    title: 'Program Rankings',
    description:
      'Total roster NIL value by program. See which schools have built the most valuable collectives and where your program stands.',
  },
  {
    title: 'Transfer Portal Intel',
    description:
      'Real-time portal activity with projected NIL values. Identify fits before your competition does.',
  },
  {
    title: 'WAR Calculations',
    description:
      'Wins Above Replacement adapted for college athletics. Understand the actual on-field value a player brings to your program.',
  },
  {
    title: 'Roster Optimization',
    description:
      'Maximize your NIL budget with data-driven roster construction. Know what positions need investment and where you can find value.',
  },
  {
    title: 'Market Intelligence',
    description:
      'Track year-over-year trends, regional variations, and sport-specific dynamics in the NIL marketplace.',
  },
];

const topPrograms = [
  { rank: 1, name: 'Texas', conference: 'SEC', value: '$28.4M', change: '+12%' },
  { rank: 2, name: 'Ohio State', conference: 'Big Ten', value: '$26.1M', change: '+8%' },
  { rank: 3, name: 'Georgia', conference: 'SEC', value: '$24.8M', change: '+15%' },
  { rank: 4, name: 'Alabama', conference: 'SEC', value: '$23.2M', change: '+5%' },
  { rank: 5, name: 'Oregon', conference: 'Big Ten', value: '$21.7M', change: '+22%' },
];

const sportBreakdown = [
  { sport: 'Football', avgValue: '$145K', topValue: '$3.2M', players: '2,400+' },
  { sport: "Men's Basketball", avgValue: '$98K', topValue: '$2.8M', players: '800+' },
  { sport: "Women's Basketball", avgValue: '$72K', topValue: '$1.9M', players: '750+' },
  { sport: 'Baseball', avgValue: '$28K', topValue: '$420K', players: '1,200+' },
];

export default function NILValuationPage() {
  return (
    <div className="min-h-screen bg-background-primary text-text-primary">
      {/* Hero Section */}
      <Section className="pt-6 pb-16 bg-gradient-to-b from-background-secondary to-background-primary">
        <Container>
          <ScrollReveal>
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="primary" className="mb-4">
                NIL Intelligence
              </Badge>
              <h1
                className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                <span className="text-burnt-orange">NIL Valuation</span> Engine
              </h1>
              <p className="text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
                Fair Market Value calculations, transfer portal intelligence, and roster
                optimization tools for the 2025-26 season. Know what athletes are worth before you
                make offers.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/pricing">
                  <Button size="lg" className="bg-burnt-orange">
                    Get Enterprise Access
                  </Button>
                </Link>
                <Link href="/nil-valuation/methodology">
                  <Button variant="outline" size="lg">
                    View Methodology
                  </Button>
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      {/* Stats Bar */}
      <div className="bg-background-secondary border-y border-border py-8">
        <Container>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <ScrollReveal>
              <div>
                <div
                  className="text-3xl md:text-4xl font-bold text-burnt-orange"
                >
                  $2.4B
                </div>
                <p className="text-text-tertiary mt-1">Total NIL Market</p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <div>
                <div
                  className="text-3xl md:text-4xl font-bold text-burnt-orange"
                >
                  5,200+
                </div>
                <p className="text-text-tertiary mt-1">Athletes Tracked</p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <div>
                <div
                  className="text-3xl md:text-4xl font-bold text-burnt-orange"
                >
                  134
                </div>
                <p className="text-text-tertiary mt-1">FBS Programs</p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={300}>
              <div>
                <div
                  className="text-3xl md:text-4xl font-bold text-burnt-orange"
                >
                  Daily
                </div>
                <p className="text-text-tertiary mt-1">Value Updates</p>
              </div>
            </ScrollReveal>
          </div>
        </Container>
      </div>

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
            {features.map((feature, index) => (
              <ScrollReveal key={feature.title} delay={index * 100}>
                <Card className="h-full">
                  <CardContent className="p-6">
                    <span className="text-text-secondary mb-4 block">
                      {(() => { const Icon = NIL_ICONS[feature.title]; return Icon ? <Icon /> : null; })()}
                    </span>
                    <h3 className="text-lg font-semibold text-text-primary mb-2">{feature.title}</h3>
                    <p className="text-text-tertiary text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Top Programs Preview */}
      <Section className="py-20 bg-background-secondary">
        <Container>
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <ScrollReveal>
              <div>
                <Badge variant="secondary" className="mb-4">
                  Program Rankings
                </Badge>
                <h2 className="text-3xl font-bold text-text-primary mb-4">Top 5 NIL Programs</h2>
                <p className="text-text-tertiary mb-6">
                  Total roster NIL value by program. Updated daily from verified market data and
                  collective spending reports.
                </p>
                <Link href="/pricing">
                  <Button variant="outline">See Full Rankings →</Button>
                </Link>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {topPrograms.map((program) => (
                      <div
                        key={program.name}
                        className="flex items-center justify-between p-4 hover:bg-surface-light transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <span
                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-burnt-orange"
                          >
                            {program.rank}
                          </span>
                          <div>
                            <div className="font-semibold text-text-primary">{program.name}</div>
                            <div className="text-sm text-text-muted">{program.conference}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-text-primary">{program.value}</div>
                          <div className="text-sm text-success">{program.change}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>
        </Container>
      </Section>

      {/* Sport Breakdown */}
      <Section className="py-20">
        <Container>
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-text-primary mb-4">NIL by Sport</h2>
              <p className="text-text-tertiary max-w-2xl mx-auto">
                How NIL values vary across different sports. Football dominates, but every sport has
                its market.
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
                        <div className="text-2xl font-bold text-burnt-orange">
                          {sport.avgValue}
                        </div>
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
            Illustrative estimates based on public reporting. Live NIL analytics tools are in active development.
          </p>
        </Container>
      </Section>

      {/* Methodology Section */}
      <Section className="py-20 bg-background-secondary">
        <Container>
          <ScrollReveal>
            <div className="max-w-3xl mx-auto">
              <Card className="border-l-4 border-l-burnt-orange">
                <CardContent className="p-8">
                  <Badge variant="secondary" className="mb-4">
                    Transparency
                  </Badge>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">Our Methodology</h2>
                  <p className="text-text-tertiary mb-6">
                    We believe in full transparency. Our Fair Market NIL Value (FMNV) model combines
                    on-field performance metrics, social media reach, market exposure, and verified
                    deal data to calculate athlete valuations.
                  </p>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-background-primary rounded-lg">
                      <div className="text-xl font-bold text-text-primary">40%</div>
                      <div className="text-xs text-text-muted">Performance</div>
                    </div>
                    <div className="text-center p-4 bg-background-primary rounded-lg">
                      <div className="text-xl font-bold text-text-primary">30%</div>
                      <div className="text-xs text-text-muted">Exposure</div>
                    </div>
                    <div className="text-center p-4 bg-background-primary rounded-lg">
                      <div className="text-xl font-bold text-text-primary">30%</div>
                      <div className="text-xs text-text-muted">Market</div>
                    </div>
                  </div>
                  <Link href="/nil-valuation/methodology">
                    <Button variant="outline" className="w-full">
                      Read Full Methodology →
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      {/* CTA Section */}
      <Section className="py-20 bg-gradient-to-b from-background-primary to-background-secondary">
        <Container>
          <ScrollReveal>
            <div className="max-w-2xl mx-auto text-center">
              <h2
                className="text-3xl md:text-4xl font-bold mb-6"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                Ready to Navigate <span className="text-burnt-orange">NIL</span> with Data?
              </h2>
              <p className="text-xl text-text-tertiary mb-8">
                Enterprise access includes full NIL Valuation tools, transfer portal alerts, and API
                integration for your scouting systems.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/pricing">
                  <Button size="lg" className="bg-burnt-orange">
                    Get Enterprise Access
                  </Button>
                </Link>
                <Link href="mailto:Austin@blazesportsintel.com?subject=NIL%20Valuation%20Demo">
                  <Button variant="outline" size="lg">
                    Schedule Demo
                  </Button>
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      <Footer />
    </div>
  );
}
