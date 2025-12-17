import NFLTeamDetailClient, { NFL_TEAMS } from './NFLTeamDetailClient';

// Generate static params for all 32 NFL teams
export function generateStaticParams() {
  return Object.keys(NFL_TEAMS).map((teamId) => ({
    teamId,
  }));
}

export default function NFLTeamPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  // For Next.js 15+, params is a Promise
  // We need to handle this properly
  return <NFLTeamPageWrapper params={params} />;
}

async function NFLTeamPageWrapper({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  return <NFLTeamDetailClient teamId={teamId} />;
}
