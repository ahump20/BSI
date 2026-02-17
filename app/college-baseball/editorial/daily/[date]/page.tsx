import DailyEditorialClient from './DailyEditorialClient';

export const dynamic = 'force-static';
export const dynamicParams = false;

export async function generateStaticParams() {
  return [{ date: 'placeholder' }];
}

export default function DailyEditorialPage() {
  return <DailyEditorialClient />;
}
