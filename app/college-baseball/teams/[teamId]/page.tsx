import TeamDetailClient from './TeamDetailClient';

// Generate static params for static export
export function generateStaticParams() {
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
