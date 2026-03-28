import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { StatCard } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import type { Metadata } from 'next';

// ── Metadata ────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'WBC 2026 Pool C Preview: Japan and South Korea at Tokyo Dome | Blaze Sports Intel',
  description:
    'Pool C opens the 2026 World Baseball Classic at Tokyo Dome on March 5. Japan defends at home. South Korea is the only realistic threat to their dominance. Both have championship ceiling. Only two advance.',
  openGraph: {
    title: 'WBC 2026 Pool C Preview: Japan and South Korea at Tokyo Dome',
    description:
      'Japan (22%) and South Korea (8%) combine for 30% of BSI\'s simulated championships. They share Pool C in Tokyo. Only two teams advance. The math is simple. The games are not.',
    type: 'article',
    url: 'https://blazesportsintel.com/wbc/editorial/pool-c-preview',
    siteName: 'Blaze Sports Intel',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WBC 2026 Pool C Preview: Japan and South Korea at Tokyo Dome | BSI',
    description: 'Japan defends at home. South Korea has the ceiling to beat them. Both need to get out of Tokyo first.',
  },
  alternates: {
    canonical: '/wbc/editorial/pool-c-preview',
  },
};

// ── Stat data ───────────────────────────────────────────────────────

const STATS = [
  { label: 'Japan Title Probability', value: '22%', helperText: 'Highest in the field — BSI 200K simulation model' },
  { label: 'South Korea Title Prob.', value: '8%', helperText: 'Most dangerous second seed in the tournament draw' },
  { label: 'Ohtani Max Starts', value: '3', helperText: 'Pool opener, potential Round 2, Final — full program available' },
  { label: 'Pool Danger Rating', value: 'HIGH', helperText: 'Two top-6 teams, one bracket spot — structural collision unavoidable' },
];

// ── Component ───────────────────────────────────────────────────────

