import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { StatCard } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import type { Metadata } from 'next';

import { ogImage } from '@/lib/metadata';
// ── Metadata ────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Weekend 3 Recap: Three Weeks. One Undefeated. | Blaze Sports Intel',
  description:
    'Weekend 3 recap: Texas is the last undefeated Top 25 team at 11-0. UCLA goes 3-0 at Globe Life including a 10-inning thriller over No. 4 MSU. UT Arlington stuns Arkansas. Full BSI breakdown.',
  openGraph: {
    title: 'Weekend 3 Recap: Three Weeks. One Undefeated.',
    description: 'Eight undefeated Top 25 teams entered Weekend 3. Texas survived. UCLA beat three ranked opponents in three days. UT Arlington shocked Arkansas.',
    type: 'article',
    url: 'https://blazesportsintel.com/college-baseball/editorial/weekend-3-recap',
    siteName: 'Blaze Sports Intel',
  
    images: ogImage('/images/og/cbb-weekend-3-recap.png')},
  twitter: {
    card: 'summary_large_image',
    title: 'Weekend 3 Recap: Three Weeks. One Undefeated. | BSI',
    description: 'Texas is 11-0. UCLA won a 10-inning classic against MSU. The undefeated list just got very short.',
  
    images: ['/images/og/cbb-weekend-3-recap.png']},
  alternates: {
    canonical: '/college-baseball/editorial/weekend-3-recap',
  },
};

// ── Stat data ───────────────────────────────────────────────────────

const STATS = [
  { label: 'Texas Record', value: '11-0', helperText: 'Only undefeated Top 25 team remaining' },
  { label: 'UCLA Extras Win', value: '8-7', helperText: 'Cholowsky tied it in 9th, Espinoza walked it off in 10th vs. No. 4 Miss. State' },
  { label: 'UNC Aggregate', value: '49-6', helperText: 'Three straight run-rules to sweep Le Moyne' },
  { label: 'Gasparino HRs', value: '10', helperText: 'Tournament MOP at Globe Life — 5-for-11, 4 HR, 7 RBI' },
];

// ── Component ───────────────────────────────────────────────────────

