const MIN_MEMORY_GB = 4;

export function shouldEnableAdvancedGraphics(): boolean {
  if (typeof window === 'undefined') return false;

  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const hasWebGPU = typeof (navigator as Navigator & { gpu?: unknown }).gpu !== 'undefined';
  const hasWebGL = (() => {
    try {
      const canvas = document.createElement('canvas');
      return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
    } catch {
      return false;
    }
  })();

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isWideViewport = window.matchMedia('(min-width: 1024px)').matches;

  if (prefersReducedMotion) return false;
  if (!isWideViewport && !hasWebGPU) return false;
  if (!hasWebGPU && !hasWebGL) return false;
  return memory >= MIN_MEMORY_GB;
}
