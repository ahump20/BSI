import NFLTeamDetailClient from './NFLTeamDetailClient';

// Generate static params for static export
export function generateStaticParams() {
  // Pre-generate all 32 NFL team pages
  const teams = [
    'cardinals',
    'falcons',
    'ravens',
    'bills',
    'panthers',
    'bears',
    'bengals',
    'browns',
    'cowboys',
    'broncos',
    'lions',
    'packers',
    'texans',
    'colts',
    'jaguars',
    'chiefs',
    'raiders',
    'chargers',
    'rams',
    'dolphins',
    'vikings',
    'patriots',
    'saints',
    'giants',
    'jets',
    'eagles',
    'steelers',
    '49ers',
    'seahawks',
    'buccaneers',
    'titans',
    'commanders',
  ];

  return teams.map((teamId) => ({ teamId }));
}

interface PageProps {
  params: Promise<{ teamId: string }>;
}

export default async function NFLTeamPage({ params }: PageProps) {
  const { teamId } = await params;
  return <NFLTeamDetailClient teamId={teamId} />;
}
