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
    role: 'Primary pipeline — live scores, box scores, team data, player profiles',
    sports: ['College Baseball', 'MLB'],
    refresh: 'Live scores every 30s; box scores on completion',
    notes: 'Serves match/score data. Standings and rankings come from ESPN. Authenticated via RapidAPI.',
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
    role: 'Scores, standings, rankings, and schedules for college baseball',
    sports: ['College Baseball'],
    refresh: 'Live scores every 60s; standings/rankings daily',
    notes:
      'Primary for standings and rankings. Dates labeled UTC are actually ET — BSI normalizes to America/Chicago. No API key required.',
  },
];

const INTERNAL_SYSTEMS: ProviderRow[] = [
  {
    name: 'BSI Savant',
    url: '/college-baseball/savant',
    role: 'Park-adjusted sabermetrics engine — wOBA, wRC+, FIP, expected stats, HAV-F scouting grades',
    sports: ['College Baseball'],
    refresh: 'Every 6 hours (bsi-savant-compute cron) + daily full recompute (bsi-cbb-analytics)',
    notes: 'Reads from D1, computes park factors and league-adjusted metrics, writes back to D1. 920+ players tracked.',
  },
  {
    name: 'NotebookLM',
    url: 'https://notebooklm.google.com',
    role: 'AI-powered podcast audio generation from curated source documents',
    sports: ['College Baseball'],
    refresh: 'Weekly — new Audio Overviews generated from fresh sources',
    notes: 'Generates podcast-style audio from BSI editorial, rankings, and game recap sources. Audio hosted on R2.',
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
      <div style={{ background: 'var(--surface-scoreboard)', color: 'var(--bsi-bone)' }}>
        <Section padding="lg" className="pt-6 relative overflow-hidden">
          <Container>
            <div className="max-w-4xl mx-auto relative">
              <span className="heritage-stamp block mb-4">Transparency</span>
              <h1
                className="text-3xl md:text-4xl font-bold uppercase tracking-wider mb-3"
                style={{ fontFamily: 'var(--font-oswald)', color: 'var(--bsi-bone)' }}
              >
                Data Sources
              </h1>
              <p className="font-serif italic text-lg leading-relaxed mb-12 max-w-2xl" style={{ color: 'var(--bsi-primary)' }}>
                Every feed on BSI includes timestamps and source attribution. This page documents
                exactly where the data comes from, how often it refreshes, and what to expect
                during edge-case windows like Spring Training and early-season coverage.
              </p>

              {/* Providers */}
              <section className="mb-16">
                <h2
                  className="text-xl font-semibold uppercase tracking-wide mb-6"
                  style={{ fontFamily: 'var(--font-oswald)', color: 'var(--bsi-bone)' }}
                >
                  Providers
                </h2>
                <div className="space-y-4">
                  {PROVIDERS.map((p) => (
                    <div
                      key={p.name}
                      className="rounded-sm p-5 sm:p-6"
                      style={{ background: 'var(--surface-press-box)', border: '1px solid var(--border-vintage)' }}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                        <div>
                          <a
                            href={p.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold transition-colors hover:text-[var(--bsi-primary)]"
                            style={{ color: 'var(--bsi-bone)' }}
                          >
                            {p.name}
                          </a>
                          <p className="text-sm mt-0.5" style={{ color: 'rgba(196,184,165,0.35)' }}>{p.role}</p>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {p.sports.map((s) => (
                            <span
                              key={s}
                              className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-sm"
                              style={{ color: 'var(--bsi-primary)', background: 'rgba(191,87,0,0.1)' }}
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-xs uppercase tracking-wider" style={{ color: 'rgba(196,184,165,0.35)' }}>Refresh</span>
                          <p className="mt-0.5" style={{ color: 'var(--bsi-dust)' }}>{p.refresh}</p>
                        </div>
                        {p.notes && (
                          <div>
                            <span className="text-xs uppercase tracking-wider" style={{ color: 'rgba(196,184,165,0.35)' }}>Notes</span>
                            <p className="mt-0.5" style={{ color: 'var(--bsi-dust)' }}>{p.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Internal Systems */}
              <section className="mb-16">
                <h2
                  className="text-xl font-semibold uppercase tracking-wide mb-6"
                  style={{ fontFamily: 'var(--font-oswald)', color: 'var(--bsi-bone)' }}
                >
                  Internal Systems
                </h2>
                <div className="space-y-4">
                  {INTERNAL_SYSTEMS.map((p) => (
                    <div
                      key={p.name}
                      className="rounded-sm p-5 sm:p-6"
                      style={{ background: 'var(--surface-press-box)', border: '1px solid var(--border-vintage)' }}
                    >
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <h3
                          className="text-lg font-bold"
                          style={{ fontFamily: 'var(--font-oswald)', color: 'var(--bsi-bone)' }}
                        >
                          {p.name}
                        </h3>
                        {p.sports.map((s) => (
                          <span
                            key={s}
                            className="text-[10px] uppercase tracking-[0.15em] px-2 py-0.5 rounded-sm"
                            style={{ border: '1px solid var(--border-vintage)', color: 'rgba(196,184,165,0.35)' }}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                      <p className="text-sm mb-3" style={{ color: 'var(--bsi-dust)' }}>{p.role}</p>
                      <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs" style={{ color: 'rgba(196,184,165,0.35)' }}>
                        <div>
                          <span className="uppercase tracking-wider">Refresh</span>
                          <p className="mt-0.5" style={{ color: 'var(--bsi-dust)' }}>{p.refresh}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Storage Layers */}
              <section className="mb-16">
                <h2
                  className="text-xl font-semibold uppercase tracking-wide mb-6"
                  style={{ fontFamily: 'var(--font-oswald)', color: 'var(--bsi-bone)' }}
                >
                  Storage Layers
                </h2>
                <div className="rounded-sm overflow-hidden" style={{ background: 'var(--surface-press-box)', border: '1px solid var(--border-vintage)' }}>
                  <div
                    className="grid grid-cols-[1fr_2fr_2fr] gap-px text-xs uppercase tracking-wider font-medium"
                    style={{ color: 'rgba(196,184,165,0.35)', background: 'var(--surface-press-box)' }}
                  >
                    <div className="p-3 sm:p-4" style={{ background: 'var(--surface-scoreboard)' }}>Layer</div>
                    <div className="p-3 sm:p-4" style={{ background: 'var(--surface-scoreboard)' }}>Purpose</div>
                    <div className="p-3 sm:p-4" style={{ background: 'var(--surface-scoreboard)' }}>TTL / Lifecycle</div>
                  </div>
                  {STORAGE_TIERS.map((t) => (
                    <div
                      key={t.layer}
                      className="grid grid-cols-[1fr_2fr_2fr] gap-px text-sm"
                      style={{ background: 'var(--surface-press-box)' }}
                    >
                      <div className="p-3 sm:p-4 font-medium" style={{ background: 'var(--surface-scoreboard)', color: 'var(--bsi-bone)' }}>{t.layer}</div>
                      <div className="p-3 sm:p-4" style={{ background: 'var(--surface-scoreboard)', color: 'rgba(196,184,165,0.5)' }}>{t.purpose}</div>
                      <div className="p-3 sm:p-4" style={{ background: 'var(--surface-scoreboard)', color: 'rgba(196,184,165,0.35)' }}>{t.ttls}</div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Seasonal Caveats */}
              <section className="mb-16">
                <h2
                  className="text-xl font-semibold uppercase tracking-wide mb-6"
                  style={{ fontFamily: 'var(--font-oswald)', color: 'var(--bsi-bone)' }}
                >
                  Seasonal Caveats
                </h2>
                <div className="space-y-3">
                  {SEASONAL_CAVEATS.map((c) => (
                    <div
                      key={c.sport}
                      className="flex gap-4 items-start rounded-sm p-4 sm:p-5"
                      style={{ background: 'var(--surface-press-box)', border: '1px solid var(--border-vintage)' }}
                    >
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider mt-0.5 shrink-0 w-20"
                        style={{ color: 'var(--bsi-primary)' }}
                      >
                        {c.sport}
                      </span>
                      <p className="text-sm leading-relaxed" style={{ color: 'rgba(196,184,165,0.5)' }}>{c.caveat}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Philosophy */}
              <section className="mb-16">
                <div
                  className="rounded-sm p-6 sm:p-8"
                  style={{ background: 'var(--surface-press-box)', border: '1px solid var(--border-vintage)' }}
                >
                  <h2
                    className="text-xl font-semibold uppercase tracking-wide mb-4"
                    style={{ fontFamily: 'var(--font-oswald)', color: 'var(--bsi-bone)' }}
                  >
                    How It Works
                  </h2>
                  <div className="text-sm leading-relaxed space-y-3" style={{ color: 'rgba(196,184,165,0.5)' }}>
                    <p>
                      External APIs are never called from your browser. A Cloudflare Worker sits
                      between you and every data provider — it fetches, transforms, caches, and
                      serves the result. A cron job pre-warms the cache every minute for in-season
                      sports so client requests read from KV in under 10ms.
                    </p>
                    <p>
                      Every API response carries a{' '}
                      <code
                        className="px-1.5 py-0.5 rounded-sm text-xs"
                        style={{ color: 'var(--bsi-dust)', background: 'var(--surface-dugout)' }}
                      >meta</code>{' '}
                      object with{' '}
                      <code
                        className="px-1.5 py-0.5 rounded-sm text-xs"
                        style={{ color: 'var(--bsi-dust)', background: 'var(--surface-dugout)' }}
                      >source</code>,{' '}
                      <code
                        className="px-1.5 py-0.5 rounded-sm text-xs"
                        style={{ color: 'var(--bsi-dust)', background: 'var(--surface-dugout)' }}
                      >fetched_at</code>, and{' '}
                      <code
                        className="px-1.5 py-0.5 rounded-sm text-xs"
                        style={{ color: 'var(--bsi-dust)', background: 'var(--surface-dugout)' }}
                      >timezone</code>.
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
              <div
                className="rounded-sm p-5 sm:p-6 mb-12"
                style={{ background: 'rgba(191,87,0,0.05)', border: '1px solid rgba(191,87,0,0.2)' }}
              >
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(196,184,165,0.5)' }}>
                  For cross-reference methodology, API response times, and freshness guarantees,
                  see the expanded{' '}
                  <Link
                    href="/models/data-quality"
                    className="font-semibold transition-colors"
                    style={{ color: 'var(--bsi-primary)' }}
                  >
                    Data Quality &amp; Sources
                  </Link>{' '}
                  page in the Models hub.
                </p>
              </div>

              {/* Back links */}
              <div className="flex flex-wrap gap-4 text-sm" style={{ color: 'rgba(196,184,165,0.35)' }}>
                <Link href="/college-baseball/savant" className="transition-colors hover:opacity-80">
                  &#8592; BSI Savant
                </Link>
                <Link href="/college-baseball/savant/methodology" className="transition-colors hover:opacity-80">
                  Methodology
                </Link>
                <Link href="/about" className="transition-colors hover:opacity-80">
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
