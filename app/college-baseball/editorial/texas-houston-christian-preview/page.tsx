import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { StatCard } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { BSIVerdict } from '@/components/editorial/BSIVerdict';
import { Footer } from '@/components/layout-ds/Footer';
import { ArticleJsonLd } from '@/components/seo/ArticleJsonLd';
import type { Metadata } from 'next';

import { ogImage } from '@/lib/metadata';
// ── Metadata ────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: 'No. 3 Texas vs. Houston Christian: Tuesday Night at Disch-Falk | Blaze Sports Intel',
  description:
    'Texas (11-0) hosts Houston Christian in a Tuesday midweek game at UFCU Disch-Falk Field. Sam Cozart vs. Kenan Elarton. The Longhorns stay perfect heading into the final non-conference weekend.',
  openGraph: {
    title: 'No. 3 Texas vs. Houston Christian: Tuesday Night at Disch-Falk',
    description:
      'Texas (11-0) hosts Houston Christian in a Tuesday midweek game at UFCU Disch-Falk Field. Sam Cozart vs. Kenan Elarton. The Longhorns stay perfect heading into the final non-conference weekend.',
    type: 'article',
    url: 'https://blazesportsintel.com/college-baseball/editorial/texas-houston-christian-preview',
    siteName: 'Blaze Sports Intel',
  
    images: ogImage('/images/og/cbb-texas-houston-christian-preview.png')},
  twitter: {
    card: 'summary_large_image',
    title: 'No. 3 Texas vs. HCU: Tuesday at Disch-Falk | BSI',
    description: 'Texas (11-0) hosts Houston Christian. Sam Cozart vs. Kenan Elarton. The last midweek tune-up before the final non-conference weekend.',
  
    images: ['/images/og/cbb-texas-houston-christian-preview.png']},
  alternates: { canonical: '/college-baseball/editorial/texas-houston-christian-preview' },
};

// ── Stat data ───────────────────────────────────────────────────────
const STATS = [
  { label: 'Texas Record', value: '11\u20130', helperText: 'One of three unbeaten teams nationally (with New Mexico, USC)' },
  { label: 'All-Time Series', value: '10\u20130', helperText: 'Texas leads the all-time series and has never lost to HCU' },
  { label: 'Team ERA', value: '1.55', helperText: '16 earned runs allowed in 93 innings this season' },
  { label: 'HCU Momentum', value: '6 of 7', helperText: 'Huskies have won six of their last seven games' },
];

