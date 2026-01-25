'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Footer } from '@/components/layout-ds/Footer';

interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'down';
  latency?: number;
  message?: string;
}

interface HealthzResponse {
  ok: boolean;
  status: 'healthy' | 'degraded' | 'down';
  version: string;
  colo: string;
  region: string;
  timestamp: string;
  services: {
    d1: ServiceHealth;
    kv: ServiceHealth;
  };
}

const STATUS_COLORS = {
  healthy: { bg: 'bg-success/20', text: 'text-success', dot: 'bg-success' },
  degraded: { bg: 'bg-warning/20', text: 'text-warning', dot: 'bg-warning' },
  down: { bg: 'bg-error/20', text: 'text-error', dot: 'bg-error' },
};

const STATUS_LABELS = {
  healthy: 'Operational',
  degraded: 'Degraded',
  down: 'Down',
};

function StatusDot({ status }: { status: 'healthy' | 'degraded' | 'down' }) {
  const colors = STATUS_COLORS[status];
  return <span className={`inline-block w-3 h-3 rounded-full ${colors.dot} animate-pulse`} />;
}

function ServiceCard({
  name,
  description,
  health,
}: {
  name: string;
  description: string;
  health: ServiceHealth | null;
}) {
  const status = health?.status ?? 'down';
  const colors = STATUS_COLORS[status];

  return (
    <Card padding="lg" className={`${colors.bg} border-l-4 border-l-current ${colors.text}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-display text-lg font-bold text-white">{name}</h3>
        <div className="flex items-center gap-2">
          <StatusDot status={status} />
          <span className={`text-sm font-semibold ${colors.text}`}>{STATUS_LABELS[status]}</span>
        </div>
      </div>
      <p className="text-text-tertiary text-sm mb-2">{description}</p>
      {health?.latency !== undefined && (
        <p className="text-text-muted text-xs">Response time: {health.latency}ms</p>
      )}
      {health?.message && <p className="text-error text-xs mt-1">{health.message}</p>}
    </Card>
  );
}

export default function StatusPage() {
  const [health, setHealth] = useState<HealthzResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      const response = await fetch('/api/healthz', {
        cache: 'no-store',
      });
      const data = (await response.json()) as HealthzResponse;
      setHealth(data);
      setError(null);
      setLastChecked(new Date());
    } catch {
      setError('Failed to fetch status. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const overallStatus = health?.status ?? 'down';
  const overallColors = STATUS_COLORS[overallStatus];

  return (
    <>
      <main id="main-content">
        <Section padding="lg" className="pt-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />

          <Container center>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-display text-center mb-4">
              System <span className="text-gradient-blaze">Status</span>
            </h1>
            <p className="text-text-secondary text-center max-w-2xl mx-auto mb-8">
              Real-time status of Blaze Sports Intel services.
            </p>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-2 border-burnt-orange border-t-transparent rounded-full animate-spin" />
                <p className="text-text-tertiary mt-4">Checking status...</p>
              </div>
            ) : error ? (
              <Card padding="lg" className="max-w-md mx-auto text-center">
                <p className="text-error mb-4">{error}</p>
                <button onClick={fetchHealth} className="text-burnt-orange hover:underline">
                  Try again
                </button>
              </Card>
            ) : (
              <>
                <Card
                  padding="lg"
                  className={`max-w-md mx-auto text-center ${overallColors.bg} mb-8`}
                >
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <StatusDot status={overallStatus} />
                    <span className={`font-display text-2xl font-bold ${overallColors.text}`}>
                      {overallStatus === 'healthy'
                        ? 'All Systems Operational'
                        : overallStatus === 'degraded'
                          ? 'Partial Degradation'
                          : 'System Outage'}
                    </span>
                  </div>
                  {health?.colo && (
                    <p className="text-text-muted text-sm">
                      Serving from {health.colo} ({health.region})
                    </p>
                  )}
                </Card>
              </>
            )}
          </Container>
        </Section>

        {!loading && !error && health && (
          <Section padding="lg" background="charcoal">
            <Container>
              <div className="max-w-2xl mx-auto space-y-4">
                <h2 className="font-display text-xl font-bold uppercase tracking-display mb-6">
                  Services
                </h2>

                <ServiceCard
                  name="D1 Database"
                  description="Primary data store for sports data, user preferences, and historical records."
                  health={health.services.d1}
                />

                <ServiceCard
                  name="KV Cache"
                  description="Edge caching layer for live scores, API responses, and session data."
                  health={health.services.kv}
                />

                <div className="pt-6 border-t border-border-subtle">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-muted">
                      Last checked: {lastChecked?.toLocaleTimeString() ?? 'Never'}
                    </span>
                    <button onClick={fetchHealth} className="text-burnt-orange hover:underline">
                      Refresh now
                    </button>
                  </div>
                  <p className="text-text-muted text-xs mt-2">Auto-refreshes every 30 seconds</p>
                </div>
              </div>
            </Container>
          </Section>
        )}

        <Section padding="lg">
          <Container center>
            <div className="max-w-xl mx-auto text-center">
              <h2 className="font-display text-xl font-bold uppercase tracking-display mb-4">
                Incident History
              </h2>
              <p className="text-text-secondary mb-6">No recent incidents to report.</p>
              <p className="text-text-muted text-sm">
                For urgent issues, contact{' '}
                <a
                  href="mailto:support@blazesportsintel.com"
                  className="text-burnt-orange hover:underline"
                >
                  support@blazesportsintel.com
                </a>
              </p>
            </div>
          </Container>
        </Section>

        <Section padding="lg" background="charcoal">
          <Container center>
            <div className="max-w-xl mx-auto text-center">
              <h2 className="font-display text-xl font-bold uppercase tracking-display mb-4">
                API Status
              </h2>
              <p className="text-text-secondary mb-4">
                Check the health endpoint directly for programmatic monitoring.
              </p>
              <code className="block bg-midnight p-4 rounded text-sm font-mono text-text-secondary overflow-x-auto mb-4">
                GET https://blazesportsintel.com/api/healthz
              </code>
              <Link href="/developers" className="text-burnt-orange hover:underline">
                View API Documentation &rarr;
              </Link>
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
