/**
 * BSI Performance Tier Detection
 *
 * Detects device capabilities for adaptive 3D rendering quality.
 * Uses navigator/hardware APIs to determine optimal settings.
 */

import { useState, useEffect } from 'react';

export type PerformanceTier = 'low' | 'medium' | 'high';

interface PerformanceConfig {
  tier: PerformanceTier;
  particleCount: number;
  enablePostProcessing: boolean;
  enableShadows: boolean;
  pixelRatio: number;
}

const TIER_CONFIGS: Record<PerformanceTier, Omit<PerformanceConfig, 'tier'>> = {
  low: {
    particleCount: 0, // CSS fallback only
    enablePostProcessing: false,
    enableShadows: false,
    pixelRatio: 1,
  },
  medium: {
    particleCount: 150,
    enablePostProcessing: false,
    enableShadows: false,
    pixelRatio: Math.min(1.5, typeof window !== 'undefined' ? window.devicePixelRatio : 1),
  },
  high: {
    particleCount: 400,
    enablePostProcessing: true,
    enableShadows: true,
    pixelRatio: Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio : 1),
  },
};

function detectTier(): PerformanceTier {
  if (typeof window === 'undefined') return 'low';

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return 'low';

  // Mobile detection
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  // Check device memory (Chrome/Edge only)
  const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;

  // Check hardware concurrency (CPU cores)
  const cores = navigator.hardwareConcurrency || 2;

  // Check WebGL capabilities
  let webglTier: 'low' | 'medium' | 'high' = 'medium';
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
        // Detect high-end GPUs
        if (
          renderer.includes('nvidia') ||
          renderer.includes('radeon') ||
          renderer.includes('apple m')
        ) {
          webglTier = 'high';
        } else if (renderer.includes('intel') && !renderer.includes('hd')) {
          webglTier = 'high';
        }
      }
    } else {
      webglTier = 'low';
    }
  } catch {
    webglTier = 'low';
  }

  // Decision matrix
  if (isMobile) {
    // Mobile: mostly medium, low for very old devices
    if (deviceMemory && deviceMemory < 4) return 'low';
    if (cores < 4) return 'low';
    return 'medium';
  }

  // Desktop decision
  if (webglTier === 'low') return 'low';
  if (deviceMemory && deviceMemory >= 8 && cores >= 8 && webglTier === 'high') return 'high';
  if (deviceMemory && deviceMemory >= 4 && cores >= 4) return 'medium';

  return 'medium';
}

export function usePerformanceTier(): PerformanceConfig {
  const [config, setConfig] = useState<PerformanceConfig>(() => ({
    tier: 'low',
    ...TIER_CONFIGS.low,
  }));

  useEffect(() => {
    const tier = detectTier();
    setConfig({
      tier,
      ...TIER_CONFIGS[tier],
    });
  }, []);

  return config;
}

export function getStaticPerformanceTier(): PerformanceTier {
  return detectTier();
}
