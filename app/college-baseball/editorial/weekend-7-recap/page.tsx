import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { StatCard } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { ArticleJsonLd } from '@/components/seo/ArticleJsonLd';

export const metadata: Metadata = {
  title: 'Weekend 7 Recap | 2026 College Baseball | BSI',
  description:
    'Iowa run-rules No. 1 UCLA 19-0. Oklahoma edges Texas in ten innings. Mercer sweeps Oregon State. Tennessee and Vanderbilt play 16 innings. The biggest upset weekend of the 2026 season.',
  alternates: { canonical: '/college-baseball/editorial/weekend-7-recap' },
  openGraph: {
    title: 'Weekend 7 Recap | BSI',
    description:
      'Iowa run-rules No. 1 UCLA 19-0. Oklahoma edges Texas in ten innings. Mercer sweeps Oregon State. The biggest upset weekend of 2026.',
    type: 'article',
    publishedTime: '2026-03-30',
    images: [{ url: '/images/og-college-baseball.png', width: 1200, height: 630 }],
  },
};

/* -- Data ----------------------------------------------------------- */

const statCards = [
  { label: 'Iowa over UCLA', value: '19-0', helperText: 'Run-rule in seven innings \u2014 No. 1 UCLA\u2019s first loss of 2026, dealt by unranked Iowa' },
  { label: 'Vanderbilt-Tennessee', value: '16', helperText: 'Innings played Friday night \u2014 Tennessee won 6\u20135, then both teams combined for 31 runs Saturday' },
  { label: 'Ole Miss Sweep', value: '2', helperText: 'Games Ole Miss needed to send Mississippi State tumbling \u2014 6\u20131 and 7\u20131' },
  { label: 'Missouri Runs', value: '28', helperText: 'Combined runs in two games against Texas A&M \u2014 14\u20136 Friday, 14\u20133 Saturday (mercy)' },
];

