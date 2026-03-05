import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { StatCard } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Week 1 Recap: Three Grand Slams. One Record Book. | Blaze Sports Intel',
  description:
    'Opening Weekend 2026 college baseball recap. Tyce Armstrong ties a 50-year record. Michigan State stuns Louisville. Oklahoma storms the Shriners. The complete BSI breakdown.',
  openGraph: {
    title: 'Week 1 Recap: Three Grand Slams. One Record Book.',
    description:
      'Opening Weekend separated contenders from pretenders across 118 games. The complete BSI breakdown of college baseball Week 1.',
  },
};

// ── Rankings data ────────────────────────────────────────────────────

interface RankingEntry {
  rank: number;
  team: string;
  record: string;
  change: string;
  prev: string;
  headline: string;
}

const RANKINGS: RankingEntry[] = [
  { rank: 1, team: 'UCLA', record: '2-1', change: '—', prev: '1', headline: 'Won series; dropped finale to UCSD 8-7' },
  { rank: 2, team: 'LSU', record: '3-0', change: '—', prev: '2', headline: 'Swept Milwaukee 41-15; Cooper Moore 11 K debut' },
  { rank: 3, team: 'Texas', record: '3-0', change: '—', prev: '3', headline: 'Swept UC Davis 27-7; Volantis 7 IP, 1 H, 8 K' },
  { rank: 4, team: 'Mississippi State', record: '3-0', change: '—', prev: '4', headline: "O'Connor era opens with sweep of Hofstra" },
  { rank: 5, team: 'Georgia Tech', record: '3-0', change: '—', prev: '5', headline: 'Outscored Bowling Green 50-11; 27-run game' },
  { rank: 6, team: 'Coastal Carolina', record: '3-0', change: '—', prev: '6', headline: 'Swept Fairfield; 4 runs allowed in 3 games' },
  { rank: 7, team: 'TCU', record: '2-1', change: '↑3', prev: '10', headline: 'Beat Vandy + Arkansas 5-4 each; lost to OU' },
  { rank: 8, team: 'Arkansas', record: '2-1', change: '↓1', prev: '7', headline: 'Walk-off vs. Texas Tech in 11; lost to TCU' },
  { rank: 9, team: 'Auburn', record: '3-0', change: '—', prev: '9', headline: 'Heltzer struck out 3 straight in 10th for walk-off' },
  { rank: 10, team: 'North Carolina', record: '3-0', change: '↑1', prev: '11', headline: 'Winslow walk-off HR in 11th completes sweep' },
  { rank: 11, team: 'Oregon State', record: '2-1', change: '↑1', prev: '12', headline: 'Rallied from 6-2 down vs. Arizona; walked off Stanford' },
  { rank: 12, team: 'Florida', record: '2-1', change: '↑1', prev: '13', headline: 'Lost opener to UAB in extras; won series' },
  { rank: 13, team: 'Tennessee', record: '3-0', change: '↑1', prev: '14', headline: 'Outscored Nicholls 27-3; record crowd 6,977' },
  { rank: 14, team: 'Georgia', record: '2-1', change: '↑1', prev: '15', headline: '22 D1 transfers; took series from Wright State' },
  { rank: 15, team: 'Louisville', record: '1-2', change: '↓7', prev: '8', headline: 'Lost series to Michigan State at home' },
  { rank: 16, team: 'Florida State', record: '2-0', change: '—', prev: '16', headline: 'Took 2; Sunday canceled. 16-5 run-rule of JMU' },
  { rank: 17, team: 'NC State', record: '2-0', change: '—', prev: '17', headline: '2-0 at Puerto Rico Challenge' },
  { rank: 18, team: 'Kentucky', record: '3-0', change: '—', prev: '18', headline: 'Outscored UNCG 34-11; Tyler Bell injured' },
  { rank: 19, team: 'Clemson', record: '3-0', change: '—', prev: '19', headline: 'Two shutouts of Army in Saturday DH' },
  { rank: 20, team: 'Southern Miss', record: '2-1', change: '—', prev: '20', headline: "Won series despite Flora's masterpiece for UCSB" },
  { rank: 21, team: 'Oklahoma', record: '3-0', change: 'NEW', prev: 'NR', headline: 'Shriners champion; rotation: 3 R, 31 K combined' },
  { rank: 22, team: 'Wake Forest', record: '2-1', change: '↓1', prev: '21', headline: 'Lost to Houston; rebounded in Puerto Rico' },
  { rank: 23, team: 'Miami (FL)', record: '3-0', change: '↓1', prev: '22', headline: 'Alex Sosa 3 HRs; swept Lehigh' },
  { rank: 24, team: 'Texas A&M', record: '3-0', change: '↑1', prev: '25', headline: '38+ runs in first 2 games; Sorrell SEC POW' },
  { rank: 25, team: 'West Virginia', record: '3-0', change: 'NEW', prev: 'NR', headline: 'Swept Ga. Southern; 31 runs, 13 pitchers used' },
];

