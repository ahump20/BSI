import TeamDetailClient from './TeamDetailClient';
// Force static generation with dynamic params disabled
export const dynamic = 'force-static';
export const dynamicParams = false;

// Generate static params for static export
export async function generateStaticParams() {
  // Return common team IDs for static generation
  // Additional teams will be handled client-side via the teams API
  const teams = [
    // SEC
    'texas', 'texas-am', 'lsu', 'florida', 'tennessee', 'arkansas',
    'vanderbilt', 'ole-miss', 'georgia', 'auburn', 'alabama',
    'mississippi-state', 'south-carolina', 'kentucky', 'missouri', 'oklahoma',
    // ACC
    'wake-forest', 'virginia', 'clemson', 'north-carolina', 'nc-state',
    'duke', 'louisville', 'miami', 'florida-state', 'stanford', 'california',
    // Big 12
    'tcu', 'texas-tech', 'oklahoma-state', 'baylor', 'west-virginia',
    'kansas-state', 'arizona', 'arizona-state', 'kansas', 'byu', 'ucf',
    'houston', 'cincinnati', 'utah',
    // Big Ten
    'ucla', 'usc', 'indiana', 'maryland', 'michigan', 'ohio-state',
    'penn-state', 'rutgers', 'nebraska', 'minnesota', 'iowa', 'illinois',
    'northwestern', 'purdue', 'michigan-state',
    // Pac-12
    'oregon-state',
    // Other ranked
    'oregon', 'washington',
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
