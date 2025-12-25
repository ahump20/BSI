import { Metadata } from 'next';
import CFBPreviewsClient from './CFBPreviewsClient';

export const metadata: Metadata = {
  title: 'CFB Game Previews | Blaze Sports Intel',
  description:
    'In-depth college football game previews with key matchups, trends, and projections. Data-first analysis for all FBS games.',
  openGraph: {
    title: 'CFB Game Previews | Blaze Sports Intel',
    description:
      'In-depth college football game previews with key matchups, trends, and projections.',
    type: 'website',
    siteName: 'Blaze Sports Intel',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CFB Game Previews | Blaze Sports Intel',
    description:
      'In-depth college football game previews with key matchups, trends, and projections.',
  },
};

export default function CFBPreviewsPage() {
  return <CFBPreviewsClient />;
}
