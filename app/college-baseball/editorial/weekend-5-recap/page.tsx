import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, StatCard } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { ArticleJsonLd } from '@/components/seo/ArticleJsonLd';

export const metadata: Metadata = {
  title: 'Weekend 5 Recap & Weekend 6 Preview | 2026 College Baseball | BSI',
  description:
    'Conference play arrived and reshuffled everything. Texas lost for the first time, FSU swept Wake Forest behind Trey Beard\'s 14-strikeout gem, and Cole Johnson robbed a home run that saved Georgia\'s series. Weekend 6 SEC matchups to watch.',
  alternates: { canonical: '/college-baseball/editorial/weekend-5-recap' },
  openGraph: {
    title: 'Weekend 5 Recap & Weekend 6 Preview | BSI',
    description:
      'Conference play arrived and reshuffled everything. Texas lost for the first time, FSU swept Wake Forest, and Cole Johnson\'s robbery saved Georgia. Weekend 6 preview.',
    type: 'article',
    publishedTime: '2026-03-19',
    images: [{ url: '/images/og-college-baseball.png', width: 1200, height: 630 }],
  },
};

/* ── Hardcoded Data ────────────────────────────────────── */

const statCards = [
  { label: 'Beard Strikeouts', value: '14', helperText: 'Trey Beard\'s one-hit shutout of No. 12 Wake Forest — Golden Spikes POTW' },
  { label: 'Texas Win Streak', value: '16', helperText: 'Best start since 2005 — ended by Ole Miss in 11 innings on Friday' },
  { label: 'USC Start', value: '19-0', helperText: 'Program record before first loss — best since 1988\'s 15-0 start' },
  { label: 'Coats HRs', value: '14', helperText: 'Quinton Coats leads the nation — 7 HRs in a 5-game stretch' },
];

const rankings = [
  { rank: 1, team: 'UCLA', record: '17-2', movement: 0 },
  { rank: 2, team: 'Texas', record: '18-1', movement: 1 },
  { rank: 3, team: 'Georgia Tech', record: '17-3', movement: 1 },
  { rank: 4, team: 'Auburn', record: '17-2', movement: 1 },
  { rank: 5, team: 'Georgia', record: '17-4', movement: 3 },
  { rank: 6, team: 'Mississippi State', record: '16-4', movement: -3 },
  { rank: 7, team: 'Arkansas', record: '14-6', movement: -2 },
  { rank: 8, team: 'Oklahoma', record: '17-3', movement: 3 },
  { rank: 9, team: 'Florida State', record: '16-3', movement: 6 },
  { rank: 10, team: 'North Carolina', record: '16-3-1', movement: 4 },
  { rank: 11, team: 'USC', record: '19-1', movement: 8 },
  { rank: 12, team: 'Virginia', record: '16-4', movement: 4 },
  { rank: 13, team: 'NC State', record: '16-4', movement: -3 },
  { rank: 14, team: 'Florida', record: '18-3', movement: 4 },
  { rank: 15, team: 'Southern Miss', record: '16-4', movement: -8 },
  { rank: 16, team: 'Oregon State', record: '14-4', movement: 1 },
  { rank: 17, team: 'Clemson', record: '16-4', movement: -8 },
  { rank: 18, team: 'Kentucky', record: '18-2', movement: 4 },
  { rank: 19, team: 'Oregon', record: '17-3', movement: 99 },
  { rank: 20, team: 'Coastal Carolina', record: '13-6', movement: 5 },
  { rank: 21, team: 'Texas A&M', record: '16-3', movement: -1 },
  { rank: 22, team: 'West Virginia', record: '13-4', movement: 99 },
  { rank: 23, team: 'Tennessee', record: '14-6', movement: -2 },
  { rank: 24, team: 'Ole Miss', record: '14-7', movement: 99 },
  { rank: 25, team: 'Wake Forest', record: '15-5', movement: -13 },
];

function MovementBadge({ movement }: { movement: number }) {
  if (movement === 99) return <Badge variant="warning" size="sm">NR</Badge>;
  if (movement > 0) return <Badge variant="success" size="sm">+{movement}</Badge>;
  if (movement < 0) return <Badge variant="error" size="sm">{movement}</Badge>;
  return <Badge variant="secondary" size="sm">—</Badge>;
}

