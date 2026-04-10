'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { getReadApiUrl } from '@/lib/utils/public-api';

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
  freshness?: FreshnessPublic | null;
}

interface FreshnessPublic {
  ranAt: string;
  summary: { fresh: number; stale: number; degraded: number; missing: number; total: number };
  upstream: Array<{ provider: string; status: string }>;
  cronWorkers: Array<{ name: string; status: string }>;
}

interface StatusApiRaw {
  /**
   * Merged overall status from /api/status. When present, trust it — it
   * reconciles the synthetic monitor signal with the daily freshness audit
   * and fixes the single-blip false positive.
   */
  overall?: 'healthy' | 'degraded' | 'down' | 'unknown';
  endpoints?: EndpointStatus[];
  results?: EndpointStatus[];
  timestamp?: string;
  checked_at?: string;
  /** Public freshness summary from the daily audit. */
  freshness?: FreshnessPublic | null;
}

function isEndpointHealthy(e: EndpointStatus): boolean {
  const s = e.status as string | number;
  return s === 'ok' || s === 200 || (typeof s === 'number' && s >= 200 && s < 300);
}

function getOverallFromEndpoints(endpoints: EndpointStatus[]): 'healthy' | 'degraded' | 'down' {
  const failed = endpoints.filter((e) => !isEndpointHealthy(e)).length;
  if (failed === 0) return 'healthy';
  if (failed < endpoints.length) return 'degraded';
  return 'down';
}

const overallConfig = {
  healthy: { label: 'All Systems Operational', color: 'text-bsi-primary', bg: 'bg-bsi-primary/10 border-bsi-primary/30' },
  degraded: { label: 'Partial Degradation', color: 'text-warning', bg: 'bg-warning/10 border-warning/30' },
  down: { label: 'Major Outage', color: 'text-error', bg: 'bg-error/10 border-error/30' },
};

