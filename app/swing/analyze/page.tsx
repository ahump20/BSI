import type { Metadata } from 'next';
import SwingAnalysisClient from '../SwingAnalysisClient';

export const metadata: Metadata = {
  title: 'Analyze Your Swing | BSI Swing Intelligence',
  description:
    'Upload your swing video and get AI-powered biomechanical analysis across 12 dimensions. Baseball, fast-pitch, and slow-pitch softball.',
  openGraph: {
    title: 'Analyze Your Swing | BSI Swing Intelligence',
    description:
      'AI swing analysis with 33-landmark pose estimation, 12-dimension scoring, and conversational AI coaching.',
    type: 'website',
  },
};

export default function SwingAnalyzePage() {
  return <SwingAnalysisClient />;
}
