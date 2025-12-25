'use client';

/**
 * BSI Homepage - Championship Level
 *
 * Premium homepage with:
 * - Three.js ember particle hero
 * - Glass morphism sport cards
 * - Founder quote section
 * - Full-width footer
 */

import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamic import HeroSection (with Three.js) - SSR disabled for WebGL
const HeroSection = dynamic(
  () => import('@/components/hero/HeroSection').then((mod) => mod.HeroSection),
  {
    ssr: false,
    loading: () => (
      <section className="relative min-h-screen bg-midnight flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-burnt-orange-500/30 border-t-burnt-orange-500 rounded-full animate-spin" />
      </section>
    ),
  }
);

// Sport Icons as SVG components for crisp rendering
const BaseballIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10" stroke="currentColor" strokeWidth={1.5}>
    <circle cx="12" cy="12" r="10" />
    <path d="M5 12C5 12 8 9 12 9C16 9 19 12 19 12" />
    <path d="M5 12C5 12 8 15 12 15C16 15 19 12 19 12" />
  </svg>
);

const FootballIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10" stroke="currentColor" strokeWidth={1.5}>
    <ellipse cx="12" cy="12" rx="10" ry="6" transform="rotate(45 12 12)" />
    <path d="M12 7L12 17M9 10L15 14M15 10L9 14" />
  </svg>
);

const BasketballIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10" stroke="currentColor" strokeWidth={1.5}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2V22M2 12H22" />
    <path d="M4.5 4.5C8 8 8 16 4.5 19.5M19.5 4.5C16 8 16 16 19.5 19.5" />
  </svg>
);

const StadiumIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10" stroke="currentColor" strokeWidth={1.5}>
    <path d="M3 21V10L12 3L21 10V21" />
    <path d="M3 14H21" />
    <rect x="8" y="14" width="8" height="7" />
  </svg>
);

const sports = [
  {
    name: 'College Baseball',
    icon: BaseballIcon,
    href: '/college-baseball',
    description: 'D1 standings, rankings & complete box scores',
    accent: 'group-hover:text-baseball group-hover:border-baseball/50',
    bgAccent: 'group-hover:bg-baseball/10',
  },
  {
    name: 'MLB',
    icon: BaseballIcon,
    href: '/mlb',
    description: 'Live scores, standings & Statcast analytics',
    accent: 'group-hover:text-cardinals-DEFAULT group-hover:border-cardinals-DEFAULT/50',
    bgAccent: 'group-hover:bg-cardinals-DEFAULT/10',
  },
  {
    name: 'NFL',
    icon: FootballIcon,
    href: '/nfl',
    description: 'Real-time scores, standings & team intel',
    accent: 'group-hover:text-titans-light group-hover:border-titans-light/50',
    bgAccent: 'group-hover:bg-titans-light/10',
  },
  {
    name: 'NBA',
    icon: BasketballIcon,
    href: '/nba',
    description: 'Live games, standings & performance data',
    accent: 'group-hover:text-grizzlies-secondary group-hover:border-grizzlies-secondary/50',
    bgAccent: 'group-hover:bg-grizzlies-secondary/10',
  },
  {
    name: 'CFB',
    icon: StadiumIcon,
    href: '/cfb',
    description: 'College football analytics & rankings',
    accent: 'group-hover:text-longhorns group-hover:border-longhorns/50',
    bgAccent: 'group-hover:bg-longhorns/10',
    comingSoon: true,
  },
];

const features = [
  {
    icon: '⚡',
    title: 'Real-Time Data',
    description: 'Live scores updated every 30 seconds. No delays, no stale data.',
    gradient: 'from-burnt-orange-500 to-ember',
  },
  {
    icon: '🎯',
    title: 'College Baseball First',
    description: 'ESPN treats it like an afterthought. We built what fans actually deserve.',
    gradient: 'from-gold to-gold-600',
  },
  {
    icon: '📱',
    title: 'Mobile-First Design',
    description: 'Designed for how you actually watch games—on your phone, on the couch.',
    gradient: 'from-success to-success-light',
  },
];

