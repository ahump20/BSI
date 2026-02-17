'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import {
  Trophy,
  Users as _Users,
  Calendar,
  TrendingUp as _TrendingUp,
  MapPin as _MapPin,
  Star as _Star,
  ArrowRight,
} from 'lucide-react';

const texasStats = {
  ranking: 1,
  conference: 'SEC',
  lastSeason: '48-22',
  cws: 'Regional Final',
  keyReturners: 12,
  allAmericans: 3,
  headCoach: 'David Pierce',
  stadium: 'UFCU Disch-Falk Field',
  capacity: '7,273',
};

const aggieStats = {
  ranking: 2,
  conference: 'SEC',
  lastSeason: '53-15',
  cws: 'College World Series',
  keyReturners: 10,
  allAmericans: 2,
  headCoach: 'Jim Schlossnagle',
  stadium: 'Blue Bell Park',
  capacity: '6,096',
};

const headToHeadHistory = [
  { year: 2024, winner: 'Texas A&M', score: '6-5', location: 'College Station' },
  { year: 2024, winner: 'Texas', score: '8-3', location: 'Austin' },
  { year: 2023, winner: 'Texas', score: '11-2', location: 'Austin' },
  { year: 2023, winner: 'Texas A&M', score: '4-2', location: 'College Station' },
];

const keyDates = [
  { date: 'February 14, 2026', event: 'Season Opener', note: 'Both teams open at home' },
  { date: 'March 20-22, 2026', event: 'Texas @ Texas A&M', note: 'First SEC series matchup' },
  { date: 'April 24-26, 2026', event: 'Texas A&M @ Texas', note: 'Return series in Austin' },
  { date: 'May 19-24, 2026', event: 'SEC Tournament', note: 'Hoover, Alabama' },
];

