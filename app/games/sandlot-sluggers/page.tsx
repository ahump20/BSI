import { Metadata } from 'next';
import { GameProductPage } from '@/components/games/GameProductPage';

export const metadata: Metadata = {
  title: 'Sandlot Sluggers | BSI Arcade',
  description:
    'Backyard baseball with neighborhood rules. Home run derby, strikeout challenges, and summer memories. Coming soon from BSI Arcade.',
  openGraph: {
    title: 'Sandlot Sluggers | BSI Arcade',
    description: 'Backyard baseball with neighborhood rules. Coming soon.',
    url: 'https://blazesportsintel.com/games/sandlot-sluggers',
    type: 'website',
  },
  alternates: {
    canonical: 'https://blazesportsintel.com/games/sandlot-sluggers',
  },
};

export default function SandlotSluggersPage() {
  return (
    <GameProductPage
      id="sandlot-sluggers"
      title="Sandlot Sluggers"
      tagline="Backyard legends. Neighborhood rules."
      description="Remember playing baseball until the streetlights came on? Sandlot Sluggers captures that feeling. Pick your team from the kids in the neighborhood, argue about ground rules, and swing for the fences. Ghost runners allowed."
      icon="⚾"
      features={[
        'Home Run Derby mode with increasing difficulty',
        'Strikeout Challenge: pitch your way to glory',
        'Neighborhood pickup games with AI teammates',
        'Unlockable backyard venues and equipment',
        'Custom house rules: ghost runners, do-overs, automatic outs',
        'Day-to-dusk gameplay with golden hour lighting',
        'Nostalgic soundtrack and sound effects',
        'Local multiplayer support',
      ]}
    />
  );
}
