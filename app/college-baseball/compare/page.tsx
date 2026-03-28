'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { DataAttribution } from '@/components/ui/DataAttribution';
import { ConferenceBaseline } from '@/components/analytics/ConferenceBaseline';
import { ArrowLeftRight, ChevronDown } from 'lucide-react';
import { getReadApiUrl } from '@/lib/utils/public-api';
import { fmt1, fmt2, fmt3, normalizeTeamName } from '@/lib/utils/format';

/* ── Types ─────────────────────────────────────────────────────────── */

interface StandingsTeam {
  team_name: string;
  team_id?: string;
  slug?: string;
  conference?: string;
  overall_wins?: number;
  overall_losses?: number;
  conference_wins?: number;
  conference_losses?: number;
  batting_avg?: number;
  era?: number;
  ops?: number;
  [key: string]: unknown;
}

interface SavantEntry {
  team_name?: string;
  team_id?: string;
  conference?: string;
  woba?: number;
  wrc_plus?: number;
  fip?: number;
  ops_plus?: number;
  [key: string]: unknown;
}

interface SavantBattingEntry {
  team?: string;
  conference?: string;
  woba?: number;
  wrc_plus?: number;
  ops_plus?: number;
}

interface SavantPitchingEntry {
  team?: string;
  conference?: string;
  fip?: number;
}

interface NILEntry {
  school?: string;
  team_name?: string;
  conference?: string;
  estimated_mid?: number;
  total_nil?: number;
  [key: string]: unknown;
}

/* ── Helpers ───────────────────────────────────────────────────────── */

function matchTeam<T extends { team_name?: string; school?: string }>(
  list: T[],
  name: string,
): T | undefined {
  const n = normalizeTeamName(name);
  return list.find(
    (e) => normalizeTeamName(e.team_name || e.school || '') === n,
  );
}

function record(w?: number, l?: number): string {
  if (w === undefined || l === undefined) return '—';
  return `${w}-${l}`;
}

