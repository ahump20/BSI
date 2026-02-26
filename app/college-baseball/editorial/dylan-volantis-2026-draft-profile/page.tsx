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
  title: 'Dylan Volantis 2026 Draft Profile | Texas LHP | Blaze Sports Intel',
  description:
    'Dylan Volantis draft profile — Texas sophomore LHP, 2025 SEC Freshman of the Year. 14 IP, 0 ER, 17 K through two starts in 2026. Closer-to-starter conversion analysis, statistical breakdown, and scouting report from Blaze Sports Intel.',
  openGraph: {
    title: 'Dylan Volantis — Texas LHP | 2026 Draft Profile',
    description:
      '2025 SEC Freshman of the Year converted from closer to Sunday starter. 14 IP, 0 ER, 17 K through two weekends. The conversion is real.',
    type: 'profile',
    url: 'https://blazesportsintel.com/college-baseball/editorial/dylan-volantis-2026-draft-profile',
    siteName: 'Blaze Sports Intel',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dylan Volantis — Texas LHP Draft Profile | BSI',
    description: '14 IP. 0 ER. 17 K. The closer-to-starter conversion is working.',
  },
  alternates: {
    canonical: '/college-baseball/editorial/dylan-volantis-2026-draft-profile',
  },
  other: {
    'script:ld+json': JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Person',
          name: 'Dylan Volantis',
          description: 'Texas LHP, 2025 SEC Freshman of the Year, 2026 MLB Draft prospect',
          url: 'https://blazesportsintel.com/college-baseball/editorial/dylan-volantis-2026-draft-profile',
          affiliation: {
            '@type': 'SportsTeam',
            name: 'Texas Longhorns Baseball',
          },
        },
        {
          '@type': 'Article',
          headline: 'Dylan Volantis 2026 Draft Profile — Closer to Starter',
          author: { '@type': 'Organization', name: 'Blaze Sports Intel' },
          datePublished: '2026-02-25',
          url: 'https://blazesportsintel.com/college-baseball/editorial/dylan-volantis-2026-draft-profile',
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
  { label: '2026 Innings Pitched', value: '14.0', helperText: 'Two Sunday starts' },
  { label: 'Earned Runs', value: '0', helperText: '0.00 ERA through 2 starts' },
  { label: 'Strikeouts', value: '17', helperText: '2 BB — 8.5:1 K/BB ratio' },
  { label: '2025 Saves (SEC)', value: '12', helperText: 'Broke 22-year SEC freshman record' },
];

// ── Game log ─────────────────────────────────────────────────────────

interface StartLog {
  game: string;
  opponent: string;
  result: string;
  ip: string;
  h: number;
  er: number;
  bb: number;
  so: number;
  pitches: string;
  note: string;
}

const STARTS_2026: StartLog[] = [
  { game: 'Wk 1 G3 (Feb 15)', opponent: 'UC Davis', result: 'W 9-1', ip: '7.0', h: 1, er: 0, bb: 1, so: 8, pitches: '78', note: 'No-hitter into 6th; SEC Co-POTW' },
  { game: 'Wk 2 G3 (Feb 22)', opponent: 'Michigan State', result: 'W 4-0', ip: '7.0', h: 5, er: 0, bb: 1, so: 9, pitches: '—', note: 'Career-high K; complete shutout' },
];

// ── 2025 context ────────────────────────────────────────────────────

const FRESHMAN_STATS = {
  era: '1.94',
  ip: '51.0',
  so: '74',
  sv: '12',
  secSaves: '11',
  record: 'SEC Freshman of the Year',
  secFreshmanSaveRecord: '22 years (broke record set in 2003)',
};

// ── Page ─────────────────────────────────────────────────────────────

