import { Metadata } from 'next';
import PitchVisualization from '../../../../components/visualization/PitchVisualization';

export const metadata: Metadata = {
  title: '3D Pitch Visualization | Blaze Sports Intel',
  description: 'Physics-accurate 3D pitch visualization with real-time trajectory rendering',
};

interface VisualizationPageProps {
  params: Promise<{
    gameId: string;
  }>;
}

export default async function VisualizationPage({ params }: VisualizationPageProps) {
  const { gameId } = await params;

  return <PitchVisualization gameId={gameId} />;
}
