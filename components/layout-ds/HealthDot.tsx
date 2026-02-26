'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type HealthLevel = 'healthy' | 'degraded' | 'down' | 'unknown';

interface StatusApiRaw {
  endpoints?: { status: string }[];
  results?: { status: string }[];
}

const dotColors: Record<HealthLevel, string> = {
  healthy: 'bg-green-400',
  degraded: 'bg-yellow-400',
  down: 'bg-red-400',
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

    fetch('/api/status')
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data: unknown) => {
        if (!mounted) return;
        const raw = data as StatusApiRaw;
        const endpoints = raw.endpoints || raw.results || [];
        const failed = endpoints.filter((e: { status: string }) => e.status !== 'ok').length;
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