export default function StatusPage() {
  const [data, setData] = useState<StatusSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    // Parse the merged /api/status response. Prefer `overall` from the
    // server (it's already reconciled with the daily freshness audit and
    // avoids single-blip false positives). Fall back to computing from
    // individual endpoint results for legacy compat.
    function parseStatus(json: StatusApiRaw): StatusSummary {
      const endpoints: EndpointStatus[] = json.endpoints || json.results || [];
      const serverOverall = json.overall && json.overall !== 'unknown' ? json.overall : null;
      const overall = serverOverall ?? getOverallFromEndpoints(endpoints);
      const timestamp = json.timestamp || json.checked_at || new Date().toISOString();
      return { timestamp, overall, endpoints, freshness: json.freshness ?? null };
    }

    async function fetchStatus() {
      try {
        const res = await fetch(getReadApiUrl('/api/status'), { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as StatusApiRaw;
        setData(parseStatus(json));
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError(err instanceof Error ? err.message : 'Failed to load status');
        }
      } finally {
        clearTimeout(timeout);
        setLoading(false);
      }
    }

    fetchStatus();
    const interval = setInterval(() => {
      fetch(getReadApiUrl('/api/status'), { signal: AbortSignal.timeout(8000) })
        .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json() as Promise<StatusApiRaw>; })
        .then(json => {
          setData(parseStatus(json));
        })
        .catch(() => { /* silent refresh failure */ });
    }, 60_000);
    return () => { controller.abort(); clearTimeout(timeout); clearInterval(interval); };
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
                      data.overall === 'healthy' ? 'bg-bsi-primary' :
                      data.overall === 'degraded' ? 'bg-warning' : 'bg-error'
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

                {/* Data Pipelines (from daily freshness audit) */}
                {data.freshness && (
                  <Card padding="lg" className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
                        Data Pipelines
                      </h2>
                      <span className="text-[11px] text-text-tertiary font-mono tabular-nums">
                        audit ran {new Date(data.freshness.ranAt).toLocaleString('en-US', {
                          timeZone: 'America/Chicago',
                          month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                        })} CT
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                      <div className="text-center">
                        <div className="text-2xl font-bold tabular-nums text-bsi-primary">
                          {data.freshness.summary.fresh}
                        </div>
                        <div className="text-[10px] uppercase tracking-wider text-text-tertiary">Fresh</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold tabular-nums text-warning">
                          {data.freshness.summary.degraded}
                        </div>
                        <div className="text-[10px] uppercase tracking-wider text-text-tertiary">Degraded</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold tabular-nums ${data.freshness.summary.stale > 0 ? 'text-error' : 'text-text-tertiary'}`}>
                          {data.freshness.summary.stale}
                        </div>
                        <div className="text-[10px] uppercase tracking-wider text-text-tertiary">Stale</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold tabular-nums ${data.freshness.summary.missing > 0 ? 'text-error' : 'text-text-tertiary'}`}>
                          {data.freshness.summary.missing}
                        </div>
                        <div className="text-[10px] uppercase tracking-wider text-text-tertiary">Missing</div>
                      </div>
                    </div>
                    {/* Upstream APIs + Cron Workers rows */}
                    {(data.freshness.upstream.length > 0 || data.freshness.cronWorkers.length > 0) && (
                      <div className="border-t border-border-subtle pt-4 space-y-3">
                        {data.freshness.upstream.length > 0 && (
                          <div>
                            <div className="text-[10px] font-mono uppercase tracking-wider text-text-tertiary mb-2">
                              Upstream APIs
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {data.freshness.upstream.map((u) => (
                                <span
                                  key={u.provider}
                                  className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-xs ${
                                    u.status === 'ok' ? 'border-bsi-primary/30 text-bsi-primary' :
                                    u.status === 'slow' ? 'border-warning/30 text-warning' :
                                    'border-error/30 text-error'
                                  }`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    u.status === 'ok' ? 'bg-bsi-primary' :
                                    u.status === 'slow' ? 'bg-warning' : 'bg-error'
                                  }`} />
                                  {u.provider}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {data.freshness.cronWorkers.length > 0 && (
                          <div>
                            <div className="text-[10px] font-mono uppercase tracking-wider text-text-tertiary mb-2">
                              Background Jobs
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {data.freshness.cronWorkers.map((w) => (
                                <span
                                  key={w.name}
                                  className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[11px] font-mono ${
                                    w.status === 'ok' ? 'border-bsi-primary/30 text-bsi-primary' :
                                    w.status === 'degraded' ? 'border-warning/30 text-warning' :
                                    'border-error/30 text-error'
                                  }`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    w.status === 'ok' ? 'bg-bsi-primary' :
                                    w.status === 'degraded' ? 'bg-warning' : 'bg-error'
                                  }`} />
                                  {w.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                )}

                {/* Endpoint Grid */}
                <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">
                  Public Endpoints
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {data.endpoints.map((endpoint) => {
                    const healthy = isEndpointHealthy(endpoint);
                    const slow = endpoint.status === 'timeout';
                    return (
                    <Card key={endpoint.name} padding="md">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-text-primary truncate">
                          {endpoint.name}
                        </span>
                        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                          healthy ? 'bg-bsi-primary' :
                          slow ? 'bg-warning' : 'bg-error'
                        }`} />
                      </div>
                      <div className="flex items-center justify-between text-xs text-text-tertiary">
                        <Badge
                          variant={healthy ? 'success' : slow ? 'warning' : 'error'}
                          size="sm"
                        >
                          {healthy ? 'Healthy' : slow ? 'Slow' : 'Down'}
                        </Badge>
                        {endpoint.latency != null && (
                          <span className="tabular-nums">{endpoint.latency}ms</span>
                        )}
                      </div>
                    </Card>
                    );
                  })}
                </div>

                {/* Refresh Note */}
                <p className="text-center text-xs text-text-tertiary mt-8">
                  Auto-refreshes every 60 seconds. Endpoints checked every 5 minutes; data pipelines audited daily.
                </p>
              </>
            ) : null}
          </Container>
        </Section>
      </div>

    </>
  );
}
