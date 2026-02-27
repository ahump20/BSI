import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ACC Baseball Opening Weekend 2026: Stanford and Cal Debut | Blaze Sports Intel',
  description: 'Stanford and Cal join the ACC from the Pac-12, making it a coast-to-coast conference. Wake Forest enters as the favorite. Virginia, NC State reload. Full ACC opening weekend breakdown.',
  openGraph: {
    title: 'ACC Baseball Opening Weekend 2026 | Blaze Sports Intel',
    description: 'Conference realignment, day one. Stanford and Cal play their first ACC games. Wake Forest — one win from a national title last year — opens as the prohibitive favorite.',
    type: 'article',
  },
};

const accTeams = [
  { rank: 4, team: 'Wake Forest', record: '54-11', postseason: 'CWS Final', opener: 'vs William & Mary (Feb 14)', capsule: 'One game from a national title. Bennett, Wilken, Hartle all return. The Deacs ran roughshod over the ACC and reload with enough talent for another Omaha run.', keyPlayer: 'Josh Hartle (LHP)', slug: 'wake-forest' },
  { rank: 6, team: 'Virginia', record: '50-14', postseason: 'CWS', opener: 'vs James Madison (Feb 14)', capsule: "O'Connor's consistency machine. O'Ferrall and Gelof lead a balanced attack. ACC championship favorites.", keyPlayer: "Griff O'Ferrall (SS)", slug: 'virginia' },
  { rank: 9, team: 'Stanford', record: '41-19', postseason: 'Super Regional', opener: 'vs San Jose State (Feb 14)', capsule: "ACC debut. Montgomery and Dowd bring West Coast firepower. Esquer's squad has Omaha aspirations and the cross-country travel to test them.", keyPlayer: 'Braden Montgomery (OF)', slug: 'stanford', isNew: true },
  { rank: 13, team: 'Clemson', record: '42-19', postseason: 'Regional', opener: 'vs Wofford (Feb 14)', capsule: 'Bakich elevates the program. Excellent pitching depth and a balanced lineup make the Tigers a real threat.', keyPlayer: 'Aidan Knaak (RHP)', slug: 'clemson' },
  { rank: 14, team: 'North Carolina', record: '45-18', postseason: 'Super Regional', opener: 'vs Elon (Feb 14)', capsule: "Forbes has the Heels trending up. Honeycutt is a game-changer with plus power. Could be Chapel Hill's year.", keyPlayer: 'Vance Honeycutt (OF)', slug: 'north-carolina' },
  { rank: 19, team: 'Florida State', record: '43-19', postseason: 'Super Regional', opener: 'vs Jacksonville (Feb 14)', capsule: 'Jarrett continues to build in Tallahassee. Elite athleticism across the roster and enough pitching to make a run.', keyPlayer: 'James Tibbs III (OF)', slug: 'florida-state' },
  { rank: 20, team: 'NC State', record: '38-21', postseason: 'Regional', opener: 'vs UNC Wilmington (Feb 14)', capsule: "Avent's teams are always competitive. Scrappy, well-coached, and capable of upsetting anyone in a short series.", keyPlayer: 'Noah Soles (SS)', slug: 'nc-state' },
  { rank: 24, team: 'Cal', record: '37-21', postseason: 'Regional', opener: 'vs Santa Clara (Feb 14)', capsule: "ACC debut alongside Stanford. Neu's Bears have something to prove in their new conference.", keyPlayer: 'Nathan Manning (1B)', slug: 'california', isNew: true },
];

const storylines = [
  { title: 'Conference Realignment Arrives', description: 'Stanford and Cal join from the Pac-12, making the ACC a truly coast-to-coast conference for the first time. The Cardinal bring legitimate Omaha talent. Cal has pieces to compete. The cross-country travel — from Tallahassee to Palo Alto — will test both newcomers and their opponents.' },
  { title: 'Wake Forest Reloads', description: "The Demon Deacons were one game from a national title. They lost a few key contributors but return Bennett, Wilken, and Hartle. Tom Walter's program has proven they belong at the top. Can they get back to Omaha?" },
  { title: 'Five Teams in the Top 20', description: 'Wake Forest, Virginia, Stanford, Clemson, and North Carolina all ranked in the top 20. Florida State and NC State add depth. The ACC is deeper than the national conversation gives it credit for.' },
  { title: "Stanford's Coast-to-Coast Challenge", description: "The Cardinal are talented enough for Omaha. But flying from Palo Alto to Winston-Salem, Clemson, and Chapel Hill every other week is a real competitive challenge. How David Esquer manages rest and travel will be a story all season." },
];

