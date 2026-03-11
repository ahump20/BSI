'use client';

import { useState, useCallback } from 'react';
import { ScrollReveal } from '@/components/cinematic';
import { HeroSection } from '@/components/home/HeroSection';
import { HomeLiveScores } from '@/components/home/HomeLiveScores';
import { WhyBSI } from '@/components/home/WhyBSI';
import { SavantPreviewStrip } from '@/components/home/SavantPreviewStrip';
import { SportsHub } from '@/components/home/SportsHub';
import { FlagshipProof } from '@/components/home/FlagshipProof';
import { FeatureShowcase } from '@/components/home/FeatureShowcase';
import { EditorialPreview } from '@/components/home/EditorialPreview';
import { TrendingIntelFeed } from '@/components/home/TrendingIntelFeed';
import { QuoteSection } from '@/components/home/QuoteSection';
import { HomeCTA } from '@/components/home/HomeCTA';
import { Footer } from '@/components/layout-ds/Footer';
import { AskBSI } from '@/components/home/AskBSI';
import { PlatformVitals } from '@/components/home/PlatformVitals';
import { DataErrorBoundary } from '@/components/ui/DataErrorBoundary';
import { RecentVisits } from '@/components/home/RecentVisits';

// ────────────────────────────────────────
// Section Break — decorative diamond divider
// ────────────────────────────────────────

function SectionBreak() {
  return (
    <div className="section-break" aria-hidden="true">
      <span className="section-break-diamond" />
    </div>
  );
}

// ────────────────────────────────────────
// Page Component
// ────────────────────────────────────────

export function HomePageClient() {
  const [sportCounts, setSportCounts] = useState<Map<string, { live: number; today: number }>>(new Map());
  const handleCountsChange = useCallback((counts: Map<string, { live: number; today: number }>) => {
    setSportCounts(counts);
  }, []);

  return (
    <div className="min-h-screen grain-overlay">
      {/* ─── 1. Hero ─── */}
      <DataErrorBoundary name="Hero" compact>
        <HeroSection />
      </DataErrorBoundary>

      {/* ─── 1b. Pick up where you left off ─── */}
      <RecentVisits />

      {/* ─── 2. Multi-Sport Live Scores Strip ─── */}
      <DataErrorBoundary name="Live Scores" compact>
        <HomeLiveScores onCountsChange={handleCountsChange} />
      </DataErrorBoundary>

      {/* ─── 3. Why BSI proof band ─── */}
      <WhyBSI />

      {/* ─── 4. Sports Hub — Our Coverage ─── */}
      <SportsHub sportCounts={sportCounts} />

      {/* ─── 5. College Baseball flagship proof ─── */}
      <FlagshipProof />

      {/* ─── 5b. Savant live proof ─── */}
      <DataErrorBoundary name="Savant Preview" compact>
        <SavantPreviewStrip />
      </DataErrorBoundary>

      {/* ─── 6. Feature Showcase — what you can do here ─── */}
      <FeatureShowcase />

      {/* ─── 7. Ask BSI — AI-powered question card ─── */}
      <DataErrorBoundary name="Ask BSI" compact>
        <AskBSI />
      </DataErrorBoundary>

      {/* ─── 8. Editorial Feed (D1-backed) ─── */}
      <DataErrorBoundary name="Editorial">
        <EditorialPreview />
      </DataErrorBoundary>

      {/* ─── 9. Trending Intel Feed ─── */}
      <section
        className="py-14 px-4 sm:px-6 lg:px-8 relative surface-lifted accent-glow-cool-center"
      >
        <div className="max-w-5xl mx-auto">
          <ScrollReveal direction="up">
            <div className="mb-6">
              <span className="heritage-stamp mb-2">Cross-Sport Intel</span>
              <div className="flex items-center gap-3 mt-2">
                <div className="section-rule-thick" />
                <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide" style={{ color: 'var(--bsi-bone)' }}>
                  What&apos;s Happening Now
                </h2>
              </div>
            </div>
            <DataErrorBoundary name="Intel Feed">
              <TrendingIntelFeed />
            </DataErrorBoundary>
          </ScrollReveal>
        </div>
      </section>

      <SectionBreak />

      {/* ─── 10. Garrido + Austin Quote ─── */}
      <QuoteSection />

      <SectionBreak />

      {/* ─── 11. CTA close — daily return framing ─── */}
      <HomeCTA />

      {/* ─── 12. Platform Vitals ─── */}
      <PlatformVitals />

      <SectionBreak />

      {/* ─── 13. Footer ─── */}
      <Footer />
    </div>
  );
}
