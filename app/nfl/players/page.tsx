import { ComingSoon } from '@/components/ui/ComingSoon';
import { Footer } from '@/components/layout-ds/Footer';

export const metadata = { title: 'NFL Players | Blaze Sports Intel' };

export default function NFLPlayersPage() {
  return (
    <>
      <ComingSoon title="Players" sport="NFL" backHref="/nfl" />
      <Footer />
    </>
  );
}
