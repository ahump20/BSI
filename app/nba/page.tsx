'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';

const conferences = [
  {
    name: 'Eastern Conference',
    divisions: [
      { name: 'Atlantic', teams: ['Celtics', '76ers', 'Knicks', 'Nets', 'Raptors'] },
      { name: 'Central', teams: ['Bucks', 'Cavaliers', 'Pacers', 'Pistons', 'Bulls'] },
      { name: 'Southeast', teams: ['Heat', 'Magic', 'Hawks', 'Hornets', 'Wizards'] },
    ],
  },
  {
    name: 'Western Conference',
    divisions: [
      { name: 'Northwest', teams: ['Thunder', 'Nuggets', 'Timberwolves', 'Trail Blazers', 'Jazz'] },
      { name: 'Pacific', teams: ['Warriors', 'Clippers', 'Lakers', 'Suns', 'Kings'] },
      { name: 'Southwest', teams: ['Rockets', 'Grizzlies', 'Mavericks', 'Pelicans', 'Spurs'] },
    ],
  },
];

export default function NBAPage() {
  return (
    <>
      <main id="main-content">
        {/* Hero Section */}
        <Section padding="xl" className="relative overflow-hidden pt-24">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/15 via-transparent to-transparent pointer-events-none" />

          <Container>
            <ScrollReveal direction="up">
              <Badge variant="primary" className="mb-4">
                NBA Coverage
              </Badge>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <h1 className="font-display text-4xl md:text-6xl font-bold uppercase tracking-display text-gradient-blaze mb-6">
                NBA Intelligence
              </h1>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={150}>
              <p className="text-text-secondary text-lg max-w-2xl mb-8">
                All 30 NBA teams. Standings, scores, and analysis. Memphis Grizzlies coverage you
                can count on.
              </p>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={200}>
              <div className="flex flex-wrap gap-4">
                <Link href="/nba/standings" className="btn-primary px-6 py-3">
                  View Standings
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
              <h2 className="font-display text-2xl font-bold text-white mb-8">Quick Access</h2>
            </ScrollReveal>

            <div className="grid gap-4 md:grid-cols-2">
              <ScrollReveal direction="up" delay={100}>
                <Link href="/nba/standings" className="block">
                  <Card variant="hover" padding="lg" className="h-full">
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-3xl">🏆</span>
                      <h3 className="text-xl font-display font-bold text-white">Standings</h3>
                    </div>
                    <p className="text-text-secondary text-sm">
                      Eastern & Western conference standings with playoff positioning and win
                      percentage.
                    </p>
                    <span className="text-burnt-orange text-sm font-semibold mt-4 block">
                      View Standings →
                    </span>
                  </Card>
                </Link>
              </ScrollReveal>

              <ScrollReveal direction="up" delay={150}>
                <Link href="/scores" className="block">
                  <Card variant="hover" padding="lg" className="h-full">
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-3xl">🏀</span>
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

        {/* Conferences Grid */}
        <Section padding="lg" background="midnight">
          <Container>
            <ScrollReveal>
              <h2 className="font-display text-2xl font-bold text-white mb-8">All 30 Teams</h2>
            </ScrollReveal>

            <div className="grid gap-8 md:grid-cols-2">
              {conferences.map((conf, confIndex) => (
                <div key={conf.name}>
                  <ScrollReveal direction="up" delay={confIndex * 100}>
                    <h3 className="text-xl font-display font-bold text-burnt-orange mb-4">
                      {conf.name}
                    </h3>
                  </ScrollReveal>

                  <div className="space-y-4">
                    {conf.divisions.map((div, divIndex) => (
                      <ScrollReveal
                        key={div.name}
                        direction="up"
                        delay={confIndex * 100 + divIndex * 50}
                      >
                        <Card variant="default" padding="md">
                          <h4 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider mb-3">
                            {div.name}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {div.teams.map((team) => (
                              <Badge key={team} variant="secondary" className="text-sm">
                                {team}
                              </Badge>
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
                NBA season runs October through June. Check back for live game coverage.
              </p>
              <p className="text-text-tertiary text-xs mt-2">
                Data sourced from NBA.com and ESPN • Updated in real-time during games
              </p>
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
