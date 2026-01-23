import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Footer } from '@/components/layout-ds/Footer';

export const metadata = {
  title: 'Methodology | Blaze Sports Intel - Data Sources & Accuracy',
  description:
    'Learn how BSI collects, validates, and displays sports data. Our sources, refresh rates, and commitment to accuracy.',
};

const dataSources = [
  {
    name: 'MLB Stats API',
    description: 'Official Major League Baseball data feed via Highlightly Pro',
    refresh: '15-30 seconds during live games',
    coverage: 'Real-time scores, play-by-play, box scores, rosters, player stats',
    reliability: '99.9%',
  },
  {
    name: 'ESPN API',
    description: 'Live scores and standings across major sports leagues',
    refresh: '30 seconds for live games, 5 minutes otherwise',
    coverage: 'MLB, NFL, NBA, NCAA scores, standings, and schedules',
    reliability: '99.5%',
  },
  {
    name: 'NCAA Official Sources',
    description: 'Direct feeds from conference and NCAA portals',
    refresh: '1-5 minutes depending on source',
    coverage: 'D1 baseball, football, basketball standings and rankings',
    reliability: '98%',
  },
  {
    name: 'D1Baseball & On3',
    description: 'Transfer portal tracking and recruiting data',
    refresh: 'Real-time via webhooks when available',
    coverage: 'Portal entries, commitments, withdrawals, NIL valuations',
    reliability: '97%',
  },
];

const principles = [
  {
    icon: '🎯',
    title: 'Accuracy Over Speed',
    description:
      'We validate data before displaying it. A 30-second delay beats showing wrong information. Every API response is checked for schema consistency before reaching your screen.',
  },
  {
    icon: '📊',
    title: 'Source Transparency',
    description:
      'Every data point includes its source and timestamp. Look for the "Data Source" badge at the bottom of any stats section. You always know where the numbers come from.',
  },
  {
    icon: '🔄',
    title: 'Graceful Degradation',
    description:
      'When a primary source fails, we fall back to cached data with a clear "stale data" indicator. You never see a blank screen—you see the last known good data with proper context.',
  },
  {
    icon: '⚡',
    title: 'Edge-First Architecture',
    description:
      'Built on Cloudflare Workers with global edge caching. Data is served from the closest edge node to you, typically under 100ms response time anywhere in the world.',
  },
];

const stats = [
  { value: '300+', label: 'D1 Baseball Programs' },
  { value: '30', label: 'MLB Teams' },
  { value: '32', label: 'NFL Teams' },
  { value: '30', label: 'NBA Teams' },
  { value: '<100ms', label: 'Avg Response Time' },
  { value: '99.9%', label: 'Uptime Target' },
];

const refreshRates = [
  { context: 'Live MLB/NFL/NBA games', rate: '15-30 seconds' },
  { context: 'Live college games', rate: '30-60 seconds' },
  { context: 'Standings & rankings', rate: '5-15 minutes' },
  { context: 'Transfer portal updates', rate: 'Real-time (webhook)' },
  { context: 'Player stats & rosters', rate: '1-4 hours' },
  { context: 'Historical data', rate: 'Daily batch' },
];

