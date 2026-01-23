import PlayByPlayClient from './PlayByPlayClient';

export function generateStaticParams() {
  return [{ gameId: 'placeholder' }];
}

export default function CBBPlayByPlayPage() {
  return <PlayByPlayClient />;
}
