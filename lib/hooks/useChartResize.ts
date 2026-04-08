import { useEffect, useState, type RefObject } from 'react';

interface ChartDimensions {
  width: number;
  height: number;
}

/**
 * Watches a container element via ResizeObserver and returns its current
 * { width, height } — debounced to avoid excessive D3 redraws.
 */
export function useChartResize(
  containerRef: RefObject<HTMLDivElement | null>,
  debounceMs = 150,
): ChartDimensions {
  const [dimensions, setDimensions] = useState<ChartDimensions>({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    setDimensions({ width: el.clientWidth, height: el.clientHeight });

    let timer: ReturnType<typeof setTimeout> | null = null;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const { width, height } = entry.contentRect;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        setDimensions((prev) => {
          if (prev.width === Math.round(width) && prev.height === Math.round(height)) return prev;
          return { width: Math.round(width), height: Math.round(height) };
        });
      }, debounceMs);
    });

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [containerRef, debounceMs]);

  return dimensions;
}
