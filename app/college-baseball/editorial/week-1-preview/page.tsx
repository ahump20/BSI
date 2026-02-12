'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import texasSeed from '@/data/college-baseball/texas/2026-opening-week.json';

interface TexasSeedGame {
  date: string;
  timeCT: string;
  at: string;
  opponent: string;
  location: string;
  tournament?: string;
}

interface TexasOpeningWeekPayload {
  meta: {
    source: string[] | string;
    fetched_at: string;
    timezone: string;
    generated_by?: string;
  };
  schedule: {
    openingWeekendGames: TexasSeedGame[];
    keyEarlyGames: TexasSeedGame[];
    allParsedGames?: TexasSeedGame[];
  };
  season2025Summary: {
    overallRecord: string;
    homeRecord: string;
    awayRecord: string;
    neutralRecord: string;
    conferenceRecord: string;
    battingLeaders: Array<{ name: string; battingAverage: string }>;
  };
  rosterNotables: Array<{
    number: string;
    name: string;
    position: string;
    batsThrows: string;
    height: string;
    weight: string;
    year: string;
    hometown: string;
    highSchool: string;
  }>;
  historicalContext: {
    programTimelineEvidence: string;
    conservativeClaim: string;
  };
}

const featuredMatchups = [
  {
    title: 'Texas vs UC Davis',
    context:
      'Opening weekend at UFCU Disch-Falk Field sets the tone for Texas in its first full SEC runway.',
    when: 'Friday, February 13 through Sunday, February 15, 2026',
  },
  {
    title: 'Vanderbilt at Texas Tech',
    context:
      "Shriner's Children's College Showdown at Globe Life Field gives us an immediate SEC vs Big 12 benchmark.",
    when: 'Opening weekend spotlight, Arlington, Texas',
  },
  {
    title: 'National Opening Day slate',
    context:
      'ESPN scoreboard lists 118 games on Saturday, February 14, 2026, before another 103-game wave on Friday, February 20, 2026.',
    when: 'Saturday, February 14 and Friday, February 20, 2026',
  },
];

const powerMovement = [
  {
    tier: 'Elite hold',
    note: 'Texas, Texas A&M, Florida, Wake Forest, and LSU stay in launch position until first-series evidence says otherwise.',
  },
  {
    tier: 'Pressure tier',
    note: 'Arkansas, Tennessee, Stanford, and Oregon State have less margin for early bullpen volatility in marquee series.',
  },
  {
    tier: 'First-week risers',
    note: 'Programs that win high-RPI neutral-site games opening weekend should jump quickly in Week 2 board updates.',
  },
];

const breakoutStars = [
  {
    name: 'Jared Thomas (Texas)',
    reason: 'Power-arm profile with opening-week command gains that could reset Friday-night expectations.',
  },
  {
    name: 'Lucas Gordon (Texas)',
    reason: 'Run-prevention stability and deep-start potential make him a high-leverage Week 1 tone-setter.',
  },
  {
    name: 'Trey Faltine III (Texas)',
    reason: 'Defensive range plus early extra-base impact gives Texas lineup flexibility immediately.',
  },
  {
    name: 'Jac Caglianone (Florida)',
    reason: 'Two-way upside makes every opening weekend plate appearance and inning nationally consequential.',
  },
];

const conferenceWatchlist = [
  {
    conference: 'SEC',
    watch: 'How quickly deep rotations separate from the middle of the league in cross-conference tests.',
  },
  {
    conference: 'ACC',
    watch: 'Travel + depth management for Stanford and Cal while legacy powers push for early statement series wins.',
  },
  {
    conference: 'Big 12',
    watch: 'Can the league stack non-conference wins against SEC/ACC opponents to secure regional leverage early?',
  },
  {
    conference: 'Big Ten',
    watch: 'Cold-weather roster depth and bullpen sequencing during southern neutral-site openings.',
  },
];