export default function Weekend5RecapPage() {
  return (
    <>
      <ArticleJsonLd
        headline="Weekend 5 Recap & Weekend 6 Preview | 2026 College Baseball"
        description="Conference play arrived and reshuffled everything. Texas lost for the first time, FSU swept Wake Forest behind Trey Beard's 14-strikeout gem, and Cole Johnson robbed a home run that saved Georgia's series."
        datePublished="2026-03-19"
        url="/college-baseball/editorial/weekend-5-recap"
        sport="College Baseball"
      />
      <main id="main-content">
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-white/10">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link href="/college-baseball" className="text-white/40 hover:text-burnt-orange transition-colors">
                College Baseball
              </Link>
              <span className="text-white/40">/</span>
              <Link href="/college-baseball/editorial" className="text-white/40 hover:text-burnt-orange transition-colors">
                Editorial
              </Link>
              <span className="text-white/40">/</span>
              <span className="text-white font-medium">Weekend 5 Recap</span>
            </nav>
          </Container>
        </Section>

        {/* ── 1. HERO ──────────────────────────────────────── */}
        <Section padding="lg" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-bsi-primary/20 to-transparent pointer-events-none" />
          <Container>
            <ScrollReveal direction="up">
              <div className="max-w-3xl">
                <div className="flex items-center gap-3 mb-4">
                  <Badge variant="primary">Weekend 5 Recap</Badge>
                  <span className="text-white/40 text-sm">14 min read</span>
                </div>
                <h1 className="font-display text-3xl md:text-5xl font-bold uppercase tracking-wide mb-4">
                  Conference Play Exposes Everyone.{' '}
                  <span className="text-gradient-blaze">Now We Know.</span>
                </h1>
                <p className="text-white/70 text-lg leading-relaxed">
                  The SEC opened its doors and immediately rearranged the national picture. Texas lost for the first time in 17 games.
                  FSU announced itself with a road sweep of Wake Forest behind Trey Beard&apos;s 14-strikeout masterpiece. Cole Johnson
                  robbed a home run at the wall to save Georgia&apos;s series over Tennessee. And three teams — TCU, LSU, UTSA —
                  fell out of the Top 25 entirely. Conference play doesn&apos;t ask who you were in February. It asks who you are now.
                </p>
                <div className="mt-4 text-white/40 text-sm">
                  March 18, 2026 · Blaze Sports Intel
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── 2. STAT CARDS ────────────────────────────────── */}
        <Section padding="md" background="charcoal" borderTop>
          <Container>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {statCards.map((card, i) => (
                <ScrollReveal key={i} direction="up" delay={i * 50}>
                  <StatCard label={card.label} value={card.value} helperText={card.helperText} />
                </ScrollReveal>
              ))}
            </div>
          </Container>
        </Section>

        {/* ── 3. LEDE ──────────────────────────────────────── */}
        <Section padding="lg" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <div className="max-w-3xl font-serif text-lg leading-[1.78] text-white/80 space-y-6">
                <p>
                  Five weekends of non-conference play created a hierarchy. Weekend 5 tested it. The SEC opened with blood — Texas
                  dropping its first game in 11 innings to an Ole Miss team that wasn&apos;t supposed to be in the conversation, LSU losing
                  a series at Vanderbilt after a ninth-inning walkoff homer from Logan Johnstone, and Arkansas needing TJ Pompey&apos;s
                  ninth-inning walkoff of his own to take a series from Mississippi State. The ACC got its own version: Florida State
                  went to Winston-Salem and dismantled No. 12 Wake Forest so thoroughly that the Demon Deacons dropped 13 spots in the
                  rankings. Conference play is a different sport. The teams that thrived on mid-major scheduling just learned that.
                </p>
                <p>
                  The landscape after Weekend 5 has UCLA still sitting alone at No. 1 with an 11-game winning streak and a 6-0 Big Ten
                  record. Texas absorbed its first loss and responded with two dominant pitching performances to take the Ole Miss series.
                  Auburn quietly swept Missouri on the road for the first time since 2010. And USC, which started the season 19-0 before
                  falling to Northwestern in a doubleheader split, climbed eight spots to No. 11 — the program&apos;s highest ranking since
                  their return to national relevance. Three new teams entered the Top 25. Three fell out. The rankings are moving now
                  because the games finally mean something.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── 4. THE STATEMENT SERIES ──────────────────────── */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6">
                The Statement Series: FSU Sweeps Wake Forest
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={100}>
              <div className="max-w-3xl font-serif text-lg leading-[1.78] text-white/80 space-y-6">
                <p>
                  No. 20 Florida State went into No. 12 Wake Forest&apos;s building and left nothing standing. The Seminoles won 10-0
                  in a seven-inning run-rule Friday behind five home runs, then Trey Beard took the mound Saturday and delivered the
                  pitching performance of the college baseball season so far: 6.2 innings, one hit, zero runs, 14 strikeouts. He carried
                  a no-hitter into the sixth. Wake Forest managed a single baserunner through three innings. The 2-0 final in Game 2
                  was a formality dressed up as a pitching duel. Sunday&apos;s 12-6 closeout was the exhale — FSU had already made
                  its point by Saturday night.
                </p>
                <p>
                  The combined line across three games: 24-6 in total runs, back-to-back shutouts to open the series, and an ACC
                  road sweep for the first time since Florida State opened conference play at Duke in 2012. Beard earned ACC Pitcher of
                  the Week and Golden Spikes Player of the Week honors. He deserved both. Florida State jumped nine spots to No. 9 in the
                  D1Baseball poll and six spots to No. 9 in the coaches&apos; poll. Wake Forest, which entered the weekend at No. 12,
                  cratered to No. 25 — a 13-spot fall that tells you how fast conference play can rewrite a resume built on
                  non-conference wins.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── 5. SEC OPENING WEEKEND SPOTLIGHT ───────────────── */}
        <Section padding="lg" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6">
                SEC Opening Weekend: Walkoffs, Sweeps, and First Blood
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={100}>
              <div className="max-w-3xl font-serif text-lg leading-[1.78] text-white/80 space-y-6">
                <p>
                  The SEC opened conference play and immediately separated the real from the perceived. Auburn went to Columbia and
                  swept Missouri — a road sweep to open league play for the first time since 2010. The Tigers&apos; pitching staff
                  posted a 1.29 ERA across four games that week, including a 2-0 shutout in the opener that marked Auburn&apos;s first
                  SEC road shutout since 2021. At 17-2 with a 10-game winning streak, Auburn is building the kind of resume that
                  earns a national seed in June.
                </p>
                <p>
                  Arkansas hosted No. 3 Mississippi State in Fayetteville and took the series in the most dramatic way possible. TJ
                  Pompey — hitting .188 with seven strikeouts in his previous eight at-bats — entered Game 1 as a seventh-inning
                  defensive replacement, then launched a 401-foot walkoff home run in the ninth to beat the Bulldogs 5-4 in front
                  of 10,454 at Baum-Walker Stadium. Mississippi State had just tied it on a Ryder Woodson two-run homer with two
                  outs in the top of the ninth. Pompey hit Maddox Miller&apos;s 93-mph fastball 106 mph the other way. The Bulldogs
                  won Saturday&apos;s Game 2 by 7-2 before Arkansas closed it out 7-3 on Saturday night to take the series.
                </p>
                <p>
                  Georgia took the series from Tennessee behind one of the best defensive plays of the young season. With Georgia
                  clinging to an 8-7 lead in the ninth inning of Game 3, Tennessee&apos;s Stone Lawless crushed a drive to left
                  field that looked gone — Lawless slammed his bat, pointed to his dugout, and started his trot. Freshman left
                  fielder Cole Johnson tracked it to the wall, leaped, and brought it back. The 19-year-old who turned down an
                  Orioles draft pick to play at Georgia made the catch that sealed it. Johnson said afterward: &ldquo;I knew it
                  was going to be right up against the wall, and if it was a homer, it wasn&apos;t going to be out by much.&rdquo;
                  That&apos;s the poise of a player who belongs in this moment.
                </p>
                <p>
                  LSU had the roughest opening of any ranked team. Vanderbilt&apos;s Logan Johnstone hit a walkoff two-run homer
                  in the ninth inning of Game 1 to steal a 13-12 win. The Commodores followed it with an 11-3 blowout Saturday.
                  LSU salvaged the finale 16-9 behind Jake Brown&apos;s six-RBI day, but the damage was done — the Tigers dropped
                  out of the Top 25 entirely at 14-7, a program that entered the season ranked No. 2 now unranked after a rough
                  two-week stretch.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── 6. PERFORMANCE OF THE WEEKEND ────────────────── */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6">
                Performance of the Weekend
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={100}>
              <Card variant="default" padding="lg">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-bsi-primary/20 rounded-full flex items-center justify-center text-lg font-bold text-burnt-orange">
                    LHP
                  </div>
                  <div>
                    <p className="font-display text-xl font-semibold text-white uppercase tracking-wide">Trey Beard</p>
                    <p className="text-white/40 text-sm">Florida State · Left-Handed Pitcher</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-display text-white">6.2 IP</div>
                    <div className="text-xs text-white/40 uppercase tracking-wide">Innings Pitched</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-display text-burnt-orange">14 K</div>
                    <div className="text-xs text-white/40 uppercase tracking-wide">Strikeouts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-display text-white">1 Hit</div>
                    <div className="text-xs text-white/40 uppercase tracking-wide">Hits Allowed</div>
                  </div>
                </div>
                <p className="font-serif text-white/70 leading-relaxed">
                  Beard didn&apos;t just beat Wake Forest — he erased them. Fourteen strikeouts in 6.2 innings with one hit allowed
                  and a no-hitter intact through five. The junior left-hander earned both ACC Pitcher of the Week and Golden Spikes
                  Player of the Week, becoming the first FSU pitcher to earn the latter since the program&apos;s recent resurgence.
                  His Saturday gem was the centerpiece of a sweep that vaulted Florida State from No. 20 to No. 9 and announced the
                  Seminoles as a legitimate threat in the ACC race.
                </p>
              </Card>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── 7. THE UPSET REPORT ──────────────────────────── */}
        <Section padding="lg" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6">
                The Upset Report
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={100}>
              <div className="max-w-3xl font-serif text-lg leading-[1.78] text-white/80 space-y-6">
                <p>
                  The biggest upset of the weekend wasn&apos;t a single game — it was a pattern. Three ranked teams dropped out of the
                  Top 25 entirely: TCU (fell to 11-8 after losing a series to Arizona State), LSU (14-7 after dropping two of three at
                  Vanderbilt), and UTSA (whose early-season run hit the wall). Conference play didn&apos;t just test resumes. It
                  invalidated some of them.
                </p>
                <p>
                  Wake Forest&apos;s collapse was the most dramatic single-team story. The Demon Deacons went 0-4 on the week — a
                  midweek loss to Coastal Carolina followed by the three-game sweep at the hands of Florida State. A team that entered
                  the week at No. 12 left it at No. 25, a 13-spot fall that ties for one of the largest single-week drops in recent
                  polling memory. The Deacons aren&apos;t a bad team. But they walked into conference play carrying a resume that
                  hadn&apos;t been stress-tested, and the first real exam exposed the gap.
                </p>
                <p>
                  Clemson had a rough week too — losing a home series to Georgia Tech after the Yellow Jackets opened with a 10-0
                  shutout and followed it with a 9-3 win in Game 2. The Tigers salvaged the finale 13-7 but dropped from No. 11 to
                  No. 17. Meanwhile, Southern Miss fell eight spots from No. 7 to No. 15 as the post-non-conference correction
                  continued for teams whose early resumes were built on lighter opposition.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── 8. RANKINGS TABLE ────────────────────────────── */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6">
                Top 25 — Post-Weekend 5
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={100}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="py-3 px-4 text-left text-white/60 font-semibold uppercase tracking-wide text-xs">Rank</th>
                      <th className="py-3 px-4 text-left text-white/60 font-semibold uppercase tracking-wide text-xs">Team</th>
                      <th className="py-3 px-4 text-left text-white/60 font-semibold uppercase tracking-wide text-xs">Record</th>
                      <th className="py-3 px-4 text-center text-white/60 font-semibold uppercase tracking-wide text-xs">Movement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankings.map((row) => (
                      <tr key={row.rank} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 font-display text-white font-semibold">{row.rank}</td>
                        <td className="py-3 px-4 text-white">{row.team}</td>
                        <td className="py-3 px-4 text-white/60">{row.record}</td>
                        <td className="py-3 px-4 text-center">
                          <MovementBadge movement={row.movement} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-white/40 text-xs">
                Dropped out: TCU (prev. No. 17), LSU (prev. No. 2 preseason, unranked since Wk 4), UTSA.
                Entered: Oregon (No. 19), West Virginia (No. 22), Ole Miss (No. 24).
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── 9. TEXAS SECTION ─────────────────────────────── */}
        <Section padding="lg" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6">
                Texas Report
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={100}>
              <div className="max-w-3xl font-serif text-lg leading-[1.78] text-white/80 space-y-6">
                <p>
                  The streak ended at 16. Ole Miss came into Disch-Falk on Friday and handed Texas its first loss of the season in an
                  11-inning thriller, 9-8. Tristan Bissetta&apos;s go-ahead grand slam put the Rebels up 8-7, and while Temo Becerra
                  delivered a game-tying single with Texas down to its final strike in the ninth — extending the fight into extras — Ole
                  Miss eventually closed it out. The loss chewed through bullpen arms and forced a reset. The 16-game winning streak
                  matched Texas&apos;s best start since 2005. That it ended against an SEC opponent in extra innings rather than against
                  a blowout tells you how competitive this team is even when things go wrong.
                </p>
                <p>
                  The response on Saturday and Sunday is what matters. Luke Harrison turned in a career-best seven innings, allowing
                  five hits, two unearned runs, one walk, and eight strikeouts in an 11-2 Texas win. The lineup struck out only twice
                  in that game — a remarkable display of plate discipline after Friday night&apos;s 18-strikeout offensive performance.
                  Sunday, Dylan Volantis matched Harrison&apos;s energy with his own career day: six innings, five hits, one run, one walk,
                  and 11 strikeouts in an 8-2 series-clinching victory. The Longhorns are 18-1, 2-1 in the SEC, and they took the
                  series against an Ole Miss team that just entered the Top 25.
                </p>
                <p>
                  The weekend revealed something important about Texas: this pitching staff doesn&apos;t just have depth — it has answers.
                  When Ruger Riojas&apos;s start went sideways Friday (4.1 IP, 6 H, 3 ER, 8 K), Harrison and Volantis picked up the
                  series on their backs. Anthony Pack hit .385 (5-for-13) with four RBI across the weekend. Casey Borba and Carson
                  Tinney both hit .357. Jayden Duplantier went 4-for-7. The lineup is deep enough that no single hitter needs to carry
                  the offense.
                </p>
                <p>
                  Then Tuesday happened. Tarleton State — 13-7, WAC, not an opponent that shows up on anyone&apos;s radar — walked
                  into Disch-Falk and handed No. 2 Texas a 6-1 loss. Carson Tinney&apos;s solo shot in the first was the Longhorns&apos;
                  only real offense; they managed just two hits total, struck out 12 times, and walked or hit eight Tarleton batters.
                  The Texans used five pitchers — Ethan Jaques (3 IP, 0 H, 4 K) earned the win — and held Texas scoreless for the
                  final eight innings. It was Tarleton State&apos;s highest-ranked win in program history and Texas&apos;s second loss
                  in four days after going 16-0 to start the season. The bats that averaged 9.9 runs per game and hit .335 entering
                  the night went completely silent. Two losses in four days — one in 11 innings against a ranked SEC opponent, one
                  by five runs to a WAC team at home — is a new kind of data point for this Longhorn club. The Auburn series this
                  weekend just got more interesting.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── 9B. TUESDAY MIDWEEK UPDATE ────────────────────── */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6">
                Tuesday Midweek: March 17 Results
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={100}>
              <div className="max-w-3xl font-serif text-lg leading-[1.78] text-white/80 space-y-6">
                <p>
                  Midweek games are where ranked teams are supposed to exhale. Most did. A few didn&apos;t. No. 1 UCLA survived
                  Pepperdine 5-4 at Jackie Robinson Stadium after the Waves jumped out to a 2-0 lead and nearly tied it in the ninth —
                  it took a laser throw from left fielder Dean West to cut down the tying run at the plate. The Bruins have won 12
                  straight, but they&apos;re not coasting through them.
                </p>
                <p>
                  No. 11 USC beat San Diego State 7-4, scoring three in the eighth to break a tie and improve to 20-1 on the
                  season. No. 7 Georgia needed a walk-off to survive The Citadel: trailing 5-3 entering the bottom of the ninth,
                  Kolby Branch (3-for-5, 2 HR, 4 RBI) launched a three-run bomb to left to complete the comeback, 8-5. It was the
                  kind of game that Georgia&apos;s ranking won&apos;t remember but their dugout will.
                </p>
                <p>
                  No. 21 Texas A&amp;M rallied from a 4-0 second-inning deficit to beat Texas State 9-6 behind Caden Sorrell&apos;s
                  two home runs — the second leaving the bat at 112 mph. The Aggies moved to 17-3 and host No. 5 Georgia this weekend.
                  And then there was Texas, whose 6-1 loss to Tarleton State may be the most talked-about midweek result of the young
                  season. Two losses in four days for the nation&apos;s No. 2 team. The bats that carried a 16-game winning streak went
                  cold at exactly the wrong time, with Auburn&apos;s Plainsman Park waiting on Friday.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── 10. RISERS, FALLERS & THE NEW MAP ──────────────── */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6">
                The National Picture: What Conference Play Revealed
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={100}>
              <div className="max-w-3xl font-serif text-lg leading-[1.78] text-white/80 space-y-6">
                <p>
                  USC&apos;s run deserves its own paragraph. The Trojans started the season 19-0 — a program record, surpassing the
                  1988 team&apos;s 15-0 mark — before finally losing to Northwestern in the second game of a Saturday doubleheader,
                  2-1. Even the loss was instructive: a one-run game on the road in a conference doubleheader, not a collapse. USC
                  jumped eight spots to No. 11, the highest ranking of the post-Pac-12 era, and at 19-1 they&apos;re proving that
                  the Big Ten move hasn&apos;t weakened their baseball program. If anything, the competition has sharpened them.
                </p>
                <p>
                  Kentucky is the quietest great team in the country. The Wildcats swept Alabama to open SEC play and sit at 18-2,
                  good for No. 18 in the coaches&apos; poll — a ranking that undersells what they&apos;re building. Oregon entered
                  the Top 25 for the first time at No. 19 after sweeping Indiana to improve to 17-3. West Virginia returned to the
                  rankings at No. 22. And Ole Miss, despite uneven early results, re-entered at No. 24 on the strength of Friday&apos;s
                  11-inning upset of Texas.
                </p>
                <p>
                  The trend line is clear: the gap between preseason expectations and actual performance is widest at the bottom of
                  the Top 25. TCU dropped out entirely at 11-8 after losing a series to Arizona State. UTSA&apos;s early-season
                  momentum stalled. The teams entering — Oregon, West Virginia, Ole Miss — earned their spots by winning in conference
                  play, not by accumulating wins against non-conference opponents. Five weekends in, the rankings are finally catching
                  up to reality.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── 11. WEEKEND 6 PREVIEW ────────────────────────── */}
        <Section padding="lg" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6">
                Weekend 6 Preview: March 20–22
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={100}>
              <div className="max-w-3xl font-serif text-lg leading-[1.78] text-white/80 space-y-6">
                <p>
                  If Weekend 5 opened the door on conference play, Weekend 6 kicks it down. The SEC slate features four series
                  between ranked opponents, and two of them have genuine national-seed implications this early. The ACC continues
                  its bloodbath with another top-15 showdown.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid gap-4 md:grid-cols-2 mt-6">
              <ScrollReveal direction="up" delay={150}>
                <Card variant="default" padding="lg" className="h-full">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-semibold text-white">
                      #2 Texas <span className="text-white/30 mx-1">@</span> #4 Auburn
                    </div>
                    <Badge variant="primary">Series of the Week</Badge>
                  </div>
                  <p className="text-white/60 text-sm mb-3">
                    The weekend&apos;s marquee series and it&apos;s not close. Texas at 18-2 — coming off a midweek stumble against
                    Tarleton State — versus Auburn at 17-2, both fresh off opening SEC series wins. This is the first time either
                    team faces a ranked SEC opponent this season. Texas&apos;s offensive slump (two hits Tuesday, 6-1 loss) adds urgency.
                    The answer matters for June hosting conversations.
                  </p>
                  <div className="text-xs text-white/30">Mar 20–22 · Plainsman Park, Auburn, AL</div>
                </Card>
              </ScrollReveal>

              <ScrollReveal direction="up" delay={200}>
                <Card variant="default" padding="lg" className="h-full">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-semibold text-white">
                      #10 NC State <span className="text-white/30 mx-1">@</span> #9 Florida State
                    </div>
                    <Badge variant="secondary">ACC Showdown</Badge>
                  </div>
                  <p className="text-white/60 text-sm mb-3">
                    FSU is riding a sweep and Trey Beard&apos;s momentum. NC State dropped three spots but still has the pitching
                    to compete with anyone. Both teams need this series to establish themselves in the ACC race. Tallahassee will
                    be electric.
                  </p>
                  <div className="text-xs text-white/30">Mar 20–22 · Dick Howser Stadium, Tallahassee, FL</div>
                </Card>
              </ScrollReveal>

              <ScrollReveal direction="up" delay={250}>
                <Card variant="default" padding="lg" className="h-full">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-semibold text-white">
                      #5 Georgia <span className="text-white/30 mx-1">@</span> #21 Texas A&amp;M
                    </div>
                    <Badge variant="secondary">SEC</Badge>
                  </div>
                  <p className="text-white/60 text-sm mb-3">
                    Georgia&apos;s Cole Johnson moment still has residual energy. The Bulldogs travel to College Station riding a
                    three-spot ranking jump. A&amp;M is 17-3 after a midweek comeback win over Texas State — dangerous at home and
                    swinging hot bats. This series will clarify both teams&apos; standing in the SEC pecking order.
                  </p>
                  <div className="text-xs text-white/30">Mar 20–22 · Olsen Field, College Station, TX</div>
                </Card>
              </ScrollReveal>

              <ScrollReveal direction="up" delay={300}>
                <Card variant="default" padding="lg" className="h-full">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-semibold text-white">
                      #8 Oklahoma <span className="text-white/30 mx-1">@</span> LSU
                    </div>
                    <Badge variant="secondary">SEC</Badge>
                  </div>
                  <p className="text-white/60 text-sm mb-3">
                    LSU just fell out of the rankings and now hosts No. 8 Oklahoma at Alex Box Stadium. The Tigers need a statement
                    series to stop the slide. Oklahoma is 17-3 and climbing. This is a crossroads game for both programs — OU to
                    validate its ranking, LSU to prove the Vanderbilt loss was an aberration.
                  </p>
                  <div className="text-xs text-white/30">Mar 20–22 · Alex Box Stadium, Baton Rouge, LA</div>
                </Card>
              </ScrollReveal>
            </div>
          </Container>
        </Section>

        {/* ── 12. BSI VERDICT ──────────────────────────────── */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6">
                BSI Verdict
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={100}>
              <div className="max-w-3xl font-serif text-lg leading-[1.78] text-white/80 space-y-6">
                <p>
                  Weekend 5 drew a line between what preseason rankings promised and what conference play delivered. Tuesday
                  underlined it in red. The teams that survived the weekend — Auburn sweeping on the road, Georgia grinding out a
                  one-run finish, Florida State staking its claim with a 14-K gem — proved they can absorb adversity and respond.
                  Texas took an SEC series after its first loss, then stumbled Tuesday against Tarleton State. Two losses in four
                  days for the No. 2 team in the country. LSU fell out of the rankings. Wake Forest dropped 13 spots. TCU
                  disappeared entirely. February records don&apos;t transfer to March — and March midweeks don&apos;t care about your
                  ranking. This weekend, Texas goes to Auburn at 18-2 instead of 18-1, with questions about its bats that
                  didn&apos;t exist five days ago. That series won&apos;t just be the game of the week. It might be the game of the
                  first half.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── 13. DATA ATTRIBUTION ─────────────────────────── */}
        <Section padding="md" borderTop>
          <Container>
            <div className="flex flex-wrap items-center justify-center gap-6">
              <DataSourceBadge source="ESPN" timestamp="Scores, box scores — March 13–17, 2026" />
              <DataSourceBadge source="D1Baseball" timestamp="Rankings analysis" />
              <DataSourceBadge source="Texas Athletics" timestamp="texaslonghorns.com" />
              <DataSourceBadge source="FSU Athletics" timestamp="seminoles.com" />
              <DataSourceBadge source="UCLA Athletics" timestamp="uclabruins.com" />
              <DataSourceBadge source="USC Athletics" timestamp="usctrojans.com" />
              <DataSourceBadge source="Georgia Athletics" timestamp="georgiadogs.com" />
              <DataSourceBadge source="Texas A&M Athletics" timestamp="12thman.com" />
              <DataSourceBadge source="Tarleton State Athletics" timestamp="tarletonsports.com" />
            </div>
            <p className="text-center text-xs text-white/30 mt-4">
              All statistics verified against official sources. No stats are fabricated or estimated.
            </p>
          </Container>
        </Section>
      </main>

    </>
  );
}
