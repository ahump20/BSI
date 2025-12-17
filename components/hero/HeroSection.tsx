'use client';

/**
 * BSI Hero Section - Client Component
 * 
 * Wraps Three.js HeroEmbers with all interactive elements.
 * Server components import this for the hero section.
 */

import { HeroEmbers } from '@/components/three/HeroEmbers';
import { ScrollReveal } from '@/components/layout-ds/ScrollReveal';
import { Badge } from '@/components/layout-ds/Badge';
import Link from 'next/link';

export function HeroSection() {
  return (
    <div className="relative">
      {/* Three.js Ember Particles (CSS fallback on mobile) */}
      <HeroEmbers />
      
      <ScrollReveal>
        <div className="text-center relative z-10">
          <Badge className="mb-6">Real-Time Sports Intelligence</Badge>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-display text-white mb-6 tracking-tight">
            BORN TO BLAZE THE<br />
            <span className="text-gradient-brand">PATH LESS BEATEN</span>
          </h1>
          <p className="lead max-w-2xl mx-auto mb-10">
            Every game matters to someone. MLB, NFL, NBA, College Baseball, NCAA Football—real analytics, not just scores. Built by a fan who got tired of waiting.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard" className="btn-primary px-8 py-4 text-lg">
              Launch Dashboard
            </Link>
            <Link href="/pricing" className="btn-secondary px-8 py-4 text-lg">
              View Pricing
            </Link>
          </div>
          <div className="mt-12 flex items-center justify-center gap-4">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-success/20 text-success">
              <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
              LIVE
            </span>
            <span className="text-white/50">Live data streaming from official sources</span>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}