export default function VolantisDraftProfilePage() {
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
                <Badge variant="secondary">SEC</Badge>
                <DataSourceBadge source="BSI Analytics" />
              </div>

              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-display text-text-primary leading-[0.95] mb-4">
                Dylan Volantis
              </h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-tertiary mb-6">
                <span>LHP &middot; Texas Longhorns</span>
                <span className="hidden sm:inline">&middot;</span>
                <span>2025 SEC Freshman of the Year</span>
                <span className="hidden sm:inline">&middot;</span>
                <span>February 25, 2026</span>
              </div>

              <p className="font-serif text-xl md:text-2xl leading-relaxed text-text-secondary">
                Fourteen innings. Zero earned runs. Seventeen strikeouts. The converted closer hasn&rsquo;t allowed a run as a starter &mdash; and if the workload holds through SEC play, the draft conversation shifts from &ldquo;interesting reliever&rdquo; to first-round starter.
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

        {/* ── The Conversion ── */}
        <Section padding="lg">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-2 border-b border-burnt-orange/15">
                The Closer-to-Starter Conversion
              </h2>
              <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                <p>
                  Dylan Volantis was the most dominant reliever in college baseball last spring. A 1.94 ERA with 74 strikeouts and 12 saves in 51 innings &mdash; as a freshman. His 11 SEC saves broke a conference freshman record that had stood for 22 years. He entered 2026 as the reigning SEC Freshman of the Year with a simple question hanging over his season: can the closer become a starter?
                </p>
                <p>
                  Two Sundays into the answer, the conversion isn&rsquo;t just working. It&rsquo;s rewriting expectations. Volantis has thrown 14 innings across two starts without allowing an earned run. Against UC Davis in Week 1, he carried a no-hitter into the sixth, retired 14 of his first 16 batters, and needed only 78 pitches across 7 innings of one-hit ball. Against Michigan State in Week 2, he allowed five hits but zero runs, posting a career-high 9 strikeouts in a complete shutout that sent the Spartans home scoreless.
                </p>
                <p>
                  The distinction matters for the draft evaluation. Relievers are discounted &mdash; the historical probability of a college closer becoming a top-of-the-rotation MLB arm is low enough that teams won&rsquo;t invest first-round capital on it. A starter with Volantis&rsquo;s stuff and command profile is a different asset entirely. If he can maintain this workload through SEC conference play &mdash; the spring&rsquo;s real crucible &mdash; his draft stock jumps from Day 2 relief arm to first-round starter. That&rsquo;s a $2M+ swing in bonus money for the same pitcher.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── 2026 Game Log ── */}
        <Section padding="lg" background="charcoal">
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-text-primary mb-6 pb-2 border-b border-border">
                2026 Sunday Starts
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-strong">
                      {['Start', 'Opp', 'Result', 'IP', 'H', 'ER', 'BB', 'SO', 'P', 'Note'].map((h) => (
                        <th key={h} className="py-3 px-3 text-xs font-semibold text-text-muted uppercase text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {STARTS_2026.map((g) => (
                      <tr key={g.game} className="border-b border-border">
                        <td className="py-3 px-3 text-text-primary text-sm font-medium">{g.game}</td>
                        <td className="py-3 px-3 text-text-primary text-sm">{g.opponent}</td>
                        <td className="py-3 px-3 text-success text-sm font-semibold">{g.result}</td>
                        <td className="py-3 px-3 text-text-primary text-sm text-center font-mono">{g.ip}</td>
                        <td className="py-3 px-3 text-text-primary text-sm text-center">{g.h}</td>
                        <td className="py-3 px-3 text-burnt-orange font-bold text-sm text-center">{g.er}</td>
                        <td className="py-3 px-3 text-text-primary text-sm text-center">{g.bb}</td>
                        <td className="py-3 px-3 text-text-primary text-sm text-center">{g.so}</td>
                        <td className="py-3 px-3 text-text-tertiary text-sm text-center font-mono">{g.pitches}</td>
                        <td className="py-3 px-3 text-text-tertiary text-sm">{g.note}</td>
                      </tr>
                    ))}
                    {/* Totals */}
                    <tr className="border-t-2 border-burnt-orange/30 bg-surface-light">
                      <td className="py-3 px-3 text-text-primary text-sm font-bold" colSpan={3}>2026 Total (2 starts)</td>
                      <td className="py-3 px-3 text-text-primary text-sm text-center font-mono font-bold">14.0</td>
                      <td className="py-3 px-3 text-text-primary text-sm text-center font-bold">6</td>
                      <td className="py-3 px-3 text-burnt-orange font-bold text-sm text-center">0</td>
                      <td className="py-3 px-3 text-text-primary text-sm text-center font-bold">2</td>
                      <td className="py-3 px-3 text-text-primary text-sm text-center font-bold">17</td>
                      <td className="py-3 px-3 text-text-tertiary text-sm text-center">&mdash;</td>
                      <td className="py-3 px-3 text-text-tertiary text-sm italic">0.00 ERA, 0.57 WHIP</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── The Stuff ── */}
        <Section padding="lg">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-2 border-b border-burnt-orange/15">
                The Stuff
              </h2>
              <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                <p>
                  Volantis throws from the left side with a fastball that parks in the low-90s and a slider that acts as the putaway pitch. In the bullpen last year, the slider was a weapon because hitters saw it once, maybe twice, and couldn&rsquo;t adjust. The starter test is whether the slider holds up the third time through a lineup &mdash; whether right-handed hitters who&rsquo;ve tracked it once can time it when they see it again in the sixth inning.
                </p>
                <p>
                  Through two starts, the answer has been emphatically yes. Michigan State saw plenty of Volantis in the middle innings and still couldn&rsquo;t score. He worked around five hits by generating strikeouts in high-leverage counts &mdash; the kind of pitching that doesn&rsquo;t show up in the highlight reel but separates starters who survive from starters who dominate. The 17 strikeouts against 2 walks (an 8.5:1 K/BB ratio) suggests this isn&rsquo;t smoke-and-mirrors efficiency. It&rsquo;s command.
                </p>
                <p>
                  The development question for Volantis isn&rsquo;t stuff &mdash; the stuff is plus. It&rsquo;s stamina. His pitch count against UC Davis was an efficient 78, but the Michigan State start likely pushed him deeper into counts with five hits allowed. Whether Schlossnagle extends him past 90 pitches in SEC play &mdash; and what the stuff looks like at pitch 95 vs. pitch 50 &mdash; is the data point that draft scouts are waiting for. The first 14 innings have been flawless. The next 60 will be definitive.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── 2025 Freshman Season ── */}
        <Section padding="lg" background="charcoal">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-text-primary mb-6 pb-2 border-b border-border">
                2025 Freshman Season
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-3 rounded-lg bg-surface-light border border-border-subtle">
                  <span className="text-[10px] text-text-muted block uppercase tracking-widest">ERA</span>
                  <span className="font-mono text-2xl font-bold text-burnt-orange">{FRESHMAN_STATS.era}</span>
                </div>
                <div className="p-3 rounded-lg bg-surface-light border border-border-subtle">
                  <span className="text-[10px] text-text-muted block uppercase tracking-widest">IP</span>
                  <span className="font-mono text-2xl font-bold text-text-primary">{FRESHMAN_STATS.ip}</span>
                </div>
                <div className="p-3 rounded-lg bg-surface-light border border-border-subtle">
                  <span className="text-[10px] text-text-muted block uppercase tracking-widest">Strikeouts</span>
                  <span className="font-mono text-2xl font-bold text-text-primary">{FRESHMAN_STATS.so}</span>
                </div>
                <div className="p-3 rounded-lg bg-surface-light border border-border-subtle">
                  <span className="text-[10px] text-text-muted block uppercase tracking-widest">Saves</span>
                  <span className="font-mono text-2xl font-bold text-burnt-orange">{FRESHMAN_STATS.sv}</span>
                </div>
              </div>
              <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-4">
                <p>
                  The 2025 resume is what made the 2026 conversion possible. Volantis posted a 1.94 ERA across 51 innings with 74 strikeouts as a freshman closer &mdash; elite production in a high-leverage role where most freshmen either crumble or cap out at 20 innings. He threw 51. He saved 12 games, 11 in SEC play, breaking a conference freshman record that had stood since 2003. He earned SEC Freshman of the Year honors.
                </p>
                <p>
                  That body of work gave Schlossnagle the confidence to move him into the Sunday starter role. The reasoning is straightforward: Volantis had already proven he could handle pressure situations against SEC lineups. If he could do it for two innings at a time, could he do it for seven? Two weekends in, the answer is yes &mdash; and the version of Volantis pitching deep into games with the same command he showed in the ninth is more valuable than the one saving them.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Texas Pitching Context ── */}
        <Section padding="lg">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-2 border-b border-burnt-orange/15">
                The Texas Pitching Machine
              </h2>
              <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                <p>
                  Volantis doesn&rsquo;t pitch in isolation. Texas&rsquo;s staff has a 1.53 ERA through seven games. The Riojas&ndash;Harrison&ndash;Volantis rotation has posted a 0.75 WHIP across three-game weekends. The Sunday pitching formula &mdash; Volantis into the bullpen (Crossland and Burns combining for scoreless relief innings) &mdash; hasn&rsquo;t allowed an earned run through two weekends.
                </p>
                <p>
                  For draft purposes, that context cuts two ways. On one hand, Volantis is pitching with the lead every time he takes the mound &mdash; Texas&rsquo;s lineup is hitting .321 with a .986 team OPS, led by Mendoza (.462, 3 HR). Pitching with a cushion reduces stress and lets him attack the zone. On the other hand, the pitching depth around him (Grubbs, Leffew, Burns &mdash; all portal additions from national programs) suggests this isn&rsquo;t a one-man staff propped up by a weak conference schedule. This is a complete pitching operation, and Volantis is thriving as its anchor.
                </p>
                <p>
                  The first real road test comes soon. When Texas faces SEC opponents with matching lineup depth and pitching pedigree, Volantis&rsquo;s numbers will face the scrutiny they haven&rsquo;t yet received. UC Davis and Michigan State were quality data points &mdash; the Spartans came in with a Louisville series win &mdash; but neither is an SEC weekend opponent. The draft stock escalation requires SEC-caliber results.
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
                    The closer-to-starter conversion is the most compelling individual narrative in college baseball through two weekends. Volantis has the SEC Freshman of the Year pedigree, the elite K-to-BB ratios, and now two starts that suggest the workload can scale. If this holds through March conference play, he moves from &ldquo;interesting draft-eligible sophomore&rdquo; to &ldquo;first-round starter with a reliever floor&rdquo; &mdash; the best risk-reward profile a team can buy in the 2026 class.
                  </p>
                  <p>
                    The risk is the same risk every converted reliever carries: the arm hasn&rsquo;t thrown 80+ innings in a college season. Schlossnagle will manage the workload, and the bullpen behind him (Crossland, Burns, Grubbs) gives Texas the depth to pull him at pitch 85 without worry. But draft scouts are waiting for the 6th inning of an SEC road start where the lineup has seen his slider twice and the fastball is sitting 90 instead of 93. That start will tell us whether the conversion is real or whether it&rsquo;s February small-sample theater. The first 14 innings say real.
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
                <Link href="/college-baseball/editorial/tyce-armstrong-2026-draft-profile" className="group block p-4 rounded-lg border border-border-subtle bg-surface-light hover:border-burnt-orange/30 transition-colors">
                  <span className="text-[10px] text-text-muted uppercase tracking-widest">Draft Profile</span>
                  <p className="text-sm font-display uppercase tracking-wide text-text-primary group-hover:text-burnt-orange transition-colors mt-1">
                    Tyce Armstrong &mdash; 3 Grand Slams, 50 Years
                  </p>
                </Link>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                <Link href="/college-baseball/editorial/texas-week-2-recap" className="group block p-4 rounded-lg border border-border-subtle bg-surface-light hover:border-burnt-orange/30 transition-colors">
                  <span className="text-[10px] text-text-muted uppercase tracking-widest">Related</span>
                  <p className="text-sm font-display uppercase tracking-wide text-text-primary group-hover:text-burnt-orange transition-colors mt-1">
                    Texas Week 2: Robbins Cycle, Volantis Shutout
                  </p>
                </Link>
                <Link href="/college-baseball/editorial/texas-2026" className="group block p-4 rounded-lg border border-border-subtle bg-surface-light hover:border-burnt-orange/30 transition-colors">
                  <span className="text-[10px] text-text-muted uppercase tracking-widest">Team Preview</span>
                  <p className="text-sm font-display uppercase tracking-wide text-text-primary group-hover:text-burnt-orange transition-colors mt-1">
                    Texas 2026 Season Preview
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
