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
                <Link href="/nba/scores" className="btn-secondary px-6 py-3">
                  NBA Scores
                </Link>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Features Section */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal>
              <div className="text-center mb-12">
                <span className="kicker">All 30 Teams</span>
                <h2 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display mt-2">
                  Complete NBA <span className="text-gradient-blaze">Coverage</span>
                </h2>
              </div>
            </ScrollReveal>

            {/* Primary features — 3 large cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                {
                  href: '/nba/scores',
                  title: 'Scores',
                  description: 'Live scores and game results from around the league.',
                },
                {
                  href: '/nba/standings',
                  title: 'Standings',
                  description: 'Eastern & Western conference standings with playoff positioning.',
                },
                {
                  href: '/nba/teams',
                  title: 'Teams',
                  description: 'Rosters, stats, and schedules for all 30 NBA teams.',
                },
              ].map((feature, index) => (
                <ScrollReveal key={feature.title} delay={index * 100}>
                  <Link href={feature.href} className="block group">
                    <Card variant="hover" padding="lg" className="h-full relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-burnt-orange to-ember opacity-0 group-hover:opacity-100 transition-opacity" />
                      <h3 className="text-lg font-semibold text-white mb-3">{feature.title}</h3>
                      <p className="text-text-tertiary text-sm leading-relaxed mb-4">
                        {feature.description}
                      </p>
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
                    </Card>
                  </Link>
                </ScrollReveal>
              ))}
            </div>

            {/* Secondary features — compact chip bar */}
            <ScrollReveal delay={300}>
              <div className="flex flex-wrap gap-3 justify-center mt-8">
                {[
                  { label: 'Players', href: '/nba/players' },
                  { label: 'Schedule', href: '/nba/schedule' },
                  { label: 'Stats', href: '/nba/stats' },
                ].map((item) => (
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
