import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Footer } from '@/components/layout-ds/Footer';

const POOL_DATA = {
  a: {
    id: 'A',
    venue: 'Hiram Bithorn Stadium',
    city: 'San Juan, Puerto Rico',
    dates: 'March 7–11, 2026',
    danger: 'MEDIUM',
    description: 'Cuba and Netherlands battle for the second seed behind no clear favorite. Italy\'s heritage roster and Chinese Taipei\'s pitching make this pool competitive top-to-bottom.',
    teams: [
      { name: 'Cuba', rank: 8, titlePct: 4.0, tier: 3 },
      { name: 'Netherlands', rank: 9, titlePct: 3.0, tier: 3 },
      { name: 'Italy', rank: 12, titlePct: 1.0, tier: 3 },
      { name: 'Chinese Taipei', rank: 14, titlePct: 0.5, tier: 4 },
      { name: 'Panama', rank: 15, titlePct: 0.4, tier: 4 },
    ],
    keyRace: 'Cuba vs Netherlands for second seed',
    qfRoute: 'Pool A winner → QF 1 vs Pool D runner-up. Pool A runner-up → QF 2 vs Pool D winner.',
  },
  b: {
    id: 'B',
    venue: 'Minute Maid Park',
    city: 'Houston, Texas',
    dates: 'March 7–11, 2026',
    danger: 'MEDIUM-HIGH',
    description: 'USA enters as the heavy pool favorite with home crowd advantage at Minute Maid Park. Mexico and Canada fight for the second seed in what is the most manageable Tier 1 draw.',
    teams: [
      { name: 'USA', rank: 3, titlePct: 15.0, tier: 1 },
      { name: 'Mexico', rank: 7, titlePct: 5.0, tier: 2 },
      { name: 'Canada', rank: 10, titlePct: 2.0, tier: 3 },
      { name: 'Colombia', rank: 13, titlePct: 0.8, tier: 4 },
      { name: 'Great Britain', rank: 20, titlePct: 0.1, tier: 5 },
    ],
    keyRace: 'Mexico vs Canada for second seed',
    qfRoute: 'Pool B winner → QF 3 vs Pool C runner-up. Pool B runner-up → QF 4 vs Pool C winner.',
  },
  c: {
    id: 'C',
    venue: 'Tokyo Dome',
    city: 'Tokyo, Japan',
    dates: 'March 5–9, 2026',
    danger: 'HIGH',
    description: 'The tournament opens in Tokyo with Japan defending at home. South Korea represents the only realistic threat to Japan\'s pool dominance. Both teams have championship ceiling; only two advance.',
    teams: [
      { name: 'Japan', rank: 1, titlePct: 22.0, tier: 1 },
      { name: 'South Korea', rank: 6, titlePct: 8.0, tier: 2 },
      { name: 'Australia', rank: 11, titlePct: 1.5, tier: 3 },
      { name: 'Czech Republic', rank: 17, titlePct: 0.3, tier: 5 },
      { name: 'China', rank: 19, titlePct: 0.1, tier: 5 },
    ],
    keyRace: 'Japan vs South Korea — only 2 advance, both have championship ceiling',
    qfRoute: 'Pool C winner → QF 4 vs Pool B runner-up. Pool C runner-up → QF 3 vs Pool B winner.',
  },
  d: {
    id: 'D',
    venue: 'LoanDepot Park',
    city: 'Miami, Florida',
    dates: 'March 7–11, 2026',
    danger: 'POOL OF DEATH',
    description: 'Dominican Republic (#2), Venezuela (#4), and Puerto Rico (#5) combine for 37% of championship probability in the BSI model. All three play Pool D Miami. Only two advance. This is where the bracket brutalizes itself before the knockout rounds even start.',
    teams: [
      { name: 'Dominican Republic', rank: 2, titlePct: 18.0, tier: 1 },
      { name: 'Venezuela', rank: 4, titlePct: 10.0, tier: 2 },
      { name: 'Puerto Rico', rank: 5, titlePct: 9.0, tier: 2 },
      { name: 'Israel', rank: 16, titlePct: 0.3, tier: 4 },
      { name: 'Nicaragua', rank: 18, titlePct: 0.1, tier: 5 },
    ],
    keyRace: 'Dominican Republic + Venezuela + Puerto Rico — one of the three doesn\'t advance',
    qfRoute: 'Pool D winner → QF 2 vs Pool A runner-up. Pool D runner-up → QF 1 vs Pool A winner.',
  },
} as const;