function movementClass(change: string) {
  if (change === 'NEW') return 'text-ember font-semibold';
  if (change.includes('↑')) return 'text-success';
  if (change.includes('↓')) return 'text-error';
  return 'text-text-muted';
}

// ── Stat boxes ───────────────────────────────────────────────────────

const STATS = [
  { label: 'Grand Slams by Armstrong', value: '3', helperText: 'Tied 50-year NCAA record' },
  { label: "Barczi's longest HR", value: '458 ft', helperText: 'Upper deck at Globe Life' },
  { label: "Flora's fastball", value: '100 mph', helperText: 'No. 14 draft prospect' },
  { label: 'Teams swept 3-0', value: '14', helperText: 'Opening Weekend' },
];

// ── Page ─────────────────────────────────────────────────────────────

export default function Week1RecapPage() {
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
              <span className="text-text-primary">Week 1 Recap</span>
            </nav>
          </Container>
        </Section>

        {/* Hero */}
        <Section padding="lg" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-burnt-orange/10 via-transparent to-[#C9A227]/5 pointer-events-none" />
          <Container>
            <ScrollReveal direction="up">
              <div className="max-w-3xl">
                <div className="flex items-center gap-3 mb-6">
                  <Badge variant="primary">Week 1 Recap</Badge>
                  <span className="text-text-muted text-sm">February 16, 2026</span>
                  <span className="text-text-muted text-sm">18 min read</span>
                </div>
                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-wide mb-6">
                  Three Grand Slams.{' '}
                  <span className="text-gradient-blaze">One Record Book.</span>{' '}
                  The Season Starts Now.
                </h1>
                <p className="font-serif text-xl text-text-tertiary leading-relaxed italic">
                  Opening Weekend separated the teams that could win multiple ways from the teams that needed one script. Here&rsquo;s what the first 118 games actually told us.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Stats */}
        <Section padding="md">
          <Container>
            <ScrollReveal direction="up">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {STATS.map((s) => (
                  <StatCard key={s.label} label={s.label} value={s.value} helperText={s.helperText} />
                ))}
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Lede */}
        <Section padding="lg" background="charcoal">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                <p>
                  Fourteen teams swept. Two dropped out of the Top 25. One man hit three grand slams in the same game. And somewhere in Louisville, a coaching staff is watching film of a Michigan State club that just walked into Jim Patterson Stadium and took the series like it belonged to them. Opening Weekend is the first honest conversation a roster has with itself &mdash; Friday starters face real hitters, bullpens work leverage before roles are set, and lineups reveal whether &ldquo;depth&rdquo; is a preseason press release or something that shows up when the schedule compresses. What we learned across 118 games, six neutral-site venues, and a dozen weather-forced doubleheaders is this: the best teams in college baseball already know how to win in multiple shapes, and the ones who needed a specific script to survive are already scrambling to rewrite it.
                </p>
                <p>
                  Three things separated the contenders from the pretenders before a single conference game was played. First, bullpen roles are still fluid everywhere &mdash; even at the top. The teams that won doubleheaders (North Carolina, Mississippi State, Coastal Carolina, Clemson) quietly had the best weekends because compressed schedules force role definition under fatigue. You learn who can throw strikes in the seventh inning of a second game. That knowledge compounds for months. Second, weather-driven doubleheaders rewarded actual depth over projected depth. Twelve ranked teams played Saturday doubleheaders after rain pushed Sunday games forward, and the clubs that held serve &mdash; stacking wins without emptying the pen &mdash; entered midweek with a structural advantage. Third, elite offenses punished even the smallest defensive crack. Georgia Tech hung 27 in a single game. Texas A&amp;M scored 38 runs in its first two. Miami run-ruled Lehigh into submission. When good lineups get free bases, they don&rsquo;t leave them there.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* The Neutral Sites */}
        <Section padding="lg">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-2 border-b border-burnt-orange/15">
                The Neutral Sites Told the Real Story
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={50}>
              <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                <p>
                  Forget home openers against mid-majors for a moment. The signal came from two places: Globe Life Field in Arlington and Surprise Stadium in Arizona. That&rsquo;s where ranked teams faced ranked teams, where coaching decisions carried actual stakes, and where Opening Weekend stopped being a scrimmage and started being information.
                </p>
                <p>
                  The <strong className="text-text-primary font-semibold">Shriners Children&rsquo;s College Showdown</strong> produced the weekend&rsquo;s clearest separation. Oklahoma &mdash; picked 14th in the SEC preseason poll, unranked nationally &mdash; went 3&ndash;0 and outscored opponents 32&ndash;6. Their starting pitching trio of Cameron Johnson, LJ Mercurius, and freshman Cord Rager combined to allow 3 runs on 8 hits with 31 strikeouts across three games. That&rsquo;s not a hot weekend. That&rsquo;s a rotation that was hiding in plain sight. Johnson, the 6-foot-6 lefty transfer from LSU who posted a 5.57 ERA in Baton Rouge last year, struck out a career-high 11 against Texas Tech in the opener &mdash; the most by an OU pitcher in a season opener since at least 1999. Rager, a true freshman, held No. 10 TCU to 1 run and 2 hits with 8 strikeouts in the tournament finale, a 12&ndash;2 run-rule win. Trey Gambill was named tournament MVP: 4-for-7, 2 homers, 5 RBI, 6 walks. Oklahoma entered Omaha conversation before February ended.
                </p>
                <p>
                  TCU had the more nuanced weekend &mdash; and arguably the more valuable one. The Horned Frogs beat No. 23 Vanderbilt 5&ndash;4 on Friday and No. 7 Arkansas 5&ndash;4 on Saturday, then got run-ruled by Oklahoma on Sunday. Two one-run wins against ranked opponents in a neutral-site pressure cooker is the kind of r&eacute;sum&eacute; weekend that moves national perception. True freshman Lucas Franco, the Big 12 Preseason Freshman of the Year, announced himself with a home run in his first collegiate at-bat against Arkansas &mdash; his softest ball in play all day was 96 mph off the bat. The Sunday blowout loss to OU reveals that TCU&rsquo;s depth behind its first layer is still settling. But here&rsquo;s the read on TCU: they can beat elite teams if they keep games in the 4&ndash;6 run band. Proving they can also win when they need 9 is the next test &mdash; and it comes fast, because they travel to No. 1 UCLA this weekend.
                </p>
                <p>
                  Vanderbilt left Arlington at 1&ndash;2 and dropped out of the Top 25 entirely &mdash; worst opening since 2021&ndash;22. Colin Barczi authored one of the weekend&rsquo;s most absurd performances in the TCU loss: three solo home runs (452 feet, 430 feet, 458 feet), exit velocities of 118, 115, 112, and 111 mph on his four batted balls. The 458-foot shot landed in the upper deck at Globe Life. First Commodore to go deep three times in a game since Connor Kaiser in 2018. And Vanderbilt still lost 5&ndash;4, because Barczi committed a throwing error on a dropped third strike in the eighth that cracked the door for TCU. That&rsquo;s the game in miniature: individual brilliance doesn&rsquo;t override team execution. The Commodores did get a promising bullpen look &mdash; freshman Wyatt Nadeau&rsquo;s debut featured a fastball that touched 98 mph with a cut-ride shape and an 89 mph slider that scouts described as a &ldquo;death ball&rdquo; with &ndash;5 inches of induced vertical break. The stuff is real. The winning has to catch up.
                </p>
                <p>
                  Out west, the <strong className="text-text-primary font-semibold">College Baseball Series at Surprise</strong> delivered its own verdict: Michigan went 3&ndash;0, beating No. 12 Oregon State, Stanford, and No. 24 Arizona. Kurt Barr threw a 7-inning, 1-hit gem to close out Arizona. Michigan hasn&rsquo;t made the NCAA Tournament since reaching the 2022 national championship game, but fourth-year coach Tracy Smith may have something brewing. Oregon State recovered from the Michigan loss to beat Arizona 7&ndash;6 &mdash; rallying from 6&ndash;2 down with a 5-run seventh &mdash; then walked off Stanford on Sunday. The Beavers, playing their final season as essentially an independent before the new Pac-12 expands, showed exactly what you want to see: the ability to lose a game, reset, and then execute in the late innings when the margin disappears. Arizona went 0&ndash;3 and fell out of the rankings.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Performance of the Weekend */}
        <Section padding="lg" background="charcoal">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-2 border-b border-burnt-orange/15">
                Performance of the Weekend
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={50}>
              <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                <p>
                  Baylor first baseman <strong className="text-text-primary font-semibold">Tyce Armstrong</strong> hit three grand slams in a single game against New Mexico State &mdash; 12 RBI in a 15&ndash;2 run-rule win. He is only the second player in NCAA Division I history to accomplish that feat. The first was Jim LaFountain of Louisville, who did it on March 24, 1976. Fifty years. Think about that. Every slugger who has stepped into a college batter&rsquo;s box in the last half-century, and it took until a Friday night in Waco for someone to match LaFountain. Armstrong&rsquo;s slams came in the third, fourth, and seventh innings. Baylor drew 8 walks and absorbed 5 hit-by-pitches to keep loading the bases &mdash; and Armstrong kept clearing them. ESPN named him Player of the Week. He finished the full weekend with 14 RBI but was held hitless after the opener, which tells you something about how singular that performance was.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* The Upset Bracket */}
        <Section padding="lg">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-2 border-b border-burnt-orange/15">
                The Upset Bracket
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={50}>
              <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                <p>
                  <strong className="text-text-primary font-semibold">Michigan State at No. 8 Louisville</strong> was the weekend&rsquo;s biggest series result, and it wasn&rsquo;t close. The Spartans won the opener 4&ndash;3 on Friday &mdash; Randy Seymour and Adam Broski each homered &mdash; then clinched the series Saturday with a 13&ndash;4 rout powered by Parker Picot&rsquo;s 8-RBI day (grand slam in the fourth, 3-run homer in the sixth, sac fly). Picot was the first MSU player with 8 RBI in a game since Bob Malek in 2000. Louisville left 14 runners on base Saturday and went 2-for-10 with runners in scoring position. It was the first time Louisville lost their opening home series since 2011, and the first time they dropped their first series of a season since 2020. Star hitter Zion Rose didn&rsquo;t play all weekend for undisclosed reasons. Louisville dropped from No. 8 to No. 15 &mdash; the biggest poll slide of the week. The Spartans&rsquo; next trip? No. 3 Texas.
                </p>
                <p>
                  <strong className="text-text-primary font-semibold">UAB over No. 13 Florida, 9&ndash;7 in 10 innings</strong> on Opening Day was the most jarring single result of the night. Florida ace Liam Peterson &mdash; the No. 9 overall prospect in the 2026 MLB Draft, the No. 3 college arm per Baseball America &mdash; didn&rsquo;t survive the fourth inning. He walked 5 batters. That&rsquo;s not a &ldquo;rough outing.&rdquo; That&rsquo;s a Friday night where a premier arm couldn&rsquo;t find the zone, and it&rsquo;s the kind of game that reminds you Opening Day is live ammunition. Florida committed 3 errors and issued 8 total walks. To their credit, the Gators righted the ship Saturday with an 11&ndash;0 run-rule and a 6&ndash;1 clincher &mdash; but the opener serves as exactly the kind of data that tells you a staff still has calibration work to do before SEC play.
                </p>
                <p>
                  Jackson Flora&rsquo;s line for <strong className="text-text-primary font-semibold">UC Santa Barbara against No. 20 Southern Miss</strong> deserves its own paragraph: 6 innings, 0 runs, 3 hits, touching 100 mph on the fastball with a new changeup and curveball alongside his already elite sweeper. Flora is the No. 14 prospect in the 2026 draft class, taking over as UCSB&rsquo;s ace after No. 2 overall pick Tyler Bremner went to the Angels. Southern Miss won the series &mdash; Joey Urban&rsquo;s 8th-inning 2-run blast completed a comeback Saturday, and Matt Russo walked it off on Sunday &mdash; but Flora put himself on the national map in a way that Friday-night starters dream about.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Rankings Table — wide container */}
        <Section padding="lg" background="charcoal">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-2 pb-2 border-b border-burnt-orange/15">
                The Post-Week 1 Top 25
              </h2>
              <p className="font-serif text-base text-text-tertiary mb-6">
                The D1Baseball Top 25 as of February 16, 2026. Two new entrants &mdash; Oklahoma and West Virginia &mdash; replaced Vanderbilt and Arizona. Louisville&rsquo;s 7-spot drop was the largest. TCU&rsquo;s 3-spot climb on the strength of two ranked wins was the biggest rise.
              </p>
            </ScrollReveal>
          </Container>
          <Container>
            <ScrollReveal direction="up" delay={50}>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className="font-display text-[11px] tracking-[0.15em] uppercase text-burnt-orange bg-charcoal px-3 py-3 text-left border-b-2 border-burnt-orange w-10">Rk</th>
                      <th className="font-display text-[11px] tracking-[0.15em] uppercase text-burnt-orange bg-charcoal px-3 py-3 text-left border-b-2 border-burnt-orange">Team</th>
                      <th className="font-display text-[11px] tracking-[0.15em] uppercase text-burnt-orange bg-charcoal px-3 py-3 text-left border-b-2 border-burnt-orange">Record</th>
                      <th className="font-display text-[11px] tracking-[0.15em] uppercase text-burnt-orange bg-charcoal px-3 py-3 text-left border-b-2 border-burnt-orange">Chg</th>
                      <th className="font-display text-[11px] tracking-[0.15em] uppercase text-burnt-orange bg-charcoal px-3 py-3 text-left border-b-2 border-burnt-orange">Prev</th>
                      <th className="font-display text-[11px] tracking-[0.15em] uppercase text-burnt-orange bg-charcoal px-3 py-3 text-left border-b-2 border-burnt-orange">Weekend Headline</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RANKINGS.map((r) => (
                      <tr key={r.rank} className="hover:bg-burnt-orange/5 transition-colors">
                        <td className="font-display font-bold text-text-primary text-center px-3 py-2.5 border-b border-border-subtle">{r.rank}</td>
                        <td className="font-serif font-semibold text-text-primary px-3 py-2.5 border-b border-border-subtle">{r.team}</td>
                        <td className="font-mono text-xs tracking-wide text-text-tertiary px-3 py-2.5 border-b border-border-subtle">{r.record}</td>
                        <td className={`font-mono text-xs px-3 py-2.5 border-b border-border-subtle ${movementClass(r.change)}`}>{r.change}</td>
                        <td className="font-serif text-text-tertiary px-3 py-2.5 border-b border-border-subtle">{r.prev}</td>
                        <td className="font-serif italic text-text-tertiary text-[13px] px-3 py-2.5 border-b border-border-subtle">{r.headline}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="font-mono text-[10px] tracking-wider uppercase text-text-muted mt-3">
                Dropped out: Vanderbilt (prev. 23, 1-2) &middot; Arizona (prev. 24, 0-3)
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Coaching Debuts */}
        <Section padding="lg">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-2 border-b border-burnt-orange/15">
                Four Coaching Debuts Worth Tracking
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={50}>
              <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                <p>
                  <strong className="text-text-primary font-semibold">Brian O&rsquo;Connor at Mississippi State</strong> &mdash; The man who built Virginia into a seven-time CWS program and won a national championship in Charlottesville opened his Mississippi State tenure with a sweep of Hofstra. The margin was tighter than the aggregate suggests &mdash; a one-run opener, then two more methodical wins in a Saturday doubleheader. O&rsquo;Connor attacked the portal aggressively, and the early signs say the roster construction is sound. This isn&rsquo;t going to be Virginia South. It&rsquo;s going to be something different, and the SEC should pay attention.
                </p>
                <p>
                  <strong className="text-text-primary font-semibold">Josh Elander at Tennessee</strong> &mdash; When Tony Vitello left for the San Francisco Giants &mdash; the first college head coach to jump directly to an MLB manager role &mdash; Elander inherited a program that expected to contend immediately. The Vols responded with a 27&ndash;3 aggregate against Nicholls and a record crowd of 6,977 at the renovated Lindsey Nelson Stadium. Tegan Kuhns threw 6.2 innings of shutout ball with 8 strikeouts in the opener. Reese Chapman hit .600 for the weekend. The message from Knoxville was clear: this program didn&rsquo;t skip a beat.
                </p>
                <p>
                  <strong className="text-text-primary font-semibold">James Ramsey at Georgia Tech</strong> &mdash; Promoted after Danny Hall&rsquo;s retirement, Ramsey&rsquo;s first weekend produced a 50&ndash;11 aggregate against Bowling Green, including a 27&ndash;4 game that was the most runs scored in a single game by Georgia Tech since 1994. Caleb Daniel hit an inside-the-park home run on Opening Day. Alex Hernandez drove in 6 in the blowout. The offense&rsquo;s ceiling flashed early &mdash; the question is whether it holds against ACC-caliber pitching.
                </p>
                <p>
                  <strong className="text-text-primary font-semibold">Chris Pollard at Virginia</strong> &mdash; The Cavaliers scored 56 runs in a Saturday doubleheader against Wagner, shattering the program record. O&rsquo;Connor&rsquo;s departure created a narrative of decline; Pollard&rsquo;s first weekend was a blunt rejection of that idea. AJ Gracia, the Duke transfer with a career .299/.445/.559 line and 29 home runs, gives this offense a centerpiece it can build around.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Portal Impact */}
        <Section padding="lg" background="charcoal">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-2 border-b border-burnt-orange/15">
                The Portal Players Who Showed Up Immediately
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={50}>
              <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                <p>
                  The new 34-scholarship era has fundamentally altered roster construction, and Opening Weekend was the first look at how aggressively programs leveraged the portal. Here&rsquo;s who justified the bet immediately.
                </p>
                <p>
                  <strong className="text-text-primary font-semibold">Cooper Moore</strong> (Kansas &rarr; LSU): 6 IP, 1 R, 0 BB, career-high 11 K, 76 pitches with 61 strikes. His changeup was the primary weapon against Milwaukee, paired with a 92&ndash;93 mph fastball. Jay Johnson&rsquo;s quote &mdash; &ldquo;We&rsquo;ve been seeing this from Cooper since October&rdquo; &mdash; suggests this wasn&rsquo;t a fluke but a development story that simply needed a bigger stage.
                </p>
                <p>
                  <strong className="text-text-primary font-semibold">Cameron Johnson</strong> (LSU &rarr; Oklahoma): The irony of a former Tiger becoming the engine of Oklahoma&rsquo;s breakthrough can&rsquo;t be ignored. Johnson posted a 5.57 ERA in Baton Rouge last year. On Friday in Arlington, the 6-foot-6 lefty struck out 11 against Texas Tech. The SEC&rsquo;s Pitcher of the Week transferred out of the SEC and immediately pitched like a different arm.
                </p>
                <p>
                  <strong className="text-text-primary font-semibold">Caden Sorrell</strong> (Maryland &rarr; Texas A&amp;M): Two home runs and 5 RBI in the opener against Tennessee Tech. Named SEC Player of the Week. Career .347/.465/.614 hitter who gives the Aggies &mdash; 38 runs in their first two games, most since 1946 &mdash; a lineup anchor with real draft equity.
                </p>
                <p>
                  <strong className="text-text-primary font-semibold">Alex Sosa</strong> (NC State &rarr; Miami): 3 home runs across the Lehigh sweep. <strong className="text-text-primary font-semibold">Brendan Brock</strong> (JUCO &rarr; Oklahoma): Grand slam in his OU debut against Oklahoma State. <strong className="text-text-primary font-semibold">Macon Winslow</strong> (Duke &rarr; UNC): Walk-off home run in the 11th inning off the left-field scoreboard to complete the sweep of Indiana. That&rsquo;s the kind of swing that writes a career in Chapel Hill before March.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Arms Race */}
        <Section padding="lg">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-2 border-b border-burnt-orange/15">
                The Arms Race &mdash; Velocity and Stuff Notes
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={50}>
              <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                <p>
                  Opening Weekend is always the first real data on who added velocity, who changed shape, and whose stuff jumped over the fall. A few arms stood out beyond the headline performances.
                </p>
                <p>
                  <strong className="text-text-primary font-semibold">Jackson Flora, UCSB</strong> &mdash; Fastball now regularly touches triple digits. Added a new changeup and curveball to complement an already elite sweeper. At No. 14 on MLB Pipeline&rsquo;s draft board, Flora is pitching like a top-5 arm.
                </p>
                <p>
                  <strong className="text-text-primary font-semibold">Wyatt Nadeau, Vanderbilt (Fr.)</strong> &mdash; Fastball touched 98 mph with a cut-ride profile in his debut. Slider at 89 mph with &ndash;5 inches of induced vertical break. The stuff is premium. The challenge is channeling it consistently before SEC play.
                </p>
                <p>
                  <strong className="text-text-primary font-semibold">England Bryan, Vanderbilt (So.)</strong> &mdash; Mechanical changes produced a new arm slot generating 19 inches of induced vertical break on the fastball. His cutter drew 3 whiffs on 4 swings. Vanderbilt&rsquo;s staff may have stumbled to a 1&ndash;2 record, but the individual arm talent suggests the turnaround won&rsquo;t take long.
                </p>
                <p>
                  <strong className="text-text-primary font-semibold">Dylan Volantis, Texas</strong> &mdash; The 2025 SEC Freshman of the Year opened with 7 innings, 1 hit, 1 run, 8 strikeouts against UC Davis. At Texas, the No. 1 starter sets the tone for the series &mdash; and Volantis set it at &ldquo;control.&rdquo; That profile travels in SEC weekends.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Injury */}
        <Section padding="lg" background="charcoal">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-2 border-b border-burnt-orange/15">
                The Injury That Changes a Draft Board
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={50}>
              <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                <p>
                  Kentucky shortstop <strong className="text-text-primary font-semibold">Tyler Bell</strong> &mdash; the No. 14 prospect in Baseball America&rsquo;s Top 200 draft rankings, a projected first-round pick who turned down second-round money from the Rays last summer &mdash; injured his left shoulder diving for a ball in the seventh inning of Friday&rsquo;s opener against UNC Greensboro. He&rsquo;s out indefinitely. Bell hit .296/.385/.522 with 10 home runs as a freshman in 2025. Luke Lawrence stepped into the lineup and Kentucky still swept (34&ndash;11 aggregate, hitting .345 as a team), but losing a player of Bell&rsquo;s caliber reshapes how opposing staffs plan against the Wildcats and how front offices evaluate a draft class. Kentucky says they&rsquo;ll evaluate when they return to Lexington. The timeline matters for everyone &mdash; Bell, the program, and the 30 clubs projecting him.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Week 2 Preview */}
        <Section padding="lg">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-2 border-b border-burnt-orange/15">
                What Week 2 Is Really About
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={50}>
              <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                <p>
                  Coaches now have real information. Not fall scrimmage data, not intrasquad velocity readings &mdash; real information about who can throw strikes, who can handle the ninth inning, and whose lineup disappears when it can&rsquo;t slug. The guy-in-the-bullpen who can&rsquo;t find the zone in February becomes your only option in May if you don&rsquo;t discover alternatives now. That&rsquo;s why this weekend mattered more than the scores suggest.
                </p>
                <p>
                  The marquee is <strong className="text-text-primary font-semibold">No. 7 TCU at No. 1 UCLA</strong> (Feb. 20&ndash;22) &mdash; a true top-10 test where the question writes itself: can TCU&rsquo;s tight-game travel profile survive in Los Angeles against the best lineup in college baseball? Roch Cholowsky, the consensus No. 1 overall draft pick, homered on the first pitch he saw Saturday. Lucas Franco, TCU&rsquo;s electric freshman, had 96+ mph exit velocity on every ball he put in play. Something has to give. Also on deck: <strong className="text-text-primary font-semibold">Michigan State at No. 3 Texas</strong>, where the Spartans get to find out whether the Louisville series win was a statement or a sugar high.
                </p>
                <p>
                  Don&rsquo;t overreact to early polls &mdash; the Coaches Poll is conservative in February, and the real movement is in how programs deploy pitching and tighten defensive variance before March. The driver of lasting ranking change isn&rsquo;t one loss. It&rsquo;s <em>how</em> you lost &mdash; bullpen collapse, defensive volatility, and whether you showed a second way to win when the first one failed. The teams that answered that question this weekend already know what they can lean on. The rest are still guessing.
                </p>
                <p className="!mt-8">
                  <Link href="/college-baseball/editorial/weekend-2-recap" className="inline-flex items-center gap-2 bg-burnt-orange/10 border border-burnt-orange/20 rounded px-4 py-2.5 text-burnt-orange hover:bg-burnt-orange/15 transition-colors text-base not-italic">
                    <span className="font-display text-xs uppercase tracking-widest font-semibold">Update</span>
                    <span className="text-text-tertiary">|</span>
                    <span>Weekend 2 results are in &mdash; UCLA answered, and so did the rest of the field.</span>
                    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </Link>
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Pull Quote */}
        <Section padding="md">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <blockquote className="border-l-[3px] border-burnt-orange pl-6 py-2 my-4">
                <p className="font-serif text-xl italic font-medium text-text-primary leading-relaxed">
                  The contenders now know what they can lean on &mdash; a true late-inning arm, a stable top three in the order, a starter who can turn a lineup over twice without falling apart. The pretenders learned what the scoreboard doesn&rsquo;t hide: free bases, shallow middle relief, and lineups that disappear when they can&rsquo;t slug.
                </p>
              </blockquote>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Quick Hits */}
        <Section padding="lg" background="charcoal">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-2 border-b border-burnt-orange/15">
                Quick Hits From the Margins
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={50}>
              <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                <p>
                  <strong className="text-text-primary font-semibold">La Salle returned to baseball</strong> after being cut during COVID in 2020. They swept Maryland-Eastern Shore 48&ndash;16 across three games and scored 27 runs in their first game in over five years. Programs come back when people fight for them.
                </p>
                <p>
                  <strong className="text-text-primary font-semibold">Missouri posted a 34&ndash;3 win</strong> on Sunday with 32 RBI &mdash; a program record and the second-most runs scored in a game since 1902. Virginia&rsquo;s 56-run Saturday doubleheader also set a program record. Oregon went 4&ndash;0 with two 14-run wins. The margins were extreme on both ends.
                </p>
                <p>
                  <strong className="text-text-primary font-semibold">USC threw a combined no-hitter</strong> against Pepperdine in an 11&ndash;0 run-rule Saturday. Grant Govel went 6 hitless innings; Andrew Lamb ended the game with a walk-off homer. The weekend that the college baseball world will remember for Armstrong&rsquo;s three grand slams also produced its share of quieter excellence.
                </p>
                <p>
                  <strong className="text-text-primary font-semibold">Auburn&rsquo;s Ryan Heltzer</strong> entered the 10th inning of a 1&ndash;1 game against Youngstown State with runners on first and second, nobody out. He struck out three consecutive batters. Walk-off wild pitch won it. That&rsquo;s the kind of relief appearance that defines a bullpen role for months.
                </p>
                <p>
                  <strong className="text-text-primary font-semibold">Context that matters going forward:</strong> The SEC now has 11 teams in the Top 25 and has won 6 straight national championships &mdash; 8 of the last 10. LSU is the defending champion after sweeping Coastal Carolina in the 2025 CWS Finals. The last back-to-back champion was South Carolina in 2010&ndash;11. The CWS begins June 12 at Charles Schwab Field in Omaha.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* BSI Verdict */}
        <Section padding="lg">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <div className="relative bg-gradient-to-br from-burnt-orange/8 to-texas-soil/5 border border-burnt-orange/15 rounded p-8 sm:p-10">
                <div className="absolute -top-2.5 left-8 font-display text-[11px] tracking-[3px] uppercase bg-midnight text-burnt-orange px-3">
                  BSI Verdict
                </div>
                <div className="font-serif text-lg leading-relaxed text-[#FAF7F2] space-y-4">
                  <p>
                    Opening Weekend did what it always does &mdash; it separated preparation from prediction. The teams that were ready won in multiple ways: Oklahoma&rsquo;s rotation revealing itself at the Shriners, North Carolina grinding out three wins including a walk-off in the 11th, and Mississippi State&rsquo;s new coaching staff executing a sweep in their first weekend. The teams that weren&rsquo;t ready &mdash; Vanderbilt falling out of the poll entirely, Arizona dropping all three in Surprise, Louisville losing a home series to Michigan State &mdash; exposed the gaps between roster construction and roster execution.
                  </p>
                  <p>
                    The story of the 2026 season won&rsquo;t be written for four more months. But the handwriting is already on the wall, and the teams that can read it are the ones that answered the only question Opening Weekend asks: can you win when your first plan doesn&rsquo;t work?
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Attribution */}
        <Section padding="md" className="border-t border-burnt-orange/10">
          <Container size="narrow">
            <div className="space-y-4">
              <DataSourceBadge source="D1Baseball / ESPN / NCAA / Baseball America / MLB Pipeline" timestamp="February 16, 2026 CT" />
              <div className="flex flex-wrap gap-6 pt-2">
                <Link href="/college-baseball/editorial" className="font-display text-[13px] uppercase tracking-widest text-burnt-orange hover:opacity-70 transition-opacity">
                  All Editorial &rarr;
                </Link>
                <Link href="/college-baseball/editorial/weekend-2-recap" className="font-display text-[13px] uppercase tracking-widest text-text-muted hover:text-burnt-orange transition-colors">
                  Weekend 2 Recap &rarr;
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
