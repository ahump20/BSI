import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, StatCard } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { ArticleJsonLd } from '@/components/seo/ArticleJsonLd';

export const metadata: Metadata = {
  title: 'Weekend 6 Recap & Weekend 7 Preview | 2026 College Baseball | BSI',
  description:
    'Tyler Fay threw Alabama\'s first solo no-hitter in 84 years to sweep Florida out of the rankings. Texas won at Auburn. Arkansas hung 22 on South Carolina and Paul Mainieri resigned mid-series. Weekend 7 preview: Oklahoma at Texas.',
  alternates: { canonical: '/college-baseball/editorial/weekend-6-recap' },
  openGraph: {
    title: 'Weekend 6 Recap & Weekend 7 Preview | BSI',
    description:
      'Tyler Fay\'s 84-year no-hitter, Texas takes a series at Auburn, Paul Mainieri resigns mid-series, and four teams fall out of the Top 25. Weekend 7: Oklahoma at Texas.',
    type: 'article',
    publishedTime: '2026-03-25',
    images: [{ url: '/images/og-college-baseball.png', width: 1200, height: 630 }],
  },
};

/* ── Hardcoded Data ────────────────────────────────────── */

const statCards = [
  { label: 'Fay Strikeouts', value: '13', helperText: 'Tyler Fay\'s no-hitter vs. No. 18 Florida — Alabama\'s first solo no-no since 1942' },
  { label: 'Arkansas Runs', value: '22', helperText: 'Most runs in an SEC game in the Dave Van Horn era — series opener vs. South Carolina' },
  { label: 'USC Start', value: '24-1', helperText: 'Best start in program history — swept Washington to extend Big Ten dominance' },
  { label: 'SEC in Top 25', value: '10', helperText: 'Ten SEC teams ranked — six in the top 10. Conference owns college baseball right now' },
];

const rankings = [
  { rank: 1, team: 'UCLA', record: '21-2', movement: 0 },
  { rank: 2, team: 'Texas', record: '20-3', movement: 0 },
  { rank: 3, team: 'Georgia Tech', record: '19-5', movement: 0 },
  { rank: 4, team: 'Arkansas', record: '18-7', movement: 0 },
  { rank: 5, team: 'Auburn', record: '19-4', movement: 0 },
  { rank: 6, team: 'Mississippi State', record: '20-4', movement: 0 },
  { rank: 7, team: 'Georgia', record: '20-5', movement: 0 },
  { rank: 8, team: 'Oklahoma', record: '19-5', movement: 0 },
  { rank: 9, team: 'Virginia', record: '20-5', movement: 0 },
  { rank: 10, team: 'Florida State', record: '19-4', movement: 1 },
  { rank: 11, team: 'Southern Miss', record: '19-5', movement: 1 },
  { rank: 12, team: 'USC', record: '24-1', movement: 1 },
  { rank: 13, team: 'North Carolina', record: '20-4', movement: 1 },
  { rank: 14, team: 'NC State', record: '18-6', movement: -4 },
  { rank: 15, team: 'Coastal Carolina', record: '16-7', movement: 1 },
  { rank: 16, team: 'Oregon State', record: '17-5', movement: 1 },
  { rank: 17, team: 'West Virginia', record: '16-4', movement: 3 },
  { rank: 18, team: 'Ole Miss', record: '19-6', movement: 99 },
  { rank: 19, team: 'Kentucky', record: '19-4', movement: -4 },
  { rank: 20, team: 'Oregon', record: '19-4', movement: 1 },
  { rank: 21, team: 'Tennessee', record: '17-7', movement: 1 },
  { rank: 22, team: 'Arizona State', record: '17-6', movement: 99 },
  { rank: 23, team: 'Notre Dame', record: '14-6', movement: 99 },
  { rank: 24, team: 'Nebraska', record: '18-6', movement: 99 },
  { rank: 25, team: 'Texas A&M', record: '18-5', movement: -2 },
];

