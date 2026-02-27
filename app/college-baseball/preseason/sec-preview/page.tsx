'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { Trophy, Users, TrendingUp, Star, Calendar, ArrowRight } from 'lucide-react';

interface SECTeam {
  id: string;
  name: string;
  mascot: string;
  ranking: number | null;
  lastSeason: string;
  postseason: string;
  keyReturners: number;
  headCoach: string;
  outlook: string;
  isNew: boolean;
  primaryColor: string;
}

const secTeams: SECTeam[] = [
  {
    id: 'texas',
    name: 'Texas',
    mascot: 'Longhorns',
    ranking: 1,
    lastSeason: '48-22',
    postseason: 'Regional Final',
    keyReturners: 12,
    headCoach: 'David Pierce',
    outlook:
      'Three projected first-round picks anchor the deepest pitching staff in America. The Longhorns return their entire middle infield and enter SEC play with championship expectations.',
    isNew: true,
    primaryColor: 'var(--bsi-primary)',
  },
  {
    id: 'texas-am',
    name: 'Texas A&M',
    mascot: 'Aggies',
    ranking: 2,
    lastSeason: '53-15',
    postseason: 'College World Series',
    keyReturners: 10,
    headCoach: 'Jim Schlossnagle',
    outlook:
      'Coming off an Omaha run, the Aggies return a contact-heavy lineup and elite defense. Schlossnagle has this program operating at peak efficiency.',
    isNew: true,
    primaryColor: '#500000',
  },
  {
    id: 'lsu',
    name: 'LSU',
    mascot: 'Tigers',
    ranking: 5,
    lastSeason: '46-24',
    postseason: 'Super Regional',
    keyReturners: 9,
    headCoach: 'Jay Johnson',
    outlook:
      "The defending 2023 national champions reloaded quickly. LSU's culture under Jay Johnson produces arms year after year, and the lineup has scary power potential.",
    isNew: false,
    primaryColor: '#461D7C',
  },
  {
    id: 'tennessee',
    name: 'Tennessee',
    mascot: 'Volunteers',
    ranking: 8,
    lastSeason: '45-20',
    postseason: 'Super Regional',
    keyReturners: 11,
    headCoach: 'Tony Vitello',
    outlook:
      'Tony Vitello built a juggernaut in Knoxville. The Vols have been to Omaha twice in four years and return enough firepower to make another run.',
    isNew: false,
    primaryColor: '#FF8200',
  },
  {
    id: 'vanderbilt',
    name: 'Vanderbilt',
    mascot: 'Commodores',
    ranking: 10,
    lastSeason: '42-22',
    postseason: 'Regional',
    keyReturners: 8,
    headCoach: 'Tim Corbin',
    outlook:
      "Tim Corbin continues to develop MLB-caliber pitchers at an alarming rate. Vanderbilt's pitching depth is unmatched, even by SEC standards.",
    isNew: false,
    primaryColor: '#866D4B',
  },
  {
    id: 'arkansas',
    name: 'Arkansas',
    mascot: 'Razorbacks',
    ranking: 14,
    lastSeason: '44-19',
    postseason: 'Super Regional',
    keyReturners: 10,
    headCoach: 'Dave Van Horn',
    outlook:
      'Arkansas has been a College World Series fixture under Dave Van Horn. The Hogs reload rather than rebuild, and 2026 is no exception.',
    isNew: false,
    primaryColor: '#9D2235',
  },
  {
    id: 'florida',
    name: 'Florida',
    mascot: 'Gators',
    ranking: 18,
    lastSeason: '38-24',
    postseason: 'Regional',
    keyReturners: 9,
    headCoach: "Kevin O'Sullivan",
    outlook:
      "The Gators are reloading after losing several key contributors. O'Sullivan's track record suggests they'll be dangerous by March.",
    isNew: false,
    primaryColor: '#0021A5',
  },
  {
    id: 'ole-miss',
    name: 'Ole Miss',
    mascot: 'Rebels',
    ranking: 19,
    lastSeason: '40-23',
    postseason: 'Regional',
    keyReturners: 8,
    headCoach: 'Mike Bianco',
    outlook:
      "Mike Bianco's program has become consistently competitive. The Rebels have the athletes to compete for an SEC title.",
    isNew: false,
    primaryColor: '#14213D',
  },
  {
    id: 'georgia',
    name: 'Georgia',
    mascot: 'Bulldogs',
    ranking: null,
    lastSeason: '35-26',
    postseason: 'None',
    keyReturners: 10,
    headCoach: 'Wes Johnson',
    outlook:
      'First-year coach Wes Johnson brings MLB pitching development experience from Minnesota. Georgia could be a surprise team in his second season.',
    isNew: false,
    primaryColor: '#BA0C2F',
  },
  {
    id: 'south-carolina',
    name: 'South Carolina',
    mascot: 'Gamecocks',
    ranking: null,
    lastSeason: '37-25',
    postseason: 'Regional',
    keyReturners: 9,
    headCoach: 'Monte Lee',
    outlook:
      'The Gamecocks have the pieces to make noise but need more consistency. Strong regional recruiting could pay dividends.',
    isNew: false,
    primaryColor: '#73000A',
  },
  {
    id: 'auburn',
    name: 'Auburn',
    mascot: 'Tigers',
    ranking: null,
    lastSeason: '36-27',
    postseason: 'Regional',
    keyReturners: 7,
    headCoach: 'Butch Thompson',
    outlook:
      'Auburn continues to build depth. Butch Thompson has made this a consistent regional-caliber program.',
    isNew: false,
    primaryColor: '#0C2340',
  },
  {
    id: 'mississippi-state',
    name: 'Mississippi State',
    mascot: 'Bulldogs',
    ranking: null,
    lastSeason: '34-26',
    postseason: 'None',
    keyReturners: 8,
    headCoach: 'Chris Lemonis',
    outlook:
      'The 2021 national champions are rebuilding. Expect improvement as young players mature.',
    isNew: false,
    primaryColor: '#660000',
  },
  {
    id: 'alabama',
    name: 'Alabama',
    mascot: 'Crimson Tide',
    ranking: null,
    lastSeason: '33-28',
    postseason: 'None',
    keyReturners: 9,
    headCoach: 'Rob Vaughn',
    outlook:
      'Rob Vaughn is building something in Tuscaloosa. The Tide is trending in the right direction.',
    isNew: false,
    primaryColor: '#9E1B32',
  },
  {
    id: 'kentucky',
    name: 'Kentucky',
    mascot: 'Wildcats',
    ranking: null,
    lastSeason: '31-27',
    postseason: 'None',
    keyReturners: 8,
    headCoach: 'Nick Mingione',
    outlook:
      'Kentucky is a program that can upset anyone on a given weekend. Consistency remains the challenge.',
    isNew: false,
    primaryColor: '#0033A0',
  },
  {
    id: 'missouri',
    name: 'Missouri',
    mascot: 'Tigers',
    ranking: null,
    lastSeason: '28-30',
    postseason: 'None',
    keyReturners: 9,
    headCoach: 'Kerrick Jackson',
    outlook:
      'Missouri is working to become more competitive in baseball. The road is long but the commitment is there.',
    isNew: false,
    primaryColor: '#F1B82D',
  },
  {
    id: 'oklahoma',
    name: 'Oklahoma',
    mascot: 'Sooners',
    ranking: null,
    lastSeason: '25-32',
    postseason: 'None',
    keyReturners: 7,
    headCoach: 'Skip Johnson',
    outlook:
      'First year in the SEC for Oklahoma baseball. The Sooners face a steep learning curve but have resources to compete long-term.',
    isNew: true,
    primaryColor: '#841617',
  },
];

