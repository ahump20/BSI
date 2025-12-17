import Link from 'next/link';
import { Navbar } from '@/components/layout-ds/Navbar';
import { Footer } from '@/components/layout-ds/Footer';
import { Section, Container } from '@/components/layout-ds';
import { ScrollReveal } from '@/components/layout-ds/ScrollReveal';
import { Badge } from '@/components/layout-ds/Badge';
import { IntelTicker } from '@/components/layout-ds/IntelTicker';
import { LiveGamesWidget } from '@/components/college-baseball/LiveGamesWidget';

export const metadata = {
  title: 'Blaze Sports Intel | Real-Time Sports Analytics',
  description: 'Professional sports intelligence platform delivering real-time MLB, NFL, NBA, and NCAA analytics. Live scores, predictions, and data-driven insights.',
};

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'College Baseball', href: '/college-baseball' },
  { label: 'MLB', href: '/mlb' },
  { label: 'NFL', href: '/nfl' },
  { label: 'NBA', href: '/nba' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'About', href: '/about' },
  { label: 'Pricing', href: '/pricing' },
];

const tickerItems = [
  { id: '1', content: 'MLB: Live scores and standings streaming now', type: 'live' as const },
  { id: '2', content: 'NFL: 2025 season data fully integrated', type: 'default' as const },
  { id: '3', content: 'NBA: 2025-26 season standings and scores live', type: 'default' as const },
  { id: '4', content: 'College Baseball: D1 standings and box scores live', type: 'default' as const },
  { id: '5', content: 'Dashboard: Real-time multi-sport command center', type: 'default' as const },
];

const sports = [
  { name: 'MLB', icon: '⚾', href: '/mlb', description: 'Live scores, standings & Statcast' },
  { name: 'NFL', icon: '🏈', href: '/nfl', description: 'Live scores & standings' },
  { name: 'NBA', icon: '🏀', href: '/nba', description: 'Live scores & standings' },
  { name: 'College Baseball', icon: '🎓', href: '/college-baseball', description: 'D1 standings & schedules' },
  { name: 'CFB', icon: '🏟️', href: '/cfb', description: 'College football analytics', comingSoon: true },
];

const features = [
  { icon: '📊', title: 'Real-Time Data', description: 'Live scores updated every 30 seconds. Never miss a play with instant notifications.' },
  { icon: '🎯', title: 'Predictive Analytics', description: 'Monte Carlo simulations and win probability models for every game.' },
  { icon: '📱', title: 'Mobile-First', description: 'Designed for mobile devices first. Access your analytics anywhere.' },
];

export default function HomePage() {
  return (
    <main id="main-content" className="min-h-screen">
      <Navbar items={navItems} />

      {/* Intel Ticker */}
      <div className="pt-16">
        <IntelTicker items={tickerItems} speed={40} variant="accent" pauseOnHover />
      </div>

      {/* Hero Section */}
      <Section padding="lg" className="pt-32 overflow-hidden" background="transparent">
        <Container>
          <ScrollReveal>
            <div className="text-center">
              <Badge className="mb-6">Real-Time Sports Intelligence</Badge>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-display text-white mb-6 tracking-tight">
                BORN TO BLAZE THE<br />
                <span className="text-gradient-brand">PATH LESS BEATEN</span>
              </h1>
              <p className="lead max-w-2xl mx-auto mb-10">
                Every game matters to someone. MLB, NFL, NBA, College Baseball, NCAA Football—real analytics, not just scores. Built by a fan who got tired of waiting.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/dashboard" className="btn-primary px-8 py-4 text-lg">
                  Launch Dashboard
                </Link>
                <Link href="/pricing" className="btn-secondary px-8 py-4 text-lg">
                  View Pricing
                </Link>
              </div>
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

      {/* Live Games Widget */}
      <Section padding="md" background="charcoal">
        <Container>
          <ScrollReveal>
            <h2 className="text-2xl font-display text-white text-center mb-6">WHAT&apos;S LIVE NOW</h2>
            <LiveGamesWidget />
          </ScrollReveal>
        </Container>
      </Section>

      {/* Sports Coverage */}
      <Section padding="lg" background="transparent">
        <Container>
          <ScrollReveal>
            <h2 className="text-3xl font-display text-white text-center mb-12">COVERAGE</h2>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {sports.map((sport, index) => (
              <ScrollReveal key={sport.name} delay={index * 100}>
                <Link href={sport.href}>
                  <div className="glass-card p-4 p-6 text-center h-full relative">
                    {sport.comingSoon && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 text-xs font-semibold bg-gold/20 text-gold rounded-full">
                        Coming Soon
                      </span>
                    )}
                    <span className="text-5xl mb-4 block">{sport.icon}</span>
                    <h3 className="text-xl font-display text-white mb-2">{sport.name}</h3>
                    <p className="text-white/50 text-sm">{sport.description}</p>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Features */}
      <Section padding="lg" background="charcoal">
        <Container>
          <ScrollReveal>
            <h2 className="text-3xl font-display text-white text-center mb-12">FEATURES</h2>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <ScrollReveal key={feature.title} delay={index * 100}>
                <div className="glass-card p-4 p-6 h-full">
                  <div className="w-12 h-12 rounded-lg gradient-brand flex items-center justify-center mb-4">
                    <span className="text-2xl">{feature.icon}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-white/60">{feature.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </Container>
      </Section>

      <Footer />
    </main>
  );
}
