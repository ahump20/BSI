import { useState, useEffect } from 'react';
import type { PortalEntry } from '@/components/portal';

export interface UsePortalDataOptions {
  /** Polling interval in milliseconds (default: 30000) */
  pollingIntervalMs?: number;
  /** Initial entries to show before API data loads */
  initialEntries?: PortalEntry[];
  /** Whether to keep initial entries on fetch failure (default: false) */
  keepInitialOnError?: boolean;
}

export function usePortalData(
  endpoint: string,
  options: UsePortalDataOptions = {}
) {
  const {
    pollingIntervalMs = 30_000,
    initialEntries = [],
    keepInitialOnError = false,
  } = options;

  const [entries, setEntries] = useState<PortalEntry[]>(initialEntries);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchEntries() {
      try {
        const res = await fetch(endpoint);
        if (!cancelled && res.ok) {
          const data = await res.json() as { entries?: PortalEntry[] };
          const newEntries = data.entries ?? [];
          // Only update if we got data, or if not keeping initial data
          if (newEntries.length > 0 || !keepInitialOnError) {
            setEntries(newEntries);
          }
        }
      } catch {
        if (!cancelled) setError('Failed to load portal data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchEntries();
    const interval = setInterval(fetchEntries, pollingIntervalMs);
    return () => { cancelled = true; clearInterval(interval); };
  }, [endpoint, pollingIntervalMs, keepInitialOnError]);

  return { entries, loading, error };
}
