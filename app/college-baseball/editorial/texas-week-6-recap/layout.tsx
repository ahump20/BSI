import type { Metadata } from 'next';
import { ogImage } from '@/lib/metadata';

export const metadata: Metadata = {
  title: 'Texas Week 6: Punched, Then Answered | Blaze Sports Intel',
  description:
    'Texas took 2-of-3 at No. 5 Auburn after a crushing Friday walk-off loss. Aiden Robbins hit 3 home runs. Sunday was the program\'s first-ever SEC shutout. Texas is 20-3, No. 2 nationally, No. 1 RPI. Full series recap, SEC landscape, and Oklahoma preview.',
  openGraph: {
    title: 'Texas Week 6: Punched, Then Answered | Blaze Sports Intel',
    description:
      'Robbins 3 HR, first-ever SEC shutout, and a road series win at No. 5 Auburn. Texas is 20-3 with the No. 1 RPI heading into Oklahoma.',
    type: 'article',
    images: ogImage('/images/og-college-baseball.png'),
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
