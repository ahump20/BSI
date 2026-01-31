import { ComingSoon } from '@/components/ui/ComingSoon';
import { Footer } from '@/components/layout-ds/Footer';

export const metadata = { title: 'MLB Schedule | Blaze Sports Intel' };

export default function MLBSchedulePage() {
  return (
    <>
      <ComingSoon title="Schedule" sport="MLB" backHref="/mlb" />
      <Footer />
    </>
  );
}
