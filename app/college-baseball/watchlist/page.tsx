'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { useWatchlist } from '@/lib/hooks/useWatchlist';

export default function WatchlistPage() {
  const { entries, loaded, removePlayer, updateNotes } = useWatchlist();

  return (
    <>
      <div className="min-h-screen pt-6 bg-[#0A0A0A] text-bsi-bone">
        {/* Hero */}
        <Section padding="lg" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />
          <Container center>
            <ScrollReveal direction="up">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Link href="/college-baseball" className="text-bsi-dust/50 hover:text-[var(--bsi-primary)] transition-colors text-sm">
                  College Baseball
                </Link>
                <span className="text-bsi-dust/50">/</span>
                <span className="text-bsi-dust text-sm">Watchlist</span>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <Badge variant="primary" className="mb-4">
                <span className="w-2 h-2 bg-[var(--bsi-primary)] rounded-full mr-2" />
                Scouting Tool
              </Badge>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={150}>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-center uppercase tracking-wide mb-4">
                Player <span className="text-[var(--bsi-primary)]">Watchlist</span>
              </h1>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={200}>
              <p className="text-lg md:text-xl text-bsi-dust max-w-3xl mx-auto text-center mb-6 leading-relaxed">
                Track players across the portal, roster construction, and draft pipeline. Your shortlist stays on this device — private and instant.
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Watchlist Table */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            {!loaded ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-[var(--bsi-primary)]/30 border-t-[var(--bsi-primary)] rounded-full animate-spin" />
              </div>
            ) : entries.length === 0 ? (
              <Card padding="lg" className="text-center max-w-lg mx-auto">
                <div className="text-4xl mb-4 text-bsi-dust/50">
                  <svg viewBox="0 0 24 24" className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 2l3 6.5 7 1-5 5 1.5 7L12 18l-6.5 3.5L7 14.5l-5-5 7-1z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-bsi-bone mb-2">No players on your watchlist yet</h3>
                <p className="text-bsi-dust text-sm max-w-md mx-auto mb-6">
                  Browse player profiles and tap the star icon to add players here. Your watchlist persists across sessions on this device.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/college-baseball/players" className="inline-flex items-center justify-center px-4 py-2 bg-[var(--bsi-primary)] text-white rounded-sm text-sm font-semibold hover:bg-ember transition-colors">
                    Browse Players
                  </Link>
                  <Link href="/college-baseball/transfer-portal" className="inline-flex items-center justify-center px-4 py-2 border border-[rgba(140,98,57,0.3)] text-bsi-dust rounded-sm text-sm font-semibold hover:border-[var(--bsi-primary)]/40 transition-colors">
                    Transfer Portal
                  </Link>
                </div>
              </Card>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-bsi-bone">
                    {entries.length} Player{entries.length !== 1 ? 's' : ''} Tracked
                  </h2>
                  <span className="text-xs text-bsi-dust/50">Stored locally on this device</span>
                </div>

                <div className="space-y-3">
                  {entries.map(entry => (
                    <Card key={entry.playerId} padding="none" className="overflow-hidden">
                      <div className="flex items-center gap-4 p-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <Link
                              href={`/college-baseball/players/${entry.playerId}`}
                              className="text-bsi-bone font-semibold hover:text-[var(--bsi-primary)] transition-colors truncate"
                            >
                              {entry.playerName}
                            </Link>
                            {entry.position && <Badge variant="secondary" size="sm">{entry.position}</Badge>}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-bsi-dust/50">
                            {entry.team && <span>{entry.team}</span>}
                            <span>Added {new Date(entry.addedAt).toLocaleDateString()}</span>
                          </div>
                          {/* Editable notes */}
                          <input
                            type="text"
                            placeholder="Add scouting notes..."
                            defaultValue={entry.notes || ''}
                            onBlur={(e) => updateNotes(entry.playerId, e.target.value)}
                            className="mt-2 w-full bg-transparent border-b border-[rgba(140,98,57,0.3)] text-sm text-bsi-dust placeholder-text-muted focus:border-[var(--bsi-primary)] focus:outline-none py-1 transition-colors"
                          />
                        </div>
                        <button
                          onClick={() => removePlayer(entry.playerId)}
                          className="shrink-0 p-2 text-bsi-dust/50 hover:text-[var(--bsi-danger)] transition-colors cursor-pointer"
                          aria-label={`Remove ${entry.playerName} from watchlist`}
                        >
                          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                            <path d="M4 4l8 8M12 4l-8 8" />
                          </svg>
                        </button>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </Container>
        </Section>
      </div>
      <Footer />
    </>
  );
}
