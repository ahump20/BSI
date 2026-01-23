import RecapClient from './RecapClient';

export function generateStaticParams() {
  return [{ gameId: 'placeholder' }];
}

export default function CFBRecapPage() {
  return <RecapClient />;
}
