import { useState, useEffect } from 'react';
import type { PortalEntry } from '@/components/portal';

export function usePortalData(endpoint: string, pollingIntervalMs = 30_000) {
  const [entries, setEntries] = useState<PortalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchEntries() {
      try {
        const res = await fetch(endpoint);
        if (!cancelled && res.ok) {
          const data = await res.json() as { entries?: PortalEntry[] };
          setEntries(data.entries ?? []);
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
  }, [endpoint, pollingIntervalMs]);

  return { entries, loading, error };
}