function fmtDollars(v?: number): string {
  if (v === undefined || v === null) return '—';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function average(values: Array<number | undefined>): number | undefined {
  const valid = values.filter((value): value is number => value !== undefined && Number.isFinite(value));
  if (valid.length === 0) return undefined;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function aggregateSavantTeamMetrics(
  battingRows: SavantBattingEntry[],
  pitchingRows: SavantPitchingEntry[],
): SavantEntry[] {
  const teams = new Map<
    string,
    {
      team_name: string;
      conference?: string;
      woba: number[];
      wrc_plus: number[];
      ops_plus: number[];
      fip: number[];
    }
  >();

  for (const row of battingRows) {
    const teamName = row.team?.trim();
    if (!teamName) continue;
    const key = normalizeTeamName(teamName);
    const entry = teams.get(key) || {
      team_name: teamName,
      conference: row.conference,
      woba: [],
      wrc_plus: [],
      ops_plus: [],
      fip: [],
    };

    if (row.conference && !entry.conference) entry.conference = row.conference;
    entry.woba.push(row.woba);
    entry.wrc_plus.push(row.wrc_plus);
    entry.ops_plus.push(row.ops_plus);
    teams.set(key, entry);
  }

  for (const row of pitchingRows) {
    const teamName = row.team?.trim();
    if (!teamName) continue;
    const key = normalizeTeamName(teamName);
    const entry = teams.get(key) || {
      team_name: teamName,
      conference: row.conference,
      woba: [],
      wrc_plus: [],
      ops_plus: [],
      fip: [],
    };

    if (row.conference && !entry.conference) entry.conference = row.conference;
    entry.fip.push(row.fip);
    teams.set(key, entry);
  }

  return Array.from(teams.values()).map((entry) => ({
    team_name: entry.team_name,
    conference: entry.conference,
    woba: average(entry.woba),
    wrc_plus: average(entry.wrc_plus),
    ops_plus: average(entry.ops_plus),
    fip: average(entry.fip),
  }));
}

/* ── Component ─────────────────────────────────────────────────────── */

export default function CompareHubPage() {
  const [standings, setStandings] = useState<StandingsTeam[]>([]);
  const [savant, setSavant] = useState<SavantEntry[]>([]);
  const [nil, setNil] = useState<NILEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');

  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [confFilter, setConfFilter] = useState('All');

  /* Fetch all data on mount */
  useEffect(() => {
    async function load() {
      try {
        const [standingsRes, battingRes, pitchingRes, nilRes] = await Promise.all([
          fetch(getReadApiUrl('/api/college-baseball/standings')).catch(() => null),
          fetch(getReadApiUrl('/api/savant/batting/leaderboard?limit=100')).catch(() => null),
          fetch(getReadApiUrl('/api/savant/pitching/leaderboard?limit=100')).catch(() => null),
          fetch(getReadApiUrl('/api/nil/leaderboard?limit=500')).catch(() => null),
        ]);

        if (standingsRes?.ok) {
          const data = await standingsRes.json();
          const teams = data.standings || data.data || data.teams || [];
          setStandings(Array.isArray(teams) ? teams : []);
          if (data.meta?.fetched_at) setLastUpdated(data.meta.fetched_at);
        }
        const battingData = battingRes?.ok ? await battingRes.json() : null;
        const pitchingData = pitchingRes?.ok ? await pitchingRes.json() : null;
        setSavant(
          aggregateSavantTeamMetrics(
            Array.isArray(battingData?.data) ? battingData.data : [],
            Array.isArray(pitchingData?.data) ? pitchingData.data : [],
          ),
        );
        if (nilRes?.ok) {
          const data = await nilRes.json();
          setNil(data.data || []);
        }
      } catch {
        /* silent — page degrades gracefully */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  /* Derive conference list + filtered team list */
  const conferences = useMemo(() => {
    const set = new Set<string>();
    standings.forEach((t) => { if (t.conference) set.add(t.conference); });
    return ['All', ...Array.from(set).sort()];
  }, [standings]);

  const filteredTeams = useMemo(() => {
    if (confFilter === 'All') return standings;
    return standings.filter((t) => t.conference === confFilter);
  }, [standings, confFilter]);

  const teamNames = useMemo(
    () => filteredTeams.map((t) => t.team_name).filter(Boolean).sort() as string[],
    [filteredTeams],
  );

  /* Lookup helpers for selected teams */
  const dataA = teamA ? matchTeam(standings, teamA) : undefined;
  const dataB = teamB ? matchTeam(standings, teamB) : undefined;
  const savantA = teamA ? matchTeam(savant, teamA) : undefined;
  const savantB = teamB ? matchTeam(savant, teamB) : undefined;
  const nilA = teamA ? matchTeam(nil, teamA) : undefined;
  const nilB = teamB ? matchTeam(nil, teamB) : undefined;

  /* Conference averages for context */
  const confAvgs = useMemo(() => {
    const conf = dataA?.conference || dataB?.conference;
    if (!conf) return undefined;
    const confTeams = standings.filter((t) => t.conference === conf);
    if (confTeams.length === 0) return undefined;
    const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : undefined;
    return {
      name: conf,
      batting_avg: avg(confTeams.map((t) => t.batting_avg).filter((v): v is number => v !== undefined)),
      era: avg(confTeams.map((t) => t.era).filter((v): v is number => v !== undefined)),
      ops: avg(confTeams.map((t) => t.ops).filter((v): v is number => v !== undefined)),
    };
  }, [standings, dataA, dataB]);

  const bothSelected = teamA && teamB;

  /* ── Comparison row helper ──────────────────────────────────────── */
  function CompareRow({
    label,
    valueA,
    valueB,
    format = (v) => String(v ?? '—'),
    higherIsBetter = true,
    confAvg,
    confName,
  }: {
    label: string;
    valueA?: number | string;
    valueB?: number | string;
    format?: (v: unknown) => string;
    higherIsBetter?: boolean;
    confAvg?: number;
    confName?: string;
  }) {
    const fA = format(valueA);
    const fB = format(valueB);
    const numA = typeof valueA === 'number' ? valueA : NaN;
    const numB = typeof valueB === 'number' ? valueB : NaN;
    const aWins = higherIsBetter ? numA > numB : numA < numB;
    const bWins = higherIsBetter ? numB > numA : numB < numA;

    return (
      <div className="grid grid-cols-3 items-center py-3 border-b border-border-vintage/30">
        <div className="text-right pr-4">
          <span className={`font-mono text-sm ${aWins && !isNaN(numA) && !isNaN(numB) ? 'text-[var(--bsi-success)] font-bold' : 'text-bsi-bone'}`}>
            {fA}
          </span>
        </div>
        <div className="text-center">
          <span className="text-bsi-dust text-xs uppercase tracking-wider">{label}</span>
          {confAvg !== undefined && confName && (
            <div className="text-bsi-dust/50 text-[10px]">{confName} avg: {format(confAvg)}</div>
          )}
        </div>
        <div className="text-left pl-4">
          <span className={`font-mono text-sm ${bWins && !isNaN(numA) && !isNaN(numB) ? 'text-[var(--bsi-success)] font-bold' : 'text-bsi-bone'}`}>
            {fB}
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#0A0A0A] text-bsi-bone">
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-border-vintage/30">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link href="/college-baseball" className="text-bsi-dust hover:text-[var(--bsi-primary)] transition-colors">
                College Baseball
              </Link>
              <span className="text-bsi-dust">/</span>
              <span className="text-bsi-bone">Compare Teams</span>
            </nav>
          </Container>
        </Section>

        {/* Hero */}
        <Section padding="lg" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-burnt-orange/10 via-transparent to-ember/5 pointer-events-none" />
          <Container center>
            <ScrollReveal direction="up">
              <Badge variant="primary" className="mb-4">Head-to-Head</Badge>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-center uppercase tracking-wide mb-4 text-bsi-bone">
                Compare <span className="text-[var(--bsi-primary)]">Teams</span>
              </h1>
              <p className="text-bsi-dust text-center max-w-xl mx-auto">
                Select two teams to compare records, batting, pitching, advanced metrics, and NIL totals side by side.
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Selection Controls */}
        <Section padding="lg" className="bg-surface-scoreboard">
          <Container>
            <ScrollReveal direction="up">
              {/* Conference Filter */}
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <select
                    value={confFilter}
                    onChange={(e) => {
                      setConfFilter(e.target.value);
                      setTeamA('');
                      setTeamB('');
                    }}
                    className="appearance-none bg-surface-dugout border border-border-vintage/40 rounded-sm px-4 py-2 pr-10 text-bsi-bone text-sm focus:border-[var(--bsi-primary)] focus:outline-none cursor-pointer"
                  >
                    {conferences.map((c) => (
                      <option key={c} value={c}>{c === 'All' ? 'All Conferences' : c}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bsi-dust pointer-events-none" />
                </div>
              </div>

              {/* Team Selectors */}
              <div className="grid md:grid-cols-3 gap-4 items-center">
                {/* Team A */}
                <div className="relative">
                  <label className="block text-bsi-dust text-xs uppercase tracking-wider mb-2 text-center">Team A</label>
                  <select
                    value={teamA}
                    onChange={(e) => setTeamA(e.target.value)}
                    className="w-full appearance-none bg-surface-dugout border border-border-vintage/40 rounded-sm px-4 py-3 text-bsi-bone text-sm focus:border-[var(--bsi-primary)] focus:outline-none cursor-pointer"
                  >
                    <option value="">Select a team...</option>
                    {teamNames.filter((n) => n !== teamB).map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 bottom-3 w-4 h-4 text-bsi-dust pointer-events-none" />
                </div>

                {/* VS Icon */}
                <div className="flex justify-center">
                  <div className="w-12 h-12 rounded-full bg-[var(--bsi-primary)]/20 border border-[var(--bsi-primary)]/40 flex items-center justify-center">
                    <ArrowLeftRight className="w-5 h-5 text-[var(--bsi-primary)]" />
                  </div>
                </div>

                {/* Team B */}
                <div className="relative">
                  <label className="block text-bsi-dust text-xs uppercase tracking-wider mb-2 text-center">Team B</label>
                  <select
                    value={teamB}
                    onChange={(e) => setTeamB(e.target.value)}
                    className="w-full appearance-none bg-surface-dugout border border-border-vintage/40 rounded-sm px-4 py-3 text-bsi-bone text-sm focus:border-[var(--bsi-primary)] focus:outline-none cursor-pointer"
                  >
                    <option value="">Select a team...</option>
                    {teamNames.filter((n) => n !== teamA).map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 bottom-3 w-4 h-4 text-bsi-dust pointer-events-none" />
                </div>
              </div>
            </ScrollReveal>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-[var(--bsi-primary)]/30 border-t-[var(--bsi-primary)] rounded-full animate-spin mx-auto mb-3" />
                <p className="text-bsi-dust text-sm">Loading team data...</p>
              </div>
            )}

            {/* Empty State */}
            {!loading && standings.length === 0 && (
              <div className="text-center py-12">
                <p className="text-bsi-dust">No standings data available yet. Check back once the season is underway.</p>
              </div>
            )}

            {/* Comparison Results */}
            {bothSelected && (
              <ScrollReveal direction="up" delay={100}>
                <Card padding="lg" className="mt-8">
                  {/* Header */}
                  <div className="grid grid-cols-3 items-center mb-6 pb-4 border-b-2 border-[var(--bsi-primary)]/30">
                    <div className="text-right pr-4">
                      <h3 className="font-display text-xl font-bold text-bsi-bone uppercase">{teamA}</h3>
                      <p className="text-bsi-dust text-xs">{dataA?.conference || ''}</p>
                    </div>
                    <div className="text-center">
                      <span className="text-[var(--bsi-primary)] font-display text-lg font-bold">VS</span>
                    </div>
                    <div className="text-left pl-4">
                      <h3 className="font-display text-xl font-bold text-bsi-bone uppercase">{teamB}</h3>
                      <p className="text-bsi-dust text-xs">{dataB?.conference || ''}</p>
                    </div>
                  </div>

                  {/* Core Stats */}
                  <CompareRow label="Record" valueA={record(dataA?.overall_wins, dataA?.overall_losses)} valueB={record(dataB?.overall_wins, dataB?.overall_losses)} format={(v) => String(v ?? '—')} />
                  <CompareRow label="Conf Record" valueA={record(dataA?.conference_wins, dataA?.conference_losses)} valueB={record(dataB?.conference_wins, dataB?.conference_losses)} format={(v) => String(v ?? '—')} />
                  <CompareRow label="Batting AVG" valueA={dataA?.batting_avg} valueB={dataB?.batting_avg} format={(v) => fmt3(v as number)} confAvg={confAvgs?.batting_avg} confName={confAvgs?.name} />
                  <CompareRow label="ERA" valueA={dataA?.era} valueB={dataB?.era} format={(v) => fmt2(v as number)} higherIsBetter={false} confAvg={confAvgs?.era} confName={confAvgs?.name} />
                  <CompareRow label="OPS" valueA={dataA?.ops} valueB={dataB?.ops} format={(v) => fmt3(v as number)} confAvg={confAvgs?.ops} confName={confAvgs?.name} />

                  {/* Advanced Metrics (Savant) */}
                  {(savantA || savantB) && (
                    <>
                      <div className="mt-4 mb-2">
                        <span className="text-[var(--bsi-primary)] text-xs uppercase tracking-wider font-display">Advanced Metrics</span>
                      </div>
                      <CompareRow label="wOBA" valueA={savantA?.woba} valueB={savantB?.woba} format={(v) => fmt3(v as number)} />
                      <CompareRow label="wRC+" valueA={savantA?.wrc_plus} valueB={savantB?.wrc_plus} format={(v) => fmt1(v as number)} />
                      <CompareRow label="FIP" valueA={savantA?.fip} valueB={savantB?.fip} format={(v) => fmt2(v as number)} higherIsBetter={false} />
                      {(savantA?.ops_plus || savantB?.ops_plus) && (
                        <CompareRow label="OPS+" valueA={savantA?.ops_plus} valueB={savantB?.ops_plus} format={(v) => fmt1(v as number)} />
                      )}
                    </>
                  )}

                  {/* NIL */}
                  {(nilA || nilB) && (
                    <>
                      <div className="mt-4 mb-2">
                        <span className="text-[var(--bsi-primary)] text-xs uppercase tracking-wider font-display">NIL Valuation</span>
                      </div>
                      <CompareRow
                        label="NIL Total"
                        valueA={nilA?.estimated_mid ?? nilA?.total_nil}
                        valueB={nilB?.estimated_mid ?? nilB?.total_nil}
                        format={(v) => fmtDollars(v as number)}
                      />
                    </>
                  )}
                </Card>
              </ScrollReveal>
            )}

            {/* Attribution */}
            {lastUpdated && (
              <div className="mt-6 flex justify-center">
                <DataAttribution lastUpdated={lastUpdated} source="BSI Analytics" />
              </div>
            )}
          </Container>
        </Section>
      </div>
      <Footer />
    </>
  );
}
