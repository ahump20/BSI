import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { StatCard } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Weekend 2 Recap: The No. 1 Showed Up. The Rest Got Sorted. | Blaze Sports Intel',
  description:
    'National college baseball Weekend 2 recap and Weekend 3 preview. UCLA sweeps TCU 30-8. Two cycles hit. Auburn emerges at Globe Life. The complete BSI breakdown.',
  openGraph: {
    title: 'Weekend 2 Recap: The No. 1 Showed Up. The Rest Got Sorted.',
    description:
      'UCLA made a statement. TCU dropped 11 spots. Two players hit for the cycle. The complete BSI breakdown of college baseball Weekend 2, plus Weekend 3 matchups to watch.',
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
  { rank: 1, team: 'UCLA', record: '6-1', change: '—', prev: '1', headline: 'Swept No. 7 TCU 30-8; Cholowsky 3 HR, 5 RBI in G1' },
  { rank: 2, team: 'LSU', record: '8-0', change: '—', prev: '2', headline: '3-0 at Jax Classic; beat Indiana, Notre Dame, UCF' },
  { rank: 3, team: 'Texas', record: '7-0', change: '—', prev: '3', headline: 'Swept Michigan State; Robbins hit for the cycle' },
  { rank: 4, team: 'Mississippi State', record: '8-0', change: '—', prev: '4', headline: 'Swept Delaware; outscored opponents 58-12' },
  { rank: 5, team: 'Georgia Tech', record: '8-0', change: '—', prev: '5', headline: '6 straight games of 10+ runs; program record' },
  { rank: 6, team: 'Arkansas', record: '6-1', change: '↑2', prev: '8', headline: 'Kozeal hit for the cycle; walk-off win vs Xavier' },
  { rank: 7, team: 'Auburn', record: '6-1', change: '↑2', prev: '9', headline: '3-0 at Globe Life; beat FSU + Louisville' },
  { rank: 8, team: 'North Carolina', record: '6-1-1', change: '↑2', prev: '10', headline: 'Swept Indiana; lost G2 and tied G3 at ECU' },
  { rank: 9, team: 'Coastal Carolina', record: '5-2', change: '↓3', prev: '6', headline: 'Lost to Illinois 14-5 at Battle at the Beach' },
  { rank: 10, team: 'Florida', record: '7-0', change: '↑2', prev: '12', headline: '5-0 week; swept Kennesaw State' },
  { rank: 11, team: 'Georgia', record: '6-1', change: '↑3', prev: '14', headline: 'Swept Samford; outscored 45-5 on the weekend' },
  { rank: 12, team: 'Southern Miss', record: '6-1', change: '↑8', prev: '20', headline: 'Biggest riser; 3-0 at Round Rock Classic' },
  { rank: 13, team: 'Oklahoma', record: '7-0', change: '↑8', prev: '21', headline: 'Unbeaten; swept Coppin State by combined 57-1' },
  { rank: 14, team: 'NC State', record: '5-1', change: '↑3', prev: '17', headline: 'Only loss: 1-0 to Princeton in Saturday DH' },
  { rank: 15, team: 'Clemson', record: '7-0', change: '↑4', prev: '19', headline: '4-0 week; swept Bryant by multiple runs each game' },
  { rank: 16, team: 'Wake Forest', record: '6-1', change: '↑6', prev: '22', headline: 'Swept Siena after Puerto Rico loss to Houston' },
  { rank: 17, team: 'Miami (FL)', record: '9-0', change: '↑6', prev: '23', headline: 'Outscored opponents 144-39; 9-0 start' },
  { rank: 18, team: 'TCU', record: '2-5', change: '↓11', prev: '7', headline: 'Swept by UCLA; lost midweek to UT Arlington' },
  { rank: 19, team: 'Oregon State', record: '4-3', change: '↓8', prev: '11', headline: 'Lost 2 of 3 at Round Rock; dropped hard' },
  { rank: 20, team: 'Tennessee', record: '5-2', change: '↓7', prev: '13', headline: 'Lost series to Kent State; hitless with runners on Saturday' },
  { rank: 21, team: 'Florida State', record: '4-2', change: '↓5', prev: '16', headline: 'Lost to Auburn and Nebraska at Globe Life' },
  { rank: 22, team: 'Kentucky', record: '5-2', change: '↓4', prev: '18', headline: 'Shutout by Evansville; lost midweek to Morehead State' },
  { rank: 23, team: 'Texas A&M', record: '7-0', change: '↑1', prev: '24', headline: 'Unbeaten; swept Penn with Sorrell leading' },
  { rank: 24, team: 'West Virginia', record: '5-1', change: '↑1', prev: '25', headline: 'Lost G3 at Liberty; otherwise dominant' },
  { rank: 25, team: 'Ole Miss', record: '8-0', change: 'NEW', prev: 'NR', headline: 'Swept Missouri State; best start since 2018' },
];

