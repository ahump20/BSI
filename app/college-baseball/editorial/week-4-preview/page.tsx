import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { StatCard } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import type { Metadata } from 'next';

// -- Metadata ----------------------------------------------------------------

export const metadata: Metadata = {
  title: 'Week 4 Preview: The Last Non-Conference Weekend. | Blaze Sports Intel',
  description:
    'Week 4 is the final non-conference weekend before SEC, Big 12, and ACC play opens. Virginia at North Carolina headlines. Texas hosts USC Upstate. The tune-up window closes Friday.',
  openGraph: {
    title: 'Week 4 Preview: The Last Non-Conference Weekend.',
    description:
      'Conference play starts March 13. This weekend is the final window to fix what three weeks exposed or bank one more quality win before the real schedule arrives.',
    type: 'article',
    url: 'https://blazesportsintel.com/college-baseball/editorial/week-4-preview',
    siteName: 'Blaze Sports Intel',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Week 4 Preview: The Last Non-Conference Weekend | BSI',
    description: 'Virginia at UNC headlines the final tune-up weekend. SEC play opens March 13. The preparation window closes Friday.',
  },
  alternates: {
    canonical: '/college-baseball/editorial/week-4-preview',
  },
};

// -- Stat data ---------------------------------------------------------------

const STATS = [
  { label: 'Texas Record', value: '16-0', helperText: 'Swept USC Upstate + road win at Texas State. No. 2 nationally.' },
  { label: 'Days to SEC', value: '3', helperText: 'Ole Miss at Disch-Falk opens conference play March 13' },
  { label: 'UNC Run Margin', value: '+43', helperText: '49-6 aggregate in Le Moyne sweep last weekend' },
  { label: 'SEC Tue Losses', value: '9', helperText: 'Nine SEC teams lost to mid-majors on Tuesday night' },
];

// -- Component ---------------------------------------------------------------

