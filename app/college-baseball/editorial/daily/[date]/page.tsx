import DailyEditorialClient from './DailyEditorialClient';
import { dailyEditorialDateParams } from '@/lib/generate-static-params';

export const dynamic = 'force-static';
export const dynamicParams = false;

// Pre-builds last 30 days of editorial dates (YYYY-MM-DD).
// No API call needed — dates are deterministic from build time.
export function generateStaticParams() {
  return dailyEditorialDateParams();
}

export default function DailyEditorialPage() {
  return <DailyEditorialClient />;
}
