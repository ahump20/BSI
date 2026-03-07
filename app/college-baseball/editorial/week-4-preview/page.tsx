import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { StatCard } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import type { Metadata } from 'next';

import { ogImage } from '@/lib/metadata';
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
  
    images: ogImage('/images/og/cbb-week-4-preview.png')},
  twitter: {
    card: 'summary_large_image',
    title: 'Week 4 Preview: The Last Non-Conference Weekend | BSI',
    description: 'Virginia at UNC headlines the final tune-up weekend. SEC play opens March 13. The preparation window closes Friday.',
  
    images: ['/images/og/cbb-week-4-preview.png']},
  alternates: {
    canonical: '/college-baseball/editorial/week-4-preview',
  },
};

// -- Stat data ---------------------------------------------------------------

const STATS = [
  { label: 'Texas Streak', value: '12-0', helperText: 'Beat HCU 16-3 Tuesday — third straight midweek mercy rule' },
  { label: 'Days to SEC', value: '10', helperText: 'Conference play opens March 13 across the league' },
  { label: 'UNC Run Margin', value: '+43', helperText: '49-6 aggregate in Le Moyne sweep last weekend' },
  { label: 'USC Team ERA', value: '1.45', helperText: 'Mason Edwards hasn\u2019t allowed a hit in 18 straight innings' },
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
                    Three weeks of non-conference play have done their job. The rankings have
                    stabilized &mdash; UCLA at No. 1, LSU at No. 2, Texas the only undefeated
                    Top 25 team at No. 3. The pretenders have been exposed: Ole Miss dropped out
                    of the Top 25 entirely after entering it just two weeks ago. The contenders
                    have been tested: Mississippi State&rsquo;s first loss came in extra innings
                    against the nation&rsquo;s best team at Globe Life Field. Now comes Week 4,
                    the last full weekend of non-conference play before SEC, Big 12, and ACC
                    schedules take over.
                  </p>
                  <p>
                    The value of this weekend is not in the matchups &mdash; most are mismatches
                    by design. It&rsquo;s in the preparation. Rotation order gets finalized.
                    Bullpen roles get locked in. The players who have been platooning learn
                    whether they have a full-time job or a bench role. For the teams heading into
                    March with questions &mdash; Tennessee&rsquo;s slide, Texas A&amp;M&rsquo;s
                    untested roster, TCU&rsquo;s quiet resurgence &mdash; this is the last
                    weekend to answer them on their own terms.
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
                  Texas: USC Upstate at Disch-Falk
                </h2>
                <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                  <p className="text-sm font-mono text-text-muted">
                    Friday&ndash;Sunday, March 6&ndash;8 at UFCU Disch-Falk Field<br />
                    Fri 6:30 PM CT / Sat 2:00 PM CT / Sun 12:00 PM CT (all SEC Network+)
                  </p>
                  <p>
                    Texas (11&ndash;0, No. 3) hosts USC Upstate for the final non-conference
                    weekend series. The Spartans are a Big South program &mdash; this is not the
                    test. The test arrives March 13 when Ole Miss comes to Austin to open SEC
                    play.
                  </p>
                  <p>
                    What matters this weekend is whether Schlossnagle sets his weekend rotation.
                    Riojas has been the Friday ace &mdash; 3&ndash;0 with 11 strikeouts against
                    Coastal Carolina, the kind of converted reliever who can give you six deep
                    innings every Friday and lengthen an entire staff behind him. Volantis has the
                    Sunday role locked: zero earned runs through his starts, 8 strikeouts in the
                    championship game against Ohio State. The Saturday starter &mdash; likely a
                    combination start or a look at the next arm in line &mdash; is the remaining
                    question. That Saturday slot is the last hole in a rotation that otherwise
                    looks built for SEC weekends.
                  </p>
                  <p>
                    The lineup needs no resolution. Carson Tinney is hitting at a .943 OPS.
                    Mendoza has reached base in all 11 games (.381 OBP). Robbins is at .395 with
                    4 home runs. Burns has 2 saves; Crossland earned his first win last weekend.
                    This series is about maintenance, not discovery &mdash; final calibrations
                    before the real schedule arrives in 10 days.
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
                    Conference play arrives in 10 days. Here is what&rsquo;s coming &mdash; and
                    why the opening weekend might be the most loaded three-day slate of the
                    entire regular season.
                  </p>
                  <p>
                    <strong className="text-text-primary font-semibold">Ole Miss at Texas.</strong>{' '}
                    The Rebels fell out of the Top 25. Texas is undefeated. Disch-Falk in March,
                    under the lights. This is the game that tells us whether Texas&rsquo;s
                    11&ndash;0 record is real or February-inflated &mdash; and whether Ole
                    Miss&rsquo;s slide is a correction or a collapse.
                  </p>
                  <p>
                    <strong className="text-text-primary font-semibold">Mississippi State at Arkansas.</strong>{' '}
                    Two top-6 teams. MSU (11&ndash;1) just lost its first game in extras to UCLA.
                    Arkansas (9&ndash;3) is angry after the UT Arlington loss. Baum-Walker in
                    March is a different animal than anything either team has faced in February.
                  </p>
                  <p>
                    <strong className="text-text-primary font-semibold">LSU at Vanderbilt.</strong>{' '}
                    Alex Box swagger meets Hawkins Field precision. LSU&rsquo;s bullpen depth
                    gets its first real multi-game test against a Vanderbilt lineup that can
                    manufacture runs without swinging for the fences.
                  </p>
                  <p>
                    <strong className="text-text-primary font-semibold">South Carolina at Florida.</strong>{' '}
                    The Gamecocks (7&ndash;5) need to prove the Palmetto loss was a blip, not a
                    blueprint. Florida&rsquo;s 11-game streak is the story &mdash; but South
                    Carolina&rsquo;s backs are against the wall.
                  </p>
                  <p>
                    <strong className="text-text-primary font-semibold">Tennessee at Georgia.</strong>{' '}
                    Both programs have underperformed relative to preseason expectations. This
                    series might tell us more about who is not an Omaha team than who is.
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