function movementClass(change: string) {
  if (change === 'NEW') return 'text-ember font-semibold';
  if (change.includes('↑')) return 'text-success';
  if (change.includes('↓')) return 'text-error';
  return 'text-text-muted';
}

// ── Stat boxes ───────────────────────────────────────────────────────

const STATS = [
  { label: "Cholowsky vs TCU", value: '3 HR', helperText: '5 RBI in Game 1 alone; 6 HR on the season' },
  { label: 'UCLA outscored TCU', value: '30-8', helperText: 'Sweep included 15-5 run-rule' },
  { label: 'Cycles hit Weekend 2', value: '2', helperText: 'Kozeal (Arkansas) + Robbins (Texas)' },
  { label: 'SEC teams ranked', value: '12', helperText: 'Of 25 spots in D1Baseball poll' },
];

// ── Page ─────────────────────────────────────────────────────────────

export default function Weekend2RecapPage() {
  return (
    <>
      <main id="main-content">
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
              <span className="text-text-primary">Weekend 2 Recap</span>
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
                  <Badge variant="primary">Weekend 2 Recap</Badge>
                  <span className="text-text-muted text-sm">February 24, 2026</span>
                  <span className="text-text-muted text-sm">15 min read</span>
                </div>
                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-wide mb-6">
                  The No. 1 Showed Up.{' '}
                  <span className="text-gradient-blaze">The Rest Got Sorted.</span>
                </h1>
                <p className="font-serif text-xl text-text-tertiary leading-relaxed italic">
                  UCLA made a statement that echoed from Westwood to Fort Worth. Two players hit for the cycle. Auburn announced itself at Globe Life. And three ranked teams learned that February has real consequences.
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
                  Weekend 2 is where the preseason narrative either holds or breaks. Week 1 is live ammunition, but it&rsquo;s live ammunition against mid-majors and weather-shortened schedules. Weekend 2 is the first time ranked teams face each other&rsquo;s best arms in back-to-back-to-back games &mdash; Friday starter, Saturday lineup adjustments, Sunday bullpen management. It&rsquo;s the weekend where you learn whether a team&rsquo;s depth chart is real or a press release. What we learned across February 20&ndash;22 is that the consensus No. 1 team in the country is not a projection &mdash; it&rsquo;s a verdict. UCLA outscored the No. 7 team in the country 30&ndash;8 across three games and didn&rsquo;t need a single close game to do it.
                </p>
                <p>
                  The secondary story is movement. Twelve SEC teams now occupy the D1Baseball Top 25. TCU fell 11 spots &mdash; the largest single-week drop of the season. Tennessee, the preseason darling under new coach Josh Elander, lost to Kent State and dropped seven. Meanwhile, the teams that climbed &mdash; Southern Miss up 8, Oklahoma up 8, Wake Forest up 6, Miami up 6 &mdash; did it by doing something specific: winning every game they were supposed to win, then beating a team they weren&rsquo;t supposed to beat. That&rsquo;s the difference between momentum and noise. Momentum survives the Monday morning poll because it has receipts.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* UCLA-TCU */}
        <Section padding="lg">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-2 border-b border-burnt-orange/15">
                UCLA&ndash;TCU: The Statement Series
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={50}>
              <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                <p>
                  The matchup was supposed to be the weekend&rsquo;s headliner &mdash; No. 1 UCLA hosting No. 7 TCU, the same Horned Frogs who beat two ranked teams at the Shriners Showdown in Week 1. It was a headliner. Just not a competitive one. UCLA won 10&ndash;2, 5&ndash;1, and 15&ndash;5 (run-rule), outscoring TCU 30&ndash;8 across three games. The margin wasn&rsquo;t the story. The mechanism was.
                </p>
                <p>
                  <strong className="text-text-primary font-semibold">Roch Cholowsky</strong>, the consensus No. 1 overall pick in the 2026 MLB Draft, opened Game 1 with a grand slam in the second inning and followed it with a solo shot in the fifth &mdash; 2 home runs and 5 RBI before the game was half over. He added another solo homer in Game 3, giving him 3 home runs in the series and 6 on the season through 7 games. Combined with <strong className="text-text-primary font-semibold">Will Gasparino</strong>, who went 7-for-13 (.538) in the series, UCLA&rsquo;s 3-4 hitters produced 6 home runs and 16 RBI across three games. TCU&rsquo;s pitching staff, which held Arkansas and Vanderbilt to 4 runs each at the Shriners, had no answer for UCLA&rsquo;s lineup depth.
                </p>
                <p>
                  TCU&rsquo;s 11-spot drop from No. 7 to No. 18 is the largest single-week fall of the young season, and it rewrites how we should read their Shriners results. Beating ranked teams in one-run games at a neutral site demonstrated competitiveness. Getting swept by 22 aggregate runs at someone else&rsquo;s park demonstrated the gap between competing and contending. The rotation unraveled &mdash; starter Mason Brassfield was knocked out after 1.2 innings in Game 1, and ace Tommy LaPour was unavailable due to elbow soreness. The question for Kirk Saarloos&rsquo;s staff isn&rsquo;t whether they can play tight games &mdash; they proved that in Week 1. The question is whether they have the pitching depth to survive when their top arm is out and the opponent&rsquo;s lineup doesn&rsquo;t let up.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Auburn at Globe Life */}
        <Section padding="lg" background="charcoal">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-2 border-b border-burnt-orange/15">
                The Neutral Site Continued: Auburn at Globe Life
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={50}>
              <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                <p>
                  The Amegy Bank College Baseball Series at Globe Life Field produced its own clarity. Auburn went 3&ndash;0, beating Kansas State 5&ndash;1, No. 16 Florida State 8&ndash;5, and No. 15 Louisville 10&ndash;6. The win against Kansas State was methodical &mdash; <strong className="text-text-primary font-semibold">Jake Marciano</strong> threw 6.0 innings of shutout baseball with zero walks and 8 strikeouts. The wins against Florida State and Louisville were chaotic, decided by Auburn&rsquo;s willingness to manufacture runs across multiple phases of the game rather than relying on one big inning.
                </p>
                <p>
                  <strong className="text-text-primary font-semibold">Bristol Carter</strong> was named Most Outstanding Player of the event: 6 hits, 7 runs scored, 3 walks, 2 stolen bases, and 2 RBI across three games. Carter&rsquo;s value wasn&rsquo;t in power production &mdash; it was in pressure. He got on base, advanced, and forced defensive decisions that compounded into runs. That&rsquo;s the kind of player who changes how a lineup functions, because the defense can never settle in when he&rsquo;s moving.
                </p>
                <p>
                  Auburn climbed from No. 9 to No. 7, and the trajectory matters more than the two spots. Butch Thompson&rsquo;s club is 6&ndash;1 with wins over two ranked opponents at a neutral site. Louisville, which lost its home opener to Michigan State in Week 1, now has losses to both the Spartans and Auburn in the first two weekends &mdash; and dropped out of the Top 25 entirely. Florida State fell from No. 16 to No. 21. The Globe Life Field results are doing real damage to the teams that can&rsquo;t match Auburn&rsquo;s combination of starting pitching depth and lineup versatility.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Performance of the Weekend */}
        <Section padding="lg">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-2 border-b border-burnt-orange/15">
                Performance of the Weekend: Cam Kozeal
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={50}>
              <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                <p>
                  Two players hit for the cycle this weekend. Both deserve full paragraphs. But the nod goes to Arkansas&rsquo;s <strong className="text-text-primary font-semibold">Cam Kozeal</strong> because of what happened around his.
                </p>
                <p>
                  Kozeal went 4-for-5 with a double, triple, home run, and single in Saturday&rsquo;s game against Xavier &mdash; the first Razorback to hit for the cycle since Dylan Leach in 2022. The game itself was a 7&ndash;6 walk-off win, with <strong className="text-text-primary font-semibold">Kuhio Aloy</strong> delivering the game-winning RBI single. That context matters. Kozeal didn&rsquo;t compile stats in a blowout. He hit for the cycle in a one-run game that Arkansas had to walk off to win. His week-long line &mdash; 8-for-17, 2 home runs, 7 RBI &mdash; confirmed that the cycle wasn&rsquo;t an anomaly but the peak of a player locked into every at-bat.
                </p>
                <p>
                  The Razorbacks took the series from Xavier and climbed two spots to No. 6. Dave Van Horn&rsquo;s lineup has always been about depth and pressure rather than one signature hitter, and Kozeal&rsquo;s weekend fits that identity &mdash; he didn&rsquo;t carry the team, he raised the floor for everyone around him. When your three-hole guy hits for the cycle, the pitcher has nowhere to pitch around him, and the bottom third of the order sees fastballs they wouldn&rsquo;t otherwise get.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* The Upset Report */}
        <Section padding="lg" background="charcoal">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-2 border-b border-burnt-orange/15">
                The Upset Report
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={50}>
              <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                <p>
                  <strong className="text-text-primary font-semibold">Kent State 2, No. 13 Tennessee 1.</strong> The Vols went 0-for-15 with runners on base in Saturday&rsquo;s loss. Zero for fifteen. That&rsquo;s not a cold streak &mdash; that&rsquo;s a lineup that couldn&rsquo;t make an adjustment when the opposing staff took away the pull side. Tennessee had opened the weekend with a 4&ndash;3 win Friday, rescued by <strong className="text-text-primary font-semibold">Tyler Myatt&rsquo;s</strong> 434-foot pinch-hit walk-off home run. Then dropped Game 3 as well, 9&ndash;5. The Vols fell from No. 13 to No. 20 &mdash; a 7-spot drop that signals the Josh Elander era&rsquo;s first real turbulence. The Lindsey Nelson crowd that set attendance records in Week 1 watched a team that couldn&rsquo;t execute with runners on. That gap between situational hitting and raw offensive talent is what conference play exposes.
                </p>
                <p>
                  <strong className="text-text-primary font-semibold">Evansville shut out No. 18 Kentucky</strong> in the second game of a doubleheader. Kentucky won the series 2&ndash;1, but a shutout loss to an MVC opponent at home is the kind of result that tells you the floor isn&rsquo;t as stable as the record suggests. The Wildcats dropped from No. 18 to No. 22. They&rsquo;re still playing without shortstop Tyler Bell, the projected first-round pick who went down with a shoulder injury in Week 1. Bell&rsquo;s absence doesn&rsquo;t explain a shutout &mdash; he plays defense, not all nine positions &mdash; but it explains the margin for error shrinking in a lineup that can&rsquo;t absorb a zero without its best hitter.
                </p>
                <p>
                  <strong className="text-text-primary font-semibold">Illinois 14, No. 9 Coastal Carolina 5</strong> at the Battle at the Beach showed cracks in a Chanticleers team that allowed just 4 runs total in Week 1. Coastal still won the weekend&rsquo;s other games, but a 14-run loss to an unranked Big Ten opponent is the kind of variance that drops you from No. 6 to No. 9. When your pitching staff gives up 14, the bullpen is the story &mdash; and Coastal&rsquo;s middle relief couldn&rsquo;t stop the bleeding once the dam broke.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Rankings Table */}
        <Section padding="lg">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-2 pb-2 border-b border-burnt-orange/15">
                The Post-Weekend 2 Top 25
              </h2>
              <p className="font-serif text-base text-text-tertiary mb-6">
                The D1Baseball Top 25 as of February 23, 2026. Ole Miss enters at No. 25 after an 8&ndash;0 start. Louisville drops out entirely. TCU&rsquo;s 11-spot fall was the largest. Southern Miss and Oklahoma each climbed 8 spots &mdash; the biggest rises.
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
                Dropped out: Louisville (prev. 15) &middot; Virginia &middot; Arizona
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Texas at 7-0 */}
        <Section padding="lg" background="charcoal">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-2 border-b border-burnt-orange/15">
                Texas at 7&ndash;0: The Quiet Sweep
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={50}>
              <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                <p>
                  The Longhorns swept Michigan State 8&ndash;1, 3&ndash;1, 4&ndash;0 &mdash; and the middle game produced the weekend&rsquo;s other cycle. <strong className="text-text-primary font-semibold">Aiden Robbins</strong> went single, double, triple, home run on Saturday, becoming the first Longhorn to hit for the cycle since CJ Hinojosa in 2015. That&rsquo;s 11 years between cycles for a program that produces lineups as deep as any in the country. The milestone wasn&rsquo;t just rare &mdash; it came in a 3&ndash;1 game where every hit mattered, not a blowout where the cycle was a bonus.
                </p>
                <p>
                  <strong className="text-text-primary font-semibold">Ruger Riojas</strong> set the tone Friday with 6 innings, 1 earned run, and 10 strikeouts. Riojas was a reliever last season. His conversion to a starting role is one of the most consequential development stories in college baseball right now &mdash; when your former bullpen arm can give you 6 innings with 10 strikeouts on Fridays, it lengthens the entire pitching staff and lets your actual relievers work shorter, higher-leverage outings.
                </p>
                <p>
                  Sunday was <strong className="text-text-primary font-semibold">Dylan Volantis</strong> at his best: 7 innings, 0 earned runs, 9 strikeouts (career high). The 2025 SEC Freshman of the Year who opened with 7 IP, 1 H, 8 K against UC Davis in Week 1 has now thrown 14 innings to start the season with 17 strikeouts and zero earned runs. Texas is 7&ndash;0 without needing a signature comeback or a dramatic walk-off. They&rsquo;re winning by controlling the game from the first inning &mdash; starters going deep, defense holding, and just enough offense to put it away. That profile might not generate headlines, but it&rsquo;s the profile that travels in March.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* The Undefeateds */}
        <Section padding="lg">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-2 border-b border-burnt-orange/15">
                The Undefeateds
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={50}>
              <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                <p>
                  Ten ranked programs remain unbeaten after two weekends. Mississippi State, Georgia Tech, Florida, Oklahoma, Clemson, and Texas A&amp;M are all unblemished &mdash; but the four unbeaten records that tell you the most about what&rsquo;s coming are these.
                </p>
                <p>
                  <strong className="text-text-primary font-semibold">Miami (FL) at 9&ndash;0</strong> has the most dominant aggregate: 144 runs scored, 39 allowed. That 3.7-to-1 ratio is absurd even against a soft early schedule. The Hurricanes are hitting from every spot in the order, and Alex Sosa&rsquo;s power emergence &mdash; he already has multiple multi-homer games &mdash; gives them a middle-of-the-lineup anchor. Miami climbed from No. 23 to No. 17 and should keep climbing if the run production holds against better pitching.
                </p>
                <p>
                  <strong className="text-text-primary font-semibold">Ole Miss at 8&ndash;0</strong> swept Missouri State 11&ndash;6, 6&ndash;3, 3&ndash;2 to enter the Top 25 at No. 25. Austin Fawley&rsquo;s grand slam in the opener and Judd Utermark&rsquo;s multi-homer performances have given Mike Bianco&rsquo;s club its best start since 2018. The concern: two of the three wins were decided by 3 runs or fewer, which means the Rebels are winning close games against a non-conference opponent. That works until it doesn&rsquo;t &mdash; but the fact that they won all three, including a one-run Sunday game, shows a roster that knows how to finish.
                </p>
                <p>
                  <strong className="text-text-primary font-semibold">LSU at 8&ndash;0</strong> went 3&ndash;0 at the Live Like Lou Jax Classic, beating Indiana, Notre Dame, and UCF. Jay Johnson&rsquo;s club is tied for its best start under his tenure. The defending national champions aren&rsquo;t getting the spotlight that UCLA is right now, but that&rsquo;s because they&rsquo;re winning without drama &mdash; which is exactly what a championship defense looks like when it&rsquo;s working.
                </p>
                <p>
                  <strong className="text-text-primary font-semibold">Texas at 7&ndash;0</strong> has the smallest aggregate margin of the four &mdash; and that might be the most encouraging sign. The Longhorns are winning without needing to outscore anyone by double digits. Their pitching is elite, their offense is efficient, and they haven&rsquo;t had to use their full bullpen in a single game. When the stress test comes &mdash; and it will &mdash; they&rsquo;ll have arms available that other staffs have already burned.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Weekend 3 Preview */}
        <Section padding="lg" background="charcoal">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-2 border-b border-burnt-orange/15">
                Weekend 3 Preview: Matchups to Watch
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={50}>
              <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                <p>
                  The <strong className="text-text-primary font-semibold">Amegy Bank College Baseball Series returns to Globe Life Field</strong> (Feb. 27&ndash;Mar. 1) with a round-robin featuring No. 1 UCLA, No. 4 Mississippi State, No. 20 Tennessee, No. 23 Texas A&amp;M, Arizona State, and Virginia Tech. The matchups that matter most:
                </p>
                <p>
                  <strong className="text-text-primary font-semibold">No. 1 UCLA vs. No. 20 Tennessee</strong> (Friday, 3 PM CT) is the weekend&rsquo;s most revealing game. Tennessee needs a quality win to arrest a 7-spot slide, and UCLA just proved at TCU&rsquo;s expense what happens when elite talent meets a team in transition. If the Vols go hitless with runners on again against UCLA&rsquo;s rotation, the Elander era&rsquo;s first real crisis becomes the story. If they can solve UCLA&rsquo;s arms, it tells you the Kent State loss was an aberration, not a pattern.
                </p>
                <p>
                  <strong className="text-text-primary font-semibold">No. 23 Texas A&amp;M vs. No. 1 UCLA</strong> (Saturday, 7 PM CT) tests whether the Aggies&rsquo; offensive production &mdash; Sorrell earning SEC Player of the Week honors &mdash; can translate against the best pitching staff in the country. UCLA has now outscored its last ranked opponent 30&ndash;8. Texas A&amp;M needs to prove it can score against arms that live in the low-to-mid 90s with multiple secondaries.
                </p>
                <p>
                  <strong className="text-text-primary font-semibold">No. 1 UCLA vs. No. 4 Mississippi State</strong> (Sunday, 2:30 PM CT) is the de facto headliner of the weekend. Both teams are unbeaten. Brian O&rsquo;Connor&rsquo;s club hasn&rsquo;t faced a lineup like UCLA&rsquo;s yet. This is the kind of late-February game that rewrites preseason projections &mdash; whoever wins will own the strongest non-conference r&eacute;sum&eacute; in the sport entering March.
                </p>
                <p>
                  The Globe Life round-robin also features Arizona State and Virginia Tech, giving six teams three games apiece at a neutral site with real stakes. The teams that come out of Arlington 3&ndash;0 will carry non-conference r&eacute;sum&eacute;s that hold up through Selection Monday. The teams that stumble will spend March trying to recover ground they gave away in February.
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
                    Weekend 2 separated the teams playing to a standard from the teams playing to a schedule. UCLA didn&rsquo;t just sweep TCU &mdash; it eliminated ambiguity about who owns the No. 1 ranking and why. Cholowsky and Gasparino combining for 6 home runs and 16 RBI against a ranked opponent is the kind of lineup performance that resets how the No. 1 ranking is evaluated. Auburn&rsquo;s 3&ndash;0 run through Globe Life, built on Marciano&rsquo;s dominance and Carter&rsquo;s manufacturing, announced a team that can win in multiple shapes. And two cycles &mdash; Kozeal in a walk-off, Robbins in a tight game &mdash; reminded everyone that the best individual performances in college baseball happen when they matter, not when the scoreboard has already decided the outcome.
                  </p>
                  <p>
                    Weekend 3 brings the question that February can only ask but never fully answer: when the best teams face each other at a neutral site with real stakes, does the depth that won non-conference series hold up? Globe Life will tell us. And the answer will shape the national picture from March through Omaha.
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
              <DataSourceBadge source="D1Baseball / ESPN / NCAA / Team Sources" timestamp="February 24, 2026 CT" />
              <div className="flex flex-wrap gap-6 pt-2">
                <Link href="/college-baseball/editorial" className="font-display text-[13px] uppercase tracking-widest text-burnt-orange hover:opacity-70 transition-opacity">
                  All Editorial &rarr;
                </Link>
                <Link href="/college-baseball/editorial/week-1-recap" className="font-display text-[13px] uppercase tracking-widest text-text-muted hover:text-burnt-orange transition-colors">
                  Week 1 Recap &rarr;
                </Link>
              </div>
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
