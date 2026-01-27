/**
 * BSI Device Performance Tier Detection
 *
 * Detects device capability to enable/disable 3D features appropriately.
 * Mobile-first: assumes LOW tier until proven otherwise.
 */

export type PerformanceTier = 'LOW' | 'MEDIUM' | 'HIGH' | 'ULTRA';

export interface DeviceCapabilities {
  tier: PerformanceTier;
  supportsWebGPU: boolean;
  supportsWebGL2: boolean;
  isMobile: boolean;
  isReducedMotion: boolean;
  deviceMemory: number | null;
  hardwareConcurrency: number;
  maxTextureSize: number;
  particleCount: number;
  enable3D: boolean;
  /** Enable film grain overlay (disabled on low-end devices) */
  enableGrain: boolean;
  /** Enable backdrop blur effects (expensive on mobile) */
  enableBackdropBlur: boolean;
  /** Enable heavy glow effects (reduced on mobile) */
  enableGlow: boolean;
}

/**
 * Detect WebGPU support
 */
async function detectWebGPU(): Promise<boolean> {
  if (typeof navigator === 'undefined') return false;
  if (!('gpu' in navigator)) return false;

  try {
    const adapter = await (navigator as Navigator & { gpu: GPU }).gpu.requestAdapter();
    return adapter !== null;
  } catch {
    return false;
  }
}

/**
 * Detect WebGL2 support and get max texture size
 */
function detectWebGL2(): { supported: boolean; maxTextureSize: number } {
  if (typeof document === 'undefined') {
    return { supported: false, maxTextureSize: 0 };
  }

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');

    if (!gl) {
      return { supported: false, maxTextureSize: 0 };
    }

    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
    return { supported: true, maxTextureSize };
  } catch {
    return { supported: false, maxTextureSize: 0 };
  }
}

/**
 * Check if user prefers reduced motion
 */
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Detect if device is mobile
 */
function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return true;

  // Check touch capability
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Check screen width
  const isNarrow = window.innerWidth < 768;

  // Check user agent for mobile keywords
  const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  return (hasTouch && isNarrow) || mobileUA;
}

/**
 * Get device memory (if available)
 */
function getDeviceMemory(): number | null {
  if (typeof navigator === 'undefined') return null;
  // @ts-expect-error - deviceMemory is not in all TypeScript definitions
  return navigator.deviceMemory ?? null;
}

/**
 * Calculate performance tier based on device capabilities
 */
function calculateTier(
  memory: number | null,
  cores: number,
  isMobile: boolean,
  webgl2: boolean,
  webgpu: boolean,
  maxTexture: number
): PerformanceTier {
  // Mobile devices default to lower tiers
  if (isMobile) {
    // High-end mobile (iPad Pro, flagship phones)
    if (memory && memory >= 8 && cores >= 6 && webgpu) {
      return 'MEDIUM';
    }
    // Standard mobile
    return 'LOW';
  }

  // Desktop/laptop detection
  if (webgpu && memory && memory >= 16 && cores >= 8) {
    return 'ULTRA';
  }

  if (webgl2 && memory && memory >= 8 && cores >= 4 && maxTexture >= 16384) {
    return 'HIGH';
  }

  if (webgl2 && cores >= 4) {
    return 'MEDIUM';
  }

  return 'LOW';
}

/**
 * Get recommended particle count based on tier
 */
function getParticleCount(tier: PerformanceTier): number {
  switch (tier) {
    case 'ULTRA':
      return 2000;
    case 'HIGH':
      return 1000;
    case 'MEDIUM':
      return 500;
    case 'LOW':
    default:
      return 0; // CSS fallback only
  }
}

/**
 * Main detection function - call this once on app init
 */
export async function detectDeviceCapabilities(): Promise<DeviceCapabilities> {
  const isMobile = isMobileDevice();
  const isReducedMotion = prefersReducedMotion();
  const deviceMemory = getDeviceMemory();
  const hardwareConcurrency =
    typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 2 : 2;
  const webgl2 = detectWebGL2();
  const supportsWebGPU = await detectWebGPU();

  const tier = calculateTier(
    deviceMemory,
    hardwareConcurrency,
    isMobile,
    webgl2.supported,
    supportsWebGPU,
    webgl2.maxTextureSize
  );

  // Only enable 3D if:
  // - Not reduced motion preference
  // - Tier is MEDIUM or higher
  // - WebGL2 or WebGPU is supported
  const enable3D = !isReducedMotion && tier !== 'LOW' && (webgl2.supported || supportsWebGPU);

  // Enable grain only on MEDIUM+ tiers and non-mobile (performance concern)
  const enableGrain = !isReducedMotion && !isMobile && tier !== 'LOW';

  // Enable backdrop blur on MEDIUM+ tiers (expensive on mobile/low-end)
  const enableBackdropBlur = tier !== 'LOW';

  // Enable heavy glow effects only on HIGH+ tiers
  const enableGlow = tier === 'HIGH' || tier === 'ULTRA';

  return {
    tier,
    supportsWebGPU,
    supportsWebGL2: webgl2.supported,
    isMobile,
    isReducedMotion,
    deviceMemory,
    hardwareConcurrency,
    maxTextureSize: webgl2.maxTextureSize,
    particleCount: getParticleCount(tier),
    enable3D,
    enableGrain,
    enableBackdropBlur,
    enableGlow,
  };
}

/**
 * Synchronous version for initial render (conservative defaults)
 */
export function getInitialCapabilities(): DeviceCapabilities {
  const isMobile = isMobileDevice();
  const isReducedMotion = prefersReducedMotion();

  return {
    tier: 'LOW',
    supportsWebGPU: false,
    supportsWebGL2: false,
    isMobile,
    isReducedMotion,
    deviceMemory: null,
    hardwareConcurrency: 2,
    maxTextureSize: 0,
    particleCount: 0,
    enable3D: false,
    // Conservative defaults - assume low-end until proven otherwise
    enableGrain: false,
    enableBackdropBlur: !isMobile, // Most desktops can handle it
    enableGlow: false,
  };
}

// Type for GPU API
interface GPU {
  requestAdapter(): Promise<GPUAdapter | null>;
}

interface GPUAdapter {
  // Minimal type for adapter check
}
