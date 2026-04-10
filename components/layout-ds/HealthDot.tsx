'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getReadApiUrl } from '@/lib/utils/public-api';

type HealthLevel = 'healthy' | 'degraded' | 'down' | 'unknown';

interface StatusResult {
  ok: boolean;
  status: number | string;
  name?: string;
}

interface StatusApiRaw {
  /**
   * New (2026-04-10): merged status from /api/status. When this field is
   * present, trust it — it's already reconciled the synthetic monitor
   * signal with the daily freshness audit snapshot and eliminated the
   * single-blip false positive that used to flip this dot red.
   */
  overall?: HealthLevel;
  allHealthy?: boolean;
  results?: StatusResult[];
  endpoints?: StatusResult[];
}

const dotColors: Record<HealthLevel, string> = {
  healthy: 'bg-bsi-primary',
  degraded: 'bg-warning',
  down: 'bg-error',
  unknown: '', // hidden
};

const labels: Record<HealthLevel, string> = {
  healthy: 'All systems operational',
  degraded: 'Partial degradation',
  down: 'System outage',
  unknown: '',
};

/**
 * Tiny health dot for the site footer.
 * Fetches /api/status once on mount — no polling (footer is on every page).
 * If the fetch fails, hides silently.
 */
export function HealthDot() {
  const [health, setHealth] = useState<HealthLevel>('unknown');

  useEffect(() => {
    let mounted = true;

    fetch(getReadApiUrl('/api/status'))
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data: unknown) => {
        if (!mounted) return;
        const raw = data as StatusApiRaw;

        // Best path: merged overall from handleStatus (reconciles synthetic
        // monitor with daily freshness audit). Eliminates the 'down' false
        // positive from a single transient synthetic blip.
        if (raw.overall && raw.overall !== 'unknown') {
          setHealth(raw.overall);
          return;
        }

        // Fast path: legacy synthetic monitor allHealthy boolean
        if (typeof raw.allHealthy === 'boolean') {
          setHealth(raw.allHealthy ? 'healthy' : 'degraded');
          return;
        }

        // Fallback: inspect individual results
        const endpoints = raw.results || raw.endpoints || [];
        if (endpoints.length === 0) {
          setHealth('unknown');
          return;
        }
        const failed = endpoints.filter((e: { ok?: boolean }) => !e.ok).length;
        if (failed === 0) setHealth('healthy');
        else if (failed < endpoints.length) setHealth('degraded');
        else setHealth('down');
      })
      .catch(() => {
        if (mounted) setHealth('unknown');
      });

    return () => { mounted = false; };
  }, []);

  if (health === 'unknown') return null;

  return (
    <Link
      href="/status"
      className="inline-flex items-center gap-1.5 text-text-muted hover:text-text-secondary transition-colors"
      title={labels[health]}
    >
      <span className={`w-2 h-2 rounded-full ${dotColors[health]}`} />
      <span className="text-xs">Status</span>
    </Link>
  );
}
