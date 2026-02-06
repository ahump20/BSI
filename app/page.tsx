import Link from 'next/link';
import { HomeLiveScores } from '@/components/home';
import { HeroVideo } from '@/components/hero/HeroVideo';

export const metadata = {
  title: 'Blaze Sports Intel | Real-Time Sports Analytics',
  description:
    'Professional sports intelligence platform delivering real-time MLB, NFL, NBA, and NCAA analytics. Live scores, predictions, and data-driven insights.',
};

const sports = [
  {
    name: 'College Baseball',
    icon: '🎓',
    href: '/college-baseball',
    description: 'D1 standings, rankings & box scores',
  },
  { name: 'MLB', icon: '⚾', href: '/mlb', description: 'Live scores, standings & Statcast' },
  { name: 'NFL', icon: '🏈', href: '/nfl', description: 'Live scores & standings' },
  { name: 'NBA', icon: '🏀', href: '/nba', description: 'Live scores & standings' },
  {
    name: 'CFB',
    icon: '🏟️',
    href: '/cfb',
    description: 'College football analytics',
    comingSoon: true,
  },
];

const features = [
  {
    icon: '📊',
    title: 'Real-Time Data',
    description: 'Live scores updated every 30 seconds. Never miss a play.',
  },
  {
    icon: '🎯',
    title: 'College Baseball Focus',
    description: 'ESPN treats it like an afterthought. We built what fans deserve.',
  },
  {
    icon: '📱',
    title: 'Mobile-First',
    description: 'Designed for mobile devices first. Access your analytics anywhere.',
  },
];

export default function HomePage() {
  return (
    <main id="main-content" className="min-h-screen bg-midnight pt-24 md:pt-28">
      {/* Hero Section — Cinematic Video */}
      <section className="relative pt-8 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-[80vh] flex items-center">
        {/* Video Background */}
        <HeroVideo />

        {/* Gradient overlay for text readability */}
        <div
          className="absolute inset-0 z-[1]"
          style={{
            background:
              'linear-gradient(to bottom, rgba(13,13,18,0.85) 0%, rgba(13,13,18,0.4) 40%, rgba(13,13,18,0.7) 80%, rgba(13,13,18,1) 100%)',
          }}
        />

        <div className="max-w-7xl mx-auto text-center relative z-10 w-full">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-primary/20 text-primary mb-6">
            <span className="live-indicator__dot" style={{ width: 6, height: 6 }} />
            <span className="live-indicator__label">Real-Time Sports Intelligence</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-display text-white mb-6 tracking-tight uppercase">
            BORN TO BLAZE THE
            <br />
            <span className="text-gradient-brand">PATH LESS BEATEN</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 mb-10 max-w-3xl mx-auto">
            Every game matters to someone. MLB, NFL, NBA, College Baseball, NCAA Football — real
            analytics, not just scores. Built by a fan who got tired of waiting.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="btn-primary px-8 py-4 text-lg rounded-lg"
            >
              Launch Dashboard
            </Link>
            <Link
              href="/pricing"
              className="btn-secondary px-8 py-4 text-lg rounded-lg"
            >
              View Pricing
            </Link>
          </div>
          <div className="mt-10 flex items-center justify-center gap-3">
            <span className="live-indicator">
              <span className="live-indicator__dot" />
              <span className="live-indicator__label">LIVE</span>
            </span>
            <span className="text-white/50 text-sm">Data streaming from official sources</span>
          </div>
        </div>
      </section>

      {/* Live Scores Hub - Defaults to College Baseball */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-charcoal/50">
        <div className="max-w-7xl mx-auto">
          <HomeLiveScores />
        </div>
      </section>

      {/* Sports Coverage */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-charcoal">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-display text-white text-center mb-12 uppercase tracking-wide">
            COVERAGE
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {sports.map((sport) => (
              <Link key={sport.name} href={sport.href}>
                <div className="glass-default p-6 hover:border-primary transition-all text-center h-full relative">
                  {sport.comingSoon && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 text-xs font-semibold bg-gold/20 text-gold rounded-full">
                      Coming Soon
                    </span>
                  )}
                  <span className="text-5xl mb-4 block">{sport.icon}</span>
                  <h3 className="text-xl font-semibold text-white mb-2">{sport.name}</h3>
                  <p className="text-gray-400 text-sm">{sport.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-display text-white text-center mb-12 uppercase tracking-wide">
            FEATURES
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="glass-subtle p-6">
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
                  <span className="text-2xl">{feature.icon}</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <Link href="/" className="text-xl font-display text-primary uppercase tracking-wider">
                Blaze Sports Intel
              </Link>
              <p className="text-gray-500 text-sm mt-2">
                &copy; {new Date().getFullYear()} Blaze Sports Intel. All rights reserved.
              </p>
            </div>
            <div className="flex gap-8">
              <Link href="/about" className="text-gray-400 hover:text-white transition-colors">
                About
              </Link>
              <Link href="/pricing" className="text-gray-400 hover:text-white transition-colors">
                Pricing
              </Link>
              <a
                href="mailto:ahump20@outlook.com"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Contact
              </a>
              <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
