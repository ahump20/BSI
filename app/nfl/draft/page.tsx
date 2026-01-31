import { ComingSoon } from '@/components/ui/ComingSoon';
import { Footer } from '@/components/layout-ds/Footer';

export const metadata = { title: 'NFL Draft | Blaze Sports Intel' };

export default function NFLDraftPage() {
  return (
    <>
      <ComingSoon title="Draft" sport="NFL" backHref="/nfl" />
      <Footer />
    </>
  );
}
