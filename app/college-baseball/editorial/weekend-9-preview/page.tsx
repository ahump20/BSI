import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { StatCard } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { ArticleJsonLd } from '@/components/seo/ArticleJsonLd';

export const metadata: Metadata = {
  title: 'Weekend 9 Preview: SEC Storm & Regional Bubble | 2026 College Baseball | BSI',
  description:
    'Arkansas at Alabama. LSU at Ole Miss. Tennessee at Mississippi State. Florida at Georgia. Weekend 9 is when the SEC decides whose regional bubble pops and whose hosting dreams survive.',
  alternates: { canonical: '/college-baseball/editorial/weekend-9-preview' },
  openGraph: {
    title: 'Weekend 9 Preview: SEC Storm & Regional Bubble | BSI',
    description:
      'The weekend that separates regional hosts from road teams. Arkansas-Alabama, LSU-Ole Miss, Tennessee-Mississippi State, Florida-Georgia.',
    type: 'article',
    publishedTime: '2026-04-09',
    images: [{ url: '/images/og-college-baseball.png', width: 1200, height: 630 }],
  },
};

/* -- Data ----------------------------------------------------------- */

const statCards = [
  { label: 'Top 25 in Action', value: '18', helperText: 'Eighteen ranked teams play this weekend — seven of them in ranked-vs-ranked series' },
  { label: 'SEC Ranked Games', value: '4', helperText: 'Arkansas-Alabama, LSU-Ole Miss, Tennessee-Miss State, Florida-Georgia — all ranked-vs-ranked or ranked vs Top 40' },
  { label: 'UCLA Road Test', value: '+1', helperText: 'First true road series against Rutgers — the #1 Bruins have yet to lose a conference game on the road' },
  { label: 'Weeks to Regionals', value: '5', helperText: 'Regional selection May 11 — Weekend 9 begins the stretch that separates hosts from bid thieves' },
];

const marqueeMatchups = [
  {
    rank: 1,
    title: '#22 Arkansas @ #8 Alabama',
    preview:
      'The series that tells us whether Alabama\u2019s eight-spot jump is real. Arkansas arrives at 21\u201313 with a lineup that has underperformed preseason projections and a rotation that has been uneven against SEC bats. Alabama climbed eight places in a week by winning the games they should win \u2014 now they face a team that has the talent to take two. If the Tide sweep, they stamp themselves as a legitimate top-10 program. If they drop the series, the eight-spot jump looks premature.',
    stakes: 'Alabama hosting bid vs Arkansas bubble survival',
  },
  {
    rank: 2,
    title: 'Tennessee @ #9 Mississippi State',
    preview:
      'Mississippi State dropped five spots last week and cannot afford another. The Bulldogs sit at 26\u20137 with a Savant team FIP in the top five nationally but an offense that has gone quiet against SEC pitching. Tennessee comes in at 21\u201312, reeling from LSU\u2019s twelfth-inning explosion a week ago but still carrying a roster that scouts rated among the top ten in the country entering the season. This is the weekend Tennessee either finds it or falls out of the Top 25 for good.',
    stakes: 'Top 10 defense vs last-chance Tennessee',
  },
  {
    rank: 3,
    title: '#24 LSU @ #25 Ole Miss',
    preview:
      'The only ranked-vs-ranked matchup at the bottom of the poll, and the one that might matter most for regional hosting. Both teams re-entered the Top 25 by winning weekends they were supposed to lose. LSU is 22\u201312 with a lineup that has suddenly started hitting in high-leverage spots. Ole Miss is 22\u201311 with the best defensive unit in the SEC West. The loser of this series almost certainly drops out of the Top 25 by Monday morning. The winner starts climbing.',
    stakes: 'Both teams bubble regional bid',
  },
  {
    rank: 4,
    title: 'Florida @ #4 Georgia',
    preview:
      'Georgia is 28\u20136 and carrying Daniel Jackson\u2019s historic season \u2014 .477 batting average, 17 home runs, .592 wOBA through 153 plate appearances. The Bulldogs don\u2019t need this series to stay in the top five. Florida does need it to stay relevant. The Gators sit at 18\u201315 entering the weekend, a resume that doesn\u2019t match preseason expectations. If Florida loses this series, the path to the NCAA Tournament narrows to "win the SEC Tournament or go home." This is the last weekend their at-large case can be rebuilt.',
    stakes: 'Georgia top-5 status vs Florida at-large hopes',
  },
];

