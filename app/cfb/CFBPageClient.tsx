'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Navbar } from '@/components/layout-ds/Navbar';
import { Footer } from '@/components/layout-ds/Footer';
import { CFBGamesList, CFBArticleList } from '@/components/cfb';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'College Baseball', href: '/college-baseball' },
  { label: 'MLB', href: '/mlb' },
  { label: 'NFL', href: '/nfl' },
  { label: 'CFB', href: '/cfb' },
  { label: 'Dashboard', href: '/dashboard' },
];

const plannedFeatures = [
  {
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-burnt-orange fill-none stroke-[1.5]">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: 'Live Scores',
    description:
      'Real-time scores and game updates for all FBS teams. Quarter-by-quarter scoring during game days.',
    status: 'Coming Soon',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-burnt-orange fill-none stroke-[1.5]">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="9" y1="21" x2="9" y2="9" />
      </svg>
    ),
    title: 'Conference Standings',
    description:
      'Complete standings for SEC, Big Ten, Big 12, ACC, and all FBS conferences with win percentage and conference records.',
    status: 'Coming Soon',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-burnt-orange fill-none stroke-[1.5]">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
      </svg>
    ),
    title: 'AP Top 25 Rankings',
    description:
      'Weekly AP Poll and Coaches Poll rankings updated throughout the season with movement tracking.',
    status: 'Coming Soon',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-burnt-orange fill-none stroke-[1.5]">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: 'Team Profiles',
    description:
      'Rosters, schedules, and statistics for all 134 FBS teams across Power 4 and Group of 5 conferences.',
    status: 'Coming Soon',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-burnt-orange fill-none stroke-[1.5]">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    title: 'Advanced Analytics',
    description:
      'SP+ ratings, EPA metrics, and advanced statistics for teams and players across all FBS programs.',
    status: 'Coming Soon',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-burnt-orange fill-none stroke-[1.5]">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    title: 'Playoff Projections',
    description:
      'College Football Playoff predictions and bracket projections based on current standings and remaining schedules.',
    status: 'Coming Soon',
  },
];

const conferences = [
  { name: 'SEC', teams: 16, description: 'Southeastern Conference' },
  { name: 'Big Ten', teams: 18, description: 'Big Ten Conference' },
  { name: 'Big 12', teams: 16, description: 'Big 12 Conference' },
  { name: 'ACC', teams: 17, description: 'Atlantic Coast Conference' },
  { name: 'Pac-12', teams: 4, description: 'Pacific-12 Conference' },
  { name: 'Mountain West', teams: 12, description: 'Mountain West Conference' },
  { name: 'AAC', teams: 14, description: 'American Athletic Conference' },
  { name: 'Sun Belt', teams: 14, description: 'Sun Belt Conference' },
];

