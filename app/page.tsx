import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '../components/cinematic/ScrollReveal';
import { IntelTicker } from '../components/cinematic/IntelTicker';
import { Navbar } from '../components/layout-ds/Navbar';
import { Footer } from '../components/layout-ds/Footer';
import { LiveGamesWidget } from '../components/widgets/LiveGamesWidget';

const navItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'MLB', href: '/mlb' },
  { label: 'NFL', href: '/nfl' },
  { label: 'NBA', href: '/nba' },
  { label: 'College Baseball', href: '/college-baseball' },
  { label: 'Pricing', href: '/pricing' },
];

const sportsData: {
  name: string;
  icon: string;
  href: string;
  desc: string;
  comingSoon?: boolean;
}[] = [
  { name: 'MLB', icon: '⚾', href: '/mlb', desc: 'Live scores, standings & Statcast' },
  { name: 'NFL', icon: '🏈', href: '/nfl', desc: 'Live scores & standings' },
  { name: 'NBA', icon: '🏀', href: '/nba', desc: 'Live scores & standings' },
  {
    name: 'College Baseball',
    icon: '🎓',
    href: '/college-baseball',
    desc: 'D1 standings & schedules',
  },
  { name: 'CFB', icon: '🏟️', href: '/cfb', desc: 'College football analytics', comingSoon: true },
];

const features = [
  {
    icon: '📊',
    title: 'Real-Time Data',
    description:
      'Live scores updated every 30 seconds. Never miss a play with instant notifications.',
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

const tickerItems = [
  { id: '1', content: 'MLB: Live scores and standings streaming now', type: 'live' as const },
  { id: '2', content: 'NFL: 2025 season data fully integrated', type: 'default' as const },
  { id: '3', content: 'NBA: 2025-26 season standings and scores live', type: 'default' as const },
  {
    id: '4',
    content: 'College Baseball: D1 standings and box scores live',
    type: 'default' as const,
  },
  { id: '5', content: 'Dashboard: Real-time multi-sport command center', type: 'default' as const },
];

export default function HomePage() {
  return (
    <main id="main-content" className="min-h-screen">
      {/* Navbar */}
      <Navbar items={navItems} />

      {/* Intel Ticker */}
      <div className="pt-16">
        <IntelTicker items={tickerItems} speed={40} variant="accent" pauseOnHover />
      </div>

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
                BORN TO BLAZE THE
                <br />
                <span className="text-gradient-brand">PATH LESS BEATEN</span>
              </h1>

              <p className="lead max-w-2xl mx-auto mb-10">
                Professional sports intelligence for fans who care about the game—not the networks.
                MLB, NFL, NBA, College Baseball, NCAA Football. Real analytics, real data, real
                coverage.
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

      {/* What's Live Now */}
      <Section padding="md" background="charcoal">
        <Container>
          <ScrollReveal direction="up">
            <h2 className="text-2xl font-display text-white text-center mb-6">
              WHAT&apos;S LIVE NOW
            </h2>
            <LiveGamesWidget />
          </ScrollReveal>
        </Container>
      </Section>

      {/* Sports Grid */}
      <Section padding="lg">
        <Container>
          <ScrollReveal direction="up">
            <h2 className="text-3xl font-display text-white text-center mb-12">COVERAGE</h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {sportsData.map((sport, index) => (
              <ScrollReveal key={sport.name} direction="up" delay={index * 100}>
                <Link href={sport.href}>
                  <Card variant="interactive" className="p-6 text-center h-full relative">
                    {sport.comingSoon && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 text-xs font-semibold bg-gold/20 text-gold rounded-full">
                        Coming Soon
                      </span>
                    )}
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
