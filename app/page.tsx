import Link from 'next/link';
import { HeroSectionWrapper } from '@/components/hero/HeroSectionWrapper';
import { SportsGrid } from '@/components/sports/SportsGrid';
import { QuoteBlock } from '@/components/ui/QuoteBlock';
import { Footer } from '@/components/layout/Footer';
import { IntelTicker } from '@/components/cinematic';

export const metadata = {
  title: 'Blaze Sports Intel | Born to Blaze the Path Less Beaten',
  description: 'Real sports intelligence for fans who deserve better. MLB, NFL, NBA, and NCAA analytics built by someone who got tired of waiting for ESPN to care.',
};

const tickerItems = [
  { id: '1', content: '300+ D1 Baseball Programs Tracked', type: 'default' as const },
  { id: '2', content: 'Live Scores: 30-Second Updates', type: 'live' as const },
  { id: '3', content: 'MLB • NFL • NBA • NCAA Coverage', type: 'default' as const },
  { id: '4', content: 'Enterprise API Access Available', type: 'default' as const },
  { id: '5', content: 'NIL Valuation: 5,200+ Athletes', type: 'default' as const },
  { id: '6', content: 'Transfer Portal Intel Updated Daily', type: 'live' as const },
];

export default function HomePage() {
  return (
    <main id="main-content" className="min-h-screen bg-true-black">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-true-black/90 backdrop-blur-md z-50 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-xl font-display font-bold text-burnt-orange-500">
              BSI
            </Link>
            <div className="hidden md:flex gap-8">
              <Link href="/college-baseball" className="text-white/60 hover:text-white transition-colors text-sm font-medium">
                College Baseball
              </Link>
              <Link href="/mlb" className="text-white/60 hover:text-white transition-colors text-sm font-medium">
                MLB
              </Link>
              <Link href="/nfl" className="text-white/60 hover:text-white transition-colors text-sm font-medium">
                NFL
              </Link>
              <Link href="/nba" className="text-white/60 hover:text-white transition-colors text-sm font-medium">
                NBA
              </Link>
              <Link href="/about" className="text-white/60 hover:text-white transition-colors text-sm font-medium">
                About
              </Link>
            </div>
            <Link
              href="/pricing"
              className="bg-burnt-orange-500 hover:bg-burnt-orange-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Intel Ticker - Business Stats */}
      <div className="fixed top-16 left-0 right-0 z-40">
        <IntelTicker
          items={tickerItems}
          speed={25}
          variant="accent"
        />
      </div>

      {/* Hero Section - Full viewport with new design */}
      <HeroSectionWrapper />

      {/* Sports Coverage Grid */}
      <SportsGrid />

      {/* Steinbeck Quote Section */}
      <QuoteBlock
        quote="Texas is a state of mind. Texas is an obsession. Above all, Texas is a nation in every sense of the word."
        author="John Steinbeck"
      />

      {/* Ready to Blaze CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-charcoal-950">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
            Ready to Blaze?
          </h2>
          <p className="text-lg text-white/60 mb-10 max-w-2xl mx-auto">
            Join fans, coaches, and analysts who chose better coverage.
            Real data. Zero bias. The intelligence you deserve.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/pricing"
              className="px-8 py-4 bg-burnt-orange-500 hover:bg-burnt-orange-600 text-white font-semibold text-lg rounded-lg transition-all duration-300 hover:shadow-glow-md"
            >
              View Pricing
            </Link>
            <Link
              href="/about"
              className="px-8 py-4 border border-white/30 hover:border-burnt-orange-500 text-white hover:text-burnt-orange-400 font-semibold text-lg rounded-lg transition-all duration-300"
            >
              Our Story
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </main>
  );
}
