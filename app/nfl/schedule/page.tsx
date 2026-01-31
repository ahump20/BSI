import { ComingSoon } from '@/components/ui/ComingSoon';
import { Footer } from '@/components/layout-ds/Footer';

export const metadata = { title: 'NFL Schedule | Blaze Sports Intel' };

export default function NFLSchedulePage() {
  return (
    <>
      <ComingSoon title="Schedule" sport="NFL" backHref="/nfl" />
      <Footer />
    </>
  );
}
