import type { Metadata } from 'next';
import TexasPlayerProfileClient from './TexasPlayerProfileClient';
import { texasPlayerParams } from '@/lib/generate-static-params';

export const dynamic = 'force-static';
export const dynamicParams = false;

export async function generateStaticParams() {
  return texasPlayerParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ playerId: string }>;
}): Promise<Metadata> {
  const { playerId } = await params;
  return {
    title: `Texas Player Profile #${playerId} | BSI`,
    description: 'Advanced sabermetrics, game log, radar chart, and HAV-F evaluation for a Texas Longhorns baseball player.',
    openGraph: {
      title: `Texas Player Profile | Blaze Sports Intel`,
      description: 'Deep analytics on individual Texas Longhorns baseball players.',
      type: 'website',
    },
  };
}

interface PageProps {
  params: Promise<{ playerId: string }>;
}

export default async function TexasPlayerProfilePage({ params }: PageProps) {
  const { playerId } = await params;
  return <TexasPlayerProfileClient playerId={playerId} />;
}
