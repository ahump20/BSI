import TeamDetailClient from './TeamDetailClient';
import { MLB_TEAMS } from '@/lib/utils/mlb-teams';

// Force static generation with dynamic params disabled
export const dynamic = 'force-static';
export const dynamicParams = false;

// Generate static params from canonical MLB_TEAMS slugs
export async function generateStaticParams() {
  return MLB_TEAMS.map((team) => ({ teamId: team.slug }));
}

interface PageProps {
  params: Promise<{ teamId: string }>;
}

export default async function TeamDetailPage({ params }: PageProps) {
  const { teamId } = await params;
  return <TeamDetailClient teamId={teamId} />;
}
