import type { Metadata } from 'next';
import TexasScoutingClient from './TexasScoutingClient';
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
    title: `Texas vs ${name} Scouting Report | BSI`,
    description: `AI-generated scouting report for Texas Longhorns vs ${name} — offense, pitching, key matchups, and game plan.`,
    openGraph: {
      title: `Texas vs ${name} Scouting Report`,
      description: `Pre-series intelligence brief for Texas Longhorns baseball.`,
      type: 'website',
    },
  };
}

interface PageProps {
  params: Promise<{ opponentId: string }>;
}

export default async function TexasScoutingPage({ params }: PageProps) {
  const { opponentId } = await params;
  return <TexasScoutingClient opponentId={opponentId} />;
}
