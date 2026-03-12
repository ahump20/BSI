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
  title: 'SEC Baseball: 2026 Conference Preview',
  description: '16 programs. 13 ranked teams. 4 Omaha Favorites. The SEC is the deepest conference in college baseball. Full scouting breakdowns for every program.',
  datePublished: '2026-02-14',
  slug: '/college-baseball/editorial/sec',
  image: '/images/og/cbb-sec.png',
  sport: 'College Baseball',
  ogDescription: '16 programs. 13 ranked teams. 4 Omaha Favorites. The deepest conference in college baseball.',
};

export const metadata = editorialMetadata(seoConfig);

// ── SEC team data ──────────────────────────────────────────────────────

const SEC_TEAMS: TeamEntry[] = [
  { name: 'Texas', slug: 'texas', mascot: 'Longhorns', tier: 'Omaha Favorite' },
  { name: 'Texas A&M', slug: 'texas-am', mascot: 'Aggies', tier: 'Omaha Favorite' },
  { name: 'LSU', slug: 'lsu', mascot: 'Tigers', tier: 'Omaha Favorite' },
  { name: 'Florida', slug: 'florida', mascot: 'Gators', tier: 'Omaha Favorite' },
  { name: 'Tennessee', slug: 'tennessee', mascot: 'Volunteers', tier: 'Contender' },
  { name: 'Arkansas', slug: 'arkansas', mascot: 'Razorbacks', tier: 'Contender' },
  { name: 'Vanderbilt', slug: 'vanderbilt', mascot: 'Commodores', tier: 'Contender' },
  { name: 'Oklahoma', slug: 'oklahoma', mascot: 'Sooners', tier: 'Dark Horse' },
  { name: 'Georgia', slug: 'georgia', mascot: 'Bulldogs', tier: 'Dark Horse' },
  { name: 'Kentucky', slug: 'kentucky', mascot: 'Wildcats', tier: 'Dark Horse' },
  { name: 'South Carolina', slug: 'south-carolina', mascot: 'Gamecocks', tier: 'Dark Horse' },
  { name: 'Ole Miss', slug: 'ole-miss', mascot: 'Rebels', tier: 'Bubble' },
  { name: 'Alabama', slug: 'alabama', mascot: 'Crimson Tide', tier: 'Bubble' },
  { name: 'Auburn', slug: 'auburn', mascot: 'Tigers', tier: 'Bubble' },
  { name: 'Mississippi State', slug: 'mississippi-state', mascot: 'Bulldogs', tier: 'Bubble' },
  { name: 'Missouri', slug: 'missouri', mascot: 'Tigers', tier: 'Rebuilding' },
];

// ── Key storylines ─────────────────────────────────────────────────────

interface Storyline {
  title: string;
  body: string;
}

const STORYLINES: Storyline[] = [
  {
    title: 'Texas: The New Standard',
    body: 'The Longhorns arrived in the SEC and immediately established themselves as the program to beat. Jim Schlossnagle built a roster that blends veteran leadership with elite freshman talent, and the pitching staff is the deepest in the conference. Texas went 44-14 in 2025 and returns nearly every impact player. The Longhorns are the SEC\'s best team — and they know it.',
  },
  {
    title: 'Four Omaha Favorites',
    body: 'Texas, Texas A&M, LSU, and Florida all carry the profile of national championship contenders. Combined, they won 196 games in 2025. Each has a Friday night ace who projects as a first-round pick. Each recruits at an elite level nationally. And each has a baseball program culture built on winning in May and June. The SEC will send at least three of these four to Omaha.',
  },
  {
    title: 'The Competitive Middle',
    body: 'Tennessee, Arkansas, and Vanderbilt sit in the Contender tier — and any of them could win the conference tournament. Oklahoma, Georgia, Kentucky, and South Carolina are Dark Horse picks who could make a super regional run if the pitching holds. The gap between the top four and the middle class is real, but it\'s not insurmountable. The SEC tournament is a gauntlet for a reason.',
  },
  {
    title: 'SEC Depth',
    body: 'Thirteen SEC teams are ranked in the preseason Top 50. That\'s more than half the conference. Ole Miss, Alabama, Auburn, and Mississippi State all sit in the Bubble tier — and all four would be top-25 programs in most other conferences. Even Missouri, the lone Rebuilding team, has Power Five resources and a path to contention within two years. The floor is high. The ceiling is Omaha.',
  },
];

