import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { StatCard } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import type { Metadata } from 'next';

// ── Metadata ────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Weekend 3 Preview: Globe Life Gets the Real Test. | Blaze Sports Intel',
  description:
    'Weekend 3 preview: No. 1 UCLA and No. 4 Mississippi State headline the Amegy Bank College Baseball Series at Globe Life Field. Tennessee needs answers. Texas A&M faces its first Power 4 test. The full BSI breakdown.',
  openGraph: {
    title: 'Weekend 3 Preview: Globe Life Gets the Real Test.',
    description:
      'UCLA lost to San Diego State 4-3. LSU fell to McNeese 7-6. Now the top two teams head into Weekend 3 with questions. Eight undefeated Top 25 teams enter — not all survive.',
    type: 'article',
    url: 'https://blazesportsintel.com/college-baseball/editorial/weekend-3-preview',
    siteName: 'Blaze Sports Intel',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Weekend 3 Preview: Globe Life Gets the Real Test | BSI',
    description: 'UCLA, Mississippi State, Tennessee, Texas A&M headline the Amegy Bank series. The undefeated problem gets its first real exam.',
  },
  alternates: {
    canonical: '/college-baseball/editorial/weekend-3-preview',
  },
};

// ── Stat data ───────────────────────────────────────────────────────

const STATS = [
  { label: 'Undefeated Top 25', value: '8', helperText: 'Teams still without a loss entering Weekend 3' },
  { label: 'OU Scoring Margin', value: '99\u201313', helperText: 'Oklahoma outscoring opponents 14.1 runs per game' },
  { label: 'Whitney K Record', value: '17', helperText: 'Dax Whitney tied OSU record with 17 K vs. Baylor' },
  { label: 'UCLA vs. TCU', value: '30\u20138', helperText: 'Bruins outscored No. 7 TCU in Weekend 2 sweep' },
];

// ── Component ───────────────────────────────────────────────────────

