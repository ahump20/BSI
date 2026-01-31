/**
 * Transfer Portal Team Detail Page (Server Component)
 */

import TeamDetailClient from './TeamDetailClient';

export function generateStaticParams() {
  return [];
}

export const metadata = {
  title: 'Team Portal Activity | Transfer Portal | BSI',
  description: 'Inbound and outbound transfer portal activity for this team on Blaze Sports Intel.',
};

interface PageProps {
  params: Promise<{ teamId: string }>;
}

export default async function TeamDetailPage({ params }: PageProps) {
  const { teamId } = await params;
  return <TeamDetailClient teamId={teamId} />;
}