export default function Weekend7RecapPage() {
  return (
    <>
      <ArticleJsonLd
        headline="Weekend 7 Recap | 2026 College Baseball"
        description="Iowa run-rules No. 1 UCLA 19-0. Oklahoma edges Texas in ten innings. Mercer sweeps Oregon State. The biggest upset weekend of 2026."
        datePublished="2026-03-30"
        url="/college-baseball/editorial/weekend-7-recap"
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
              <span className="text-white font-medium">Weekend 7 Recap</span>
            </nav>
          </Container>
        </Section>

        {/* -- 1. HERO ------------------------------------------------- */}
        <Section padding="lg" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#BF5700]/20 to-transparent pointer-events-none" />
          <Container>
            <ScrollReveal direction="up">
              <div className="max-w-3xl">
                <div className="flex items-center gap-3 mb-4">
                  <Badge variant="primary">Weekend 7 Recap</Badge>
                  <span className="text-white/40 text-sm">11 min read</span>
                </div>
                <h1 className="font-display text-3xl md:text-5xl font-bold uppercase tracking-wide mb-4">
                  Nobody Is{' '}
                  <span className="text-gradient-blaze">Safe.</span>
                </h1>
                <p className="text-white/70 text-lg leading-relaxed">
                  Iowa run-ruled the No.&nbsp;1 team in the country 19&ndash;0. Oklahoma knocked off
                  No.&nbsp;2 Texas in ten innings. Mercer &mdash; a Southern Conference mid-major &mdash;
                  swept No.&nbsp;7 Oregon State. And Tennessee-Vanderbilt played 16 innings on Friday
                  night before combining for 31 runs on Saturday. Weekend 7 wasn&apos;t a correction.
                  It was a demolition of the idea that any team in college baseball is untouchable.
                </p>
                <div className="mt-4 text-white/40 text-sm">
                  March 30, 2026 &middot; Blaze Sports Intel
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
                  Seven weekends into the 2026 season, the hierarchy looked stable. UCLA was
                  30&ndash;0-caliber. Texas had one loss. Georgia Tech, Mississippi State, and
                  Oregon State were building r&eacute;sum&eacute;s that looked regional-host worthy.
                  Then Weekend 7 happened. Iowa scored 19 runs on the No.&nbsp;1 team in the country
                  before the seventh inning arrived. Oklahoma took Texas to ten innings in Norman
                  and won. Mercer &mdash; Mercer &mdash; went to Corvallis and swept the Beavers.
                  Ole Miss shut down Mississippi State twice. And the Tennessee-Vanderbilt series
                  produced the kind of box scores that make you check whether the data feed is
                  broken. It wasn&apos;t. The sport just reminded everyone that March baseball is
                  not June baseball.
                </p>
                <p>
                  The fallout was immediate. UCLA absorbed its first two losses of the season in the
                  same weekend &mdash; both to Iowa, including a seven-inning mercy rule. Oregon
                  State, ranked seventh, got swept by a team with no path to an at-large bid.
                  Mississippi State dropped five spots. NC State went into Atlanta and run-ruled
                  Georgia Tech 10&ndash;0 in Game 2. The teams that looked invincible a week ago
                  are not. The question now is whether they respond or whether this is who they
                  actually are.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* -- 4. THE IOWA GAME --------------------------------------- */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-[#BF5700] mb-6 pb-3 border-b border-[#BF5700]/15">
                Iowa 19, UCLA 0: The Score Is Not a Typo
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={100}>
              <div className="max-w-3xl font-serif text-lg leading-[1.78] text-white/80 space-y-6">
                <p>
                  The final was 19&ndash;0. Seven innings. Mercy rule. The No.&nbsp;1 team in the
                  country, playing at home in Iowa City, couldn&apos;t get out of the first weekend
                  of Big&nbsp;Ten play without getting run-ruled. Iowa collected 19 hits, committed
                  zero errors, and scored in bunches &mdash; the kind of performance that
                  doesn&apos;t happen against elite pitching unless the pitching isn&apos;t as
                  elite as the record suggested.
                </p>
                <p>
                  UCLA followed that with a 14&ndash;6 loss the next day. Two games. Two losses.
                  Both to the same Iowa team that entered the weekend unranked. The Bruins&apos;
                  perfect record is gone. More importantly, the aura is gone. UCLA came into
                  Weekend 7 looking like the clear national favorite. They leave it with questions
                  about pitching depth, bullpen management, and whether a 28&ndash;0 start built
                  on non-conference play was ever as stable as the record implied. The Bruins are
                  still the best team in the Big&nbsp;12 &mdash; probably the best in the country.
                  But &ldquo;probably&rdquo; is a word that didn&apos;t apply 72 hours ago.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* -- 5. THE SEC CHAOS --------------------------------------- */}
        <Section padding="lg" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-[#BF5700] mb-6 pb-3 border-b border-[#BF5700]/15">
                SEC Weekend: Chaos Had a Reservation
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={100}>
              <div className="max-w-3xl font-serif text-lg leading-[1.78] text-white/80 space-y-6">
                <p>
                  Oklahoma took No.&nbsp;2 Texas to ten innings in Norman and walked off with a
                  5&ndash;4 win. That&apos;s a statement result for the Sooners, who came in ranked
                  16th and needed exactly this kind of signature win to build a hosting
                  r&eacute;sum&eacute;. Texas responded by winning the other two games of the
                  series, but the loss matters &mdash; it&apos;s the Longhorns&apos; fifth of the
                  year, and three of those have come against SEC opponents in conference play.
                </p>
                <p>
                  Elsewhere in the SEC, the results were louder. Ole Miss went to Starkville and
                  hammered Mississippi State 6&ndash;1 and 7&ndash;1 &mdash; a sweep that sent the
                  Bulldogs from No.&nbsp;4 into a spiral they&apos;re still recovering from.
                  Missouri destroyed Texas A&amp;M twice &mdash; 14&ndash;6 and 14&ndash;3 in a
                  mercy-rule game &mdash; the kind of combined 28-run performance that rewrites how
                  you evaluate a team. Kentucky shut out LSU 7&ndash;0 on Friday and followed it
                  with a 17&ndash;10 win Saturday. And Tennessee and Vanderbilt played the most
                  absurd series in college baseball this season: a 16-inning game on Friday
                  (Tennessee 6, Vanderbilt 5) followed by a 16&ndash;15 slugfest on Saturday. The
                  two teams combined for 43 runs and 27 innings of baseball in 48 hours. Conference
                  play in the SEC isn&apos;t baseball. It&apos;s attrition.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* -- 6. MERCER SWEEPS OREGON STATE --------------------------- */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-[#BF5700] mb-6 pb-3 border-b border-[#BF5700]/15">
                The Upset No One Saw: Mercer Sweeps Oregon State
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={100}>
              <div className="max-w-3xl font-serif text-lg leading-[1.78] text-white/80 space-y-6">
                <p>
                  Oregon State entered the weekend ranked seventh. Mercer, a Southern Conference
                  program in Macon, Georgia, came to Corvallis as a tune-up. It wasn&apos;t.
                  Mercer won 19&ndash;2 on Friday &mdash; a scoreline that looks like it belongs in
                  a different sport &mdash; and followed it with a 3&ndash;1 victory on Saturday
                  to complete the sweep. The Bears outscored the Beavers 22&ndash;3 across two
                  games against a team that was hosting a regional two months ago.
                </p>
                <p>
                  Oregon State will recover. The talent is real, the coaching is sound, and the
                  Pac-12&mdash;now Big&nbsp;12&mdash;schedule will provide chances to rebuild the
                  r&eacute;sum&eacute;. But a mid-major sweep at home is the kind of result that
                  the NCAA Tournament selection committee remembers. When the Beavers&apos; profile
                  comes up in May, this weekend will be in the first paragraph of the discussion.
                  You can survive it. You can&apos;t erase it.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* -- 7. BSI VERDICT ----------------------------------------- */}
        <Section padding="lg" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <div className="max-w-3xl mx-auto">
                <div className="bg-gradient-to-br from-[#BF5700]/8 to-[#8B4513]/5 border border-[#BF5700]/15 rounded-sm p-6 md:p-8">
                  <h2 className="font-display text-xl font-semibold uppercase tracking-wider text-[#BF5700] mb-4">
                    BSI Verdict
                  </h2>
                  <div className="font-serif text-lg leading-[1.78] text-white/80 space-y-4">
                    <p>
                      Weekend 7 was the weekend that proved the 2026 season doesn&apos;t have a
                      clear front-runner &mdash; it has a collection of flawed, talented teams
                      that can lose to anyone on the wrong day. UCLA getting run-ruled by Iowa
                      doesn&apos;t mean the Bruins aren&apos;t the best team in the country. It
                      means the best team in the country can be dismantled by a Big&nbsp;Ten
                      opponent that played with nothing to lose and everything right. That&apos;s
                      what makes college baseball different from the professional game: the margin
                      between dominant and exposed is one bad bullpen day.
                    </p>
                    <p>
                      The teams that respond to Weekend 7 will define the second half. UCLA
                      needs to prove the Iowa series was an aberration, not a revelation. Mississippi
                      State needs to find the version of itself that was ranked fourth. Oregon State
                      needs a statement series to bury the Mercer result. And in the SEC, where
                      every weekend is a potential rankings earthquake, the only guarantee is
                      that next weekend will be just as violent. The pretenders haven&apos;t been
                      identified. They&apos;ve been told to prove they aren&apos;t.
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
              <DataSourceBadge source="Highlightly, ESPN, BSI Savant" className="text-xs" />
              <div className="flex gap-4 text-sm">
                <Link href="/college-baseball/editorial/weekend-8-recap" className="text-white/50 hover:text-[#BF5700] transition-colors">
                  Weekend 8 Recap &rarr;
                </Link>
                <Link href="/college-baseball/editorial" className="text-white/50 hover:text-[#BF5700] transition-colors">
                  All Editorials
                </Link>
                <Link href="/college-baseball/savant" className="text-white/50 hover:text-[#BF5700] transition-colors">
                  BSI Savant
                </Link>
              </div>
            </div>
          </Container>
        </Section>
      </main>
    </>
  );
}
