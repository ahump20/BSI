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
    title: 'Team Dashboard',
    description:
      'Real-time view of your conference standings, upcoming games, and team statistics in one place.',
  },
  {
    icon: '📅',
    title: 'Schedule Optimization',
    description:
      'Analyze your schedule strength. Understand RPI implications before finalizing non-conference games.',
  },
  {
    icon: '🎯',
    title: 'Opponent Scouting',
    description:
      'Detailed breakdowns of upcoming opponents. Pitching tendencies, batting splits, and recent performance.',
  },
  {
    icon: '📈',
    title: 'Player Development',
    description:
      'Track individual player progress across seasons. Identify growth areas with historical comparisons.',
  },
  {
    icon: '🔍',
    title: 'Recruiting Intel',
    description:
      'Portal activity tracking. See who is entering the portal and identify potential fits for your program.',
  },
  {
    icon: '📱',
    title: 'Mobile Access',
    description:
      'Full functionality on mobile devices. Review data on the road, at tournaments, or during games.',
  },
];

const testimonialQuote = {
  text: 'Finally, someone built the analytics platform college baseball actually needs. We use BSI daily.',
  author: 'D1 Assistant Coach',
  program: 'SEC Program',
};

const pricingTiers = [
  {
    name: 'Pro',
    price: 29,
    period: 'month',
    description: 'Perfect for amateur coaches and high school programs.',
    features: [
      'Live scores and standings',
      'Complete box scores',
      'Basic team comparisons',
      'Mobile access',
      '14-day free trial',
    ],
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    name: 'Enterprise',
    price: 199,
    period: 'month',
    description: 'Built for D1 programs and professional coaching staffs.',
    features: [
      'Everything in Pro',
      'Advanced analytics dashboard',
      'Historical data (5+ years)',
      'Custom data exports',
      'API access',
      'Team collaboration tools',
      'Priority support',
    ],
    cta: 'Get Started',
    popular: true,
  },
];

export default function ForCoachesPage() {
  return (
    <main className="min-h-screen bg-midnight text-cream">
      <Navbar items={navItems} />

      {/* Hero Section */}
      <Section className="pt-32 pb-16 bg-gradient-to-b from-charcoal to-midnight">
        <Container>
          <ScrollReveal>
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="primary" className="mb-4">
                For College Programs
              </Badge>
              <h1
                className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                Analytics That <span style={{ color: colors.burntOrange }}>Win Games</span>
              </h1>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Team dashboards, opponent scouting, and recruiting intel designed for college
                baseball coaching staffs. The data you need, the way you need it.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/pricing">
                  <Button size="lg" style={{ backgroundColor: colors.burntOrange }}>
                    Start Free Trial
                  </Button>
                </Link>
                <Link href="mailto:Austin@blazesportsintel.com?subject=Coaching%20Staff%20Demo">
                  <Button variant="outline" size="lg">
                    Schedule Demo
                  </Button>
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      {/* Features Grid */}
      <Section className="py-20 bg-charcoal">
        <Container>
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">Built for Coaching Staffs</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Every feature designed around how college baseball coaches actually work.
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

      {/* Dashboard Preview */}
      <Section className="py-20">
        <Container>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <ScrollReveal>
              <div>
                <Badge variant="secondary" className="mb-4">
                  Team Dashboard
                </Badge>
                <h2 className="text-3xl font-bold text-white mb-4">Your Program at a Glance</h2>
                <p className="text-gray-400 mb-6">
                  Conference standings, upcoming matchups, recent results, and key player stats —
                  all in one view. No more clicking through 15 different pages.
                </p>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    Live conference standings
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    7-day schedule preview
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    Team batting and pitching leaders
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    Recent game recaps
                  </li>
                </ul>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <Card className="overflow-hidden">
                <div className="bg-midnight p-4 border-b border-white/10">
                  <span className="text-sm text-gray-400">Team Dashboard Preview</span>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Mock standings preview */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-400 mb-2">SEC STANDINGS</h4>
                      <div className="space-y-2">
                        {['Texas A&M', 'LSU', 'Arkansas', 'Your Team'].map((team, i) => (
                          <div
                            key={team}
                            className="flex justify-between items-center py-1 border-b border-white/10"
                          >
                            <span
                              className={
                                team === 'Your Team' ? 'text-white font-semibold' : 'text-gray-400'
                              }
                            >
                              {i + 1}. {team}
                            </span>
                            <span className="text-gray-500 text-sm">
                              {18 - i}-{3 + i}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Mock upcoming games */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-400 mb-2">UPCOMING</h4>
                      <div
                        className="flex items-center justify-between py-2"
                        style={{
                          borderLeft: `3px solid ${colors.burntOrange}`,
                          paddingLeft: '12px',
                        }}
                      >
                        <div>
                          <div className="text-white font-semibold">vs. Alabama</div>
                          <div className="text-gray-500 text-sm">Friday 6:30 PM</div>
                        </div>
                        <Badge variant="secondary">Home</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>
        </Container>
      </Section>

      {/* Quote Section */}
      <Section className="py-16 bg-charcoal">
        <Container>
          <ScrollReveal>
            <div className="max-w-3xl mx-auto text-center">
              <blockquote
                className="text-2xl md:text-3xl italic mb-6"
                style={{ fontFamily: 'Georgia, serif', color: colors.cream }}
              >
                &quot;{testimonialQuote.text}&quot;
              </blockquote>
              <div className="text-gray-400">
                <span className="font-semibold text-white">{testimonialQuote.author}</span>
                <span className="mx-2">•</span>
                <span>{testimonialQuote.program}</span>
              </div>
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      {/* Pricing Section */}
      <Section className="py-20">
        <Container>
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">Choose Your Plan</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                From high school coaches to D1 programs, we have a plan that fits.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {pricingTiers.map((tier, index) => (
              <ScrollReveal key={tier.name} delay={index * 100}>
                <Card
                  className={`h-full ${tier.popular ? 'border-2' : ''}`}
                  style={tier.popular ? { borderColor: colors.burntOrange } : {}}
                >
                  {tier.popular && (
                    <div
                      className="text-center py-2"
                      style={{ backgroundColor: colors.burntOrange }}
                    >
                      <span className="text-sm font-semibold text-white">MOST POPULAR</span>
                    </div>
                  )}
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-white mb-2">{tier.name}</h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold" style={{ color: colors.burntOrange }}>
                        ${tier.price}
                      </span>
                      <span className="text-gray-400">/{tier.period}</span>
                    </div>
                    <p className="text-gray-400 mb-6">{tier.description}</p>
                    <ul className="space-y-3 mb-6">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-gray-300">
                          <span className="text-green-500">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Link href="/pricing">
                      <Button
                        className="w-full"
                        variant={tier.popular ? 'default' : 'outline'}
                        style={tier.popular ? { backgroundColor: colors.burntOrange } : {}}
                      >
                        {tier.cta}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
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
                Ready to <span style={{ color: colors.burntOrange }}>Elevate Your Program</span>?
              </h2>
              <p className="text-xl text-gray-400 mb-8">
                14-day free trial. No credit card required. See why coaching staffs are switching to
                BSI.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/pricing">
                  <Button size="lg" style={{ backgroundColor: colors.burntOrange }}>
                    Start Free Trial
                  </Button>
                </Link>
                <Link href="mailto:Austin@blazesportsintel.com?subject=Program%20Inquiry">
                  <Button variant="outline" size="lg">
                    Talk to Austin
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