export default function Weekend3RecapPage() {
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
              <span className="text-text-primary">Weekend 3 Recap</span>
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
                  <Badge variant="primary">Weekend 3 Recap</Badge>
                  <span className="text-text-muted text-sm">March 3, 2026</span>
                  <span className="text-text-muted">|</span>
                  <span className="text-text-muted text-sm">~14 min read</span>
                </div>
                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold uppercase tracking-tight leading-[0.95] mb-4">
                  Three Weeks.{' '}
                  <span className="bg-gradient-to-r from-burnt-orange to-ember bg-clip-text text-transparent">
                    One Undefeated.
                  </span>
                </h1>
                <p className="font-serif text-xl md:text-2xl italic text-text-tertiary leading-relaxed max-w-2xl">
                  Eight undefeated Top 25 teams entered Weekend 3. Texas is the only one that
                  survived with zeroes in the loss column.
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
                    Weekend 3 was supposed to answer one question: which undefeated records were real?
                    It answered a different one. The question was never about winning &mdash; it was
                    about identity. Eight unblemished Top 25 programs walked into Friday. One walked
                    out Sunday still carrying zeroes. Texas is 11&ndash;0 because it played three
                    opponents at Daikin Park in Houston and never trailed past the fifth. Everyone
                    else either lost or never had the weekend that tested the claim.
                  </p>
                  <p>
                    The most important result did not involve Texas at all. It happened in Arlington,
                    in the tenth inning, when UCLA&rsquo;s Sebastian Espinoza hit a two-run triple to
                    beat No. 4 Mississippi State 8&ndash;7 and cap a 3&ndash;0 run through the Amegy
                    Bank series. UCLA has both losses on its record &mdash; and it is still the best
                    team in the country. That paradox is the story of Weekend 3.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Globe Life Statement */}
        <Section padding="lg">
          <Container>
            <ScrollReveal>
              <div className="max-w-3xl mx-auto">
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-8">
                  The Globe Life Statement
                </h2>
                <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                  <p>
                    UCLA treated Globe Life Field like a home park. Beat Tennessee 12&ndash;5 Friday,
                    ran through Texas A&amp;M 11&ndash;1 Saturday, then produced the game of the young
                    season Sunday: No. 1 UCLA 8, No. 4 Mississippi State 7, ten innings.
                  </p>
                  <p>
                    Mississippi State carried an 11&ndash;0 record and a 7&ndash;4 lead into the ninth.
                    Then{' '}
                    <strong className="text-text-primary font-semibold">Roch Cholowsky</strong> &mdash;
                    the consensus No. 1 pick in the 2026 MLB Draft &mdash; hit a game-tying home run
                    with two outs to force extras. In the tenth,{' '}
                    <strong className="text-text-primary font-semibold">Sebastian Espinoza</strong>{' '}
                    cleared the right-center gap with a two-run triple that emptied the dugout. MSU
                    took its first loss. UCLA took the tournament.
                  </p>
                  <p>
                    <strong className="text-text-primary font-semibold">Will Gasparino</strong> was
                    named tournament Most Outstanding Player: 5-for-11, 4 home runs, 7 RBI across
                    three games. Ten home runs on the season, tied for the national lead. UCLA is
                    9&ndash;2 &mdash; both losses midweek. When it mattered &mdash; ranked opponents,
                    neutral field, tournament stakes &mdash; they went 3&ndash;0 and outscored the
                    bracket 31&ndash;13. That is not momentum. That is identity.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Texas Stays Perfect */}
        <Section background="charcoal" padding="lg">
          <Container>
            <ScrollReveal>
              <div className="max-w-3xl mx-auto">
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-8">
                  Texas Stays Perfect
                </h2>
                <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                  <p>
                    The Longhorns swept the BRUCE BOLT College Classic at Daikin Park in Houston:
                    8&ndash;1 over No. 9 Coastal Carolina on Friday, 5&ndash;2 over Baylor on Saturday,
                    10&ndash;3 over Ohio State on Sunday. Aggregate margin: +17. Not one game required
                    a late-inning rally.
                  </p>
                  <p>
                    Friday was the headliner.{' '}
                    <strong className="text-text-primary font-semibold">Aiden Robbins</strong> launched
                    a 466-foot home run &mdash; the longest blast in college baseball this season &mdash;
                    and <strong className="text-text-primary font-semibold">Jared Becerra</strong> hit
                    two of his own. Four total homers. Coastal had no answer. Saturday: the 5&ndash;2
                    win over Baylor was{' '}
                    <strong className="text-text-primary font-semibold">Jim Schlossnagle&rsquo;s</strong>{' '}
                    1,000th career D1 victory &mdash; seventh active coach to reach it, only the 70th
                    in NCAA history. Sunday was a 7-run third inning against Ohio State.
                  </p>
                  <p>
                    Texas is 11&ndash;0 with a 1.55 staff ERA &mdash; 16 earned runs in 93 innings.
                    Deep starters that go six-plus, a bullpen barely stressed, a lineup that generates
                    runs in clusters. That profile travels. Texas enters the March 13 conference
                    opener with the cleanest r&eacute;sum&eacute; in the sport.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* The Upset That Mattered */}
        <Section padding="lg">
          <Container>
            <ScrollReveal>
              <div className="max-w-3xl mx-auto">
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-8">
                  The Upset That Mattered
                </h2>
                <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                  <p>
                    UT Arlington walked into Baum-Walker Stadium on Friday and beat No. 6 Arkansas
                    4&ndash;3. An unranked WAC program, on the road in Fayetteville. The reason has
                    a name:{' '}
                    <strong className="text-text-primary font-semibold">Caylon Dygert</strong>. The
                    right-hander: 8&#8532; IP, 2 hits, 0 ER, 11 K, 130 pitches. Dave Van Horn:
                    &ldquo;He threw a lot of strikes. He didn&rsquo;t leave anything up in the zone,
                    really, to hit.&rdquo; That is a Hall of Fame coach telling you his lineup had
                    no plan for what it saw. Dygert attacked for nearly nine full innings.
                  </p>
                  <p>
                    Arkansas bounced back to win the series 2&ndash;1 &mdash; 9&ndash;0 Saturday,
                    11&ndash;1 run-rule Sunday &mdash; which is exactly what that depth should produce
                    after a gut-punch loss. But the Friday result tells you something about February
                    readiness versus March readiness. Arkansas is 9&ndash;3 and dropped from No. 6.
                    Dygert is a name to file.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Florida's Quiet Run */}
        <Section background="charcoal" padding="lg">
          <Container>
            <ScrollReveal>
              <div className="max-w-3xl mx-auto">
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-8">
                  Florida&rsquo;s Quiet Run
                </h2>
                <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                  <p>
                    Florida took the series at Miami &mdash; 7&ndash;2, 8&ndash;4, Sunday canceled
                    for weather &mdash; improving to 11&ndash;1 on an 11-game win streak, the longest
                    since opening 16&ndash;0 in 2020. The Gators reclaimed the all-time series lead
                    over Miami at 138&ndash;136&ndash;1 for the first time since 1969&ndash;70. Nine
                    straight series wins, longest active streak in the SEC.
                  </p>
                  <p>
                    Florida is doing what good teams do in February: winning without making it a story.
                    No walk-off theatrics. No extras. Just two road wins at a rival&rsquo;s park
                    against a team ranked 24th nationally. That kind of profile does not generate
                    headlines in late February. It generates Omaha bids in late May.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* The Rest of the Weekend */}
        <Section padding="lg">
          <Container>
            <ScrollReveal>
              <div className="max-w-3xl mx-auto">
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-8">
                  The Rest of the Weekend
                </h2>
                <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                  <p>
                    <strong className="text-text-primary font-semibold">Clemson</strong> won the
                    Palmetto Series 2&ndash;1 over South Carolina behind Michael Sharman&rsquo;s
                    complete-game four-hitter in Game 2 (4&ndash;1). Clemson is 10&ndash;1.{' '}
                    <strong className="text-text-primary font-semibold">North Carolina</strong>{' '}
                    run-ruled Le Moyne three straight &mdash; 16&ndash;3, 12&ndash;2, 21&ndash;1
                    &mdash; for a 49&ndash;6 aggregate. First time in program history with three
                    consecutive run-rule victories. UNC is 11&ndash;1&ndash;1.
                  </p>
                  <p>
                    <strong className="text-text-primary font-semibold">Georgia Tech</strong> swept
                    Northwestern 17&ndash;3, 13&ndash;3, 14&ndash;6. Ryan Zuckerman hit three home
                    runs in the finale. At 11&ndash;1, first-year coach James Ramsey owns the best
                    12-game start by a new GT head coach in program history.{' '}
                    <strong className="text-text-primary font-semibold">USC</strong> enters the
                    rankings at No. 25 at 9&ndash;0 with a 1.45 team ERA. Mason Edwards has not
                    allowed a hit in 18 consecutive innings.
                  </p>
                  <p>
                    <strong className="text-text-primary font-semibold">Coastal Carolina</strong>{' '}
                    dropped from No. 9 to No. 16 after losing to Texas on Friday.{' '}
                    <strong className="text-text-primary font-semibold">Ole Miss</strong> fell out of
                    the Top 25 entirely after going 2&ndash;2.{' '}
                    <strong className="text-text-primary font-semibold">UTSA</strong> enters the
                    rankings for the first time in program history.
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
                    Three weeks of college baseball sorted the sport into two categories: teams that
                    have an identity, and teams that only have a record. The gap becomes a canyon in March.
                  </p>
                </blockquote>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* D1Baseball Top 25 */}
        <Section padding="lg">
          <Container>
            <ScrollReveal>
              <div className="max-w-3xl mx-auto">
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-4">
                  D1Baseball Top 25 &mdash; After Week 3
                </h2>
                <p className="font-serif text-base text-text-tertiary mb-6">
                  UTSA enters for the first time. Ole Miss drops out. UCLA holds No. 1 &mdash; the weekend
                  r&eacute;sum&eacute; overrides the midweek losses.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr>
                        <th className="font-display text-[11px] tracking-[0.15em] uppercase text-burnt-orange bg-charcoal px-3 py-3 text-left border-b-2 border-burnt-orange w-10">Rk</th>
                        <th className="font-display text-[11px] tracking-[0.15em] uppercase text-burnt-orange bg-charcoal px-3 py-3 text-left border-b-2 border-burnt-orange">Team</th>
                        <th className="font-display text-[11px] tracking-[0.15em] uppercase text-burnt-orange bg-charcoal px-3 py-3 text-left border-b-2 border-burnt-orange">Record</th>
                        <th className="font-display text-[11px] tracking-[0.15em] uppercase text-burnt-orange bg-charcoal px-3 py-3 text-left border-b-2 border-burnt-orange hidden sm:table-cell">Weekend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { rk: 1, team: 'UCLA', record: '9-2', note: '3-0 at Globe Life; beat Tenn, A&M, MSU' },
                        { rk: 2, team: 'LSU', record: '11-1', note: 'Held steady' },
                        { rk: 3, team: 'Texas', record: '11-0', note: 'Swept BRUCE BOLT Classic; +17 margin' },
                        { rk: 4, team: 'Mississippi State', record: '11-1', note: 'First loss: 10-inn classic vs. UCLA' },
                        { rk: 5, team: 'Georgia Tech', record: '11-1', note: 'Swept NW; Zuckerman 3 HR finale' },
                        { rk: 6, team: 'Arkansas', record: '9-3', note: 'Lost G1 to UTA; won series 2-1' },
                        { rk: 7, team: 'Auburn', record: '9-2', note: 'Steady' },
                        { rk: 8, team: 'North Carolina', record: '11-1-1', note: '3 run-rules; 49-6 aggregate' },
                        { rk: 9, team: 'Florida', record: '11-1', note: 'Series at Miami; 11-game streak' },
                        { rk: 10, team: 'Southern Miss', record: '10-1', note: 'Held' },
                      ].map((r) => (
                        <tr key={r.rk} className="hover:bg-burnt-orange/5 transition-colors">
                          <td className="font-display font-bold text-text-primary text-center px-3 py-2.5 border-b border-border-subtle">{r.rk}</td>
                          <td className="font-serif font-semibold text-text-primary px-3 py-2.5 border-b border-border-subtle">{r.team}</td>
                          <td className="font-mono text-xs tracking-wide text-text-tertiary px-3 py-2.5 border-b border-border-subtle">{r.record}</td>
                          <td className="font-serif italic text-text-tertiary text-[13px] px-3 py-2.5 border-b border-border-subtle hidden sm:table-cell">{r.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="font-serif text-sm text-text-tertiary mt-4 leading-relaxed">
                  <strong className="text-text-primary font-semibold">11&ndash;25:</strong> Georgia, Oklahoma,
                  NC State, Clemson, Wake Forest, Coastal Carolina, TCU, Oregon State, Tennessee, Florida
                  State, Kentucky, Texas A&amp;M, West Virginia, Miami, USC.
                </p>
                <p className="font-mono text-[10px] tracking-wider uppercase text-text-muted mt-2">
                  New: UTSA &middot; USC &middot; Dropped: Ole Miss &middot; Biggest fall: Coastal (&minus;7)
                </p>
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
                      Weekend 3 separated record from identity. Texas is the last undefeated Top 25
                      team because it played three opponents in Houston and beat all of them without
                      being challenged past the fifth inning. The Longhorns are winning boring games,
                      which is a better predictor of April than any walk-off.
                    </p>
                    <p>
                      UCLA is the best team in the country because it played three ranked opponents in
                      three days and won all three, including a 10-inning classic against the nation&rsquo;s
                      No. 4 team. Gasparino&rsquo;s 10 home runs and Cholowsky&rsquo;s ninth-inning
                      game-tying blast are performances that only happen inside a lineup deep enough
                      to support them. Two losses on the record and the best r&eacute;sum&eacute; in
                      the sport. That is the difference between record and identity.
                    </p>
                    <p>
                      The teams that arrived in Week 3 with something to prove &mdash; Tennessee, Texas
                      A&amp;M, Ole Miss &mdash; left with more questions than answers. Conference play
                      starts March 13. The next ten days are the last window to fix what Weekend 3
                      exposed. For the programs still searching for an identity, that window is closing.
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
                source="D1Baseball / Baseball America / ESPN / texaslonghorns.com / uclabruins.com"
                timestamp="March 3, 2026 — 10:00 AM CT"
              />
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                <Link
                  href="/college-baseball/editorial"
                  className="text-text-muted hover:text-burnt-orange transition-colors text-sm"
                >
                  &larr; All Editorial
                </Link>
                <Link
                  href="/college-baseball/editorial/weekend-3-preview"
                  className="text-text-muted hover:text-burnt-orange transition-colors text-sm"
                >
                  Weekend 3 Preview &rarr;
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
