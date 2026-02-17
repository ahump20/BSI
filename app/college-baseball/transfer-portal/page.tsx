'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DataAttribution } from '@/components/ui/DataAttribution';
import { Footer } from '@/components/layout-ds/Footer';

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
          // Only poll when there's real data — don't hammer a dead endpoint
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
        <Section padding="lg">
          <Container>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/college-baseball" className="text-white/40 hover:text-burnt-orange transition-colors">College Baseball</Link>
              <span className="text-white/40">/</span>
              <span className="text-white">Transfer Portal</span>
            </div>

            <div className="mb-8">
              <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display text-white">
                Transfer <span className="text-burnt-orange">Portal</span>
              </h1>
              <p className="text-white/60 mt-2">Real-time NCAA baseball transfer portal activity. Updated every 30 seconds when data source is active.</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-burnt-orange/30 border-t-burnt-orange rounded-full animate-spin" />
              </div>
            ) : entries.length === 0 ? (
              <Card padding="lg" className="text-center">
                <div className="text-4xl mb-4">&#9918;</div>
                <h2 className="text-xl font-bold text-white mb-2">Portal Data Coming Soon</h2>
                <p className="text-white/60 text-sm max-w-md mx-auto">
                  Transfer portal data will populate here once the data source is connected.
                  The PortalPoller Durable Object is standing by to poll every 30 seconds.
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
