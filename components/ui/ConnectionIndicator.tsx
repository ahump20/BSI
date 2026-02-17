'use client';

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'polling';

interface ConnectionIndicatorProps {
  status: ConnectionStatus;
  className?: string;
}

const STATUS_CONFIG: Record<ConnectionStatus, { color: string; bg: string; label: string }> = {
  connected: { color: 'bg-green-400', bg: 'bg-green-400/10', label: 'Live' },
  polling: { color: 'bg-yellow-400', bg: 'bg-yellow-400/10', label: 'Polling' },
  connecting: { color: 'bg-yellow-400 animate-pulse', bg: 'bg-yellow-400/10', label: 'Connecting' },
  disconnected: { color: 'bg-red-400', bg: 'bg-red-400/10', label: 'Offline' },
};

/**
 * ConnectionIndicator — small badge showing WebSocket/polling connection state.
 *
 * Green dot = WebSocket connected (real-time)
 * Yellow dot = polling fallback or connecting
 * Red dot = disconnected
 */
export function ConnectionIndicator({ status, className = '' }: ConnectionIndicatorProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider text-white/60 ${config.bg} ${className}`}
      role="status"
      aria-label={`Connection: ${config.label}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.color}`} />
      {config.label}
    </span>
  );
}