const conferenceStats = {
  rankedTeams: secTeams.filter((t) => t.ranking !== null).length,
  totalTeams: secTeams.length,
  cwsAppearances2025: 2,
  newMembers: secTeams.filter((t) => t.isNew).length,
};

const keyMatchups = [
  { date: 'March 20-22, 2026', teams: 'Texas @ Texas A&M', note: 'Lone Star Rivalry, SEC debut' },
  { date: 'April 3-5, 2026', teams: 'Texas @ LSU', note: 'Top 5 showdown in Baton Rouge' },
  { date: 'April 10-12, 2026', teams: 'Tennessee @ Texas A&M', note: 'Battle of recent CWS teams' },
  { date: 'April 24-26, 2026', teams: 'Texas A&M @ Texas', note: 'Return series in Austin' },
  { date: 'May 1-3, 2026', teams: 'LSU @ Tennessee', note: 'SEC East vs West showdown' },
  { date: 'May 19-24, 2026', teams: 'SEC Tournament', note: 'Hoover, Alabama' },
];

export default function SECPreviewPage() {
  const lastUpdated = 'February 2026';

  return (
    <>
      <div>
        {/* Hero */}
        <Section padding="none" className="relative">
          <div className="bg-gradient-to-br from-[#500000] via-charcoal to-[#461D7C] relative overflow-hidden">
            <div className="absolute inset-0 bg-black/50" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_black_100%)] opacity-60" />
            <Container className="relative z-10 py-16 md:py-24">
              <ScrollReveal direction="up">
                <div className="flex items-center gap-3 mb-6">
                  <Badge variant="primary">Conference Preview</Badge>
                  <span className="text-text-secondary text-sm">12 min read</span>
                </div>

                <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold uppercase tracking-display text-text-primary mb-4 max-w-4xl">
                  2026 SEC Baseball:{' '}
                  <span className="text-burnt-orange">The Deepest Conference Just Got Deeper</span>
                </h1>

                <p className="text-text-secondary text-xl md:text-2xl font-medium mb-6 max-w-3xl">
                  Texas. Texas A&M. LSU. Tennessee. Vanderbilt. This isn&apos;t a fantasy
                  league—it&apos;s the SEC.
                </p>

                <p className="text-text-secondary max-w-2xl text-lg leading-relaxed">
                  Conference realignment brought the Lone Star State&apos;s two flagship programs
                  into the fold. Now the SEC has {conferenceStats.rankedTeams} ranked teams and
                  arguably the strongest top-to-bottom lineup in college baseball history. Every
                  weekend is a war.
                </p>
              </ScrollReveal>
            </Container>
          </div>
        </Section>

        {/* Conference Stats */}
        <Section padding="md">
          <Container>
            <ScrollReveal direction="up" delay={100}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card padding="md" className="text-center">
                  <Trophy className="w-6 h-6 text-burnt-orange mx-auto mb-2" />
                  <div className="font-display text-3xl font-bold text-text-primary">
                    {conferenceStats.rankedTeams}
                  </div>
                  <div className="text-text-tertiary text-sm">Ranked Teams</div>
                </Card>
                <Card padding="md" className="text-center">
                  <Users className="w-6 h-6 text-burnt-orange mx-auto mb-2" />
                  <div className="font-display text-3xl font-bold text-text-primary">
                    {conferenceStats.totalTeams}
                  </div>
                  <div className="text-text-tertiary text-sm">Total Teams</div>
                </Card>
                <Card padding="md" className="text-center">
                  <Star className="w-6 h-6 text-burnt-orange mx-auto mb-2" />
                  <div className="font-display text-3xl font-bold text-text-primary">
                    {conferenceStats.newMembers}
                  </div>
                  <div className="text-text-tertiary text-sm">New Members</div>
                </Card>
                <Card padding="md" className="text-center">
                  <TrendingUp className="w-6 h-6 text-burnt-orange mx-auto mb-2" />
                  <div className="font-display text-3xl font-bold text-text-primary">#1</div>
                  <div className="text-text-tertiary text-sm">Top Team (Texas)</div>
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
                <h2 className="font-display text-2xl font-bold uppercase tracking-display text-text-primary mb-6">
                  The New Reality
                </h2>

                <div className="prose prose-invert prose-lg max-w-none">
                  <p className="text-text-secondary leading-relaxed mb-6">
                    Let&apos;s be honest about what just happened: Texas and Texas A&M joining the
                    SEC didn&apos;t just shift the balance of power in college baseball—it broke the
                    scale entirely. The SEC was already the gold standard. Now it&apos;s in a
                    category of its own.
                  </p>

                  <p className="text-text-secondary leading-relaxed mb-6">
                    Consider this: the Longhorns enter at #1 in the D1Baseball preseason poll. The
                    Aggies are at #2. LSU, the 2023 national champions, sits at #5. Tennessee—a
                    program that&apos;s been to Omaha twice in four years—is #8. Vanderbilt, the
                    perpetual arm factory, is #10. That&apos;s five top-ten teams in one conference.
                  </p>

                  <blockquote className="border-l-4 border-burnt-orange pl-6 my-8 italic text-text-secondary">
                    &ldquo;Every weekend in this conference is a postseason atmosphere. There are no
                    off weeks. You better be ready to compete or you&apos;ll get buried.&rdquo;
                  </blockquote>

                  <p className="text-text-secondary leading-relaxed mb-6">
                    The Texas angle adds a layer of intrigue that goes beyond baseball. The
                    Longhorns and Aggies will play as conference rivals for the first time since
                    2011. The recruiting battles along the I-35 corridor just became nuclear. And
                    every SEC program that visits Austin or College Station will discover what Texas
                    high school baseball produces.
                  </p>

                  <p className="text-text-secondary leading-relaxed">
                    This is the new reality: the SEC isn&apos;t just the best conference in college
                    baseball. It&apos;s a superconference, and everyone else is fighting for second
                    place.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Key Matchups */}
        <Section padding="md">
          <Container>
            <ScrollReveal direction="up" delay={200}>
              <h2 className="font-display text-xl font-bold uppercase tracking-display text-text-primary mb-6">
                <Calendar className="w-5 h-5 inline mr-2 text-burnt-orange" />
                Key SEC Matchups
              </h2>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {keyMatchups.map((matchup, index) => (
                  <Card key={index} padding="md">
                    <div className="text-burnt-orange text-sm font-medium mb-1">{matchup.date}</div>
                    <div className="text-text-primary font-bold mb-1">{matchup.teams}</div>
                    <div className="text-text-tertiary text-sm">{matchup.note}</div>
                  </Card>
                ))}
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Team Breakdowns */}
        <Section padding="md">
          <Container>
            <ScrollReveal direction="up" delay={250}>
              <h2 className="font-display text-xl font-bold uppercase tracking-display text-text-primary mb-6">
                <Users className="w-5 h-5 inline mr-2 text-burnt-orange" />
                Team-by-Team Breakdown
              </h2>

              <div className="grid gap-4">
                {secTeams.map((team) => (
                  <Card
                    key={team.id}
                    padding="lg"
                    className="hover:border-burnt-orange/30 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: team.primaryColor }}
                          />
                          <h3 className="font-display text-xl font-bold text-text-primary">
                            {team.name} {team.mascot}
                          </h3>
                          {team.ranking && <Badge variant="primary">#{team.ranking}</Badge>}
                          {team.isNew && <Badge variant="secondary">New</Badge>}
                        </div>
                        <p className="text-text-secondary text-sm mb-3">{team.outlook}</p>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <span className="text-text-tertiary">
                            2025: <span className="text-text-primary">{team.lastSeason}</span>
                          </span>
                          <span className="text-text-tertiary">
                            Postseason: <span className="text-text-primary">{team.postseason}</span>
                          </span>
                          <span className="text-text-tertiary">
                            Key Returners: <span className="text-text-primary">{team.keyReturners}</span>
                          </span>
                          <span className="text-text-tertiary">
                            Coach: <span className="text-text-primary">{team.headCoach}</span>
                          </span>
                        </div>
                      </div>
                      <Link
                        href={`/college-baseball/teams/${team.id}`}
                        className="inline-flex items-center text-burnt-orange font-medium hover:text-text-primary transition-colors shrink-0"
                      >
                        Full Profile <ArrowRight className="w-4 h-4 ml-1" />
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* CTA */}
        <Section padding="lg">
          <Container>
            <ScrollReveal direction="up" delay={300}>
              <Card padding="lg" className="text-center">
                <h2 className="font-display text-2xl font-bold uppercase tracking-display text-text-primary mb-4">
                  The Rivalry That Started It All
                </h2>
                <p className="text-text-secondary mb-6 max-w-xl mx-auto">
                  Texas vs Texas A&M. #1 vs #2. The Lone Star Rivalry enters the SEC—and college
                  baseball will never be the same.
                </p>
                <Link href="/college-baseball/preseason/lone-star-rivalry">
                  <span className="inline-flex items-center px-6 py-3 bg-burnt-orange text-white font-medium rounded-lg hover:bg-burnt-orange/80 transition-colors">
                    Read: The Lone Star Rivalry <ArrowRight className="w-4 h-4 ml-2" />
                  </span>
                </Link>
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
      </div>

      <Footer />
    </>
  );
}
