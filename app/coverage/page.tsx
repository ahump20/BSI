'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/cinematic';
// Navbar is rendered by the root layout — no page-level import needed
import { Footer } from '@/components/layout-ds/Footer';

const colors = {
  burntOrange: '#BF5700',
  texasSoil: '#8B4513',
  ember: '#FF6B35',
  charcoal: '#1A1A1A',
  midnight: '#0D0D0D',
  cream: '#FAF8F5',
  gold: '#C9A227',
};

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'College Baseball', href: '/college-baseball' },
  { label: 'MLB', href: '/mlb' },
  { label: 'NFL', href: '/nfl' },
  { label: 'NBA', href: '/nba' },
  { label: 'About', href: '/about' },
  { label: 'Pricing', href: '/pricing' },
];

const sportsCoverage = [
  {
    name: 'College Baseball',
    icon: '🎓',
    status: 'Full Coverage',
    statusColor: '#22C55E',
    href: '/college-baseball',
    teams: '300+ D1 Programs',
    features: [
      'Live scores (30-second updates)',
      'Complete box scores',
      'Conference standings',
      'National rankings',
      'Player statistics',
      'Transfer portal tracking',
    ],
    sources: ['D1Baseball', 'NCAA Stats', 'ESPN'],
    updateFrequency: 'Real-time during games',
  },
  {
    name: 'MLB',
    icon: '⚾',
    status: 'Full Coverage',
    statusColor: '#22C55E',
    href: '/mlb',
    teams: 'All 30 Teams',
    features: [
      'Live scores and play-by-play',
      'Complete box scores',
      'Division standings',
      'Statcast metrics',
      'Player statistics',
      'Injury reports',
    ],
    sources: ['MLB Stats API', 'Baseball Reference', 'ESPN'],
    updateFrequency: 'Real-time during games',
  },
  {
    name: 'NFL',
    icon: '🏈',
    status: 'Full Coverage',
    statusColor: '#22C55E',
    href: '/nfl',
    teams: 'All 32 Teams',
    features: [
      'Live scores',
      'Team standings',
      'Player statistics',
      'Injury reports',
      'Schedule tracking',
    ],
    sources: ['ESPN API', 'Pro Football Reference'],
    updateFrequency: 'Real-time during games',
  },
  {
    name: 'NBA',
    icon: '🏀',
    status: 'Full Coverage',
    statusColor: '#22C55E',
    href: '/nba',
    teams: 'All 30 Teams',
    features: [
      'Live scores',
      'Conference standings',
      'Player statistics',
      'Schedule tracking',
    ],
    sources: ['ESPN API', 'Basketball Reference'],
    updateFrequency: 'Real-time during games',
  },
  {
    name: 'College Football',
    icon: '🏟️',
    status: 'Coming Soon',
    statusColor: '#F59E0B',
    href: '/cfb',
    teams: '134 FBS Programs',
    features: [
      'Live scores',
      'Conference standings',
      'Rankings',
      'Player statistics',
      'Bowl projections',
    ],
    sources: ['In Development'],
    updateFrequency: 'Q1 2025',
  },
];

const dataSources = [
  {
    name: 'statsapi.mlb.com',
    sport: 'MLB',
    description: 'Official MLB statistics API. Real-time play-by-play, Statcast data, and historical statistics.',
    reliability: '99.9%',
  },
  {
    name: 'D1Baseball',
    sport: 'College Baseball',
    description: 'Comprehensive D1 baseball coverage. Rankings, standings, and player statistics.',
    reliability: '99.5%',
  },
  {
    name: 'ESPN API',
    sport: 'Multiple',
    description: 'Live scores, standings, and schedule data across MLB, NFL, and NBA.',
    reliability: '99.8%',
  },
  {
    name: 'Baseball Reference',
    sport: 'MLB',
    description: 'Historical statistics and advanced metrics. Career data and season splits.',
    reliability: '99.9%',
  },
  {
    name: 'Pro Football Reference',
    sport: 'NFL',
    description: 'Comprehensive NFL statistics. Team and player historical data.',
    reliability: '99.8%',
  },
  {
    name: 'Perfect Game',
    sport: 'Youth Baseball',
    description: 'Amateur and youth baseball prospect rankings and tournament data.',
    reliability: '99.5%',
  },
];

