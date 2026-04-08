'use client';

/**
 * Resolves a route parameter from the URL when the static page was served
 * as a placeholder shell. In BSI's static export architecture, dynamic
 * routes like /mlb/players/{id}/ use generateStaticParams with a single
 * "placeholder" entry. The worker proxy serves this shell for any real ID,
 * and this hook reads the actual ID from window.location.
 *
 * Resolution is synchronous — reads window.location during initialization
 * to avoid a flash of empty content before the real ID resolves.
 *
 * @param paramValue - The value from generateStaticParams (may be "placeholder")
 * @param segment - The URL path segment to extract from (e.g., "players", "teams", "daily")
 * @returns The resolved parameter value (real ID from URL, or original if not placeholder)
 */
export function useResolvedParam(paramValue: string, segment: string): string {
  if (paramValue !== 'placeholder') return paramValue;

  // Synchronous resolution from window.location — no useEffect delay
  if (typeof window !== 'undefined') {
    const parts = window.location.pathname.split(`/${segment}/`);
    if (parts[1]) {
      const realId = parts[1].replace(/\/$/, '').split('/')[0];
      if (realId && realId !== 'placeholder') return realId;
    }
  }

  return '';
}