type PoolKey = keyof typeof POOL_DATA;

export function generateStaticParams() {
  return (['a', 'b', 'c', 'd'] as PoolKey[]).map((pool) => ({ pool }));
}

export async function generateMetadata({ params }: { params: Promise<{ pool: string }> }): Promise<Metadata> {
  const { pool } = await params;
  const key = pool.toLowerCase() as PoolKey;
  const data = POOL_DATA[key];
  if (!data) return { title: 'Pool Not Found | BSI' };

  return {
    title: `WBC 2026 Pool ${data.id} — ${data.city} | Blaze Sports Intel`,
    description: `WBC 2026 Pool ${data.id} at ${data.venue}, ${data.city} (${data.dates}). ${data.description}`,
  };
}

export default async function PoolPage({ params }: { params: Promise<{ pool: string }> }) {
  const { pool } = await params;
  const key = pool.toLowerCase() as PoolKey;
  const data = POOL_DATA[key];

  if (!data) notFound();

  const isDeath = data.id === 'D';

  return (
    <div className="min-h-screen bg-midnight">
      {/* Header */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-b border-border-subtle">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/wbc"
            className="inline-flex items-center gap-2 text-text-muted hover:text-burnt-orange transition-colors text-sm mb-6"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            WBC 2026
          </Link>

          <div className="flex items-start gap-4 mb-4">
            <span className="font-display text-6xl font-bold text-burnt-orange">
              Pool {data.id}
            </span>
            <span
              className={`mt-2 text-xs font-bold px-2 py-1 rounded border ${
                isDeath
                  ? 'text-ember bg-ember/10 border-ember/30'
                  : 'text-text-muted bg-surface-light border-border-subtle'
              }`}
            >
              {data.danger}
            </span>
          </div>

          <div className="text-text-secondary mb-2">{data.venue}</div>
          <div className="text-text-muted text-sm">{data.city} · {data.dates}</div>
        </div>
      </section>

      {/* Content */}
      <section className="py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-text-secondary text-lg leading-relaxed mb-8">{data.description}</p>

          {/* Teams table */}
          <div className="mb-8">
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-text-primary mb-4">
              Teams
            </h2>
            <div className="space-y-3">
              {data.teams.map((team, i) => (
                <div
                  key={team.name}
                  className="flex items-center justify-between p-4 rounded-xl border border-border-subtle bg-surface-light/10"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-text-muted text-sm w-4 tabular-nums">{i + 1}</span>
                    <span className="font-semibold text-text-primary">{team.name}</span>
                    <span className="text-text-muted text-xs">#{team.rank} global</span>
                  </div>
                  <div className="text-right">
                    <div className="text-burnt-orange font-bold tabular-nums">{team.titlePct}%</div>
                    <div className="text-text-muted text-xs">title probability</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Key race and routing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
            <div className="p-5 rounded-xl border border-border-subtle bg-surface-light/5">
              <div className="text-burnt-orange font-semibold text-sm mb-2">Key Race</div>
              <p className="text-text-secondary text-sm">{data.keyRace}</p>
            </div>
            <div className="p-5 rounded-xl border border-border-subtle bg-surface-light/5">
              <div className="text-burnt-orange font-semibold text-sm mb-2">Quarterfinal Routing</div>
              <p className="text-text-secondary text-sm">{data.qfRoute}</p>
            </div>
          </div>

          <p className="text-text-muted text-xs pt-4 border-t border-border-subtle">
            Title probabilities: BSI probability model (200K Monte Carlo simulations) · Pre-tournament baseline · March 4, 2026
          </p>

          <div className="mt-8 flex gap-4">
            <Link
              href="/wbc"
              className="inline-flex items-center gap-2 text-burnt-orange font-semibold hover:text-ember transition-colors"
            >
              ← Back to WBC Hub
            </Link>
            <Link
              href="/wbc#wbc-tabs"
              className="inline-flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors text-sm"
            >
              View all pools →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
