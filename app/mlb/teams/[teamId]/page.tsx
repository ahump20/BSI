import TeamDetailClient from './TeamDetailClient';

// Generate static params for static export
export function generateStaticParams() {
  // Pre-generate all 30 MLB team pages
  const teams = [
    'bal',
    'bos',
    'nyy',
    'tb',
    'tor', // AL East
    'cws',
    'cle',
    'det',
    'kc',
    'min', // AL Central
    'hou',
    'laa',
    'oak',
    'sea',
    'tex', // AL West
    'atl',
    'mia',
    'nym',
    'phi',
    'wsh', // NL East
    'chc',
    'cin',
    'mil',
    'pit',
    'stl', // NL Central
    'ari',
    'col',
    'lad',
    'sd',
    'sf', // NL West
  ];

  return teams.map((teamId) => ({ teamId }));
}

interface PageProps {
  params: Promise<{ teamId: string }>;
}

export default async function TeamDetailPage({ params }: PageProps) {
  const { teamId } = await params;
  return <TeamDetailClient teamId={teamId} />;
}
