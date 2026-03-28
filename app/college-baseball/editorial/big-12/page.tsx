import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { editorialMetadata, editorialJsonLdProps } from '@/lib/editorial-seo';
import { ArticleJsonLd } from '@/components/seo/ArticleJsonLd';
import { ConferenceTeamGrid } from '@/components/editorial/ConferenceTeamGrid';
import type { TeamEntry } from '@/components/editorial/ConferenceTeamGrid';

const seoConfig = {
  title: 'Big 12 Baseball: 2026 Conference Preview',
  description: '14 programs. A conference reshaped by expansion. TCU leads the way, Kansas emerges, and the Arizona schools bring Pac-12 pedigree. Full scouting breakdowns.',
  datePublished: '2026-02-14',
  slug: '/college-baseball/editorial/big-12',
  image: '/images/og/cbb-big-12.png',
  sport: 'College Baseball',
  ogDescription: '14 programs reshaped by expansion. Full scouting breakdowns for every team.',
};

export const metadata = editorialMetadata(seoConfig);

// ── Team data ──────────────────────────────────────────────────────────

const BIG12_TEAMS: TeamEntry[] = [
  { name: 'TCU', slug: 'tcu', mascot: 'Horned Frogs', tier: 'Contender' },
  { name: 'Kansas', slug: 'kansas', mascot: 'Jayhawks', tier: 'Dark Horse' },
  { name: 'Oklahoma State', slug: 'oklahoma-state', mascot: 'Cowboys', tier: 'Dark Horse' },
  { name: 'Arizona', slug: 'arizona', mascot: 'Wildcats', tier: 'Dark Horse' },
  { name: 'Arizona State', slug: 'arizona-state', mascot: 'Sun Devils', tier: 'Dark Horse' },
  { name: 'Baylor', slug: 'baylor', mascot: 'Bears', tier: 'Bubble' },
  { name: 'Houston', slug: 'houston', mascot: 'Cougars', tier: 'Bubble' },
  { name: 'UCF', slug: 'ucf', mascot: 'Knights', tier: 'Bubble' },
  { name: 'West Virginia', slug: 'west-virginia', mascot: 'Mountaineers', tier: 'Bubble' },
  { name: 'Texas Tech', slug: 'texas-tech', mascot: 'Red Raiders', tier: 'Rebuilding' },
  { name: 'Cincinnati', slug: 'cincinnati', mascot: 'Bearcats', tier: 'Rebuilding' },
  { name: 'BYU', slug: 'byu', mascot: 'Cougars', tier: 'Rebuilding' },
  { name: 'Kansas State', slug: 'kansas-state', mascot: 'Wildcats', tier: 'Rebuilding' },
  { name: 'Utah', slug: 'utah', mascot: 'Utes', tier: 'Rebuilding' },
];

// ── Storylines ─────────────────────────────────────────────────────────

interface Storyline {
  title: string;
  body: string;
}

const STORYLINES: Storyline[] = [
  {
    title: 'TCU: Still the Big 12\'s Best',
    body: 'The Horned Frogs went 44-20 in 2025 and return the deepest pitching staff in the conference. Kirk Saarloos has built something sustainable in Fort Worth — a program that recruits nationally, develops arms through the system, and plays its best baseball in May. TCU is the measuring stick for every other Big 12 program, and nobody has cleared it yet.',
  },
  {
    title: 'Kansas\'s Breakout',
    body: 'A 42-18 season was no fluke. Dan Fitzgerald has transformed Lawrence into a legitimate baseball destination, landing top-tier in-state talent that used to leave for the SEC and bringing in impact transfers. The Jayhawks hit for average and situational power, and their bullpen depth kept them in games all spring. 2026 is the year they prove the breakout has staying power.',
  },
  {
    title: 'Desert Baseball Arrives',
    body: 'Arizona and Arizona State bring a different brand of baseball to the Big 12 — programs raised on Pac-12 competition, desert heat, and a recruiting pipeline that runs through Southern California. The Wildcats and Sun Devils combine for 71 wins in 2025 and carry the kind of athlete depth that Big 12 pitchers haven\'t regularly faced. The scouting reports are about to get longer.',
  },
  {
    title: 'The Rebuilding Class',
    body: 'Texas Tech, Cincinnati, BYU, Kansas State, and Utah sit in rebuilding tiers — but "rebuilding" in the new Big 12 doesn\'t mean irrelevant. Tech has the facilities and brand to reload fast. Cincinnati is learning Power Five baseball in real time. BYU and K-State are one recruiting cycle from flipping. And Utah is investing at levels the old Mountain West never required. The floor is rising across the board.',
  },
];

