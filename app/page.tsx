import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '../components/cinematic/ScrollReveal';
import { Navbar } from '../components/layout-ds/Navbar';
import { Footer } from '../components/layout-ds/Footer';

const navItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'MLB', href: '/sports/mlb' },
  { label: 'NFL', href: '/sports/nfl' },
  { label: 'NBA', href: '/sports/nba' },
  { label: 'Pricing', href: '/pricing' },
];

const sportsData = [
  { name: 'MLB', icon: '⚾', href: '/sports/mlb', desc: 'Live scores, standings & stats' },
  { name: 'NFL', icon: '🏈', href: '/sports/nfl', desc: 'Live scores, standings & stats' },
  { name: 'NBA', icon: '🏀', href: '/sports/nba', desc: 'Live scores, standings & stats' },
  { name: 'NCAA', icon: '🎓', href: '/college-baseball/', desc: 'College baseball coverage' },
];

const features = [
  {
    icon: '📊',
    title: 'Real-Time Data',
    description: 'Live scores updated every 30 seconds. Never miss a play with instant notifications.',
  },
  {
    icon: '🎯',
    title: 'Predictive Analytics',
    description: 'Monte Carlo simulations and win probability models for every game.',
  },
  {
    icon: '📱',
    title: 'Mobile-First',
    description: 'Designed for mobile devices first. Access your analytics anywhere.',
  },
];

export default function HomePage() {
  return (
    <main id="main-content" className="min-h-screen">
      {/* Navbar */}
      <Navbar items={navItems} />

      {/* Hero Section */}
      <Section padding="xl" className="relative pt-32 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-burnt-orange/20 rounded-full blur-[120px]" />
        </div>

        <Container>
          <ScrollReveal direction="up">
            <div className="text-center">
              <Badge variant="accent" className="mb-6">
                Real-Time Sports Intelligence
              </Badge>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-display text-white mb-6 tracking-tight">
                QUANTIFYING
                <br />
                <span className="text-gradient-brand">INSTINCT</span>
              </h1>

              <p className="lead max-w-2xl mx-auto mb-10">
                Professional sports analytics platform delivering real-time MLB, NFL, NBA, and NCAA
                data. Live scores, predictions, and insights powered by advanced statistics.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/dashboard" className="btn-primary px-8 py-4 text-lg">
                  Launch Dashboard
                </Link>
                <Link href="/pricing" className="btn-secondary px-8 py-4 text-lg">
                  View Pricing
                </Link>
              </div>

              {/* Live indicator */}
              <div className="mt-12 flex items-center justify-center gap-4">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-success/20 text-success">
                  <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
                  LIVE
                </span>
                <span className="text-white/50">Live data streaming from official sources</span>
              </div>
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      {/* Sports Grid */}
      <Section padding="lg">
        <Container>
          <ScrollReveal direction="up">
            <h2 className="text-3xl font-display text-white text-center mb-12">COVERAGE</h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {sportsData.map((sport, index) => (
              <ScrollReveal key={sport.name} direction="up" delay={index * 100}>
                <Link href={sport.href}>
                  <Card variant="interactive" className="p-6 text-center h-full">
                    <span className="text-5xl mb-4 block">{sport.icon}</span>
                    <h3 className="text-xl font-display text-white mb-2">{sport.name}</h3>
                    <p className="text-white/50 text-sm">{sport.desc}</p>
                  </Card>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Features */}
      <Section padding="lg" background="charcoal">
        <Container>
          <ScrollReveal direction="up">
            <h2 className="text-3xl font-display text-white text-center mb-12">FEATURES</h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <ScrollReveal key={feature.title} direction="up" delay={index * 100}>
                <Card className="p-6 h-full">
                  <div className="w-12 h-12 rounded-lg gradient-brand flex items-center justify-center mb-4">
                    <span className="text-2xl">{feature.icon}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-white/60">{feature.description}</p>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Footer */}
      <Footer />
    </main>
  );
}
