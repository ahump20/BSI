import PlayByPlayClient from './PlayByPlayClient';
// Force static generation with dynamic params disabled
export const dynamic = 'force-static';
export const dynamicParams = false;

export async function generateStaticParams() {
  return [{ gameId: 'placeholder' }];
}

export default function PlayByPlayPage() {
  return <PlayByPlayClient />;
}