export default function Week4PreviewPage() {
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
              <span className="text-text-primary">Week 4 Preview</span>
            </nav>
          </Container>
        </Section>

        {/* Hero */}
        <Section padding="lg" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-burnt-orange/10 via-transparent to-ember/5 pointer-events-none" />
          <Container>
            <ScrollReveal direction="up">
              <div className="max-w-3xl">
                <div className="flex items-center gap-3 mb-6">
                  <Badge variant="primary">Week 4 Preview</Badge>
                  <span className="text-text-muted text-sm">March 3, 2026</span>
                  <span className="text-text-muted">|</span>
                  <span className="text-text-muted text-sm">~10 min read</span>
                </div>
                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold uppercase tracking-tight leading-[0.95] mb-4">
                  The Last{' '}
                  <span className="bg-gradient-to-r from-burnt-orange to-ember bg-clip-text text-transparent">
                    Tune-Up.
                  </span>
                </h1>
                <p className="font-serif text-xl md:text-2xl italic text-text-tertiary leading-relaxed max-w-2xl">
                  Conference play starts March 13. This weekend is the final window to fix what
                  three weeks exposed &mdash; or bank one more quality win before the real
                  schedule arrives.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Stat Cards */}
        <Section padding="sm">
          <Container>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {STATS.map((s) => (
                <StatCard key={s.label} label={s.label} value={s.value} helperText={s.helperText} />
              ))}
            </div>
          </Container>
        </Section>

        {/* Lede */}
        <Section background="charcoal" padding="lg">
          <Container>
            <ScrollReveal>
              <div className="max-w-3xl mx-auto">
                <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                  <p>
                    <strong className="text-text-primary font-semibold">[Updated March 10]</strong>{' '}
                    Four weeks of non-conference play are done. Texas swept USC Upstate 14&ndash;2,
                    11&ndash;9, 13&ndash;3 at Disch-Falk, climbed to No. 2 nationally, and beat
                    Texas State 15&ndash;4 on the road Tuesday night to improve to 16&ndash;0.
                    The last tune-up weekend did exactly what it was supposed to &mdash; confirmed
                    what was already evident and exposed what wasn&rsquo;t ready. Then Tuesday
                    night tore the curtain down: nine SEC teams lost to mid-major opponents, some
                    by margins that would embarrass a fall scrimmage.
                  </p>
                  <p>
                    The preparation window is closed. SEC, Big 12, and ACC conference play opens
                    March 13. The teams that used the non-conference schedule to lock in their
                    identity arrive with an edge. The teams that coasted through it &mdash;
                    Tennessee, Auburn, Vanderbilt, among others &mdash; arrive with questions
                    they no longer have time to answer quietly.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Texas: USC Upstate */}
        <Section padding="lg">
          <Container>
            <ScrollReveal>
              <div className="max-w-3xl mx-auto">
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-8">
                  Texas: Swept USC Upstate, Road Win at Texas State
                </h2>
                <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                  <p className="text-sm font-mono text-text-muted">
                    Weekend: Texas 14&ndash;2, 11&ndash;9, 13&ndash;3 vs USC Upstate (Disch-Falk)<br />
                    Tuesday: Texas 15, Texas State 4 (at Bobcat Ballpark, San Marcos)
                  </p>
                  <p>
                    Texas (16&ndash;0, No. 2) did exactly what was expected and then some. The
                    USC Upstate sweep was clinical &mdash; 38&ndash;14 aggregate, three different
                    starters, three wins. The rotation question from the preview got its answer:
                    Riojas on Friday, the combination look on Saturday, Volantis on Sunday. Then
                    Sam Cozart improved to 4&ndash;0 on Tuesday with a road win in San Marcos
                    where Casey Borba hit two home runs and the lineup scored 15 on 15 hits.
                  </p>
                  <p>
                    The depth is no longer a projection &mdash; it is the identity. Borba, Becerra,
                    Pack Jr., Livingston, and Duplantier all contributed RBI on Tuesday from spots
                    across the order. The run differential through 16 games is +133 (177&ndash;44).
                    Six run-rule wins. Zero road losses, though Tuesday was the first time they
                    played one. The foundation is as solid as a non-conference body of work can be.
                  </p>
                  <p className="text-text-tertiary">
                    Ole Miss arrives at Disch-Falk in three days. The Rebels have been inconsistent
                    all month. Texas has not been. That contrast is the story entering the weekend.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Virginia at North Carolina */}
        <Section background="charcoal" padding="lg">
          <Container>
            <ScrollReveal>
              <div className="max-w-3xl mx-auto">
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-8">
                  The Matchup That Matters: Virginia at North Carolina
                </h2>
                <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                  <p className="text-sm font-mono text-text-muted">
                    Friday&ndash;Sunday, March 6&ndash;8 at Boshamer Stadium, Chapel Hill
                  </p>
                  <p>
                    This is the best series of the weekend. Virginia opens ACC play at No. 8
                    North Carolina (11&ndash;1&ndash;1), a team that just run-ruled Le Moyne three
                    straight times &mdash; 49&ndash;6 aggregate, a +43 run margin that borders on
                    absurd even against an outmatched opponent. The Cavaliers have been quietly
                    excellent: AJ Gracia leads qualified ACC hitters with a 1.460 OPS after a
                    6-for-15 week with multiple home runs, the kind of stretch that turns a
                    mid-order bat into a lineup anchor.
                  </p>
                  <p>
                    North Carolina has the firepower and the home-field advantage at Boshamer.
                    Virginia has the kind of pitching depth that can quiet a hot lineup &mdash;
                    the Cavaliers have allowed fewer runs than any ACC team not named Clemson
                    through three weekends. This is a genuine ACC series, the first of the
                    conference season for both programs, and it sets the tone for how each team
                    enters March. The winner takes the early lead in a conference race that runs
                    through Chapel Hill, Clemson, and Raleigh.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Around the Country */}
        <Section padding="lg">
          <Container>
            <ScrollReveal>
              <div className="max-w-3xl mx-auto">
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-8">
                  Around the Country
                </h2>
                <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                  <p>
                    <strong className="text-text-primary font-semibold">No. 5 Georgia Tech (11&ndash;1)</strong>{' '}
                    continues at home with the most explosive lineup in the ACC. Ryan
                    Zuckerman&rsquo;s 3-HR day against Northwestern was not an outlier &mdash;
                    it was the peak of a team that has hit double-digit runs in seven of its
                    first twelve games.
                  </p>
                  <p>
                    <strong className="text-text-primary font-semibold">No. 14 Clemson (10&ndash;1)</strong>{' '}
                    carries momentum from the Palmetto Series win. Sharman&rsquo;s complete game
                    was the weekend&rsquo;s best pitching performance outside of Dygert&rsquo;s
                    gem at Arkansas &mdash; the kind of start that tells a coaching staff the
                    Friday role is settled. Nine straight wins since the only loss, with a
                    staff ERA under 2.50 across that stretch.
                  </p>
                  <p>
                    <strong className="text-text-primary font-semibold">No. 25 USC (9&ndash;0+)</strong>{' '}
                    looks to extend its unbeaten start after entering the Top 25 this week.
                    Mason Edwards has not allowed a hit in 18 consecutive innings, and the
                    1.45 team ERA behind him is not a one-man artifact. Another clean weekend
                    and USC climbs into territory that demands national attention.
                  </p>
                  <p>
                    <strong className="text-text-primary font-semibold">No. 9 Florida (11&ndash;1)</strong>{' '}
                    owns the longest active winning streak in the SEC at 11 games. The
                    Gators&rsquo; schedule gets real fast once conference play begins, and the
                    last three weeks have been about building bullpen depth rather than riding
                    two starters. That depth gets its first true exam in 10 days.
                  </p>
                  <p>
                    <strong className="text-text-primary font-semibold">No. 2 LSU (11&ndash;1)</strong>{' '}
                    reloads after a dominant early stretch. The Tigers&rsquo; one loss came
                    against McNeese on a Tuesday night where they used 10 pitchers and walked
                    their way into a five-run deficit &mdash; a process failure, not a talent
                    gap. Jay Johnson has not lost a weekend series since April.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Pull Quote */}
        <Section padding="md">
          <Container>
            <ScrollReveal>
              <div className="max-w-3xl mx-auto">
                <blockquote className="border-l-[3px] border-burnt-orange pl-6 py-4">
                  <p className="font-serif text-2xl italic text-text-secondary leading-relaxed">
                    The last non-conference weekend is the final exam before the real semester
                    begins. The teams that use it to prepare &mdash; not just to win &mdash; are
                    the ones still playing in June.
                  </p>
                </blockquote>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Tuesday Night Across the SEC */}
        <Section padding="lg">
          <Container>
            <ScrollReveal>
              <div className="max-w-3xl mx-auto">
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-8">
                  Tuesday Night Across the SEC
                </h2>
                <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                  <p>
                    <strong className="text-text-primary font-semibold">[March 10 results]</strong>{' '}
                    Nine SEC programs lost on Tuesday night. The carnage reshapes the context for
                    every opening-weekend series.
                  </p>
                  <p>
                    Tennessee fell 2&ndash;20 to Tennessee Tech. Auburn lost 2&ndash;17 to UAB.
                    Vanderbilt gave up 14 runs to Indiana State. These are not close losses to
                    quality mid-majors &mdash; these are blowouts against programs that don&rsquo;t
                    recruit at the same level. LSU lost to Creighton 4&ndash;8. Alabama fell to Troy
                    3&ndash;7. Mississippi State dropped one to Tulane 7&ndash;11. Kentucky lost to
                    Ball State 3&ndash;10. Missouri lost to Southern Indiana 6&ndash;14. Florida lost
                    to Florida State 3&ndash;6 in the only result that carries real rivalry weight.
                  </p>
                  <p className="text-text-tertiary">
                    The one SEC team that won Tuesday? Texas, 15&ndash;4 on the road. The gap
                    between the Longhorns and the rest of the conference &mdash; at least on this
                    particular night &mdash; was not subtle.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* SEC Openers Look-Ahead */}
        <Section background="charcoal" padding="lg">
          <Container>
            <ScrollReveal>
              <div className="max-w-3xl mx-auto">
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-8">
                  SEC Openers Look-Ahead: March 13&ndash;15
                </h2>
                <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                  <p>
                    Conference play arrives in three days. Tuesday night added fresh data to every
                    matchup &mdash; and most of it raised more questions than it answered.
                  </p>
                  <p>
                    <strong className="text-text-primary font-semibold">Ole Miss at Texas.</strong>{' '}
                    The Rebels have been in and out of the Top 25 all month. Texas is 16&ndash;0
                    with a +133 run differential. Disch-Falk under the lights on Thursday. This is
                    the series that tells us whether the Longhorns&rsquo; perfect record is real or
                    February-inflated &mdash; and whether Ole Miss has an identity to bring to Austin.
                  </p>
                  <p>
                    <strong className="text-text-primary font-semibold">LSU at Vanderbilt.</strong>{' '}
                    LSU lost to Creighton 4&ndash;8 on Tuesday. Vanderbilt gave up 14 runs to Indiana
                    State. Neither pitching staff showed up for the dress rehearsal. If the arms that
                    took the mound Tuesday night are the ones that show up Friday, this series could
                    be an offensive fireworks show for all the wrong reasons.
                  </p>
                  <p>
                    <strong className="text-text-primary font-semibold">Mississippi State at Arkansas.</strong>{' '}
                    Mississippi State lost to Tulane 7&ndash;11 on Tuesday. Arkansas has been
                    inconsistent since the UT Arlington upset. Baum-Walker in March is a different
                    animal, but both teams enter the weekend having lost their last midweek game.
                  </p>
                  <p>
                    <strong className="text-text-primary font-semibold">Tennessee at Georgia.</strong>{' '}
                    Tennessee 2, Tennessee Tech 20. That line will hang over the Volunteers all
                    weekend. Georgia has been quietly steady at 10&ndash;1, but Vitello&rsquo;s team
                    needs to prove that Tuesday was an aberration, not a preview of what SEC
                    lineups will do to this pitching staff.
                  </p>
                  <p>
                    <strong className="text-text-primary font-semibold">South Carolina at Florida.</strong>{' '}
                    Florida lost to Florida State 3&ndash;6 &mdash; at least that loss carries weight.
                    South Carolina needs to prove the Palmetto loss was a blip. Both teams enter
                    conference play with something to prove, which makes this the most volatile
                    series of the opening weekend.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* BSI Verdict */}
        <Section padding="lg">
          <Container>
            <ScrollReveal>
              <div className="max-w-3xl mx-auto relative">
                <div className="absolute -top-3 left-6">
                  <span className="bg-burnt-orange text-white text-xs font-display uppercase tracking-widest px-3 py-1 rounded">
                    BSI Verdict
                  </span>
                </div>
                <div className="bg-gradient-to-br from-burnt-orange/8 to-texas-soil/5 border border-burnt-orange/15 rounded-lg p-8 pt-10">
                  <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                    <p>
                      Week 4 is not about the weekend. It is about what comes after. The SEC
                      schedule that opens March 13 is the most loaded conference slate in college
                      baseball &mdash; Ole Miss at Texas, Mississippi State at Arkansas, LSU at
                      Vanderbilt, South Carolina at Florida, Tennessee at Georgia, all in the same
                      three-day window. Five series that would each headline a standalone weekend
                      on their own, stacked on top of each other.
                    </p>
                    <p>
                      The teams that use this final non-conference window to lock in their
                      identity &mdash; rotation order settled, bullpen roles defined, lineup
                      committed &mdash; arrive in March with an edge that cannot be manufactured
                      once the conference gauntlet begins. The teams that coast through it arrive
                      with questions they no longer have time to answer quietly.
                    </p>
                    <p>
                      Ten days. Then the real season begins. And the margins that separate the
                      teams built for Omaha from the teams built for May will be measured not in
                      talent but in preparation &mdash; the work that gets done this weekend,
                      when nobody outside the dugout is paying attention.
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Attribution */}
        <Section padding="md" className="border-t border-border">
          <Container>
            <div className="max-w-3xl mx-auto">
              <DataSourceBadge
                source="D1Baseball / ESPN / texaslonghorns.com / goheels.com"
                timestamp="March 3, 2026 &mdash; 11:00 AM CT"
              />
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                <Link
                  href="/college-baseball/editorial"
                  className="text-text-muted hover:text-burnt-orange transition-colors text-sm"
                >
                  &larr; All Editorial
                </Link>
                <Link
                  href="/college-baseball/editorial/weekend-3-recap"
                  className="text-text-muted hover:text-burnt-orange transition-colors text-sm"
                >
                  Weekend 3 Recap &rarr;
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