// ── Page ───────────────────────────────────────────────────────────────

export default function SECEditorialPage() {
  return (
    <>
      <ArticleJsonLd {...editorialJsonLdProps(seoConfig)} />
      <div>
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-border">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href="/college-baseball"
                className="text-text-muted hover:text-burnt-orange transition-colors"
              >
                College Baseball
              </Link>
              <span className="text-text-muted">/</span>
              <Link
                href="/college-baseball/editorial"
                className="text-text-muted hover:text-burnt-orange transition-colors"
              >
                Editorial
              </Link>
              <span className="text-text-muted">/</span>
              <span className="text-[#C9A227]">SEC</span>
            </nav>
          </Container>
        </Section>

        {/* Hero */}
        <Section padding="xl" className="relative overflow-hidden">
          {/* Dramatic radial gradient with SEC gold */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-b from-[#C9A227]/10 via-transparent to-transparent" />
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full opacity-15"
              style={{
                background: 'radial-gradient(ellipse at center, #C9A227 0%, transparent 70%)',
              }}
            />
            <div
              className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full opacity-[0.07]"
              style={{
                background: 'radial-gradient(circle at center, var(--bsi-primary) 0%, transparent 70%)',
              }}
            />
          </div>

          <Container>
            <ScrollReveal direction="up">
              <div className="relative max-w-3xl">
                <Badge
                  variant="outline"
                  className="mb-4 border-[#C9A227]/40 text-[#C9A227]"
                >
                  2026 Conference Preview
                </Badge>
                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-wide mb-3">
                  <span className="text-[#C9A227]">SEC</span>{' '}
                  <span className="text-text-primary">Baseball</span>
                </h1>
                <p className="font-display text-xl md:text-2xl uppercase tracking-wide text-text-tertiary mb-6">
                  The Standard
                </p>
                <p className="text-text-tertiary text-lg leading-relaxed max-w-2xl">
                  The deepest conference in college baseball. Sixteen programs, thirteen ranked teams,
                  and four legitimate Omaha Favorites before the first pitch of the season. This is
                  where national championships are built — and where pretenders get exposed.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Conference Stats Band */}
        <Section padding="md" background="midnight" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div>
                  <div className="font-display text-3xl md:text-4xl font-bold text-[#C9A227]">16</div>
                  <div className="text-text-muted text-xs uppercase tracking-wider mt-1">Programs</div>
                </div>
                <div>
                  <div className="font-display text-3xl md:text-4xl font-bold text-[#C9A227]">13</div>
                  <div className="text-text-muted text-xs uppercase tracking-wider mt-1">Ranked Teams</div>
                </div>
                <div>
                  <div className="font-display text-3xl md:text-4xl font-bold text-[#C9A227]">4</div>
                  <div className="text-text-muted text-xs uppercase tracking-wider mt-1">Omaha Favorites</div>
                </div>
                <div>
                  <div className="font-display text-3xl md:text-4xl font-bold text-[#C9A227]">196</div>
                  <div className="text-text-muted text-xs uppercase tracking-wider mt-1">
                    Wins (Top 4)
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Conference Narrative */}
        <Section padding="lg" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-8 rounded-full bg-[#C9A227]" />
                  <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide text-text-primary">
                    The Deepest Conference in America
                  </h2>
                </div>
                <div className="space-y-5 text-text-tertiary leading-relaxed">
                  <p>
                    The SEC has been the best baseball conference in America for two decades. But
                    the 2026 version is different. Texas and Oklahoma joined from the Big 12,
                    bringing two blue-blood programs and the kind of recruiting reach that
                    stretches from the Gulf Coast to Southern California. Texas A&M is coming off
                    a 53-15 season and a national runner-up finish. LSU won 52 games and returned
                    to Omaha for the 21st time in program history. Florida went 47-23 and has the
                    best freshman class in the country arriving in Gainesville.
                  </p>
                  <p>
                    The middle class is stacked. Tennessee, Arkansas, and Vanderbilt all sit in
                    the Contender tier — programs that recruit nationally, develop pitching, and
                    peak in May. Oklahoma brought a 40-21 record from the Big 12 and immediately
                    slots into the Dark Horse group alongside Georgia, Kentucky, and South Carolina.
                    All four of those programs would be favored to win a regional. All four have
                    MLB-caliber arms at the top of the rotation. The gap between the Omaha favorites
                    and the middle class is real, but it's measured in margins — not miles.
                  </p>
                  <p>
                    Ole Miss, Alabama, Auburn, and Mississippi State occupy the Bubble tier, and
                    every single one of them is ranked in the preseason Top 50. Missouri is the
                    lone rebuilding program after a 28-29 season, but even the Tigers have SEC
                    resources, SEC facilities, and a path back to the NCAA Tournament within two
                    cycles. The floor is high. The ceiling is Omaha. And the conference tournament
                    in Hoover is going to be a war of attrition.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Team Preview Grid */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-1 h-8 rounded-full bg-[#C9A227]" />
                    <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide text-text-primary">
                      All 16 Programs
                    </h2>
                  </div>
                  <p className="text-text-muted text-sm ml-4 pl-3">
                    Sorted by projection tier — tap any team for the full scouting breakdown
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ConferenceTeamGrid
              teams={SEC_TEAMS}
              conference="SEC"
              hoverColor="rgba(201, 162, 39, 0.4)"
            />
          </Container>
        </Section>

        {/* Key Storylines */}
        <Section padding="lg" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-1 h-8 rounded-full bg-[#C9A227]" />
                <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide text-text-primary">
                  Key Storylines
                </h2>
              </div>
            </ScrollReveal>

            <div className="grid md:grid-cols-2 gap-5">
              {STORYLINES.map((storyline, i) => (
                <ScrollReveal key={storyline.title} direction="up" delay={i * 80}>
                  <Card variant="default" padding="lg" className="h-full">
                    <h3 className="font-display text-base font-bold text-[#C9A227] uppercase tracking-wide mb-3">
                      {storyline.title}
                    </h3>
                    <p className="text-text-tertiary text-sm leading-relaxed">{storyline.body}</p>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </Container>
        </Section>

        {/* Cross-links to other conferences */}
        <Section padding="lg" background="midnight" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-xl font-bold uppercase tracking-wide text-text-tertiary mb-6">
                More Conference Previews
              </h2>
            </ScrollReveal>
            <div className="grid md:grid-cols-2 gap-4">
              <ScrollReveal direction="up" delay={0}>
                <Link href="/college-baseball/editorial/big-12" className="block group">
                  <Card
                    variant="default"
                    padding="lg"
                    className="h-full hover:border-burnt-orange/30 transition-all relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 rounded-t-lg bg-burnt-orange" />
                    <div className="mt-2">
                      <h3 className="font-display text-xl font-bold uppercase tracking-wide text-burnt-orange group-hover:text-ember transition-colors">
                        Big 12
                      </h3>
                      <p className="text-text-muted text-sm mt-1 italic">New Blood</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-text-muted">
                        <span>14 teams</span>
                        <span>5 ranked</span>
                      </div>
                      <div className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-burnt-orange group-hover:translate-x-1 transition-transform">
                        Explore
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
                    <div className="absolute top-0 left-0 w-full h-1 rounded-t-lg bg-[#6B8CAE]" />
                    <div className="mt-2">
                      <h3 className="font-display text-xl font-bold uppercase tracking-wide text-[#6B8CAE] group-hover:text-[#89A8C4] transition-colors">
                        Big Ten
                      </h3>
                      <p className="text-text-muted text-sm mt-1 italic">Northern Rising</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-text-muted">
                        <span>17 teams</span>
                        <span>3 ranked</span>
                      </div>
                      <div className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-[#6B8CAE] group-hover:translate-x-1 transition-transform">
                        Explore
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
              <p className="text-text-muted text-xs">
                Data: ESPN / SportsDataIO / D1Baseball — February 2026
              </p>
              <Link
                href="/college-baseball/editorial"
                className="text-sm text-[#C9A227] hover:text-[#D4AF37] transition-colors"
              >
                ← Back to Editorial Hub
              </Link>
            </div>
          </Container>
        </Section>
      </div>

      <Footer />
    </>
  );
}