export default function LoneStarRivalryPage() {
  const lastUpdated = 'February 2026';

  return (
    <>
      <main id="main-content">
        {/* Hero */}
        <Section padding="none" className="relative">
          <div className="bg-gradient-to-br from-[#BF5700] via-[#5C0F0F] to-[#500000] relative overflow-hidden">
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_black_100%)] opacity-60" />
            <Container className="relative z-10 py-16 md:py-24">
              <ScrollReveal direction="up">
                <div className="flex items-center gap-3 mb-6">
                  <Badge variant="primary">Feature Story</Badge>
                  <span className="text-white/70 text-sm">8 min read</span>
                </div>

                <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold uppercase tracking-display text-white mb-4 max-w-4xl">
                  The Lone Star Rivalry <span className="text-burnt-orange">Enters the SEC</span>
                </h1>

                <p className="text-white/90 text-xl md:text-2xl font-medium mb-6 max-w-3xl">
                  Texas and Texas A&M: #1 vs #2 in Baseball&apos;s Biggest Stage
                </p>

                <p className="text-white/70 max-w-2xl text-lg leading-relaxed">
                  For the first time in history, the Longhorns and Aggies enter SEC play
                  together—and they&apos;re doing it as the top two teams in the nation. This
                  isn&apos;t just realignment. This is a seismic shift in college baseball.
                </p>
              </ScrollReveal>
            </Container>
          </div>
        </Section>

        {/* Rankings Comparison */}
        <Section padding="lg">
          <Container>
            <ScrollReveal direction="up" delay={100}>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Texas Card */}
                <Card
                  padding="lg"
                  className="border-[#BF5700]/30 hover:border-[#BF5700]/60 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[#BF5700] font-display text-4xl font-bold">
                          #{texasStats.ranking}
                        </span>
                        <Badge variant="primary">Preseason</Badge>
                      </div>
                      <h2 className="font-display text-2xl font-bold text-white uppercase">
                        Texas Longhorns
                      </h2>
                    </div>
                    <div className="w-16 h-16 bg-[#BF5700] rounded-lg flex items-center justify-center">
                      <span className="font-display text-2xl font-bold text-white">UT</span>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-tertiary">2025 Record</span>
                      <span className="text-white font-medium">{texasStats.lastSeason}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-tertiary">Postseason</span>
                      <span className="text-white font-medium">{texasStats.cws}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-tertiary">Key Returners</span>
                      <span className="text-white font-medium">{texasStats.keyReturners}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-tertiary">Preseason All-Americans</span>
                      <span className="text-white font-medium">{texasStats.allAmericans}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-tertiary">Head Coach</span>
                      <span className="text-white font-medium">{texasStats.headCoach}</span>
                    </div>
                  </div>

                  <Link
                    href="/college-baseball/teams/texas"
                    className="mt-4 inline-flex items-center text-[#BF5700] font-medium hover:text-white transition-colors"
                  >
                    Full Team Profile <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Card>

                {/* Texas A&M Card */}
                <Card
                  padding="lg"
                  className="border-[#500000]/30 hover:border-[#500000]/60 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[#500000] font-display text-4xl font-bold">
                          #{aggieStats.ranking}
                        </span>
                        <Badge variant="secondary">Preseason</Badge>
                      </div>
                      <h2 className="font-display text-2xl font-bold text-white uppercase">
                        Texas A&M Aggies
                      </h2>
                    </div>
                    <div className="w-16 h-16 bg-[#500000] rounded-lg flex items-center justify-center">
                      <span className="font-display text-2xl font-bold text-white">A&M</span>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-tertiary">2025 Record</span>
                      <span className="text-white font-medium">{aggieStats.lastSeason}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-tertiary">Postseason</span>
                      <span className="text-white font-medium">{aggieStats.cws}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-tertiary">Key Returners</span>
                      <span className="text-white font-medium">{aggieStats.keyReturners}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-tertiary">Preseason All-Americans</span>
                      <span className="text-white font-medium">{aggieStats.allAmericans}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-tertiary">Head Coach</span>
                      <span className="text-white font-medium">{aggieStats.headCoach}</span>
                    </div>
                  </div>

                  <Link
                    href="/college-baseball/teams/texas-am"
                    className="mt-4 inline-flex items-center text-[#500000] font-medium hover:text-white transition-colors"
                  >
                    Full Team Profile <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Card>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* The Story */}
        <Section padding="md">
          <Container>
            <ScrollReveal direction="up" delay={150}>
              <div className="max-w-3xl mx-auto">
                <h2 className="font-display text-2xl font-bold uppercase tracking-display text-white mb-6">
                  The Story
                </h2>

                <div className="prose prose-invert prose-lg max-w-none">
                  <p className="text-text-secondary leading-relaxed mb-6">
                    When Texas and Texas A&M announced their move to the SEC in 2024, college
                    football fans braced for the renewal of one of sport&apos;s most bitter
                    rivalries. What they didn&apos;t fully appreciate was what this meant for
                    baseball.
                  </p>

                  <p className="text-text-secondary leading-relaxed mb-6">
                    The Lone Star State has quietly become the epicenter of college baseball. Texas
                    has six national championships—more than any program in history. Texas A&M
                    reached the College World Series in 2025 and returns the core of a team that won
                    53 games. When D1Baseball released their 2026 preseason poll, it wasn&apos;t a
                    surprise that both programs cracked the top five. What shocked everyone was the
                    order: Texas at #1, Texas A&M at #2.
                  </p>

                  <blockquote className="border-l-4 border-burnt-orange pl-6 my-8 italic text-white/90">
                    &ldquo;This is bigger than any single series. This is two programs that
                    genuinely believe they&apos;re the best in the country, now playing in the same
                    conference for the first time in over a decade. The intensity is going to be
                    incredible.&rdquo;
                  </blockquote>

                  <p className="text-text-secondary leading-relaxed mb-6">
                    The Longhorns enter 2026 with arguably the deepest pitching staff in America.
                    Three projected first-round picks anchor a rotation that dominated the Big 12
                    last season. Add in a lineup that returns its entire middle infield and the
                    program&apos;s characteristic swagger under David Pierce, and you have a team
                    built for Omaha.
                  </p>

                  <p className="text-text-secondary leading-relaxed mb-6">
                    The Aggies counter with their own formula: elite defense, contact-oriented
                    hitting, and Jim Schlossnagle&apos;s knack for developing mid-week arms into
                    weekend starters. A&M&apos;s 2025 run to Omaha wasn&apos;t a fluke—it was
                    validation of a program that has recruited at an elite level for years.
                  </p>

                  <p className="text-text-secondary leading-relaxed">
                    When these teams meet in SEC play, it won&apos;t just be about conference
                    standings. It will be about Texas pride, recruiting battles, and the eternal
                    question that divides families across the state: burnt orange or maroon?
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Key Dates */}
        <Section padding="md">
          <Container>
            <ScrollReveal direction="up" delay={200}>
              <h2 className="font-display text-xl font-bold uppercase tracking-display text-white mb-6">
                <Calendar className="w-5 h-5 inline mr-2 text-burnt-orange" />
                Key Dates
              </h2>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {keyDates.map((date, index) => (
                  <Card key={index} padding="md">
                    <div className="text-burnt-orange text-sm font-medium mb-1">{date.date}</div>
                    <div className="text-white font-bold mb-1">{date.event}</div>
                    <div className="text-text-tertiary text-sm">{date.note}</div>
                  </Card>
                ))}
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Recent History */}
        <Section padding="md">
          <Container>
            <ScrollReveal direction="up" delay={250}>
              <h2 className="font-display text-xl font-bold uppercase tracking-display text-white mb-6">
                <Trophy className="w-5 h-5 inline mr-2 text-burnt-orange" />
                Recent Head-to-Head
              </h2>

              <Card padding="lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 text-text-tertiary font-medium">Year</th>
                        <th className="text-left py-3 text-text-tertiary font-medium">Winner</th>
                        <th className="text-left py-3 text-text-tertiary font-medium">Score</th>
                        <th className="text-left py-3 text-text-tertiary font-medium">Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      {headToHeadHistory.map((game, index) => (
                        <tr key={index} className="border-b border-white/5 last:border-0">
                          <td className="py-3 text-white">{game.year}</td>
                          <td className="py-3">
                            <span
                              className={
                                game.winner === 'Texas'
                                  ? 'text-[#BF5700] font-medium'
                                  : 'text-[#500000] font-medium'
                              }
                            >
                              {game.winner}
                            </span>
                          </td>
                          <td className="py-3 text-white">{game.score}</td>
                          <td className="py-3 text-text-tertiary">{game.location}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </ScrollReveal>
          </Container>
        </Section>

        {/* CTA */}
        <Section padding="lg">
          <Container>
            <ScrollReveal direction="up" delay={300}>
              <Card padding="lg" className="text-center">
                <h2 className="font-display text-2xl font-bold uppercase tracking-display text-white mb-4">
                  Follow the Rivalry All Season
                </h2>
                <p className="text-text-secondary mb-6 max-w-xl mx-auto">
                  Blaze Sports Intel delivers real-time coverage, advanced analytics, and in-depth
                  previews for every Texas vs Texas A&M showdown.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Link href="/college-baseball/teams/texas">
                    <span className="inline-flex items-center px-6 py-3 bg-[#BF5700] text-white font-medium rounded-lg hover:bg-[#BF5700]/80 transition-colors">
                      Texas Longhorns
                    </span>
                  </Link>
                  <Link href="/college-baseball/teams/texas-am">
                    <span className="inline-flex items-center px-6 py-3 bg-[#500000] text-white font-medium rounded-lg hover:bg-[#500000]/80 transition-colors">
                      Texas A&M Aggies
                    </span>
                  </Link>
                </div>
              </Card>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Attribution */}
        <Section padding="sm" className="pb-16">
          <Container>
            <div className="text-center text-xs text-text-tertiary">
              <p>
                Rankings data sourced from D1Baseball 2026 Preseason Poll. Season records from 2025
                NCAA statistics.
              </p>
              <p className="mt-1">Last updated: {lastUpdated} CT</p>
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