export default function Weekend3PreviewPage() {
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
              <span className="text-text-primary">Weekend 3 Preview</span>
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
                  <Badge variant="primary">Weekend 3 Preview</Badge>
                  <span className="text-text-muted text-sm">February 25, 2026</span>
                  <span className="text-text-muted">|</span>
                  <span className="text-text-muted text-sm">~12 min read</span>
                </div>
                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold uppercase tracking-tight leading-[0.95] mb-4">
                  Globe Life Gets the{' '}
                  <span className="bg-gradient-to-r from-burnt-orange to-ember bg-clip-text text-transparent">
                    Real Test.
                  </span>
                </h1>
                <p className="font-serif text-xl md:text-2xl italic text-text-tertiary leading-relaxed max-w-2xl">
                  Eight undefeated Top 25 teams enter Weekend 3. The Amegy Bank series in Arlington
                  puts four of them on the same field. Not all of them leave with zeroes in the loss column.
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
                    Two weekends told us who was prepared. Weekend 3 tells us who can sustain it.
                    The distinction matters more than it sounds: Opening Weekend rewards roster depth and
                    offseason conditioning; Weekend 2 rewards adjustments and pitching management; Weekend 3
                    &mdash; the last full non-conference window before March series start shaping
                    r&eacute;sum&eacute;s &mdash; rewards the programs that have an identity, not just a record.
                  </p>
                  <p>
                    Eight Top 25 teams are still unbeaten. UCLA, LSU, Texas, Mississippi State, Georgia Tech,
                    Oklahoma, Florida, and Miami all carry unblemished marks into a weekend that will thin the herd.
                    The Amegy Bank College Baseball Series at Globe Life Field puts No. 1 UCLA, No. 4 Mississippi State,
                    No. 20 Tennessee, and No. 23 Texas A&amp;M under the same roof in Arlington &mdash; and the
                    bracket is not kind. Somebody&rsquo;s streak ends here.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Tuesday Context */}
        <Section padding="lg">
          <Container>
            <ScrollReveal>
              <div className="max-w-3xl mx-auto">
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-8">
                  Tuesday Night Changed the Conversation
                </h2>
                <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                  <p>
                    Before we look ahead, the midweek results reshaped the landscape. On Tuesday night, both
                    No. 1 UCLA and No. 2 LSU lost &mdash; the first stumbles for the season&rsquo;s top two teams.
                    The losses do not change the rankings math much, but they change the narrative entirely.
                  </p>
                  <p>
                    <strong className="text-text-primary font-semibold">San Diego State 4, No. 1 UCLA 3.</strong>{' '}
                    At Jackie Robinson Stadium &mdash; UCLA&rsquo;s own building. The Bruins managed three hits
                    total, just one after the fourth inning. A team that outscored No. 7 TCU 30&ndash;8 over
                    the weekend could not solve San Diego State&rsquo;s staff. Zane Kelly launched a two-run
                    homer in the fifth to put the Aztecs ahead for good. The lineup that was averaging 10 runs
                    per game went quiet against mid-major arms with nothing to lose and no scouting report
                    pressure.
                  </p>
                  <p>
                    <strong className="text-text-primary font-semibold">McNeese 7, No. 2 LSU 6.</strong>{' '}
                    At Alex Box Stadium &mdash; arguably the hardest place in college baseball to steal a win.
                    LSU used ten pitchers. The first six either walked a batter, hit a batter, or both. McNeese
                    built a 7&ndash;2 lead after four innings on just five hits because LSU kept putting runners
                    on for free. Grand Canyon transfer Zach Yorke hit a two-run homer in the first for LSU, but
                    it did not matter &mdash; you cannot walk your way out of a five-run deficit against a team
                    that feeds on chaos. Jay Johnson&rsquo;s first loss since June 1, and the pitching staff
                    depth that looked like a strength coming out of the Jax Classic is now a genuine question mark.
                  </p>
                  <p>
                    <strong className="text-text-primary font-semibold">Elsewhere:</strong> Auburn fell 8&ndash;0 to
                    Cincinnati, three days after going 3&ndash;0 at Globe Life with a comeback win over Florida
                    State. Texas beat Lamar 14&ndash;4. Florida swept Stetson 12&ndash;2. Mississippi State
                    handled Troy 13&ndash;7. The midweek slate sorted itself into two categories: the teams
                    that stayed locked in and the teams that let Tuesday become a trap game.
                  </p>
                  <p>
                    For UCLA, the loss makes Globe Life more interesting, not less. A team coming off its first
                    defeat of the season has two responses: tighten up or unravel. Tennessee is the wrong
                    opponent to face if your answer is the second one.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Globe Life Matchups */}
        <Section background="charcoal" padding="lg">
          <Container>
            <ScrollReveal>
              <div className="max-w-3xl mx-auto">
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-8">
                  Globe Life Field: The Matchups That Matter
                </h2>
                <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-10">

                  {/* UCLA vs Tennessee */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 mb-3">
                      <h3 className="font-display text-lg font-semibold uppercase tracking-wide text-text-primary">
                        No. 20 Tennessee vs. No. 1 UCLA
                      </h3>
                      <span className="text-sm font-mono text-text-muted">Saturday, Feb 28 &mdash; 4:00 PM CT</span>
                    </div>
                    <p className="italic text-text-tertiary mb-3">
                      Can Tennessee arrest a seven-spot slide, or does UCLA prove the TCU sweep was just the beginning?
                    </p>
                    <p>
                      Tennessee dropped from No. 13 to No. 20 after losing a series to Kent State and going
                      hitless with runners on Saturday. UCLA outscored No. 7 TCU 30&ndash;8 in a three-game
                      sweep at Jackie Robinson Stadium. Gasparino and Cholowsky are tied for the national lead
                      with six home runs each. The Bruins have not played a true road game yet &mdash; Globe
                      Life is the closest thing they will get before conference play. This is the weekend&rsquo;s
                      most revealing game. Tennessee needs a quality win to arrest the slide. UCLA needs to prove
                      it can dominate outside Westwood. Both teams get what they need from one game.
                    </p>
                  </div>

                  {/* Texas A&M vs Arizona State */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 mb-3">
                      <h3 className="font-display text-lg font-semibold uppercase tracking-wide text-text-primary">
                        No. 23 Texas A&amp;M vs. Arizona State
                      </h3>
                      <span className="text-sm font-mono text-text-muted">Saturday, Feb 28 &mdash; 7:00 PM CT</span>
                    </div>
                    <p className="italic text-text-tertiary mb-3">
                      What does A&amp;M&rsquo;s portal-loaded roster look like against real pitching?
                    </p>
                    <p>
                      The Aggies are 7&ndash;0 with Sorrell leading the lineup, but they have not faced a
                      ranked opponent. Arizona State brings the kind of athleticism that exposes thin middle
                      relief. This is the first data point on whether A&amp;M&rsquo;s depth holds under
                      pressure &mdash; and the last clean look before SEC play starts March 13.
                    </p>
                  </div>

                  {/* Mississippi State vs Virginia Tech */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 mb-3">
                      <h3 className="font-display text-lg font-semibold uppercase tracking-wide text-text-primary">
                        No. 4 Mississippi State vs. Virginia Tech
                      </h3>
                      <span className="text-sm font-mono text-text-muted">Friday, Feb 27 &mdash; Globe Life Field</span>
                    </div>
                    <p className="italic text-text-tertiary mb-3">
                      Is Mississippi State&rsquo;s 58&ndash;12 scoring margin a product of schedule or identity?
                    </p>
                    <p>
                      The Bulldogs have outscored opponents by 46 runs in five games, sweeping Delaware after
                      dispatching Troy and Alcorn State midweek. The offense is historic &mdash; but the schedule
                      has been forgiving. Virginia Tech is the first test with real arms on the mound. If
                      Mississippi State&rsquo;s bats translate, the No. 4 ranking is earned. If they stall,
                      the ranking was schedule-inflated. Either answer is useful information three weeks before
                      SEC play.
                    </p>
                  </div>

                  {/* Tennessee vs Virginia Tech */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 mb-3">
                      <h3 className="font-display text-lg font-semibold uppercase tracking-wide text-text-primary">
                        No. 20 Tennessee vs. Virginia Tech
                      </h3>
                      <span className="text-sm font-mono text-text-muted">Sunday, Mar 1 &mdash; 11:30 AM CT</span>
                    </div>
                    <p className="italic text-text-tertiary mb-3">
                      Does Tennessee&rsquo;s bullpen hold on short rest after facing UCLA the day before?
                    </p>
                    <p>
                      Back-to-back games against UCLA and Virginia Tech in a 20-hour window. Tony Vitello
                      will have to manage his pen carefully. This is the game that reveals whether
                      Tennessee&rsquo;s depth is real or whether the Weekend 2 slide was a structural warning.
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Other Matchups */}
        <Section padding="lg">
          <Container>
            <ScrollReveal>
              <div className="max-w-3xl mx-auto">
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-8">
                  Beyond Arlington
                </h2>
                <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-8">
                  <div>
                    <h3 className="font-display text-lg font-semibold uppercase tracking-wide text-text-primary mb-2">
                      No. 5 Georgia Tech vs. No. 1 UCLA
                    </h3>
                    <p className="text-sm font-mono text-text-muted mb-3">Sunday, Mar 1 &mdash; Neutral Site</p>
                    <p>
                      Potentially the game of the weekend. Georgia Tech set a program record with six straight
                      games of 10-plus runs to open the season. Vahn Lackey went 9-for-16 with three home runs
                      and 11 RBI last weekend. UCLA has Gasparino and Cholowsky combining for 12 home runs in
                      eight games. Two top-five offenses, one neutral field. Something has to give.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold uppercase tracking-wide text-text-primary mb-2">
                      Arizona vs. Vanderbilt
                    </h3>
                    <p className="text-sm font-mono text-text-muted mb-3">Saturday, Feb 28 &mdash; 7:00 PM CT</p>
                    <p>
                      Vanderbilt just went 5&ndash;0 with four run-rule victories. Arizona is rebuilding after
                      losing its entire weekend rotation to the portal. First real test of the
                      Commodores&rsquo; reloaded lineup against Power 4 pitching that can keep the ball in the
                      yard.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold uppercase tracking-wide text-text-primary mb-2">
                      Oregon vs. UC Irvine
                    </h3>
                    <p className="text-sm font-mono text-text-muted mb-3">Saturday, Feb 28 &mdash; 3:00 PM CT</p>
                    <p>
                      Oregon enters quietly after a solid 5&ndash;2 start. UC Irvine has been a mid-major
                      sleeper for a decade &mdash; the kind of program that makes Omaha runs when nobody is
                      looking. The Ducks need a quality non-conference win before conference play opens.
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* The Undefeated Problem */}
        <Section background="charcoal" padding="lg">
          <Container>
            <ScrollReveal>
              <div className="max-w-3xl mx-auto">
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-8">
                  The Undefeated Problem
                </h2>
                <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                  <p>
                    Eight unbeaten Top 25 teams sounds impressive until you look at who they have beaten.
                    Oklahoma is 7&ndash;0 with a 99&ndash;13 scoring margin &mdash; the longest streak of
                    double-digit run games in program history, surpassing marks shared by the 1988 and 1998
                    teams &mdash; but its opponents have a combined sub-.300 winning percentage. Miami is
                    9&ndash;0 and has outscored opponents 144&ndash;39, but the schedule has been cupcake-heavy.
                    Mississippi State&rsquo;s 58&ndash;12 run differential came against Troy, Alcorn State,
                    and Delaware.
                  </p>
                  <p>
                    None of this means those teams are frauds. It means we do not know yet. Weekend 3 is the
                    first weekend where the undefeated records face credible opposition. Mississippi State gets
                    Virginia Tech and potentially UCLA at Globe Life. Texas A&amp;M faces Arizona State.
                    Georgia Tech &mdash; which set a program record with six straight games of 10-plus runs
                    behind Lackey&rsquo;s 9-for-16, three-homer week &mdash; could meet UCLA on Sunday.
                  </p>
                  <p>
                    The best thing that can happen for the sport is that some of these zeroes disappear. Not
                    because losing is good &mdash; because losing against quality opposition is the only way
                    to separate the teams built for Omaha from the teams built for February.
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
                    Weekend 3 is not about who wins. It is about who looks like themselves winning
                    &mdash; and who looks like a different team losing.
                  </p>
                </blockquote>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Weekend 2 Context */}
        <Section padding="lg">
          <Container>
            <ScrollReveal>
              <div className="max-w-3xl mx-auto">
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-8">
                  What Weekend 2 Set Up
                </h2>
                <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                  <p>
                    <strong className="text-text-primary font-semibold">UCLA established a ceiling.</strong> The
                    Bruins outscored No. 7 TCU 30&ndash;8 in a sweep that was never competitive after
                    Friday&rsquo;s first pitch. Gasparino&rsquo;s second multi-homer outing in three games
                    and Cholowsky&rsquo;s towering solo shots gave the lineup a 1&ndash;2 punch that no
                    team has figured out yet. The question entering Weekend 3 is not whether UCLA can hit
                    &mdash; it is whether the pitching staff can replicate that dominance on a neutral field
                    with tighter turnarounds.
                  </p>
                  <p>
                    <strong className="text-text-primary font-semibold">Auburn announced itself.</strong> The Tigers
                    went 3&ndash;0 at Globe Life, beating Kansas State, No. 12 Florida State, and Louisville.
                    The Florida State game was the statement: Auburn trailed 4&ndash;0 heading into the fifth
                    and outscored the Seminoles 8&ndash;1 from there. Bristol Carter earned Most Outstanding
                    Player with six hits, seven runs scored, and three stolen bases. At 6&ndash;1, Auburn
                    looks like a team built to survive the SEC grind.
                  </p>
                  <p>
                    <strong className="text-text-primary font-semibold">Dax Whitney threw a masterpiece.</strong>{' '}
                    Oregon State&rsquo;s sophomore right-hander tied the program record with 17 strikeouts in
                    seven shutout innings against Baylor, touching 100.1 mph on the gun. He allowed two hits.
                    Whitney is the third Beaver to reach 17 strikeouts in a single game, joining Cooper Hjerpe
                    (2022) and Mason Smith (1994). The Beavers are 4&ndash;3 overall, but when Whitney is on
                    the mound, they are the most dangerous team in the country for nine innings.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* BSI Verdict */}
        <Section background="charcoal" padding="lg">
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
                      Weekend 3 is the weekend that separates record from identity. Eight undefeated Top 25
                      teams sounds like parity; it is actually a measurement problem. The first two weekends
                      told us who could beat weak schedules convincingly. This weekend &mdash; with Globe Life
                      stacking UCLA, Mississippi State, Tennessee, and Texas A&amp;M into a four-day bracket,
                      and Georgia Tech potentially meeting the Bruins on Sunday &mdash; tells us who can
                      beat teams that punch back.
                    </p>
                    <p>
                      The biggest question is not which team wins the Amegy Bank series. It is what
                      Tennessee looks like losing. A team that dropped seven spots in one week and then faces
                      No. 1 UCLA on Saturday either finds the version of itself that earned a preseason
                      ranking or confirms that the Weekend 2 slide was a correction, not a blip. Conference
                      play starts March 13. The teams that arrive in March with an identity &mdash; not just
                      a record &mdash; are the ones still playing in June.
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
                source="D1Baseball / Baseball America / NCAA.com / Globe Life Field"
                timestamp="February 25, 2026 — 10:00 AM CT"
              />
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                <Link
                  href="/college-baseball/editorial"
                  className="text-text-muted hover:text-burnt-orange transition-colors text-sm"
                >
                  &larr; All Editorial
                </Link>
                <Link
                  href="/college-baseball/editorial/weekend-2-recap"
                  className="text-text-muted hover:text-burnt-orange transition-colors text-sm"
                >
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
