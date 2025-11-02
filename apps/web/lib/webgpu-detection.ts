/**
 * WebGPU Detection and Progressive Enhancement Utility
 *
 * Detects WebGPU availability and provides fallback to WebGL2
 * Progressive enhancement strategy for 85% Chrome/Edge coverage (Oct 2025)
 */

export interface GPUCapabilities {
  hasWebGPU: boolean;
  hasWebGL2: boolean;
  recommendedEngine: 'webgpu' | 'webgl2' | 'webgl' | 'none';
  gpuInfo?: {
    vendor?: string;
    renderer?: string;
    maxTextureSize?: number;
    maxComputeWorkgroupSize?: number;
  };
  performance: 'high' | 'medium' | 'low';
}

/**
 * Detects WebGPU support using navigator.gpu
 */
export async function detectWebGPU(): Promise<boolean> {
  if (typeof navigator === 'undefined') {
    return false;
  }

  try {
    if ('gpu' in navigator) {
      const adapter = await (navigator as any).gpu?.requestAdapter();
      return !!adapter;
    }
  } catch (error) {
    console.warn('WebGPU detection failed:', error);
  }

  return false;
}

/**
 * Detects WebGL2 support
 */
export function detectWebGL2(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    return !!gl;
  } catch (error) {
    console.warn('WebGL2 detection failed:', error);
    return false;
  }
}

/**
 * Detects WebGL 1.0 support (fallback)
 */
export function detectWebGL(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!gl;
  } catch (error) {
    console.warn('WebGL detection failed:', error);
    return false;
  }
}

/**
 * Get GPU performance tier based on capabilities
 */
async function getPerformanceTier(hasWebGPU: boolean, hasWebGL2: boolean): Promise<'high' | 'medium' | 'low'> {
  // WebGPU = High performance
  if (hasWebGPU) {
    return 'high';
  }

  // WebGL2 with good specs = Medium performance
  if (hasWebGL2) {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') as WebGL2RenderingContext;

      if (gl) {
        const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
        // High-end mobile or desktop
        if (maxTextureSize >= 8192) {
          return 'medium';
        }
      }
    } catch (error) {
      console.warn('Performance tier detection failed:', error);
    }
  }

  return 'low';
}

/**
 * Get detailed GPU information
 */
async function getGPUInfo(hasWebGPU: boolean): Promise<GPUCapabilities['gpuInfo']> {
  const info: GPUCapabilities['gpuInfo'] = {};

  // Try WebGPU adapter info
  if (hasWebGPU && 'gpu' in navigator) {
    try {
      const adapter = await (navigator as any).gpu?.requestAdapter();
      if (adapter) {
        // WebGPU limits
        const limits = adapter.limits;
        info.maxComputeWorkgroupSize = limits?.maxComputeWorkgroupSizeX || 256;
      }
    } catch (error) {
      console.warn('WebGPU info retrieval failed:', error);
    }
  }

  // Fallback to WebGL debug info
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') as WebGLRenderingContext;

    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        info.vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        info.renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      }

      info.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    }
  } catch (error) {
    console.warn('GPU info retrieval failed:', error);
  }

  return Object.keys(info).length > 0 ? info : undefined;
}

/**
 * Comprehensive GPU capabilities detection
 * Returns recommended rendering engine and performance tier
 */
export async function detectGPUCapabilities(): Promise<GPUCapabilities> {
  const hasWebGPU = await detectWebGPU();
  const hasWebGL2 = detectWebGL2();
  const hasWebGL = detectWebGL();

  // Determine recommended engine
  let recommendedEngine: GPUCapabilities['recommendedEngine'] = 'none';
  if (hasWebGPU) {
    recommendedEngine = 'webgpu';
  } else if (hasWebGL2) {
    recommendedEngine = 'webgl2';
  } else if (hasWebGL) {
    recommendedEngine = 'webgl';
  }

  const performance = await getPerformanceTier(hasWebGPU, hasWebGL2);
  const gpuInfo = await getGPUInfo(hasWebGPU);

  return {
    hasWebGPU,
    hasWebGL2,
    recommendedEngine,
    gpuInfo,
    performance,
  };
}

