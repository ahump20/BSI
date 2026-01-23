import BoxScoreClient from './BoxScoreClient';

export function generateStaticParams() {
  return [];
}

export default function NBABoxScorePage() {
  return <BoxScoreClient />;
}
