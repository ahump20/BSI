'use client';

/**
 * Analytics Hub
 *
 * Central hub for all BSI analytics tools including:
 * - Win probability models
 * - Pythagorean expectations
 * - Player comparisons
 * - Historical analysis
 * - Monte Carlo simulations
 *
 * Last Updated: 2025-01-07
 */

import { useState } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';

const analyticsTools = [
  {
    id: 'pythagorean',
    name: 'Pythagorean Expectation',
    description:
      'Calculate expected win percentage based on runs scored vs. allowed. See which teams are over/underperforming their run differential.',
    icon: '📐',
    sport: 'MLB',
    status: 'available',
    href: '/analytics/pythagorean',
  },
  {
    id: 'win-probability',
    name: 'Win Probability',
    description:
      'Real-time win probability calculations during games. Track momentum shifts and critical moments.',
    icon: '📈',
    sport: 'All',
    status: 'available',
    href: '/analytics/win-probability',
  },
  {
    id: 'player-comparison',
    name: 'Player Comparison',
    description:
      'Compare players head-to-head across multiple statistical categories. Generate side-by-side analysis.',
    icon: '⚖️',
    sport: 'MLB',
    status: 'available',
    href: '/mlb/players',
  },
  {
    id: 'abs-tracker',
    name: 'Robot Umpire Tracker',
    description:
      'Track MLB\'s Automated Ball-Strike System: challenge success rates by role, umpire accuracy vs. Hawk-Eye, and ABS impact on pitcher-batter dynamics.',
    icon: '🤖',
    sport: 'MLB',
    status: 'available',
    href: '/mlb/abs',
  },
  {
    id: 'scouting-intel',
    name: 'Scouting Intelligence',
    description:
      'Pro-style 20-80 scouting grades for college baseball teams. Pythagorean projections, run differential analysis, and conference-play breakdowns.',
    icon: '🔬',
    sport: 'NCAA',
    status: 'available',
    href: '/college-baseball/teams',
  },
  {
    id: 'monte-carlo',
    name: 'Season Simulator',
    description:
      'Run thousands of simulations to project season outcomes. Playoff odds, division winners, and more.',
    icon: '🎲',
    sport: 'MLB',
    status: 'coming-soon',
    href: '#',
  },
  {
    id: 'statcast',
    name: 'Statcast Advanced',
    description:
      'Exit velocity, launch angle, barrel rate, sprint speed, bat speed, and expected stats from MLB\'s Hawk-Eye tracking system.',
    icon: '📡',
    sport: 'MLB',
    status: 'available',
    href: '/mlb/statcast',
  },
  {
    id: 'biomechanics',
    name: 'Pitcher Biomechanics',
    description:
      'Arm slot, hip-shoulder separation, velocity trends, mechanical drift, and injury risk indicators via KinaTrax / PitcherNet.',
    icon: '🦴',
    sport: 'MLB',
    status: 'coming-soon',
    href: '#',
  },
  {
    id: 'broadcast-tracking',
    name: 'Broadcast Tracking',
    description:
      'SkillCorner CV-derived player speed, distance, and sprint data from standard broadcast video. No stadium cameras required.',
    icon: '📺',
    sport: 'NCAA',
    status: 'coming-soon',
    href: '#',
  },
  {
    id: 'historical',
    name: 'Historical Analysis',
    description:
      'Deep dive into 5+ years of historical data. Compare current performance to past seasons.',
    icon: '📚',
    sport: 'All',
    status: 'enterprise',
    href: '/analytics/historical',
  },
  {
    id: 'nil-valuation',
    name: 'NIL Valuation',
    description:
      'Estimate Name, Image, and Likeness value for college athletes based on performance and market factors.',
    icon: '💰',
    sport: 'NCAA',
    status: 'available',
    href: '/nil-valuation',
  },
];

const quickStats = [
  { label: 'Data Points Analyzed', value: '2.4M+', sublabel: 'This season' },
  { label: 'Prediction Accuracy', value: '67.3%', sublabel: 'Win probability' },
  { label: 'Historical Records', value: '5+ Years', sublabel: 'MLB, NFL, NCAA' },
  { label: 'Update Frequency', value: '30 sec', sublabel: 'Live games' },
];