export default function HomePage() {
  return (
    <main id="main-content" className="min-h-screen bg-midnight">
      {/* Three.js Hero Section with Ember Particles */}
      <HeroSection />

      {/* Sports Coverage - Glass Cards */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-midnight to-charcoal-900 relative">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-burnt-orange-500/20 text-burnt-orange-400 mb-4">
              Coverage
            </span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white">
              EVERY GAME MATTERS
            </h2>
            <p className="mt-4 text-lg text-white/60 max-w-2xl mx-auto">
              From the College World Series to Sunday Night Football—real analytics, not just scores.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {sports.map((sport, index) => (
              <Link key={sport.name} href={sport.href} className="group">
                <div
                  className={`bsi-glass relative p-6 rounded-2xl border border-white/10 ${sport.accent} transition-all duration-500 hover:scale-[1.02] hover:shadow-glow-sm h-full flex flex-col items-center text-center`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {sport.comingSoon && (
                    <span className="absolute top-3 right-3 px-2.5 py-1 text-xs font-bold bg-gold/20 text-gold rounded-full border border-gold/30">
                      Soon
                    </span>
                  )}

                  <div
                    className={`w-16 h-16 rounded-xl bg-white/5 ${sport.bgAccent} flex items-center justify-center mb-4 transition-all duration-300 text-white/60 ${sport.accent}`}
                  >
                    <sport.icon />
                  </div>

                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-burnt-orange-400 transition-colors">
                    {sport.name}
                  </h3>
                  <p className="text-sm text-white/50 leading-relaxed">{sport.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Live Status Banner */}
      <section className="py-4 px-4 bg-charcoal-800/50 border-y border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-4">
          <span className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-green-400 font-semibold text-sm">LIVE</span>
          </span>
          <span className="text-white/50 text-sm">Real-time data streaming from official sources</span>
        </div>
      </section>

      {/* Features - Premium Cards */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-charcoal-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-gold/20 text-gold mb-4">
              Why BSI
            </span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white">BUILT DIFFERENT</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group relative bg-charcoal-800/50 p-8 rounded-2xl border border-white/10 hover:border-burnt-orange-500/30 transition-all duration-500 hover:-translate-y-2"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                >
                  <span className="text-2xl">{feature.icon}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-white/60 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote / Founder Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-charcoal-900 via-midnight to-charcoal-900 relative overflow-hidden">
        {/* Background accent */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-burnt-orange-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <svg
            className="w-12 h-12 mx-auto text-burnt-orange-500/40 mb-8"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
          </svg>

          <blockquote className="text-2xl md:text-3xl font-serif text-white/90 leading-relaxed mb-8">
            ESPN treats college baseball like an afterthought. Fans check scores at 11 PM and get a
            paragraph if they're lucky.
            <span className="text-burnt-orange-400"> I got tired of waiting for someone else to fix it.</span>
          </blockquote>

          <div className="flex items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-burnt-orange-500 to-burnt-orange-600 flex items-center justify-center text-white font-bold">
              AH
            </div>
            <div className="text-left">
              <div className="text-white font-semibold">Austin Humphrey</div>
              <div className="text-white/50 text-sm">Founder, Blaze Sports Intel</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-charcoal-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-6">
            Ready to experience real sports intel?
          </h2>
          <p className="text-lg text-white/60 mb-10 max-w-2xl mx-auto">
            Join fans who refuse to settle for box scores and headlines. Get the data that actually matters.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-burnt-orange-500 to-burnt-orange-600 hover:from-burnt-orange-600 hover:to-burnt-orange-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:shadow-glow-md"
            >
              Start Free Trial
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center justify-center gap-2 border-2 border-white/20 hover:border-burnt-orange-500 text-white hover:text-burnt-orange-400 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300"
            >
              Learn Our Story
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4 border-t border-white/10 bg-midnight">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-burnt-orange-500 to-burnt-orange-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">BS</span>
                </div>
                <span className="text-xl font-display font-bold text-white">BSI</span>
              </Link>
              <p className="text-white/50 text-sm leading-relaxed">
                Born to Blaze the Path Less Beaten. Real sports analytics for fans who care.
              </p>
              <p className="text-white/30 text-xs mt-4">Memphis → Texas · Est. 1995</p>
            </div>

            {/* Sports */}
            <div>
              <h4 className="text-white font-semibold mb-4">Sports</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/college-baseball" className="text-white/50 hover:text-burnt-orange-400 transition-colors text-sm">
                    College Baseball
                  </Link>
                </li>
                <li>
                  <Link href="/mlb" className="text-white/50 hover:text-burnt-orange-400 transition-colors text-sm">
                    MLB
                  </Link>
                </li>
                <li>
                  <Link href="/nfl" className="text-white/50 hover:text-burnt-orange-400 transition-colors text-sm">
                    NFL
                  </Link>
                </li>
                <li>
                  <Link href="/nba" className="text-white/50 hover:text-burnt-orange-400 transition-colors text-sm">
                    NBA
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className="text-white/50 hover:text-burnt-orange-400 transition-colors text-sm">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="text-white/50 hover:text-burnt-orange-400 transition-colors text-sm">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-white/50 hover:text-burnt-orange-400 transition-colors text-sm">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="text-white/50 hover:text-burnt-orange-400 transition-colors text-sm">
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/privacy" className="text-white/50 hover:text-burnt-orange-400 transition-colors text-sm">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-white/50 hover:text-burnt-orange-400 transition-colors text-sm">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/40 text-sm">© 2025 Blaze Sports Intel. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a
                href="mailto:austin@blazesportsintel.com"
                className="text-white/40 hover:text-burnt-orange-400 transition-colors text-sm"
              >
                austin@blazesportsintel.com
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
