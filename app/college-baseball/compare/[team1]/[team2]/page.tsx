import type { Metadata } from 'next';
import { ogImage } from '@/lib/metadata';
import { preseason2026 } from '@/lib/data/preseason-2026';
import ComparePageClient from './ComparePageClient';

/**
 * Curated rivalries — pre-generated at build time for SEO.
 */
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

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams(): Array<{ team1: string; team2: string }> {
  const slugs = Object.keys(preseason2026);
  const params: { team1: string; team2: string }[] = [];

  // Placeholder shell for Worker proxy fallback (dynamic team pairs)
  params.push({ team1: 'placeholder', team2: 'placeholder' });

  // Curated rivalries
  for (const [a, b] of rivalries) {
    if (preseason2026[a] && preseason2026[b]) {
      params.push({ team1: a, team2: b });
      params.push({ team1: b, team2: a });
    }
  }

  // Top-25 cross-conference matchups for discovery
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

function slugToDisplayName(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

interface PageProps {
  params: Promise<{ team1: string; team2: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { team1, team2 } = await params;

  // Generic metadata for placeholder — client component will render correctly
  if (team1 === 'placeholder' || team2 === 'placeholder') {
    return {
      title: 'Team Comparison | College Baseball | Blaze Sports Intel',
      description: 'Compare any two D1 college baseball programs head-to-head with advanced sabermetrics.',
    };
  }

  const nameA = slugToDisplayName(team1);
  const nameB = slugToDisplayName(team2);
  const a = preseason2026[team1];
  const b = preseason2026[team2];

  const rankInfo = a && b ? `#${a.rank} vs #${b.rank} — ` : '';
  const title = `${nameA} vs ${nameB} — BSI Head-to-Head`;
  const description = `${rankInfo}${nameA} vs ${nameB}. Compare advanced sabermetrics, records, and roster data side by side on Blaze Sports Intel.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: ogImage('/images/og-college-baseball.png', `${nameA} vs ${nameB}`),
    },
    twitter: { card: 'summary_large_image', title, description },
    alternates: { canonical: `/college-baseball/compare/${team1}/${team2}` },
  };
}

export default async function ComparisonPage({ params }: PageProps) {
  // We don't use params here — the client component reads the real slugs
  // from window.location, which handles both pre-generated pairs and
  // dynamic pairs served via Worker proxy fallback.
  void (await params);

  return <ComparePageClient />;
}
