import type { Metadata } from 'next';
import { GameBriefClient } from './GameBriefClient';

// ---------------------------------------------------------------------------
// Seed data for static export + metadata
// ---------------------------------------------------------------------------

const SEED_SLUGS = ['texas-uc-davis-opener-2026'];

const SEED_META: Record<string, { title: string; description: string }> = {
  'texas-uc-davis-opener-2026': {
    title: 'Texas 13, UC Davis 2: Volantis Sets the Tone | BSI Intel',
    description: 'The Longhorns opened the 2026 season with a 13-2 dismantling of UC Davis behind a dominant start from Lucas Volantis.',
  },
};

export function generateStaticParams() {
  return SEED_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const meta = SEED_META[slug];
  if (!meta) {
    return { title: 'Game Brief | BSI Intel' };
  }
  return { title: meta.title, description: meta.description };
}

export default async function GameBriefPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <GameBriefClient slug={slug} />;
}
