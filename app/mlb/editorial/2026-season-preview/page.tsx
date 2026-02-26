import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { StatCard } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '2026 MLB Season Preview: The Offseason That Reshuffled Everything | Blaze Sports Intel',
  description:
    'Division-by-division preview of the 2026 MLB season. Tucker\'s record $60M AAV. Robot umpires arrive. Nine new managers. The Mets\' total roster overhaul. What it all means for October.',
  openGraph: {
    title: '2026 MLB Season Preview: The Offseason That Reshuffled Everything',
    description:
      'Tucker\'s record AAV. Robot umpires. Nine new managers. Division-by-division analysis of every contender, every rebuild, and the mechanisms that will decide October.',
  },
};

// ── Stat boxes ───────────────────────────────────────────────────────

const STATS = [
  { label: 'Tucker AAV', value: '$60M', helperText: 'Highest in MLB history — 4 yr / $240M with the Dodgers' },
  { label: 'Dodgers PECOTA wins', value: '103.8', helperText: 'Best projected record in baseball — 98.1% division odds' },
  { label: 'New managers', value: '9', helperText: 'Largest managerial turnover in decades — six are first-timers' },
  { label: 'ABS challenges / game', value: '2', helperText: 'Robot umpires arrive — challenge within 2 seconds of the call' },
];

// ── Page ─────────────────────────────────────────────────────────────

