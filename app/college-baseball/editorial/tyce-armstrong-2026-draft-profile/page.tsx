import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { StatCard } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { IntelSignup } from '@/components/home/IntelSignup';
import { Footer } from '@/components/layout-ds/Footer';
import type { Metadata } from 'next';

// ── Metadata ────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Tyce Armstrong 2026 Draft Profile | Baylor 1B | Blaze Sports Intel',
  description:
    'Tyce Armstrong draft profile — Baylor first baseman who hit three grand slams in a single game against New Mexico State, only the second player in NCAA Division I history to accomplish the feat. Scouting analysis, game log, and draft implications from Blaze Sports Intel.',
  openGraph: {
    title: 'Tyce Armstrong — Three Grand Slams, 50 Years of History',
    description:
      'The Baylor first baseman matched a 50-year-old NCAA record with 3 grand slams and 12 RBI in one game. Full scouting profile and draft analysis.',
    type: 'profile',
    url: 'https://blazesportsintel.com/college-baseball/editorial/tyce-armstrong-2026-draft-profile',
    siteName: 'Blaze Sports Intel',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tyce Armstrong — 3 Grand Slams in One Game | BSI',
    description: 'Baylor 1B. 12 RBI. Only the second player in 50 years to do it.',
  },
  alternates: {
    canonical: '/college-baseball/editorial/tyce-armstrong-2026-draft-profile',
  },
  other: {
    'script:ld+json': JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Person',
          name: 'Tyce Armstrong',
          description: 'Baylor first baseman, three grand slams in a single game — second in NCAA D1 history',
          url: 'https://blazesportsintel.com/college-baseball/editorial/tyce-armstrong-2026-draft-profile',
          affiliation: {
            '@type': 'SportsTeam',
            name: 'Baylor Bears Baseball',
          },
        },
        {
          '@type': 'Article',
          headline: 'Tyce Armstrong 2026 Draft Profile',
          author: { '@type': 'Organization', name: 'Blaze Sports Intel' },
          datePublished: '2026-02-25',
          url: 'https://blazesportsintel.com/college-baseball/editorial/tyce-armstrong-2026-draft-profile',
          isPartOf: {
            '@type': 'WebSite',
            name: 'Blaze Sports Intel',
            url: 'https://blazesportsintel.com',
          },
        },
      ],
    }),
  },
};

// ── Stat boxes ───────────────────────────────────────────────────────

const STATS = [
  { label: 'Grand Slams (1 Game)', value: '3', helperText: 'vs New Mexico State, Feb 14' },
  { label: 'RBI in One Game', value: '12', helperText: '15-2 run-rule win' },
  { label: 'Weekend 1 RBI', value: '14', helperText: 'ESPN Player of the Week' },
  { label: 'NCAA History', value: '2nd', helperText: 'First since LaFountain (1976)' },
];

// ── Opening Weekend game log ────────────────────────────────────────

interface GameLog {
  game: string;
  opponent: string;
  result: string;
  ab: number;
  h: number;
  hr: number;
  rbi: number;
  bb: number;
  so: number;
  note: string;
}

const OPENING_WEEKEND: GameLog[] = [
  { game: 'G1 (Feb 14)', opponent: 'New Mexico State', result: 'W 15-2', ab: 5, h: 3, hr: 3, rbi: 12, bb: 0, so: 0, note: '3 grand slams (3rd, 4th, 7th inn)' },
  { game: 'G2 (Feb 15)', opponent: 'New Mexico State', result: 'W', ab: 4, h: 0, hr: 0, rbi: 1, bb: 0, so: 1, note: 'Hitless; 1 RBI on sac fly' },
  { game: 'G3 (Feb 16)', opponent: 'New Mexico State', result: 'W', ab: 3, h: 0, hr: 0, rbi: 1, bb: 1, so: 0, note: 'Hitless; walk and RBI groundout' },
];

// ── Scouting grades ──────────────────────────────────────────────────

interface ScoutingGrade {
  tool: string;
  current: number;
  future: number;
  note: string;
}

