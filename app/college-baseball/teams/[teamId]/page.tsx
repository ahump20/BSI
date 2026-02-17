import TeamDetailClient from './TeamDetailClient';
// Force static generation with dynamic params disabled
export const dynamic = 'force-static';
export const dynamicParams = false;

// Generate static params for static export
export async function generateStaticParams() {
  // Return common team IDs for static generation
  // Additional teams will be handled client-side via the teams API
  const teams = [
    'texas',
    'lsu',
    'texas-am',
    'florida',
    'tennessee',
    'arkansas',
    'vanderbilt',
    'ole-miss',
    'georgia',
    'auburn',
    'alabama',
    'mississippi-state',
    'south-carolina',
    'kentucky',
    'missouri',
    'wake-forest',
    'virginia',
    'nc-state',
    'clemson',
    'florida-state',
    'miami',
    'louisville',
    'duke',
    'north-carolina',
    'tcu',
    'texas-tech',
    'oklahoma-state',
    'baylor',
    'west-virginia',
    'kansas-state',
    'oregon-state',
    'stanford',
    'arizona',
    'arizona-state',
    'ucla',
    'usc',
    'oklahoma',
    'california',
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
