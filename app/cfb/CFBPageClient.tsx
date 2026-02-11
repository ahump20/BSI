'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { CFBGamesList, CFBArticleList } from '@/components/cfb';


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
                    AI-generated previews analyzing matchups, key players, and predictions for
                    upcoming games.
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
                  <span className="text-sm text-text-tertiary">
                    Powered by Workers AI + SportsDataIO
                  </span>
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
                    Post-game analysis breaking down what happened, standout performers, and key
                    moments.
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

        {/* Live Data Section */}
        <Section padding="lg" background="midnight" borderTop>
          <Container>
            <ScrollReveal>
              <div className="text-center mb-12">
                <span className="kicker">Live Coverage</span>
                <h2 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display mt-2">
                  CFB <span className="text-gradient-blaze">Data Hub</span>
                </h2>
                <p className="text-text-secondary mt-4 max-w-2xl mx-auto">
                  Live scores, conference standings, and rankings powered by ESPN.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <ScrollReveal delay={0}>
                <Link href="/cfb/scores">
                  <Card variant="hover" padding="lg" className="h-full">
                    <div className="w-12 h-12 mb-5 bg-burnt-orange/15 rounded-xl flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-burnt-orange fill-none stroke-[1.5]">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-3">Live Scores</h3>
                    <p className="text-text-tertiary text-sm leading-relaxed mb-4">
                      Real-time scores and game updates for all FBS teams.
                    </p>
                    <div className="flex items-center pt-4 border-t border-border-subtle">
                      <Badge variant="success">Live</Badge>
                    </div>
                  </Card>
                </Link>
              </ScrollReveal>
              <ScrollReveal delay={100}>
                <Link href="/cfb/standings">
                  <Card variant="hover" padding="lg" className="h-full">
                    <div className="w-12 h-12 mb-5 bg-burnt-orange/15 rounded-xl flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-burnt-orange fill-none stroke-[1.5]">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <line x1="3" y1="9" x2="21" y2="9" />
                        <line x1="9" y1="21" x2="9" y2="9" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-3">Conference Standings</h3>
                    <p className="text-text-tertiary text-sm leading-relaxed mb-4">
                      Complete standings for SEC, Big Ten, Big 12, ACC, and all FBS conferences.
                    </p>
                    <div className="flex items-center pt-4 border-t border-border-subtle">
                      <Badge variant="success">Live</Badge>
                    </div>
                  </Card>
                </Link>
              </ScrollReveal>
              <ScrollReveal delay={200}>
                <Card variant="default" padding="lg" className="h-full">
                  <div className="w-12 h-12 mb-5 bg-burnt-orange/15 rounded-xl flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-burnt-orange fill-none stroke-[1.5]">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-3">Rankings & Analytics</h3>
                  <p className="text-text-tertiary text-sm leading-relaxed mb-4">
                    AP Top 25, playoff projections, and advanced analytics coming soon.
                  </p>
                  <div className="flex items-center pt-4 border-t border-border-subtle">
                    <Badge variant="warning">Coming Soon</Badge>
                  </div>
                </Card>
              </ScrollReveal>
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