export default function CFBPageClient() {
  return (
    <>
      <Navbar items={navItems} />

      <main id="main-content">
        {/* Hero Section */}
        <Section padding="lg" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/15 via-transparent to-transparent pointer-events-none" />

          <Container center>
            <ScrollReveal direction="up">
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-center uppercase tracking-display mb-4">
                College <span className="text-gradient-blaze">Football</span>
              </h1>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <p className="text-gold font-semibold text-lg tracking-wide text-center mb-4">
                NCAA Division I FBS Coverage
              </p>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={150}>
              <p className="text-text-secondary text-center max-w-2xl mx-auto mb-8">
                Conference standings, live scores, rankings, and advanced analytics for all 134 FBS
                programs. Complete coverage for SEC, Big Ten, Big 12, ACC, and all conferences.
              </p>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={200}>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link href="/dashboard">
                  <Button variant="primary" size="lg">
                    View Dashboard
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="secondary" size="lg">
                    Back to Home
                  </Button>
                </Link>
              </div>
            </ScrollReveal>

            {/* Stats Bar */}
            <ScrollReveal direction="up" delay={250}>
              <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 glass-card rounded-2xl">
                <div className="text-center p-4">
                  <div className="font-display text-3xl font-bold text-burnt-orange">134</div>
                  <div className="text-xs uppercase tracking-wider text-text-tertiary mt-1">
                    FBS Teams
                  </div>
                </div>
                <div className="text-center p-4">
                  <div className="font-display text-3xl font-bold text-burnt-orange">10</div>
                  <div className="text-xs uppercase tracking-wider text-text-tertiary mt-1">
                    Conferences
                  </div>
                </div>
                <div className="text-center p-4">
                  <div className="font-display text-3xl font-bold text-burnt-orange">12</div>
                  <div className="text-xs uppercase tracking-wider text-text-tertiary mt-1">
                    Playoff Teams
                  </div>
                </div>
                <div className="text-center p-4">
                  <div className="font-display text-3xl font-bold text-burnt-orange">13</div>
                  <div className="text-xs uppercase tracking-wider text-text-tertiary mt-1">
                    Week Season
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Game Previews Section */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal>
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
                <div>
                  <Badge variant="primary" className="mb-3">
                    Upcoming Games
                  </Badge>
                  <h2 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display">
                    Game <span className="text-gradient-blaze">Previews</span>
                  </h2>
                  <p className="text-text-secondary mt-3 max-w-xl">
                    AI-generated previews analyzing matchups, key players, and predictions for upcoming games.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-5 h-5 stroke-burnt-orange fill-none stroke-[1.5]"
                  >
                    <rect x="4" y="4" width="16" height="16" rx="2" />
                    <circle cx="9" cy="9" r="1.5" />
                    <circle cx="15" cy="9" r="1.5" />
                    <path d="M9 15h6" />
                  </svg>
                  <span className="text-sm text-text-tertiary">Powered by Workers AI + SportsDataIO</span>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <CFBArticleList type="preview" limit={6} />
            </ScrollReveal>
          </Container>
        </Section>

        {/* Game Recaps Section */}
        <Section padding="lg" background="midnight" borderTop>
          <Container>
            <ScrollReveal>
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
                <div>
                  <Badge variant="success" className="mb-3">
                    Completed Games
                  </Badge>
                  <h2 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display">
                    Game <span className="text-gradient-blaze">Recaps</span>
                  </h2>
                  <p className="text-text-secondary mt-3 max-w-xl">
                    Post-game analysis breaking down what happened, standout performers, and key moments.
                  </p>
                </div>
                <Link href="/cfb/articles" className="hidden md:block">
                  <Button variant="secondary" size="sm">
                    View All Recaps →
                  </Button>
                </Link>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <CFBArticleList type="recap" limit={6} />
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div className="mt-8 text-center md:hidden">
                <Link href="/cfb/articles">
                  <Button variant="secondary">View All Recaps →</Button>
                </Link>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Live Games Section (Original) */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal>
              <div className="text-center mb-12">
                <Badge variant="warning" className="mb-4">
                  Live Games
                </Badge>
                <h2 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display mt-2">
                  Today&apos;s <span className="text-gradient-blaze">Games</span>
                </h2>
                <p className="text-text-secondary mt-4 max-w-2xl mx-auto">
                  Real-time scores and AI-powered insights for today&apos;s matchups.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <CFBGamesList limit={6} />
            </ScrollReveal>
          </Container>
        </Section>

        {/* Features Coming Soon Section */}
        <Section padding="lg" background="midnight" borderTop>
          <Container>
            <ScrollReveal>
              <div className="text-center mb-12">
                <span className="kicker">In Development</span>
                <h2 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display mt-2">
                  Planned <span className="text-gradient-blaze">Features</span>
                </h2>
                <p className="text-text-secondary mt-4 max-w-2xl mx-auto">
                  College football coverage is under active development. Here&apos;s what we&apos;re
                  building.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {plannedFeatures.map((feature, index) => (
                <ScrollReveal key={feature.title} delay={index * 100}>
                  <Card variant="default" padding="lg" className="h-full relative overflow-hidden">
                    <div className="w-12 h-12 mb-5 bg-burnt-orange/15 rounded-xl flex items-center justify-center">
                      {feature.icon}
                    </div>

                    <h3 className="text-lg font-semibold text-white mb-3">{feature.title}</h3>
                    <p className="text-text-tertiary text-sm leading-relaxed mb-4">
                      {feature.description}
                    </p>

                    <div className="flex items-center pt-4 border-t border-border-subtle">
                      <Badge variant="warning">{feature.status}</Badge>
                    </div>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </Container>
        </Section>

        {/* Conferences Section */}
        <Section padding="lg" background="charcoal">
          <Container>
            <ScrollReveal>
              <div className="text-center mb-12">
                <span className="kicker">All FBS Conferences</span>
                <h2 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display mt-2">
                  Conference <span className="text-gradient-blaze">Coverage</span>
                </h2>
                <p className="text-text-secondary mt-4 max-w-2xl mx-auto">
                  Complete coverage for all 10 FBS conferences when available.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {conferences.map((conf) => (
                  <Card key={conf.name} variant="default" padding="md" className="text-center">
                    <div className="font-semibold text-white">{conf.name}</div>
                    <div className="text-xs text-text-tertiary mt-1">{conf.teams} Teams</div>
                  </Card>
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
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />

          <Container center>
            <ScrollReveal>
              <div className="max-w-xl mx-auto text-center relative z-10">
                <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-display mb-4">
                  College Football <span className="text-gradient-blaze">Intelligence</span>
                </h2>
                <p className="text-text-secondary mb-8">
                  Complete FBS football coverage is under development. Check out our fully
                  operational MLB and NFL coverage in the meantime.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Link href="/mlb">
                    <Button variant="primary" size="lg">
                      View MLB Coverage
                    </Button>
                  </Link>
                  <Link href="/nfl">
                    <Button variant="secondary" size="lg">
                      View NFL Coverage
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
