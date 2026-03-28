'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { SportIcon } from '@/components/icons/SportIcon';
import { DataErrorBoundary } from '@/components/ui/DataErrorBoundary';
import { useSportData } from '@/lib/hooks/useSportData';
import { formatTimestamp } from '@/lib/utils/timezone';

interface CFBTeam {
  name: string;
  abbreviation: string;
  id?: string;
  logo?: string;
  wins: number;
  losses: number;
  pct: number;
  pf: number;
  pa: number;
  diff: number;
  streak: string;
  confRecord: string;
  conference: string;
}

interface Conference {
  name: string;
  teams: CFBTeam[];
}

// Power conferences for the filter tabs
const POWER_CONFERENCES = ['SEC', 'Big Ten', 'Big 12', 'ACC'];

export default function CFBStandingsPage() {
  const [selectedConference, setSelectedConference] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: standingsData, loading, error, lastUpdated: lastUpdatedDate } = useSportData<{
    standings?: Conference[];
    meta?: { lastUpdated?: string };
  }>('/api/cfb/standings');

  const conferences = useMemo(() => standingsData?.standings || [], [standingsData]);
  const lastUpdated = lastUpdatedDate ? formatTimestamp(lastUpdatedDate.toISOString()) : formatTimestamp();

  // Separate power conferences from the rest
  const { powerConferences, otherConferences } = useMemo(() => {
    const power: Conference[] = [];
    const other: Conference[] = [];
    for (const conf of conferences) {
      if (POWER_CONFERENCES.some(pc => conf.name.includes(pc))) {
        power.push(conf);
      } else {
        other.push(conf);
      }
    }
    // Sort power conferences in traditional order
    power.sort((a, b) => {
      const aIdx = POWER_CONFERENCES.findIndex(pc => a.name.includes(pc));
      const bIdx = POWER_CONFERENCES.findIndex(pc => b.name.includes(pc));
      return aIdx - bIdx;
    });
    return { powerConferences: power, otherConferences: other };
  }, [conferences]);

  // Build filter options
  const conferenceOptions = useMemo(() => {
    const options = [{ value: 'all', label: 'All Conferences' }];
    for (const conf of [...powerConferences, ...otherConferences]) {
      options.push({ value: conf.name, label: conf.name });
    }
    return options;
  }, [powerConferences, otherConferences]);

  // Filter conferences
  const filteredConferences = useMemo(() => {
    let confs = selectedConference === 'all'
      ? [...powerConferences, ...otherConferences]
      : conferences.filter(c => c.name === selectedConference);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      confs = confs
        .map(conf => ({
          ...conf,
          teams: conf.teams.filter(t =>
            t.name.toLowerCase().includes(q) || t.abbreviation.toLowerCase().includes(q)
          ),
        }))
        .filter(conf => conf.teams.length > 0);
    }

    return confs;
  }, [selectedConference, conferences, powerConferences, otherConferences, searchQuery]);

  const totalTeams = conferences.reduce((sum, c) => sum + c.teams.length, 0);

  return (
    <>
      <div>
        <Section padding="sm" className="border-b border-[var(--border-vintage)]">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link href="/cfb" className="text-[rgba(196,184,165,0.5)] hover:text-[var(--bsi-primary)] transition-colors">CFB</Link>
              <span className="text-[rgba(196,184,165,0.5)]">/</span>
              <span className="text-[var(--bsi-bone)] font-medium">Standings</span>
            </nav>
          </Container>
        </Section>

        <Section padding="md" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />
          <Container>
            <ScrollReveal direction="up">
              <Badge variant="primary" className="mb-4">Conference Standings</Badge>
              <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display text-[var(--bsi-primary)]">
                CFB Standings
              </h1>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={100}>
              <p className="text-[var(--bsi-dust)] mt-2">
                Complete FBS conference standings with conference and overall records
                {totalTeams > 0 && (
                  <span className="text-[rgba(196,184,165,0.5)] ml-2">
                    — {conferences.length} conferences, {totalTeams} teams
                  </span>
                )}
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Conference Filter */}
        <Section padding="sm" background="charcoal" borderTop>
          <Container>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Conference tabs — show power conferences + All */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                  onClick={() => setSelectedConference('all')}
                  className={`px-4 py-2 rounded-sm text-sm font-semibold whitespace-nowrap transition-all ${
                    selectedConference === 'all'
                      ? 'bg-[var(--bsi-primary)] text-white'
                      : 'bg-[var(--surface-dugout)] text-[var(--bsi-dust)] hover:bg-[var(--surface-press-box)]'
                  }`}
                >
                  All
                </button>
                {POWER_CONFERENCES.map(pc => {
                  const conf = powerConferences.find(c => c.name.includes(pc));
                  if (!conf) return null;
                  return (
                    <button
                      key={pc}
                      onClick={() => setSelectedConference(conf.name)}
                      className={`px-4 py-2 rounded-sm text-sm font-semibold whitespace-nowrap transition-all ${
                        selectedConference === conf.name
                          ? 'bg-[var(--bsi-primary)] text-white'
                          : 'bg-[var(--surface-dugout)] text-[var(--bsi-dust)] hover:bg-[var(--surface-press-box)]'
                      }`}
                    >
                      {pc}
                    </button>
                  );
                })}
                {/* Dropdown for non-power conferences */}
                {otherConferences.length > 0 && (
                  <select
                    value={selectedConference}
                    onChange={(e) => setSelectedConference(e.target.value)}
                    className="px-3 py-2 rounded-sm text-sm font-semibold bg-[var(--surface-dugout)] text-[var(--bsi-dust)] border-none cursor-pointer"
                  >
                    <option value="all">More Conferences</option>
                    {otherConferences.map(c => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Search */}
              <div className="flex-1 sm:max-w-xs">
                <input
                  type="text"
                  placeholder="Search teams..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 rounded-sm text-sm bg-[var(--surface-dugout)] text-[var(--bsi-bone)] placeholder:text-[rgba(196,184,165,0.5)] border border-[var(--border-vintage)] focus:border-[var(--bsi-primary)] focus:outline-none transition-colors"
                />
              </div>
            </div>
          </Container>
        </Section>

        <Section padding="lg" background="charcoal">
          <Container>
            <DataErrorBoundary name="CFB Standings">
              {loading ? (
                <div className="space-y-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} variant="default" padding="lg">
                      <div className="animate-pulse">
                        <div className="h-6 bg-[var(--surface-dugout)] rounded-sm w-40 mb-4" />
                        <div className="space-y-2">
                          {Array.from({ length: 4 }).map((_, j) => (
                            <div key={j} className="h-10 bg-[var(--surface-dugout)] rounded-sm" />
                          ))}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : error ? (
                <Card padding="lg" className="bg-error/10 border-error/30">
                  <p className="text-error font-semibold">Data Unavailable</p>
                  <p className="text-[var(--bsi-dust)] text-sm mt-1">{error}</p>
                </Card>
              ) : conferences.length === 0 ? (
                <Card padding="lg" className="text-center">
                  <SportIcon sport="cfb" className="w-16 h-16 mx-auto mb-4 text-[rgba(196,184,165,0.5)]" />
                  <p className="text-[var(--bsi-dust)] text-lg">Standings not available</p>
                  <p className="text-[rgba(196,184,165,0.5)] text-sm mt-2">
                    Standings are updated during the college football season (August - January)
                  </p>
                </Card>
              ) : filteredConferences.length === 0 ? (
                <Card padding="lg" className="text-center">
                  <p className="text-[var(--bsi-dust)]">No teams match your search</p>
                  <button
                    onClick={() => { setSearchQuery(''); setSelectedConference('all'); }}
                    className="text-[var(--bsi-primary)] text-sm mt-2 hover:text-[var(--bsi-primary)] transition-colors"
                  >
                    Clear filters
                  </button>
                </Card>
              ) : (
                <div className="space-y-8">
                  {filteredConferences.map((conf, ci) => (
                    <ScrollReveal key={conf.name} delay={ci * 50}>
                      <Card variant="default" padding="none" className="overflow-hidden">
                        <div className="bg-[var(--bsi-primary)]/20 px-4 py-3 border-b border-[var(--border-vintage)] flex items-center justify-between">
                          <h2 className="font-display text-lg font-bold text-[var(--bsi-bone)]">{conf.name}</h2>
                          <span className="text-[rgba(196,184,165,0.5)] text-xs">{conf.teams.length} teams</span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="border-b border-[var(--border-vintage)] text-[rgba(196,184,165,0.5)] text-xs uppercase tracking-wider">
                                <th className="py-2 px-4 w-8 text-center">#</th>
                                <th className="py-2 px-4">Team</th>
                                <th className="py-2 px-4 text-center">CONF</th>
                                <th className="py-2 px-4 text-center">W</th>
                                <th className="py-2 px-4 text-center">L</th>
                                <th className="py-2 px-4 text-center">PCT</th>
                                <th className="py-2 px-4 text-center hidden md:table-cell">PF</th>
                                <th className="py-2 px-4 text-center hidden md:table-cell">PA</th>
                                <th className="py-2 px-4 text-center hidden sm:table-cell">DIFF</th>
                                <th className="py-2 px-4 text-center hidden lg:table-cell">STRK</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-vintage)]">
                              {conf.teams.map((team, ti) => (
                                <tr
                                  key={team.abbreviation + ti}
                                  className={`hover:bg-[var(--surface-press-box)] transition-colors ${
                                    ti === 0 ? 'bg-success/5' : ''
                                  }`}
                                >
                                  <td className="py-2.5 px-4 text-center text-[rgba(196,184,165,0.5)] text-xs font-mono">
                                    {ti + 1}
                                  </td>
                                  <td className="py-2.5 px-4">
                                    <div className="flex items-center gap-3">
                                      {team.logo ? (
                                        <img src={team.logo} alt={`${team.name || team.abbreviation} logo`} className="w-6 h-6 object-contain" loading="lazy" decoding="async" />
                                      ) : (
                                        <div className="w-6 h-6 bg-[var(--surface-dugout)] rounded-full flex items-center justify-center text-[10px] font-bold text-[var(--bsi-primary)]">
                                          {team.abbreviation}
                                        </div>
                                      )}
                                      {team.id ? (
                                        <Link
                                          href={`/cfb/teams/${team.id}`}
                                          className="text-[var(--bsi-bone)] font-medium text-sm hover:text-[var(--bsi-primary)] transition-colors"
                                        >
                                          {team.name}
                                        </Link>
                                      ) : (
                                        <span className="text-[var(--bsi-bone)] font-medium text-sm">{team.name}</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-4 text-center text-[var(--bsi-dust)] font-mono text-xs">
                                    {team.confRecord || '-'}
                                  </td>
                                  <td className="py-2.5 px-4 text-center text-[var(--bsi-bone)] font-mono text-sm">{team.wins}</td>
                                  <td className="py-2.5 px-4 text-center text-[var(--bsi-dust)] font-mono text-sm">{team.losses}</td>
                                  <td className="py-2.5 px-4 text-center text-[var(--bsi-primary)] font-mono text-sm font-semibold">
                                    {team.pct.toFixed(3)}
                                  </td>
                                  <td className="py-2.5 px-4 text-center text-[var(--bsi-dust)] font-mono text-sm hidden md:table-cell">{team.pf}</td>
                                  <td className="py-2.5 px-4 text-center text-[var(--bsi-dust)] font-mono text-sm hidden md:table-cell">{team.pa}</td>
                                  <td className={`py-2.5 px-4 text-center font-mono text-sm hidden sm:table-cell ${team.diff > 0 ? 'text-success' : team.diff < 0 ? 'text-error' : 'text-[var(--bsi-dust)]'}`}>
                                    {team.diff > 0 ? '+' : ''}{team.diff}
                                  </td>
                                  <td className="py-2.5 px-4 text-center text-[rgba(196,184,165,0.5)] text-sm hidden lg:table-cell">{team.streak}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </Card>
                    </ScrollReveal>
                  ))}
                </div>
              )}

              <div className="mt-8 pt-4 border-t border-[var(--border-vintage)]">
                <DataSourceBadge source="ESPN CFB" timestamp={lastUpdated} />
              </div>
            </DataErrorBoundary>
          </Container>
        </Section>
      </div>
      <Footer />
    </>
  );
}
