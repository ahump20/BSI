import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { StatCard } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { ArticleJsonLd } from '@/components/seo/ArticleJsonLd';

export const metadata: Metadata = {
  title: 'Weekend 8 Recap & Rankings Analysis | 2026 College Baseball | BSI',
  description:
    'UCLA stays untouchable at 30-2. Alabama surges eight spots. UCF makes the biggest jump of the season. LSU scores ten in the twelfth to storm back into the Top 25. The midseason picture is sharpening.',
  alternates: { canonical: '/college-baseball/editorial/weekend-8-recap' },
  openGraph: {
    title: 'Weekend 8 Recap & Rankings Analysis | BSI',
    description:
      'UCLA stays untouchable at 30-2. Alabama surges eight spots. UCF makes the biggest jump of the season. LSU storms back into the Top 25.',
    type: 'article',
    publishedTime: '2026-04-07',
    images: [{ url: '/images/og-college-baseball.png', width: 1200, height: 630 }],
  },
};

/* -- Data ----------------------------------------------------------- */

const statCards = [
  { label: 'UCLA Record', value: '30-2', helperText: 'Best start in program history \u2014 two losses all season, none in conference play' },
  { label: 'Jackson HRs', value: '17', helperText: 'Daniel Jackson leads D1 \u2014 .592 wOBA, .477 AVG for the Georgia Bulldogs' },
  { label: 'UCF Jump', value: '+11', helperText: 'Biggest ranking move of the season \u2014 23rd to 12th after beating No. 17 West Virginia' },
  { label: 'LSU 12th Inning', value: '10', helperText: 'Ten runs in the twelfth inning at Tennessee \u2014 Tigers re-enter Top 25 at No. 24' },
];

const rankings = [
  { rank: 1, team: 'UCLA', record: '30-2', movement: 0 },
  { rank: 2, team: 'Texas', record: '27-5', movement: 0 },
  { rank: 3, team: 'Georgia Tech', record: '26-5', movement: 0 },
  { rank: 4, team: 'Georgia', record: '28-6', movement: 1 },
  { rank: 5, team: 'Florida State', record: '24-7', movement: 2 },
  { rank: 6, team: 'North Carolina', record: '27-5-1', movement: 0 },
  { rank: 7, team: 'Oregon State', record: '24-6', movement: 2 },
  { rank: 8, team: 'Alabama', record: '26-8', movement: 8 },
  { rank: 9, team: 'Mississippi State', record: '26-7', movement: -5 },
  { rank: 10, team: 'Southern Miss', record: '23-9', movement: -2 },
  { rank: 11, team: 'Coastal Carolina', record: '23-8', movement: 3 },
  { rank: 12, team: 'UCF', record: '20-9', movement: 11 },
  { rank: 13, team: 'Virginia', record: '24-9', movement: -3 },
  { rank: 14, team: 'USC', record: '27-7', movement: -2 },
  { rank: 15, team: 'Auburn', record: '22-10', movement: 3 },
  { rank: 16, team: 'Oklahoma', record: '22-10', movement: -5 },
  { rank: 17, team: 'West Virginia', record: '21-7', movement: -4 },
  { rank: 18, team: 'Texas A&M', record: '25-7', movement: 2 },
  { rank: 19, team: 'Nebraska', record: '26-6', movement: 0 },
  { rank: 20, team: 'Arizona State', record: '24-9', movement: 5 },
  { rank: 21, team: 'Oregon', record: '24-8', movement: -6 },
  { rank: 22, team: 'Arkansas', record: '21-13', movement: -5 },
  { rank: 23, team: 'Boston College', record: '22-11', movement: -1 },
  { rank: 24, team: 'LSU', record: '22-12', movement: 99 },
  { rank: 25, team: 'Ole Miss', record: '22-11', movement: 99 },
];

function MovementBadge({ movement }: { movement: number }) {
  if (movement === 99) return <Badge variant="warning" size="sm">NEW</Badge>;
  if (movement > 0) return <Badge variant="success" size="sm">+{movement}</Badge>;
  if (movement < 0) return <Badge variant="error" size="sm">{movement}</Badge>;
  return <Badge variant="secondary" size="sm">&mdash;</Badge>;
}

