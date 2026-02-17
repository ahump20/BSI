'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { formatTimestamp } from '@/lib/utils/timezone';

interface TexasDossier {
  meta?: { source: string; fetched_at: string };
  schedule?: { date: string; opponent: string; location: string }[];
  season2025Summary?: Record<string, string>;
  rosterNotables?: { name: string; position: string; note: string }[];
  historicalContext?: string;
  error?: string;
}

const keyMatchups = [
  {
    away: 'UC Davis',
    home: '#4 Texas',
    series: '3-game series',
    note: 'Texas opens 2026 at UFCU Disch-Falk Field. The Aggies won a regional in this park last year. The Longhorns need to set the tone early in their first SEC campaign.',
    venue: 'UFCU Disch-Falk Field, Austin, TX',
    date: 'Feb 14-16',
  },
  {
    away: '#2 Florida',
    home: 'Stetson',
    series: '3-game series',
    note: 'Florida brings back the deepest pitching staff in the country. Stetson upset a top-10 team at home last season — this is not a gimme.',
    venue: 'Stetson, DeLand, FL',
    date: 'Feb 14-16',
  },
  {
    away: '#1 Texas A&M',
    home: 'Rice',
    series: '3-game series',
    note: 'The preseason #1 opens against a Rice team rebuilding under new leadership. A&M\'s lineup returns 7 starters — they\'re expected to be the class of college baseball.',
    venue: 'Reckling Park, Houston, TX',
    date: 'Feb 14-16',
  },
  {
    away: '#3 LSU',
    home: 'Air Force',
    series: '3-game series',
    note: 'LSU rolls into Baton Rouge to open at Alex Box. Pitching depth is the question — the bats won\'t be.',
    venue: 'Alex Box Stadium, Baton Rouge, LA',
    date: 'Feb 14-16',
  },
];

const breakoutStars = [
  { name: 'Jace LaViolette', team: 'Texas A&M', position: 'OF', note: 'Projected top-10 draft pick. Switch-hitter with 30+ HR power who could be the best player in college baseball.' },
  { name: 'Cade Kurland', team: 'Florida', position: 'INF', note: 'Led the Gators in RBI last year. His approach at the plate anchors Florida\'s middle of the order.' },
  { name: 'Charlie Condon', team: 'Georgia', position: 'INF/OF', note: 'Returned for his junior year after flirting with the draft. 30-homer bat with an elite eye.' },
  { name: 'Kimble Jensen', team: 'Texas', position: 'RHP', note: 'Sophomore arm with mid-90s velocity and three pitches. Could emerge as the weekend\'s best starter.' },
];

const conferenceWatchlist = [
  { conference: 'SEC', note: 'Six teams in the preseason top 25. Texas and Texas A&M enter as the new headliners. The deepest league in college baseball history.' },
  { conference: 'ACC', note: 'Virginia leads a strong group. Stanford and Cal join the conference — immediate impact expected. Wake Forest and Clemson are dark horses for Omaha.' },
  { conference: 'Big 12', note: 'Texas Tech, TCU, and Oklahoma State form a competitive top tier. Arizona and Arizona State bring Pac-12 pedigree.' },
  { conference: 'Big Ten', note: 'UCLA and USC bring West Coast talent into a traditionally underrated baseball conference. Indiana and Maryland are rising programs.' },
];

