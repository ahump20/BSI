import type { Metadata } from 'next';
import TeamStatsClient from './TeamStatsClient';

// Force static generation with dynamic params disabled
export const dynamic = 'force-static';
export const dynamicParams = false;

export async function generateStaticParams() {
  return [{ gameId: 'placeholder' }];
}

export async function generateMetadata({ params }: { params: Promise<{ gameId: string }> }): Promise<Metadata> {
  const { gameId } = await params;
  return {
    title: `CFB Game Team Stats | College Football | Blaze Sports Intel`,
    description: `College football game team statistics and performance data on Blaze Sports Intel.`,
    alternates: { canonical: `/cfb/game/${gameId}/team-stats` },
  };
}

export default function TeamStatsPage() {
  return <TeamStatsClient />;
}
