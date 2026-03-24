import type { Metadata } from 'next';
import PlayByPlayClient from './PlayByPlayClient';

// Force static generation with dynamic params disabled
export const dynamic = 'force-static';
export const dynamicParams = false;

export async function generateStaticParams() {
  return [{ gameId: 'placeholder' }];
}

export async function generateMetadata({ params }: { params: Promise<{ gameId: string }> }): Promise<Metadata> {
  const { gameId } = await params;
  return {
    title: `CFB Game Play-by-Play | College Football | Blaze Sports Intel`,
    description: `College football game play-by-play on Blaze Sports Intel.`,
    alternates: { canonical: `/cfb/game/${gameId}/play-by-play` },
  };
}

export default function PlayByPlayPage() {
  return <PlayByPlayClient />;
}