export default function CoveragePage() {
  return (
    <main className="min-h-screen bg-midnight text-cream">
      {/* Navbar provided by root layout */}

      {/* Hero Section */}
      <Section className="pt-32 pb-16 bg-gradient-to-b from-charcoal to-midnight">
        <Container>
          <ScrollReveal>
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="primary" className="mb-4">Data Coverage</Badge>
              <h1
                className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                <span style={{ color: colors.burntOrange }}>Complete Coverage</span> Where It Matters
              </h1>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Real-time data from official sources. MLB, NFL, NBA, and the most comprehensive college baseball coverage anywhere.
              </p>
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      {/* Stats Bar */}
      <div className="bg-charcoal border-y border-white/10 py-8">
        <Container>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <ScrollReveal>
              <div>
                <div className="text-3xl md:text-4xl font-bold" style={{ color: colors.burntOrange }}>392+</div>
                <p className="text-gray-400 mt-1">Teams Tracked</p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <div>
                <div className="text-3xl md:text-4xl font-bold" style={{ color: colors.burntOrange }}>30s</div>
                <p className="text-gray-400 mt-1">Update Frequency</p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <div>
                <div className="text-3xl md:text-4xl font-bold" style={{ color: colors.burntOrange }}>6</div>
                <p className="text-gray-400 mt-1">Data Sources</p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={300}>
              <div>
                <div className="text-3xl md:text-4xl font-bold" style={{ color: colors.burntOrange }}>99.7%</div>
                <p className="text-gray-400 mt-1">Uptime</p>
              </div>
            </ScrollReveal>
          </div>
        </Container>
      </div>

      {/* Sports Coverage */}
      <Section className="py-20">
        <Container>
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">Sports Coverage</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Comprehensive coverage across professional and college sports.
              </p>
            </div>
          </ScrollReveal>

          <div className="space-y-6">
            {sportsCoverage.map((sport, index) => (
              <ScrollReveal key={sport.name} delay={index * 100}>
                <Card className="overflow-hidden">
                  <div className="grid md:grid-cols-4 gap-6 p-6">
                    {/* Sport Header */}
                    <div className="md:col-span-1">
                      <Link href={sport.href} className="group">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-4xl">{sport.icon}</span>
                          <div>
                            <h3 className="text-xl font-semibold text-white group-hover:text-burnt-orange transition-colors">
                              {sport.name}
                            </h3>
                            <Badge
                              variant="secondary"
                              style={{ backgroundColor: `${sport.statusColor}20`, color: sport.statusColor }}
                            >
                              {sport.status}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-gray-400 text-sm">{sport.teams}</p>
                      </Link>
                    </div>

                    {/* Features */}
                    <div className="md:col-span-2">
                      <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">Features</h4>
                      <ul className="grid grid-cols-2 gap-2">
                        {sport.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2 text-gray-300 text-sm">
                            <span className="text-green-500">✓</span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Sources & Frequency */}
                    <div className="md:col-span-1">
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Data Sources</h4>
                        <div className="flex flex-wrap gap-2">
                          {sport.sources.map((source) => (
                            <Badge key={source} variant="secondary" className="text-xs">
                              {source}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-500 uppercase mb-1">Updates</h4>
                        <p className="text-sm" style={{ color: colors.ember }}>{sport.updateFrequency}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Data Sources */}
      <Section className="py-20 bg-charcoal">
        <Container>
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">Our Data Sources</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                We pull from official APIs and trusted sources. Every stat is verified and timestamped.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dataSources.map((source, index) => (
              <ScrollReveal key={source.name} delay={index * 100}>
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="secondary">{source.sport}</Badge>
                      <span className="text-xs text-green-500">{source.reliability} Uptime</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{source.name}</h3>
                    <p className="text-gray-400 text-sm">{source.description}</p>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Data Quality Commitment */}
      <Section className="py-20">
        <Container>
          <ScrollReveal>
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-white mb-4">Our Data Quality Commitment</h2>
              </div>

              <Card className="border-l-4" style={{ borderLeftColor: colors.burntOrange }}>
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <span className="text-2xl">📊</span>
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Cross-Referenced Data</h3>
                        <p className="text-gray-400">
                          Every critical statistic is cross-referenced against 3+ sources before publication. We do not guess.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <span className="text-2xl">🕐</span>
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">America/Chicago Timestamps</h3>
                        <p className="text-gray-400">
                          All data points include precise timestamps. You always know exactly when information was captured.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <span className="text-2xl">🔗</span>
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Source Citations</h3>
                        <p className="text-gray-400">
                          Every stat includes its source. Full transparency on where our data comes from.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <span className="text-2xl">🚫</span>
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Zero Placeholders</h3>
                        <p className="text-gray-400">
                          Real numbers or we do not ship it. No estimates, no placeholder data, no made-up statistics.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      {/* CTA Section */}
      <Section className="py-20 bg-gradient-to-b from-charcoal to-midnight">
        <Container>
          <ScrollReveal>
            <div className="max-w-2xl mx-auto text-center">
              <h2
                className="text-3xl md:text-4xl font-bold mb-6"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                See Our <span style={{ color: colors.burntOrange }}>Data in Action</span>
              </h2>
              <p className="text-xl text-gray-400 mb-8">
                Start your 14-day free trial and explore the most comprehensive sports data platform built for fans.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/pricing">
                  <Button size="lg" style={{ backgroundColor: colors.burntOrange }}>
                    Start Free Trial
                  </Button>
                </Link>
                <Link href="/college-baseball">
                  <Button variant="outline" size="lg">
                    Explore College Baseball
                  </Button>
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      <Footer />
    </main>
  );
}