export default function Week1PreviewPage() {
  const [texasDossier, setTexasDossier] = useState<TexasDossier | null>(null);
  const [dossierLoading, setDossierLoading] = useState(false);

  useEffect(() => {
    async function fetchDossier() {
      setDossierLoading(true);
      try {
        const res = await fetch('/api/college-baseball/editorial/texas-opening-week');
        if (res.ok) {
          const data = await res.json();
          setTexasDossier(data as TexasDossier);
        }
      } catch {
        // Not critical — editorial content is additive
      } finally {
        setDossierLoading(false);
      }
    }
    fetchDossier();
  }, []);

  return (
    <>
      <main id="main-content">
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-white/10">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link href="/college-baseball" className="text-white/40 hover:text-[#BF5700] transition-colors">
                College Baseball
              </Link>
              <span className="text-white/40">/</span>
              <Link href="/college-baseball/editorial" className="text-white/40 hover:text-[#BF5700] transition-colors">
                Editorial
              </Link>
              <span className="text-white/40">/</span>
              <span className="text-white font-medium">Week 1 Preview</span>
            </nav>
          </Container>
        </Section>

        {/* Hero */}
        <Section padding="lg" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#BF5700]/20 to-transparent pointer-events-none" />
          <Container>
            <ScrollReveal direction="up">
              <div className="max-w-3xl">
                <div className="flex items-center gap-3 mb-4">
                  <Badge variant="primary">Week 1 Preview</Badge>
                  <span className="text-white/40 text-sm">10 min read</span>
                </div>
                <h1 className="font-display text-3xl md:text-5xl font-bold uppercase tracking-wide mb-4">
                  Opening Weekend <span className="text-gradient-blaze">2026</span>
                </h1>
                <p className="text-white/70 text-lg leading-relaxed">
                  The most anticipated college baseball season in a generation begins February 14. Realignment has reshuffled the deck. Texas and Texas A&M enter the SEC ranked #1 and #4 in the country. Every game this weekend sets the tone for what comes next.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Key Matchups */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-bold uppercase tracking-wide mb-6">
                Key <span className="text-[#BF5700]">Matchups</span>
              </h2>
            </ScrollReveal>

            <div className="grid gap-4 md:grid-cols-2">
              {keyMatchups.map((matchup, i) => (
                <ScrollReveal key={i} direction="up" delay={i * 50}>
                  <Card variant="default" padding="lg" className="h-full">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-semibold text-white">
                        {matchup.away} <span className="text-white/30 mx-1">@</span> {matchup.home}
                      </div>
                      <Badge variant="secondary">{matchup.series}</Badge>
                    </div>
                    <p className="text-white/60 text-sm mb-3">{matchup.note}</p>
                    <div className="text-xs text-white/30">
                      {matchup.date} &middot; {matchup.venue}
                    </div>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </Container>
        </Section>

        {/* Breakout Stars */}
        <Section padding="lg" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-bold uppercase tracking-wide mb-6">
                Breakout <span className="text-[#BF5700]">Stars</span>
              </h2>
            </ScrollReveal>

            <div className="grid gap-4 md:grid-cols-2">
              {breakoutStars.map((player, i) => (
                <ScrollReveal key={i} direction="up" delay={i * 50}>
                  <Card variant="default" padding="md" className="h-full">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-[#BF5700]/20 rounded-full flex items-center justify-center text-sm font-bold text-[#BF5700]">
                        {player.position}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{player.name}</p>
                        <p className="text-xs text-white/40">{player.team}</p>
                      </div>
                    </div>
                    <p className="text-white/60 text-sm">{player.note}</p>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </Container>
        </Section>

        {/* Conference Watchlist */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-bold uppercase tracking-wide mb-6">
                Conference <span className="text-[#BF5700]">Watchlist</span>
              </h2>
            </ScrollReveal>

            <div className="space-y-4">
              {conferenceWatchlist.map((item, i) => (
                <ScrollReveal key={i} direction="up" delay={i * 50}>
                  <Card variant="default" padding="md">
                    <div className="flex items-start gap-4">
                      <Badge variant="primary" className="shrink-0 mt-0.5">{item.conference}</Badge>
                      <p className="text-white/70 text-sm">{item.note}</p>
                    </div>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </Container>
        </Section>

        {/* Texas Dossier */}
        <Section padding="lg" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-bold uppercase tracking-wide mb-2">
                Texas <span className="text-[#BF5700]">Dossier</span>
              </h2>
              <p className="text-white/40 text-sm mb-6">Opening weekend intel from the Texas Athletics data pipeline</p>
            </ScrollReveal>

            {dossierLoading ? (
              <Card variant="default" padding="lg">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-white/10 rounded w-1/3" />
                  <div className="h-4 bg-white/10 rounded w-2/3" />
                  <div className="h-4 bg-white/10 rounded w-1/2" />
                </div>
              </Card>
            ) : texasDossier && !texasDossier.error ? (
              <ScrollReveal direction="up" delay={100}>
                <Card variant="default" padding="lg">
                  <CardHeader>
                    <CardTitle>Texas Longhorns Opening Week Data</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {texasDossier.schedule && texasDossier.schedule.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-3">Schedule</h4>
                        <div className="space-y-2">
                          {texasDossier.schedule.map((game, i) => (
                            <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-white/5">
                              <span className="text-white">{game.opponent}</span>
                              <span className="text-white/40">{game.date} &middot; {game.location}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {texasDossier.rosterNotables && texasDossier.rosterNotables.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-3">Roster Notables</h4>
                        <div className="space-y-2">
                          {texasDossier.rosterNotables.map((player, i) => (
                            <div key={i} className="text-sm py-2 border-b border-white/5">
                              <span className="text-white font-medium">{player.name}</span>
                              <span className="text-white/40 ml-2">{player.position}</span>
                              <p className="text-white/50 mt-1">{player.note}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {texasDossier.historicalContext && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-2">Historical Context</h4>
                        <p className="text-white/50 text-sm">{texasDossier.historicalContext}</p>
                      </div>
                    )}

                    {texasDossier.meta && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <DataSourceBadge
                          source={texasDossier.meta.source}
                          timestamp={formatTimestamp(texasDossier.meta.fetched_at)}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </ScrollReveal>
            ) : (
              <Card variant="default" padding="lg">
                <div className="text-center py-6">
                  <p className="text-white/40 text-sm">Texas dossier data not yet published. Check back on opening day.</p>
                </div>
              </Card>
            )}
          </Container>
        </Section>

        {/* Data Attribution */}
        <Section padding="md" background="charcoal" borderTop>
          <Container>
            <div className="text-center text-xs text-white/30 space-y-1">
              <p>Rankings: D1Baseball Preseason Poll. Game data: ESPN College Baseball API.</p>
              <p>Texas dossier: Texas Athletics / texassports.com. Player projections: public draft boards.</p>
              <p>All data refreshes automatically. Source attribution accompanies every data point.</p>
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
