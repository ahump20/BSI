import type { Metadata } from 'next';
import BoxScoreClient from './BoxScoreClient';

// Force static generation with dynamic params disabled
export const dynamic = 'force-static';
export const dynamicParams = false;

export async function generateStaticParams() {
  return [{ gameId: 'placeholder' }];
}

export async function generateMetadata({ params }: { params: Promise<{ gameId: string }> }): Promise<Metadata> {
  const { gameId } = await params;
  return {
    title: `CFB Game Box Score | College Football | Blaze Sports Intel`,
    description: `College football game box score and stats on Blaze Sports Intel.`,
    alternates: { canonical: `/cfb/game/${gameId}/box-score` },
  };
}

export default function BoxScorePage() {
  return <BoxScoreClient />;
}
