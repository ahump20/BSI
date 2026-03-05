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

// ── SVG Tool Icons ──

const IconTriangle = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 20L12 4L21 20H3Z" /><path d="M12 10v4M8 16h8" />
  </svg>
);
const IconTrend = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 17l5-5 4 4 9-11" /><path d="M17 5h4v4" />
  </svg>
);
const IconScale = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v18M3 8l9-5 9 5" /><path d="M3 8l3 8h6L9 8M15 8l3 8h-6l3-8" />
  </svg>
);
const IconCpu = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="5" width="14" height="14" rx="2" /><rect x="9" y="9" width="6" height="6" />
    <path d="M9 1v4M15 1v4M9 19v4M15 19v4M1 9h4M1 15h4M19 9h4M19 15h4" />
  </svg>
);
const IconScope = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /><path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
  </svg>
);
const IconTarget = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
  </svg>
);
const IconBolt = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
  </svg>
);
const IconDice = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1" fill="currentColor" /><circle cx="15.5" cy="8.5" r="1" fill="currentColor" /><circle cx="8.5" cy="15.5" r="1" fill="currentColor" /><circle cx="15.5" cy="15.5" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" />
  </svg>
);
const IconArchive = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19V5a2 2 0 012-2h8l6 6v10a2 2 0 01-2 2H6a2 2 0 01-2-2z" /><path d="M14 3v6h6M8 13h8M8 17h5" />
  </svg>
);
const IconDollar = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="M12 6v12M9 9.5C9 8.12 10.34 7 12 7s3 1.12 3 2.5S13.66 12 12 12s-3 1.12-3 2.5S10.34 17 12 17s3-1.12 3-2.5" />
  </svg>
);

const TOOL_ICONS: Record<string, React.FC> = {
  pythagorean: IconTriangle,
  'win-probability': IconTrend,
  'player-comparison': IconScale,
  'abs-tracker': IconCpu,
  'scouting-intel': IconScope,
  havf: IconTarget,
  mmi: IconBolt,
  'monte-carlo': IconDice,
  historical: IconArchive,
  'nil-valuation': IconDollar,
};

const analyticsTools = [
  {
    id: 'pythagorean',
    name: 'Pythagorean Expectation',
    description:
      'Calculate expected win percentage based on runs scored vs. allowed. See which teams are over/underperforming their run differential.',
    sport: 'MLB',
    status: 'available',
    href: '/analytics/pythagorean',
  },
  {
    id: 'win-probability',
    name: 'Win Probability',
    description:
      'Real-time win probability calculations during games. Track momentum shifts and critical moments.',
    sport: 'All',
    status: 'available',
    href: '/analytics/win-probability',
  },
  {
    id: 'player-comparison',
    name: 'Player Comparison',
    description:
      'Compare players head-to-head across multiple statistical categories. Generate side-by-side analysis.',
    sport: 'MLB',
    status: 'available',
    href: '/mlb/players',
  },
  {
    id: 'abs-tracker',
    name: 'Robot Umpire Tracker',
    description:
      'Track MLB\'s Automated Ball-Strike System: challenge success rates by role, umpire accuracy vs. Hawk-Eye, and ABS impact on pitcher-batter dynamics.',
    sport: 'MLB',
    status: 'available',
    href: '/mlb/abs',
  },
  {
    id: 'scouting-intel',
    name: 'Scouting Intelligence',
    description:
      'Pro-style 20-80 scouting grades for college baseball teams. Pythagorean projections, run differential analysis, and conference-play breakdowns.',
    sport: 'NCAA',
    status: 'available',
    href: '/college-baseball/teams',
  },
  {
    id: 'havf',
    name: 'HAV-F Player Evaluation',
    description:
      'BSI\'s proprietary composite metric: Hitting, At-Bat Quality, Velocity, and Fielding. Percentile-normalized 0-100 scale for every D1 player.',
    sport: 'NCAA',
    status: 'available',
    href: '/college-baseball/analytics',
  },
  {
    id: 'mmi',
    name: 'Momentum Index (MMI)',
    description:
      'Real-time momentum tracking during live games. Score differential, recent scoring, game phase, and base situation combine into a -100 to +100 momentum gauge.',
    sport: 'NCAA',
    status: 'available',
    href: '/analytics/mmi',
  },
  {
    id: 'monte-carlo',
    name: 'Season Simulator',
    description:
      'Run thousands of simulations to project season outcomes. Playoff odds, division winners, and more.',
    sport: 'MLB',
    status: 'coming-soon',
    href: '#',
  },
  {
    id: 'historical',
    name: 'Historical Analysis',
    description:
      'Deep dive into 5+ years of historical data. Compare current performance to past seasons.',
    sport: 'All',
    status: 'enterprise',
    href: '/analytics/historical',
  },
  {
    id: 'nil-valuation',
    name: 'NIL Valuation',
    description:
      'Estimate Name, Image, and Likeness value for college athletes based on performance and market factors.',
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
      <div>
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
              <span className="text-text-primary font-medium">Analytics</span>
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
                    <p className="text-sm text-text-primary font-medium">{stat.label}</p>
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
                      : 'bg-background-tertiary text-text-secondary hover:bg-surface-light hover:text-text-primary'
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
                        <span className="text-text-secondary">
                          {(() => { const Icon = TOOL_ICONS[tool.id]; return Icon ? <Icon /> : null; })()}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-text-primary">{tool.name}</h3>
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
                <h2 className="font-display text-2xl md:text-3xl font-bold text-text-primary mb-4">
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
      </div>

      <Footer />
    </>
  );
}
