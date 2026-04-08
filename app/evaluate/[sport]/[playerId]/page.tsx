import type { Metadata } from 'next';
import PlayerEvaluationClient from './PlayerEvaluationClient';

export const dynamic = 'force-static';
export const dynamicParams = false;

export async function generateStaticParams() {
  return [{ sport: 'placeholder', playerId: 'placeholder' }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sport: string; playerId: string }>;
}): Promise<Metadata> {
  const { sport, playerId } = await params;

  const sportLabel =
    sport === 'college-baseball'
      ? 'College Baseball'
      : sport.toUpperCase();

  const name = playerId
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const title = `${name} | ${sportLabel} Player Evaluation | Blaze Sports Intel`;
  const description = `${name} ${sportLabel} evaluation — percentile rankings, advanced metrics, and scouting profile. Player Evaluation by Blaze Sports Intel.`;

  return {
    title,
    description,
    openGraph: { title, description },
    alternates: { canonical: `/evaluate/${sport}/${playerId}` },
  };
}

export default function PlayerEvaluationPage() {
  return <PlayerEvaluationClient />;
}
