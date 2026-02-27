'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Footer } from '@/components/layout-ds/Footer';

interface EndpointStatus {
  name: string;
  url?: string;
  status: 'ok' | 'error' | 'timeout';
  latency?: number;
  statusCode?: number;
}

interface StatusSummary {
  timestamp: string;
  overall: 'healthy' | 'degraded' | 'down';
  endpoints: EndpointStatus[];
}

interface StatusApiRaw {
  endpoints?: EndpointStatus[];
  results?: EndpointStatus[];
  overall?: 'healthy' | 'degraded' | 'down';
  timestamp?: string;
  checked_at?: string;
}

function getOverallFromEndpoints(endpoints: EndpointStatus[]): 'healthy' | 'degraded' | 'down' {
  const failed = endpoints.filter((e) => e.status !== 'ok').length;
  if (failed === 0) return 'healthy';
  if (failed < endpoints.length) return 'degraded';
  return 'down';
}

const overallConfig = {
  healthy: { label: 'All Systems Operational', color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/30' },
  degraded: { label: 'Partial Degradation', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/30' },
  down: { label: 'Major Outage', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/30' },
};

export default function StatusPage() {
  const [data, setData] = useState<StatusSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchStatus() {
      try {
        const res = await fetch('/api/status');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as StatusApiRaw;

        if (!mounted) return;

        // Normalize: the endpoint may return different shapes
        const endpoints: EndpointStatus[] = json.endpoints || json.results || [];
        const overall = json.overall || getOverallFromEndpoints(endpoints);
        const timestamp = json.timestamp || json.checked_at || new Date().toISOString();

        setData({ timestamp, overall, endpoints });
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to load status');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchStatus();
    const interval = setInterval(fetchStatus, 60_000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const overall = data ? overallConfig[data.overall] : null;

  return (
    <>
      <div>
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-border-subtle">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link href="/" className="text-text-tertiary hover:text-burnt-orange transition-colors">Home</Link>
              <span className="text-text-tertiary">/</span>
              <span className="text-text-primary font-medium">System Status</span>
            </nav>
          </Container>
        </Section>

        {/* Header */}
        <Section padding="md" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />
          <Container>
            <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display text-gradient-blaze">
              System Status
            </h1>
            <p className="text-text-secondary mt-2">
              Real-time health of BSI data pipelines and endpoints
            </p>
          </Container>
        </Section>

        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-burnt-orange mb-4" />
                <p className="text-text-secondary">Checking systems...</p>
              </div>
            ) : error ? (
              <Card padding="lg" className="text-center">
                <p className="text-error mb-2">Unable to load system status</p>
                <p className="text-text-tertiary text-sm">{error}</p>
              </Card>
            ) : data ? (
              <>
                {/* Overall Status Banner */}
                <Card padding="lg" className={`mb-8 border ${overall?.bg}`}>
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full ${
                      data.overall === 'healthy' ? 'bg-green-400' :
                      data.overall === 'degraded' ? 'bg-yellow-400' : 'bg-red-400'
                    }`} />
                    <span className={`text-lg font-semibold ${overall?.color}`}>
                      {overall?.label}
                    </span>
                  </div>
                  <p className="text-text-tertiary text-xs mt-2">
                    Last checked: {new Date(data.timestamp).toLocaleString('en-US', {
                      timeZone: 'America/Chicago',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })} CT
                  </p>
                </Card>

                {/* Endpoint Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {data.endpoints.map((endpoint) => (
                    <Card key={endpoint.name} padding="md">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-text-primary truncate">
                          {endpoint.name}
                        </span>
                        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                          endpoint.status === 'ok' ? 'bg-green-400' :
                          endpoint.status === 'timeout' ? 'bg-yellow-400' : 'bg-red-400'
                        }`} />
                      </div>
                      <div className="flex items-center justify-between text-xs text-text-tertiary">
                        <Badge
                          variant={endpoint.status === 'ok' ? 'success' : endpoint.status === 'timeout' ? 'warning' : 'error'}
                          size="sm"
                        >
                          {endpoint.status === 'ok' ? 'Healthy' : endpoint.status === 'timeout' ? 'Slow' : 'Down'}
                        </Badge>
                        {endpoint.latency != null && (
                          <span className="tabular-nums">{endpoint.latency}ms</span>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Refresh Note */}
                <p className="text-center text-xs text-text-tertiary mt-8">
                  Auto-refreshes every 60 seconds. Checks run every 5 minutes via synthetic monitor.
                </p>
              </>
            ) : null}
          </Container>
        </Section>
      </div>

      <Footer />
    </>
  );
}
