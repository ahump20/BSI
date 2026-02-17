import type { Metadata } from 'next';
import { TeamDossierClient } from './TeamDossierClient';

// ---------------------------------------------------------------------------
// Seed slugs for static export
// ---------------------------------------------------------------------------

const SEED_SLUGS = ['texas-2026', 'tcu-2026', 'ucla-2026'];

const SEED_META: Record<string, { title: string; description: string }> = {
  'texas-2026': {
    title: 'Texas Longhorns | BSI Team Dossier',
    description: 'Texas has the rotation depth, offensive firepower, and defensive polish to reach Omaha.',
  },
  'tcu-2026': {
    title: 'TCU Horned Frogs | BSI Team Dossier',
    description: 'TCU profiles as a regional host and potential super regional team.',
  },
  'ucla-2026': {
    title: 'UCLA Bruins | BSI Team Dossier',
    description: 'UCLA has the deepest roster in the Big Ten and arguably the best rotation in college baseball by depth.',
  },
};

export function generateStaticParams() {
  return SEED_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const meta = SEED_META[slug];
  if (!meta) {
    return { title: 'Team Dossier | BSI Intel' };
  }
  return { title: meta.title, description: meta.description };
}

export default async function TeamDossierPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <TeamDossierClient slug={slug} />;
}
