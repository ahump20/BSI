import CFBTeamDetailClient from './CFBTeamDetailClient';

export const dynamic = 'force-static';
export const dynamicParams = false;

export async function generateStaticParams() {
  return [{ teamId: 'placeholder' }];
}

interface PageProps {
  params: Promise<{ teamId: string }>;
}

export default async function CFBTeamDetailPage({ params }: PageProps) {
  const { teamId } = await params;
  return <CFBTeamDetailClient teamId={teamId} />;
}
