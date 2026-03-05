import type { Metadata } from 'next';
import { SocialIntelPageClient } from './SocialIntelPageClient';

export const metadata: Metadata = {
  title: 'Social Intelligence | College Baseball | Blaze Sports Intel',
  description:
    'Real-time social signals from Reddit and Twitter — injury updates, transfer portal moves, recruiting news, and fan sentiment across D1 college baseball.',
  openGraph: {
    title: 'Social Intelligence — College Baseball',
    description: 'Live injury, portal, and recruiting signals from the social web.',
  },
};

export default function SocialIntelPage() {
  return <SocialIntelPageClient />;
}
