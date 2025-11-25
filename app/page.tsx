import Link from 'next/link';

export default function HomePage() {
  return (
    <main id="main-content" className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-fixed bg-midnight/80 backdrop-blur-glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <img
                src="/images/logo/blaze-logo.png"
                alt="Blaze Sports Intel"
                className="h-10 w-auto"
              />
              <span className="font-display text-xl text-white tracking-wide">
                BLAZE SPORTS INTEL
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <Link href="/dashboard" className="text-white/70 hover:text-white transition-colors">
                Dashboard
              </Link>
              <Link href="/sports/mlb" className="text-white/70 hover:text-white transition-colors">
                MLB
              </Link>
              <Link href="/sports/nfl" className="text-white/70 hover:text-white transition-colors">
                NFL
              </Link>
              <Link href="/sports/nba" className="text-white/70 hover:text-white transition-colors">
                NBA
              </Link>
              <Link href="/pricing" className="text-white/70 hover:text-white transition-colors">
                Pricing
              </Link>
              <Link href="/dashboard" className="btn-primary text-sm">
                Get Started
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-burnt-orange/20 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto text-center">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-burnt-orange/20 text-burnt-orange mb-6">
            Real-Time Sports Intelligence
          </span>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-display text-white mb-6 tracking-tight">
            QUANTIFYING
            <br />
            <span className="text-gradient-brand">INSTINCT</span>
          </h1>

          <p className="text-xl text-white/70 max-w-2xl mx-auto mb-10">
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
      </section>

      {/* Sports Grid */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-display text-white text-center mb-12">COVERAGE</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'MLB', icon: 'baseball', href: '/sports/mlb' },
              { name: 'NFL', icon: 'football', href: '/sports/nfl' },
              { name: 'NBA', icon: 'basketball', href: '/sports/nba' },
              { name: 'NCAA', icon: 'college', href: '/college-baseball/' },
            ].map((sport) => (
              <Link key={sport.name} href={sport.href}>
                <div className="glass-card-hover p-6 text-center cursor-pointer">
                  <span className="text-5xl mb-4 block">
                    {sport.icon === 'baseball' && '⚾'}
                    {sport.icon === 'football' && '🏈'}
                    {sport.icon === 'basketball' && '🏀'}
                    {sport.icon === 'college' && '🎓'}
                  </span>
                  <h3 className="text-xl font-display text-white mb-2">{sport.name}</h3>
                  <p className="text-white/50 text-sm">Live scores, standings &amp; stats</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-background-secondary">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-display text-white text-center mb-12">FEATURES</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-card p-6">
              <div className="w-12 h-12 rounded-lg gradient-brand flex items-center justify-center mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Real-Time Data</h3>
              <p className="text-white/60">
                Live scores updated every 30 seconds. Never miss a play with instant notifications.
              </p>
            </div>

            <div className="glass-card p-6">
              <div className="w-12 h-12 rounded-lg gradient-brand flex items-center justify-center mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Predictive Analytics</h3>
              <p className="text-white/60">
                Monte Carlo simulations and win probability models for every game.
              </p>
            </div>

            <div className="glass-card p-6">
              <div className="w-12 h-12 rounded-lg gradient-brand flex items-center justify-center mb-4">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Mobile-First</h3>
              <p className="text-white/60">
                Designed for mobile devices first. Access your analytics anywhere.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img
                src="/images/logo/blaze-logo.png"
                alt="Blaze Sports Intel"
                className="h-8 w-auto"
              />
              <span className="text-white/50">2025 Blaze Intelligence. All rights reserved.</span>
            </div>

            <nav className="flex items-center gap-6 text-sm">
              <Link href="/privacy" className="text-white/50 hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-white/50 hover:text-white transition-colors">
                Terms
              </Link>
              <Link
                href="/accessibility"
                className="text-white/50 hover:text-white transition-colors"
              >
                Accessibility
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </main>
  );
}