/**
 * Log GPU capabilities to console (useful for debugging)
 */
export function logGPUCapabilities(capabilities: GPUCapabilities): void {
  console.group('🎮 GPU Capabilities Detection');
  console.log('WebGPU Support:', capabilities.hasWebGPU ? '✅' : '❌');
  console.log('WebGL2 Support:', capabilities.hasWebGL2 ? '✅' : '❌');
  console.log('Recommended Engine:', capabilities.recommendedEngine.toUpperCase());
  console.log('Performance Tier:', capabilities.performance.toUpperCase());

  if (capabilities.gpuInfo) {
    console.group('GPU Information');
    if (capabilities.gpuInfo.vendor) {
      console.log('Vendor:', capabilities.gpuInfo.vendor);
    }
    if (capabilities.gpuInfo.renderer) {
      console.log('Renderer:', capabilities.gpuInfo.renderer);
    }
    if (capabilities.gpuInfo.maxTextureSize) {
      console.log('Max Texture Size:', capabilities.gpuInfo.maxTextureSize);
    }
    if (capabilities.gpuInfo.maxComputeWorkgroupSize) {
      console.log('Max Compute Workgroup Size:', capabilities.gpuInfo.maxComputeWorkgroupSize);
    }
    console.groupEnd();
  }

  console.groupEnd();
}

/**
 * React hook for GPU capabilities detection
 */
export function useGPUCapabilities() {
  const [capabilities, setCapabilities] = React.useState<GPUCapabilities | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    detectGPUCapabilities()
      .then((caps) => {
        setCapabilities(caps);
        if (process.env.NODE_ENV === 'development') {
          logGPUCapabilities(caps);
        }
      })
      .catch((error) => {
        console.error('GPU capabilities detection error:', error);
        // Fallback to safe defaults
        setCapabilities({
          hasWebGPU: false,
          hasWebGL2: false,
          recommendedEngine: 'none',
          performance: 'low',
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return { capabilities, isLoading };
}

// React import for hook (only if using React)
import * as React from 'react';

/**
 * Storage key for caching GPU capabilities
 */
const GPU_CAPABILITIES_CACHE_KEY = 'bsi_gpu_capabilities';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Cache GPU capabilities to localStorage for faster subsequent loads
 */
export function cacheGPUCapabilities(capabilities: GPUCapabilities): void {
  if (typeof localStorage === 'undefined') {
    return;
  }

  try {
    const cacheData = {
      capabilities,
      timestamp: Date.now(),
    };
    localStorage.setItem(GPU_CAPABILITIES_CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Failed to cache GPU capabilities:', error);
  }
}

/**
 * Retrieve cached GPU capabilities if available and fresh
 */
export function getCachedGPUCapabilities(): GPUCapabilities | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  try {
    const cached = localStorage.getItem(GPU_CAPABILITIES_CACHE_KEY);
    if (!cached) {
      return null;
    }

    const cacheData = JSON.parse(cached);
    const age = Date.now() - cacheData.timestamp;

    // Return cached data if less than 24 hours old
    if (age < CACHE_DURATION_MS) {
      return cacheData.capabilities;
    }
  } catch (error) {
    console.warn('Failed to retrieve cached GPU capabilities:', error);
  }

  return null;
}

/**
 * Enhanced capabilities detection with caching
 */
export async function detectGPUCapabilitiesWithCache(): Promise<GPUCapabilities> {
  // Try cache first
  const cached = getCachedGPUCapabilities();
  if (cached) {
    return cached;
  }

  // Detect and cache
  const capabilities = await detectGPUCapabilities();
  cacheGPUCapabilities(capabilities);

  return capabilities;
}
