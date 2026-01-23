import BoxScoreClient from './BoxScoreClient';

export function generateStaticParams() {
  return [{ gameId: 'placeholder' }];
}

export default function CBBBoxScorePage() {
  return <BoxScoreClient />;
}
