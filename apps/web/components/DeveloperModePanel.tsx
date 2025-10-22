'use client';

import { useEffect, useMemo, useState } from 'react';

type FeatureFlagRecord = {
  key: string;
  label: string;
  description: string;
  owner: string;
  enabled: boolean;
  rollout: string;
  lastToggled?: string;
};

type FlagsResponse = {
  environment: string;
  updatedAt: string;
  flags: FeatureFlagRecord[];
};

const STATUS_COLORS: Record<string, string> = {
  enabled: 'var(--di-accent)',
  disabled: 'var(--di-text-muted)'
};

function formatTimestamp(timestamp?: string) {
  if (!timestamp) return '—';
  try {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (error) {
    console.warn('[DeveloperModePanel] Failed to format timestamp', error);
    return timestamp;
  }
}

export default function DeveloperModePanel() {
  const [flags, setFlags] = useState<FeatureFlagRecord[]>([]);
  const [environment, setEnvironment] = useState('');
  const [updatedAt, setUpdatedAt] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadFlags() {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch('/api/flags', {
          headers: { Accept: 'application/json' },
          cache: 'no-store'
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const payload = (await response.json()) as FlagsResponse;
        if (!isMounted) return;

        setFlags(payload.flags);
        setEnvironment(payload.environment);
        setUpdatedAt(payload.updatedAt);
      } catch (err) {
        console.error('[DeveloperModePanel] Failed to load flags', err);
        if (!isMounted) return;
        setError('Unable to load feature flags. Check API connectivity.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadFlags();

    return () => {
      isMounted = false;
    };
  }, []);

  const enabledCount = useMemo(() => flags.filter((flag) => flag.enabled).length, [flags]);

  return (
    <section className="dev-panel" aria-live="polite">
      <header className="dev-panel__header">
        <div>
          <p className="dev-panel__eyebrow">Developer Mode</p>
          <h2 className="dev-panel__title">Runtime Feature Flags</h2>
        </div>
        <div className="dev-panel__meta">
          <span className="dev-badge">{environment || '—'}</span>
          <span className="dev-panel__timestamp">Synced {formatTimestamp(updatedAt)}</span>
        </div>
      </header>

      {isLoading ? (
        <p className="dev-panel__status" role="status">
          Pulling the latest toggles from the edge...
        </p>
      ) : error ? (
        <p className="dev-panel__status dev-panel__status--error" role="alert">
          {error}
        </p>
      ) : (
        <>
          <div className="dev-panel__summary">
            <div>
              <p className="dev-panel__summary-label">Enabled</p>
              <p className="dev-panel__summary-value">{enabledCount}</p>
            </div>
            <div>
              <p className="dev-panel__summary-label">Total Flags</p>
              <p className="dev-panel__summary-value">{flags.length}</p>
            </div>
          </div>

          <ul className="dev-panel__list">
            {flags.map((flag) => {
              const status = flag.enabled ? 'enabled' : 'disabled';
              return (
                <li key={flag.key} className="dev-panel__item">
                  <div className="dev-panel__item-header">
                    <span className="dev-panel__item-label">{flag.label}</span>
                    <span
                      className="dev-panel__status-indicator"
                      style={{ color: STATUS_COLORS[status] }}
                    >
                      {flag.enabled ? 'ON' : 'OFF'}
                    </span>
                  </div>
                  <p className="dev-panel__item-description">{flag.description}</p>
                  <div className="dev-panel__item-footer">
                    <span>Owner: {flag.owner}</span>
                    <span>Rollout: {flag.rollout}</span>
                    <span>Last toggled: {formatTimestamp(flag.lastToggled)}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
