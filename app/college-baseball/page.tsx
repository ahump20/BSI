import { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, LiveBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Navbar } from '@/components/layout-ds/Navbar';
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

const features = [
  {
    href: '/baseball/rankings',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-burnt-orange fill-none stroke-[1.5]">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
      </svg>
    ),
    title: 'Top 25 Rankings',
    description:
      'D1Baseball weekly Top 25 rankings updated every Monday during the season. View complete rankings 1-25 with conference affiliations.',
    badge: 'Updated Weekly',
    badgeVariant: 'primary' as const,
  },
  {
    href: '/college-baseball/games',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-burnt-orange fill-none stroke-[1.5]">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: 'Live Games & Scores',
    description:
      'Real-time updates with complete box scores, play-by-play, and advanced stats for every NCAA Division I game.',
    badge: 'Live Now',
    badgeVariant: 'success' as const,
    isLive: true,
  },
  {
    href: '/college-baseball/standings',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-burnt-orange fill-none stroke-[1.5]">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="9" y1="21" x2="9" y2="9" />
      </svg>
    ),
    title: 'Conference Standings',
    description:
      'Complete conference and national standings with RPI, strength of schedule, and tournament projections.',
    badge: 'Updated Daily',
    badgeVariant: 'primary' as const,
  },
  {
    href: '/college-baseball/teams',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-burnt-orange fill-none stroke-[1.5]">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: 'Team Pages & Rosters',
    description:
      'Complete team rosters with player positions, stats, and schedules. SEC, ACC, Big 12, Pac-12, and all D1 conferences tracked.',
    badge: '300+ Teams',
    badgeVariant: 'warning' as const,
  },
  {
    href: '/college-baseball/players',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-burnt-orange fill-none stroke-[1.5]">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    title: 'Team Analytics',
    description:
      'Advanced metrics, player stats, recruiting rankings, and historical performance for all D1 programs.',
    badge: 'Pro-Level Stats',
    badgeVariant: 'warning' as const,
  },
  {
    href: '/college-baseball/standings',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-burnt-orange fill-none stroke-[1.5]">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    title: 'Conference Dashboards',
    description:
      'Deep-dive team dashboards with rosters, transfers, draft prospects, schedules, and program history.',
    badge: 'New',
    badgeVariant: 'warning' as const,
  },
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
      <Navbar items={navItems} />

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
                <Link href="/college-baseball/games">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <ScrollReveal key={feature.title} delay={index * 100}>
                  <Link href={feature.href} className="block group">
                    <Card variant="hover" padding="lg" className="h-full relative overflow-hidden">
                      {/* Top accent line on hover */}
                      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-burnt-orange to-ember opacity-0 group-hover:opacity-100 transition-opacity" />

                      <div className="w-12 h-12 mb-5 bg-burnt-orange/15 rounded-xl flex items-center justify-center">
                        {feature.icon}
                      </div>

                      <h3 className="text-lg font-semibold text-white mb-3">{feature.title}</h3>
                      <p className="text-text-tertiary text-sm leading-relaxed mb-4">
                        {feature.description}
                      </p>

                      <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
                        {feature.isLive ? (
                          <LiveBadge />
                        ) : (
                          <Badge variant={feature.badgeVariant}>{feature.badge}</Badge>
                        )}
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
                  href="/baseball/rankings"
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
                  <Link href="/college-baseball/games">
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
