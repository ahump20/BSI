import TeamReadoutClient from './TeamReadoutClient';
import { teamMetadata } from '@/lib/data/team-metadata';

/**
 * Derive static params from the canonical teamMetadata registry.
 * Every team with a detail page gets a readout page.
 */
export async function generateStaticParams() {
  return Object.keys(teamMetadata).map((teamId) => ({ teamId }));
}

export default async function TeamReadoutPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  return <TeamReadoutClient teamId={teamId} />;
}
