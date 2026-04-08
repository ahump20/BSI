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
  const [resolved, setResolved] = useState(paramValue);

  useEffect(() => {
    if (paramValue === 'placeholder' && typeof window !== 'undefined') {
      const parts = window.location.pathname.split(`/${segment}/`);
      if (parts[1]) {
        const realId = parts[1].replace(/\/$/, '').split('/')[0];
        if (realId && realId !== 'placeholder') {
          setResolved(realId);
        }
      }
    }
  }, [paramValue, segment]);

  return resolved;
}