export default function ACCOpeningWeekendPage() {
  return (
    <>
      <div>
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-border">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link href="/college-baseball" className="text-text-muted hover:text-burnt-orange transition-colors">
                College Baseball
              </Link>
              <span className="text-text-muted">/</span>
              <Link href="/college-baseball/editorial" className="text-text-muted hover:text-burnt-orange transition-colors">
                Editorial
              </Link>
              <span className="text-text-muted">/</span>
              <span className="text-text-primary">ACC Opening Weekend</span>
            </nav>
          </Container>
        </Section>

        {/* Hero */}
        <Section padding="lg" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-ember/10 via-transparent to-burnt-orange/5 pointer-events-none" />
          <Container>
            <ScrollReveal direction="up">
              <div className="max-w-3xl">
                <div className="flex items-center gap-3 mb-6">
                  <Badge variant="primary">Conference Preview</Badge>
                  <span className="text-text-muted text-sm">February 12, 2026</span>
                  <span className="text-text-muted text-sm">8 min read</span>
                </div>
                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-wide mb-6">
                  ACC Opening Weekend:{' '}
                  <span className="text-gradient-blaze">Coast to Coast</span>
                </h1>
                <p className="text-text-tertiary text-lg md:text-xl leading-relaxed mb-4">
                  Stanford and Cal arrive from the Pac-12. Wake Forest reloads after a CWS finals run.
                  Virginia, Clemson, and North Carolina sharpen for Omaha. Eight ranked teams make the ACC
                  deeper than the national conversation gives it credit for.
                </p>
                <div className="flex items-center gap-4 text-sm text-text-muted">
                  <span>By Blaze Sports Intel</span>
                  <span>|</span>
                  <span>Austin, TX</span>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Conference Stats */}
        <Section padding="md">
          <Container>
            <ScrollReveal direction="up" delay={100}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card variant="default" padding="md" className="text-center">
                  <div className="font-mono text-3xl font-bold text-burnt-orange">8</div>
                  <div className="text-text-muted text-xs mt-1">Ranked Teams</div>
                </Card>
                <Card variant="default" padding="md" className="text-center">
                  <div className="font-mono text-3xl font-bold text-burnt-orange">5</div>
                  <div className="text-text-muted text-xs mt-1">In Top 20</div>
                </Card>
                <Card variant="default" padding="md" className="text-center">
                  <div className="font-mono text-3xl font-bold text-burnt-orange">2</div>
                  <div className="text-text-muted text-xs mt-1">New Members</div>
                </Card>
                <Card variant="default" padding="md" className="text-center">
                  <div className="font-mono text-3xl font-bold text-burnt-orange">1</div>
                  <div className="text-text-muted text-xs mt-1">CWS Finalist</div>
                </Card>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Team Capsules */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide mb-2 text-text-primary">
                ACC Team Capsules
              </h2>
              <p className="text-text-muted mb-8">Ranked ACC teams with opening matchup and key player</p>
            </ScrollReveal>

            <div className="space-y-4">
              {accTeams.map((team) => (
                <ScrollReveal key={team.rank} direction="up">
                  <Card variant="default" padding="md" className={
                    team.rank <= 6 ? 'border-burnt-orange/30 bg-burnt-orange/5' : ''
                  }>
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      <div className="flex items-center gap-3 md:w-48 flex-shrink-0">
                        <span className="font-display text-2xl font-bold text-burnt-orange">#{team.rank}</span>
                        <div>
                          {team.slug ? (
                            <Link href={`/college-baseball/teams/${team.slug}`} className="font-display text-lg font-bold text-text-primary uppercase hover:text-burnt-orange transition-colors">
                              {team.team}
                            </Link>
                          ) : (
                            <span className="font-display text-lg font-bold text-text-primary uppercase">{team.team}</span>
                          )}
                          <div className="flex items-center gap-2">
                            <span className="text-text-muted text-xs">{team.record} | {team.postseason}</span>
                            {team.isNew && <Badge variant="secondary" className="text-[10px]">ACC Debut</Badge>}
                          </div>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-text-tertiary text-sm mb-2">{team.capsule}</p>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-xs bg-surface-light px-2 py-1 rounded text-text-muted">{team.keyPlayer}</span>
                          <span className="text-xs text-text-muted">{team.opener}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </Container>
        </Section>

        {/* Storylines */}
        <Section padding="lg" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide mb-2 text-text-primary">
                Storylines to Watch
              </h2>
              <p className="text-text-muted mb-8">The narratives shaping the 2026 ACC season</p>
            </ScrollReveal>

            <div className="grid md:grid-cols-2 gap-6">
              {storylines.map((story) => (
                <ScrollReveal key={story.title} direction="up">
                  <Card variant="default" padding="lg" className="h-full">
                    <h3 className="font-display text-lg font-bold uppercase tracking-wide text-burnt-orange mb-3">
                      {story.title}
                    </h3>
                    <p className="text-text-tertiary text-sm leading-relaxed">{story.description}</p>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </Container>
        </Section>

        {/* Data Attribution */}
        <Section padding="md" borderTop>
          <Container>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <DataSourceBadge
                source="ESPN / SportsDataIO / D1Baseball"
                timestamp={new Date().toLocaleDateString('en-US', {
                  timeZone: 'America/Chicago',
                  month: 'short', day: 'numeric', year: 'numeric',
                }) + ' CT'}
              />
              <div className="flex gap-4">
                <Link href="/college-baseball/editorial" className="text-sm text-burnt-orange hover:text-ember transition-colors">
                  More Editorial →
                </Link>
                <Link href="/college-baseball/editorial/sec-opening-weekend" className="text-sm text-text-muted hover:text-text-primary transition-colors">
                  SEC Preview →
                </Link>
              </div>
            </div>
          </Container>
        </Section>
      </div>

      <Footer />
    </>
  );
}
