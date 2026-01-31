import { ComingSoon } from '@/components/ui/ComingSoon';
import { Footer } from '@/components/layout-ds/Footer';

export const metadata = { title: 'NBA Schedule | Blaze Sports Intel' };

export default function NBASchedulePage() {
  return (
    <>
      <ComingSoon title="Schedule" sport="NBA" backHref="/nba" />
      <Footer />
    </>
  );
}
