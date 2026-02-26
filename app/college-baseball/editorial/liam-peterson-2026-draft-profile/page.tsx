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
  title: 'Liam Peterson 2026 Draft Profile | Florida RHP | Blaze Sports Intel',
  description:
    'Liam Peterson draft profile — Florida ace and No. 9 overall prospect in the 2026 MLB Draft. The No. 3 college arm per Baseball America walked 5 batters on Opening Day. Scouting analysis, walk problem breakdown, and draft implications from Blaze Sports Intel.',
  openGraph: {
    title: 'Liam Peterson — The Walk Problem and the No. 9 Pick',
    description:
      'Florida\'s ace is a consensus top-10 pick. Then he walked 5 batters on Opening Day and didn\'t survive the fourth inning. What it means for the draft.',
    type: 'profile',
    url: 'https://blazesportsintel.com/college-baseball/editorial/liam-peterson-2026-draft-profile',
    siteName: 'Blaze Sports Intel',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Liam Peterson — No. 9 Pick, 5 Walks on Opening Day | BSI',
    description: 'Florida RHP. No. 3 college arm (BA). The walk problem changes the evaluation.',
  },
  alternates: {
    canonical: '/college-baseball/editorial/liam-peterson-2026-draft-profile',
  },
  other: {
    'script:ld+json': JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Person',
          name: 'Liam Peterson',
          description: 'Florida RHP, No. 9 overall prospect in the 2026 MLB Draft',
          url: 'https://blazesportsintel.com/college-baseball/editorial/liam-peterson-2026-draft-profile',
          affiliation: {
            '@type': 'SportsTeam',
            name: 'Florida Gators Baseball',
          },
        },
        {
          '@type': 'Article',
          headline: 'Liam Peterson 2026 Draft Profile',
          author: { '@type': 'Organization', name: 'Blaze Sports Intel' },
          datePublished: '2026-02-25',
          url: 'https://blazesportsintel.com/college-baseball/editorial/liam-peterson-2026-draft-profile',
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
  { label: '2026 Draft Position', value: '#9', helperText: 'MLB Pipeline consensus' },
  { label: 'College Arm Rank (BA)', value: '#3', helperText: 'Baseball America pre-draft' },
  { label: 'Opening Day Walks', value: '5', helperText: 'Did not survive the 4th inning' },
  { label: 'Florida Record', value: '7-0', helperText: 'Through Weekend 2' },
];

// ── Scouting grades ──────────────────────────────────────────────────

interface ScoutingGrade {
  tool: string;
  current: number;
  future: number;
  note: string;
}

const SCOUTING_GRADES: ScoutingGrade[] = [
  { tool: 'FB', current: 65, future: 70, note: 'Mid-90s with life; can reach 97; above-average ride through the zone' },
  { tool: 'SL', current: 60, future: 65, note: 'Hard slider with sharp break; primary out pitch in the zone' },
  { tool: 'CB', current: 55, future: 60, note: 'Developing curveball with depth; early count and chase weapon' },
  { tool: 'CH', current: 50, future: 55, note: 'Fading changeup to neutralize LHH; improving feel' },
  { tool: 'CMD', current: 45, future: 55, note: 'The question. 5 BB on Opening Day; historically better. Mechanical or mental?' },
];

function gradeColor(grade: number): string {
  if (grade >= 70) return 'text-[#C9A227]';
  if (grade >= 60) return 'text-burnt-orange';
  if (grade >= 55) return 'text-text-secondary';
  return 'text-text-tertiary';
}

// ── Page ─────────────────────────────────────────────────────────────

