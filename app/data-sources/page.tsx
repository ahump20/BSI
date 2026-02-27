import Link from 'next/link';
import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Footer } from '@/components/layout-ds/Footer';

export const metadata: Metadata = {
  title: 'Data Sources | Blaze Sports Intel',
  description:
    'Every data provider BSI uses, what it powers, how often it refreshes, and seasonal caveats. No anonymous data.',
};

interface ProviderRow {
  name: string;
  url: string;
  role: string;
  sports: string[];
  refresh: string;
  notes?: string;
}

const PROVIDERS: ProviderRow[] = [
  {
    name: 'Highlightly Pro',
    url: 'https://highlightly.net',
    role: 'Primary pipeline — scores, rankings, team stats, player profiles',
    sports: ['College Baseball', 'College Football'],
    refresh: 'Live scores every 30s; standings/rankings every 30 min',
    notes: 'Canonical source. All new integrations wire here first.',
  },
  {
    name: 'SportsDataIO',
    url: 'https://sportsdata.io',
    role: 'Scores, standings, rosters, player statistics, schedules',
    sports: ['MLB', 'NFL', 'NBA', 'CFB', 'CBB'],
    refresh: 'Live scores every 30–60s; rosters daily',
    notes: 'Primary for all professional leagues. Authenticated via Ocp-Apim-Subscription-Key header.',
  },
  {
    name: 'ESPN Site API',
    url: 'https://site.api.espn.com',
    role: 'Scores, rankings, and schedules for college baseball',
    sports: ['College Baseball'],
    refresh: 'Live scores every 60s; rankings weekly',
    notes:
      'Fallback source. ESPN dates labeled UTC are actually ET — BSI normalizes to America/Chicago. No API key required.',
  },
];

const STORAGE_TIERS = [
  {
    layer: 'KV (Cloudflare)',
    purpose: 'Hot cache for scores, standings, rankings',
    ttls: 'Scores: 60s | Standings: 30 min | Rankings: 30 min | Teams/Players: 24h',
  },
  {
    layer: 'D1 (Cloudflare)',
    purpose: 'Structured relational data — game records, player stats, editorial metadata',
    ttls: 'Persistent — no TTL, data written by ingest workers',
  },
  {
    layer: 'R2 (Cloudflare)',
    purpose: 'Static assets, media, archives, embeddings',
    ttls: 'Permanent storage with lifecycle rules for archival',
  },
];

const SEASONAL_CAVEATS = [
  {
    sport: 'MLB',
    caveat:
      'Spring Training (Feb 15 – Mar 25): limited SportsDataIO coverage; some games unavailable until first pitch. Finalization delays of 5–10 minutes are expected.',
  },
  {
    sport: 'College Baseball',
    caveat:
      'Preseason (Feb 14 – Feb 20): opening weekend coverage may be patchy until conferences begin full play. Rankings update weekly during the regular season.',
  },
  {
    sport: 'NFL',
    caveat:
      'Off-season (Feb – Aug): no live scores. Preseason games begin in August with limited statistical depth.',
  },
  {
    sport: 'NBA',
    caveat:
      'Off-season (Jun – Oct): no live scores. Summer League coverage is not included.',
  },
];

