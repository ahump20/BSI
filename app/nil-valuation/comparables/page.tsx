'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { useSportData } from '@/lib/hooks/useSportData';

// ── Types ──
interface Player {
  player_id: string;
  player_name: string;
  team: string;
  conference: string;
  index_score: number;
  estimated_mid: number;
  nil_tier?: string;
  tier?: string;
}

type ComparablePlayer = Player;

// ── Helpers ──
function formatValue(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

function tierColor(tier: string | undefined): string {
  switch ((tier || '').toLowerCase()) {
    case 'elite': return 'text-[var(--bsi-primary)]';
    case 'high': return 'text-[var(--bsi-success)]';
    case 'mid': return 'text-[var(--heritage-columbia-blue)]';
    default: return 'text-[rgba(196,184,165,0.5)]';
  }
}

function playerTier(p: Player): string {
  return p.nil_tier || p.tier || 'unknown';
}

export default function ComparablesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const { data: leaderboardData, loading, error: leaderboardError } = useSportData<{ data?: Player[] }>('/api/nil/leaderboard?limit=200');

  const hasAccess = !(leaderboardError && leaderboardError.includes('403'));
  const error = leaderboardError;
  const players = useMemo(() => leaderboardData?.data || [], [leaderboardData]);

  // Fetch comparables when a player is selected
  const { data: compData, loading: compLoading } = useSportData<{ comparables?: ComparablePlayer[] }>(
    selectedPlayerId ? `/api/nil/comparables/${selectedPlayerId}` : null,
  );

  const comparables = useMemo(() => compData?.comparables || [], [compData]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return players.filter(p => p.player_name.toLowerCase().includes(q)).slice(0, 8);
  }, [searchQuery, players]);

  function selectPlayer(player: Player) {
    setSelectedPlayer(player);
    setSelectedPlayerId(player.player_id);
    setSearchQuery(player.player_name);
    setShowDropdown(false);
  }

  return (
    <div className="min-h-screen bg-[var(--surface-scoreboard)] text-[var(--bsi-bone)]">
      {/* Breadcrumb */}
      <Section className="pt-4 pb-0">
        <Container>
          <nav className="flex items-center gap-2 text-sm text-[rgba(196,184,165,0.35)]">
            <Link href="/nil-valuation" className="hover:text-[var(--bsi-primary)] transition-colors">NIL Valuation</Link>
            <span>/</span>
            <span className="text-[var(--bsi-dust)]">Comparable Analysis</span>
          </nav>
        </Container>
      </Section>

      {/* Hero */}
      <Section className="pt-6 pb-12 bg-gradient-to-b from-background-secondary to-[var(--surface-scoreboard)]">
        <Container>
          <ScrollReveal>
            <div className="max-w-3xl mx-auto text-center">
              <Badge variant="primary" className="mb-4">Pro Tool</Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 font-display uppercase tracking-wide">
                <span className="text-[var(--bsi-primary)]">Comparable</span> Analysis
              </h1>
              <p className="text-lg text-[var(--bsi-dust)] max-w-2xl mx-auto">
                Search any player and see the 10 most similar NIL profiles across college athletics. Same tier, similar production, comparable market.
              </p>
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      {/* Content */}
      <Section className="py-12">
        <Container>
          {!hasAccess ? (
            <ScrollReveal>
              <Card className="max-w-lg mx-auto text-center border-l-4 border-l-burnt-orange">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold text-[var(--bsi-bone)] mb-3">Pro Access Required</h2>
                  <p className="text-[rgba(196,184,165,0.5)] mb-6">
                    Comparable analysis is available on the Pro tier. Upgrade to unlock player-by-player NIL comps.
                  </p>
                  <Link href="/pricing">
                    <Button size="lg" className="bg-[var(--bsi-primary)]">Upgrade to Pro</Button>
                  </Link>
                </CardContent>
              </Card>
            </ScrollReveal>
          ) : loading ? (
            <div className="text-center py-20">
              <div className="animate-spin w-8 h-8 border-2 border-[var(--bsi-primary)] border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-[rgba(196,184,165,0.35)]">Loading player database...</p>
            </div>
          ) : error ? (
            <Card className="max-w-lg mx-auto text-center">
              <CardContent className="p-8">
                <p className="text-[var(--bsi-danger)] mb-4">Failed to load: {error}</p>
                <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Search */}
              <div className="max-w-md mx-auto mb-10 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Search player name..."
                  className="w-full px-4 py-3 rounded-sm bg-[var(--surface-dugout)] border border-[var(--border-vintage)] text-[var(--bsi-bone)] placeholder:text-[rgba(196,184,165,0.35)] focus:outline-none focus:border-[var(--bsi-primary)] transition-colors"
                />
                {showDropdown && filtered.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-[var(--surface-dugout)] border border-[var(--border-vintage)] rounded-sm shadow-lg max-h-64 overflow-y-auto">
                    {filtered.map(p => (
                      <button
                        key={p.player_id}
                        onClick={() => selectPlayer(p)}
                        className="w-full text-left px-4 py-3 hover:bg-[var(--surface-press-box)] transition-colors border-b border-[var(--border-vintage)] last:border-0"
                      >
                        <span className="font-medium text-[var(--bsi-bone)]">{p.player_name}</span>
                        <span className="text-sm text-[rgba(196,184,165,0.35)] ml-2">{p.team} &middot; {p.conference}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Player + Comparables */}
              {selectedPlayer && (
                <ScrollReveal>
                  <Card className="mb-6 border-l-4 border-l-burnt-orange">
                    <CardHeader>
                      <CardTitle className="text-xl">
                        Comparables for {selectedPlayer.player_name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-4 text-sm text-[var(--bsi-dust)]">
                        <span>{selectedPlayer.team}</span>
                        <span>{selectedPlayer.conference}</span>
                        <span>Index: <strong className="text-[var(--bsi-bone)]">{selectedPlayer.index_score.toFixed(1)}</strong></span>
                        <span>Est. Value: <strong className="text-[var(--bsi-primary)]">{formatValue(selectedPlayer.estimated_mid)}</strong></span>
                        <span className={tierColor(playerTier(selectedPlayer))}>{playerTier(selectedPlayer)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              )}

              {compLoading && (
                <div className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-2 border-[var(--bsi-primary)] border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-[rgba(196,184,165,0.35)]">Finding comparable players...</p>
                </div>
              )}

              {comparables.length > 0 && (
                <ScrollReveal>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-[var(--border-vintage)] text-[rgba(196,184,165,0.35)] text-sm">
                          <th className="py-3 px-4">#</th>
                          <th className="py-3 px-4">Player</th>
                          <th className="py-3 px-4">Team</th>
                          <th className="py-3 px-4">Conference</th>
                          <th className="py-3 px-4 text-right">Index</th>
                          <th className="py-3 px-4 text-right">Est. Value</th>
                          <th className="py-3 px-4 text-right">Tier</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparables.slice(0, 10).map((comp, i) => (
                          <tr key={comp.player_id} className="border-b border-[var(--border-vintage)] hover:bg-[var(--surface-press-box)] transition-colors">
                            <td className="py-3 px-4 text-[rgba(196,184,165,0.35)]">{i + 1}</td>
                            <td className="py-3 px-4 font-medium text-[var(--bsi-bone)]">{comp.player_name}</td>
                            <td className="py-3 px-4 text-[var(--bsi-dust)]">{comp.team}</td>
                            <td className="py-3 px-4 text-[var(--bsi-dust)]">{comp.conference}</td>
                            <td className="py-3 px-4 text-right text-[var(--bsi-bone)]">{comp.index_score.toFixed(1)}</td>
                            <td className="py-3 px-4 text-right text-[var(--bsi-primary)] font-medium">{formatValue(comp.estimated_mid)}</td>
                            <td className={`py-3 px-4 text-right font-medium ${tierColor(comp.tier)}`}>{comp.tier}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </ScrollReveal>
              )}

              {!selectedPlayer && !compLoading && (
                <p className="text-center text-[rgba(196,184,165,0.35)] py-12">
                  Search and select a player above to see their comparable NIL profiles.
                </p>
              )}
            </>
          )}
        </Container>
      </Section>

      <Footer />
    </div>
  );
}
