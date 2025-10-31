import { Metadata } from 'next';
import PitchVisualization from '../../../components/visualization/PitchVisualization';

export const metadata: Metadata = {
  title: '3D Pitch Visualization | Blaze Sports Intel',
  description: 'Physics-accurate 3D pitch visualization with real-time trajectory rendering, spin particle effects, and interactive heat maps. Mobile-optimized at 60fps.',
  keywords: ['baseball', 'pitch visualization', '3D', 'statcast', 'pitch tracking', 'spin rate', 'velocity'],
  openGraph: {
    title: '3D Pitch Visualization | Blaze Sports Intel',
    description: 'Experience broadcast-quality 3D pitch visualization with physics-accurate trajectories',
    type: 'website',
  },
};

export default function VisualizationPage() {
  // For demo purposes, using a sample game ID
  // In production, this would come from URL params or game selection
  const gameId = 'demo_game_2024';

  return <PitchVisualization gameId={gameId} />;
}
