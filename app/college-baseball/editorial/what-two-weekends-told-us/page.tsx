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
  title: 'What Two Weekends of College Baseball Actually Told Us | Blaze Sports Intel',
  description:
    'An analytical breakdown of what the first 14 games of the 2026 college baseball season actually revealed — and what was noise. Transfer portal impact, pitching arms race, the undefeated problem, and which early-season data predicts Omaha.',
  openGraph: {
    title: 'What Two Weekends of College Baseball Actually Told Us',
    description:
      'Eight undefeated Top 25 teams. A 22-year save record broken. Two cycles in one weekend. Here is what the data says matters — and what it doesn\'t.',
    type: 'article',
    url: 'https://blazesportsintel.com/college-baseball/editorial/what-two-weekends-told-us',
    siteName: 'Blaze Sports Intel',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'What Two Weekends Actually Told Us | BSI',
    description: 'The analytical breakdown of 2026 college baseball through 14 games. Signal vs. noise.',
  },
  alternates: {
    canonical: '/college-baseball/editorial/what-two-weekends-told-us',
  },
  other: {
    'script:ld+json': JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'What Two Weekends of College Baseball Actually Told Us',
      author: { '@type': 'Organization', name: 'Blaze Sports Intel' },
      datePublished: '2026-02-25',
      url: 'https://blazesportsintel.com/college-baseball/editorial/what-two-weekends-told-us',
      isPartOf: {
        '@type': 'WebSite',
        name: 'Blaze Sports Intel',
        url: 'https://blazesportsintel.com',
      },
    }),
  },
};

// ── Stats ────────────────────────────────────────────────────────────

const STATS = [
  { label: 'Undefeated Top 25 teams', value: '8', helperText: 'After Weekend 2' },
  { label: 'Ranked series lost by road teams', value: '4', helperText: 'Of 6 ranked matchups' },
  { label: 'Biggest poll drop', value: '-11', helperText: 'TCU: No. 7 to No. 18' },
  { label: 'Portal players named weekly honors', value: '5+', helperText: 'SEC, Big 12, Big Ten' },
];

// ── Undefeated teams ────────────────────────────────────────────────

interface UndefeatedTeam {
  rank: number;
  team: string;
  record: string;
  runsFor: number;
  runsAgainst: number;
  bestWin: string;
  concern: string;
}

const UNDEFEATED: UndefeatedTeam[] = [
  { rank: 2, team: 'LSU', record: '8-0', runsFor: 89, runsAgainst: 30, bestWin: 'Indiana (Jax Classic)', concern: 'No ranked opponent yet' },
  { rank: 3, team: 'Texas', record: '7-0', runsFor: 57, runsAgainst: 9, bestWin: 'Michigan State (took series at Louisville)', concern: 'UC Davis + MSU — not SEC-caliber' },
  { rank: 4, team: 'Mississippi State', record: '8-0', runsFor: 90, runsAgainst: 23, bestWin: 'Hofstra/Delaware — no ranked tests', concern: 'Schedule is weakest of undefeateds' },
  { rank: 5, team: 'Georgia Tech', record: '8-0', runsFor: 100, runsAgainst: 19, bestWin: 'Bowling Green (50-11)', concern: '10+ runs in 6 straight — sustainable?' },
  { rank: 10, team: 'Florida', record: '7-0', runsFor: 52, runsAgainst: 18, bestWin: 'UAB (after losing opener in extras)', concern: 'Peterson opened with 5 BB' },
  { rank: 13, team: 'Oklahoma', record: '7-0', runsFor: 81, runsAgainst: 4, bestWin: 'Coppin State (57-1 combined)', concern: 'Opponents have 4 total runs' },
  { rank: 17, team: 'Miami (FL)', record: '9-0', runsFor: 144, runsAgainst: 39, bestWin: 'Lehigh sweep', concern: '144 runs against whom?' },
  { rank: 23, team: 'Texas A&M', record: '7-0', runsFor: 68, runsAgainst: 18, bestWin: 'Penn sweep', concern: 'Sorrell carrying the offense' },
];

// ── Page ─────────────────────────────────────────────────────────────

