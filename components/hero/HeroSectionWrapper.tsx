'use client';

/**
 * BSI Hero Section Wrapper
 *
 * Client component that handles dynamic import of HeroSection
 * with ssr: false for Three.js compatibility.
 * This wrapper allows the page to remain a Server Component
 * while the hero uses client-only rendering.
 */

import dynamic from 'next/dynamic';

const HeroSection = dynamic(() => import('./HeroSection').then((mod) => mod.HeroSection), {
  ssr: false,
  loading: () => null,
});

export function HeroSectionWrapper() {
  return <HeroSection />;
}

export default HeroSectionWrapper;
