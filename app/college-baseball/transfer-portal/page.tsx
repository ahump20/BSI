'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DataAttribution } from '@/components/ui/DataAttribution';
import { Footer } from '@/components/layout-ds/Footer';
import { usePortalData } from '@/lib/hooks';
import { relativeTime } from '@/lib/utils';

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
  const { entries, loading } = usePortalData('/api/college-baseball/transfer-portal');
  const [page, setPage] = useState(0);
  const perPage = 25;

  const displayed = entries.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(entries.length / perPage);

  return (
    <>
      <main id="main-content" className="pt-24">
        <Section padding="lg">
          <Container>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/college-baseball" className="text-[#666] hover:text-[#BF5700] transition-colors">College Baseball</Link>
              <span className="text-[#666]">/</span>
              <span className="text-white">Transfer Portal</span>
            </div>

            <div className="mb-8">
              <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display text-white">
                Transfer <span className="text-[#BF5700]">Portal</span>
              </h1>
              <p className="text-[#999] mt-2">Real-time NCAA baseball transfer portal activity. Updated every 30 seconds when data source is active.</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-[#BF5700]/30 border-t-[#BF5700] rounded-full animate-spin" />
              </div>
            ) : entries.length === 0 ? (
              <Card padding="lg" className="text-center">
                <div className="text-4xl mb-4">&#9918;</div>
                <h2 className="text-xl font-bold text-white mb-2">Portal Data Coming Soon</h2>
                <p className="text-[#999] text-sm max-w-md mx-auto">
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
                        <tr className="bg-[#1A1A1A] border-b border-[#333]">
                          <th className="text-left py-3 px-4 text-xs font-semibold text-[#666] uppercase">Player</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-[#666] uppercase">Pos</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-[#666] uppercase">From</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-[#666] uppercase">To</th>
                          <th className="text-center py-3 px-4 text-xs font-semibold text-[#666] uppercase">Status</th>
                          <th className="text-right py-3 px-4 text-xs font-semibold text-[#666] uppercase">When</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayed.map((entry) => (
                          <tr key={entry.id} className="border-b border-[#222] hover:bg-[#1A1A1A]/50 transition-colors">
                            <td className="py-3 px-4 text-white font-medium text-sm">{entry.playerName}</td>
                            <td className="py-3 px-4 text-[#999] text-sm">{entry.position}</td>
                            <td className="py-3 px-4 text-[#999] text-sm">{entry.fromSchool}</td>
                            <td className="py-3 px-4 text-sm">{entry.toSchool ? <span className="text-[#BF5700]">{entry.toSchool}</span> : <span className="text-[#444]">TBD</span>}</td>
                            <td className="py-3 px-4 text-center">
                              <Badge variant={entry.status === 'committed' ? 'success' : entry.status === 'withdrawn' ? 'error' : 'secondary'} size="sm">
                                {entry.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-right text-xs text-[#666]">{relativeTime(entry.enteredDate)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="px-3 py-1.5 bg-[#222] text-[#999] rounded-lg text-sm disabled:opacity-30">Prev</button>
                    <span className="text-[#666] text-sm">Page {page + 1} of {totalPages}</span>
                    <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="px-3 py-1.5 bg-[#222] text-[#999] rounded-lg text-sm disabled:opacity-30">Next</button>
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
