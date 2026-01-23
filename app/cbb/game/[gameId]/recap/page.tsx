import RecapClient from './RecapClient';

export function generateStaticParams() {
  return [{ gameId: 'placeholder' }];
}

export default function CBBRecapPage() {
  return <RecapClient />;
}