export default function MethodologyPage() {
  return (
    <>
      <main id="main-content">
        {/* Hero */}
        <Section padding="lg" className="relative overflow-hidden pt-24">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />

          <Container>
            <nav className="flex items-center gap-2 text-sm mb-6">
              <Link
                href="/about"
                className="text-text-tertiary hover:text-burnt-orange transition-colors"
              >
                About
              </Link>
              <span className="text-text-tertiary">/</span>
              <span className="text-white font-medium">Methodology</span>
            </nav>

            <Badge variant="primary" className="mb-4">
              How We Work
            </Badge>

            <h1 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-display text-gradient-blaze mb-6">
              Data Methodology
            </h1>

            <p className="text-xl text-text-secondary max-w-3xl leading-relaxed">
              Transparent about where our data comes from, how often it updates, and what happens
              when things go wrong. No black boxes.
            </p>
          </Container>
        </Section>

        {/* Stats Overview */}
        <Section padding="md" background="charcoal" borderTop>
          <Container>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-3xl font-bold text-burnt-orange font-display">{stat.value}</p>
                  <p className="text-text-tertiary text-sm mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </Container>
        </Section>

        {/* Data Sources */}
        <Section padding="lg" borderTop>
          <Container>
            <h2 className="text-3xl font-display font-bold text-white mb-4">Data Sources</h2>
            <p className="text-text-secondary mb-8 max-w-2xl">
              We aggregate from multiple official and validated third-party sources. Each source is
              monitored for uptime and data quality.
            </p>

            <div className="grid gap-6 md:grid-cols-2">
              {dataSources.map((source) => (
                <Card key={source.name} variant="default" padding="lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{source.name}</CardTitle>
                      <Badge variant="success" className="text-xs">
                        {source.reliability} reliable
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-text-secondary text-sm mb-4">{source.description}</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-text-tertiary">Refresh Rate:</span>
                        <span className="text-white">{source.refresh}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-tertiary">Coverage:</span>
                        <span className="text-text-secondary text-right max-w-[60%]">
                          {source.coverage}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Container>
        </Section>

        {/* Refresh Rates */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <h2 className="text-3xl font-display font-bold text-white mb-4">Refresh Rates</h2>
            <p className="text-text-secondary mb-8 max-w-2xl">
              Different data types update at different intervals based on how frequently the
              underlying source changes.
            </p>

            <Card variant="default" padding="lg">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle">
                      <th className="text-left py-3 px-4 text-text-tertiary font-medium">
                        Context
                      </th>
                      <th className="text-right py-3 px-4 text-text-tertiary font-medium">
                        Refresh Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {refreshRates.map((rate, idx) => (
                      <tr
                        key={rate.context}
                        className={idx !== refreshRates.length - 1 ? 'border-b border-border-subtle' : ''}
                      >
                        <td className="py-3 px-4 text-white">{rate.context}</td>
                        <td className="py-3 px-4 text-burnt-orange font-mono text-right">
                          {rate.rate}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </Container>
        </Section>

        {/* Principles */}
        <Section padding="lg" borderTop>
          <Container>
            <h2 className="text-3xl font-display font-bold text-white mb-4">
              Our Data Principles
            </h2>
            <p className="text-text-secondary mb-8 max-w-2xl">
              The rules we follow when collecting, validating, and displaying data.
            </p>

            <div className="grid gap-6 md:grid-cols-2">
              {principles.map((principle) => (
                <Card key={principle.title} variant="default" padding="lg">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-burnt-orange/20 flex items-center justify-center text-2xl flex-shrink-0">
                      {principle.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">{principle.title}</h3>
                      <p className="text-text-secondary text-sm leading-relaxed">
                        {principle.description}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Container>
        </Section>

        {/* Error Handling */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <h2 className="text-3xl font-display font-bold text-white mb-4">
              When Things Go Wrong
            </h2>
            <p className="text-text-secondary mb-8 max-w-2xl">
              APIs fail. Networks hiccup. Here&apos;s how we handle it.
            </p>

            <div className="grid gap-6 md:grid-cols-3">
              <Card variant="default" padding="lg">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-warning/20 flex items-center justify-center mx-auto mb-4">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-8 h-8 text-warning"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-white mb-2">Stale Data Badge</h3>
                  <p className="text-text-secondary text-sm">
                    When data is older than expected, we show a yellow badge with the last update
                    time.
                  </p>
                </div>
              </Card>

              <Card variant="default" padding="lg">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-8 h-8 text-error"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-white mb-2">Unavailable State</h3>
                  <p className="text-text-secondary text-sm">
                    When a source is completely down, we show a clear error with retry option.
                  </p>
                </div>
              </Card>

              <Card variant="default" padding="lg">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-8 h-8 text-success"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-white mb-2">Auto-Retry</h3>
                  <p className="text-text-secondary text-sm">
                    Failed requests automatically retry with exponential backoff. Most issues
                    resolve in seconds.
                  </p>
                </div>
              </Card>
            </div>
          </Container>
        </Section>

        {/* CTA */}
        <Section padding="lg" borderTop>
          <Container>
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-2xl font-display font-bold text-white mb-4">
                Questions about our data?
              </h2>
              <p className="text-text-secondary mb-8">
                We&apos;re transparent about how we work. If you spot an issue or have questions
                about a specific data point, let us know.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="mailto:data@blazesportsintel.com"
                  className="px-6 py-3 bg-burnt-orange text-white rounded-lg font-semibold hover:bg-burnt-orange/90 transition-colors"
                >
                  Contact Data Team
                </Link>
                <Link
                  href="/about"
                  className="px-6 py-3 border border-burnt-orange text-burnt-orange rounded-lg font-semibold hover:bg-burnt-orange hover:text-white transition-colors"
                >
                  Read Our Story
                </Link>
              </div>
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
