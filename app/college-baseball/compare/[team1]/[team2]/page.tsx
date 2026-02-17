import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Footer } from '@/components/layout-ds/Footer';
import { preseason2026, getTierLabel } from '@/lib/data/preseason-2026';

const rivalries: [string, string][] = [
  ['texas', 'texas-am'],
  ['lsu', 'florida'],
  ['wake-forest', 'virginia'],
  ['clemson', 'north-carolina'],
  ['tcu', 'oklahoma-state'],
  ['oregon-state', 'ucla'],
  ['tennessee', 'arkansas'],
  ['stanford', 'california'],
];

function teamDisplayName(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

const tierOrder = { elite: 0, contender: 1, sleeper: 2, bubble: 3 } as const;

function tierBadgeVariant(tier: string): 'primary' | 'secondary' | 'success' | 'warning' {
  if (tier === 'elite') return 'primary';
  if (tier === 'contender') return 'success';
  if (tier === 'sleeper') return 'warning';
  return 'secondary';
}

export function generateStaticParams() {
  const slugs = Object.keys(preseason2026);
  const params: { team1: string; team2: string }[] = [];

  // Always include curated rivalries
  for (const [a, b] of rivalries) {
    if (preseason2026[a] && preseason2026[b]) {
      params.push({ team1: a, team2: b });
      params.push({ team1: b, team2: a });
    }
  }

  // Add top-25 cross-conference matchups for discovery
  for (let i = 0; i < slugs.length; i++) {
    for (let j = i + 1; j < slugs.length; j++) {
      const a = slugs[i];
      const b = slugs[j];
      if (preseason2026[a].conference !== preseason2026[b].conference) {
        const key = `${a}-${b}`;
        if (!params.some((p) => `${p.team1}-${p.team2}` === key)) {
          params.push({ team1: a, team2: b });
        }
      }
    }
  }

  return params;
}

interface PageProps {
  params: Promise<{ team1: string; team2: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { team1, team2 } = await params;
  const a = preseason2026[team1];
  const b = preseason2026[team2];
  if (!a || !b) return {};

  const nameA = teamDisplayName(team1);
  const nameB = teamDisplayName(team2);
  const title = `${nameA} vs ${nameB} — BSI Head-to-Head`;
  const description = `#${a.rank} ${nameA} vs #${b.rank} ${nameB} in the 2026 Preseason Power 25. Compare rankings, records, key players, and BSI tier ratings.`;

  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function ComparisonPage({ params }: PageProps) {
  const { team1, team2 } = await params;
  const a = preseason2026[team1];
  const b = preseason2026[team2];

  if (!a || !b) notFound();

  const nameA = teamDisplayName(team1);
  const nameB = teamDisplayName(team2);

  const higher = tierOrder[a.tier] <= tierOrder[b.tier] ? 'left' : 'right';

  return (
    <>
      <main id="main-content">
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-white/10">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link href="/college-baseball" className="text-white/40 hover:text-burnt-orange transition-colors">
                College Baseball
              </Link>
              <span className="text-white/20">/</span>
              <Link href="/college-baseball/compare" className="text-white/40 hover:text-burnt-orange transition-colors">
                Compare
              </Link>
              <span className="text-white/20">/</span>
              <span className="text-white">{nameA} vs {nameB}</span>
            </nav>
          </Container>
        </Section>

        {/* Hero */}
        <Section padding="lg" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-burnt-orange/10 via-transparent to-burnt-orange/10 pointer-events-none" />
          <Container center>
            <Badge variant="primary" className="mb-4">Head-to-Head</Badge>
            <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold text-center uppercase tracking-wide mb-2">
              <span className="text-gradient-blaze">{nameA}</span>
              <span className="text-white/30 mx-3">vs</span>
              <span className="text-gradient-blaze">{nameB}</span>
            </h1>
            <p className="text-white/50 text-center text-lg">
              #{a.rank} vs #{b.rank} — 2026 Preseason Power 25
            </p>
          </Container>
        </Section>

        {/* Comparison Card */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Team A */}
              <Card variant="default" padding="lg" className={higher === 'left' ? 'border-burnt-orange/40' : ''}>
                <div className="text-center mb-6">
                  <div className="font-display text-5xl font-bold text-burnt-orange mb-2">#{a.rank}</div>
                  <Link href={`/college-baseball/teams/${team1}`} className="font-display text-2xl font-bold text-white uppercase hover:text-burnt-orange transition-colors">
                    {nameA}
                  </Link>
                  <div className="text-white/40 text-sm mt-1">{a.conference}</div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white/40 text-sm">Tier</span>
                    <Badge variant={tierBadgeVariant(a.tier)}>{getTierLabel(a.tier)}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/40 text-sm">2025 Record</span>
                    <span className="text-white font-mono">{a.record2025}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/40 text-sm">Postseason</span>
                    <span className="text-white text-sm">{a.postseason2025}</span>
                  </div>
                  <div>
                    <span className="text-white/40 text-sm block mb-2">Key Players</span>
                    <div className="flex flex-wrap gap-2">
                      {a.keyPlayers.map((p) => (
                        <span key={p} className="text-xs bg-white/5 px-2 py-1 rounded text-white/60">{p}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-white/40 text-sm block mb-1">BSI Outlook</span>
                    <p className="text-white/50 text-sm leading-relaxed">{a.outlook}</p>
                  </div>
                </div>
              </Card>

              {/* Team B */}
              <Card variant="default" padding="lg" className={higher === 'right' ? 'border-burnt-orange/40' : ''}>
                <div className="text-center mb-6">
                  <div className="font-display text-5xl font-bold text-burnt-orange mb-2">#{b.rank}</div>
                  <Link href={`/college-baseball/teams/${team2}`} className="font-display text-2xl font-bold text-white uppercase hover:text-burnt-orange transition-colors">
                    {nameB}
                  </Link>
                  <div className="text-white/40 text-sm mt-1">{b.conference}</div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white/40 text-sm">Tier</span>
                    <Badge variant={tierBadgeVariant(b.tier)}>{getTierLabel(b.tier)}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/40 text-sm">2025 Record</span>
                    <span className="text-white font-mono">{b.record2025}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/40 text-sm">Postseason</span>
                    <span className="text-white text-sm">{b.postseason2025}</span>
                  </div>
                  <div>
                    <span className="text-white/40 text-sm block mb-2">Key Players</span>
                    <div className="flex flex-wrap gap-2">
                      {b.keyPlayers.map((p) => (
                        <span key={p} className="text-xs bg-white/5 px-2 py-1 rounded text-white/60">{p}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-white/40 text-sm block mb-1">BSI Outlook</span>
                    <p className="text-white/50 text-sm leading-relaxed">{b.outlook}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Verdict */}
            <Card variant="default" padding="lg" className="mt-8 border-burnt-orange/20">
              <h2 className="font-display text-xl font-bold uppercase tracking-wide text-burnt-orange mb-3 text-center">
                BSI Verdict
              </h2>
              <div className="text-center">
                {a.tier === b.tier ? (
                  <p className="text-white/60">
                    Both squads are <span className="text-white font-semibold">{getTierLabel(a.tier)}</span> tier.
                    This one comes down to matchups and who peaks in June.
                  </p>
                ) : (
                  <p className="text-white/60">
                    <span className="text-white font-semibold">{higher === 'left' ? nameA : nameB}</span> holds
                    the edge as a <span className="text-white font-semibold">{getTierLabel(higher === 'left' ? a.tier : b.tier)}</span>,
                    but <span className="text-white font-semibold">{higher === 'left' ? nameB : nameA}</span> at
                    the <span className="text-white font-semibold">{getTierLabel(higher === 'left' ? b.tier : a.tier)}</span> level
                    has the talent to flip the script.
                  </p>
                )}
              </div>
              <div className="mt-6 flex justify-center gap-4">
                <Link href="/college-baseball/compare" className="text-sm text-burnt-orange hover:text-ember transition-colors">
                  Compare Other Teams
                </Link>
                <Link href="/college-baseball" className="text-sm text-white/40 hover:text-white transition-colors">
                  Back to College Baseball
                </Link>
              </div>
            </Card>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
