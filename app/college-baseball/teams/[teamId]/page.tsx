import type { Metadata } from 'next';
import { COLLEGE_BASEBALL_TEAMS, getTeamBySlug } from '@/lib/college-baseball/team-registry';
import TeamProfilePage from './TeamProfilePage';

export const dynamic = 'force-static';
export const dynamicParams = false;

export async function generateStaticParams() {
  return COLLEGE_BASEBALL_TEAMS.map((team) => ({ teamId: team.slug }));
}

interface PageProps {
  params: Promise<{ teamId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { teamId } = await params;
  const team = getTeamBySlug(teamId);
  if (!team) return { title: 'Team | Blaze Sports Intel' };

  return {
    title: `${team.name} ${team.mascot} Baseball | Blaze Sports Intel`,
    description: `${team.name} ${team.mascot} college baseball program profile. ${team.conference} conference. ${team.venue.name}, ${team.location.city}, ${team.location.state}. Scouting grades, season stats, and analytics.`,
    openGraph: {
      title: `${team.name} ${team.mascot} Baseball`,
      description: `College baseball analytics for the ${team.name} ${team.mascot}. ${team.conference} conference.`,
    },
  };
}

export default async function TeamDetailPage({ params }: PageProps) {
  const { teamId } = await params;
  return <TeamProfilePage teamId={teamId} />;
}