export default function Weekend9PreviewPage() {
  return (
    <>
      <ArticleJsonLd
        headline="Weekend 9 Preview: SEC Storm & Regional Bubble | 2026 College Baseball"
        description="Arkansas at Alabama. LSU at Ole Miss. Tennessee at Mississippi State. Florida at Georgia. Weekend 9 is when the SEC decides whose regional bubble pops and whose hosting dreams survive."
        datePublished="2026-04-09"
        url="/college-baseball/editorial/weekend-9-preview"
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
              <span className="text-white font-medium">Weekend 9 Preview</span>
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
                  <Badge variant="primary">Weekend 9 Preview</Badge>
                  <span className="text-white/40 text-sm">8 min read</span>
                </div>
                <h1 className="font-display text-3xl md:text-5xl font-bold uppercase tracking-wide mb-4">
                  The Weekend That{' '}
                  <span className="text-gradient-blaze">Decides Regional Hosts.</span>
                </h1>
                <p className="text-white/70 text-lg leading-relaxed">
                  Four ranked-vs-ranked series in the SEC. UCLA on the road for the first time.
                  Oklahoma visiting Vanderbilt. West Virginia at Texas Tech. Weekend 9 (April 10&ndash;12)
                  is when the separation between regional hosts and bubble teams becomes the story,
                  and when the arithmetic of the last four weeks of the regular season starts to
                  close in on everyone who hasn&apos;t already locked their bid.
                </p>
                <div className="mt-4 text-white/40 text-sm">
                  April 9, 2026 &middot; Blaze Sports Intel
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
                  Eight weekends ago the bracketology conversation was about ceiling. Now it is
                  about floor. UCLA has taken ceiling off the table by going 30&ndash;2 and winning
                  conference games by margins the rest of the country cannot match. Texas and
                  Georgia Tech are a tier behind. Georgia has Daniel Jackson carrying an entire
                  lineup. Below those four, the picture is about damage control: who can survive
                  a bad weekend, who cannot, who enters Weekend 9 with a hosting bid locked and
                  who is still playing to keep the bid they thought they had.
                </p>
                <p>
                  The regional selection committee will announce the national seeds May 11. Every
                  weekend from now until then is a referendum. Weekend 9 is the weekend the SEC
                  runs its gauntlet against itself. Four of the best matchups on the national
                  schedule are SEC series. Three of them are ranked versus ranked. The fourth,
                  Florida at Georgia, features a team fighting for its at-large life visiting the
                  hottest hitter in college baseball. The Big 12 has two conference series worth
                  watching, the ACC has Virginia visiting Notre Dame and North Carolina visiting
                  Clemson, and UCLA heads to Piscataway for its first conference road test against
                  an undefeated (at home) Rutgers program that has quietly built the kind of season
                  that demands real attention.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* -- 4. MARQUEE MATCHUPS ------------------------------------- */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-3 border-b border-bsi-primary/15">
                The Four Series That Matter
              </h2>
            </ScrollReveal>
            <div className="max-w-3xl space-y-8">
              {marqueeMatchups.map((m, i) => (
                <ScrollReveal key={m.rank} direction="up" delay={i * 80}>
                  <article className="border-l-2 border-bsi-primary/40 pl-6">
                    <div className="flex items-baseline gap-3 mb-3">
                      <span className="font-display text-3xl font-bold text-burnt-orange">
                        {m.rank}
                      </span>
                      <h3 className="font-display text-xl font-semibold uppercase tracking-wide text-white">
                        {m.title}
                      </h3>
                    </div>
                    <p className="font-serif text-base leading-[1.75] text-white/80 mb-3">
                      {m.preview}
                    </p>
                    <div className="text-xs uppercase tracking-widest text-white/50">
                      Stakes &middot; {m.stakes}
                    </div>
                  </article>
                </ScrollReveal>
              ))}
            </div>
          </Container>
        </Section>

        {/* -- 5. UCLA ROAD TEST --------------------------------------- */}
        <Section padding="lg" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-3 border-b border-bsi-primary/15">
                UCLA&apos;s First True Road Test
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={100}>
              <div className="max-w-3xl font-serif text-lg leading-[1.78] text-white/80 space-y-6">
                <p>
                  The Bruins travel to Rutgers for a three-game series this weekend. On paper, a
                  30&ndash;2 team visiting an unranked Big Ten program should not qualify as a test.
                  The line is going to open with UCLA heavily favored in every game. But the
                  concern for Bruin fans is not talent or matchups. It is geography. UCLA has
                  played its entire conference schedule at home or on the West Coast through
                  Weekend 8. They have not crossed a time zone for a series. They have not dealt
                  with east coast travel on a Thursday night into a Friday afternoon game. They
                  have not faced the kind of adversity a bad flight and a cold bullpen produce.
                </p>
                <p>
                  The margin for error is still enormous. Dropping a single game to Rutgers would
                  not move UCLA out of the top spot. Losing the series would, and nothing in the
                  Bruin profile suggests they are going to lose the series. But 2024 Tennessee was
                  the cautionary tale for every 30&ndash;2 team: a dominant regular season that
                  ended in a regional loss because the things that go wrong in June are different
                  from the things that go wrong in March. UCLA needs a weekend like this to
                  happen at some point. It might as well happen now, against a team with the
                  talent to push them but not the talent to beat them.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* -- 6. BIG 12 + ACC UNDERCARD ------------------------------- */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-3 border-b border-bsi-primary/15">
                The Undercard: Big 12 and ACC Positioning
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={100}>
              <div className="max-w-3xl font-serif text-lg leading-[1.78] text-white/80 space-y-6">
                <p>
                  The Big 12 weekend centers on two series. #17 West Virginia at Texas Tech is the
                  one to watch: West Virginia has been the Big 12&apos;s most underrated program
                  all season, winning nine of its last eleven and posting the sixth-best team FIP
                  in BSI&apos;s Savant leaderboard. Texas Tech has not been ranked but owns the
                  best road environment in the conference. Meanwhile #12 UCF travels to Kansas for
                  a series that will test whether last week&apos;s eleven-spot jump was a
                  statement or a mirage. Kansas sits in the bottom half of the Big 12 standings
                  but plays every game at home like it is a regional final.
                </p>
                <p>
                  In the ACC, #6 North Carolina visits Clemson in a Friday-Sunday series that
                  could determine ACC regular-season seeding. North Carolina has been the
                  conference&apos;s steadiest team, Clemson has the lineup to out-slug anyone
                  on a given weekend. #13 Virginia heads to Notre Dame for a series that is less
                  about rankings and more about Virginia&apos;s bid hosting case. The Cavaliers
                  need every conference series win from here to the end to maintain hosting
                  position. #23 Boston College hosts Virginia Tech in a series that will decide
                  who stays in the Top 25 and who drops out. The ACC has depth this year. Weekend
                  9 is when the depth starts to thin.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* -- 7. BSI VERDICT ----------------------------------------- */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <div className="max-w-3xl mx-auto">
                <div className="bg-gradient-to-br from-bsi-primary/8 to-texas-soil/5 border border-bsi-primary/15 rounded-sm p-6 md:p-8">
                  <h2 className="font-display text-xl font-semibold uppercase tracking-wider text-burnt-orange mb-4">
                    BSI Verdict
                  </h2>
                  <div className="font-serif text-lg leading-[1.78] text-white/80 space-y-4">
                    <p>
                      Weekend 9 is not a weekend for narrative. It is a weekend for arithmetic.
                      The teams with locked hosting bids can absorb a bad series. The teams on the
                      bubble cannot. Florida, Arkansas, Tennessee, and Ole Miss are all playing
                      with their at-large cases in the balance. Alabama is playing for a top-ten
                      stamp. LSU is playing to stay in the Top 25. Mississippi State is playing to
                      stop the slide.
                    </p>
                    <p>
                      Our prediction: the SEC takes three of four marquee series, Arkansas steals
                      two at Alabama, LSU and Ole Miss split and both stay in the Top 25 by the
                      thinnest possible margins, and UCLA wins 2 of 3 at Rutgers with a single
                      cold-weather scare that gets the Bruins&apos; attention without costing
                      them the poll. By Monday morning, the Top 10 will look almost identical.
                      The bottom ten will turn over. And the bid-stealing conversation will start
                      for real.
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