export default function WhatTwoWeekendsToldUsPage() {
  return (
    <>
      <div className="pt-6 bg-midnight">
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
                <span className="text-text-tertiary">Analysis</span>
              </div>

              <div className="flex flex-wrap items-center gap-3 mb-4">
                <Badge variant="primary">Analysis</Badge>
                <Badge variant="secondary">Signal vs. Noise</Badge>
                <DataSourceBadge source="BSI Analytics" />
              </div>

              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-display text-text-primary leading-[0.95] mb-4">
                What Two Weekends of College Baseball Actually Told Us
              </h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-tertiary mb-6">
                <span>February 25, 2026</span>
                <span>&middot;</span>
                <span>12 min read</span>
              </div>

              <p className="font-serif text-xl md:text-2xl leading-relaxed text-text-secondary">
                Eight undefeated teams in the Top 25. A consensus No. 1 pick who hit 6 home runs in 7 games. A converted closer who hasn&rsquo;t allowed a run. Two cycles in one weekend. And none of it means what you think it means &mdash; at least not yet.
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

        {/* ── The Premise ── */}
        <Section padding="lg">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-2 border-b border-burnt-orange/15">
                The Premise
              </h2>
              <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                <p>
                  February college baseball exists in a data paradox. Every game is live ammunition &mdash; the wins and losses count, the arms are real, the box scores go on the permanent record. But the signal-to-noise ratio is so low that most of what we think we learned in the first two weekends won&rsquo;t survive contact with conference play. The challenge is separating what <em>will</em> survive from what won&rsquo;t.
                </p>
                <p>
                  This isn&rsquo;t a recap. BSI already published full breakdowns of <Link href="/college-baseball/editorial/week-1-recap" className="text-burnt-orange hover:text-ember transition-colors">Week 1</Link> and <Link href="/college-baseball/editorial/weekend-2-recap" className="text-burnt-orange hover:text-ember transition-colors">Weekend 2</Link>. This is the analytical question underneath the results: what data from the first 14 games actually has predictive value, and what data will be irrelevant by April?
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Signal 1: The Undefeated Problem ── */}
        <Section padding="lg" background="charcoal">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-text-primary mb-6 pb-2 border-b border-border">
                Signal 1: Eight Undefeated Teams Is Not Eight Elite Teams
              </h2>
              <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                <p>
                  Through two weekends, eight Top 25 teams are undefeated. Zero losses sounds dominant. But the quality of those zeros varies dramatically, and the variance is the data point.
                </p>
              </div>
            </ScrollReveal>

            {/* Undefeated table */}
            <ScrollReveal direction="up" delay={50}>
              <div className="overflow-x-auto mt-6">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-strong">
                      {['Rk', 'Team', 'W-L', 'RF', 'RA', 'Best Win', 'BSI Concern'].map((h) => (
                        <th key={h} className="py-3 px-3 text-xs font-semibold text-text-muted uppercase text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {UNDEFEATED.map((t) => (
                      <tr key={t.team} className="border-b border-border">
                        <td className="py-3 px-3 text-text-primary text-sm font-mono">{t.rank}</td>
                        <td className="py-3 px-3 text-text-primary text-sm font-semibold">{t.team}</td>
                        <td className="py-3 px-3 text-success text-sm font-bold">{t.record}</td>
                        <td className="py-3 px-3 text-text-primary text-sm text-center">{t.runsFor}</td>
                        <td className="py-3 px-3 text-text-primary text-sm text-center">{t.runsAgainst}</td>
                        <td className="py-3 px-3 text-text-tertiary text-sm">{t.bestWin}</td>
                        <td className="py-3 px-3 text-text-muted text-sm italic">{t.concern}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6 mt-6">
                <p>
                  Oklahoma has outscored opponents 81-4. That&rsquo;s not elite performance &mdash; that&rsquo;s a schedule that hasn&rsquo;t asked a question yet. Mississippi State at 8-0 hasn&rsquo;t faced a ranked team. Miami&rsquo;s 9-0 record and 144 runs scored are impressive raw numbers against opposition that will have combined losing records by April. The undefeated records are real. The competition that produced them isn&rsquo;t, for most of these teams.
                </p>
                <p>
                  The two undefeated teams with actual data: <strong className="text-text-primary font-semibold">Texas (7-0)</strong> swept Michigan State, which had just taken a series from No. 8 Louisville &mdash; a transitive quality point that holds up. <strong className="text-text-primary font-semibold">Florida (7-0)</strong> survived an Opening Day loss-in-everything-but-final-score to UAB before righting the ship. Both have dealt with adversity or quality opponents. That makes their zeros different from the rest.
                </p>
                <p>
                  <strong className="text-text-primary font-semibold">The signal:</strong> Undefeated records through two weekends predict nothing about postseason success. In 2025, three of the four CWS semifinalists lost at least one game in February. What matters is <em>how</em> teams win &mdash; and whether the pitching depth, situational hitting, and defensive consistency hold up when the schedule upgrades. The zeros are about to get stress-tested.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Signal 2: Pitching Arms Race ── */}
        <Section padding="lg">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-2 border-b border-burnt-orange/15">
                Signal 2: The Pitching Arms Race Is Real &mdash; and the Closers Are Becoming Starters
              </h2>
              <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                <p>
                  The most interesting pitching story through two weekends isn&rsquo;t velocity &mdash; it&rsquo;s role conversion. <Link href="/college-baseball/editorial/dylan-volantis-2026-draft-profile" className="text-burnt-orange hover:text-ember transition-colors">Dylan Volantis</Link> at Texas converted from closer (12 saves, 1.94 ERA as a freshman) to Sunday starter and hasn&rsquo;t allowed an earned run through 14 innings. That&rsquo;s not an isolated experiment. It&rsquo;s a trend.
                </p>
                <p>
                  The 34-scholarship era changed pitching math. Programs now have enough arms to stack bullpens deep enough that their best reliever can move into the rotation without creating a pen vacuum. Texas can move Volantis to Sundays because Crossland and Burns (portal additions from Arizona State and other programs) can cover the 8th and 9th. LSU can develop Cooper Moore (Kansas portal) as a starter because the bullpen behind him absorbed the innings he vacated. The roster flexibility that portal depth creates has directly enabled the closer-to-starter conversion pipeline.
                </p>
                <p>
                  At the other end of the spectrum, <Link href="/college-baseball/editorial/jackson-flora-2026-draft-profile" className="text-burnt-orange hover:text-ember transition-colors">Jackson Flora</Link> at UCSB &mdash; the No. 14 draft prospect with a 100 mph fastball &mdash; added a curveball and changeup this fall to expand from a two-pitch reliever profile to a four-pitch starter arsenal. The market incentive is clear: starters get drafted higher and signed for more money. The pitching arms race in 2026 isn&rsquo;t just about velocity. It&rsquo;s about role expansion.
                </p>
                <p>
                  <strong className="text-text-primary font-semibold">The signal:</strong> Watch which converted arms maintain their efficiency in the 5th-7th innings of March starts. The third-time-through-the-order penalty is the cliff that most former relievers fall off. Volantis has cleared it twice. Flora has one data point. By Weekend 6, we&rsquo;ll know which conversions are real and which were February theater.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Signal 3: Transfer Portal ── */}
        <Section padding="lg" background="charcoal">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-text-primary mb-6 pb-2 border-b border-border">
                Signal 3: The Transfer Portal Decided Week 1 Before Week 1 Happened
              </h2>
              <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                <p>
                  The results that shocked people in Week 1 were predictable if you tracked portal movement over the offseason. Oklahoma&rsquo;s 3-0 Shriners run was powered by Cameron Johnson &mdash; a 6-foot-6 lefty who posted a 5.57 ERA at LSU, transferred to Norman, and immediately struck out 11 on Opening Friday. Texas A&amp;M&rsquo;s Caden Sorrell (Maryland portal) earned SEC Player of the Week with 2 HR and 5 RBI in game one. Virginia scored 56 runs in a Saturday doubleheader behind AJ Gracia, the Duke transfer. Macon Winslow (Duke &rarr; UNC) hit a walk-off homer in the 11th to complete a sweep.
                </p>
                <p>
                  Weekend 2 deepened the pattern. Kevin Robbins (Notre Dame &rarr; Texas) hit for the cycle against Michigan State &mdash; the first by a Longhorn in eleven years. The portal-loaded rosters aren&rsquo;t just contributing; they&rsquo;re defining the identity of the teams they joined. Oklahoma doesn&rsquo;t have an undefeated record without Johnson. Texas A&amp;M doesn&rsquo;t start 7-0 without Sorrell. Texas&rsquo;s lineup doesn&rsquo;t have zero holes without Robbins and Becerra (Stanford portal) and Tinney and Larson (LSU portal).
                </p>
                <p>
                  <strong className="text-text-primary font-semibold">The signal:</strong> Portal impact is measurable and immediate in 2026. The teams that win the portal win the February narrative. The question that March answers is whether February portal heroes sustain production against advance scouting and repeated exposure. Johnson struck out 11 against Texas Tech, a rebuilding program. What happens when he faces an SEC lineup that has a week of video on his delivery? That&rsquo;s the difference between a portal success story and a one-month rental.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Signal 4: The Real Separation ── */}
        <Section padding="lg">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-2 border-b border-burnt-orange/15">
                Signal 4: One Team Already Separated Itself
              </h2>
              <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                <p>
                  <Link href="/college-baseball/editorial/roch-cholowsky-2026-draft-profile" className="text-burnt-orange hover:text-ember transition-colors">UCLA swept No. 7 TCU 30-8.</Link> That result did more than confirm the No. 1 ranking. It eliminated the ambiguity about the gap between UCLA and the next tier. Cholowsky&rsquo;s 3 HR against a staff that had held two ranked teams to 4 runs each the week before. Gasparino going 7-for-13. TCU&rsquo;s ace unavailable. The Bruins didn&rsquo;t beat TCU &mdash; they made TCU look like a mid-major in a three-game demolition.
                </p>
                <p>
                  TCU&rsquo;s 11-spot drop &mdash; from No. 7 to No. 18 &mdash; is the largest single-week fall of the season. But the real data point is what it says about the Top 5: the teams ranked 2-5 haven&rsquo;t played anyone as good as TCU was supposed to be. LSU went 3-0 at the Jax Classic against Indiana, Notre Dame, and UCF. Mississippi State swept Delaware. Georgia Tech demolished Bowling Green 50-11. UCLA is the only top-5 team that faced ranked competition and won decisively. The others are undefeated against schedules that haven&rsquo;t forced them to reveal their ceilings.
                </p>
                <p>
                  <strong className="text-text-primary font-semibold">The signal:</strong> UCLA&rsquo;s dominance against quality opposition is the strongest data point of the first two weekends. Everything else is contextual. If you&rsquo;re ranking teams on what they&rsquo;ve actually proven, UCLA is in a tier by itself. The rest are working with smaller evidence.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── The Noise ── */}
        <Section padding="lg" background="charcoal">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-text-primary mb-6 pb-2 border-b border-border">
                What Was Noise
              </h2>
              <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                <p>
                  <strong className="text-text-primary font-semibold">Run differentials against non-conference opponents.</strong> Oklahoma outscoring Coppin State 57-1 tells you nothing about Oklahoma&rsquo;s ability to compete in the SEC. Miami scoring 144 runs in 9 games tells you their schedule was soft, not that their offense is historically great. Strip away the cupcakes and the data set shrinks to near-irrelevance for most programs.
                </p>
                <p>
                  <strong className="text-text-primary font-semibold">Single-game upsets without series context.</strong> UAB beat Florida on Opening Day. Florida then run-ruled in Game 2 and won Game 3 comfortably. Evansville shut out Kentucky in a doubleheader split. Kentucky won the series. The upset headlines generate clicks; the series results predict trajectory. If a ranked team drops a game but wins the series, the loss is probably noise. If they drop the series &mdash; like Louisville against Michigan State &mdash; that&rsquo;s signal.
                </p>
                <p>
                  <strong className="text-text-primary font-semibold">Individual stat lines against overmatched pitching.</strong> Tyce Armstrong&rsquo;s 3 grand slams in 3 games tied a 50-year NCAA record. It was a remarkable achievement. But the opponent was Niagara, which will not appear on anyone&rsquo;s strength of schedule. The individual accomplishment is real. The predictive value for how Armstrong performs against SEC pitching is approximately zero. Same logic applies to Georgia Tech&rsquo;s 27-run game against Bowling Green, or any stat line compiled against a team with a sub-.300 winning percentage last season.
                </p>
                <p>
                  <strong className="text-text-primary font-semibold">Preseason rankings through two weekends.</strong> TCU was No. 7 two weeks ago. They&rsquo;re No. 18 now. Louisville was No. 8. They&rsquo;re unranked. The Coaches Poll in February is a credibility proxy, not a predictive instrument. The real rankings emerge from conference play data in April. Everything until then is narrative management.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── What to Watch ── */}
        <Section padding="lg">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-2 border-b border-burnt-orange/15">
                What Weekends 3&ndash;6 Need to Confirm
              </h2>
              <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                <p>
                  <strong className="text-text-primary font-semibold">1. UCLA&rsquo;s lineup depth against SEC-caliber pitching.</strong> The Bruins dismantled TCU&rsquo;s staff. But TCU&rsquo;s ace was out with elbow soreness. The first time UCLA faces a fully healthy top-15 rotation, we&rsquo;ll know whether the 30-8 series was a ceiling or a mismatch.
                </p>
                <p>
                  <strong className="text-text-primary font-semibold">2. Volantis at pitch 90+ in an SEC road environment.</strong> The closer-to-starter conversion has produced 14 perfect innings. The sample needs to triple before it&rsquo;s definitive. Specifically: what does the slider look like in the 6th inning of a road start where the opponent has seen it twice?
                </p>
                <p>
                  <strong className="text-text-primary font-semibold">3. Whether the 8 undefeated records survive first contact with ranked opposition.</strong> By Weekend 6, half these teams will have their first loss. How they respond will tell us more than the unbeaten run itself.
                </p>
                <p>
                  <strong className="text-text-primary font-semibold">4. Portal hitter production against advance scouting.</strong> Sorrell, Robbins, Gracia, and Sosa all dominated in the first two weekends. The pitchers they faced had no video of them in their new uniforms. The next round of games is different.
                </p>
                <p>
                  <strong className="text-text-primary font-semibold">5. Whether Liam Peterson fixes the walk problem.</strong> Florida&rsquo;s No. 9 overall draft prospect walked 5 batters in his Opening Day start. He&rsquo;s too talented for that to be his baseline. But if it recurs in Week 3 or 4, it&rsquo;s a mechanical issue, not a bad night &mdash; and that changes his draft trajectory.
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
                    Two weekends of college baseball gave us one reliable conclusion and a series of interesting questions. The conclusion: UCLA is the best team in the country and has proven it against the best opposition anyone has faced. The interesting questions: whether Texas&rsquo;s pitching depth (1.53 staff ERA) survives SEC play, whether the portal-loaded rosters maintain production against advance scouting, and whether the 8 undefeated teams are building something or just haven&rsquo;t been tested yet.
                  </p>
                  <p>
                    The analytical instinct in February is to project forward &mdash; to take two weekends of data and extrapolate to June. Resist it. The data is real but the sample is small. The teams that look dominant now are operating against schedules that haven&rsquo;t asked their hardest questions. Conference play is the asking. Everything before it is the preface. Read it carefully, but don&rsquo;t confuse the preface for the book.
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
              <div className="grid md:grid-cols-3 gap-4 mb-8">
                <Link href="/college-baseball/editorial/roch-cholowsky-2026-draft-profile" className="group block p-4 rounded-lg border border-border-subtle bg-surface-light hover:border-burnt-orange/30 transition-colors">
                  <span className="text-[10px] text-text-muted uppercase tracking-widest">Draft Profile</span>
                  <p className="text-sm font-display uppercase tracking-wide text-text-primary group-hover:text-burnt-orange transition-colors mt-1">
                    Cholowsky: The No. 1 Pick
                  </p>
                </Link>
                <Link href="/college-baseball/editorial/dylan-volantis-2026-draft-profile" className="group block p-4 rounded-lg border border-border-subtle bg-surface-light hover:border-burnt-orange/30 transition-colors">
                  <span className="text-[10px] text-text-muted uppercase tracking-widest">Draft Profile</span>
                  <p className="text-sm font-display uppercase tracking-wide text-text-primary group-hover:text-burnt-orange transition-colors mt-1">
                    Volantis: 14 IP, 0 ER
                  </p>
                </Link>
                <Link href="/college-baseball/editorial/jackson-flora-2026-draft-profile" className="group block p-4 rounded-lg border border-border-subtle bg-surface-light hover:border-burnt-orange/30 transition-colors">
                  <span className="text-[10px] text-text-muted uppercase tracking-widest">Draft Profile</span>
                  <p className="text-sm font-display uppercase tracking-wide text-text-primary group-hover:text-burnt-orange transition-colors mt-1">
                    Flora: 100 MPH at UCSB
                  </p>
                </Link>
              </div>

              <Link href="/college-baseball/editorial" className="text-xs text-text-muted hover:text-burnt-orange transition-colors uppercase tracking-widest">
                All Editorial &rarr;
              </Link>
            </ScrollReveal>

            <div className="mt-10">
              <IntelSignup sport="college_baseball" />
            </div>
          </Container>
        </Section>
      </div>
      <Footer />
    </>
  );
}
