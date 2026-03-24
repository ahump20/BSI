import type { Metadata } from 'next';
import RecapClient from './RecapClient';

// Force static generation with dynamic params disabled
export const dynamic = 'force-static';
export const dynamicParams = false;

export async function generateStaticParams() {
  return [{ gameId: 'placeholder' }];
}

export async function generateMetadata({ params }: { params: Promise<{ gameId: string }> }): Promise<Metadata> {
  const { gameId } = await params;
  return {
    title: `CFB Game Recap | College Football | Blaze Sports Intel`,
    description: `College football game recap and highlights on Blaze Sports Intel.`,
    alternates: { canonical: `/cfb/game/${gameId}/recap` },
  };
}

export default function RecapPage() {
  return <RecapClient />;
}