export default function MLBSeasonPreview2026() {
  return (
    <>
      <main id="main-content">
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-border">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link href="/mlb" className="text-text-muted hover:text-burnt-orange transition-colors">
                MLB
              </Link>
              <span className="text-text-muted">/</span>
              <Link href="/mlb/editorial" className="text-text-muted hover:text-burnt-orange transition-colors">
                Editorial
              </Link>
              <span className="text-text-muted">/</span>
              <span className="text-text-primary">2026 Season Preview</span>
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
                  <Badge variant="primary">2026 Season Preview</Badge>
                  <span className="text-text-muted text-sm">February 25, 2026</span>
                  <span className="text-text-muted text-sm">22 min read</span>
                </div>
                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-wide mb-6">
                  The Offseason That{' '}
                  <span className="text-gradient-blaze">Reshuffled Everything</span>
                </h1>
                <p className="font-serif text-xl text-text-tertiary leading-relaxed italic">
                  Kyle Tucker broke the AAV record. The Mets gutted their roster and rebuilt it
                  around Juan Soto. The Cardinals tore it all down. Robot umpires finally arrived.
                  And the Dodgers &mdash; already the Dodgers &mdash; added the best available bat
                  in free agency to a lineup returning Shohei Ohtani as a two-way player. Six
                  divisions. Thirty teams. One October. Here&rsquo;s how it looks.
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

        {/* ── Lede ────────────────────────────────────────────────────── */}
        <Section padding="lg" background="charcoal">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                <p>
                  The 2025&ndash;26 offseason moved more money, more players, and more managers
                  than any winter in recent memory. Nine teams changed skippers &mdash; the
                  largest coaching turnover in decades, with six of the nine hires being
                  first-time MLB managers. Kyle Tucker signed a four-year, $240&nbsp;million deal
                  with the Dodgers at $60&nbsp;million AAV, the highest average annual value in
                  baseball history. The Mets, one year into Juan Soto&rsquo;s $765&nbsp;million
                  contract, overhauled nearly every position around him: out went Pete Alonso,
                  Brandon Nimmo, Edwin Diaz, and Jeff McNeil; in came Bo Bichette, Freddy
                  Peralta, Luis Robert&nbsp;Jr., Marcus Semien, and Devin Williams. The
                  Cardinals, under new president of baseball operations Chaim Bloom, shipped Nolan
                  Arenado, Sonny Gray, Willson Contreras, and Brendan Donovan for prospects and
                  salary relief &mdash; a fire sale from a franchise that hasn&rsquo;t
                  deliberately rebuilt in a generation.
                </p>
                <p>
                  And underneath the transactions, a structural change arrived that will alter
                  every game from March through October. MLB approved the Automated Ball-Strike
                  challenge system &mdash; robot umpires, in practice &mdash; giving each team
                  two challenges per game to appeal ball-and-strike calls to a tracking system.
                  Human umpires still make every initial call. But for the first time, those calls
                  carry an appeal mechanism backed by data rather than tradition. Minor-league
                  testing showed 72% of fans reporting a positive impact. The 2026 season
                  isn&rsquo;t just new rosters on old fields. It&rsquo;s a different game in
                  several fundamental ways.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── NL West ─────────────────────────────────────────────────── */}
        <Section padding="lg">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-2 border-b border-burnt-orange/15">
                NL West: The Dodgers Problem
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={50}>
              <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                <p>
                  PECOTA projects the Dodgers at 103.8 wins. That number deserves a beat of
                  silence. No other team in baseball is projected above 94. The gap between
                  Los&nbsp;Angeles and the second-best projected team in the National League is
                  wider than the gap between second and tenth. The Dodgers own 98.1% division
                  odds and somewhere between 23% and 28% World Series odds depending on the
                  model &mdash; and those numbers existed <em>before</em>{' '}
                  <strong className="text-text-primary font-semibold">Kyle Tucker</strong> signed for
                  $60&nbsp;million per year.
                </p>
                <p>
                  Tucker hit .266/.377/.464 with 22 home runs and 25 stolen bases for the Cubs in
                  2025 &mdash; a 143 OPS+ season that confirmed he was the best available free
                  agent bat. The Dodgers paid accordingly. The $60M AAV broke records, and Jeff
                  Passan reported that the deal &ldquo;might have been the final blow for labor
                  peace&rdquo; between MLB and the MLBPA heading into CBA negotiations. But the
                  Dodgers aren&rsquo;t thinking about labor peace. They&rsquo;re thinking
                  about{' '}
                  <strong className="text-text-primary font-semibold">Shohei Ohtani</strong> throwing
                  99&nbsp;mph in live batting practice this spring &mdash; striking out Mookie
                  Betts and Freddie Freeman in the process &mdash; and the fact that the version
                  of Ohtani they signed for $700&nbsp;million has never actually played a full
                  season in Los&nbsp;Angeles as a two-way player. This is the year they get the
                  full version: pitcher and DH, the player who was supposed to arrive in 2024 but
                  lost the pitching half to Tommy John. Dodgers pitching coach Mark Prior
                  confirmed it: &ldquo;This year, yeah, the full version.&rdquo;
                </p>
                <p>
                  The rest of the NL West is competing for second place, and that competition
                  produced the offseason&rsquo;s most interesting managerial hire. The Giants
                  named{' '}
                  <strong className="text-text-primary font-semibold">Tony Vitello</strong> &mdash; the
                  first college baseball coach ever hired directly to manage an MLB team. Vitello
                  built Tennessee into a national power, reaching the College World Series and
                  producing a pipeline of professional talent. Whether that translates to managing
                  a 162-game season with a roster built around{' '}
                  <strong className="text-text-primary font-semibold">Luis Arraez</strong> is the
                  experiment San&nbsp;Francisco is running. ZiPS projects the Giants at 84 wins,
                  which would make them a credible second-place team in a division the Dodgers
                  have locked down. The Padres (Craig Stammen managing, projecting around 80
                  wins), Diamondbacks (added Arenado from the Cardinals fire sale), and Rockies
                  (Warren Schaeffer made permanent after an interim stint) are all somewhere
                  between 63 and 82 projected wins. The NL West is a one-team division unless
                  something structural breaks in Dodger Stadium.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── AL East ─────────────────────────────────────────────────── */}
        <Section padding="lg" background="charcoal">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-2 border-b border-burnt-orange/15">
                AL East: Four Teams, One October
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={50}>
              <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                <p>
                  The AL East has four teams projected at or near 90 wins. ZiPS puts the Yankees,
                  Blue Jays, and Red Sox all at approximately 90, with the Orioles close behind at
                  83&ndash;85. That compression is almost unprecedented &mdash; and it means at
                  least one 85-plus-win team is staying home in October. The division isn&rsquo;t
                  just competitive. It&rsquo;s a filter. Surviving it is a credential.
                </p>
                <p>
                  The <strong className="text-text-primary font-semibold">Yankees</strong> lost Juan
                  Soto to the Mets after the 2024 season &mdash; the $765&nbsp;million man chose
                  Queens over the Bronx &mdash; and responded by re-signing{' '}
                  <strong className="text-text-primary font-semibold">Cody Bellinger</strong> to a
                  five-year, $162.5&nbsp;million deal. Bellinger hit .272/.334/.480 with 29 home
                  runs and 5.1 WAR in 2025, and he gives the lineup a left-handed complement
                  to{' '}
                  <strong className="text-text-primary font-semibold">Aaron Judge</strong> that the
                  Yankees needed. It&rsquo;s not Soto. Nothing is Soto. But Bellinger at $32.5M
                  AAV is a credible anchor in a lineup that still has Judge producing at a
                  generational level.
                </p>
                <p>
                  The <strong className="text-text-primary font-semibold">Blue Jays</strong> came off an
                  ALCS appearance powered by{' '}
                  <strong className="text-text-primary font-semibold">Vladimir Guerrero&nbsp;Jr.</strong>,
                  who hit .397 with 8 home runs and a 1.289 OPS across 18 playoff games to win
                  ALCS MVP. Toronto locked him up with a $500&nbsp;million, 14-year extension and
                  added{' '}
                  <strong className="text-text-primary font-semibold">Kazuma Okamoto</strong> from NPB
                  on a four-year, $60&nbsp;million deal. Okamoto hit .322 with 15 home runs in
                  Japan and will play first base alongside Guerrero at third. The Jays have the
                  most obvious window in the division &mdash; Guerrero is 27, the roster is built
                  around him, and last October proved he can carry a lineup when the variance
                  tightens.
                </p>
                <p>
                  The <strong className="text-text-primary font-semibold">Red Sox</strong> were the
                  offseason&rsquo;s most aggressive acquirers via trade. They picked up{' '}
                  <strong className="text-text-primary font-semibold">Sonny Gray</strong> and{' '}
                  <strong className="text-text-primary font-semibold">Willson Contreras</strong> from the
                  Cardinals fire sale, signed{' '}
                  <strong className="text-text-primary font-semibold">Ranger Suarez</strong> to a
                  five-year, $130&nbsp;million deal, and acquired Caleb Durbin from the Brewers
                  and Johan Oviedo from the Pirates. Boston built the kind of offseason that
                  either looks brilliant in retrospect or looks like a team that acquired
                  complementary pieces without a cornerstone. The rotation &mdash; Suarez, Gray,
                  and whoever else emerges &mdash; is legitimate. The question is whether the
                  lineup produces enough to support it.
                </p>
                <p>
                  The <strong className="text-text-primary font-semibold">Orioles</strong> signed{' '}
                  <strong className="text-text-primary font-semibold">Pete Alonso</strong> to a
                  five-year, $155&nbsp;million deal and added{' '}
                  <strong className="text-text-primary font-semibold">Chris Bassitt</strong> on a
                  one-year, $18.5&nbsp;million contract. Baltimore bounces back from a
                  disappointing 75&ndash;87 in 2025 with new manager{' '}
                  <strong className="text-text-primary font-semibold">Craig Albernaz</strong> and a
                  lineup anchored by Alonso&rsquo;s power &mdash; 38 home runs and 126 RBI last
                  season. FanGraphs gives them 55% playoff odds, which feels about right: they
                  have the talent to contend and the track record of a team that just went
                  backwards when it was supposed to take the next step.
                </p>
                <p>
                  The <strong className="text-text-primary font-semibold">Rays</strong> are rebuilding.
                  Tampa acquired pieces in the three-team Donovan deal but projects in the
                  low-to-mid 70s. The division has four real teams. Tampa isn&rsquo;t one of them
                  this year.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── NL East ─────────────────────────────────────────────────── */}
        <Section padding="lg">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-2 border-b border-burnt-orange/15">
                NL East: The Mets&rsquo; Gamble
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={50}>
              <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                <p>
                  What the Mets did this offseason doesn&rsquo;t have a clean precedent. One year
                  after signing Juan Soto for $765&nbsp;million, they replaced nearly every other
                  starter on the roster. The departures &mdash; Alonso, Nimmo, Diaz,
                  McNeil &mdash; were familiar names who defined the Mets&rsquo; identity during
                  their competitive window. The arrivals &mdash;{' '}
                  <strong className="text-text-primary font-semibold">Bo Bichette</strong> (three-year,
                  $126&nbsp;million, moving to third base),{' '}
                  <strong className="text-text-primary font-semibold">Freddy Peralta</strong> (traded
                  from Milwaukee for Jett Williams and Brandon Sproat),{' '}
                  <strong className="text-text-primary font-semibold">Luis Robert&nbsp;Jr.</strong>{' '}
                  (acquired from the White Sox),{' '}
                  <strong className="text-text-primary font-semibold">Marcus Semien</strong> (from the
                  Rangers for Nimmo),{' '}
                  <strong className="text-text-primary font-semibold">Devin Williams</strong>{' '}
                  (three-year, $51&nbsp;million to close), and{' '}
                  <strong className="text-text-primary font-semibold">Jorge Polanco</strong> &mdash; are
                  a mix of proven production and bet-on-upside gambles.
                </p>
                <p>
                  The biggest swing is Robert, who was an All-Star in 2023 (.264/.315/.542,
                  38&nbsp;HR) but hit .223 with a .661 OPS in an injury-shortened 2025. If Robert
                  is healthy and locked in, the Mets&rsquo; lineup &mdash; Soto, Bichette,
                  Robert, Semien, with Lindor at short &mdash; is as deep as any in the National
                  League. If Robert is the 2025 version, the Mets are paying premium money for a
                  lineup that has a significant hole. By any reasonable projection model, the Mets
                  are the highest-variance team in baseball. ZiPS projects them at 89 wins,
                  PECOTA around 90. But the error bars stretch from 82 to 97 depending on how the
                  gambles land.
                </p>
                <p>
                  The <strong className="text-text-primary font-semibold">Braves</strong> are
                  PECOTA&rsquo;s NL East pick at 92 wins. New manager{' '}
                  <strong className="text-text-primary font-semibold">Walt Weiss</strong> was promoted
                  from eight years as bench coach, the kind of continuity move a team makes when
                  the infrastructure is sound and the clubhouse culture is worth protecting.
                  Atlanta didn&rsquo;t have a splashy offseason. They didn&rsquo;t need one. The
                  rotation and lineup were already built.
                </p>
                <p>
                  The <strong className="text-text-primary font-semibold">Phillies</strong> re-signed{' '}
                  <strong className="text-text-primary font-semibold">Kyle Schwarber</strong> to a
                  five-year, $150&nbsp;million deal after he finished second in NL MVP
                  voting &mdash; 56 home runs and 132 RBI in 2025, with a .240/.365/.563 slash
                  line. Philadelphia&rsquo;s strategy is status quo: run it back with the same
                  core, trust the roster depth, and bet that continuity beats volatility. ZiPS has
                  them at 91 wins, which would win most divisions. The risk, as ESPN noted, is
                  &ldquo;running it back one too many times.&rdquo; This is the third consecutive
                  year the Phillies have entered the season as a contender without making a
                  significant structural change. At some point, the window stops being open and
                  starts being a narrative.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── AL Central ──────────────────────────────────────────────── */}
        <Section padding="lg" background="charcoal">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-2 border-b border-burnt-orange/15">
                AL Central: The Tigers&rsquo; Moment
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={50}>
              <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                <p>
                  Detroit signed{' '}
                  <strong className="text-text-primary font-semibold">Framber Valdez</strong> to a
                  three-year, $115&nbsp;million contract &mdash; $38.3&nbsp;million AAV, a record
                  for a left-handed pitcher &mdash; and then brought{' '}
                  <strong className="text-text-primary font-semibold">Justin Verlander</strong> back to
                  the organization that drafted him No.&nbsp;2 overall in 2004 on a one-year,
                  $13&nbsp;million deal. Verlander joins Valdez and{' '}
                  <strong className="text-text-primary font-semibold">Tarik Skubal</strong> in a rotation
                  that has three arms capable of pitching Game&nbsp;1 in October. The Tigers have
                  made the postseason in two straight years and PECOTA projects them at 83.9
                  wins &mdash; half a game behind the Royals for the division. What&rsquo;s
                  different about Detroit in 2026 is the lineup.{' '}
                  <strong className="text-text-primary font-semibold">Kevin McGonigle</strong>, the
                  minor-league MVP who hit .308/.410/.512 with more walks than strikeouts, is
                  trending toward the Opening Day roster at shortstop. If McGonigle is the real
                  thing, the Tigers have a lineup that matches the rotation for the first time in
                  this competitive window.
                </p>
                <p>
                  The <strong className="text-text-primary font-semibold">Royals</strong> are
                  PECOTA&rsquo;s projected division champ at 84.4 wins. Kansas&nbsp;City
                  doesn&rsquo;t have a blockbuster addition &mdash; their story is continuity and
                  a roster that overperformed projections in 2025 and now has those projections
                  catching up to the results. The{' '}
                  <strong className="text-text-primary font-semibold">Twins</strong> hired{' '}
                  <strong className="text-text-primary font-semibold">Derek Shelton</strong> as manager
                  and project around 79 wins &mdash; watchable but not threatening. Minnesota
                  traded ten players at the 2025 deadline; the rebuild is still in its early
                  stages.
                </p>
                <p>
                  The <strong className="text-text-primary font-semibold">Guardians</strong> are the most
                  interesting decline story in the division. Cleveland won the AL Central in 2025
                  and now projects at 75.8 wins after losing Josh Naylor in free agency and
                  watching the core age another year. PECOTA&rsquo;s projected drop &mdash; from
                  division champ to fourth place &mdash; is aggressive, but it reflects a roster
                  that relied on overperformance rather than top-end talent. The{' '}
                  <strong className="text-text-primary font-semibold">White Sox</strong> moved Luis
                  Robert&nbsp;Jr. and continue rebuilding; they project in the mid-60s. The AL
                  Central has two real contenders, one team treading water, and two teams building
                  for a different year.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── NL Central ──────────────────────────────────────────────── */}
        <Section padding="lg">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-2 border-b border-burnt-orange/15">
                NL Central: Three Stories in One Division
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={50}>
              <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                <p>
                  The <strong className="text-text-primary font-semibold">Cubs</strong> signed{' '}
                  <strong className="text-text-primary font-semibold">Alex Bregman</strong> to a
                  five-year, $175&nbsp;million deal &mdash; the largest in franchise history, with
                  a full no-trade clause. Bregman gives Chicago a third baseman who has played in
                  the postseason every year of his career and brings a competitive infrastructure
                  that the Cubs&rsquo; younger players haven&rsquo;t experienced. FanGraphs gives
                  the Cubs 64% playoff odds, and ZiPS projects them at 86 wins. The NL Central
                  has been a division without a dominant team for three years running. The Cubs are
                  betting that Bregman&rsquo;s presence &mdash; not just his production, but his
                  presence &mdash; tips the balance.
                </p>
                <p>
                  The <strong className="text-text-primary font-semibold">Pirates</strong> are the
                  division&rsquo;s most interesting long-term story.{' '}
                  <strong className="text-text-primary font-semibold">Konnor Griffin</strong>, the
                  No.&nbsp;1 overall prospect in baseball, is in major-league camp this spring.
                  Manager Don Kelly said he&rsquo;s unlikely to make the Opening Day roster
                  &mdash; the plan is Double-A to start &mdash; but FanGraphs&rsquo; projections
                  for Pittsburgh &ldquo;sent shockwaves&rdquo; when they factored in
                  Griffin&rsquo;s mid-season arrival and the development of the existing young
                  core. Pittsburgh projects at 80&ndash;82 wins, which doesn&rsquo;t sound like a
                  threat until you realize that a full year of Griffin plus maturation from the
                  pitching staff could push that number higher. The Pirates aren&rsquo;t
                  contending today. They might be contending in August.
                </p>
                <p>
                  The <strong className="text-text-primary font-semibold">Cardinals</strong> tore it all
                  down. Under Chaim Bloom&rsquo;s direction, St.&nbsp;Louis traded Arenado to the
                  Diamondbacks, sent Gray and Contreras to the Red Sox, and shipped Donovan to the
                  Mariners in a three-team deal. The franchise ate approximately $59&nbsp;million
                  in salary across these trades to accelerate the rebuild. What they got in return,
                  beyond prospects, was a path to playing time for{' '}
                  <strong className="text-text-primary font-semibold">JJ Wetherholt</strong>, the former
                  first-round pick who had been blocked at every position by veteran contracts.
                  Wetherholt is the reason the teardown makes sense &mdash; if he&rsquo;s a
                  cornerstone, clearing the roster to let him play every day is a net positive
                  even if the 2026 record lands in the mid-70s.
                </p>
                <p>
                  The <strong className="text-text-primary font-semibold">Brewers</strong> lost Peralta
                  in the trade to the Mets but received Jett Williams (No.&nbsp;30 overall
                  prospect) and Brandon Sproat. Milwaukee projects at 83 wins with 42% playoff
                  odds &mdash; the kind of team that won&rsquo;t lead the division but could grab
                  a wild card if the pitching development pipeline keeps producing. The{' '}
                  <strong className="text-text-primary font-semibold">Reds</strong> are treading water at
                  roughly 74 projected wins.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── AL West ─────────────────────────────────────────────────── */}
        <Section padding="lg" background="charcoal">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-2 border-b border-burnt-orange/15">
                AL West: Seattle&rsquo;s Lineup
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={50}>
              <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                <p>
                  PECOTA projects the{' '}
                  <strong className="text-text-primary font-semibold">Mariners</strong> at 93.6
                  wins &mdash; the best record in the American League. Seattle re-signed{' '}
                  <strong className="text-text-primary font-semibold">Josh Naylor</strong> to a
                  five-year, $92.5&nbsp;million deal and acquired{' '}
                  <strong className="text-text-primary font-semibold">Brendan Donovan</strong> from the
                  Cardinals in a three-team trade. Those additions join{' '}
                  <strong className="text-text-primary font-semibold">Julio Rodriguez</strong>,{' '}
                  <strong className="text-text-primary font-semibold">Cal Raleigh</strong>, and{' '}
                  <strong className="text-text-primary font-semibold">Randy Arozarena</strong> &mdash;
                  five players who made All-Star teams in the past two seasons, all in the same
                  lineup. The Mariners have historically been a team that pitched its way to
                  October relevance and then lost because the bats couldn&rsquo;t sustain contact
                  against postseason arms. Naylor and Donovan are the front office&rsquo;s answer
                  to that problem: high-OBP bats who extend at-bats and put pressure on pitching
                  staffs that rely on swing-and-miss.
                </p>
                <p>
                  The <strong className="text-text-primary font-semibold">Astros</strong> lost Valdez but
                  signed{' '}
                  <strong className="text-text-primary font-semibold">Tatsuya Imai</strong> from NPB on a
                  three-year, $54&nbsp;million deal. Imai is 27, a three-time NPB All-Star with a
                  1.92 ERA in 2025, and brings the kind of pitching pedigree that Houston has
                  historically maximized.{' '}
                  <strong className="text-text-primary font-semibold">Yordan Alvarez</strong> and{' '}
                  <strong className="text-text-primary font-semibold">Jose Altuve</strong> are still the
                  lineup. Writing off the Astros is a mistake people make every offseason and
                  regret every October. Houston projects at 84&ndash;86 wins, which in a weaker
                  AL West might be enough for a wild card.
                </p>
                <p>
                  The <strong className="text-text-primary font-semibold">Rangers</strong> lost Semien in
                  the Mets trade and hired{' '}
                  <strong className="text-text-primary font-semibold">Skip Schumaker</strong> as manager.
                  Texas is in a transitional year, projecting in the high 70s. The{' '}
                  <strong className="text-text-primary font-semibold">Athletics</strong> are still
                  building in Las Vegas, and the{' '}
                  <strong className="text-text-primary font-semibold">Angels</strong> hired former
                  catcher{' '}
                  <strong className="text-text-primary font-semibold">Kurt Suzuki</strong> as manager
                  with{' '}
                  <strong className="text-text-primary font-semibold">Mike Trout&rsquo;s</strong>{' '}
                  durability remaining the franchise&rsquo;s most important unanswered question.
                  The AL West is Seattle&rsquo;s to lose unless Houston&rsquo;s history of
                  postseason overperformance extends into the regular season.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── ABS ─────────────────────────────────────────────────────── */}
        <Section padding="lg">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-2 border-b border-burnt-orange/15">
                The Machine Sees the Zone
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={50}>
              <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                <p>
                  The ABS challenge system works like this: human umpires call every pitch. Each
                  team gets two challenges per game. The batter, pitcher, or catcher &mdash; not
                  the manager &mdash; must challenge within two seconds of the call by tapping
                  their cap or helmet. If the challenge succeeds, the team keeps it. Extra innings
                  grant one additional challenge per frame. The strike zone is individualized per
                  batter &mdash; top at 53.5% of height, bottom at 27%, across the standard
                  17-inch plate width &mdash; rendered as a 2D rectangle at the midpoint of home
                  plate.
                </p>
                <p>
                  The most consequential design choice: the ball-strike overlay graphic will{' '}
                  <em>not</em> be shown on live broadcasts. MLB is deliberately separating the
                  viewer experience from the umpire experience. Fans won&rsquo;t see the box.
                  They&rsquo;ll hear the call, see the challenge, and hear the result. This
                  matters because the overlay graphic has been the primary source of fan anger at
                  umpires for a decade &mdash; seeing a pitch clearly inside the box called a ball
                  generates outrage that the human eye, watching the game from field level, would
                  never produce. By removing the overlay from live broadcasts, MLB is asking fans
                  to trust the system without seeing the data in real time. It signals that MLB
                  views ABS as a way to reduce egregious missed calls, not to replace the human
                  element of ball-and-strike calling entirely.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Managers ────────────────────────────────────────────────── */}
        <Section padding="lg" background="charcoal">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-2 border-b border-burnt-orange/15">
                The Coaching Carousel
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={50}>
              <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                <p>
                  Nine new managers. Six first-timers. The headline hires tell a story about where
                  baseball thinks leadership comes from now.{' '}
                  <strong className="text-text-primary font-semibold">Tony Vitello</strong> going from
                  Tennessee to the Giants is the first time a college baseball coach has been hired
                  directly to manage an MLB team &mdash; ever. The hiring signals that
                  San&nbsp;Francisco values program-building and player development culture over
                  major-league coaching experience.{' '}
                  <strong className="text-text-primary font-semibold">Blake Butera</strong>, at 33,
                  became the youngest MLB manager since Frank Quilici in 1972 when Washington
                  hired him.{' '}
                  <strong className="text-text-primary font-semibold">Kurt Suzuki</strong> in Anaheim
                  and{' '}
                  <strong className="text-text-primary font-semibold">Craig Stammen</strong> in
                  San&nbsp;Diego represent the recently-retired-player-to-manager pipeline that
                  baseball has leaned into more heavily in recent years.
                </p>
                <p>
                  The continuity hires are just as telling.{' '}
                  <strong className="text-text-primary font-semibold">Walt Weiss</strong> spent eight
                  years as the Braves&rsquo; bench coach before being promoted &mdash; the kind
                  of succession plan that only works when the organization trusts its own
                  infrastructure.{' '}
                  <strong className="text-text-primary font-semibold">Derek Shelton</strong> moving from
                  the Pirates to the Twins brings a manager who knows how to develop young talent,
                  which is exactly what Minnesota&rsquo;s post-teardown roster needs. And{' '}
                  <strong className="text-text-primary font-semibold">Craig Albernaz</strong> in
                  Baltimore is a bet on someone who saw how winning organizations operate from
                  inside Cleveland&rsquo;s coaching staff.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Players to Watch ────────────────────────────────────────── */}
        <Section padding="lg">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-2 border-b border-burnt-orange/15">
                Players to Watch
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={50}>
              <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                <p>
                  <strong className="text-text-primary font-semibold">Shohei Ohtani</strong> (Dodgers)
                  is the story of the season before a single regular-season pitch is thrown. The
                  Dodgers signed the full package &mdash; pitcher and hitter &mdash; and have only
                  had the hitter for 18 months. Ohtani hitting 99&nbsp;mph this spring and
                  striking out his own teammates is the kind of spring training story that usually
                  gets dismissed as noise. This time it&rsquo;s not noise. It&rsquo;s the first
                  evidence that the arm is back, and if the arm is back, the Dodgers are the most
                  talented team baseball has ever assembled on a 26-man roster.
                </p>
                <p>
                  <strong className="text-text-primary font-semibold">Konnor Griffin</strong> (Pirates)
                  is the No.&nbsp;1 overall prospect in baseball and the player most likely to
                  alter a division race the moment he arrives. Griffin isn&rsquo;t making the
                  Opening Day roster, but the Pirates are building their 2026 projections around a
                  mid-season call-up. The talent evaluators who have seen him in camp haven&rsquo;t
                  changed their assessment: franchise-caliber shortstop with an above-average hit
                  tool and plus power.{' '}
                  <strong className="text-text-primary font-semibold">Kevin McGonigle</strong> (Tigers)
                  is the prospect most likely to impact Opening Day &mdash; he&rsquo;s trending
                  toward the 26-man roster and brings a profile (.308/.410/.512 in the minors,
                  more walks than strikeouts) that addresses Detroit&rsquo;s biggest lineup
                  weakness.
                </p>
                <p>
                  <strong className="text-text-primary font-semibold">Kyle Tucker</strong> in Dodger Blue
                  is the free agent whose production will define the offseason&rsquo;s narrative.
                  If Tucker posts another 5+&nbsp;WAR season alongside Ohtani, Betts, and Freeman,
                  the Dodgers become the team that spent their way to a historically great roster
                  and had it work. If his production dips in the pressure of a three-peat pursuit,
                  the $60M AAV becomes the story.{' '}
                  <strong className="text-text-primary font-semibold">Bo Bichette&rsquo;s</strong>{' '}
                  position change &mdash; shortstop to third base &mdash; with the Mets is a
                  less-discussed swing factor. Bichette signed for $126&nbsp;million partly
                  because the Mets believe his bat plays at a corner infield spot where the
                  defensive bar is lower. If the transition is seamless, the Mets&rsquo;
                  infield &mdash; Bichette at third, Lindor at short, Semien at
                  second &mdash; is one of the best in baseball. If Bichette struggles at a new
                  position, the defensive alignment becomes a liability.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Bold Predictions ────────────────────────────────────────── */}
        <Section padding="lg" background="charcoal">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-2 border-b border-burnt-orange/15">
                Five Bold Predictions
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={50}>
              <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                <p>
                  <strong className="text-text-primary font-semibold">1. The Tigers win the AL
                  Central.</strong> PECOTA has them half a game behind the Royals, but the
                  rotation &mdash; Skubal, Valdez, Verlander, with depth behind them &mdash; is
                  the best in the division by a wide margin. Rotations win divisions over 162
                  games. The Royals&rsquo; 2025 was real, but Detroit&rsquo;s pitching
                  infrastructure is deeper, and McGonigle&rsquo;s arrival gives the lineup the
                  contact-and-OBP profile it has lacked.
                </p>
                <p>
                  <strong className="text-text-primary font-semibold">2. The Mets finish third in the NL
                  East.</strong> The variance is too high. Robert&rsquo;s health,
                  Bichette&rsquo;s position change, a rotation built around one ace (Peralta) and
                  a collection of back-end starters, and a bullpen anchored by a closer changing
                  teams &mdash; too many moving parts need to land simultaneously. The Braves and
                  Phillies have continuity, and continuity beats volatility over a full season
                  more often than it doesn&rsquo;t.
                </p>
                <p>
                  <strong className="text-text-primary font-semibold">3. The ABS challenge system
                  produces fewer controversies than expected.</strong> The two-second window and
                  the player-only challenge rule will keep the system from dominating broadcasts.
                  Most marginal pitches will go unchallenged because the batter or pitcher
                  won&rsquo;t react fast enough. The system will quietly correct the worst calls
                  and leave the rest of the game feeling the same. By June, most fans will have
                  stopped thinking about it.
                </p>
                <p>
                  <strong className="text-text-primary font-semibold">4. The Blue Jays reach the World
                  Series.</strong> Guerrero&rsquo;s playoff performance last October wasn&rsquo;t
                  a fluke &mdash; it was a player entering his prime in the moment when prime-age
                  players historically make the leap from &ldquo;great season&rdquo; to
                  &ldquo;built for October.&rdquo; Toronto&rsquo;s lineup depth with Okamoto, the
                  rotation, and Guerrero&rsquo;s ability to carry a postseason series make them
                  the AL team best built for a short-series tournament.
                </p>
                <p>
                  <strong className="text-text-primary font-semibold">5. The Cardinals&rsquo; teardown
                  produces a 90-win team within three years.</strong> Wetherholt at the center,
                  the prospect capital they acquired, and Bloom&rsquo;s track record of building
                  from the ground up &mdash; this rebuild has a clearer blueprint than most. The
                  2026 record will be ugly. The 2028 record won&rsquo;t be.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── BSI Verdict ─────────────────────────────────────────────── */}
        <Section padding="lg">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <div className="relative bg-gradient-to-br from-burnt-orange/8 to-texas-soil/5 border border-burnt-orange/15 rounded p-8 sm:p-10">
                <div className="absolute -top-2.5 left-8 font-display text-[11px] tracking-[3px] uppercase bg-midnight text-burnt-orange px-3">
                  BSI Verdict
                </div>
                <div className="font-serif text-lg leading-relaxed text-[#FAF7F2] space-y-4">
                  <p>
                    The 2026 season enters spring training with the widest gap between the
                    projected best team and the projected second-best team in modern history. The
                    Dodgers at 103.8 PECOTA wins aren&rsquo;t just favored &mdash; they&rsquo;re
                    operating on a different plane, with the full version of Ohtani finally
                    arriving alongside Tucker, Betts, and Freeman. But the best story in baseball
                    isn&rsquo;t in Los Angeles. It&rsquo;s in the divisions where the margins are
                    razor-thin: the AL East with four near-90-win teams fighting for three playoff
                    spots, the NL East where the Mets&rsquo; total roster overhaul will either
                    vindicate Steve Cohen&rsquo;s spending philosophy or become the most expensive
                    cautionary tale in sports history, and the AL Central where the Tigers and
                    Royals are separated by half a projected win.
                  </p>
                  <p>
                    This is the season where robot umpires arrive, where nine new managers learn
                    that 162 games exposes every weakness a spring training record conceals, and
                    where the mechanisms underneath the headlines &mdash; Tucker&rsquo;s labor
                    implications, the Cardinals&rsquo; deliberate teardown, the Mariners&rsquo;
                    attempt to pair elite pitching with actual offense &mdash; will matter more
                    than the headlines themselves. The offseason reshuffled everything. Now 162
                    games will sort it.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Attribution ─────────────────────────────────────────────── */}
        <Section padding="md" className="border-t border-burnt-orange/10">
          <Container size="narrow">
            <div className="space-y-4">
              <DataSourceBadge source="PECOTA / ZiPS / FanGraphs / MLB.com / ESPN" timestamp="February 25, 2026 CT" />
              <div className="flex flex-wrap gap-6 pt-2">
                <Link href="/mlb/editorial" className="font-display text-[13px] uppercase tracking-widest text-burnt-orange hover:opacity-70 transition-opacity">
                  All MLB Editorial &rarr;
                </Link>
                <Link href="/mlb/standings" className="font-display text-[13px] uppercase tracking-widest text-text-muted hover:text-burnt-orange transition-colors">
                  MLB Standings &rarr;
                </Link>
                <Link href="/mlb/scores" className="font-display text-[13px] uppercase tracking-widest text-text-muted hover:text-burnt-orange transition-colors">
                  Live Scores &rarr;
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
