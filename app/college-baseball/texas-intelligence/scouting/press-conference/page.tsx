import { Metadata } from 'next';
import PressConferenceAnalyzer from '@/components/editorial/PressConferenceAnalyzer';

export const metadata: Metadata = {
  title: 'Press Conference Analyzer — BSI Texas Intelligence',
  description: 'AI-powered analysis of coach press conferences. Extract lineup signals, health indicators, and rotation philosophy from transcripts.',
  alternates: { canonical: '/college-baseball/texas-intelligence/scouting/press-conference' },
};

export default function PressConferencePage() {
  return <PressConferenceAnalyzer />;
}
