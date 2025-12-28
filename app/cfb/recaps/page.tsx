import { Metadata } from 'next';
import CFBRecapsClient from './CFBRecapsClient';

export const metadata: Metadata = {
  title: 'CFB Game Recaps | Blaze Sports Intel',
  description:
    'Post-game breakdowns covering how college football games were decided and what it means going forward. Sharp analysis within hours of final whistles.',
  openGraph: {
    title: 'CFB Game Recaps | Blaze Sports Intel',
    description:
      'Post-game breakdowns covering how college football games were decided.',
    type: 'website',
    siteName: 'Blaze Sports Intel',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CFB Game Recaps | Blaze Sports Intel',
    description:
      'Post-game breakdowns covering how college football games were decided.',
  },
};

export default function CFBRecapsPage() {
  return <CFBRecapsClient />;
}
