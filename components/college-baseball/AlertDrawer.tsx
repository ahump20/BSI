'use client';

import { useState, useEffect, useCallback } from 'react';

interface Alert {
  id: string;
  type: 'close_game' | 'upset' | 'no_hitter';
  title: string;
  description: string;
  timestamp: string;
}

interface AlertDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const ALERT_ICONS: Record<Alert['type'], { icon: string; label: string }> = {
  close_game: { icon: '⚾', label: 'Close Game' },
  upset: { icon: '❗', label: 'Upset Alert' },
  no_hitter: { icon: '⭐', label: 'No-Hitter' },
};

function relativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

export default function AlertDrawer({ isOpen, onClose }: AlertDrawerProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/alerts/college-baseball');
      if (!res.ok) return;
      const data = await res.json();
      if (data.alerts) {
        setAlerts(data.alerts);
      }
    } catch {
      // Silent fail - alerts are non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchAlerts();
    }
  }, [isOpen, fetchAlerts]);

  // Poll every 30s when open
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(fetchAlerts, 30_000);
    return () => clearInterval(interval);
  }, [isOpen, fetchAlerts]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-80 md:w-96 bg-bsi-surface border-l border-bsi-border z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-bsi-border">
          <h2 className="text-lg font-semibold text-bsi-text-primary">
            College Baseball Alerts
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-bsi-text-secondary hover:text-bsi-text-primary hover:bg-bsi-hover transition-colors"
            aria-label="Close alerts"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(100%-56px)] px-4 py-3 space-y-3">
          {loading && alerts.length === 0 && (
            <div className="flex items-center justify-center py-12 text-bsi-text-secondary">
              <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Loading alerts...
            </div>
          )}

          {!loading && alerts.length === 0 && (
            <div className="text-center py-12 text-bsi-text-secondary">
              <p className="text-2xl mb-2">⚾</p>
              <p className="text-sm">No active alerts right now.</p>
              <p className="text-xs mt-1 text-bsi-text-tertiary">
                Alerts appear for close games, upsets, and no-hitters.
              </p>
            </div>
          )}

          {alerts.map((alert) => {
            const { icon, label } = ALERT_ICONS[alert.type];

            return (
              <div
                key={alert.id}
                className="rounded-lg border border-bsi-border bg-bsi-card p-3 hover:bg-bsi-hover transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0 mt-0.5" role="img" aria-label={label}>
                    {icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-bsi-accent uppercase tracking-wide">
                        {label}
                      </span>
                      <span className="text-xs text-bsi-text-tertiary whitespace-nowrap">
                        {relativeTime(alert.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-bsi-text-primary mt-1 leading-snug">
                      {alert.title}
                    </p>
                    <p className="text-xs text-bsi-text-secondary mt-0.5 leading-relaxed">
                      {alert.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
