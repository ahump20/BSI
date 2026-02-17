'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { CiteWidget } from '@/components/ui/CiteWidget';
import { JsonLd } from '@/components/JsonLd';
import { Footer } from '@/components/layout-ds/Footer';
import { PROVIDERS, STORAGE_TIERS, SEASONAL_CAVEATS } from '@/lib/data/data-sources';
import { useSportData } from '@/lib/hooks/useSportData';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProviderHealth {
  status: string;
  lastSuccessAt?: string;
  lastCheckAt: string;
}

interface HealthProvidersResponse {
  providers: Record<string, ProviderHealth>;
  checkedAt: string | null;
  activeSports: string[];
}

// ---------------------------------------------------------------------------
// Provider status helpers
// ---------------------------------------------------------------------------

function statusColor(status: string): string {
  switch (status) {
    case 'healthy': return 'bg-green-400';
    case 'degraded': return 'bg-yellow-400';
    case 'down': return 'bg-red-400';
    default: return 'bg-white/20';
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'healthy': return 'Healthy';
    case 'degraded': return 'Degraded';
    case 'down': return 'Down';
    default: return 'Unknown';
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DataQualityPage() {
  const { data: health, loading, lastUpdated } =
    useSportData<HealthProvidersResponse>('/api/health/providers', { refreshInterval: 30_000 });

  const hasLiveHealth = health && health.providers && Object.keys(health.providers).length > 0;

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'TechArticle',
          headline: 'BSI Data Quality & Sources',
          author: { '@type': 'Person', name: 'Austin Humphrey' },
          publisher: { '@type': 'Organization', name: 'Blaze Sports Intel' },
          datePublished: '2026-02-17',
          url: 'https://blazesportsintel.com/models/data-quality',
          description: 'Data quality methodology, source documentation, and freshness guarantees.',
        }}
      />
      <main id="main-content">
        <Section padding="sm" className="border-b border-white/10">
          <Container>
            <Breadcrumb
              items={[
                { label: 'Home', href: '/' },
                { label: 'Models', href: '/models' },
                { label: 'Data Quality' },
              ]}
            />
          </Container>
        </Section>

        <Section padding="lg">
          <Container size="narrow">
            <Badge variant="success" className="mb-4">Live — v1.0</Badge>
            <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide text-white mb-4">
              Data Quality & Sources
            </h1>
            <p className="text-white/50 text-lg leading-relaxed mb-12">
              Every feed on BSI includes timestamps and source attribution. This page documents
              exactly where the data comes from, how BSI validates it, and what to expect during
              edge-case windows.
            </p>

            {/* Live Provider Health */}
            {(hasLiveHealth || loading) && (
              <section className="mb-16">
                <h2 className="font-display text-xl font-semibold uppercase tracking-wide text-white mb-6">
                  Live Provider Status
                </h2>
                {loading && !hasLiveHealth ? (
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 animate-pulse">
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-10 bg-white/[0.04] rounded-lg" />
                      ))}
                    </div>
                  </div>
                ) : hasLiveHealth ? (
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 space-y-3">
                    {Object.entries(health!.providers).map(([name, provider]) => (
                      <div key={name} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className={`w-2 h-2 rounded-full ${statusColor(provider.status)}`} />
                          <span className="text-sm text-white/60 font-medium capitalize">{name}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-white/30">
                          <span>{statusLabel(provider.status)}</span>
                          {provider.lastCheckAt && (
                            <span className="font-mono">
                              Checked {new Date(provider.lastCheckAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {health!.activeSports.length > 0 && (
                      <div className="pt-3 border-t border-white/[0.06] text-xs text-white/20">
                        Active sports: {health!.activeSports.join(', ')}
                      </div>
                    )}
                    {lastUpdated && (
                      <p className="text-[10px] text-white/15 pt-1">
                        Updated {lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' })}
                      </p>
                    )}
                  </div>
                ) : null}
              </section>
            )}

            {/* Cross-Reference Methodology */}
            <section className="mb-16">
              <h2 className="font-display text-xl font-semibold uppercase tracking-wide text-white mb-6">
                Cross-Reference Methodology
              </h2>
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 sm:p-6 space-y-4">
                <p className="text-sm text-white/50 leading-relaxed">
                  BSI validates data by cross-referencing across multiple providers before serving
                  it to the frontend. The validation pipeline works in three stages:
                </p>
                <div className="space-y-3">
                  {[
                    {
                      step: '1. Primary fetch',
                      detail: 'The canonical provider for each sport (Highlightly for college, SportsDataIO for pro leagues) returns the initial dataset. This is cached in KV with a short TTL.',
                    },
                    {
                      step: '2. Cross-reference',
                      detail: 'For critical data (scores, standings, rankings), a secondary provider is queried. If the primary and secondary disagree on final scores or standings positions, the conflict is logged and the more recently updated source is preferred.',
                    },
                    {
                      step: '3. Fallback chain',
                      detail: 'If the primary source fails (timeout, 5xx, rate limit), the system falls back to the next provider in priority order, then to the last-known-good KV snapshot. The source label in the UI always reflects which provider actually served the data.',
                    },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-4 items-start">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#BF5700] mt-0.5 shrink-0 w-32">
                        {item.step}
                      </span>
                      <p className="text-sm text-white/50 leading-relaxed">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* API Response Time */}
            <section className="mb-16">
              <h2 className="font-display text-xl font-semibold uppercase tracking-wide text-white mb-6">
                API Response Time
              </h2>
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 sm:p-6">
                <p className="text-sm text-white/50 leading-relaxed mb-4">
                  BSI&#39;s Cloudflare Workers respond in under 50ms for cached data. The
                  architecture ensures this through two mechanisms:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white/[0.02] rounded-lg p-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#BF5700]">KV Cache Hit</span>
                    <p className="text-2xl font-display text-white mt-1">&lt;10ms</p>
                    <p className="text-xs text-white/30 mt-1">Pre-warmed by cron every 60s during in-season</p>
                  </div>
                  <div className="bg-white/[0.02] rounded-lg p-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#BF5700]">Cache Miss</span>
                    <p className="text-2xl font-display text-white mt-1">200–800ms</p>
                    <p className="text-xs text-white/30 mt-1">Fetches from upstream provider, writes to KV, returns</p>
                  </div>
                </div>
                <p className="text-xs text-white/30 mt-4">
                  Health endpoint:{' '}
                  <code className="text-white/40 bg-white/[0.04] px-1.5 py-0.5 rounded font-mono">
                    /api/health
                  </code>{' '}
                  — returns current uptime, cache hit rate, and p95 latency.
                </p>
              </div>
            </section>

            {/* Freshness Guarantee */}
            <section className="mb-16">
              <h2 className="font-display text-xl font-semibold uppercase tracking-wide text-white mb-6">
                Freshness Guarantee
              </h2>
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 sm:p-6">
                <p className="text-sm text-white/50 leading-relaxed mb-4">
                  Every BSI API response includes a <code className="text-white/70 bg-white/[0.06] px-1.5 py-0.5 rounded text-xs font-mono">meta</code> object
                  that tells you exactly when the data was fetched and where it came from:
                </p>
                <pre className="bg-white/[0.02] rounded-lg p-4 text-xs font-mono text-white/50 overflow-x-auto leading-relaxed">
{`{
  "data": { ... },
  "meta": {
    "source": "highlightly",
    "fetched_at": "2026-02-17T14:30:00.000Z",
    "timezone": "America/Chicago"
  }
}`}
                </pre>
                <div className="mt-4 space-y-2">
                  <div className="flex gap-3 text-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/25 mt-0.5 shrink-0 w-20">source</span>
                    <span className="text-white/40">Which provider served this data</span>
                  </div>
                  <div className="flex gap-3 text-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/25 mt-0.5 shrink-0 w-20">fetched_at</span>
                    <span className="text-white/40">ISO 8601 timestamp of when the Worker fetched from the provider</span>
                  </div>
                  <div className="flex gap-3 text-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/25 mt-0.5 shrink-0 w-20">timezone</span>
                    <span className="text-white/40">Always America/Chicago — BSI normalizes all timestamps to Central</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Providers — reused from shared data */}
            <section className="mb-16">
              <h2 className="font-display text-xl font-semibold uppercase tracking-wide text-white mb-6">
                Providers
              </h2>
              <div className="space-y-4">
                {PROVIDERS.map((p) => {
                  // Match live health data to this provider if available
                  const liveStatus = hasLiveHealth
                    ? health!.providers[p.name.toLowerCase()] || health!.providers[p.name.toLowerCase().replace(/\s+/g, '-')]
                    : null;

                  return (
                    <div
                      key={p.name}
                      className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 sm:p-6"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          {liveStatus && (
                            <span className={`w-2 h-2 rounded-full shrink-0 ${statusColor(liveStatus.status)}`} />
                          )}
                          <div>
                            <a
                              href={p.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-white font-semibold hover:text-[#BF5700] transition-colors"
                            >
                              {p.name}
                            </a>
                            <p className="text-white/40 text-sm mt-0.5">{p.role}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {p.sports.map((s) => (
                            <span
                              key={s}
                              className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#BF5700] bg-[#BF5700]/10 rounded-md"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-white/25 text-xs uppercase tracking-wider">Refresh</span>
                          <p className="text-white/60 mt-0.5">{p.refresh}</p>
                        </div>
                        {p.notes && (
                          <div>
                            <span className="text-white/25 text-xs uppercase tracking-wider">Notes</span>
                            <p className="text-white/60 mt-0.5">{p.notes}</p>
                          </div>
                        )}
                      </div>
                      {liveStatus?.lastSuccessAt && (
                        <p className="text-[10px] text-white/15 mt-3">
                          Last successful fetch: {new Date(liveStatus.lastSuccessAt).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Storage Layers */}
            <section className="mb-16">
              <h2 className="font-display text-xl font-semibold uppercase tracking-wide text-white mb-6">
                Storage Layers
              </h2>
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
                <div className="grid grid-cols-[1fr_2fr_2fr] gap-px bg-white/[0.04] text-xs uppercase tracking-wider text-white/30 font-medium">
                  <div className="bg-[#0D0D0D] p-3 sm:p-4">Layer</div>
                  <div className="bg-[#0D0D0D] p-3 sm:p-4">Purpose</div>
                  <div className="bg-[#0D0D0D] p-3 sm:p-4">TTL / Lifecycle</div>
                </div>
                {STORAGE_TIERS.map((t) => (
                  <div
                    key={t.layer}
                    className="grid grid-cols-[1fr_2fr_2fr] gap-px bg-white/[0.04] text-sm"
                  >
                    <div className="bg-[#0D0D0D] p-3 sm:p-4 text-white font-medium">{t.layer}</div>
                    <div className="bg-[#0D0D0D] p-3 sm:p-4 text-white/50">{t.purpose}</div>
                    <div className="bg-[#0D0D0D] p-3 sm:p-4 text-white/40">{t.ttls}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* How It Works */}
            <section className="mb-16">
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 sm:p-8">
                <h2 className="font-display text-xl font-semibold uppercase tracking-wide text-white mb-4">
                  How It Works
                </h2>
                <div className="text-sm text-white/50 leading-relaxed space-y-3">
                  <p>
                    External APIs are never called from your browser. A Cloudflare Worker sits
                    between you and every data provider — it fetches, transforms, caches, and
                    serves the result. A cron job pre-warms the cache every minute for in-season
                    sports so client requests read from KV in under 10ms.
                  </p>
                  <p>
                    Every API response carries a <code className="text-white/70 bg-white/[0.06] px-1.5 py-0.5 rounded text-xs font-mono">meta</code> object
                    with <code className="text-white/70 bg-white/[0.06] px-1.5 py-0.5 rounded text-xs font-mono">source</code>,{' '}
                    <code className="text-white/70 bg-white/[0.06] px-1.5 py-0.5 rounded text-xs font-mono">fetched_at</code>, and{' '}
                    <code className="text-white/70 bg-white/[0.06] px-1.5 py-0.5 rounded text-xs font-mono">timezone</code>.
                    The UI always shows when data was last updated and where it came from.
                  </p>
                  <p>
                    When a primary source fails, the system falls back to the next provider in the
                    chain — then to the last-known-good KV snapshot. You&#39;ll always see data;
                    the source label tells you how fresh it is.
                  </p>
                </div>
              </div>
            </section>

            {/* Seasonal Caveats */}
            <section className="mb-16">
              <h2 className="font-display text-xl font-semibold uppercase tracking-wide text-white mb-6">
                Seasonal Caveats
              </h2>
              <div className="space-y-3">
                {SEASONAL_CAVEATS.map((c) => (
                  <div
                    key={c.sport}
                    className="flex gap-4 items-start bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 sm:p-5"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#BF5700] mt-0.5 shrink-0 w-20">
                      {c.sport}
                    </span>
                    <p className="text-sm text-white/50 leading-relaxed">{c.caveat}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Citation */}
            <CiteWidget
              title="BSI Data Quality & Sources"
              path="/models/data-quality"
              date="2026-02-17"
            />

            {/* Navigation */}
            <div className="mt-12 flex flex-wrap gap-4 text-sm text-white/30">
              <Link href="/models" className="hover:text-white/60 transition-colors">
                &#8592; All Models
              </Link>
              <Link href="/data-sources" className="hover:text-white/60 transition-colors">
                Legacy Data Sources Page
              </Link>
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