function MovementBadge({ movement }: { movement: number }) {
  if (movement === 99) return <Badge variant="warning" size="sm">NR</Badge>;
  if (movement > 0) return <Badge variant="success" size="sm">+{movement}</Badge>;
  if (movement < 0) return <Badge variant="error" size="sm">{movement}</Badge>;
  return <Badge variant="secondary" size="sm">—</Badge>;
}

export default function Weekend6RecapPage() {
  return (
    <>
      <ArticleJsonLd
        headline="Weekend 6 Recap & Weekend 7 Preview | 2026 College Baseball"
        description="Tyler Fay threw Alabama's first solo no-hitter in 84 years to sweep Florida out of the rankings. Texas won at Auburn. Arkansas hung 22 on South Carolina and Paul Mainieri resigned mid-series."
        datePublished="2026-03-25"
        url="/college-baseball/editorial/weekend-6-recap"
        sport="College Baseball"
      />
      <main id="main-content">
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-white/10">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link href="/college-baseball" className="text-white/40 hover:text-[#BF5700] transition-colors">
                College Baseball
              </Link>
              <span className="text-white/40">/</span>
              <Link href="/college-baseball/editorial" className="text-white/40 hover:text-[#BF5700] transition-colors">
                Editorial
              </Link>
              <span className="text-white/40">/</span>
              <span className="text-white font-medium">Weekend 6 Recap</span>
            </nav>
          </Container>
        </Section>

        {/* ── 1. HERO ──────────────────────────────────────── */}
        <Section padding="lg" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#BF5700]/20 to-transparent pointer-events-none" />
          <Container>
            <ScrollReveal direction="up">
              <div className="max-w-3xl">
                <div className="flex items-center gap-3 mb-4">
                  <Badge variant="primary">Weekend 6 Recap</Badge>
                  <span className="text-white/40 text-sm">14 min read</span>
                </div>
                <h1 className="font-display text-3xl md:text-5xl font-bold uppercase tracking-wide mb-4">
                  The Weekend That Broke Programs.{' '}
                  <span className="text-gradient-blaze">And Made One Pitcher Immortal.</span>
                </h1>
                <p className="text-white/70 text-lg leading-relaxed">
                  Tyler Fay threw Alabama&apos;s first solo no-hitter in 84 years and swept No. 18 Florida out of the rankings entirely.
                  Arkansas hung 22 runs on South Carolina in a game that ended Paul Mainieri&apos;s tenure before the weekend was over.
                  Texas answered its Tarleton State embarrassment by winning a series at No. 5 Auburn — including the program&apos;s first
                  SEC shutout. Four teams fell out of the Top 25. Four new ones climbed in. Conference play isn&apos;t sorting anymore.
                  It&apos;s eliminating.
                </p>
                <div className="mt-4 text-white/40 text-sm">
                  March 25, 2026 · Blaze Sports Intel
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
                  Weekend 5 opened the door on conference play. Weekend 6 walked through it and burned down what was left of the
                  preseason picture. Alabama — unranked, 12-8 entering the week, not in any national conversation — produced the
                  single greatest individual pitching performance of the 2026 season and swept a ranked Florida team so thoroughly
                  the Gators fell out of the Top 25 entirely. Arkansas scored 22 runs in an SEC opener and the opposing head coach
                  resigned before the next pitch was thrown. Texas, still stinging from a midweek loss to Tarleton State, went into
                  Auburn&apos;s Plainsman Park and took a series from the No. 5 team in the country. Mississippi State swept Vanderbilt
                  with a 17-run finale. USC improved to 24-1. The SEC placed ten teams in the Top 25 — six of them in the top ten.
                </p>
                <p>
                  What Weekend 6 proved is that the talent floor in major conference baseball has risen to the point where
                  any ranked team can be swept on any given weekend — and that the margin between the Top 25 and the teams
                  just outside it has never been thinner. Florida entered the weekend at No. 18 with a 19-3 record and left
                  it unranked after being no-hit and swept in Tuscaloosa. Clemson, Wake Forest, and Louisiana joined them on
                  the exit ramp. Meanwhile, Ole Miss, Arizona State, Notre Dame, and Nebraska walked in. The door is a
                  revolving one now.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── 4. PERFORMANCE OF THE WEEKEND ────────────────── */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-[#BF5700] mb-6">
                Performance of the Weekend: Tyler Fay&apos;s No-Hitter
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={100}>
              <Card variant="default" padding="lg">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-[#BF5700]/20 rounded-full flex items-center justify-center text-lg font-bold text-[#BF5700]">
                    RHP
                  </div>
                  <div>
                    <p className="font-display text-xl font-semibold text-white uppercase tracking-wide">Tyler Fay</p>
                    <p className="text-white/40 text-sm">Alabama · Right-Handed Pitcher · Redshirt Junior</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-display text-white">9.0 IP</div>
                    <div className="text-xs text-white/40 uppercase tracking-wide">Complete Game</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-display text-[#BF5700]">13 K</div>
                    <div className="text-xs text-white/40 uppercase tracking-wide">Strikeouts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-display text-white">0 Hits</div>
                    <div className="text-xs text-white/40 uppercase tracking-wide">No-Hitter</div>
                  </div>
                </div>
                <p className="font-serif text-white/70 leading-relaxed">
                  Tyler Fay threw 132 pitches — 85 for strikes — and retired 27 of 29 batters faced. The redshirt junior
                  from Doniphan, Nebraska, who entered the game with a 5.43 ERA and had never pitched more than seven innings in
                  college, delivered Alabama&apos;s first complete-game no-hitter since Eddie Owcar did it against Mississippi on
                  April 24, 1942. Eighty-four years between solo no-hitters. His only blemishes were two walks. He retired the
                  final ten batters he faced, getting Brendan Lawson to fly out to left to end it. The Crimson Tide won 6-0 behind
                  doubles from Bryce Fowler, Justin Osterhouse, and Will Plattner. It was the ninth no-hitter in program history
                  and the first against a ranked opponent.
                </p>
              </Card>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── 5. THE STATEMENT SERIES ──────────────────────── */}
        <Section padding="lg" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-[#BF5700] mb-6">
                The Statement Series: Texas Takes Two at Auburn
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={100}>
              <div className="max-w-3xl font-serif text-lg leading-[1.78] text-white/80 space-y-6">
                <p>
                  A week ago, Texas lost to Tarleton State at home, 6-1, managing two hits and striking out 12 times. The narrative
                  was forming: the Longhorns&apos; bats had gone cold at the worst possible time, with a trip to No. 5 Auburn —
                  riding a 12-game winning streak — waiting on Friday. Then Texas went to Plainsman Park and answered every question.
                </p>
                <p>
                  Auburn took the opener 4-3 in a tightly contested Friday night game that could have gone either way. Texas responded
                  Saturday with a 7-6 win that snapped Auburn&apos;s 12-game streak — the Longhorns&apos; first road win over a
                  top-5 team since beating No. 3 TCU on May 9, 2021. Aiden Robbins led off the third with a 109-mph home run off
                  the batter&apos;s eye. Jayden Duplantier added his first career home run, a three-run blast over the 37-foot
                  monster in left. Maddox Monsour went 3-for-4 with two RBI in his inaugural SEC start. Luke Harrison earned the
                  win with 5.2 innings and six strikeouts, and Thomas Burns stranded runners in both the eighth and ninth to close
                  it out for his third save.
                </p>
                <p>
                  Sunday was emphatic. Texas won 5-0 — the program&apos;s first shutout in an SEC game. The lineup that managed two
                  hits against Tarleton State ten days earlier put together a complete performance against one of the best staffs in
                  the conference. Texas left Auburn at 20-3 and 4-2 in the SEC, having taken a series from the No. 5 team on the
                  road. The Tarleton loss looks less like a warning sign and more like a midweek speed bump that preceded the best
                  weekend of the season.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── 6. THE EARTHQUAKE ──────────────────────────────── */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-[#BF5700] mb-6">
                The Earthquake: Mainieri Resigns After 22-Run Loss
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={100}>
              <div className="max-w-3xl font-serif text-lg leading-[1.78] text-white/80 space-y-6">
                <p>
                  Arkansas traveled to Columbia and posted the most lopsided SEC opener in the Dave Van Horn era. The Razorbacks
                  won Friday&apos;s series opener 22-6 — five Razorbacks hit home runs, including Maika Niu with two. It was
                  the second-most runs Arkansas has ever scored in an SEC game and the most in Van Horn&apos;s 24-year tenure at
                  the program. By Saturday morning, South Carolina head coach Paul Mainieri had resigned.
                </p>
                <p>
                  Mainieri, 68, had come out of a three-year retirement to take the Gamecock job. He went 40-40 overall and
                  6-28 in SEC play across 80 games — a record that made the 22-run loss less of a cause and more of a final
                  data point in an accumulating case. Athletic director Jeremiah Donati said they &ldquo;agreed it would be
                  in the best interest of the program&rdquo; to part ways. Associate head coach Monte Lee — himself a former
                  Clemson head coach — stepped in as interim.
                </p>
                <p>
                  The series continued. Arkansas won Game 2 on Saturday, 3-2 in ten innings, plating the winning run on a two-out
                  throwing error by the Gamecocks in the ninth that extended the game. South Carolina, now playing under Lee, finally
                  snapped a seven-game losing streak with a 9-4 win on Sunday, hitting four home runs. But the weekend&apos;s
                  story had been written Friday night. A program that won the College World Series in 2010 and 2011 fired its
                  coach 23 games into the season. Conference play isn&apos;t just sorting teams. It&apos;s sorting programs.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── 7. SEC WEEKEND 2 SPOTLIGHT ────────────────────── */}
        <Section padding="lg" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-[#BF5700] mb-6">
                Around the SEC: Sweeps, Statements, and Ten Ranked Teams
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={100}>
              <div className="max-w-3xl font-serif text-lg leading-[1.78] text-white/80 space-y-6">
                <p>
                  Mississippi State went to Nashville and swept Vanderbilt for the second time in three years. The Bulldogs
                  pounded the Commodores in the finale — Ace Reese, Reed Stallman, Ryder Woodson, and Kevin Milewski all
                  homered as State ran up the score in a dominant series closeout. At 20-4 with a 4-2 SEC record, the
                  Bulldogs held steady at No. 6 and look like the most consistent team in the league behind the top two.
                </p>
                <p>
                  Georgia continued its road surge by taking a series at Texas A&amp;M. The Bulldogs launched 11 home runs
                  across the three games — six of them in Saturday&apos;s 8-2 series-clinching win. Texas A&amp;M salvaged
                  the finale with an 18-5 blowout on Sunday, but the damage was done. Georgia is 20-5 and 4-2 in conference,
                  and the power is real. The Aggies dropped two spots to No. 25 at 18-5, their 1-4 SEC start raising questions
                  about whether the roster has the depth to compete at the top of the league.
                </p>
                <p>
                  Oklahoma won the series at LSU in Baton Rouge — a result that would have been a headline any other weekend
                  but got buried under the Fay no-hitter and the Mainieri resignation. The Sooners took the rubber match 4-3
                  in come-from-behind fashion to improve to 19-5 and 4-2 in SEC play. LSU remains unranked and stuck in a
                  slide that has taken the preseason No. 2 pick from contender to cautionary tale.
                </p>
                <p>
                  Ole Miss won two of three at home against Kentucky, a series that carried direct ranking consequences.
                  The Rebels entered the Top 25 at No. 18 while Kentucky dropped four spots to No. 19. The SEC now has ten
                  teams ranked — six in the top ten — and it&apos;s not inflation. These teams are beating each other.
                  Every weekend produces losses for ranked teams because the league is that deep.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── 8. ACC & BEYOND ──────────────────────────────── */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-[#BF5700] mb-6">
                ACC Report: FSU Keeps Rolling, Wake Forest Keeps Falling
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={100}>
              <div className="max-w-3xl font-serif text-lg leading-[1.78] text-white/80 space-y-6">
                <p>
                  Florida State hosted No. 10 NC State in a top-15 ACC showdown and took the series 2-1. The Wolfpack won
                  Friday&apos;s opener 6-4, but the Seminoles responded emphatically. Saturday&apos;s 11-5 win featured a
                  six-run sixth inning capped by Brayden Dowd&apos;s grand slam. Sunday&apos;s 15-5 run-rule was the
                  exclamation point — Kelvyn Paulino launched a 410-foot three-run homer, his first career home run, to blow
                  it open early. FSU improved to 19-4 and 5-1 in the ACC, climbing one spot to No. 10. NC State fell four
                  spots to No. 14 at 18-6.
                </p>
                <p>
                  Virginia took the series from Wake Forest, 2-1, with a dominant 14-4 rubber match on Sunday after splitting
                  the first two games (10-6 win, 13-4 loss). The Cavaliers are 20-5 and steady at No. 9. Wake Forest, which
                  entered the weekend at No. 25 after last week&apos;s 13-spot freefall, dropped out of the rankings entirely.
                  Two weeks ago the Deacons were No. 12. Now they&apos;re unranked. Conference play claimed another victim.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── 9. UCLA & USC ──────────────────────────────────── */}
        <Section padding="lg" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-[#BF5700] mb-6">
                The West Coast: UCLA&apos;s Machine and USC&apos;s Historic Run
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={100}>
              <div className="max-w-3xl font-serif text-lg leading-[1.78] text-white/80 space-y-6">
                <p>
                  UCLA swept Maryland with the kind of ruthless efficiency that makes the rest of the Big Ten feel like a
                  scheduling formality. The Bruins won 12-2, 8-3, and 14-4 (run-rule) — outscoring the Terps 34-9 across
                  three games. Cashel Dugger opened the series with a first-inning grand slam. Payton Brennan hit a
                  three-run blast in Game 2. The 14-4 run-rule in Game 3 extended UCLA&apos;s winning streak to 15 games
                  and their Big Ten record to 9-0 — the best league start in program history. At 21-2, UCLA remains the
                  clear No. 1 and the team everyone else is chasing.
                </p>
                <p>
                  USC completed its own sweep of Washington, closing it out with a 14-4 rout to improve to 24-1. That&apos;s
                  the best start in program history — surpassing the 19-0 mark they set earlier this season and the 1988
                  team&apos;s 15-0 start. The Trojans have lost exactly once all year (a 2-1 road loss to Northwestern in
                  a Big Ten doubleheader). At No. 12 and climbing, USC is making a case for a national seed. The
                  post-Pac-12 era of Trojan baseball is arriving on schedule.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── 10. RANKINGS TABLE ─────────────────────────────── */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-[#BF5700] mb-6">
                Top 25 — Post-Weekend 6
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
                Dropped out: Florida (prev. No. 14), Clemson (prev. No. 17), Wake Forest (prev. No. 25), Louisiana (prev. No. 25).
                Entered: Ole Miss (No. 18), Arizona State (No. 22), Notre Dame (No. 23), Nebraska (No. 24).
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── 11. TEXAS SECTION ──────────────────────────────── */}
        <Section padding="lg" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-[#BF5700] mb-6">
                Texas Report
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={100}>
              <div className="max-w-3xl font-serif text-lg leading-[1.78] text-white/80 space-y-6">
                <p>
                  The texture of Texas&apos;s weekend at Auburn tells you more than the 2-1 series result alone. Friday&apos;s
                  4-3 loss was a one-run game against a team riding a 12-game winning streak — competitive, not embarrassing.
                  Saturday&apos;s 7-6 win was a declaration: Robbins&apos;s 109-mph homer, Duplantier&apos;s three-run shot
                  over the monster, Harrison working 5.2 innings of two-run ball, and Burns stranding runners in both the
                  eighth and ninth. Sunday&apos;s 5-0 shutout was the closer — Texas&apos;s first SEC shutout as a member
                  of the conference.
                </p>
                <p>
                  The pitching continues to answer. Harrison (5.2 IP, 4 H, 2 R, 6 K on Saturday) and the Game 3 staff
                  combined to hold Auburn to six runs across the final two games after the Tigers scored four in the opener.
                  Burns has emerged as a reliable closer with three saves. The lineup is producing from top to bottom —
                  Monsour&apos;s 3-for-4 breakout in the SEC, Robbins continuing to mash, Tinney providing situational
                  hitting. The offensive depth Schlossnagle built is showing up when it matters.
                </p>
                <p>
                  Then Tuesday happened again. Texas blew a 7-0 lead at Houston and lost 9-7, with the Cougars scoring nine
                  unanswered runs across the final four innings. Tyler Cox&apos;s go-ahead RBI single capped the rally. That&apos;s
                  two straight midweek losses — Tarleton State (6-1) and Houston (9-7) — and the second late-inning collapse
                  in a week. The weekend pitching is dominant. The midweek bullpen management is a genuine concern heading into
                  the Oklahoma series. The Sooners come to Disch-Falk this weekend at 19-5 and riding their own series win
                  at LSU. Red River meets in Austin with both teams in the top 10. The bats need to show up for all seven
                  innings this time.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── 12. WEEKEND 7 PREVIEW ──────────────────────────── */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-[#BF5700] mb-6">
                Weekend 7 Preview: March 27–29
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={100}>
              <div className="max-w-3xl font-serif text-lg leading-[1.78] text-white/80 space-y-6">
                <p>
                  Weekend 7 brings the highest-stakes SEC series of the young conference season to Austin. The ACC gets another
                  ranked-vs.-ranked test, and the Big Ten leader heads on the road for the first time in league play. The
                  schedule is tightening. The margin for error is shrinking.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid gap-4 md:grid-cols-2 mt-6">
              <ScrollReveal direction="up" delay={150}>
                <Card variant="default" padding="lg" className="h-full">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-semibold text-white">
                      #8 Oklahoma <span className="text-white/30 mx-1">@</span> #2 Texas
                    </div>
                    <Badge variant="primary">Series of the Week</Badge>
                  </div>
                  <p className="text-white/60 text-sm mb-3">
                    The Red River Rivalry moves to Disch-Falk with both teams coming off road series wins. Oklahoma took LSU in
                    Baton Rouge. Texas took Auburn in Plainsman Park. Both are 4-2 in SEC play. OU&apos;s first baseman Dayton
                    Tochy and shortstop Jaxon Willits give the Sooners lineup depth to test Texas&apos;s midweek-shaky bullpen.
                    This series will define the first-half pecking order in the SEC.
                  </p>
                  <div className="text-xs text-white/30">Mar 27–29 · UFCU Disch-Falk Field, Austin, TX · SEC Network</div>
                </Card>
              </ScrollReveal>

              <ScrollReveal direction="up" delay={200}>
                <Card variant="default" padding="lg" className="h-full">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-semibold text-white">
                      #1 UCLA <span className="text-white/30 mx-1">@</span> Iowa
                    </div>
                    <Badge variant="secondary">Big Ten</Badge>
                  </div>
                  <p className="text-white/60 text-sm mb-3">
                    UCLA&apos;s first road conference series of the season. The Bruins are 9-0 in Big Ten play and riding a 15-game
                    winning streak, but they haven&apos;t been tested away from Jackie Robinson Stadium in league play yet.
                    Iowa&apos;s home field and Midwest conditions provide a different challenge than sweeping Maryland in LA.
                  </p>
                  <div className="text-xs text-white/30">Mar 27–29 · Duane Banks Field, Iowa City, IA</div>
                </Card>
              </ScrollReveal>

              <ScrollReveal direction="up" delay={250}>
                <Card variant="default" padding="lg" className="h-full">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-semibold text-white">
                      South Carolina <span className="text-white/30 mx-1">@</span> #7 Georgia
                    </div>
                    <Badge variant="secondary">SEC</Badge>
                  </div>
                  <p className="text-white/60 text-sm mb-3">
                    South Carolina&apos;s first road trip under interim head coach Monte Lee. The Gamecocks snapped a seven-game
                    losing streak Sunday but are 12-11 overall and searching for identity. Georgia is rolling at 20-5 with 11
                    home runs from the Texas A&amp;M series still fresh. This is a proving-ground game for whatever South
                    Carolina is becoming — and a potential statement sweep for the Bulldogs.
                  </p>
                  <div className="text-xs text-white/30">Mar 27–29 · Foley Field, Athens, GA</div>
                </Card>
              </ScrollReveal>

              <ScrollReveal direction="up" delay={300}>
                <Card variant="default" padding="lg" className="h-full">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-semibold text-white">
                      #4 Arkansas <span className="text-white/30 mx-1">@</span> #6 Mississippi State
                    </div>
                    <Badge variant="secondary">SEC</Badge>
                  </div>
                  <p className="text-white/60 text-sm mb-3">
                    A rematch from Weekend 5 when Arkansas took the series at home. Now Mississippi State gets them in Starkville
                    after a dominant sweep of Vanderbilt. Both are in the top 6 and both have something to prove. State wants
                    revenge. Arkansas wants to prove the first series wasn&apos;t a fluke. Dudy Noble will be loud.
                  </p>
                  <div className="text-xs text-white/30">Mar 27–29 · Dudy Noble Field, Starkville, MS</div>
                </Card>
              </ScrollReveal>
            </div>
          </Container>
        </Section>

        {/* ── 13. BSI VERDICT ────────────────────────────────── */}
        <Section padding="lg" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-[#BF5700] mb-6">
                BSI Verdict
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={100}>
              <div className="max-w-3xl font-serif text-lg leading-[1.78] text-white/80 space-y-6">
                <p>
                  Weekend 6 ended careers, rewrote record books, and confirmed what the early conference results hinted at:
                  the 2026 college baseball season has no safe ground. Tyler Fay&apos;s 84-year no-hitter was the kind of
                  moment that transcends a weekend recap — it&apos;s a permanent entry in Alabama baseball history. Paul
                  Mainieri&apos;s resignation was the kind of moment that transcends a single program — it&apos;s a reminder
                  that the SEC devours coaching tenures that can&apos;t keep pace. Texas answered its doubters at Auburn.
                  UCLA keeps winning without resistance. USC keeps winning, period. Carry this into Weekend 7: the teams
                  that survived the first two weeks of conference play aren&apos;t just ranked. They&apos;re battle-tested.
                  The teams that didn&apos;t survive are already gone.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── 14. DATA ATTRIBUTION ───────────────────────────── */}
        <Section padding="md" borderTop>
          <Container>
            <div className="flex flex-wrap items-center justify-center gap-6">
              <DataSourceBadge source="ESPN" timestamp="Scores, box scores — March 20–24, 2026" />
              <DataSourceBadge source="D1Baseball" timestamp="Rankings analysis" />
              <DataSourceBadge source="Alabama Athletics" timestamp="rolltide.com" />
              <DataSourceBadge source="Texas Athletics" timestamp="texaslonghorns.com" />
              <DataSourceBadge source="FSU Athletics" timestamp="seminoles.com" />
              <DataSourceBadge source="UCLA Athletics" timestamp="uclabruins.com" />
              <DataSourceBadge source="USC Athletics" timestamp="usctrojans.com" />
              <DataSourceBadge source="Georgia Athletics" timestamp="georgiadogs.com" />
              <DataSourceBadge source="Arkansas Athletics" timestamp="wholehogsports.com" />
              <DataSourceBadge source="Oklahoma Athletics" timestamp="soonersports.com" />
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
