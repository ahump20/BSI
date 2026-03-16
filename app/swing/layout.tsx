import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Swing Intel | BSI',
  description:
    'AI-powered swing analysis — upload video to get bat path, attack angle, and timing metrics with personalized improvement recommendations.',
  openGraph: {
    title: 'Swing Intel | BSI',
    description: 'AI-powered swing analysis and hitting mechanics.',
  },
};

export default function SwingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
