import CFBPlayerDetailClient from './CFBPlayerDetailClient';

export const dynamic = 'force-static';
export const dynamicParams = false;

export async function generateStaticParams() {
  return [{ playerId: 'placeholder' }];
}

interface PageProps {
  params: Promise<{ playerId: string }>;
}

export default async function CFBPlayerDetailPage({ params }: PageProps) {
  const { playerId } = await params;
  return <CFBPlayerDetailClient playerId={playerId} />;
}
