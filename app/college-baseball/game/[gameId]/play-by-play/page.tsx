import CollegePlayByPlayClient from './CollegePlayByPlayClient';
import { cbbGameParams } from '@/lib/generate-static-params';

export const dynamic = 'force-static';
export const dynamicParams = false;

export async function generateStaticParams() {
  return cbbGameParams();
}

export default function CollegePlayByPlayPage() {
  return <CollegePlayByPlayClient />;
}
