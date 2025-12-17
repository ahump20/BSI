'use client';

/**
 * BSI Hero Section
 *
 * Client component wrapper for Three.js hero effects.
 * Imports HeroEmbers which requires client-side rendering.
 */

import { HeroEmbers } from '@/components/three/HeroEmbers';

export function HeroSection() {
  return (
    <div className="absolute inset-0 -z-10">
      <HeroEmbers className="" />
    </div>
  );
}

export default HeroSection;
