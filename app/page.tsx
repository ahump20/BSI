import Link from 'next/link';
import { HeroSectionWrapper } from '@/components/hero/HeroSectionWrapper';
import { HomeLiveScores } from '@/components/home';
import { Footer } from '@/components/layout-ds/Footer';
import { SportIcon } from '@/components/ui/SportIcon';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { YourTeamsToday } from '@/components/home/YourTeamsToday';

export const metadata = {
  title: 'Blaze Sports Intel | NCAA Transfer Portal & Real-Time Sports Analytics',
  description:
    'The #1 NCAA Transfer Portal tracker for College Baseball and CFB. Real-time tracking, player stats, and commitment alerts. Plus live scores for MLB, NFL, and NBA.',
};

const sports = [
  {
    name: 'College Baseball',
    icon: 'ncaa' as const,
    href: '/college-baseball',
    description: 'D1 standings, rankings & box scores',
  },
  {
    name: 'MLB',
    icon: 'mlb' as const,
    href: '/mlb',
    description: 'Live scores, standings & Statcast',
  },
  { name: 'NFL', icon: 'nfl' as const, href: '/nfl', description: 'Live scores & standings' },
  { name: 'NBA', icon: 'nba' as const, href: '/nba', description: 'Live scores & standings' },
];

const features = [
  {
    icon: 'refresh' as const,
    title: 'Transfer Portal Tracker',
    description:
      'Every D1 transfer. Baseball and football. Updated in real-time, every 30 seconds.',
  },
  {
    icon: 'chart' as const,
    title: 'Live Data Intelligence',
    description: '30-second updates. Verified sources. No placeholders, no "check back later."',
  },
  {
    icon: 'target' as const,
    title: 'Built for the Overlooked',
    description: 'Rice vs. Houston midweek? We have the box score. Your team matters here.',
  },
];

export default function HomePage() {
  return (
    <main id="main-content" className="min-h-screen bg-midnight pt-16 md:pt-20">
      <OnboardingFlow />
      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-4 sm:px-6 lg:px-8">
        {/* Three.js Ember Particles Background */}
        <HeroSectionWrapper />

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-burnt-orange/20 text-burnt-orange mb-6">
            <span className="w-1.5 h-1.5 bg-burnt-orange rounded-full animate-pulse" />
            Winter 2025 Transfer Portal LIVE
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-6 tracking-tight">
            Live Scores. Transfer Portal.
            <br />
            <span className="text-burnt-orange">Every D1 Team.</span>
          </h1>
          <p className="text-xl md:text-2xl text-text-secondary mb-10 max-w-3xl mx-auto">
            Real-time college baseball and football intel — updated every 30 seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/transfer-portal"
              className="bg-burnt-orange hover:bg-burnt-orange/90 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all hover:shadow-glow-sm inline-flex flex-col items-center justify-center gap-1"
            >
              <span className="inline-flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                </span>
                Transfer Portal Tracker
              </span>
              <span className="text-sm font-normal text-white/80">Browse D1 transfers</span>
            </Link>
            <Link
              href="/dashboard"
              className="border border-burnt-orange text-burnt-orange hover:bg-burnt-orange hover:text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors flex flex-col items-center justify-center gap-1"
            >
              <span>My Dashboard</span>
              <span className="text-sm font-normal opacity-80">Live scores & alerts</span>
            </Link>
          </div>
          <div className="mt-10 flex items-center justify-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-success/20 text-success">
              <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
              LIVE
            </span>
            <span className="text-text-muted text-sm">
              Data streaming from official NCAA, D1Baseball, On3, 247Sports
            </span>
          </div>
        </div>
      </section>

      {/* Live Scores Hub - Defaults to College Baseball */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-charcoal/50">
        <div className="max-w-7xl mx-auto">
          <HomeLiveScores />
        </div>
      </section>

      {/* Personalized section — shows after onboarding */}
      <YourTeamsToday />

      {/* Sports Coverage */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-charcoal">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-display font-bold text-white text-center mb-12">COVERAGE</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {sports.map((sport) => (
              <Link key={sport.name} href={sport.href}>
                <div className="bg-midnight/50 p-6 rounded-xl border border-border-subtle hover:border-burnt-orange/50 transition-all hover:shadow-glow-sm text-center h-full group">
                  <span className="mb-4 block text-burnt-orange">
                    <SportIcon icon={sport.icon} size="xl" />
                  </span>
                  <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-burnt-orange transition-colors">
                    {sport.name}
                  </h3>
                  <p className="text-text-secondary text-sm">{sport.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-display font-bold text-white text-center mb-4">WHY BSI?</h2>
          <p className="text-text-secondary text-center mb-12 max-w-2xl mx-auto">
            Built by fans who wanted better coverage for college baseball.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-charcoal-900/50 p-6 rounded-xl border border-border-subtle hover:border-burnt-orange/30 transition-colors"
              >
                <div className="w-12 h-12 rounded-lg bg-burnt-orange/20 flex items-center justify-center mb-4 text-burnt-orange">
                  <SportIcon icon={feature.icon} size="lg" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-text-secondary">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