export default function CollegeBaseballWeek1PreviewPage() {
  const [texasDossier, setTexasDossier] = useState<TexasOpeningWeekPayload>(
    texasSeed as TexasOpeningWeekPayload
  );
  const [dossierSource, setDossierSource] = useState<'api' | 'seed'>('seed');

  useEffect(() => {
    let mounted = true;

    const loadDossier = async () => {
      try {
        const res = await fetch('/api/college-baseball/editorial/texas-opening-week');
        if (!res.ok) return;

        const payload = (await res.json()) as TexasOpeningWeekPayload;
        if (!mounted) return;

        setTexasDossier(payload);
        setDossierSource('api');
      } catch {
        if (!mounted) return;
        setDossierSource('seed');
      }
    };

    loadDossier();

    return () => {
      mounted = false;
    };
  }, []);

  const sourceLines = useMemo(() => {
    const source = texasDossier.meta.source;
    if (Array.isArray(source)) return source;
    return [source];
  }, [texasDossier.meta.source]);

  return (
    <>
      <main id="main-content">
        <Section padding="lg" className="pt-24 pb-12">
          <Container>
            <ScrollReveal direction="up">
              <div className="flex items-center gap-3 mb-4">
                <Link
                  href="/college-baseball"
                  className="text-text-tertiary hover:text-burnt-orange transition-colors"
                >
                  College Baseball
                </Link>
                <span className="text-text-tertiary">/</span>
                <Link
                  href="/college-baseball/editorial"
                  className="text-text-tertiary hover:text-burnt-orange transition-colors"
                >
                  Editorial
                </Link>
                <span className="text-text-tertiary">/</span>
                <span className="text-white">Week 1 Preview</span>
              </div>

              <Badge variant="primary" className="mb-4">
                Opening Weekend 2026
              </Badge>
              <h1 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-display mb-4 text-white">
                Opening Weekend Preview: <span className="text-gradient-blaze">The 2026 Season Begins</span>
              </h1>
              <p className="text-text-secondary text-lg max-w-4xl">
                The dead period is over. Opening Day delivers national volume, neutral-site pressure,
                and immediate signal on who can convert roster hype into weekend wins. This brief ties
                the top board, conference race indicators, and Texas launch context into one Week 1 plan.
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        <Section padding="md">
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-bold uppercase tracking-display text-white mb-5">
                Key Matchups
              </h2>
              <div className="grid md:grid-cols-3 gap-5">
                {featuredMatchups.map((game) => (
                  <Card key={game.title} padding="lg" className="h-full border-white/10">
                    <h3 className="font-display text-xl font-bold uppercase tracking-display text-white mb-2">
                      {game.title}
                    </h3>
                    <p className="text-text-secondary mb-3">{game.context}</p>
                    <p className="text-burnt-orange text-sm font-medium">{game.when}</p>
                  </Card>
                ))}
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        <Section padding="md" className="pt-0">
          <Container>
            <div className="grid lg:grid-cols-2 gap-6">
              <ScrollReveal direction="up" delay={60}>
                <Card padding="lg" className="h-full">
                  <h2 className="font-display text-2xl font-bold uppercase tracking-display text-white mb-4">
                    Week 1 Power Movement
                  </h2>
                  <div className="space-y-4">
                    {powerMovement.map((item) => (
                      <div key={item.tier}>
                        <p className="text-burnt-orange font-semibold">{item.tier}</p>
                        <p className="text-text-secondary">{item.note}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </ScrollReveal>

              <ScrollReveal direction="up" delay={120}>
                <Card padding="lg" className="h-full">
                  <h2 className="font-display text-2xl font-bold uppercase tracking-display text-white mb-4">
                    Breakout Stars To Watch
                  </h2>
                  <div className="space-y-4">
                    {breakoutStars.map((player) => (
                      <div key={player.name}>
                        <p className="text-white font-semibold">{player.name}</p>
                        <p className="text-text-secondary">{player.reason}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </ScrollReveal>
            </div>
          </Container>
        </Section>

        <Section padding="md" className="pt-0">
          <Container>
            <ScrollReveal direction="up" delay={180}>
              <Card padding="lg">
                <h2 className="font-display text-2xl font-bold uppercase tracking-display text-white mb-4">
                  Conference Watchlist
                </h2>
                <div className="grid md:grid-cols-2 gap-5">
                  {conferenceWatchlist.map((entry) => (
                    <div key={entry.conference}>
                      <p className="text-burnt-orange font-semibold">{entry.conference}</p>
                      <p className="text-text-secondary">{entry.watch}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </ScrollReveal>
          </Container>
        </Section>

        <Section padding="md" className="pt-0 pb-16">
          <Container>
            <ScrollReveal direction="up" delay={220}>
              <Card padding="lg">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                  <h2 className="font-display text-2xl font-bold uppercase tracking-display text-white">
                    Texas Dossier (Ingest Seed)
                  </h2>
                  <Badge variant="secondary">Source: {dossierSource === 'api' ? 'Live API' : 'Local Seed'}</Badge>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <p className="text-burnt-orange font-semibold mb-2">Opening Weekend at UFCU Disch-Falk</p>
                    <div className="space-y-2">
                      {texasDossier.schedule.openingWeekendGames.map((game) => (
                        <div key={`${game.date}-${game.opponent}`} className="text-text-secondary text-sm">
                          <span className="text-white font-medium">{game.date}</span>
                          <span> · {game.opponent}</span>
                          <span> · {game.location}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-burnt-orange font-semibold mb-2">2025 Production Baseline</p>
                    <p className="text-text-secondary text-sm mb-1">
                      Overall: {texasDossier.season2025Summary.overallRecord} | SEC: {texasDossier.season2025Summary.conferenceRecord}
                    </p>
                    <p className="text-text-secondary text-sm mb-3">
                      Home/Away/Neutral: {texasDossier.season2025Summary.homeRecord} / {texasDossier.season2025Summary.awayRecord} / {texasDossier.season2025Summary.neutralRecord}
                    </p>
                    <p className="text-white/80 text-sm font-medium mb-1">Top 2025 batting averages from ingest:</p>
                    <div className="space-y-1 text-text-secondary text-sm">
                      {texasDossier.season2025Summary.battingLeaders.slice(0, 4).map((leader) => (
                        <p key={leader.name}>
                          {leader.name}: <span className="text-white/90">{leader.battingAverage}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-burnt-orange font-semibold mb-2">2026 Roster Notables</p>
                  <div className="grid md:grid-cols-2 gap-3">
                    {texasDossier.rosterNotables.slice(0, 6).map((player) => (
                      <div key={player.name} className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <p className="text-white font-semibold">
                          #{player.number} {player.name}
                        </p>
                        <p className="text-text-secondary text-sm">
                          {player.position} · {player.year} · {player.hometown}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4 space-y-2 text-sm">
                  <p className="text-white/80 font-semibold">Historical context (conservative)</p>
                  <p className="text-text-secondary">{texasDossier.historicalContext.conservativeClaim}</p>
                  <a
                    href={texasDossier.historicalContext.programTimelineEvidence}
                    target="_blank"
                    rel="noreferrer"
                    className="text-burnt-orange hover:text-[#FF6B35] transition-colors"
                  >
                    Texas schedule archive evidence: {texasDossier.historicalContext.programTimelineEvidence}
                  </a>
                </div>
              </Card>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={260}>
              <Card padding="lg" className="mt-6 border-white/10">
                <h3 className="font-display text-xl font-bold uppercase tracking-display text-white mb-3">
                  Data Attribution
                </h3>
                <div className="space-y-2 text-sm text-text-secondary">
                  <p>University of Texas Athletics schedule PDF captured on February 12, 2026.</p>
                  <p>Texas 2025 season stats PDF snapshot dated June 2, 2025.</p>
                  <p>Texas 2026 roster PDF captured on February 12, 2026.</p>
                  <p>ESPN college baseball scoreboard references validated for February 14, 2026 and February 20, 2026.</p>
                  {sourceLines.map((line, idx) => (
                    <p key={`${line}-${idx}`}>{line}</p>
                  ))}
                  <p>
                    Ingest payload fetched at: <span className="text-white/90">{texasDossier.meta.fetched_at}</span> ({texasDossier.meta.timezone})
                  </p>
                </div>
              </Card>
            </ScrollReveal>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