// ── Component ───────────────────────────────────────────────────────
export default function TexasHoustonChristianPreviewPage() {
  return (
    <>
      <ArticleJsonLd
        headline="No. 3 Texas vs. Houston Christian: Tuesday Night at Disch-Falk"
        description="Texas (11-0) hosts Houston Christian in a Tuesday midweek game at UFCU Disch-Falk Field. Sam Cozart vs. Kenan Elarton. The Longhorns stay perfect heading into the final non-conference weekend."
        datePublished="2026-03-03"
        url="/college-baseball/editorial/texas-houston-christian-preview"
        sport="College Baseball"
      />
      <div>
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-border">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link href="/college-baseball" className="text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-primary)] transition-colors">College Baseball</Link>
              <span className="text-[rgba(196,184,165,0.35)]">/</span>
              <Link href="/college-baseball/editorial" className="text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-primary)] transition-colors">Editorial</Link>
              <span className="text-[rgba(196,184,165,0.35)]">/</span>
              <span className="text-[var(--bsi-bone)]">Texas vs. Houston Christian Preview</span>
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
                  <Badge variant="primary">Game Preview</Badge>
                  <span className="text-[rgba(196,184,165,0.35)] text-sm">March 3, 2026</span>
                  <span className="text-[rgba(196,184,165,0.35)]">|</span>
                  <span className="text-[rgba(196,184,165,0.35)] text-sm">~6 min read</span>
                </div>
                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold uppercase tracking-tight leading-[0.95] mb-4">
                  The Midweek Before{' '}
                  <span className="bg-gradient-to-r from-burnt-orange to-ember bg-clip-text text-transparent">the Storm.</span>
                </h1>
                <p className="font-serif text-xl md:text-2xl italic text-[rgba(196,184,165,0.5)] leading-relaxed max-w-2xl">
                  Texas hosts Houston Christian on Tuesday night. The final tune-up before the last
                  non-conference weekend &mdash; and then SEC play arrives.
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
                <div className="font-serif text-lg leading-[1.78] text-[var(--bsi-dust)] space-y-6">
                  <p>
                    This is a mismatch on paper. No. 3 Texas is 11&ndash;0. Houston Christian is a Southland
                    Conference program that Texas leads 10&ndash;0 all-time. The Longhorns just swept the
                    BRUCE BOLT Classic with a +17 run differential. But midweek games have a purpose beyond
                    the scoreboard: they set rotation order, get secondary arms innings, and keep the lineup
                    sharp between weekend series.
                  </p>
                  <p>
                    Texas faces USC Upstate this weekend, then opens SEC play March 13 against Ole Miss at
                    Disch-Falk. Every pitch between now and then is preparation &mdash; not for the team
                    across the diamond tonight, but for the conference gauntlet that starts ten days out.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* The Matchup */}
        <Section padding="lg">
          <Container>
            <ScrollReveal>
              <div className="max-w-3xl mx-auto">
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-[var(--bsi-primary)] mb-8">The Matchup</h2>
                <div className="font-serif text-lg leading-[1.78] text-[var(--bsi-dust)] space-y-6">
                  <div className="bg-surface-elevated/50 border border-border rounded-sm p-6 mb-6">
                    <p className="font-display text-lg font-semibold uppercase tracking-wide text-[var(--bsi-bone)]">
                      No. 3 Texas vs. Houston Christian
                    </p>
                    <p className="text-sm text-[rgba(196,184,165,0.35)] mt-1">Tuesday, March 4 &mdash; 6:30 PM CT &mdash; UFCU Disch-Falk Field, Austin</p>
                    <p className="text-sm text-[rgba(196,184,165,0.35)]">SEC Network+</p>
                  </div>
                  <p>
                    Sam Cozart (2&ndash;0, 1.13 ERA) gets the start for Texas. The right-hander has been one of
                    the quieter stories in the rotation &mdash; consistent, efficient, not a headline-grabber.
                    Across from him, HCU sends Kenan Elarton (0&ndash;0, 0.00 ERA) &mdash; limited sample, but
                    clean. The Elarton name carries weight in Houston baseball circles; his father Drese pitched
                    six seasons in the majors, including three with the Astros.
                  </p>
                  <p>
                    This is the kind of game where Texas can work on things. Schlossnagle can give the bullpen&rsquo;s
                    middle arms a look, get bench players at-bats, and manage the workload with USC Upstate arriving
                    Friday. The starters are sharp. The top of the pen is locked in. Midweek games are where you
                    learn about the rest of it.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Houston Christian */}
        <Section background="charcoal" padding="lg">
          <Container>
            <ScrollReveal>
              <div className="max-w-3xl mx-auto">
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-[var(--bsi-primary)] mb-8">The Huskies Are Not Just Showing Up</h2>
                <div className="font-serif text-lg leading-[1.78] text-[var(--bsi-dust)] space-y-6">
                  <p>
                    Houston Christian is the defending Southland Conference champion and has won six of its last
                    seven games, including a walk-off comeback against Incarnate Word where the Huskies trailed
                    by seven runs. That is not a team that folds. HCU met Texas in the 2025 NCAA Austin Regional
                    opener and lost 7&ndash;1, but they competed &mdash; and earning a regional bid out of the
                    Southland is itself an accomplishment most mid-major programs never reach.
                  </p>
                  <p>
                    The Southland does not produce powerhouses. It produces programs that know how to fight with
                    less &mdash; smaller budgets, thinner rosters, fewer nationally recruited arms &mdash; and
                    HCU under coach Ryan Berry has been exactly that. The score might be lopsided. The experience
                    is not.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* What This Means for Texas */}
        <Section padding="lg">
          <Container>
            <ScrollReveal>
              <div className="max-w-3xl mx-auto">
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-[var(--bsi-primary)] mb-8">What This Game Means for Texas</h2>
                <div className="font-serif text-lg leading-[1.78] text-[var(--bsi-dust)] space-y-6">
                  <p>
                    The math is simple: if Texas wins, it goes to 12&ndash;0 heading into the USC Upstate series.
                    Then the final non-conference weekend. Then Ole Miss visits Disch-Falk on March 13 to open SEC
                    play. The undefeated record is a story, but the real story is whether the pitching depth holds.
                  </p>
                  <p>
                    The BRUCE BOLT Classic showed the starters are sharp and the top of the bullpen is locked in.
                    Texas is allowing 1.55 earned runs per game &mdash; 16 earned runs across 93 innings, a number
                    that belongs in a different era of college baseball. But the staff has not been tested by
                    SEC-caliber lineups yet. Every midweek outing between now and March 13 is a chance to get the
                    fourth, fifth, and sixth arms on the staff into live competition. That is what Tuesday night is for.
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
                <blockquote className="border-l-[3px] border-[var(--bsi-primary)] pl-6 py-4">
                  <p className="font-serif text-2xl italic text-[var(--bsi-dust)] leading-relaxed">
                    The score on Tuesday night does not matter. What the fourth and fifth arms in
                    the bullpen look like throwing it &mdash; that matters in March.
                  </p>
                </blockquote>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* BSI Verdict */}
        <BSIVerdict>
          <p>
            Texas should win this game comfortably. The only question is whether the Longhorns use the
            night to test things they will need in March, or whether they just pile on early and coast.
            Schlossnagle has managed the roster carefully all season &mdash; eleven games, eleven wins,
            no blowup innings from the staff, no wasted arms in garbage time. This is the kind of
            Tuesday night that keeps that going.
          </p>
          <p>
            For HCU, the game is simple: compete, make Texas earn it, and take whatever you can back to
            the Southland. A conference champion playing on the road against a top-three team in the country
            is not a loss on the r&eacute;sum&eacute; &mdash; it is a line that says you belonged on the
            field. The gap between the programs is real, but the gap between the competitors on a given
            Tuesday night is always smaller than the ranking suggests.
          </p>
        </BSIVerdict>

        {/* Attribution */}
        <Section padding="md" className="border-t border-border">
          <Container>
            <div className="max-w-3xl mx-auto">
              <DataSourceBadge source="texaslonghorns.com / hcuhuskies.com / D1Baseball" timestamp="March 3, 2026 — 2:00 PM CT" />
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                <Link href="/college-baseball/editorial" className="text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-primary)] transition-colors text-sm">
                  &larr; All Editorial
                </Link>
                <Link href="/college-baseball/editorial/texas-week-3-recap" className="text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-primary)] transition-colors text-sm">
                  Texas Week 3 Recap &rarr;
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
