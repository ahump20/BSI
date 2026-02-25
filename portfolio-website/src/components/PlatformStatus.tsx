import { useState, useEffect, useCallback } from 'react';

interface PlatformStatusProps {
  className?: string;
}

type StatusLevel = 'online' | 'degraded' | 'offline';

const STATUS_CONFIG: Record<StatusLevel, { label: string; dot: string; text: string }> = {
  online:   { label: 'Online',   dot: 'bg-green-500',  text: 'text-green-400' },
  degraded: { label: 'Degraded', dot: 'bg-amber-500',  text: 'text-amber-400' },
  offline:  { label: 'Offline',  dot: 'bg-red-500',    text: 'text-red-400' },
};

const BSI_HEALTH_URL = 'https://blazesportsintel.com/api/health';
const POLL_INTERVAL = 60_000;

export default function PlatformStatus({ className = '' }: PlatformStatusProps) {
  const [status, setStatus] = useState<StatusLevel>('offline');
  const [loading, setLoading] = useState(true);

  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch(BSI_HEALTH_URL, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) {
        setStatus('degraded');
        return;
      }
      const data = await res.json();
      setStatus(data.status === 'ok' ? 'online' : 'degraded');
    } catch {
      setStatus('offline');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [checkHealth]);

  const config = STATUS_CONFIG[status];

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-charcoal/80 border border-bone/10 ${className}`}
      role="status"
      aria-label={`BSI platform status: ${config.label}`}
    >
      <span className="relative flex h-2 w-2">
        {status === 'online' && !loading && (
          <span className={`absolute inline-flex h-full w-full rounded-full ${config.dot} opacity-75 animate-ping`} />
        )}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${loading ? 'bg-warm-gray animate-pulse' : config.dot}`} />
      </span>
      <span className={`font-mono text-[0.65rem] tracking-wider uppercase ${loading ? 'text-warm-gray' : config.text}`}>
        {loading ? 'Checking...' : config.label}
      </span>
    </div>
  );
}
