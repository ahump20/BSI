import NFLTeamDetailClient, { NFL_TEAMS } from './NFLTeamDetailClient';

// Generate static params for all 32 NFL teams
export function generateStaticParams() {
  return Object.keys(NFL_TEAMS).map((teamId) => ({
    teamId,
  }));
}

interface PageProps {
  params: Promise<{ teamId: string }>;
}

export default async function NFLTeamPage({ params }: PageProps) {
  const { teamId } = await params;
  return <NFLTeamDetailClient teamId={teamId} />;
}
