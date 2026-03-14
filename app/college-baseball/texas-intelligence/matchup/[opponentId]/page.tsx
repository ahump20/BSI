import type { Metadata } from 'next';
import MatchupTheaterClient from './MatchupTheaterClient';
import { texasOpponentParams } from '@/lib/generate-static-params';

export const dynamic = 'force-static';
export const dynamicParams = false;

export async function generateStaticParams() {
  return texasOpponentParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ opponentId: string }>;
}): Promise<Metadata> {
  const { opponentId } = await params;
  const name = opponentId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return {
    title: `Texas vs ${name} Matchup | BSI`,
    description: `Head-to-head matchup breakdown: Texas Longhorns vs ${name} — batting, pitching, key players, and series history.`,
    openGraph: {
      title: `Texas vs ${name} Matchup Theater`,
      description: `Side-by-side intelligence breakdown for Texas Longhorns baseball.`,
      type: 'website',
    },
  };
}

interface PageProps {
  params: Promise<{ opponentId: string }>;
}

export default async function MatchupPage({ params }: PageProps) {
  const { opponentId } = await params;
  return <MatchupTheaterClient opponentId={opponentId} />;
}
