import { useEffect, useState } from 'react';
import { detectGPUCapabilitiesWithCache, type GPUCapabilities } from '../webgpu-detection';

export type GraphicsMode = 'lite' | 'enhanced';

export interface GraphicsCapabilityResult {
  evaluated: boolean;
  canEnable: boolean;
  suggestedMode: GraphicsMode;
  reason?: string;
  capabilities?: GPUCapabilities;
}

function getReducedMotionPreference(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia === 'undefined') {
    return false;
  }

  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (error) {
    console.warn('Reduced motion detection failed:', error);
    return false;
  }
}

function getDeviceMemory(): number {
  if (typeof navigator !== 'undefined' && 'deviceMemory' in navigator) {
    const value = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    if (typeof value === 'number' && !Number.isNaN(value)) {
      return value;
    }
  }
  return 4;
}

function getHardwareConcurrency(): number {
  if (typeof navigator !== 'undefined' && typeof navigator.hardwareConcurrency === 'number') {
    return navigator.hardwareConcurrency;
  }
  return 4;
}

function isMobileViewport(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.innerWidth < 992;
}

function evaluateCapability(capabilities: GPUCapabilities): Omit<GraphicsCapabilityResult, 'evaluated' | 'capabilities'> {
  if (typeof window === 'undefined') {
    return { canEnable: false, suggestedMode: 'lite', reason: 'Server render environment' };
  }

  if (getReducedMotionPreference()) {
    return {
      canEnable: false,
      suggestedMode: 'lite',
      reason: 'prefers-reduced-motion enabled'
    };
  }

  const deviceMemory = getDeviceMemory();
  const hardwareConcurrency = getHardwareConcurrency();
  const mobileViewport = isMobileViewport();

  if (mobileViewport && capabilities.performance === 'low') {
    return {
      canEnable: false,
      suggestedMode: 'lite',
      reason: 'mobile viewport with low GPU performance'
    };
  }

  // On mobile we only enable automatically for strong devices
  if (mobileViewport) {
    const capableMobile = (capabilities.performance === 'high' || capabilities.performance === 'medium') &&
      deviceMemory >= 6 &&
      hardwareConcurrency >= 6;

    return {
      canEnable: capableMobile,
      suggestedMode: capableMobile ? 'enhanced' : 'lite',
      reason: capableMobile
        ? 'high-tier mobile device detected'
        : 'mobile heuristics opted for lite mode'
    };
  }

  // Desktop heuristics
  if (deviceMemory < 4 || hardwareConcurrency < 4) {
    return {
      canEnable: false,
      suggestedMode: 'lite',
      reason: 'limited system resources'
    };
  }

  const canEnable = capabilities.performance !== 'low';
  return {
    canEnable,
    suggestedMode: canEnable ? 'enhanced' : 'lite',
    reason: canEnable ? undefined : 'GPU performance tier reported as low'
  };
}

export function useGraphicsCapability(): GraphicsCapabilityResult {
  const [result, setResult] = useState<GraphicsCapabilityResult>({
    evaluated: false,
    canEnable: false,
    suggestedMode: 'lite'
  });

  useEffect(() => {
    let isMounted = true;

    async function run() {
      try {
        const capabilities = await detectGPUCapabilitiesWithCache();
        if (!isMounted) return;

        const evaluation = evaluateCapability(capabilities);
        setResult({
          evaluated: true,
          capabilities,
          ...evaluation
        });
      } catch (error) {
        console.warn('Failed to evaluate graphics capability', error);
        if (!isMounted) return;
        setResult({
          evaluated: true,
          canEnable: false,
          suggestedMode: 'lite',
          reason: 'capability detection error'
        });
      }
    }

    void run();

    return () => {
      isMounted = false;
    };
  }, []);

  return result;
}
