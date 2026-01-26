import Link from 'next/link';
import { HeroSectionWrapper } from '@/components/hero/HeroSectionWrapper';
import { HomeLiveScores } from '@/components/home';
import { Footer } from '@/components/layout-ds/Footer';

export const metadata = {
  title: 'Blaze Sports Intel | NCAA Transfer Portal & Real-Time Sports Analytics',
  description:
    'The #1 NCAA Transfer Portal tracker for College Baseball and CFB. Real-time tracking, player stats, and commitment alerts. Plus live scores for MLB, NFL, and NBA.',
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
];

const features = [
  {
    icon: '🔄',
    title: 'Transfer Portal Tracker',
    description:
      'Every D1 transfer. Baseball and football. Updated in real-time, every 30 seconds.',
  },
  {
    icon: '📊',
    title: 'Live Data Intelligence',
    description: '30-second updates. Verified sources. No placeholders, no "check back later."',
  },
  {
    icon: '🎯',
    title: 'Built for the Overlooked',
    description: 'Rice vs. Houston midweek? We have the box score. Your team matters here.',
  },
];

export default function HomePage() {
  return (
    <main id="main-content" className="min-h-screen bg-midnight pt-16 md:pt-20">
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
            BORN TO BLAZE THE
            <br />
            <span className="text-burnt-orange">PATH LESS BEATEN</span>
          </h1>
          <p className="text-xl md:text-2xl text-text-secondary mb-4 max-w-3xl mx-auto">
            Every game matters to someone. Complete coverage for every team.
          </p>
          <p className="text-lg text-text-tertiary mb-10 max-w-3xl mx-auto">
            The #1 NCAA Transfer Portal tracker for College Baseball and CFB.{' '}
            <span className="text-burnt-orange">Real-time intel updated every 30 seconds</span>—not
            when someone remembers to check.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/transfer-portal"
              className="bg-burnt-orange hover:bg-burnt-orange/90 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all hover:shadow-glow-sm inline-flex items-center justify-center gap-2"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
              </span>
              Enter Transfer Portal
            </Link>
            <Link
              href="/dashboard"
              className="border border-burnt-orange text-burnt-orange hover:bg-burnt-orange hover:text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              Launch Dashboard
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

      {/* Transfer Portal Highlight */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-burnt-orange/10 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-burnt-orange/20 text-burnt-orange uppercase tracking-wider mb-4">
                Flagship Feature
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-6">
                NCAA Transfer Portal
                <span className="block text-burnt-orange">Intelligence Hub</span>
              </h2>
              <p className="text-lg text-text-secondary mb-6 leading-relaxed">
                College baseball deserves better coverage—so we built it. Track every D1 transfer in
                real-time. See commitments as they happen. Get alerts for players at your school.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-text-primary">
                  <span className="w-6 h-6 rounded-full bg-success/20 text-success text-sm flex items-center justify-center">
                    ✓
                  </span>
                  Real-time portal entries & commitments
                </li>
                <li className="flex items-center gap-3 text-text-primary">
                  <span className="w-6 h-6 rounded-full bg-success/20 text-success text-sm flex items-center justify-center">
                    ✓
                  </span>
                  Player stats, engagement scores & rankings
                </li>
                <li className="flex items-center gap-3 text-text-primary">
                  <span className="w-6 h-6 rounded-full bg-success/20 text-success text-sm flex items-center justify-center">
                    ✓
                  </span>
                  College Baseball + CFB unified tracker
                </li>
                <li className="flex items-center gap-3 text-text-primary">
                  <span className="w-6 h-6 rounded-full bg-success/20 text-success text-sm flex items-center justify-center">
                    ✓
                  </span>
                  Pro alerts for instant notifications
                </li>
              </ul>
              <Link
                href="/transfer-portal"
                className="inline-flex items-center gap-2 text-burnt-orange font-semibold hover:underline"
              >
                Explore Transfer Portal
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" />
                </svg>
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-burnt-orange/20 to-transparent rounded-2xl blur-3xl" />
              <div className="relative bg-charcoal-900/80 border border-border-subtle rounded-2xl p-6 backdrop-blur">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-text-primary">Latest Portal Activity</h3>
                  <span className="text-xs text-success font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
                    LIVE
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-midnight/50 border border-border-subtle">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-text-primary">Jake Wilson</span>
                      <span className="text-xs text-warning">In Portal</span>
                    </div>
                    <p className="text-sm text-text-secondary">RHP • Texas A&M → ?</p>
                  </div>
                  <div className="p-3 rounded-lg bg-midnight/50 border border-border-subtle">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-text-primary">Marcus Williams</span>
                      <span className="text-xs text-success">Committed</span>
                    </div>
                    <p className="text-sm text-text-secondary">WR • Ohio State → Texas</p>
                  </div>
                  <div className="p-3 rounded-lg bg-midnight/50 border border-border-subtle">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-text-primary">Jaylen Carter</span>
                      <span className="text-xs text-warning">In Portal</span>
                    </div>
                    <p className="text-sm text-text-secondary">QB • Georgia → ?</p>
                  </div>
                </div>
                <Link
                  href="/transfer-portal"
                  className="block mt-4 text-center text-sm text-burnt-orange font-medium hover:underline"
                >
                  View All Entries →
                </Link>
              </div>
            </div>
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
          <h2 className="text-3xl font-display font-bold text-white text-center mb-12">COVERAGE</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {sports.map((sport) => (
              <Link key={sport.name} href={sport.href}>
                <div className="bg-midnight/50 p-6 rounded-xl border border-border-subtle hover:border-burnt-orange/50 transition-all hover:shadow-glow-sm text-center h-full group">
                  <span className="text-5xl mb-4 block">{sport.icon}</span>
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
                <div className="w-12 h-12 rounded-lg bg-burnt-orange/20 flex items-center justify-center mb-4">
                  <span className="text-2xl">{feature.icon}</span>
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
