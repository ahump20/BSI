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
  title: 'Jackson Flora 2026 MLB Draft Profile | UCSB RHP | Blaze Sports Intel',
  description:
    'Jackson Flora draft profile — UCSB right-hander, No. 14 on MLB Pipeline. 100 mph fastball, elite sweeper, new curveball and changeup. 6 IP, 0 R vs No. 20 Southern Miss in Week 1. Scouting report and draft analysis from Blaze Sports Intel.',
  openGraph: {
    title: 'Jackson Flora — UCSB RHP | 2026 Draft Profile',
    description:
      'No. 14 on MLB Pipeline. 100 mph fastball. New secondary arsenal. Taking over as UCSB ace after Bremner went No. 2 overall. Full scouting profile.',
    type: 'profile',
    url: 'https://blazesportsintel.com/college-baseball/editorial/jackson-flora-2026-draft-profile',
    siteName: 'Blaze Sports Intel',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jackson Flora — UCSB RHP Draft Profile | BSI',
    description: '100 mph. Elite sweeper. No. 14 draft prospect pitching like a top-5 arm.',
  },
  alternates: {
    canonical: '/college-baseball/editorial/jackson-flora-2026-draft-profile',
  },
  other: {
    'script:ld+json': JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Person',
          name: 'Jackson Flora',
          description: 'UCSB right-hander, No. 14 on MLB Pipeline 2026 draft board',
          url: 'https://blazesportsintel.com/college-baseball/editorial/jackson-flora-2026-draft-profile',
          affiliation: {
            '@type': 'SportsTeam',
            name: 'UC Santa Barbara Gauchos Baseball',
          },
        },
        {
          '@type': 'Article',
          headline: 'Jackson Flora 2026 MLB Draft Profile',
          author: { '@type': 'Organization', name: 'Blaze Sports Intel' },
          datePublished: '2026-02-25',
          url: 'https://blazesportsintel.com/college-baseball/editorial/jackson-flora-2026-draft-profile',
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

// ── Stats ────────────────────────────────────────────────────────────

const STATS = [
  { label: 'Fastball Velocity', value: '100', helperText: 'MPH — regularly touches triple digits' },
  { label: 'vs No. 20 So. Miss', value: '6 IP', helperText: '0 R, 3 H in Friday night debut' },
  { label: 'MLB Pipeline Rank', value: '#14', helperText: '2026 Draft Board' },
  { label: 'Arsenal Additions', value: '+2', helperText: 'New changeup + curveball this fall' },
];

// ── Scouting grades ──────────────────────────────────────────────────

interface ScoutingGrade {
  tool: string;
  current: number;
  future: number;
  note: string;
}

const SCOUTING_GRADES: ScoutingGrade[] = [
  { tool: 'Fastball', current: 70, future: 80, note: '100 mph with ride; elite plane and carry' },
  { tool: 'Sweeper', current: 65, future: 70, note: 'Primary putaway pitch; horizontal break devastates RHH' },
  { tool: 'Curveball', current: 45, future: 55, note: 'New this fall; 12-6 shape gives different look off fastball' },
  { tool: 'Changeup', current: 40, future: 55, note: 'New this fall; fading action; still developing feel' },
  { tool: 'Command', current: 50, future: 60, note: 'Can locate fastball up; secondaries still inconsistent' },
];

function gradeColor(grade: number): string {
  if (grade >= 70) return 'text-[#C9A227]';
  if (grade >= 60) return 'text-burnt-orange';
  if (grade >= 55) return 'text-white/80';
  if (grade >= 50) return 'text-white/60';
  return 'text-white/40';
}

// ── Page ─────────────────────────────────────────────────────────────

export default function FloraDraftProfilePage() {
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
                <Badge variant="secondary">No. 14 Prospect</Badge>
                <DataSourceBadge source="BSI Analytics" />
              </div>

              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-display text-white leading-[0.95] mb-4">
                Jackson Flora
              </h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/50 mb-6">
                <span>RHP &middot; UC Santa Barbara</span>
                <span className="hidden sm:inline">&middot;</span>
                <span>No. 14 on MLB Pipeline</span>
                <span className="hidden sm:inline">&middot;</span>
                <span>February 25, 2026</span>
              </div>

              <p className="font-serif text-xl md:text-2xl leading-relaxed text-white/70">
                One hundred miles per hour on the fastball. A new curveball and changeup added this fall. Taking over as ace after Tyler Bremner went No. 2 overall. Flora threw six scoreless innings against No. 20 Southern Miss in his first Friday start &mdash; and the new pitches already looked like they belonged.
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

        {/* ── The Opening Statement ── */}
        <Section padding="lg">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-2 border-b border-burnt-orange/15">
                The Opening Statement
              </h2>
              <div className="font-serif text-lg leading-[1.78] text-white/80 space-y-6">
                <p>
                  Flora&rsquo;s Week 1 line against No. 20 Southern Miss deserves its own paragraph: 6 innings, 0 runs, 3 hits, with the fastball touching 100 mph. Southern Miss won the series &mdash; Joey Urban&rsquo;s 8th-inning 2-run blast completed a comeback Saturday, and Matt Russo walked it off on Sunday &mdash; but Flora put himself on the national map in a way that Friday-night starters dream about. The Golden Eagles had no answer for his fastball, and the new secondaries gave hitters a problem they hadn&rsquo;t prepared for: a pitcher who could overpower them <em>and</em> change speeds.
                </p>
                <p>
                  This is the UCSB rotation post-Bremner. Tyler Bremner went No. 2 overall to the Angels in the 2025 draft, leaving the Gauchos ace role to Flora. That kind of succession plan either produces a step backward or reveals a pitcher who was always capable of being the guy. One start is a small sample, but the quality of the opponent and the efficiency of the performance suggest the second scenario. Flora didn&rsquo;t just replace Bremner&rsquo;s innings. He announced his own version of what UCSB&rsquo;s Friday night looks like.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── The Arsenal ── */}
        <Section padding="lg" background="charcoal">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-white mb-6 pb-2 border-b border-white/10">
                The Arsenal: Four Pitches Deep
              </h2>
              <div className="font-serif text-lg leading-[1.78] text-white/80 space-y-6">
                <p>
                  The scouting report on Flora coming into 2026 was simple: elite fastball, elite sweeper, and not much else. That two-pitch profile is enough to dominate in college baseball &mdash; Bremner proved it. But it caps your draft ceiling because MLB hitters can sit on two pitches and wait for one of them. The draft market pays for a third pitch, and it pays more for a fourth.
                </p>
                <p>
                  Flora added both this fall. The new curveball has 12-6 shape &mdash; a completely different look from the sweeper&rsquo;s horizontal break. Against Southern Miss, it gave right-handed hitters a pitch they had to respect in the lower half of the zone, which opened up the fastball up and the sweeper away. The changeup is still developing, with fading action that projects as average to above-average once the feel matures. Neither secondary is a finished product. But they don&rsquo;t need to be in February &mdash; they need to exist, and they need to show flashes. Both conditions are met.
                </p>
                <p>
                  The fastball remains the carrying tool. Triple digits with ride and carry &mdash; the kind of velocity that makes even good college hitters late on location pitches. The sweeper is the putaway, and it was devastating against Southern Miss: hitters chased it off the plate because the fastball&rsquo;s plane made the sweeper look hittable until it wasn&rsquo;t. That tunneling effect is what separates a thrower from a pitcher, and Flora is on the pitcher side of that line.
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
              <p className="text-xs text-white/30 mb-4 uppercase tracking-widest">
                Based on Week 1 start + fall development reports. Early evaluation &mdash; sample size is one start.
              </p>
              <div className="space-y-4">
                {SCOUTING_GRADES.map((g) => (
                  <div key={g.tool} className="flex items-start gap-4 py-3 border-b border-white/[0.06]">
                    <span className="font-display text-sm font-bold uppercase tracking-wider text-white/60 w-20 shrink-0 pt-0.5">{g.tool}</span>
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

        {/* ── The Draft Question ── */}
        <Section padding="lg" background="charcoal">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-white mb-6 pb-2 border-b border-white/10">
                The Draft Question: Top 5 or Top 15?
              </h2>
              <div className="font-serif text-lg leading-[1.78] text-white/80 space-y-6">
                <p>
                  Pipeline has Flora at No. 14 &mdash; the third-highest college arm behind Peterson and a handful of prep pitchers. But those rankings are built on fall reports and pre-season projections, not February box scores. In-season performance moves the board &mdash; and one elite Friday start against a ranked team with new secondaries flashing is the kind of data point that triggers re-evaluation.
                </p>
                <p>
                  The upside case is compelling: a right-hander with a 100 mph fastball, an elite sweeper, and two developing secondaries who&rsquo;s shown the willingness and ability to expand his arsenal. That profile, if the new pitches mature, projects as a first-round arm with No. 2 starter upside. The Bremner comparison is the floor &mdash; UCSB already produced a No. 2 overall pick from this program, and Flora was the guy learning behind him. If Flora outperforms his draft ranking through the spring, the narrative writes itself.
                </p>
                <p>
                  The risk is the same risk every pitcher carries with new secondaries: feel comes and goes, and the pitch that looked sharp in a February Friday start might disappear in a May conference series when the adrenaline is different and the lineup has an advance report. Peterson&rsquo;s Opening Day meltdown at Florida &mdash; 5 walks, didn&rsquo;t survive the fourth &mdash; is the reminder that February and May are different sports. Flora&rsquo;s development arc will be measured start-to-start, and the SEC-caliber opponents on UCSB&rsquo;s schedule (however few they face) will tell us more than the first line in the box score.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── BSI Verdict ── */}
        <Section padding="lg">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <div className="relative border border-burnt-orange/20 rounded-lg p-6 md:p-8">
                <div className="absolute -top-2.5 left-8 font-display text-[11px] tracking-[3px] uppercase bg-midnight text-burnt-orange px-3">
                  BSI Verdict
                </div>
                <div className="font-serif text-lg leading-relaxed text-[#FAF7F2] space-y-4">
                  <p>
                    One start. That&rsquo;s the sample. And that&rsquo;s the honest caveat before everything else: Flora&rsquo;s 2026 evaluation is built on a single Friday night against Southern Miss and the fall development reports that preceded it. The fastball velocity is confirmed. The sweeper is confirmed. The new pitches exist. Everything beyond that is projection.
                  </p>
                  <p>
                    What makes Flora worth watching &mdash; and worth this profile at No. 14 rather than waiting for a larger sample &mdash; is the trajectory. A pitcher who adds two pitches in one offseason and immediately deploys them against a ranked opponent isn&rsquo;t just adding tools. He&rsquo;s signaling that he understands what the next level requires and is willing to go through the uncomfortable process of throwing pitches he doesn&rsquo;t fully command yet to develop them for when he will. That&rsquo;s the kind of development bet that moves draft boards. If the curveball and changeup show continued progress through March, Flora&rsquo;s No. 14 ranking is the floor, not the ceiling.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Related + CTA ── */}
        <Section padding="lg" background="charcoal">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-white/40 mb-4">More 2026 Draft Profiles</h3>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <Link href="/college-baseball/editorial/roch-cholowsky-2026-draft-profile" className="group block p-4 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:border-burnt-orange/30 transition-colors">
                  <span className="text-[10px] text-white/30 uppercase tracking-widest">Draft Profile</span>
                  <p className="text-sm font-display uppercase tracking-wide text-white group-hover:text-burnt-orange transition-colors mt-1">
                    Roch Cholowsky &mdash; No. 1 Overall Pick
                  </p>
                </Link>
                <Link href="/college-baseball/editorial/dylan-volantis-2026-draft-profile" className="group block p-4 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:border-burnt-orange/30 transition-colors">
                  <span className="text-[10px] text-white/30 uppercase tracking-widest">Draft Profile</span>
                  <p className="text-sm font-display uppercase tracking-wide text-white group-hover:text-burnt-orange transition-colors mt-1">
                    Dylan Volantis &mdash; 14 IP, 0 ER, The Conversion
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
                <Link href="/college-baseball/editorial/week-1-recap" className="group block p-4 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:border-burnt-orange/30 transition-colors">
                  <span className="text-[10px] text-white/30 uppercase tracking-widest">Related</span>
                  <p className="text-sm font-display uppercase tracking-wide text-white group-hover:text-burnt-orange transition-colors mt-1">
                    Week 1 Recap: Three Grand Slams. One Record Book.
                  </p>
                </Link>
                <Link href="/college-baseball/editorial/what-two-weekends-told-us" className="group block p-4 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:border-burnt-orange/30 transition-colors">
                  <span className="text-[10px] text-white/30 uppercase tracking-widest">Analysis</span>
                  <p className="text-sm font-display uppercase tracking-wide text-white group-hover:text-burnt-orange transition-colors mt-1">
                    What Two Weekends Actually Told Us
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