export default function AnalyticsPage() {
  const [selectedSport, setSelectedSport] = useState<'all' | 'mlb' | 'nfl' | 'ncaa'>('all');

  const filteredTools =
    selectedSport === 'all'
      ? analyticsTools
      : analyticsTools.filter(
          (tool) => tool.sport.toLowerCase() === selectedSport || tool.sport.toLowerCase() === 'all'
        );

  return (
    <>
      <main id="main-content">
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-border-subtle">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href="/"
                className="text-text-tertiary hover:text-burnt-orange transition-colors"
              >
                Home
              </Link>
              <span className="text-text-tertiary">/</span>
              <span className="text-white font-medium">Analytics</span>
            </nav>
          </Container>
        </Section>

        {/* Hero */}
        <Section padding="lg" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />

          <Container>
            <ScrollReveal direction="up">
              <Badge variant="primary" className="mb-4">
                Analytics Hub
              </Badge>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-display text-gradient-blaze mb-4">
                Data-Driven Intelligence
              </h1>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={150}>
              <p className="text-text-secondary text-lg max-w-2xl mb-8">
                Professional-grade analytics tools for fans who want more than just scores. Win
                probability, projections, historical analysis, and predictive models.
              </p>
            </ScrollReveal>

            {/* Quick Stats */}
            <ScrollReveal direction="up" delay={200}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                {quickStats.map((stat) => (
                  <Card key={stat.label} variant="default" padding="md" className="text-center">
                    <p className="text-2xl md:text-3xl font-bold text-burnt-orange">{stat.value}</p>
                    <p className="text-sm text-white font-medium">{stat.label}</p>
                    <p className="text-xs text-text-tertiary">{stat.sublabel}</p>
                  </Card>
                ))}
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Sport Filter */}
        <Section padding="md" background="charcoal" borderTop>
          <Container>
            <div className="flex flex-wrap gap-2 mb-8">
              {(['all', 'mlb', 'nfl', 'ncaa'] as const).map((sport) => (
                <button
                  key={sport}
                  onClick={() => setSelectedSport(sport)}
                  className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                    selectedSport === sport
                      ? 'bg-burnt-orange text-white'
                      : 'bg-graphite text-text-secondary hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {sport === 'all' ? 'All Sports' : sport.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Tools Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredTools.map((tool, index) => (
                <ScrollReveal key={tool.id} delay={index * 50}>
                  <Link
                    href={tool.href}
                    className={`block h-full ${
                      tool.status === 'coming-soon' ? 'pointer-events-none' : ''
                    }`}
                  >
                    <Card
                      variant="default"
                      padding="lg"
                      className={`h-full transition-all hover:border-burnt-orange ${
                        tool.status === 'coming-soon' ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <span className="text-3xl">{tool.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-white">{tool.name}</h3>
                            {tool.status === 'coming-soon' && (
                              <Badge variant="secondary" size="sm">
                                Coming Soon
                              </Badge>
                            )}
                            {tool.status === 'enterprise' && (
                              <Badge variant="primary" size="sm">
                                Enterprise
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-text-secondary mb-3">{tool.description}</p>
                          <Badge variant="secondary" size="sm">
                            {tool.sport}
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </Container>
        </Section>

        {/* CTA Section */}
        <Section padding="lg" borderTop>
          <Container>
            <ScrollReveal>
              <Card variant="hover" padding="lg" className="text-center border-burnt-orange/30">
                <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-4">
                  Unlock Full Analytics Access
                </h2>
                <p className="text-text-secondary max-w-xl mx-auto mb-6">
                  Pro subscribers get access to all analytics tools. Enterprise unlocks historical
                  data, API access, and custom exports.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button href="/pricing" variant="primary" size="lg">
                    View Pricing
                  </Button>
                  <Button href="/dashboard" variant="outline" size="lg">
                    Try Dashboard Free
                  </Button>
                </div>
              </Card>
            </ScrollReveal>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
