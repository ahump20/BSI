import { Metadata } from 'next';
import CFBPageClient from './CFBPageClient';

export const metadata: Metadata = {
  title: 'College Football | Blaze Sports Intel',
  description:
    'NCAA Division I FBS college football coverage with conference standings, scores, rankings, and analytics for all Power 4 and Group of 5 programs.',
  openGraph: {
    title: 'College Football | Blaze Sports Intel',
    description: 'NCAA Division I FBS football coverage with standings and analytics.',
    url: 'https://blazesportsintel.com/cfb',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'College Football | Blaze Sports Intel',
    description: 'NCAA Division I FBS football coverage with standings and analytics.',
  },
};

export default function CFBPage() {
  return <CFBPageClient />;
}
