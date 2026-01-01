'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/cinematic';
import { Navbar } from '@/components/layout-ds/Navbar';
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

const features = [
  {
    icon: '📊',
    title: 'Complete Player Database',
    description: '300+ D1 programs tracked with comprehensive batting, pitching, and fielding stats updated daily.',
  },
  {
    icon: '📈',
    title: 'Historical Data Access',
    description: '5+ years of historical data for trend analysis, career arcs, and development tracking.',
  },
  {
    icon: '🔌',
    title: 'Enterprise API Access',
    description: 'RESTful API with JSON exports. Integrate BSI data directly into your existing scouting systems.',
  },
  {
    icon: '📁',
    title: 'Custom Data Exports',
    description: 'Export player lists, team rosters, and statistical summaries in CSV, JSON, or Excel formats.',
  },
  {
    icon: '🔔',
    title: 'Player Watchlists',
    description: 'Track prospects across multiple programs. Get alerts for performance milestones and injuries.',
  },
  {
    icon: '⚡',
    title: 'Real-Time Updates',
    description: 'Live score updates every 30 seconds during games. Box scores available within minutes of final out.',
  },
];

const useCases = [
  {
    title: 'Pre-Draft Analysis',
    description: 'Comprehensive statistical profiles for every draft-eligible player. Compare prospects across conferences with normalized metrics.',
    icon: '🎯',
  },
  {
    title: 'Area Scout Coverage',
    description: 'Track all programs in your assigned territory. Never miss a breakout performer in your region.',
    icon: '🗺️',
  },
  {
    title: 'Cross-Reference Reports',
    description: 'Export data to your internal systems. Build custom reports that match your organizations evaluation framework.',
    icon: '📋',
  },
];

export default function ForScoutsPage() {
  return (
    <main className="min-h-screen bg-midnight text-cream">
      <Navbar items={navItems} />

      {/* Hero Section */}
      <Section className="pt-32 pb-16 bg-gradient-to-b from-charcoal to-midnight">
        <Container>
          <ScrollReveal>
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="primary" className="mb-4">For Professional Scouts</Badge>
              <h1
                className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                The Data Your <span style={{ color: colors.burntOrange }}>Scouting Department</span> Deserves
              </h1>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Enterprise-grade college baseball intelligence. API access, historical data, and the tracking tools professional scouts need to find the next big leaguer.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/pricing">
                  <Button size="lg" style={{ backgroundColor: colors.burntOrange }}>
                    Get Enterprise Access
                  </Button>
                </Link>
                <Link href="mailto:Austin@blazesportsintel.com?subject=Enterprise%20Demo%20Request">
                  <Button variant="outline" size="lg">
                    Schedule Demo
                  </Button>
                </Link>
              </div>
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
                <div className="text-3xl md:text-4xl font-bold" style={{ color: colors.burntOrange }}>300+</div>
                <p className="text-gray-400 mt-1">D1 Programs</p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <div>
                <div className="text-3xl md:text-4xl font-bold" style={{ color: colors.burntOrange }}>5+</div>
                <p className="text-gray-400 mt-1">Years Historical Data</p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <div>
                <div className="text-3xl md:text-4xl font-bold" style={{ color: colors.burntOrange }}>30s</div>
                <p className="text-gray-400 mt-1">Live Updates</p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={300}>
              <div>
                <div className="text-3xl md:text-4xl font-bold" style={{ color: colors.burntOrange }}>API</div>
                <p className="text-gray-400 mt-1">RESTful Access</p>
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
              <h2 className="text-3xl font-bold text-white mb-4">Enterprise Features</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Built for professional scouting departments. Every feature designed to help you find, evaluate, and track prospects.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <ScrollReveal key={feature.title} delay={index * 100}>
                <Card className="h-full">
                  <CardContent className="p-6">
                    <span className="text-3xl mb-4 block">{feature.icon}</span>
                    <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-gray-400 text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Use Cases */}
      <Section className="py-20 bg-charcoal">
        <Container>
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">How Scouts Use BSI</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                From draft prep to daily area coverage, BSI fits into your existing workflow.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8">
            {useCases.map((useCase, index) => (
              <ScrollReveal key={useCase.title} delay={index * 100}>
                <div className="text-center">
                  <span className="text-5xl mb-4 block">{useCase.icon}</span>
                  <h3 className="text-xl font-semibold text-white mb-3">{useCase.title}</h3>
                  <p className="text-gray-400">{useCase.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* API Preview */}
      <Section className="py-20">
        <Container>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <ScrollReveal>
              <div>
                <Badge variant="secondary" className="mb-4">API Access</Badge>
                <h2 className="text-3xl font-bold text-white mb-4">
                  Integrate BSI Into Your Systems
                </h2>
                <p className="text-gray-400 mb-6">
                  RESTful API with comprehensive documentation. Pull player stats, game logs, and team data directly into your internal tools.
                </p>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    JSON response format
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    Rate limits suitable for enterprise use
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    Webhook notifications for game updates
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    Bulk export endpoints
                  </li>
                </ul>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <Card className="overflow-hidden">
                <div className="bg-midnight p-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="ml-2 text-sm text-gray-400">api.blazesportsintel.com</span>
                  </div>
                </div>
                <CardContent className="p-4">
                  <pre className="text-sm text-gray-300 overflow-x-auto">
{`GET /v1/players/stats
{
  "player_id": "BSI-2025-TX-001",
  "name": "John Smith",
  "school": "Texas",
  "position": "RHP",
  "stats": {
    "era": 2.45,
    "whip": 1.02,
    "k_per_9": 11.2,
    "bb_per_9": 2.1,
    "innings": 84.2
  }
}`}
                  </pre>
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>
        </Container>
      </Section>

      {/* Pricing CTA */}
      <Section className="py-20 bg-gradient-to-b from-charcoal to-midnight">
        <Container>
          <ScrollReveal>
            <Card className="max-w-3xl mx-auto text-center overflow-hidden">
              <div
                className="p-8 md:p-12"
                style={{ background: `linear-gradient(135deg, ${colors.charcoal} 0%, ${colors.midnight} 100%)` }}
              >
                <Badge variant="primary" className="mb-4">Enterprise Plan</Badge>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  <span style={{ color: colors.burntOrange }}>$199</span>/month
                </h2>
                <p className="text-gray-400 mb-6 max-w-xl mx-auto">
                  Everything your scouting department needs. API access, historical data, custom exports, and priority support.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/pricing">
                    <Button size="lg" style={{ backgroundColor: colors.burntOrange }}>
                      Get Started
                    </Button>
                  </Link>
                  <Link href="mailto:Austin@blazesportsintel.com?subject=Enterprise%20Inquiry">
                    <Button variant="outline" size="lg">
                      Contact Sales
                    </Button>
                  </Link>
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  Volume discounts available for multi-seat licenses
                </p>
              </div>
            </Card>
          </ScrollReveal>
        </Container>
      </Section>

      <Footer />
    </main>
  );
}
