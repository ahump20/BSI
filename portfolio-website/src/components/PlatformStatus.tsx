import { usePlatformHealth } from '../hooks/usePlatformHealth';

interface PlatformStatusProps {
  className?: string;
}

type StatusLevel = 'online' | 'degraded' | 'offline';

const STATUS_CONFIG: Record<StatusLevel, { label: string; dot: string; text: string }> = {
  online:   { label: 'Online',   dot: 'bg-green-500',  text: 'text-green-400' },
  degraded: { label: 'Degraded', dot: 'bg-amber-500',  text: 'text-amber-400' },
  offline:  { label: 'Offline',  dot: 'bg-red-500',    text: 'text-red-400' },
};

export default function PlatformStatus({ className = '' }: PlatformStatusProps) {
  const { status, loading } = usePlatformHealth();
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
