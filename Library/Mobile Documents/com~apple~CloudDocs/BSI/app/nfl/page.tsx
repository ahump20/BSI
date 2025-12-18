'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Navbar } from '@/components/layout-ds/Navbar';
import { Footer } from '@/components/layout-ds/Footer';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'College Baseball', href: '/college-baseball' },
  { label: 'MLB', href: '/mlb' },
  { label: 'NFL', href: '/nfl' },
  { label: 'Dashboard', href: '/dashboard' },
];

const divisions = [
  {
    conference: 'AFC',
    divisions: [
      { name: 'AFC East', teams: ['Bills', 'Dolphins', 'Patriots', 'Jets'] },
      { name: 'AFC North', teams: ['Ravens', 'Bengals', 'Browns', 'Steelers'] },
      { name: 'AFC South', teams: ['Texans', 'Colts', 'Jaguars', 'Titans'] },
      { name: 'AFC West', teams: ['Chiefs', 'Broncos', 'Raiders', 'Chargers'] },
    ],
  },
  {
    conference: 'NFC',
    divisions: [
      { name: 'NFC East', teams: ['Cowboys', 'Eagles', 'Giants', 'Commanders'] },
      { name: 'NFC North', teams: ['Bears', 'Lions', 'Packers', 'Vikings'] },
      { name: 'NFC South', teams: ['Falcons', 'Panthers', 'Saints', 'Buccaneers'] },
      { name: 'NFC West', teams: ['Cardinals', '49ers', 'Seahawks', 'Rams'] },
    ],
  },
];

export default function NFLPage() {
  return (
    <>
      <Navbar items={navItems} />

      <main id="main-content">
        {/* Hero Section */}
        <Section padding="xl" className="relative overflow-hidden pt-24">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/15 via-transparent to-transparent pointer-events-none" />

          <Container>
            <ScrollReveal direction="up">
              <Badge variant="primary" className="mb-4">NFL Coverage</Badge>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <h1 className="font-display text-4xl md:text-6xl font-bold uppercase tracking-display text-gradient-blaze mb-6">
                NFL Intelligence
              </h1>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={150}>
              <p className="text-text-secondary text-lg max-w-2xl mb-8">
                Complete coverage of all 32 NFL teams. Standings, news, and analysis without the network spin.
              </p>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={200}>
              <div className="flex flex-wrap gap-4">
                <Link href="/nfl/standings" className="btn-primary px-6 py-3">
                  View Standings
                </Link>
                <Link href="/nfl/news" className="btn-secondary px-6 py-3">
                  Latest News
                </Link>
                <Link href="/scores" className="btn-secondary px-6 py-3">
                  All Scores
                </Link>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Quick Links */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal>
              <h2 className="font-display text-2xl font-bold text-white mb-8">
                Quick Access
              </h2>
            </ScrollReveal>

            <div className="grid gap-4 md:grid-cols-3">
              <ScrollReveal direction="up" delay={100}>
                <Link href="/nfl/standings" className="block">
                  <Card variant="hover" padding="lg" className="h-full">
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-3xl">🏆</span>
                      <h3 className="text-xl font-display font-bold text-white">Standings</h3>
                    </div>
                    <p className="text-text-secondary text-sm">
                      AFC & NFC standings with playoff positioning, win percentage, and division records.
                    </p>
                    <span className="text-burnt-orange text-sm font-semibold mt-4 block">
                      View Standings →
                    </span>
                  </Card>
                </Link>
              </ScrollReveal>

              <ScrollReveal direction="up" delay={150}>
                <Link href="/nfl/news" className="block">
                  <Card variant="hover" padding="lg" className="h-full">
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-3xl">📰</span>
                      <h3 className="text-xl font-display font-bold text-white">News</h3>
                    </div>
                    <p className="text-text-secondary text-sm">
                      Trades, injuries, draft coverage, and free agency moves from all 32 teams.
                    </p>
                    <span className="text-burnt-orange text-sm font-semibold mt-4 block">
                      Read News →
                    </span>
                  </Card>
                </Link>
              </ScrollReveal>

              <ScrollReveal direction="up" delay={200}>
                <Link href="/scores" className="block">
                  <Card variant="hover" padding="lg" className="h-full">
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-3xl">🏈</span>
                      <h3 className="text-xl font-display font-bold text-white">Scores</h3>
                    </div>
                    <p className="text-text-secondary text-sm">
                      Live scores and game results from around the league.
                    </p>
                    <span className="text-burnt-orange text-sm font-semibold mt-4 block">
                      View Scores →
                    </span>
                  </Card>
                </Link>
              </ScrollReveal>
            </div>
          </Container>
        </Section>

        {/* Divisions Grid */}
        <Section padding="lg" background="midnight">
          <Container>
            <ScrollReveal>
              <h2 className="font-display text-2xl font-bold text-white mb-8">
                All 32 Teams
              </h2>
            </ScrollReveal>

            <div className="grid gap-8 md:grid-cols-2">
              {divisions.map((conf, confIndex) => (
                <div key={conf.conference}>
                  <ScrollReveal direction="up" delay={confIndex * 100}>
                    <h3 className="text-xl font-display font-bold text-burnt-orange mb-4">
                      {conf.conference}
                    </h3>
                  </ScrollReveal>

                  <div className="space-y-4">
                    {conf.divisions.map((div, divIndex) => (
                      <ScrollReveal key={div.name} direction="up" delay={confIndex * 100 + divIndex * 50}>
                        <Card variant="default" padding="md">
                          <h4 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider mb-3">
                            {div.name}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {div.teams.map((team) => (
                              <Link
                                key={team}
                                href={`/nfl/teams/${team.toLowerCase().replace(/\s+/g, '-')}`}
                                className="inline-block"
                              >
                                <Badge variant="secondary" className="text-sm hover:bg-burnt-orange hover:text-white transition-colors cursor-pointer">
                                  {team}
                                </Badge>
                              </Link>
                            ))}
                          </div>
                        </Card>
                      </ScrollReveal>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </Section>

        {/* Season Note */}
        <Section padding="md" background="charcoal" borderTop>
          <Container>
            <div className="text-center">
              <p className="text-text-tertiary text-sm">
                NFL season runs September through February. Check back for live game coverage.
              </p>
              <p className="text-text-tertiary text-xs mt-2">
                Data sourced from ESPN and official NFL sources • Updated in real-time during games
              </p>
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
