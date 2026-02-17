import TeamDetailClient from './TeamDetailClient';
import { nbaTeamParams } from '@/lib/generate-static-params';

export const dynamic = 'force-static';
export const dynamicParams = false;

// Fetches all 30 NBA team IDs from the Worker at build time.
export async function generateStaticParams() {
  return nbaTeamParams();
}

interface PageProps {
  params: Promise<{ teamId: string }>;
}

export default async function NBATeamDetailPage({ params }: PageProps) {
  const { teamId } = await params;
  return <TeamDetailClient teamId={teamId} />;
}