// ── Page ───────────────────────────────────────────────────────────────

export default function Big12EditorialPage() {
  return (
    <>
      <ArticleJsonLd {...editorialJsonLdProps(seoConfig)} />
      <div>
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-[var(--border-vintage)]">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href="/college-baseball"
                className="text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-primary)] transition-colors"
              >
                College Baseball
              </Link>
              <span className="text-[rgba(196,184,165,0.35)]">/</span>
              <Link
                href="/college-baseball/editorial"
                className="text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-primary)] transition-colors"
              >
                Editorial
              </Link>
              <span className="text-[rgba(196,184,165,0.35)]">/</span>
              <span className="text-[var(--bsi-bone)]">Big 12</span>
            </nav>
          </Container>
        </Section>

        {/* Hero */}
        <Section padding="lg" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-burnt-orange/12 via-transparent to-ember/8 pointer-events-none" />
          <Container>
            <ScrollReveal direction="up">
              <div className="max-w-3xl mb-10">
                <Badge variant="primary" className="mb-4">
                  2026 Conference Preview
                </Badge>
                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-wide mb-3">
                  Big 12 Baseball:{' '}
                  <span className="text-[var(--bsi-primary)]">New Blood</span>
                </h1>
                <p className="text-[rgba(196,184,165,0.5)] text-lg leading-relaxed">
                  The conference has been reshaped by expansion. Arizona, Arizona State, BYU,
                  Cincinnati, Colorado, Houston, UCF, and Utah arrived — bringing new recruiting
                  pipelines, regional baseball cultures, and a depth the Big 12 has never had.
                  14 programs. 5 projected Dark Horse or better. TCU anchors the top. Kansas is
                  the breakout. The bottom half is rebuilding, but nobody is standing still.
                </p>
              </div>
            </ScrollReveal>

            {/* Stats Band */}
            <ScrollReveal direction="up" delay={100}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center bg-[var(--surface-press-box)] border border-[var(--border-vintage)] rounded-sm p-6">
                <div>
                  <div className="font-display text-3xl font-bold text-[var(--bsi-primary)]">14</div>
                  <div className="text-[rgba(196,184,165,0.35)] text-xs uppercase tracking-wider mt-1">
                    Programs
                  </div>
                </div>
                <div>
                  <div className="font-display text-3xl font-bold text-[var(--bsi-primary)]">5</div>
                  <div className="text-[rgba(196,184,165,0.35)] text-xs uppercase tracking-wider mt-1">
                    Dark Horse+
                  </div>
                </div>
                <div>
                  <div className="font-display text-3xl font-bold text-ember">TCU</div>
                  <div className="text-[rgba(196,184,165,0.35)] text-xs uppercase tracking-wider mt-1">
                    Conference Headliner
                  </div>
                </div>
                <div>
                  <div className="font-display text-3xl font-bold text-[var(--bsi-primary)]">8</div>
                  <div className="text-[rgba(196,184,165,0.35)] text-xs uppercase tracking-wider mt-1">
                    Expansion Additions
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Conference Narrative */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-8 rounded-full bg-[var(--bsi-primary)]" />
                  <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide text-[var(--bsi-bone)]">
                    The Conference, Transformed
                  </h2>
                </div>
                <div className="space-y-5 text-[rgba(196,184,165,0.5)] leading-relaxed">
                  <p>
                    Two years ago, the Big 12 was a six-team baseball conference trying to
                    justify its Power Five status on the diamond. Texas and Oklahoma had left.
                    TCU carried the flag. The league was thin and everyone knew it. That version
                    of the Big 12 is gone. The conference that takes the field in 2026 has 14
                    programs, a coast-to-coast recruiting footprint, and a middle class that
                    didn&apos;t exist before expansion.
                  </p>
                  <p>
                    TCU remains the anchor — 44 wins, a pitching-first identity, and a head coach
                    in Kirk Saarloos who has turned Fort Worth into one of the best development
                    programs in the country. But the gap between TCU and the next tier has
                    narrowed. Kansas posted 42 wins and a super regional appearance in 2025.
                    Oklahoma State returns a loaded lineup. Arizona and Arizona State bring
                    Pac-12 pedigree, Southern California recruiting ties, and the kind of
                    athlete depth that changes how the league scouts itself.
                  </p>
                  <p>
                    The bottom half — Texas Tech, Cincinnati, BYU, Kansas State, Utah — is in
                    various stages of rebuilding. But &quot;rebuilding&quot; in the new Big 12
                    means something different than it did in the old one. These programs have
                    Power Five resources, conference revenue, and a path to the NCAA Tournament
                    that runs through a conference tournament anyone can win. The floor is
                    rising. The ceiling hasn&apos;t been tested yet.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Team Preview Grid */}
        <Section padding="lg" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-1 h-8 rounded-full bg-[var(--bsi-primary)]" />
                    <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide text-[var(--bsi-bone)]">
                      All 14 Team Previews
                    </h2>
                  </div>
                  <p className="text-[rgba(196,184,165,0.35)] text-sm ml-4 pl-3">
                    Sorted by projection tier — full scouting breakdowns for every program
                  </p>
                </div>
              </div>
            </ScrollReveal>
            <ConferenceTeamGrid
              teams={BIG12_TEAMS}
              conference="Big 12"
              hoverColor="rgba(191, 87, 0, 0.4)"
            />
          </Container>
        </Section>

        {/* Key Storylines */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-1 h-8 rounded-full bg-ember" />
                <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide text-[var(--bsi-bone)]">
                  Key Storylines
                </h2>
              </div>
            </ScrollReveal>
            <div className="grid md:grid-cols-2 gap-4">
              {STORYLINES.map((story, i) => (
                <ScrollReveal key={story.title} direction="up" delay={i * 80}>
                  <Card variant="default" padding="lg" className="h-full">
                    <h3 className="font-display text-sm font-bold text-[var(--bsi-primary)] uppercase tracking-wide mb-3">
                      {story.title}
                    </h3>
                    <p className="text-[rgba(196,184,165,0.5)] text-sm leading-relaxed">{story.body}</p>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </Container>
        </Section>

        {/* Cross-links */}
        <Section padding="md" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-xl font-bold uppercase tracking-wide text-[rgba(196,184,165,0.5)] mb-6">
                More Conference Previews
              </h2>
            </ScrollReveal>
            <div className="grid md:grid-cols-2 gap-4">
              <ScrollReveal direction="up" delay={0}>
                <Link href="/college-baseball/editorial/sec" className="block group">
                  <Card
                    variant="default"
                    padding="lg"
                    className="h-full hover:border-[#C9A227]/30 transition-all relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 rounded-t-sm bg-[#C9A227]" />
                    <div className="mt-2">
                      <h3 className="font-display text-xl font-bold uppercase tracking-wide text-[#C9A227] group-hover:brightness-125 transition-all">
                        SEC
                      </h3>
                      <p className="text-[rgba(196,184,165,0.35)] text-sm mt-1 italic">The Standard</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-[rgba(196,184,165,0.35)]">
                        <span>16 teams</span>
                        <span>13 ranked</span>
                      </div>
                      <div className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-[#C9A227] group-hover:translate-x-1 transition-transform">
                        Full SEC Preview
                        <svg
                          viewBox="0 0 24 24"
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </div>
                    </div>
                  </Card>
                </Link>
              </ScrollReveal>
              <ScrollReveal direction="up" delay={80}>
                <Link href="/college-baseball/editorial/big-ten" className="block group">
                  <Card
                    variant="default"
                    padding="lg"
                    className="h-full hover:border-[#6B8CAE]/30 transition-all relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 rounded-t-sm bg-[#6B8CAE]" />
                    <div className="mt-2">
                      <h3 className="font-display text-xl font-bold uppercase tracking-wide text-[#6B8CAE] group-hover:brightness-125 transition-all">
                        Big Ten
                      </h3>
                      <p className="text-[rgba(196,184,165,0.35)] text-sm mt-1 italic">Northern Rising</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-[rgba(196,184,165,0.35)]">
                        <span>17 teams</span>
                        <span>3 ranked</span>
                      </div>
                      <div className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-[#6B8CAE] group-hover:translate-x-1 transition-transform">
                        Full Big Ten Preview
                        <svg
                          viewBox="0 0 24 24"
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </div>
                    </div>
                  </Card>
                </Link>
              </ScrollReveal>
            </div>
          </Container>
        </Section>

        {/* Data Attribution */}
        <Section padding="sm" borderTop>
          <Container>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-[rgba(196,184,165,0.35)] text-xs">
                Data: ESPN / SportsDataIO / D1Baseball — February 2026
              </p>
              <div className="flex items-center gap-4">
                <Link
                  href="/college-baseball/editorial"
                  className="text-sm text-[var(--bsi-primary)] hover:text-[var(--bsi-primary)] transition-colors"
                >
                  ← Editorial Hub
                </Link>
                <Link
                  href="/college-baseball"
                  className="text-sm text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-dust)] transition-colors"
                >
                  College Baseball
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
