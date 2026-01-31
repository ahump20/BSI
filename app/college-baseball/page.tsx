import { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, LiveBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';

export const metadata: Metadata = {
  title: 'College Baseball | Blaze Sports Intel',
  description:
    'NCAA Division I baseball coverage with box scores, conference standings, RPI rankings, team rosters, and player statistics for all 300+ D1 programs.',
  openGraph: {
    title: 'College Baseball | Blaze Sports Intel',
    description:
      'NCAA Division I baseball coverage with box scores, standings, and analytics for 300+ D1 programs.',
    url: 'https://blazesportsintel.com/college-baseball',
    images: [{ url: '/images/texas-soil.jpg' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'College Baseball | Blaze Sports Intel',
    description:
      'NCAA Division I baseball coverage. Real-time scores and analytics for 300+ D1 programs.',
  },
};

// Primary features — large cards at top of page
const primaryFeatures = [
  {
    href: '/college-baseball/scores',
    title: 'Live Scores',
    description: 'Real-time box scores for every D1 game, updated every 30 seconds.',
    isLive: true,
  },
  {
    href: '/college-baseball/standings',
    title: 'Standings',
    description: 'Conference standings with RPI, strength of schedule, and projections.',
  },
  {
    href: '/college-baseball/rankings',
    title: 'Rankings',
    description: 'D1Baseball Top 25 updated weekly with full conference breakdowns.',
  },
];

// Secondary features — compact chip bar
const secondaryFeatures = [
  { label: 'Teams', href: '/college-baseball/teams' },
  { label: 'Players', href: '/college-baseball/players' },
  { label: 'Transfer Portal', href: '/college-baseball/transfer-portal' },
  { label: 'Conferences', href: '/college-baseball/standings' },
];

const top5Rankings = [
  { rank: 1, team: 'Texas A&M', conference: 'SEC' },
  { rank: 2, team: 'Florida', conference: 'SEC' },
  { rank: 3, team: 'LSU', conference: 'SEC' },
  { rank: 4, team: 'Texas', conference: 'SEC' },
  { rank: 5, team: 'Tennessee', conference: 'SEC' },
];

const conferences = [
  { name: 'SEC', teams: 16, href: '/college-baseball/standings?conference=sec' },
  { name: 'ACC', teams: 14, href: '/college-baseball/standings?conference=acc' },
  { name: 'Big 12', teams: 16, href: '/college-baseball/standings?conference=big12' },
  { name: 'Pac-12', teams: 4, href: '/college-baseball/standings?conference=pac12' },
  { name: 'Big Ten', teams: 13, href: '/college-baseball/standings?conference=bigten' },
  { name: 'Sun Belt', teams: 14, href: '/college-baseball/standings?conference=sunbelt' },
  { name: 'AAC', teams: 11, href: '/college-baseball/standings?conference=aac' },
  { name: 'All Conferences', teams: 32, href: '/college-baseball/standings' },
];

export default function CollegeBaseballPage() {
  return (
    <>
      <main id="main-content">
        {/* Hero Section */}
        <Section padding="lg" className="relative overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/15 via-transparent to-transparent pointer-events-none" />

          <Container center>
            <ScrollReveal direction="up">
              <Badge variant="success" className="mb-4">
                <span className="w-2 h-2 bg-success rounded-full animate-pulse mr-2" />
                NCAA Division I Baseball
              </Badge>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-center uppercase tracking-display mb-4">
                NCAA Division I <span className="text-gradient-blaze">Baseball</span>
              </h1>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={150}>
              <p className="text-gold font-semibold text-lg tracking-wide text-center mb-4">
                Coverage this sport has always deserved.
              </p>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={200}>
              <p className="text-text-secondary text-center max-w-2xl mx-auto mb-8">
                Complete box scores with batting lines, pitching stats, and play-by-play for every
                D1 game. SEC, Big 12, ACC—all 300+ programs, covered like they matter. Because they
                do.
              </p>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={250}>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link href="/college-baseball/scores">
                  <Button variant="primary" size="lg">
                    View Live Games
                  </Button>
                </Link>
                <Link href="/college-baseball/standings">
                  <Button variant="secondary" size="lg">
                    Conference Standings
                  </Button>
                </Link>
              </div>
            </ScrollReveal>

            {/* Stats Bar */}
            <ScrollReveal direction="up" delay={300}>
              <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 glass-card rounded-2xl">
                <div className="text-center p-4">
                  <div className="font-display text-3xl font-bold text-burnt-orange">300+</div>
                  <div className="text-xs uppercase tracking-wider text-text-tertiary mt-1">
                    Division I Teams
                  </div>
                </div>
                <div className="text-center p-4">
                  <div className="font-display text-3xl font-bold text-burnt-orange">32</div>
                  <div className="text-xs uppercase tracking-wider text-text-tertiary mt-1">
                    Conferences
                  </div>
                </div>
                <div className="text-center p-4">
                  <div className="font-display text-3xl font-bold text-burnt-orange">Live</div>
                  <div className="text-xs uppercase tracking-wider text-text-tertiary mt-1">
                    Real-Time Scores
                  </div>
                </div>
                <div className="text-center p-4">
                  <div className="font-display text-3xl font-bold text-burnt-orange">Full</div>
                  <div className="text-xs uppercase tracking-wider text-text-tertiary mt-1">
                    Box Scores
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Features Section */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal>
              <div className="text-center mb-12">
                <span className="kicker">Complete Coverage</span>
                <h2 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display mt-2">
                  Every D1 Program, <span className="text-gradient-blaze">Actually Covered</span>
                </h2>
                <p className="text-text-secondary mt-4 max-w-2xl mx-auto">
                  Full box scores—not just final scores. Conference standings. Rosters. The coverage
                  college baseball deserves but rarely gets.
                </p>
              </div>
            </ScrollReveal>

            {/* Primary features — 3 large cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {primaryFeatures.map((feature, index) => (
                <ScrollReveal key={feature.title} delay={index * 100}>
                  <Link href={feature.href} className="block group">
                    <Card variant="hover" padding="lg" className="h-full relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-burnt-orange to-ember opacity-0 group-hover:opacity-100 transition-opacity" />

                      <h3 className="text-lg font-semibold text-white mb-3">{feature.title}</h3>
                      <p className="text-text-tertiary text-sm leading-relaxed mb-4">
                        {feature.description}
                      </p>

                      <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
                        {feature.isLive ? <LiveBadge /> : <span />}
                        <span className="text-burnt-orange text-sm font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
                          View
                          <svg
                            viewBox="0 0 24 24"
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </span>
                      </div>
                    </Card>
                  </Link>
                </ScrollReveal>
              ))}
            </div>

            {/* Secondary features — compact chip bar */}
            <ScrollReveal delay={300}>
              <div className="flex flex-wrap gap-3 justify-center mt-8">
                {secondaryFeatures.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="px-4 py-2 text-sm font-medium rounded-full border border-border-subtle text-text-secondary hover:text-burnt-orange hover:border-burnt-orange/30 hover:bg-burnt-orange/10 transition-all"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Rankings Section */}
        <Section padding="lg" background="midnight">
          <Container>
            <ScrollReveal>
              <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-3">
                  <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-display">
                    2026 Preseason Top 25
                  </h2>
                  <Badge variant="primary">D1Baseball</Badge>
                </div>
                <Link
                  href="/college-baseball/rankings"
                  className="text-burnt-orange text-sm font-semibold flex items-center gap-2 hover:gap-3 transition-all"
                >
                  Full Rankings
                  <svg
                    viewBox="0 0 24 24"
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {top5Rankings.map((team) => (
                  <Card
                    key={team.rank}
                    variant="hover"
                    padding="md"
                    className="flex items-center gap-4"
                  >
                    <div className="font-display text-2xl font-bold text-burnt-orange min-w-[36px]">
                      {team.rank}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{team.team}</div>
                      <div className="text-xs text-text-tertiary">{team.conference}</div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Conferences Section */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal>
              <div className="text-center mb-12">
                <span className="kicker">All 32 Conferences</span>
                <h2 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display mt-2">
                  Conference <span className="text-gradient-blaze">Coverage</span>
                </h2>
                <p className="text-text-secondary mt-4 max-w-2xl mx-auto">
                  Complete standings, schedules, and analytics for every NCAA Division I conference.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {conferences.map((conf) => (
                  <Link key={conf.name} href={conf.href}>
                    <Card variant="hover" padding="md" className="text-center h-full">
                      <div className="font-semibold text-white">{conf.name}</div>
                      <div className="text-xs text-text-tertiary mt-1">
                        {conf.name === 'All Conferences'
                          ? `View All ${conf.teams}`
                          : `${conf.teams} Teams`}
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* CTA Section */}
        <Section
          padding="lg"
          className="bg-gradient-to-b from-midnight via-charcoal to-midnight relative overflow-hidden"
        >
          {/* Radial glow */}
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />

          <Container center>
            <ScrollReveal>
              <div className="max-w-xl mx-auto text-center relative z-10">
                <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-display mb-4">
                  NCAA Division I <span className="text-gradient-blaze">Baseball Coverage</span>
                </h2>
                <p className="text-text-secondary mb-8">
                  Complete D1 baseball coverage with box scores, standings, and real-time updates
                  for all 300+ programs.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Link href="/college-baseball/scores">
                    <Button variant="primary" size="lg">
                      View Live Games
                    </Button>
                  </Link>
                  <Link href="/">
                    <Button variant="secondary" size="lg">
                      Back to Home
                    </Button>
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
