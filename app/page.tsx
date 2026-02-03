import Link from 'next/link';
import { HomeLiveScores } from '@/components/home';
import { HeroVideo } from '@/components/hero/HeroVideo';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';

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

const heroMetrics = [
  { label: 'Live Feeds', value: '400+', note: 'official sources' },
  { label: 'Edge Latency', value: '<50ms', note: 'global response' },
  { label: 'Active Teams', value: '392', note: 'pro + NCAA' },
  { label: 'Signal Refresh', value: '30s', note: 'continuous' },
];

const features = [
  {
    icon: '📡',
    title: 'Signal Fusion',
    description: 'Blend official feeds, momentum shifts, and situational context into one view.',
  },
  {
    icon: '🎯',
    title: 'League-Specific Models',
    description: 'Every sport is tuned independently to avoid generic projections.',
  },
  {
    icon: '⚡',
    title: 'Operator Workflows',
    description: 'Rapid filters, alerts, and narrative stitching for decision-grade speed.',
  },
];

const signalStack = [
  {
    title: 'Live Probability Engine',
    detail: 'Win expectancy + leverage spikes',
  },
  {
    title: 'Tactical Trend Scanner',
    detail: 'Detects outlier shifts in tempo',
  },
  {
    title: 'Roster Impact Matrix',
    detail: 'Injury + workload overlays',
  },
];

export default function HomePage() {
  return (
    <main id="main-content" className="min-h-screen bg-midnight pt-24 md:pt-28">
      <section className="relative overflow-hidden min-h-[80vh] flex items-center">
        <HeroVideo />
        <div className="absolute inset-0 bg-hero-overlay" />
        <div className="absolute inset-0 hero-grid" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
            <ScrollReveal direction="up">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 bg-white/5 text-xs uppercase tracking-[0.3em] text-white/70">
                  Live Signal Mesh
                </div>
                <h1 className="mt-6 text-4xl md:text-6xl font-display leading-[0.95] text-white">
                  Ignite every decision
                  <span className="block text-gradient-brand">with real-time sports intelligence</span>
                </h1>
                <p className="mt-6 text-lg text-white/60 max-w-xl">
                  Blaze Sports Intel turns live data into tactical clarity. Track momentum, detect anomalies,
                  and act before the scoreboard catches up.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                  <Link href="/dashboard" className="btn-primary px-7 py-3 text-sm rounded-full">
                    Open Command Center
                  </Link>
                  <Link href="/pricing" className="btn-secondary px-7 py-3 text-sm rounded-full">
                    View Coverage Map
                  </Link>
                </div>
                <div className="mt-8 flex items-center gap-3">
                  <span className="live-indicator">
                    <span className="live-indicator__dot" />
                    <span className="live-indicator__label">LIVE</span>
                  </span>
                  <span className="text-white/50 text-sm">Streaming official league data</span>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={120}>
              <div className="glass-panel p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-white/40">Command Signal</p>
                    <p className="text-xl font-display mt-2">Live Radar</p>
                  </div>
                  <div className="pulse-dot" />
                </div>
                <div className="mt-6 space-y-4">
                  {heroMetrics.map((metric) => (
                    <div
                      key={metric.label}
                      className="flex items-center justify-between border-b border-white/10 pb-4 last:border-b-0 last:pb-0"
                    >
                      <div>
                        <p className="text-xs uppercase tracking-[0.25em] text-white/40">{metric.label}</p>
                        <p className="text-2xl font-display mt-1 text-white">{metric.value}</p>
                      </div>
                      <p className="text-xs text-white/50 max-w-[120px] text-right">{metric.note}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 rounded-xl border border-white/15 bg-white/5 p-4 text-sm text-white/70">
                  Monitoring 24/7 across live feeds, player signals, and tactical outcomes.
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <section className="py-14 px-4 sm:px-6 lg:px-8 bg-charcoal/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">Live Coverage</p>
              <h2 className="text-3xl font-display text-white mt-2">Real-time Score Hub</h2>
            </div>
            <span className="text-white/50 text-sm">
              Updated every 30 seconds across all active leagues
            </span>
          </div>
          <HomeLiveScores />
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-charcoal">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center text-center mb-12">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Coverage</p>
            <h2 className="text-3xl font-display text-white mt-2">Every League, One Command Layer</h2>
          </div>
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

      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center text-center mb-12">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Workflow</p>
            <h2 className="text-3xl font-display text-white mt-2">Built for Decision Velocity</h2>
          </div>
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

      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background-secondary">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-[1.2fr_0.8fr] gap-8 items-start">
          <div className="glass-default p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Signal Stack</p>
            <h3 className="text-2xl font-display text-white mt-3">Tactical Layers That Move Fast</h3>
            <p className="text-white/60 mt-4">
              From live probability to roster impact, each layer is tuned to expose leverage the moment it appears.
            </p>
            <div className="mt-6 space-y-4">
              {signalStack.map((item) => (
                <div key={item.title} className="flex items-center justify-between border-b border-white/10 pb-4 last:border-b-0 last:pb-0">
                  <div>
                    <p className="text-white font-semibold">{item.title}</p>
                    <p className="text-sm text-white/50">{item.detail}</p>
                  </div>
                  <span className="text-xs uppercase tracking-[0.2em] text-white/40">Active</span>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-subtle p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Next Action</p>
            <h3 className="text-2xl font-display text-white mt-3">Ready to run the board?</h3>
            <p className="text-white/60 mt-4">
              Step into the command center and orchestrate decisions across every league in real time.
            </p>
            <Link href="/dashboard" className="btn-primary mt-6 w-full justify-center rounded-full">
              Launch Dashboard
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
