'use client';

import { useState, useEffect } from 'react';

/**
 * Resolves a route parameter from the URL when the static page was served
 * as a placeholder shell. In BSI's static export architecture, dynamic
 * routes like /mlb/players/{id}/ use generateStaticParams with a single
 * "placeholder" entry. The worker proxy serves this shell for any real ID,
 * and this hook reads the actual ID from window.location.
 *
 * @param paramValue - The value from generateStaticParams (may be "placeholder")
 * @param segment - The URL path segment to extract from (e.g., "players")
 * @returns The resolved parameter value
 */
export function useResolvedParam(paramValue: string, segment: string): string {
  // When paramValue is "placeholder", don't initialize with it — that would
  // trigger an immediate fetch to /api/.../placeholder which errors.
  // Initialize empty so the component skips the fetch until we resolve the real ID.
  const needsResolution = paramValue === 'placeholder';
  const [resolved, setResolved] = useState(needsResolution ? '' : paramValue);

  useEffect(() => {
    if (needsResolution && typeof window !== 'undefined') {
      const parts = window.location.pathname.split(`/${segment}/`);
      if (parts[1]) {
        const realId = parts[1].replace(/\/$/, '').split('/')[0];
        if (realId && realId !== 'placeholder') {
          setResolved(realId);
        }
      }
    }
  }, [needsResolution, segment]);

  return resolved;
}