export default function PoolCPreviewPage() {
  return (
    <>
      <div>
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-[var(--border-vintage)]">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link href="/wbc" className="text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-primary)] transition-colors">
                WBC 2026
              </Link>
              <span className="text-[rgba(196,184,165,0.35)]">/</span>
              <Link href="/wbc/pool/c" className="text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-primary)] transition-colors">
                Pool C
              </Link>
              <span className="text-[rgba(196,184,165,0.35)]">/</span>
              <span className="text-[var(--bsi-bone)]">Preview</span>
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
                  <Badge variant="primary">Pool C Preview</Badge>
                  <span className="text-[rgba(196,184,165,0.35)] text-sm">March 4, 2026</span>
                  <span className="text-[rgba(196,184,165,0.35)]">|</span>
                  <span className="text-[rgba(196,184,165,0.35)] text-sm">~10 min read</span>
                </div>
                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold uppercase tracking-tight leading-[0.95] mb-4">
                  Tokyo Starts{' '}
                  <span className="bg-gradient-to-r from-burnt-orange to-ember bg-clip-text text-transparent">
                    Tomorrow.
                  </span>
                </h1>
                <p className="font-serif text-xl md:text-2xl italic text-[rgba(196,184,165,0.5)] leading-relaxed max-w-2xl">
                  Japan and South Korea share Pool C at Tokyo Dome. Together, they account for 30% of every
                  simulated championship in the BSI model. Only two teams advance.
                  The bracket is not confused about what that means.
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
                    Pool C is the tournament's opening statement, and the statement is not gentle.
                    While Houston waits until Saturday and Miami fans set their alarms for pool play
                    that doesn't start until Sunday, Tokyo Dome opens its gates on Thursday.
                    The defending champions take the field first. South Korea, the only team in the
                    bracket with a realistic argument that they can beat them, is in the same pool.
                  </p>
                  <p>
                    Pool D in Miami gets the &ldquo;Pool of Death&rdquo; classification because of its
                    title probability concentration &mdash; Dominican Republic, Venezuela, and Puerto Rico
                    combining for 37% of BSI&rsquo;s simulated championships. Pool C&rsquo;s math is
                    different but equally unforgiving. Japan and South Korea together represent 30%,
                    packed into a five-team pool where only two advance, and the other three (Australia,
                    Czech Republic, China) exist on the bracket as structural byes for whoever plays
                    them first. The real Pool C elimination game is Japan versus South Korea,
                    whenever the format delivers it.
                  </p>
                  <p>
                    The question isn&rsquo;t whether Japan comes out of this pool. The model says 94%
                    of the time, they do. The question is which version of Japan leaves Tokyo &mdash;
                    one that burned Ohtani and three bullpen arms getting through a five-team pool,
                    or one that managed its roster for Miami and arrives with everything intact.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Japan */}
        <Section padding="lg">
          <Container>
            <ScrollReveal>
              <div className="max-w-3xl mx-auto">
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-[var(--bsi-primary)] mb-8">
                  Japan: The Defending Standard
                </h2>
                <div className="font-serif text-lg leading-[1.78] text-[var(--bsi-dust)] space-y-6">
                  <p>
                    Japan&rsquo;s 2023 title run was a case study in roster management. Hideki Kuriyama
                    used Shohei Ohtani in exactly the right moments &mdash; deep into pool play to build
                    rhythm, then as the closer in the Final against USA when the game hung on one
                    at-bat. The decision to deploy him on the mound in the ninth inning against Mike
                    Trout, with the title on the line, became the defining image of that tournament.
                    Kuriyama is back. Ohtani is back. The question for 2026 is whether
                    three years of additional MLB experience around the rest of the roster translates
                    to a deeper, less star-dependent lineup than the one that won in Miami last time.
                  </p>
                  <p>
                    The pitching staff answers that question with a quiet yes. Japan carries six
                    MLB rotation-caliber starters into Tokyo. That&rsquo;s not depth &mdash; that&rsquo;s
                    redundancy, which is exactly what a short-format international tournament demands.
                    In a pool that includes Australia, Czech Republic, and China,
                    Japan should be able to deploy its second and third starters in pool play and
                    arrive in Miami with their full rotation intact.
                  </p>
                  <p>
                    The legitimate vulnerability is not talent. It&rsquo;s coaching philosophy.
                    Japan has historically been willing to burn top arms in pool play to run up
                    the score and establish run differential as a tiebreaker cushion. That approach
                    worked in 2023 with a favorable draw. In 2026, with South Korea in the same
                    pool, a close game against their direct rival could force Kuriyama&rsquo;s hand
                    earlier than he wants.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* South Korea */}
        <Section background="charcoal" padding="lg">
          <Container>
            <ScrollReveal>
              <div className="max-w-3xl mx-auto">
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-[var(--bsi-primary)] mb-8">
                  South Korea: Championship Ceiling, KBO Floor
                </h2>
                <div className="font-serif text-lg leading-[1.78] text-[var(--bsi-dust)] space-y-6">
                  <p>
                    South Korea&rsquo;s two WBC final appearances &mdash; 2006 and 2009 &mdash; came from
                    rosters that were flush with MLB-caliber talent: Chan Ho Park, Shin-Soo Choo,
                    Jung Ho Kang, Hyun-Jin Ryu. The current generation plays primarily in the KBO,
                    with a smaller MLB cohort than those peak eras produced. That gap in
                    day-to-day competition level against the world&rsquo;s best pitching is real and
                    measurable. The BSI model prices it as a 22-point difference in title probability
                    between Japan and South Korea despite both being categorically elite.
                  </p>
                  <p>
                    What the model can&rsquo;t fully capture is South Korea&rsquo;s institutional
                    organizing principle. The national program treats WBC as a cultural obligation,
                    not a calendar event. The coaching staff is meticulous, the preparation window
                    is extended beyond what most WBC nations commit, and the players arrive with a
                    specific plan for the opposing rotation. That organizational edge has produced
                    upsets that raw talent differentials wouldn&rsquo;t predict.
                  </p>
                  <p>
                    If South Korea goes 4-0 in their other four pool games &mdash; which is close to
                    certain against Australia, Czech Republic, and China &mdash; the Japan game
                    becomes the seed-determining matchup rather than an elimination game.
                    South Korea&rsquo;s path forward doesn&rsquo;t require beating Japan.
                    It requires qualifying through Tokyo with enough ammunition left to be
                    dangerous in Miami. They&rsquo;ve done it with less.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* The Rest */}
        <Section padding="lg">
          <Container>
            <ScrollReveal>
              <div className="max-w-3xl mx-auto">
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-[var(--bsi-primary)] mb-8">
                  Australia, Czech Republic, China: Who Gets the Bracket Gift
                </h2>
                <div className="font-serif text-lg leading-[1.78] text-[var(--bsi-dust)] space-y-6">
                  <p>
                    Australia enters at 1.5% title probability, which the BSI model describes as
                    &ldquo;upset capable&rdquo; in a single game context. Baseball Australia has genuinely
                    professionalized their development pipeline over the past decade &mdash; the program
                    that sent players to Nippon Professional Baseball and created a culture of
                    intentional preparation around international competition. One hot starter, one
                    day when their offensive approach clicks against a depleted rotation,
                    and Australia can beat South Korea in pool play. It happens roughly once
                    every two major international tournaments. The BSI model flags this as the
                    legitimate upset watch.
                  </p>
                  <p>
                    Czech Republic and China are in Tokyo to play, and to learn. Czech Republic
                    has pushed for baseball infrastructure investment that may eventually pay off
                    at this level; they&rsquo;re not a pushover in the way that bottom-tier WBC
                    entries from a decade ago were. China&rsquo;s program is growing but is
                    still in the early stages of developing the baseball culture that would
                    produce competitive international rosters. Neither team advances. Both games
                    against Japan and South Korea serve primarily as rest management decisions
                    for those two programs.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Ohtani section */}
        <Section background="charcoal" padding="lg">
          <Container>
            <ScrollReveal>
              <div className="max-w-3xl mx-auto">
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-[var(--bsi-primary)] mb-8">
                  The Ohtani Question Is Always a Coaching Question
                </h2>
                <div className="font-serif text-lg leading-[1.78] text-[var(--bsi-dust)] space-y-6">
                  <p>
                    Ohtani is available for up to three starts &mdash; pool play opener, a potential
                    quarterfinal, and the Final &mdash; if Japan advances straight through without burning
                    extra games. He cannot pitch on consecutive days after crossing 50 pitches, which
                    the WBC medical protocol enforces at the team level. Japan has respected that
                    constraint in previous tournaments and showed no signs of reconsidering.
                  </p>
                  <p>
                    The decision that matters most isn&rsquo;t whether Ohtani starts. It&rsquo;s whether
                    Kuriyama uses him in relief. In 2023, Kuriyama brought Ohtani in from the bullpen
                    in the Final&rsquo;s final inning, the way you&rsquo;d deploy a closer if your
                    closer happened to be the best player alive. The decision worked. It will be
                    available again in 2026 if Japan reaches Miami with Ohtani&rsquo;s arm fresh.
                  </p>
                  <p>
                    That calculus &mdash; save him, manage him through Tokyo, deploy him at maximum
                    leverage in Miami &mdash; is the single most important strategic variable in the
                    tournament. It&rsquo;s not a talent variable. It&rsquo;s a process variable.
                    Kuriyama has already proven he knows the right answer.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Verdict */}
        <Section padding="lg">
          <Container>
            <ScrollReveal>
              <div className="max-w-3xl mx-auto">
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-[var(--bsi-primary)] mb-8">
                  Pool C Verdict
                </h2>
                <div className="font-serif text-lg leading-[1.78] text-[var(--bsi-dust)] space-y-6">
                  <p>
                    Japan comes out as Pool C winner. That sentence is boring in a way that
                    understates the difficulty &mdash; in 6% of simulations, they don&rsquo;t.
                    Those are real outcomes, not noise. But the 94% case is Japan running away
                    from the field, managing Ohtani carefully, and arriving in Miami seeded
                    in the quarterfinals with everything intact.
                  </p>
                  <p>
                    South Korea advances as the second seed 76% of the time. Their path through
                    Tokyo is mostly straightforward &mdash; Australia, Czech Republic, and China do
                    not threaten it &mdash; and the Japan game matters primarily for seeding,
                    not survival. If South Korea beats Japan in pool play, they&rsquo;re the
                    most dangerous team in the quarterfinal bracket. If they lose, they
                    enter Miami as a second seed with something to prove. Either version
                    is a legitimate quarterfinal threat.
                  </p>
                  <p>
                    The game to watch in Pool C isn&rsquo;t Japan vs. South Korea.
                    It&rsquo;s Japan vs. whoever Kuriyama decides to start when he doesn&rsquo;t
                    want to use Ohtani. That&rsquo;s where you find out whether the rotation
                    depth is real or whether Japan&rsquo;s margin for error is thinner
                    than the model suggests.
                  </p>
                </div>

                {/* Data attribution */}
                <p className="text-[rgba(196,184,165,0.35)] text-xs pt-8 border-t border-[var(--border-vintage)]">
                  Title probabilities: BSI probability model (200,000 Monte Carlo simulations) &middot;
                  Pre-tournament baseline &middot; March 4, 2026
                </p>

                {/* Navigation */}
                <div className="mt-8 flex flex-wrap gap-4 items-center">
                  <Link
                    href="/wbc/pool/c"
                    className="inline-flex items-center gap-2 text-[var(--bsi-primary)] font-semibold hover:text-[var(--bsi-primary)] transition-colors"
                  >
                    ← Pool C Details
                  </Link>
                  <Link
                    href="/wbc"
                    className="inline-flex items-center gap-2 text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-bone)] transition-colors text-sm"
                  >
                    WBC Hub →
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        <Footer />
      </div>
    </>
  );
}
