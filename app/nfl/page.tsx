'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';

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
      <main id="main-content">
        {/* Hero Section */}
        <Section padding="xl" className="relative overflow-hidden pt-24">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/15 via-transparent to-transparent pointer-events-none" />

          <Container>
            <ScrollReveal direction="up">
              <Badge variant="primary" className="mb-4">
                NFL Coverage
              </Badge>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <h1 className="font-display text-4xl md:text-6xl font-bold uppercase tracking-display text-gradient-blaze mb-6">
                NFL Intelligence
              </h1>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={150}>
              <p className="text-text-secondary text-lg max-w-2xl mb-8">
                Complete coverage of all 32 NFL teams. Standings, news, and analysis. Real data,
                real-time.
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
                <Link href="/nfl/scores" className="btn-secondary px-6 py-3">
                  NFL Scores
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
                <span className="kicker">All 32 Teams</span>
                <h2 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display mt-2">
                  Complete NFL <span className="text-gradient-blaze">Coverage</span>
                </h2>
              </div>
            </ScrollReveal>

            {/* Primary features — 3 large cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                {
                  href: '/nfl/scores',
                  title: 'Scores',
                  description: 'Live scores and game results from around the league.',
                },
                {
                  href: '/nfl/standings',
                  title: 'Standings',
                  description: 'AFC & NFC standings with playoff positioning and division records.',
                },
                {
                  href: '/nfl/news',
                  title: 'News',
                  description: 'Trades, injuries, draft coverage, and free agency moves.',
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
                  { label: 'Teams', href: '/nfl/teams' },
                  { label: 'Players', href: '/nfl/players' },
                  { label: 'Schedule', href: '/nfl/schedule' },
                  { label: 'Draft', href: '/nfl/draft' },
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

        {/* Divisions Grid */}
        <Section padding="lg" background="midnight">
          <Container>
            <ScrollReveal>
              <h2 className="font-display text-2xl font-bold text-white mb-8">All 32 Teams</h2>
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
                              <Link
                                key={team}
                                href={`/nfl/teams/${team.toLowerCase().replace(/\s+/g, '-')}`}
                                className="inline-block"
                              >
                                <Badge
                                  variant="secondary"
                                  className="text-sm hover:bg-burnt-orange hover:text-white transition-colors cursor-pointer"
                                >
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
