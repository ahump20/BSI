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
      <main id="main-content">
        <Section padding="lg" className="pt-28">
          <Container>
            <div className="max-w-4xl mx-auto">
              <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display text-white mb-3">
                Data Sources
              </h1>
              <p className="text-white/50 text-lg leading-relaxed mb-12 max-w-2xl">
                Every feed on BSI includes timestamps and source attribution. This page documents
                exactly where the data comes from, how often it refreshes, and what to expect
                during edge-case windows like Spring Training and early-season coverage.
              </p>

              {/* Providers */}
              <section className="mb-16">
                <h2 className="font-display text-xl font-semibold uppercase tracking-wide text-white mb-6">
                  Providers
                </h2>
                <div className="space-y-4">
                  {PROVIDERS.map((p) => (
                    <div
                      key={p.name}
                      className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 sm:p-6"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
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
                    </div>
                  ))}
                </div>
              </section>

              {/* Storage Layers */}
              <section className="mb-16">
                <h2 className="font-display text-xl font-semibold uppercase tracking-wide text-white mb-6">
                  Storage Layers
                </h2>
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
                  <div className="grid grid-cols-[1fr_2fr_2fr] gap-px bg-white/[0.04] text-xs uppercase tracking-wider text-white/30 font-medium">
                    <div className="bg-midnight p-3 sm:p-4">Layer</div>
                    <div className="bg-midnight p-3 sm:p-4">Purpose</div>
                    <div className="bg-midnight p-3 sm:p-4">TTL / Lifecycle</div>
                  </div>
                  {STORAGE_TIERS.map((t) => (
                    <div
                      key={t.layer}
                      className="grid grid-cols-[1fr_2fr_2fr] gap-px bg-white/[0.04] text-sm"
                    >
                      <div className="bg-midnight p-3 sm:p-4 text-white font-medium">{t.layer}</div>
                      <div className="bg-midnight p-3 sm:p-4 text-white/50">{t.purpose}</div>
                      <div className="bg-midnight p-3 sm:p-4 text-white/40">{t.ttls}</div>
                    </div>
                  ))}
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

              {/* Philosophy */}
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
                      Every API response carries a <code className="text-white/70 bg-white/[0.06] px-1.5 py-0.5 rounded text-xs">meta</code> object
                      with <code className="text-white/70 bg-white/[0.06] px-1.5 py-0.5 rounded text-xs">source</code>,{' '}
                      <code className="text-white/70 bg-white/[0.06] px-1.5 py-0.5 rounded text-xs">fetched_at</code>, and{' '}
                      <code className="text-white/70 bg-white/[0.06] px-1.5 py-0.5 rounded text-xs">timezone</code>.
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

              {/* Back links */}
              <div className="flex flex-wrap gap-4 text-sm text-white/30">
                <Link href="/dashboard" className="hover:text-white/60 transition-colors">
                  ← Dashboard
                </Link>
                <Link href="/about" className="hover:text-white/60 transition-colors">
                  About BSI
                </Link>
              </div>
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