export default function DataSourcesPage() {
  return (
    <>
      <div>
        <Section padding="lg" className="pt-6">
          <Container>
            <div className="max-w-4xl mx-auto">
              <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display text-text-primary mb-3">
                Data Sources
              </h1>
              <p className="text-text-tertiary text-lg leading-relaxed mb-12 max-w-2xl">
                Every feed on BSI includes timestamps and source attribution. This page documents
                exactly where the data comes from, how often it refreshes, and what to expect
                during edge-case windows like Spring Training and early-season coverage.
              </p>

              {/* Providers */}
              <section className="mb-16">
                <h2 className="font-display text-xl font-semibold uppercase tracking-wide text-text-primary mb-6">
                  Providers
                </h2>
                <div className="space-y-4">
                  {PROVIDERS.map((p) => (
                    <div
                      key={p.name}
                      className="bg-surface-light border border-border-subtle rounded-xl p-5 sm:p-6"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                        <div>
                          <a
                            href={p.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-text-primary font-semibold hover:text-burnt-orange transition-colors"
                          >
                            {p.name}
                          </a>
                          <p className="text-text-muted text-sm mt-0.5">{p.role}</p>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {p.sports.map((s) => (
                            <span
                              key={s}
                              className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-burnt-orange bg-burnt-orange/10 rounded-md"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-text-muted text-xs uppercase tracking-wider">Refresh</span>
                          <p className="text-text-secondary mt-0.5">{p.refresh}</p>
                        </div>
                        {p.notes && (
                          <div>
                            <span className="text-text-muted text-xs uppercase tracking-wider">Notes</span>
                            <p className="text-text-secondary mt-0.5">{p.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Storage Layers */}
              <section className="mb-16">
                <h2 className="font-display text-xl font-semibold uppercase tracking-wide text-text-primary mb-6">
                  Storage Layers
                </h2>
                <div className="bg-surface-light border border-border-subtle rounded-xl overflow-hidden">
                  <div className="grid grid-cols-[1fr_2fr_2fr] gap-px bg-surface-light text-xs uppercase tracking-wider text-text-muted font-medium">
                    <div className="bg-background-primary p-3 sm:p-4">Layer</div>
                    <div className="bg-background-primary p-3 sm:p-4">Purpose</div>
                    <div className="bg-background-primary p-3 sm:p-4">TTL / Lifecycle</div>
                  </div>
                  {STORAGE_TIERS.map((t) => (
                    <div
                      key={t.layer}
                      className="grid grid-cols-[1fr_2fr_2fr] gap-px bg-surface-light text-sm"
                    >
                      <div className="bg-background-primary p-3 sm:p-4 text-text-primary font-medium">{t.layer}</div>
                      <div className="bg-background-primary p-3 sm:p-4 text-text-tertiary">{t.purpose}</div>
                      <div className="bg-background-primary p-3 sm:p-4 text-text-muted">{t.ttls}</div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Seasonal Caveats */}
              <section className="mb-16">
                <h2 className="font-display text-xl font-semibold uppercase tracking-wide text-text-primary mb-6">
                  Seasonal Caveats
                </h2>
                <div className="space-y-3">
                  {SEASONAL_CAVEATS.map((c) => (
                    <div
                      key={c.sport}
                      className="flex gap-4 items-start bg-surface-light border border-border-subtle rounded-xl p-4 sm:p-5"
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider text-burnt-orange mt-0.5 shrink-0 w-20">
                        {c.sport}
                      </span>
                      <p className="text-sm text-text-tertiary leading-relaxed">{c.caveat}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Philosophy */}
              <section className="mb-16">
                <div className="bg-surface-light border border-border-subtle rounded-xl p-6 sm:p-8">
                  <h2 className="font-display text-xl font-semibold uppercase tracking-wide text-text-primary mb-4">
                    How It Works
                  </h2>
                  <div className="text-sm text-text-tertiary leading-relaxed space-y-3">
                    <p>
                      External APIs are never called from your browser. A Cloudflare Worker sits
                      between you and every data provider — it fetches, transforms, caches, and
                      serves the result. A cron job pre-warms the cache every minute for in-season
                      sports so client requests read from KV in under 10ms.
                    </p>
                    <p>
                      Every API response carries a <code className="text-text-secondary bg-surface-light px-1.5 py-0.5 rounded text-xs">meta</code> object
                      with <code className="text-text-secondary bg-surface-light px-1.5 py-0.5 rounded text-xs">source</code>,{' '}
                      <code className="text-text-secondary bg-surface-light px-1.5 py-0.5 rounded text-xs">fetched_at</code>, and{' '}
                      <code className="text-text-secondary bg-surface-light px-1.5 py-0.5 rounded text-xs">timezone</code>.
                      The UI always shows when data was last updated and where it came from.
                    </p>
                    <p>
                      When a primary source fails, the system falls back to the next provider in the
                      chain — then to the last-known-good KV snapshot. You&apos;ll always see data;
                      the source label tells you how fresh it is.
                    </p>
                  </div>
                </div>
              </section>

              {/* Cross-link to expanded methodology */}
              <div className="bg-burnt-orange/5 border border-burnt-orange/20 rounded-xl p-5 sm:p-6 mb-12">
                <p className="text-sm text-text-tertiary leading-relaxed">
                  For cross-reference methodology, API response times, and freshness guarantees,
                  see the expanded{' '}
                  <Link href="/models/data-quality" className="text-burnt-orange hover:text-ember font-semibold transition-colors">
                    Data Quality & Sources
                  </Link>{' '}
                  page in the Models hub.
                </p>
              </div>

              {/* Back links */}
              <div className="flex flex-wrap gap-4 text-sm text-text-muted">
                <Link href="/dashboard" className="hover:text-text-secondary transition-colors">
                  &#8592; Dashboard
                </Link>
                <Link href="/models" className="hover:text-text-secondary transition-colors">
                  Models & Methodology
                </Link>
                <Link href="/about" className="hover:text-text-secondary transition-colors">
                  About BSI
                </Link>
              </div>
            </div>
          </Container>
        </Section>
      </div>
      <Footer />
    </>
  );
}
