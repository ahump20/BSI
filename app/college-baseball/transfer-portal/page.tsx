'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DataAttribution } from '@/components/ui/DataAttribution';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { IntelSignup } from '@/components/home/IntelSignup';

interface PortalEntry {
  id: string;
  playerName: string;
  position: string;
  fromSchool: string;
  toSchool?: string;
  status: 'entered' | 'committed' | 'withdrawn';
  enteredDate: string;
  classification?: string;
}

const VALUE_PROPS = [
  {
    title: 'Real-Time Entry Tracking',
    description: 'Every portal entry and commitment as it happens — structured data, not news mentions.',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    title: 'Roster Impact Analysis',
    description: 'See how portal movement reshapes conference races — who gains depth, who loses starters.',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    title: 'Conference Movement Maps',
    description: 'Track portal flow between conferences. See which leagues are net importers and exporters of talent.',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    title: 'Pro Projection Overlays',
    description: 'Portal entrants matched to MLB Draft projection data — see which transfers carry pro upside.',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 20V10" />
        <path d="M18 20V4" />
        <path d="M6 20v-4" />
      </svg>
    ),
  },
];

export default function TransferPortalPage() {
  const [entries, setEntries] = useState<PortalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const perPage = 25;

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    async function fetchPortalEntries() {
      try {
        const res = await fetch('/api/college-baseball/transfer-portal');
        if (res.ok) {
          const data = await res.json() as { entries?: PortalEntry[] };
          const fetched = data.entries || [];
          setEntries(fetched);
          if (fetched.length > 0 && !interval) {
            interval = setInterval(fetchPortalEntries, 30000);
          }
        }
      } catch {
        // Fall through to empty state
      } finally {
        setLoading(false);
      }
    }
    fetchPortalEntries();
    return () => { if (interval) clearInterval(interval); };
  }, []);

  function relativeTime(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  const displayed = entries.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(entries.length / perPage);

  return (
    <>
      <main id="main-content" className="pt-24">
        {/* Hero */}
        <Section padding="lg" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />
          <Container center>
            <ScrollReveal direction="up">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Link href="/college-baseball" className="text-white/40 hover:text-burnt-orange transition-colors text-sm">
                  College Baseball
                </Link>
                <span className="text-white/20">/</span>
                <span className="text-white/60 text-sm">Transfer Portal</span>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <Badge variant="success" className="mb-4">
                <span className="w-2 h-2 bg-burnt-orange rounded-full animate-pulse mr-2" />
                Intelligence Product
              </Badge>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={150}>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-center uppercase tracking-wide mb-4">
                Transfer Portal <span className="text-gradient-blaze">Intelligence</span>
              </h1>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={200}>
              <p className="text-lg md:text-xl text-white/60 max-w-3xl mx-auto text-center mb-6 leading-relaxed">
                Structured portal tracking for D1 baseball — not news mentions, not tweet
                aggregation. Real-time entry and commitment data with roster impact analysis.
              </p>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={250}>
              <div className="flex items-center justify-center gap-6 text-sm text-white/40">
                <span className="flex items-center gap-2">
                  <span className="font-mono text-burnt-orange font-bold">2,845+</span>
                  D1 portal entrants annually
                </span>
                <span className="hidden sm:inline text-white/10">|</span>
                <span className="hidden sm:flex items-center gap-2">
                  <span className="font-mono text-burnt-orange font-bold">297</span>
                  teams tracked
                </span>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Value Proposition Cards */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <div className="text-center mb-12">
                <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-burnt-orange mb-3">
                  What&apos;s Coming
                </span>
                <h2 className="text-2xl md:text-3xl font-display font-bold text-white uppercase tracking-wide">
                  Intelligence ESPN Doesn&apos;t Build
                </h2>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {VALUE_PROPS.map((prop, i) => (
                <ScrollReveal key={prop.title} direction="up" delay={i * 80}>
                  <Card variant="default" padding="lg" className="h-full">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-burnt-orange/10 flex items-center justify-center text-burnt-orange flex-shrink-0">
                        {prop.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white mb-1">{prop.title}</h3>
                        <p className="text-sm text-white/50 leading-relaxed">{prop.description}</p>
                      </div>
                    </div>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </Container>
        </Section>

        {/* Email Capture */}
        <Section padding="lg">
          <Container>
            <div className="max-w-xl mx-auto">
              <ScrollReveal direction="up">
                <div className="text-center mb-6">
                  <h2 className="text-xl md:text-2xl font-display font-bold text-white uppercase tracking-wide mb-2">
                    Be First When Portal Intel Goes Live
                  </h2>
                  <p className="text-sm text-white/50">
                    Roster-market intelligence, delivered before anyone else has it.
                  </p>
                </div>
                <IntelSignup />
              </ScrollReveal>
            </div>
          </Container>
        </Section>

        {/* Live Data Table — renders when data is available */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide text-white mb-6">
                Live Portal <span className="text-burnt-orange">Activity</span>
              </h2>
            </ScrollReveal>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-burnt-orange/30 border-t-burnt-orange rounded-full animate-spin" />
              </div>
            ) : entries.length === 0 ? (
              <Card padding="lg" className="text-center">
                <div className="text-white/20 text-4xl mb-4">
                  <svg viewBox="0 0 24 24" className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Portal tracker loading</h3>
                <p className="text-white/50 text-sm max-w-md mx-auto">
                  The real-time portal feed is being connected. Sign up above to get notified the moment it goes live.
                </p>
              </Card>
            ) : (
              <>
                <Card padding="none" className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-charcoal border-b border-white/15">
                          <th className="text-left py-3 px-4 text-xs font-semibold text-white/40 uppercase">Player</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-white/40 uppercase">Pos</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-white/40 uppercase">From</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-white/40 uppercase">To</th>
                          <th className="text-center py-3 px-4 text-xs font-semibold text-white/40 uppercase">Status</th>
                          <th className="text-right py-3 px-4 text-xs font-semibold text-white/40 uppercase">When</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayed.map((entry) => (
                          <tr key={entry.id} className="border-b border-white/10 hover:bg-charcoal/50 transition-colors">
                            <td className="py-3 px-4 text-white font-medium text-sm">{entry.playerName}</td>
                            <td className="py-3 px-4 text-white/60 text-sm">{entry.position}</td>
                            <td className="py-3 px-4 text-white/60 text-sm">{entry.fromSchool}</td>
                            <td className="py-3 px-4 text-sm">{entry.toSchool ? <span className="text-burnt-orange">{entry.toSchool}</span> : <span className="text-white/30">TBD</span>}</td>
                            <td className="py-3 px-4 text-center">
                              <Badge variant={entry.status === 'committed' ? 'success' : entry.status === 'withdrawn' ? 'error' : 'secondary'} size="sm">
                                {entry.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-right text-xs text-white/40">{relativeTime(entry.enteredDate)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="px-3 py-1.5 bg-white/10 text-white/60 rounded-lg text-sm disabled:opacity-30">Prev</button>
                    <span className="text-white/40 text-sm">Page {page + 1} of {totalPages}</span>
                    <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="px-3 py-1.5 bg-white/10 text-white/60 rounded-lg text-sm disabled:opacity-30">Next</button>
                  </div>
                )}
              </>
            )}

            <DataAttribution lastUpdated="" source="BSI Portal Tracker" className="mt-6" />
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
