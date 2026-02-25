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
  title: 'Roch Cholowsky 2026 MLB Draft Profile | UCLA SS | Blaze Sports Intel',
  description:
    'Roch Cholowsky draft profile — consensus No. 1 overall pick in the 2026 MLB Draft. UCLA shortstop with 6 HR through 7 games, including 3 HR vs No. 7 TCU. Scouting report, statistical analysis, and HAV-F analytics from Blaze Sports Intel.',
  openGraph: {
    title: 'Roch Cholowsky — 2026 MLB Draft No. 1 Pick Profile',
    description:
      'The consensus No. 1 overall pick dismantled TCU with 3 HR and 5 RBI in Game 1 alone. Full scouting profile with early-season analytics.',
    type: 'profile',
    url: 'https://blazesportsintel.com/college-baseball/editorial/roch-cholowsky-2026-draft-profile',
    siteName: 'Blaze Sports Intel',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Roch Cholowsky — 2026 Draft No. 1 Pick | BSI',
    description: 'UCLA shortstop. 6 HR in 7 games. The consensus top pick through Weekend 2.',
  },
  alternates: {
    canonical: '/college-baseball/editorial/roch-cholowsky-2026-draft-profile',
  },
  other: {
    'script:ld+json': JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Person',
          name: 'Roch Cholowsky',
          description: 'UCLA shortstop, consensus No. 1 overall pick in the 2026 MLB Draft',
          url: 'https://blazesportsintel.com/college-baseball/editorial/roch-cholowsky-2026-draft-profile',
          affiliation: {
            '@type': 'SportsTeam',
            name: 'UCLA Bruins Baseball',
          },
        },
        {
          '@type': 'Article',
          headline: 'Roch Cholowsky 2026 MLB Draft Profile',
          author: { '@type': 'Organization', name: 'Blaze Sports Intel' },
          datePublished: '2026-02-25',
          url: 'https://blazesportsintel.com/college-baseball/editorial/roch-cholowsky-2026-draft-profile',
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
  { label: 'Home Runs (7 GP)', value: '6', helperText: 'Through Weekend 2' },
  { label: 'HR vs No. 7 TCU', value: '3', helperText: 'Grand slam + 2 solo shots' },
  { label: 'RBI in Game 1', value: '5', helperText: 'Before the game was half over' },
  { label: '2026 Mock Draft', value: '#1', helperText: 'Consensus overall pick' },
];

// ── Scouting grades ──────────────────────────────────────────────────

interface ScoutingGrade {
  tool: string;
  current: number;
  future: number;
  note: string;
}

const SCOUTING_GRADES: ScoutingGrade[] = [
  { tool: 'Hit', current: 65, future: 70, note: 'Elite bat-to-ball with power; plus approach at plate' },
  { tool: 'Power', current: 60, future: 70, note: '6 HR in 7 games; 458 ft HR by Barczi shows UCLA lineup depth' },
  { tool: 'Run', current: 55, future: 55, note: 'Average runner; above-average baserunning instincts' },
  { tool: 'Arm', current: 60, future: 65, note: 'Strong arm for SS; accurate throws from the hole' },
  { tool: 'Field', current: 60, future: 65, note: 'Smooth actions; plus range to both sides' },
];

function gradeColor(grade: number): string {
  if (grade >= 70) return 'text-[#C9A227]';
  if (grade >= 60) return 'text-burnt-orange';
  if (grade >= 55) return 'text-white/80';
  return 'text-white/50';
}

// ── Weekend game log ────────────────────────────────────────────────

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

const UCLA_TCU_SERIES: GameLog[] = [
  { game: 'G1 (Feb 20)', opponent: 'No. 7 TCU', result: 'W 10-2', ab: 4, h: 2, hr: 2, rbi: 5, bb: 1, so: 0, note: 'Grand slam (2nd inn) + solo HR (5th)' },
  { game: 'G2 (Feb 21)', opponent: 'No. 7 TCU', result: 'W 5-1', ab: 4, h: 1, hr: 0, rbi: 0, bb: 0, so: 1, note: 'Single; quiet day at the plate' },
  { game: 'G3 (Feb 22)', opponent: 'No. 7 TCU', result: 'W 15-5', ab: 4, h: 2, hr: 1, rbi: 2, bb: 1, so: 0, note: 'Solo HR; UCLA run-ruled TCU' },
];

// ── Page ─────────────────────────────────────────────────────────────