export default function PetersonDraftProfilePage() {
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
                <Badge variant="secondary">No. 9 Overall</Badge>
                <DataSourceBadge source="BSI Analytics" />
              </div>

              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-display text-text-primary leading-[0.95] mb-4">
                Liam Peterson
              </h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-tertiary mb-6">
                <span>RHP &middot; Florida Gators</span>
                <span className="hidden sm:inline">&middot;</span>
                <span>No. 9 Overall &middot; No. 3 College Arm (BA)</span>
                <span className="hidden sm:inline">&middot;</span>
                <span>February 25, 2026</span>
              </div>

              <p className="font-serif text-xl md:text-2xl leading-relaxed text-text-secondary">
                The consensus is clear: Liam Peterson is a top-10 pick with Friday-night stuff and a fastball that sits mid-90s with life. Then Opening Day happened &mdash; 5 walks, out before the fourth inning, and a loss to UAB that raised the one question no scouting report had anticipated. The arm is elite. The command is the variable.
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

        {/* ── The Opening Day Problem ── */}
        <Section padding="lg">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-2 border-b border-burnt-orange/15">
                What Happened on Opening Day
              </h2>
              <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                <p>
                  Florida hosted UAB on February 14 for Opening Day. Peterson &mdash; the Friday-night ace, the arm scouts project as the third college pitcher off the 2026 draft board &mdash; did not survive the fourth inning. He walked 5 batters. The Gators committed 3 errors and issued 8 total walks as a staff. UAB won 9&ndash;7 in 10 innings.
                </p>
                <p>
                  Five walks from an arm of Peterson&rsquo;s caliber is not a rough outing. It&rsquo;s a data point that demands an explanation. Opening Day is live ammunition &mdash; the adrenaline is different, the mound feels different, the rhythm of competitive innings after weeks of controlled scrimmages is a gear shift that even elite arms have to navigate. And Peterson has navigated it before. His track record suggests this isn&rsquo;t who he is. But the track record doesn&rsquo;t explain why it happened, and scouts don&rsquo;t evaluate track records &mdash; they evaluate what they see.
                </p>
                <p>
                  Florida recovered. The Gators won Game 2 in an 11&ndash;0 run-rule and clinched the series 6&ndash;1 on Sunday. By the end of Weekend 2, Florida was 7&ndash;0 and had climbed from No. 12 to No. 10 in the D1Baseball Top 25. The team is fine. The question is whether Peterson&rsquo;s command is fine &mdash; or whether Opening Day exposed a mechanical issue that will recur under SEC-level pressure.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── The Stuff ── */}
        <Section padding="lg" background="charcoal">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-text-primary mb-6 pb-2 border-b border-border">
                The Arsenal
              </h2>
              <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                <p>
                  The stuff has never been the question. Peterson&rsquo;s fastball sits 94&ndash;96 mph with above-average ride through the zone &mdash; the kind of rising action that generates swings underneath the ball and turns barrel contact into harmless fly outs. He can reach 97 when he needs to. The fastball alone would make him a bullpen prospect. Paired with the slider, it makes him a starter.
                </p>
                <p>
                  The slider is the out pitch &mdash; hard, late-breaking, thrown in the zone with the confidence that hitters will swing through it. It plays at any level. The curveball is still developing &mdash; more of an early-count show-me than a reliable chase weapon, but the depth is improving and it gives right-handed hitters a different look to think about. The changeup has fade and deception against left-handed hitters, though he doesn&rsquo;t throw it as often as scouts would like.
                </p>
                <p>
                  The four-pitch mix profiles as a No. 2 starter at the major league level &mdash; and that projection hasn&rsquo;t changed because of one bad start. What has changed is the confidence interval around his command grade. Before Opening Day, the scouting consensus placed his command at a 50 or 55 on the 20&ndash;80 scale: average to above-average, functional for a starter. Five walks against UAB moved the floor of that range down to 45. The ceiling hasn&rsquo;t changed. The floor has.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Scouting Grades Table ── */}
        <Section padding="lg">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-2 border-b border-burnt-orange/15">
                BSI Scouting Grades (20&ndash;80 Scale)
              </h2>
              <p className="text-xs text-text-muted mb-4 uppercase tracking-widest">
                Based on early-season performance + pre-draft consensus. Not a final evaluation.
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

        {/* ── The Command Question ── */}
        <Section padding="lg" background="charcoal">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-text-primary mb-6 pb-2 border-b border-border">
                Mechanical or Mental?
              </h2>
              <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                <p>
                  The walk problem has two possible explanations, and they carry very different draft implications.
                </p>
                <p>
                  <strong className="text-text-primary font-semibold">Explanation 1: Opening Day adrenaline.</strong> Peterson overthrew. The fastball was up in the zone and out of the zone simultaneously &mdash; good velocity, bad location. The slider was starting in the dirt instead of the bottom of the zone. Nothing was repeatable because the delivery was rushed. This is the benign explanation. It happens to elite arms on Opening Day. Justin Verlander walked 5 in his first start of 2006. Max Scherzer walked 4 in his 2019 opener. The analogy isn&rsquo;t exact &mdash; those were major leaguers, not college sophomores &mdash; but the phenomenon is the same. If this is the explanation, the next two Friday starts should look like a different pitcher.
                </p>
                <p>
                  <strong className="text-text-primary font-semibold">Explanation 2: A mechanical flaw that shows under pressure.</strong> If Peterson&rsquo;s delivery has a timing inconsistency &mdash; early hip rotation, rushed front side, inconsistent release point &mdash; it might only surface when the game tempo is fastest. Fall bullpens and February scrimmages don&rsquo;t replicate the pace and pressure of live SEC innings. If the walk problem recurs in Weeks 3 or 4, especially against quality lineups that can punish mistakes in the zone and lay off balls out of it, the issue is structural. And structural issues change draft trajectories. A pitcher with a 55-command grade and a timing flaw is a reliever, not a starter. The difference in draft value is one to two rounds.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Pull Quote ── */}
        <Section padding="md">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <blockquote className="border-l-[3px] border-burnt-orange pl-6 py-2 my-4">
                <p className="font-serif text-xl italic font-medium text-text-primary leading-relaxed">
                  Peterson is too talented for five walks to be his baseline. But if it recurs in Week 3 or 4, it&rsquo;s a mechanical issue, not a bad night &mdash; and that changes his draft trajectory.
                </p>
              </blockquote>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Florida Context ── */}
        <Section padding="lg">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-2 border-b border-burnt-orange/15">
                The Florida Factor
              </h2>
              <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                <p>
                  Kevin O&rsquo;Sullivan has built Florida into a program that produces first-round arms the way Alabama produces first-round pass rushers &mdash; systemically, with an infrastructure designed to develop and showcase pitching talent. Brady Singer (2018, No. 18 overall), Jackson Kowar (2018, No. 33), Tommy Mace (2021, No. 105), and Hunter Barco (2022, No. 64) all came through Gainesville with similar profiles: mid-90s velocity, reliable secondaries, and the kind of command that translates to pro ball.
                </p>
                <p>
                  Peterson fits that lineage. The Florida pitching development system gives him every advantage &mdash; coaching, facilities, game planning, and the SEC schedule that forces him to face lineups capable of punishing mistakes. The program context argues for the benign explanation of Opening Day. Pitchers who come through O&rsquo;Sullivan&rsquo;s system don&rsquo;t typically have structural command issues because the development program catches them early.
                </p>
                <p>
                  But the program context also raises the bar. Florida&rsquo;s rotation is deep enough &mdash; Brandon Sproat is the Friday starter in all but name, and Pierce Coppola gives them a third quality arm &mdash; that Peterson doesn&rsquo;t need to be the ace to make the staff work. He needs to be the ace to confirm his draft status. If the next three Friday starts show a Peterson who throws strikes and pitches deep into games, Opening Day becomes an anecdote. If they don&rsquo;t, it becomes a trend.
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
                    Peterson&rsquo;s draft stock hasn&rsquo;t moved because of Opening Day. Not yet. One start against UAB doesn&rsquo;t override a body of work that earned him No. 9 on MLB Pipeline and No. 3 among college arms on Baseball America&rsquo;s draft board. The scouting consensus is built on fall evaluations, summer showcases, and a track record that predates one bad Friday. But the consensus is now conditional in a way it wasn&rsquo;t before.
                  </p>
                  <p>
                    The next three Friday starts are the evaluation window. If Peterson throws 6-plus innings with two or fewer walks in each, the Opening Day performance gets filed under &ldquo;first-start adrenaline&rdquo; and disappears from the conversation. If the walk numbers stay elevated &mdash; 4-plus walks in any start, or a pattern of falling behind in counts that forces him to groove pitches &mdash; teams in the 8&ndash;15 range will start asking whether Peterson is a starter or a reliever. That distinction, for an arm with his velocity and secondary arsenal, is the difference between pick No. 9 and pick No. 35. BSI will update this profile after the next two Friday outings.
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
                <Link href="/college-baseball/editorial/tyce-armstrong-2026-draft-profile" className="group block p-4 rounded-lg border border-border-subtle bg-surface-light hover:border-burnt-orange/30 transition-colors">
                  <span className="text-[10px] text-text-muted uppercase tracking-widest">Draft Profile</span>
                  <p className="text-sm font-display uppercase tracking-wide text-text-primary group-hover:text-burnt-orange transition-colors mt-1">
                    Tyce Armstrong &mdash; 3 Grand Slams, 50 Years
                  </p>
                </Link>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                <Link href="/college-baseball/editorial/what-two-weekends-told-us" className="group block p-4 rounded-lg border border-border-subtle bg-surface-light hover:border-burnt-orange/30 transition-colors">
                  <span className="text-[10px] text-text-muted uppercase tracking-widest">Related</span>
                  <p className="text-sm font-display uppercase tracking-wide text-text-primary group-hover:text-burnt-orange transition-colors mt-1">
                    What Two Weekends Actually Told Us
                  </p>
                </Link>
                <Link href="/college-baseball/editorial/florida-2026" className="group block p-4 rounded-lg border border-border-subtle bg-surface-light hover:border-burnt-orange/30 transition-colors">
                  <span className="text-[10px] text-text-muted uppercase tracking-widest">Team Preview</span>
                  <p className="text-sm font-display uppercase tracking-wide text-text-primary group-hover:text-burnt-orange transition-colors mt-1">
                    Florida 2026 Season Preview
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
