import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Big Ten Baseball: 2026 Conference Preview | Blaze Sports Intel',
  description:
    '17 programs. UCLA headlines as an Omaha Favorite. Oregon and USC bring West Coast firepower. The traditional Big Ten programs invest to keep up. Full scouting breakdowns.',
  openGraph: {
    title: 'Big Ten Baseball: 2026 Conference Preview',
    description:
      '17 programs. UCLA headlines. West Coast meets Midwest. Full scouting breakdowns.',
  },
};

// ── Projection tier badge styling ──────────────────────────────────────

type Tier = 'Omaha Favorite' | 'Contender' | 'Dark Horse' | 'Bubble' | 'Rebuilding';

const tierStyles: Record<Tier, string> = {
  'Omaha Favorite': 'bg-[#C9A227]/20 text-[#C9A227] border-[#C9A227]/30',
  Contender: 'bg-burnt-orange/20 text-ember border-burnt-orange/30',
  'Dark Horse': 'bg-white/10 text-white/70 border-white/20',
  Bubble: 'bg-white/5 text-white/40 border-white/10',
  Rebuilding: 'bg-white/[0.03] text-white/25 border-white/5',
};

function TierBadge({ tier }: { tier: string }) {
  const style = tierStyles[tier as Tier] || tierStyles.Bubble;
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${style}`}
    >
      {tier}
    </span>
  );
}

// ── Team data ──────────────────────────────────────────────────────────

interface TeamCard {
  name: string;
  slug: string;
  mascot: string;
  record: string;
  tier: string;
}

const BIGTEN_TEAMS: TeamCard[] = [
  { name: 'UCLA', slug: 'ucla', mascot: 'Bruins', record: '48-18', tier: 'Omaha Favorite' },
  { name: 'Oregon', slug: 'oregon', mascot: 'Ducks', record: '42-16', tier: 'Contender' },
  { name: 'USC', slug: 'usc', mascot: 'Trojans', record: '37-23', tier: 'Contender' },
  { name: 'Michigan', slug: 'michigan', mascot: 'Wolverines', record: '33-23', tier: 'Dark Horse' },
  { name: 'Iowa', slug: 'iowa', mascot: 'Hawkeyes', record: '33-22-1', tier: 'Dark Horse' },
  { name: 'Indiana', slug: 'indiana', mascot: 'Hoosiers', record: '32-24', tier: 'Bubble' },
  { name: 'Penn State', slug: 'penn-state', mascot: 'Nittany Lions', record: '33-23', tier: 'Bubble' },
  { name: 'Nebraska', slug: 'nebraska', mascot: 'Cornhuskers', record: '33-29', tier: 'Bubble' },
  { name: 'Illinois', slug: 'illinois', mascot: 'Fighting Illini', record: '30-24', tier: 'Bubble' },
  { name: 'Michigan State', slug: 'michigan-state', mascot: 'Spartans', record: '28-27', tier: 'Bubble' },
  { name: 'Rutgers', slug: 'rutgers', mascot: 'Scarlet Knights', record: '29-28', tier: 'Bubble' },
  { name: 'Washington', slug: 'washington', mascot: 'Huskies', record: '29-28', tier: 'Bubble' },
  { name: 'Purdue', slug: 'purdue', mascot: 'Boilermakers', record: '31-23', tier: 'Bubble' },
  { name: 'Ohio State', slug: 'ohio-state', mascot: 'Buckeyes', record: '13-37', tier: 'Rebuilding' },
  { name: 'Maryland', slug: 'maryland', mascot: 'Terrapins', record: '27-29', tier: 'Rebuilding' },
  { name: 'Minnesota', slug: 'minnesota', mascot: 'Golden Gophers', record: '24-28', tier: 'Rebuilding' },
  { name: 'Northwestern', slug: 'northwestern', mascot: 'Wildcats', record: '25-27', tier: 'Rebuilding' },
];

// ── Key storylines ─────────────────────────────────────────────────────

interface Storyline {
  title: string;
  body: string;
}

const STORYLINES: Storyline[] = [
  {
    title: 'UCLA: The Big Ten\'s New Standard',
    body: 'The Bruins went 48-18 in their Big Ten debut and immediately established themselves as the conference\'s premier program. John Savage built a roster that blends West Coast recruiting with MLB-caliber pitching depth. UCLA has the talent to compete for a national championship, and the Big Ten gave them a platform to prove it. This is what conference realignment looks like when it works.',
  },
  {
    title: 'Pac-12 Refugees',
    body: 'UCLA, USC, Oregon, and Washington arrived from a conference that no longer exists for football — but these programs brought Pac-12 baseball culture with them. Combined, they won 156 games in 2025. They recruit from Southern California and the Pacific Northwest. They play year-round baseball. And they changed the Big Ten\'s identity overnight. The West Coast programs aren\'t visitors. They\'re the new top tier.',
  },
  {
    title: 'Midwest Baseball Rising',
    body: 'Michigan, Iowa, Indiana, Penn State, Nebraska, and Illinois all sit in the Dark Horse or Bubble tiers — and every single one of them is investing in baseball at levels they never reached in the old Big Ten. The conference revenue from adding USC and UCLA funds facility upgrades, coaching salaries, and recruiting budgets. The Midwest programs can\'t match the West Coast weather, but they can compete on resources. The gap is closing.',
  },
  {
    title: 'The Rebuilding Class',
    body: 'Ohio State went 13-37 and is starting over. Maryland, Minnesota, and Northwestern all finished below .500 and face multi-year rebuilds. But even these programs have Big Ten resources, Big Ten facilities, and a conference schedule that prepares them for postseason baseball if they can climb out of the bottom tier. Rebuilding in the Big Ten means learning from UCLA, Oregon, and USC every weekend. It\'s a painful education, but it\'s an education.',
  },
];

// ── Page ───────────────────────────────────────────────────────────────

function TeamPreviewCard({ team }: { team: TeamCard }) {
  return (
    <Link href={`/college-baseball/editorial/${team.slug}-2026`} className="block group">
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4 hover:border-[#6B8CAE]/40 hover:bg-white/[0.06] transition-all h-full">
        <div className="flex items-start justify-between mb-2">
          <div className="min-w-0">
            <h4 className="font-display text-sm font-bold text-white uppercase tracking-wide group-hover:text-[#6B8CAE] transition-colors truncate">
              {team.name}
            </h4>
            <p className="text-white/30 text-xs">{team.mascot}</p>
          </div>
          <TierBadge tier={team.tier} />
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="text-white/40 text-xs font-mono">{team.record}</span>
          <svg
            viewBox="0 0 24 24"
            className="w-3.5 h-3.5 text-white/15 group-hover:text-[#6B8CAE]/60 transition-colors"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>
      </div>
    </Link>
  );
}

export default function BigTenEditorialPage() {
  return (
    <>
      <main id="main-content">
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-white/10">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href="/college-baseball"
                className="text-white/40 hover:text-[#6B8CAE] transition-colors"
              >
                College Baseball
              </Link>
              <span className="text-white/20">/</span>
              <Link
                href="/college-baseball/editorial"
                className="text-white/40 hover:text-[#6B8CAE] transition-colors"
              >
                Editorial
              </Link>
              <span className="text-white/20">/</span>
              <span className="text-white">Big Ten</span>
            </nav>
          </Container>
        </Section>

        {/* Hero */}
        <Section padding="lg" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#6B8CAE]/10 via-transparent to-[#4A6FA5]/8 pointer-events-none" />
          <Container>
            <ScrollReveal direction="up">
              <div className="max-w-3xl mb-10">
                <Badge
                  variant="outline"
                  className="mb-4 border-[#6B8CAE]/40 text-[#6B8CAE]"
                >
                  2026 Conference Preview
                </Badge>
                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-wide mb-4">
                  Northern{' '}
                  <span className="text-[#6B8CAE]">Rising</span>
                </h1>
                <p className="text-white/50 text-lg leading-relaxed">
                  The Big Ten added UCLA, USC, Oregon, and Washington — and overnight became
                  a real baseball conference. Seventeen programs. One Omaha favorite. Two
                  contenders. And a Midwest middle class investing at levels the old conference
                  never reached. The West Coast programs brought sunshine and recruiting reach.
                  The traditional Big Ten programs are learning to compete.
                </p>
              </div>
            </ScrollReveal>

            {/* Stats Band */}
            <ScrollReveal direction="up" delay={100}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4 text-center">
                  <div className="font-display text-3xl font-bold text-[#6B8CAE]">17</div>
                  <div className="text-white/30 text-xs uppercase tracking-wider mt-1">
                    Programs
                  </div>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4 text-center">
                  <div className="font-display text-3xl font-bold text-[#C9A227]">1</div>
                  <div className="text-white/30 text-xs uppercase tracking-wider mt-1">
                    Omaha Favorite
                  </div>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4 text-center">
                  <div className="font-display text-3xl font-bold text-[#6B8CAE]">2</div>
                  <div className="text-white/30 text-xs uppercase tracking-wider mt-1">
                    Contenders
                  </div>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4 text-center">
                  <div className="font-display text-3xl font-bold text-white/40">8</div>
                  <div className="text-white/30 text-xs uppercase tracking-wider mt-1">
                    Bubble Teams
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Conference Narrative */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container size="narrow">
            <ScrollReveal direction="up">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 rounded-full bg-[#6B8CAE]" />
                <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide text-white">
                  The Conference
                </h2>
              </div>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={60}>
              <div className="space-y-5 text-white/60 leading-relaxed">
                <p>
                  The Big Ten added UCLA, USC, Oregon, and Washington — and overnight became
                  a legitimate baseball conference. For decades, the Big Ten was a Midwest
                  league that played baseball in cold weather with limited recruiting reach.
                  Michigan won a national title in 1962. After that, the conference produced
                  good programs but rarely sustained a presence at Omaha. The weather was
                  unforgiving. The facilities lagged. The recruiting pipelines ran south. That
                  version of the Big Ten is gone.
                </p>
                <p>
                  UCLA went 48-18 in its Big Ten debut and immediately established itself as
                  the conference\'s premier program. Oregon won 42 games. USC and Washington
                  brought Pac-12 pedigree and West Coast recruiting access. The four programs
                  combined for 156 wins in 2025, and they changed the league\'s ceiling. The
                  Big Ten is no longer a football conference that happens to play baseball. It
                  is a baseball conference with a legitimate Omaha favorite at the top, two
                  more programs capable of hosting regionals, and a middle class investing at
                  levels the old conference never reached.
                </p>
                <p>
                  The Midwest programs — Michigan, Iowa, Indiana, Penn State, Nebraska,
                  Illinois — are responding. Conference revenue from adding USC and UCLA funds
                  facility upgrades, coaching salaries, and recruiting budgets. The traditional
                  Big Ten programs can\'t match West Coast weather or year-round baseball, but
                  they can compete on resources. The gap is closing. The Big Ten is no longer
                  one thing. It is two baseball traditions colliding under the same conference
                  banner, and 2026 will show whether that collision produces something greater
                  than either side brought alone.
                </p>
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
                    <div className="w-1 h-8 rounded-full bg-[#6B8CAE]" />
                    <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide text-white">
                      All 17 Programs
                    </h2>
                  </div>
                  <p className="text-white/40 text-sm ml-4 pl-3">
                    Sorted by projection tier -- tap any team for full scouting breakdown
                  </p>
                </div>
              </div>
            </ScrollReveal>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {BIGTEN_TEAMS.map((team, i) => (
                <ScrollReveal key={team.slug} direction="up" delay={Math.min(i * 30, 300)}>
                  <TeamPreviewCard team={team} />
                </ScrollReveal>
              ))}
            </div>
          </Container>
        </Section>

        {/* Key Storylines */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-1 h-8 rounded-full bg-[#6B8CAE]" />
                <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide text-white">
                  Key Storylines
                </h2>
              </div>
            </ScrollReveal>
            <div className="grid md:grid-cols-2 gap-4">
              {STORYLINES.map((story, i) => (
                <ScrollReveal key={story.title} direction="up" delay={i * 80}>
                  <Card variant="default" padding="lg" className="h-full">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-[#6B8CAE]" />
                      <h3 className="font-display text-sm font-bold text-[#6B8CAE] uppercase tracking-wide">
                        {story.title}
                      </h3>
                    </div>
                    <p className="text-white/50 text-sm leading-relaxed">{story.body}</p>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </Container>
        </Section>

        {/* Cross-links to other conferences */}
        <Section padding="lg" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-xl font-bold uppercase tracking-wide text-white/60 mb-6">
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
                    <div className="absolute top-0 left-0 w-full h-1 rounded-t-lg bg-[#C9A227]" />
                    <div className="mt-2">
                      <h3 className="font-display text-xl font-bold uppercase tracking-wide text-[#C9A227] group-hover:text-[#C9A227]/80 transition-colors">
                        SEC
                      </h3>
                      <p className="text-white/40 text-sm mt-1 italic">The Standard</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-white/30">
                        <span>16 teams</span>
                        <span>4 Omaha Favorites</span>
                      </div>
                      <div className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-[#C9A227] group-hover:translate-x-1 transition-transform">
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
                      <p className="text-white/40 text-sm mt-1 italic">New Blood</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-white/30">
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
            </div>
          </Container>
        </Section>

        {/* Data Attribution */}
        <Section padding="sm" borderTop>
          <Container>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-white/20 text-xs">
                Data: ESPN / SportsDataIO / D1Baseball -- February 2026
              </p>
              <Link
                href="/college-baseball/editorial"
                className="text-sm text-[#6B8CAE] hover:text-[#6B8CAE]/70 transition-colors"
              >
                Back to Editorial Hub
              </Link>
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
