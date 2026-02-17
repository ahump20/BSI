'use client';

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'polling';

interface ConnectionIndicatorProps {
  status: ConnectionStatus;
  className?: string;
}

const STATUS_CONFIG: Record<ConnectionStatus, { color: string; label: string }> = {
  connected: { color: 'bg-green-500', label: 'Live' },
  connecting: { color: 'bg-yellow-500 animate-pulse', label: 'Connecting' },
  polling: { color: 'bg-blue-500', label: 'Polling' },
  disconnected: { color: 'bg-red-500', label: 'Offline' },
};

export function ConnectionIndicator({ status, className = '' }: ConnectionIndicatorProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-mono ${className}`}
      title={`Data connection: ${config.label}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.color}`} />
      <span className="text-gray-400">{config.label}</span>
    </span>
  );
}
