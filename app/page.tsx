import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamic import HeroSection (client component with Three.js)
const HeroSection = dynamic(() => import('@/components/hero/HeroSection').then(mod => mod.HeroSection), {
  ssr: false,
  loading: () => null,
});

export const metadata = {
  title: 'Blaze Sports Intel | Real-Time Sports Analytics',
  description: 'Professional sports intelligence platform delivering real-time MLB, NFL, NBA, and NCAA analytics. Live scores, predictions, and data-driven insights.',
};

const sports = [
  { name: 'College Baseball', icon: '🎓', href: '/college-baseball', description: 'D1 standings, rankings & box scores' },
  { name: 'MLB', icon: '⚾', href: '/mlb', description: 'Live scores, standings & Statcast' },
  { name: 'NFL', icon: '🏈', href: '/nfl', description: 'Live scores & standings' },
  { name: 'NBA', icon: '🏀', href: '/nba', description: 'Live scores & standings' },
  { name: 'CFB', icon: '🏟️', href: '/cfb', description: 'College football analytics', comingSoon: true },
];

const features = [
  { icon: '📊', title: 'Real-Time Data', description: 'Live scores updated every 30 seconds. Never miss a play.' },
  { icon: '🎯', title: 'College Baseball Focus', description: 'ESPN treats it like an afterthought. We built what fans deserve.' },
  { icon: '📱', title: 'Mobile-First', description: 'Designed for mobile devices first. Access your analytics anywhere.' },
];

export default function HomePage() {
  return (
    <main id="main-content" className="min-h-screen bg-midnight">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-charcoal/95 backdrop-blur-sm z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-xl font-bold text-primary">Blaze Sports Intel</Link>
            <div className="hidden md:flex gap-6">
              <Link href="/college-baseball" className="text-white/70 hover:text-white transition-colors">College Baseball</Link>
              <Link href="/mlb" className="text-white/70 hover:text-white transition-colors">MLB</Link>
              <Link href="/nfl" className="text-white/70 hover:text-white transition-colors">NFL</Link>
              <Link href="/nba" className="text-white/70 hover:text-white transition-colors">NBA</Link>
              <Link href="/dashboard" className="text-white/70 hover:text-white transition-colors">Dashboard</Link>
            </div>
            <Link href="/pricing" className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              Pricing
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        {/* Three.js Ember Particles Background */}
        <HeroSection />

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-primary/20 text-primary mb-6">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            Real-Time Sports Intelligence
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
            BORN TO BLAZE THE<br />
            <span className="text-primary">PATH LESS BEATEN</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 mb-10 max-w-3xl mx-auto">
            Every game matters to someone. MLB, NFL, NBA, College Baseball, NCAA Football—real analytics, not just scores. Built by a fan who got tired of waiting.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard" className="bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors">
              Launch Dashboard
            </Link>
            <Link href="/pricing" className="border border-primary text-primary hover:bg-primary hover:text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors">
              View Pricing
            </Link>
          </div>
          <div className="mt-10 flex items-center justify-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              LIVE
            </span>
            <span className="text-white/50 text-sm">Data streaming from official sources</span>
          </div>
        </div>
      </section>

      {/* Sports Coverage */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-charcoal">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">COVERAGE</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {sports.map((sport) => (
              <Link key={sport.name} href={sport.href}>
                <div className="bg-midnight/50 p-6 rounded-lg border border-white/10 hover:border-primary transition-colors text-center h-full relative">
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
          <h2 className="text-3xl font-bold text-white text-center mb-12">FEATURES</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="bg-charcoal/50 p-6 rounded-lg border border-white/10">
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
              <Link href="/" className="text-xl font-bold text-primary">Blaze Sports Intel</Link>
              <p className="text-gray-500 text-sm mt-2">&copy; 2025 Blaze Sports Intel. All rights reserved.</p>
            </div>
            <div className="flex gap-8">
              <Link href="/about" className="text-gray-400 hover:text-white transition-colors">About</Link>
              <Link href="/pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</Link>
              <a href="mailto:ahump20@outlook.com" className="text-gray-400 hover:text-white transition-colors">Contact</a>
              <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