export default function Weekend8RecapPage() {
  return (
    <>
      <ArticleJsonLd
        headline="Weekend 8 Recap & Rankings Analysis | 2026 College Baseball"
        description="UCLA stays untouchable at 30-2. Alabama surges eight spots. UCF makes the biggest jump of the season. LSU scores ten in the twelfth to storm back into the Top 25."
        datePublished="2026-04-07"
        url="/college-baseball/editorial/weekend-8-recap"
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
              <span className="text-white font-medium">Weekend 8 Recap</span>
            </nav>
          </Container>
        </Section>

        {/* -- 1. HERO ------------------------------------------------- */}
        <Section padding="lg" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-bsi-primary/20 to-transparent pointer-events-none" />
          <Container>
            <ScrollReveal direction="up">
              <div className="max-w-3xl">
                <div className="flex items-center gap-3 mb-4">
                  <Badge variant="primary">Weekend 8 Recap</Badge>
                  <span className="text-white/40 text-sm">12 min read</span>
                </div>
                <h1 className="font-display text-3xl md:text-5xl font-bold uppercase tracking-wide mb-4">
                  The Midseason Picture{' '}
                  <span className="text-gradient-blaze">Is Sharpening.</span>
                </h1>
                <p className="text-white/70 text-lg leading-relaxed">
                  UCLA&apos;s 30&ndash;2 record isn&apos;t a projection anymore &mdash; it&apos;s a
                  statement. Alabama climbed eight spots in a single week. UCF made the biggest jump
                  of the season, and LSU scored ten runs in the twelfth inning at Tennessee to
                  crash back into the Top&nbsp;25. With eight weekends in the books, the pretenders
                  are gone. What&apos;s left is a conversation about who can sustain.
                </p>
                <div className="mt-4 text-white/40 text-sm">
                  April 7, 2026 &middot; Blaze Sports Intel
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* -- 2. STAT CARDS ------------------------------------------- */}
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

        {/* -- 3. LEDE ------------------------------------------------- */}
        <Section padding="lg" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <div className="max-w-3xl font-serif text-lg leading-[1.78] text-white/80 space-y-6">
                <p>
                  Eight weekends into the 2026 college baseball season, the separation is real. UCLA
                  beat USC 10&ndash;4 on Saturday to improve to 30&ndash;2 &mdash; the best start in
                  program history &mdash; and the Bruins have done it without a signature close game
                  since late February. They aren&apos;t surviving. They&apos;re suffocating. Texas
                  sits at 27&ndash;5, Georgia Tech at 26&ndash;5, and Georgia at 28&ndash;6 after
                  climbing to No.&nbsp;4 on the strength of Daniel Jackson&apos;s absurd season:
                  17 home runs, a .592 wOBA, and a .477 batting average through 153 plate
                  appearances. Those numbers don&apos;t normalize. They compound.
                </p>
                <p>
                  Below the top four, the rankings churned. Alabama jumped eight spots &mdash; the
                  kind of move that only happens when a team wins the games it shouldn&apos;t and
                  everyone above it loses the games it shouldn&apos;t. UCF leapt from 23rd to 12th
                  after beating West Virginia 5&ndash;1 in Morgantown, the biggest single-week jump
                  this season. Mississippi State dropped five spots. Oregon dropped six. Arkansas,
                  once a consensus top-15 team, fell to 22nd at 21&ndash;13 &mdash; a record that
                  doesn&apos;t match the preseason hype. And at the bottom of the poll, two
                  familiar names reappeared: LSU at 24th and Ole Miss at 25th, both carrying
                  22&ndash;11 records and the kind of talent that makes you wonder why they
                  weren&apos;t here sooner.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* -- 4. UCLA'S MACHINE --------------------------------------- */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-3 border-b border-bsi-primary/15">
                UCLA&apos;s Machine: 30 Wins, Zero Drama
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={100}>
              <div className="max-w-3xl font-serif text-lg leading-[1.78] text-white/80 space-y-6">
                <p>
                  The Bruins beat USC 10&ndash;4 on Saturday in what was supposed to be the Big&nbsp;12
                  showdown of the weekend. It wasn&apos;t close. UCLA scored four times in the
                  fifth, added two more in the sixth, and the Trojans &mdash; 27&ndash;7
                  themselves &mdash; never mounted a serious threat. The line score tells the story:
                  15 hits to 6, two errors by USC, and a UCLA pitching staff that allowed four runs
                  on a day when the offense would have covered eight.
                </p>
                <p>
                  What makes UCLA dangerous isn&apos;t any single player or any single game. It&apos;s
                  the absence of close calls. Their two losses came before conference play opened.
                  Since then, the margins haven&apos;t been interesting. A 30&ndash;2 record at this
                  point in the season doesn&apos;t guarantee anything in June &mdash; ask the 2024
                  Tennessee team about that &mdash; but it does mean the Bruins have yet to face
                  the kind of adversity that reveals whether a roster is built for Omaha or built
                  for the regular season. Right now, no one is forcing that question.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* -- 5. LSU'S 12TH-INNING EXPLOSION ------------------------- */}
        <Section padding="lg" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-3 border-b border-bsi-primary/15">
                LSU&apos;s Twelfth-Inning Explosion
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={100}>
              <div className="max-w-3xl font-serif text-lg leading-[1.78] text-white/80 space-y-6">
                <p>
                  Tennessee led 6&ndash;5 heading into the top of the twelfth. What followed was
                  the kind of inning that ends seasons for the team on the wrong side of it: LSU
                  sent 14 batters to the plate in the twelfth, collected 19 hits on the day, and
                  turned a one-run deficit into a 16&ndash;6 final. Ten runs. In extras. On the
                  road. The stat line reads like a data entry error, but Highlightly confirmed every
                  swing. Tennessee made four errors on the day. LSU made none.
                </p>
                <p>
                  The result pushes LSU back into the Top&nbsp;25 at No.&nbsp;24, carrying a
                  22&ndash;12 record that looks middling until you realize the Tigers&apos; losses
                  have come almost exclusively against ranked opponents. Tennessee, meanwhile, drops
                  below the radar at 21&ndash;12 &mdash; a team with the talent to be in the
                  conversation but the inconsistency to keep falling out of it. The Volunteers
                  allowed 19 hits and made four errors in a single game. That&apos;s not a bad
                  inning. That&apos;s a bad weekend compressed into one.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* -- 6. THE SABERMETRIC STANDOUT ----------------------------- */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-3 border-b border-bsi-primary/15">
                The Best Bat in College Baseball
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={100}>
              <div className="max-w-3xl font-serif text-lg leading-[1.78] text-white/80 space-y-6">
                <p>
                  Daniel Jackson of Georgia isn&apos;t having a hot streak. He&apos;s having a
                  historic season. Through 153 plate appearances &mdash; a sample size large enough
                  to mean something &mdash; Jackson is hitting .477 with 17 home runs, a .559 OBP,
                  and a .876 slugging percentage. His wOBA sits at .592, which puts him in a
                  different zip code from the rest of D1 baseball among hitters with meaningful
                  playing time. The next-closest qualified hitter &mdash; Zion Rose of Louisville
                  at .637 wOBA &mdash; has a third of Jackson&apos;s plate appearances.
                </p>
                <p>
                  The BSI Savant leaderboard tells the rest of the story. Jackson&apos;s .399
                  isolated power means nearly half his hits go for extra bases. His 258 wRC+ means
                  he&apos;s creating runs at 2.6 times the league average rate. And Georgia is
                  winning because of it: the Bulldogs are 28&ndash;6 and climbing, up one spot to
                  No.&nbsp;4 this week. When Jackson comes to the plate, the game changes. That
                  kind of production from a single bat doesn&apos;t happen every year in college
                  baseball. When it does, it usually ends with a first-round phone call.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* -- 7. RANKINGS TABLE --------------------------------------- */}
        <Section padding="lg" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-3 border-b border-bsi-primary/15">
                D1Baseball Top 25 &mdash; Week 8
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={100}>
              <div className="overflow-x-auto rounded-sm border border-white/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      <th className="font-display text-left px-4 py-3 text-white/60 uppercase tracking-wider text-xs">Rk</th>
                      <th className="font-display text-left px-4 py-3 text-white/60 uppercase tracking-wider text-xs">Team</th>
                      <th className="font-display text-center px-4 py-3 text-white/60 uppercase tracking-wider text-xs">Record</th>
                      <th className="font-display text-center px-4 py-3 text-white/60 uppercase tracking-wider text-xs">Chg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankings.map((t) => (
                      <tr key={t.rank} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="font-mono px-4 py-2.5 text-white/50">{t.rank}</td>
                        <td className="font-serif px-4 py-2.5 text-white font-medium">{t.team}</td>
                        <td className="font-mono px-4 py-2.5 text-center text-white/70">{t.record}</td>
                        <td className="px-4 py-2.5 text-center"><MovementBadge movement={t.movement} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* -- 8. CONFERENCE POWER INDEX ------------------------------- */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-3 border-b border-bsi-primary/15">
                Conference Power at the Midpoint
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={100}>
              <div className="max-w-3xl font-serif text-lg leading-[1.78] text-white/80 space-y-6">
                <p>
                  The SEC leads the Conference Power Index with a .690 average win percentage across
                  16 teams &mdash; ten of which sit in this week&apos;s Top&nbsp;25. That&apos;s not
                  a concentration of talent at the top. That&apos;s depth. Texas, Georgia, Mississippi
                  State, Texas A&amp;M, Alabama, Auburn, Oklahoma, Ole&nbsp;Miss, LSU, and Arkansas
                  are all ranked. Even the teams at the bottom of the SEC standings &mdash; South
                  Carolina at 15&ndash;19, Vanderbilt and Missouri at 20&ndash;14 &mdash; are
                  playing schedules that would test anyone.
                </p>
                <p>
                  The ACC sits second at .674, driven by Georgia Tech, Florida State, North Carolina,
                  and Virginia. The Big&nbsp;12 is third at .663, but that number is inflated by
                  UCLA&apos;s 30&ndash;2 record &mdash; without the Bruins, the conference average
                  drops noticeably. The Big&nbsp;Ten, despite Nebraska&apos;s strong 26&ndash;6
                  showing, ranks sixth at .547. The gap between the power conferences and the rest
                  is real, and it will matter when the NCAA Tournament selection committee starts
                  drawing brackets in six weeks.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* -- 9. THE PITCHING ARMS TO WATCH --------------------------- */}
        <Section padding="lg" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-3 border-b border-bsi-primary/15">
                Arms That Are Separating
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={100}>
              <div className="max-w-3xl font-serif text-lg leading-[1.78] text-white/80 space-y-6">
                <p>
                  The BSI Savant FIP leaderboard at the midseason mark reveals the arms that are
                  doing more than accumulating strikeouts &mdash; they&apos;re suppressing damage.
                  Danny Nelson of Clemson leads with a 0.71 FIP across 12.2 innings: 21 strikeouts
                  against a single walk, zero home runs allowed, and a K/BB ratio of 21.0. That
                  ratio isn&apos;t sustainable. The FIP is. Nelson throws strikes, limits free
                  passes, and keeps the ball on the ground. The ERA of 2.84 is deceptive &mdash;
                  his true run-prevention ability is elite.
                </p>
                <p>
                  Behind Nelson, Ruger Riojas of Texas has posted a 0.88 FIP in 11 innings with
                  19 strikeouts and just two walks. Max Miller of Mississippi State carries a 0.00
                  ERA through 12 innings &mdash; yes, zero earned runs &mdash; with 23 strikeouts
                  and a 0.95 FIP. And Tennessee&apos;s Cam Appenzeller, despite the team&apos;s
                  struggles, has thrown 24 innings of 1.50 ERA ball with a 1.45 FIP and a 13.5 K/BB
                  ratio. These are the arms that will determine postseason seeding. The offenses
                  get the headlines. The pitching wins the regionals.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* -- 10. BSI VERDICT ----------------------------------------- */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <div className="max-w-3xl mx-auto">
                <div className="bg-gradient-to-br from-bsi-primary/8 to-[var(--bsi-texas-soil)]/5 border border-bsi-primary/15 rounded-sm p-6 md:p-8">
                  <h2 className="font-display text-xl font-semibold uppercase tracking-wider text-burnt-orange mb-4">
                    BSI Verdict
                  </h2>
                  <div className="font-serif text-lg leading-[1.78] text-white/80 space-y-4">
                    <p>
                      The midseason picture has two tiers. UCLA is alone at the top &mdash; 30&ndash;2,
                      no close calls in conference play, no evidence of vulnerability. Below them,
                      five or six teams have the profiles to reach Omaha: Texas, Georgia Tech,
                      Georgia, Florida State, and Oregon State all combine elite pitching with
                      deep lineups. Alabama&apos;s eight-spot jump signals that the Crimson Tide
                      belong in that conversation too.
                    </p>
                    <p>
                      The question for the second half isn&apos;t who looks good now. It&apos;s who
                      can absorb the damage that conference play is about to inflict. The SEC has
                      ten ranked teams beating on each other every weekend. The Big&nbsp;12 has
                      UCLA running away while everyone else fights for seeding. And the ACC has
                      four ranked teams that could all host a regional. The next four weekends
                      will determine whether the teams at the top of this poll are there because
                      they&apos;re the best &mdash; or because they haven&apos;t played each
                      other yet.
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* -- ATTRIBUTION --------------------------------------------- */}
        <Section padding="md" borderTop>
          <Container>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <DataSourceBadge source="D1Baseball, ESPN, BSI Savant" className="text-xs" />
              <div className="flex gap-4 text-sm">
                <Link href="/college-baseball/editorial" className="text-white/50 hover:text-burnt-orange transition-colors">
                  All Editorials
                </Link>
                <Link href="/college-baseball/savant" className="text-white/50 hover:text-burnt-orange transition-colors">
                  BSI Savant
                </Link>
                <Link href="/college-baseball/standings" className="text-white/50 hover:text-burnt-orange transition-colors">
                  Standings
                </Link>
              </div>
            </div>
          </Container>
        </Section>
      </main>
    </>
  );
}