const SCOUTING_GRADES: ScoutingGrade[] = [
  { tool: 'Hit', current: 45, future: 55, note: 'Contact inconsistency — 3-for-12 after the opener; swing-and-miss risk' },
  { tool: 'Power', current: 65, future: 70, note: 'Plus raw power; 3 grand slams confirm the ceiling when he connects' },
  { tool: 'Run', current: 35, future: 35, note: 'Below-average runner; first base only' },
  { tool: 'Arm', current: 45, future: 50, note: 'Adequate for 1B; no positional versatility' },
  { tool: 'Field', current: 50, future: 55, note: 'Functional at first; scoops well, limited range' },
];

function gradeColor(grade: number): string {
  if (grade >= 70) return 'text-[#C9A227]';
  if (grade >= 60) return 'text-burnt-orange';
  if (grade >= 55) return 'text-text-secondary';
  return 'text-text-tertiary';
}

// ── Page ─────────────────────────────────────────────────────────────

export default function ArmstrongDraftProfilePage() {
  return (
    <>
      <main id="main-content" className="pt-24 bg-midnight">
        {/* ── Hero ── */}
        <Section padding="lg">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <div className="flex items-center gap-3 mb-4 text-sm">
                <Link href="/college-baseball" className="text-text-muted hover:text-burnt-orange transition-colors">
                  College Baseball
                </Link>
                <span className="text-text-muted">/</span>
                <Link href="/college-baseball/editorial" className="text-text-muted hover:text-burnt-orange transition-colors">
                  Editorial
                </Link>
                <span className="text-text-muted">/</span>
                <span className="text-text-tertiary">Draft Profile</span>
              </div>

              <div className="flex flex-wrap items-center gap-3 mb-4">
                <Badge variant="primary">2026 MLB Draft</Badge>
                <Badge variant="secondary">Historic Performance</Badge>
                <DataSourceBadge source="BSI Analytics" />
              </div>

              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-display text-text-primary leading-[0.95] mb-4">
                Tyce Armstrong
              </h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-tertiary mb-6">
                <span>1B &middot; Baylor Bears</span>
                <span className="hidden sm:inline">&middot;</span>
                <span>3 Grand Slams in One Game</span>
                <span className="hidden sm:inline">&middot;</span>
                <span>February 25, 2026</span>
              </div>

              <p className="font-serif text-xl md:text-2xl leading-relaxed text-text-secondary">
                Twelve RBI in a single game. Three grand slams in three different innings. The second player in fifty years of NCAA Division I baseball to do it. One Friday night in Waco turned Tyce Armstrong from a Baylor first baseman into a national conversation &mdash; and a draft board question that scouts are still trying to answer.
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Stat strip ── */}
        <Section padding="md" background="charcoal">
          <Container>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {STATS.map((s) => (
                <StatCard key={s.label} label={s.label} value={s.value} helperText={s.helperText} />
              ))}
            </div>
          </Container>
        </Section>

        {/* ── The Record ── */}
        <Section padding="lg">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-2 border-b border-burnt-orange/15">
                What Happened on Opening Friday
              </h2>
              <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                <p>
                  Baylor&rsquo;s lineup drew 8 walks and absorbed 5 hit-by-pitches against New Mexico State on February 14. That&rsquo;s 13 free baserunners. Four times, those free baserunners loaded the bases. Three of those four times, Tyce Armstrong cleared them.
                </p>
                <p>
                  Grand slam in the third inning. Grand slam in the fourth. Grand slam in the seventh. Each one a different at-bat, a different situation, a different pitcher adjusting to the knowledge that the previous approach hadn&rsquo;t worked. The aggregate &mdash; 12 RBI in a 15&ndash;2 run-rule win &mdash; is historic. But the sequencing matters more than the total. Armstrong didn&rsquo;t do this in a blowout where the game was already decided. His first slam <em>made</em> it a blowout. The second turned it into a demolition. The third was punctuation on an evening that already belonged to him.
                </p>
                <p>
                  The only other player in NCAA Division I history to hit three grand slams in a single game was Jim LaFountain of Louisville, on March 24, 1976. Fifty years. Every first baseman, every designated hitter, every cleanup bat in every program in the country for half a century &mdash; and the record stood until a Friday night in Waco. ESPN named Armstrong Player of the Week. He finished the full opening weekend with 14 RBI.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Game Log ── */}
        <Section padding="lg" background="charcoal">
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-text-primary mb-6 pb-2 border-b border-border">
                Opening Weekend vs New Mexico State &mdash; Game Log
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-strong">
                      {['Game', 'Result', 'AB', 'H', 'HR', 'RBI', 'BB', 'SO', 'Note'].map((h) => (
                        <th key={h} className="py-3 px-3 text-xs font-semibold text-text-muted uppercase text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {OPENING_WEEKEND.map((g) => (
                      <tr key={g.game} className="border-b border-border">
                        <td className="py-3 px-3 text-text-primary text-sm font-medium">{g.game}</td>
                        <td className="py-3 px-3 text-success text-sm font-semibold">{g.result}</td>
                        <td className="py-3 px-3 text-text-primary text-sm text-center">{g.ab}</td>
                        <td className="py-3 px-3 text-text-primary text-sm text-center">{g.h}</td>
                        <td className="py-3 px-3 text-burnt-orange font-bold text-sm text-center">{g.hr}</td>
                        <td className="py-3 px-3 text-text-primary text-sm text-center">{g.rbi}</td>
                        <td className="py-3 px-3 text-text-primary text-sm text-center">{g.bb}</td>
                        <td className="py-3 px-3 text-text-primary text-sm text-center">{g.so}</td>
                        <td className="py-3 px-3 text-text-tertiary text-sm">{g.note}</td>
                      </tr>
                    ))}
                    {/* Weekend totals */}
                    <tr className="border-t-2 border-burnt-orange/30 bg-surface-light">
                      <td className="py-3 px-3 text-text-primary text-sm font-bold" colSpan={2}>Weekend Total</td>
                      <td className="py-3 px-3 text-text-primary text-sm text-center font-bold">12</td>
                      <td className="py-3 px-3 text-text-primary text-sm text-center font-bold">3</td>
                      <td className="py-3 px-3 text-burnt-orange font-bold text-sm text-center">3</td>
                      <td className="py-3 px-3 text-text-primary text-sm text-center font-bold">14</td>
                      <td className="py-3 px-3 text-text-primary text-sm text-center font-bold">1</td>
                      <td className="py-3 px-3 text-text-primary text-sm text-center font-bold">1</td>
                      <td className="py-3 px-3 text-text-tertiary text-sm italic">ESPN Player of the Week</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── The Question ── */}
        <Section padding="lg">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-2 border-b border-burnt-orange/15">
                The Silence After the Explosion
              </h2>
              <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                <p>
                  Armstrong was held hitless in Games 2 and 3. Twelve RBI on Friday, two RBI on sac flies and groundouts over the weekend&rsquo;s final two games. That&rsquo;s the data point scouts will weigh most carefully. A historic Friday followed by two quiet days against the same pitching staff tells you the power is real but the approach is still developing.
                </p>
                <p>
                  The hit tool is the question. Armstrong doesn&rsquo;t have a consistent two-strike approach yet &mdash; when he&rsquo;s in hitter&rsquo;s counts, the bat speed and raw power are undeniable. But the three grand slams all came in situations where New Mexico State&rsquo;s staff was pitching to contact or missing over the plate. When the staff adjusted &mdash; expanded the zone, pitched him off the plate &mdash; Armstrong chased and came up empty. That pattern is what separates a hitter who matched a 50-year record from a hitter who sustains top-10-round draft value over a full season.
                </p>
                <p>
                  First basemen carry a higher offensive bar than shortstops or catchers. The position provides no defensive premium. To be a first-round pick at first base, you need to hit &mdash; not for one game, not for one weekend, but across an entire conference schedule. J.T. Realuto was drafted 48th overall as a catcher. Paul Goldschmidt was drafted 246th as a first baseman. The position demands production that the Opening Weekend data, extraordinary as it was, cannot yet confirm.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Scouting Grades Table ── */}
        <Section padding="lg" background="charcoal">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-text-primary mb-6 pb-2 border-b border-border">
                BSI Scouting Grades (20&ndash;80 Scale)
              </h2>
              <p className="text-xs text-text-muted mb-4 uppercase tracking-widest">
                Based on early-season performance + pre-draft projections. Not a final evaluation.
              </p>
              <div className="space-y-4">
                {SCOUTING_GRADES.map((g) => (
                  <div key={g.tool} className="flex items-start gap-4 py-3 border-b border-border-subtle">
                    <span className="font-display text-sm font-bold uppercase tracking-wider text-text-tertiary w-16 shrink-0 pt-0.5">{g.tool}</span>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-center">
                        <span className="text-[10px] text-text-muted block uppercase tracking-widest">Now</span>
                        <span className={`font-mono text-lg font-bold ${gradeColor(g.current)}`}>{g.current}</span>
                      </div>
                      <span className="text-text-muted">&rarr;</span>
                      <div className="text-center">
                        <span className="text-[10px] text-text-muted block uppercase tracking-widest">Proj</span>
                        <span className={`font-mono text-lg font-bold ${gradeColor(g.future)}`}>{g.future}</span>
                      </div>
                    </div>
                    <span className="text-sm text-text-tertiary leading-snug">{g.note}</span>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Draft Context ── */}
        <Section padding="lg">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-2 border-b border-burnt-orange/15">
                The Baylor Context
              </h2>
              <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                <p>
                  Armstrong wasn&rsquo;t in the preseason conversation for Baylor&rsquo;s key players. The Bears&rsquo; offseason headliners were Blake Wright (Mississippi State transfer, .293/.381/.512, 14 HR) and Will Dion (Duke transfer, 3.78 ERA, 71 K). Armstrong was the lineup piece nobody was talking about nationally &mdash; a physical first baseman with raw power who hadn&rsquo;t translated that power into sustained production.
                </p>
                <p>
                  That changes the evaluation. Breakout performers in Opening Weekend either confirm what scouts already believed (Cholowsky) or introduce a new variable the scouting community hasn&rsquo;t fully assessed (Armstrong). Armstrong is the latter. Scouts who weren&rsquo;t at the NMSU series need to get to Waco and see whether the bat speed and approach hold against Big 12 arms &mdash; or whether the Opening Weekend was the kind of aberration that makes for a great highlight package but doesn&rsquo;t project to pro ball.
                </p>
                <p>
                  Mack Thompson&rsquo;s lineup has been built around small ball and manufacturing runs for most of his tenure. Armstrong&rsquo;s emergence gives Baylor a middle-of-the-order power threat they haven&rsquo;t had in years &mdash; the kind of bat that changes pitch sequencing for the hitters around him. If he sustains even a fraction of the Opening Weekend production against conference pitching, the Bears become a different team in the Big 12 race.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── BSI Verdict ── */}
        <Section padding="lg" background="charcoal">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <div className="relative border border-burnt-orange/20 rounded-lg p-6 md:p-8">
                <div className="absolute -top-2.5 left-8 font-display text-[11px] tracking-[3px] uppercase bg-charcoal text-burnt-orange px-3">
                  BSI Verdict
                </div>
                <div className="font-serif text-lg leading-relaxed text-[#FAF7F2] space-y-4">
                  <p>
                    Three grand slams in one game is the kind of stat line that defies explanation and resists projection. The power is real &mdash; you don&rsquo;t clear the bases three times in three innings on accident. The question is everything around it: can Armstrong maintain a hitting approach that lets the power play against pitching staffs that won&rsquo;t load the bases and leave fastballs over the middle of the plate?
                  </p>
                  <p>
                    The draft projection right now sits in the Day 2 to Day 3 range &mdash; rounds 3 through 10 &mdash; with significant upside if the hit tool develops. First basemen need to produce. The positional bar is high. But Armstrong&rsquo;s raw power is plus-plus, and in an era where college programs are increasingly developing power hitters rather than drafting them, a breakout sophomore season at Baylor could move him substantially up the board. The next 30 games will determine whether Opening Weekend was the beginning of something or the peak of it.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Related + CTA ── */}
        <Section padding="lg">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-text-muted mb-4">More 2026 Draft Profiles</h3>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <Link href="/college-baseball/editorial/roch-cholowsky-2026-draft-profile" className="group block p-4 rounded-lg border border-border-subtle bg-surface-light hover:border-burnt-orange/30 transition-colors">
                  <span className="text-[10px] text-text-muted uppercase tracking-widest">Draft Profile</span>
                  <p className="text-sm font-display uppercase tracking-wide text-text-primary group-hover:text-burnt-orange transition-colors mt-1">
                    Roch Cholowsky &mdash; No. 1 Overall Pick
                  </p>
                </Link>
                <Link href="/college-baseball/editorial/dylan-volantis-2026-draft-profile" className="group block p-4 rounded-lg border border-border-subtle bg-surface-light hover:border-burnt-orange/30 transition-colors">
                  <span className="text-[10px] text-text-muted uppercase tracking-widest">Draft Profile</span>
                  <p className="text-sm font-display uppercase tracking-wide text-text-primary group-hover:text-burnt-orange transition-colors mt-1">
                    Dylan Volantis &mdash; 14 IP, 0 ER, The Conversion
                  </p>
                </Link>
                <Link href="/college-baseball/editorial/jackson-flora-2026-draft-profile" className="group block p-4 rounded-lg border border-border-subtle bg-surface-light hover:border-burnt-orange/30 transition-colors">
                  <span className="text-[10px] text-text-muted uppercase tracking-widest">Draft Profile</span>
                  <p className="text-sm font-display uppercase tracking-wide text-text-primary group-hover:text-burnt-orange transition-colors mt-1">
                    Jackson Flora &mdash; 100 MPH, New Arsenal
                  </p>
                </Link>
                <Link href="/college-baseball/editorial/liam-peterson-2026-draft-profile" className="group block p-4 rounded-lg border border-border-subtle bg-surface-light hover:border-burnt-orange/30 transition-colors">
                  <span className="text-[10px] text-text-muted uppercase tracking-widest">Draft Profile</span>
                  <p className="text-sm font-display uppercase tracking-wide text-text-primary group-hover:text-burnt-orange transition-colors mt-1">
                    Liam Peterson &mdash; The Walk Problem
                  </p>
                </Link>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                <Link href="/college-baseball/editorial/week-1-recap" className="group block p-4 rounded-lg border border-border-subtle bg-surface-light hover:border-burnt-orange/30 transition-colors">
                  <span className="text-[10px] text-text-muted uppercase tracking-widest">Related</span>
                  <p className="text-sm font-display uppercase tracking-wide text-text-primary group-hover:text-burnt-orange transition-colors mt-1">
                    Week 1 Recap: Armstrong&rsquo;s Record-Tying Game
                  </p>
                </Link>
                <Link href="/college-baseball/editorial/baylor-2026" className="group block p-4 rounded-lg border border-border-subtle bg-surface-light hover:border-burnt-orange/30 transition-colors">
                  <span className="text-[10px] text-text-muted uppercase tracking-widest">Team Preview</span>
                  <p className="text-sm font-display uppercase tracking-wide text-text-primary group-hover:text-burnt-orange transition-colors mt-1">
                    Baylor 2026 Season Preview
                  </p>
                </Link>
              </div>

              <Link href="/college-baseball/players" className="text-xs text-text-muted hover:text-burnt-orange transition-colors uppercase tracking-widest">
                Full Player Database &rarr;
              </Link>
            </ScrollReveal>

            <div className="mt-10">
              <IntelSignup sport="college_baseball" />
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
