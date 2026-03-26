'use client';

import { HeroSection } from '@/components/home/HeroSection';
import { HomeAskSection } from '@/components/home/HomeAskSection';
import { WhyBSI } from '@/components/home/WhyBSI';
import { FlagshipProof } from '@/components/home/FlagshipProof';
import { FeatureShowcase } from '@/components/home/FeatureShowcase';
import { HomeFreshness } from '@/components/home/HomeFreshness';
import { HomeCTA } from '@/components/home/HomeCTA';
import { Footer } from '@/components/layout-ds/Footer';
import { DataErrorBoundary } from '@/components/ui/DataErrorBoundary';

export function HomePageClient() {
  return (
    <div className="min-h-screen bg-midnight">
      <DataErrorBoundary name="Hero" compact>
        <HeroSection />
      </DataErrorBoundary>

      <HomeAskSection />

      <WhyBSI />

      <FlagshipProof />

      <FeatureShowcase />

      <DataErrorBoundary name="Freshness">
        <HomeFreshness />
      </DataErrorBoundary>

      <HomeCTA />

      <Footer />
    </div>
  );
}