export default function CholowskyDraftProfilePage() {
  return (
    <>
      <main id="main-content" className="pt-24 bg-midnight">
        {/* ── Hero ── */}
        <Section padding="lg">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <div className="flex items-center gap-3 mb-4 text-sm">
                <Link href="/college-baseball" className="text-white/40 hover:text-burnt-orange transition-colors">
                  College Baseball
                </Link>
                <span className="text-white/20">/</span>
                <Link href="/college-baseball/editorial" className="text-white/40 hover:text-burnt-orange transition-colors">
                  Editorial
                </Link>
                <span className="text-white/20">/</span>
                <span className="text-white/60">Draft Profile</span>
              </div>

              <div className="flex flex-wrap items-center gap-3 mb-4">
                <Badge variant="primary">2026 MLB Draft</Badge>
                <Badge variant="secondary">No. 1 Overall</Badge>
                <DataSourceBadge source="BSI Analytics" />
              </div>

              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-display text-white leading-[0.95] mb-4">
                Roch Cholowsky
              </h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/50 mb-6">
                <span>SS &middot; UCLA Bruins</span>
                <span className="hidden sm:inline">&middot;</span>
                <span>Consensus No. 1 Overall Pick</span>
                <span className="hidden sm:inline">&middot;</span>
                <span>February 25, 2026</span>
              </div>

              <p className="font-serif text-xl md:text-2xl leading-relaxed text-white/70">
                Six home runs in seven games. Three of them against No. 7 TCU in a sweep that settled the No. 1 ranking and widened the gap between Cholowsky and every other name on the 2026 draft board.
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

        {/* ── The Case ── */}
        <Section padding="lg">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-2 border-b border-burnt-orange/15">
                Why He&rsquo;s No. 1
              </h2>
              <div className="font-serif text-lg leading-[1.78] text-white/80 space-y-6">
                <p>
                  Roch Cholowsky entered 2026 as the consensus No. 1 overall pick, and two weekends of live competition have done nothing to challenge that status. If anything, the TCU series expanded the case. The grand slam in Game 1&rsquo;s second inning &mdash; off a ranked team&rsquo;s Friday starter, with the bases loaded and two outs &mdash; was a draft-night highlight before February ended. The solo shot in the fifth was redundant by then. The third homer, in Game 3&rsquo;s run-rule, was punctuation on a series that UCLA had already won in spirit by Saturday afternoon.
                </p>
                <p>
                  What separates Cholowsky from the next tier of college bats isn&rsquo;t the raw numbers &mdash; though 6 HR through 7 games is absurd pacing for any hitter in any league. It&rsquo;s the <em>context</em> of the damage. His Game 1 grand slam came against TCU, which had held Arkansas and Vanderbilt to 4 runs each at the Shriners Showdown a week earlier. He wasn&rsquo;t feasting on mid-major arms. He was erasing a ranked pitching staff&rsquo;s competitive framework in two at-bats.
                </p>
                <p>
                  The offensive profile is two-way elite: hit tool and power, operating from a premium defensive position. Shortstops who can hit for average <em>and</em> power are the rarest commodity in the draft. The last college shortstop taken No. 1 overall was Royce Lewis (Minnesota) in 2017. Cholowsky&rsquo;s combination of bat speed, pitch recognition, and in-game power production at the college level is tracking ahead of where Lewis was at the same point in his draft year.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── TCU Series Game Log ── */}
        <Section padding="lg" background="charcoal">
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-white mb-6 pb-2 border-b border-white/10">
                Weekend 2 vs No. 7 TCU &mdash; Game Log
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/15">
                      {['Game', 'Result', 'AB', 'H', 'HR', 'RBI', 'BB', 'SO', 'Note'].map((h) => (
                        <th key={h} className="py-3 px-3 text-xs font-semibold text-white/40 uppercase text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {UCLA_TCU_SERIES.map((g) => (
                      <tr key={g.game} className="border-b border-white/10">
                        <td className="py-3 px-3 text-white text-sm font-medium">{g.game}</td>
                        <td className="py-3 px-3 text-green-500 text-sm font-semibold">{g.result}</td>
                        <td className="py-3 px-3 text-white text-sm text-center">{g.ab}</td>
                        <td className="py-3 px-3 text-white text-sm text-center">{g.h}</td>
                        <td className="py-3 px-3 text-burnt-orange font-bold text-sm text-center">{g.hr}</td>
                        <td className="py-3 px-3 text-white text-sm text-center">{g.rbi}</td>
                        <td className="py-3 px-3 text-white text-sm text-center">{g.bb}</td>
                        <td className="py-3 px-3 text-white text-sm text-center">{g.so}</td>
                        <td className="py-3 px-3 text-white/60 text-sm">{g.note}</td>
                      </tr>
                    ))}
                    {/* Series totals */}
                    <tr className="border-t-2 border-burnt-orange/30 bg-white/[0.02]">
                      <td className="py-3 px-3 text-white text-sm font-bold" colSpan={2}>Series Total</td>
                      <td className="py-3 px-3 text-white text-sm text-center font-bold">12</td>
                      <td className="py-3 px-3 text-white text-sm text-center font-bold">5</td>
                      <td className="py-3 px-3 text-burnt-orange font-bold text-sm text-center">3</td>
                      <td className="py-3 px-3 text-white text-sm text-center font-bold">7</td>
                      <td className="py-3 px-3 text-white text-sm text-center font-bold">2</td>
                      <td className="py-3 px-3 text-white text-sm text-center font-bold">1</td>
                      <td className="py-3 px-3 text-white/60 text-sm italic">UCLA swept 30-8</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Scouting Report ── */}
        <Section padding="lg">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-2 border-b border-burnt-orange/15">
                Scouting Report
              </h2>
              <div className="font-serif text-lg leading-[1.78] text-white/80 space-y-6">
                <p>
                  Cholowsky&rsquo;s calling card is the hit tool &mdash; quick hands, natural feel for the barrel, and an approach at the plate that belies his age. He doesn&rsquo;t chase. He doesn&rsquo;t expand. When pitchers miss over the plate, he punishes them. When they don&rsquo;t, he takes his walk and moves to the next at-bat. That discipline is what makes the power numbers sustainable rather than streaky.
                </p>
                <p>
                  Defensively, he&rsquo;s a legitimate shortstop &mdash; smooth actions, above-average range to both sides, and an arm that plays anywhere on the left side of the infield. The feet are clean. The throws are accurate. He&rsquo;s not a shortstop-for-now who&rsquo;ll slide to third base in pro ball; he&rsquo;s a shortstop who can stay at shortstop.
                </p>
                <p>
                  The concern, to the extent one exists, is that UCLA&rsquo;s early-season schedule hasn&rsquo;t tested him against elite pitching yet. TCU&rsquo;s ace Tommy LaPour was unavailable due to elbow soreness for the series. The real measuring stick comes when Cholowsky faces the SEC&rsquo;s best Friday starters in regional and super regional play &mdash; or in the Cape this summer. But the early returns are consistent with the pre-draft scouting consensus: this is the best college bat in the class, and it isn&rsquo;t particularly close.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Scouting Grades Table ── */}
        <Section padding="lg" background="charcoal">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-white mb-6 pb-2 border-b border-white/10">
                BSI Scouting Grades (20&ndash;80 Scale)
              </h2>
              <p className="text-xs text-white/30 mb-4 uppercase tracking-widest">
                Based on early-season performance + pre-draft consensus. Not a final evaluation.
              </p>
              <div className="space-y-4">
                {SCOUTING_GRADES.map((g) => (
                  <div key={g.tool} className="flex items-start gap-4 py-3 border-b border-white/[0.06]">
                    <span className="font-display text-sm font-bold uppercase tracking-wider text-white/60 w-16 shrink-0 pt-0.5">{g.tool}</span>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-center">
                        <span className="text-[10px] text-white/30 block uppercase tracking-widest">Now</span>
                        <span className={`font-mono text-lg font-bold ${gradeColor(g.current)}`}>{g.current}</span>
                      </div>
                      <span className="text-white/20">&rarr;</span>
                      <div className="text-center">
                        <span className="text-[10px] text-white/30 block uppercase tracking-widest">Proj</span>
                        <span className={`font-mono text-lg font-bold ${gradeColor(g.future)}`}>{g.future}</span>
                      </div>
                    </div>
                    <span className="text-sm text-white/50 leading-snug">{g.note}</span>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── The UCLA Context ── */}
        <Section padding="lg">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-2 border-b border-burnt-orange/15">
                The UCLA Factor
              </h2>
              <div className="font-serif text-lg leading-[1.78] text-white/80 space-y-6">
                <p>
                  Cholowsky doesn&rsquo;t operate in a vacuum. UCLA is the No. 1 team in the country for a reason, and it starts with the lineup around him. Will Gasparino, hitting behind Cholowsky in the 4-hole, went 7-for-13 (.538) in the TCU series. Together, the 3-4 hitters produced 6 home runs and 16 RBI across three games. TCU&rsquo;s pitching staff &mdash; which had limited two ranked teams to single-digit run totals a week earlier &mdash; couldn&rsquo;t pitch around Cholowsky because Gasparino was waiting behind him. And they couldn&rsquo;t pitch to him because the result was a grand slam.
                </p>
                <p>
                  That protection matters for the draft evaluation. Cholowsky will see fewer quality pitches as the season progresses and teams recognize that walking him doesn&rsquo;t solve the problem. What he does with the pitches he <em>does</em> see &mdash; and how he handles prolonged stretches where opponents refuse to give him anything to hit &mdash; will separate the consensus from the conviction. Right now, through seven games, the consensus and the on-field data are aligned.
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
                    The draft conversation for the No. 1 pick has been settled since fall. Two weekends of live data haven&rsquo;t introduced doubt &mdash; they&rsquo;ve reinforced it. Cholowsky is a plus-hit, plus-power shortstop who has faced the best pitching UCLA&rsquo;s schedule has offered so far and treated it like batting practice. The grand slam against TCU in Game 1 was the weekend&rsquo;s defining moment &mdash; not because it was dramatic, but because it was inevitable. Every scouting report said he&rsquo;d do exactly this. He did exactly this.
                  </p>
                  <p>
                    The questions that remain are the ones February can&rsquo;t answer. How does he handle a three-week stretch where pitchers won&rsquo;t throw him a strike? How does his swing hold up in June when he&rsquo;s played 50 games in 80 days? Those are real questions. But they&rsquo;re refinement questions, not disqualifying ones. The baseline is a No. 1 overall pick playing like a No. 1 overall pick. Everything else is calibration.
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
              <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-white/40 mb-4">More 2026 Draft Profiles</h3>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <Link href="/college-baseball/editorial/dylan-volantis-2026-draft-profile" className="group block p-4 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:border-burnt-orange/30 transition-colors">
                  <span className="text-[10px] text-white/30 uppercase tracking-widest">Draft Profile</span>
                  <p className="text-sm font-display uppercase tracking-wide text-white group-hover:text-burnt-orange transition-colors mt-1">
                    Dylan Volantis &mdash; 14 IP, 0 ER, The Conversion
                  </p>
                </Link>
                <Link href="/college-baseball/editorial/jackson-flora-2026-draft-profile" className="group block p-4 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:border-burnt-orange/30 transition-colors">
                  <span className="text-[10px] text-white/30 uppercase tracking-widest">Draft Profile</span>
                  <p className="text-sm font-display uppercase tracking-wide text-white group-hover:text-burnt-orange transition-colors mt-1">
                    Jackson Flora &mdash; 100 MPH, New Arsenal
                  </p>
                </Link>
                <Link href="/college-baseball/editorial/liam-peterson-2026-draft-profile" className="group block p-4 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:border-burnt-orange/30 transition-colors">
                  <span className="text-[10px] text-white/30 uppercase tracking-widest">Draft Profile</span>
                  <p className="text-sm font-display uppercase tracking-wide text-white group-hover:text-burnt-orange transition-colors mt-1">
                    Liam Peterson &mdash; The Walk Problem
                  </p>
                </Link>
                <Link href="/college-baseball/editorial/tyce-armstrong-2026-draft-profile" className="group block p-4 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:border-burnt-orange/30 transition-colors">
                  <span className="text-[10px] text-white/30 uppercase tracking-widest">Draft Profile</span>
                  <p className="text-sm font-display uppercase tracking-wide text-white group-hover:text-burnt-orange transition-colors mt-1">
                    Tyce Armstrong &mdash; 3 Grand Slams, 50 Years
                  </p>
                </Link>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                <Link href="/college-baseball/editorial/weekend-2-recap" className="group block p-4 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:border-burnt-orange/30 transition-colors">
                  <span className="text-[10px] text-white/30 uppercase tracking-widest">Related</span>
                  <p className="text-sm font-display uppercase tracking-wide text-white group-hover:text-burnt-orange transition-colors mt-1">
                    Weekend 2 Recap: Full National Breakdown
                  </p>
                </Link>
                <Link href="/college-baseball/editorial/ucla-2026" className="group block p-4 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:border-burnt-orange/30 transition-colors">
                  <span className="text-[10px] text-white/30 uppercase tracking-widest">Team Preview</span>
                  <p className="text-sm font-display uppercase tracking-wide text-white group-hover:text-burnt-orange transition-colors mt-1">
                    UCLA 2026 Season Preview
                  </p>
                </Link>
              </div>

              <Link href="/college-baseball/players" className="text-xs text-white/30 hover:text-burnt-orange transition-colors uppercase tracking-widest">
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
