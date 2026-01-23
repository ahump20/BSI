import PlayByPlayClient from './PlayByPlayClient';

export function generateStaticParams() {
  return [{ gameId: 'placeholder' }];
}

export default function CFBPlayByPlayPage() {
  return <PlayByPlayClient />;
}
