'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSportData } from '@/lib/hooks/useSportData';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PageTab = 'scoreboard' | 'leaderboards' | 'calculator' | 'api';

interface ESPNCompetitor {
  homeAway: 'home' | 'away';
  team: { abbreviation: string; displayName: string; shortDisplayName: string };
  score: string;
  winner?: boolean;
  records?: Array<{ type: string; summary: string }>;
}

interface ESPNGame {
  id: string;
  date: string;
  shortName: string;
  status: {
    type: {
      state: 'pre' | 'in' | 'post';
      completed: boolean;
      shortDetail: string;
      detail: string;
    };
  };
  competitions: Array<{
    competitors: ESPNCompetitor[];
    notes?: Array<{ headline: string }>;
    neutralSite?: boolean;
    venue?: { fullName: string; address?: { city: string; state: string } };
    attendance?: number;
  }>;
}

interface ScoresResponse {
  data: ESPNGame[];
  totalCount?: number;
  meta: { source: string; fetched_at: string; timezone: string };
}

interface LeaderRow {
  player_name: string;
  team: string;
  conference?: string;
  pa?: number;
  ip?: number;
  woba?: number;
  wrc_plus?: number;
  fip?: number;
  era_minus?: number;
  babip?: number;
  iso?: number;
  k_pct?: number;
  bb_pct?: number;
  era?: number;
  whip?: number;
  _tier_gated?: boolean;
}

interface LeaderboardResponse {
  data: LeaderRow[];
  meta: { source: string; fetched_at: string; timezone: string };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_TABS: { key: PageTab; label: string }[] = [
  { key: 'scoreboard', label: 'Scoreboard' },
  { key: 'leaderboards', label: 'Leaderboards' },
  { key: 'calculator', label: 'Calculator' },
  { key: 'api', label: 'API Explorer' },
];

const MCP_TOOLS = [
  {
    name: 'get_college_baseball_scoreboard',
    description: "Today's college baseball scores and game results — live and final.",
    params: ['date (YYYY-MM-DD, optional)', 'conference (optional)'],
  },
  {
    name: 'get_college_baseball_standings',
    description: 'Current conference standings — wins, losses, conference record, run differential.',
    params: ['conference (required)'],
  },
  {
    name: 'get_college_baseball_rankings',
    description: 'D1Baseball national Top 25 — rank, team, conference, record, movement.',
    params: ['week (optional)'],
  },
  {
    name: 'get_team_sabermetrics',
    description: 'Advanced metrics for a team — wOBA, wRC+, FIP, ERA-, BABIP, ISO.',
    params: ['team (name or slug, required)'],
  },
  {
    name: 'get_sabermetrics_leaderboard',
    description: 'Top hitters or pitchers by advanced metric — ranked leaderboard.',
    params: ['metric (woba|wrc_plus|fip|era_minus|...)', 'type (batting|pitching)', 'limit', 'conference'],
  },
  {
    name: 'get_conference_power_index',
    description: 'BSI Conference Power Index — composite SOS-adjusted conference rankings.',
    params: [],
  },
  {
    name: 'get_player_stats',
    description: 'Batting and pitching stats for a specific player — traditional + advanced.',
    params: ['player (name, required)', 'team (optional)'],
  },
  {
    name: 'get_team_schedule',
    description: 'Full schedule for a team — past results and upcoming games.',
    params: ['team (name or slug, required)'],
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SabermetricsPage() {
  const [activeTab, setActiveTab] = useState<PageTab>('scoreboard');

  const { data: scoresRes, loading: scoresLoading } =
    useSportData<ScoresResponse>('/api/college-baseball/scores');

  const { data: battingRes, loading: battingLoading } =
    useSportData<LeaderboardResponse>('/api/savant/batting/leaderboard?limit=25');

  const { data: pitchingRes, loading: pitchingLoading } =
    useSportData<LeaderboardResponse>('/api/savant/pitching/leaderboard?limit=25');

  const games = useMemo(() => scoresRes?.data ?? [], [scoresRes]);
  const liveCount = useMemo(() => games.filter(g => g.status?.type?.state === 'in').length, [games]);

  return (
    <>
      <main id="main-content">
        <Section padding="lg" className="pt-24">
          <Container size="wide">

            {/* Breadcrumb */}
            <ScrollReveal direction="up">
              <nav className="flex items-center gap-2 text-sm mb-6">
                <Link href="/" className="text-text-muted hover:text-burnt-orange transition-colors">Home</Link>
                <span className="text-text-muted">/</span>
                <Link href="/college-baseball" className="text-text-muted hover:text-burnt-orange transition-colors">
                  College Baseball
                </Link>
                <span className="text-text-muted">/</span>
                <span className="text-text-secondary">Sabermetrics</span>
              </nav>
            </ScrollReveal>

            {/* Hero */}
            <ScrollReveal direction="up" delay={50}>
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                  <Badge variant="accent" size="sm">SABERMETRICS</Badge>
                  {liveCount > 0 && (
                    <Badge variant="default" size="sm" className="bg-red-500/10 text-red-400 border-red-500/20">
                      {liveCount} LIVE
                    </Badge>
                  )}
                </div>
                <h1 className="font-display text-3xl md:text-5xl font-bold uppercase tracking-wider text-text-primary">
                  College Baseball <span className="text-burnt-orange">Sabermetrics</span>
                </h1>
                <p className="text-text-tertiary mt-3 max-w-2xl text-base leading-relaxed">
                  Live scores, advanced metrics, and an AI-native API — wOBA, FIP, wRC+,
                  and conference power indices for D1 baseball, accessible directly from Claude.
                </p>
              </div>
            </ScrollReveal>

            {/* MCP callout */}
            <ScrollReveal direction="up" delay={75}>
              <Card padding="sm" className="mb-8 border-burnt-orange/20 bg-burnt-orange/5">
                <div className="flex items-start gap-3">
                  <span className="text-burnt-orange text-base mt-0.5">⚡</span>
                  <div>
                    <p className="text-xs font-mono text-text-secondary">
                      MCP endpoint active at{' '}
                      <span className="text-burnt-orange">sabermetrics.blazesportsintel.com/mcp</span>
                      {' '}— Claude can query live scores, standings, and advanced stats directly.
                    </p>
                  </div>
                </div>
              </Card>
            </ScrollReveal>

            {/* Tab nav */}
            <ScrollReveal direction="up" delay={100}>
              <div className="flex items-center gap-1 border-b border-border mb-6 overflow-x-auto">
                {PAGE_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-4 py-3 text-sm font-display uppercase tracking-wider whitespace-nowrap transition-colors border-b-2 ${
                      activeTab === tab.key
                        ? 'text-burnt-orange border-burnt-orange'
                        : 'text-text-muted border-transparent hover:text-text-tertiary'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </ScrollReveal>

            {/* Tab content */}
            <ScrollReveal direction="up" delay={125}>
              {activeTab === 'scoreboard' && (
                <ScoreboardTab games={games} loading={scoresLoading} meta={scoresRes?.meta} />
              )}
              {activeTab === 'leaderboards' && (
                <LeaderboardsTab
                  batting={battingRes?.data ?? []}
                  pitching={pitchingRes?.data ?? []}
                  battingLoading={battingLoading}
                  pitchingLoading={pitchingLoading}
                />
              )}
              {activeTab === 'calculator' && <CalculatorTab />}
              {activeTab === 'api' && <ApiExplorerTab />}
            </ScrollReveal>

          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}

// ---------------------------------------------------------------------------
// Scoreboard Tab
// ---------------------------------------------------------------------------

function ScoreboardTab({
  games,
  loading,
  meta,
}: {
  games: ESPNGame[];
  loading: boolean;
  meta?: { source: string; fetched_at: string; timezone: string };
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (games.length > 0 && !selectedId) {
      const live = games.find(g => g.status?.type?.state === 'in');
      setSelectedId((live ?? games[0]).id);
    }
  }, [games, selectedId]);

  const selectedGame = useMemo(() => games.find(g => g.id === selectedId) ?? null, [games, selectedId]);

  if (loading) return <ScoreboardSkeleton />;

  if (games.length === 0) {
    return (
      <Card padding="lg" className="text-center">
        <p className="text-text-muted text-sm">No games available. Check back during the season.</p>
      </Card>
    );
  }

  const live = games.filter(g => g.status?.type?.state === 'in');
  const final = games.filter(g => g.status?.type?.completed);
  const upcoming = games.filter(g => g.status?.type?.state === 'pre');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Game list */}
      <div className="lg:col-span-1 space-y-4">
        {live.length > 0 && (
          <div>
            <p className="text-[10px] font-display uppercase tracking-widest text-red-400 mb-2">Live</p>
            <div className="space-y-1">
              {live.map(g => <GameCard key={g.id} game={g} selected={selectedId === g.id} onClick={() => setSelectedId(g.id)} />)}
            </div>
          </div>
        )}
        {final.length > 0 && (
          <div>
            <p className="text-[10px] font-display uppercase tracking-widest text-text-muted mb-2">Final</p>
            <div className="space-y-1">
              {final.map(g => <GameCard key={g.id} game={g} selected={selectedId === g.id} onClick={() => setSelectedId(g.id)} />)}
            </div>
          </div>
        )}
        {upcoming.length > 0 && (
          <div>
            <p className="text-[10px] font-display uppercase tracking-widest text-text-muted mb-2">Upcoming</p>
            <div className="space-y-1">
              {upcoming.map(g => <GameCard key={g.id} game={g} selected={selectedId === g.id} onClick={() => setSelectedId(g.id)} />)}
            </div>
          </div>
        )}
        {meta && (
          <p className="text-[10px] font-mono text-text-muted mt-3">
            Source: {meta.source} · {new Date(meta.fetched_at).toLocaleTimeString('en-US', { timeZone: meta.timezone, hour: 'numeric', minute: '2-digit' })} CT
          </p>
        )}
      </div>

      {/* Game detail */}
      <div className="lg:col-span-2">
        {selectedGame ? (
          <GameDetail game={selectedGame} />
        ) : (
          <Card padding="lg" className="flex items-center justify-center min-h-[200px]">
            <p className="text-text-muted text-sm">Select a game</p>
          </Card>
        )}
      </div>
    </div>
  );
}

function GameCard({ game, selected, onClick }: { game: ESPNGame; selected: boolean; onClick: () => void }) {
  const comp = game.competitions?.[0];
  const home = comp?.competitors?.find(c => c.homeAway === 'home');
  const away = comp?.competitors?.find(c => c.homeAway === 'away');
  const isLive = game.status?.type?.state === 'in';
  const isFinal = game.status?.type?.completed;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border transition-colors ${
        selected ? 'border-burnt-orange bg-burnt-orange/5' : 'border-border-subtle hover:border-border-strong'
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-mono text-text-muted">
          {isLive ? (
            <span className="text-red-400 font-semibold">● {game.status.type.shortDetail}</span>
          ) : isFinal ? (
            'Final'
          ) : (
            new Date(game.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
          )}
        </span>
      </div>
      <div className="space-y-1">
        {[away, home].map((team, i) => team && (
          <div key={i} className="flex items-center justify-between">
            <span className={`text-xs ${team.winner ? 'text-text-primary font-semibold' : 'text-text-secondary'}`}>
              {team.team.abbreviation}
            </span>
            <span className={`text-xs font-mono tabular-nums ${team.winner ? 'font-bold text-text-primary' : 'text-text-secondary'}`}>
              {team.score || '—'}
            </span>
          </div>
        ))}
      </div>
    </button>
  );
}

function GameDetail({ game }: { game: ESPNGame }) {
  const comp = game.competitions?.[0];
  const home = comp?.competitors?.find(c => c.homeAway === 'home');
  const away = comp?.competitors?.find(c => c.homeAway === 'away');
  const isLive = game.status?.type?.state === 'in';
  const note = comp?.notes?.[0]?.headline;

  const homeRecord = home?.records?.find(r => r.type === 'total')?.summary;
  const awayRecord = away?.records?.find(r => r.type === 'total')?.summary;

  return (
    <Card padding="lg" className="space-y-5">
      {/* Status */}
      <div className="flex items-center gap-3">
        {isLive ? (
          <Badge variant="default" size="sm" className="bg-red-500/10 text-red-400 border-red-500/20">
            ● LIVE — {game.status.type.shortDetail}
          </Badge>
        ) : game.status?.type?.completed ? (
          <Badge variant="default" size="sm">Final</Badge>
        ) : (
          <Badge variant="default" size="sm" className="text-text-muted border-border">
            {game.status?.type?.shortDetail}
          </Badge>
        )}
        {note && <span className="text-xs text-text-muted">{note}</span>}
      </div>

      {/* Score */}
      <div className="grid grid-cols-3 gap-4 items-center">
        <div className="text-center">
          <p className="font-display text-sm uppercase tracking-widest text-text-muted mb-1">
            {away?.team.abbreviation}
          </p>
          <p className="font-display text-base text-text-tertiary">{away?.team.shortDisplayName}</p>
          {awayRecord && <p className="text-[10px] font-mono text-text-muted mt-1">{awayRecord}</p>}
          <p className={`font-display text-5xl font-bold mt-3 tabular-nums ${away?.winner ? 'text-text-primary' : 'text-text-tertiary'}`}>
            {away?.score || '0'}
          </p>
        </div>

        <div className="text-center">
          <p className="text-text-muted text-sm font-display uppercase tracking-widest">vs</p>
          {game.status?.type?.detail && (
            <p className="text-[10px] font-mono text-text-muted mt-1 leading-relaxed">
              {game.status.type.detail}
            </p>
          )}
        </div>

        <div className="text-center">
          <p className="font-display text-sm uppercase tracking-widest text-text-muted mb-1">
            {home?.team.abbreviation}
          </p>
          <p className="font-display text-base text-text-tertiary">{home?.team.shortDisplayName}</p>
          {homeRecord && <p className="text-[10px] font-mono text-text-muted mt-1">{homeRecord}</p>}
          <p className={`font-display text-5xl font-bold mt-3 tabular-nums ${home?.winner ? 'text-text-primary' : 'text-text-tertiary'}`}>
            {home?.score || '0'}
          </p>
        </div>
      </div>

      {/* Venue */}
      {comp?.venue?.fullName && (
        <p className="text-[10px] font-mono text-text-muted">
          {comp.venue.fullName}
          {comp.venue.address ? ` · ${comp.venue.address.city}, ${comp.venue.address.state}` : ''}
          {comp.attendance ? ` · Att: ${comp.attendance.toLocaleString()}` : ''}
        </p>
      )}

      <div className="pt-2 border-t border-border-subtle">
        <Link
          href={`/college-baseball/games/${game.id}`}
          className="text-xs text-burnt-orange hover:text-ember transition-colors font-mono"
        >
          Box score →
        </Link>
      </div>
    </Card>
  );
}

function ScoreboardSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 rounded-lg bg-surface-light animate-pulse" />
        ))}
      </div>
      <div className="lg:col-span-2 h-64 rounded-lg bg-surface-light animate-pulse" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Leaderboards Tab
// ---------------------------------------------------------------------------

function LeaderboardsTab({
  batting,
  pitching,
  battingLoading,
  pitchingLoading,
}: {
  batting: LeaderRow[];
  pitching: LeaderRow[];
  battingLoading: boolean;
  pitchingLoading: boolean;
}) {
  const [sub, setSub] = useState<'batting' | 'pitching'>('batting');

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        {(['batting', 'pitching'] as const).map(s => (
          <button
            key={s}
            onClick={() => setSub(s)}
            className={`px-4 py-2 rounded-lg text-xs font-display uppercase tracking-wider transition-colors border ${
              sub === s
                ? 'border-burnt-orange text-burnt-orange bg-burnt-orange/5'
                : 'border-border text-text-muted hover:border-border-strong'
            }`}
          >
            {s}
          </button>
        ))}
        <span className="ml-auto text-[10px] font-mono text-text-muted">
          Top 25 · Full view at{' '}
          <Link href="/college-baseball/savant" className="text-burnt-orange hover:text-ember transition-colors">
            Savant →
          </Link>
        </span>
      </div>

      {sub === 'batting' && (
        battingLoading ? <LeaderboardSkeleton /> : <BattingTable rows={batting} />
      )}
      {sub === 'pitching' && (
        pitchingLoading ? <LeaderboardSkeleton /> : <PitchingTable rows={pitching} />
      )}
    </div>
  );
}

function BattingTable({ rows }: { rows: LeaderRow[] }) {
  const cols = [
    { key: 'player_name', label: 'Player' },
    { key: 'team', label: 'Team' },
    { key: 'pa', label: 'PA' },
    { key: 'woba', label: 'wOBA', fmt: (v: number) => v?.toFixed(3) },
    { key: 'wrc_plus', label: 'wRC+', fmt: (v: number) => v?.toFixed(0) },
    { key: 'iso', label: 'ISO', fmt: (v: number) => v?.toFixed(3) },
    { key: 'babip', label: 'BABIP', fmt: (v: number) => v?.toFixed(3) },
    { key: 'k_pct', label: 'K%', fmt: (v: number) => `${v?.toFixed(1)}%` },
    { key: 'bb_pct', label: 'BB%', fmt: (v: number) => `${v?.toFixed(1)}%` },
  ];

  return <DataTable cols={cols} rows={rows} />;
}

function PitchingTable({ rows }: { rows: LeaderRow[] }) {
  const cols = [
    { key: 'player_name', label: 'Player' },
    { key: 'team', label: 'Team' },
    { key: 'ip', label: 'IP', fmt: (v: number) => v?.toFixed(1) },
    { key: 'era', label: 'ERA', fmt: (v: number) => v?.toFixed(2) },
    { key: 'fip', label: 'FIP', fmt: (v: number) => v?.toFixed(2) },
    { key: 'era_minus', label: 'ERA-', fmt: (v: number) => v?.toFixed(0) },
    { key: 'whip', label: 'WHIP', fmt: (v: number) => v?.toFixed(2) },
    { key: 'k_pct', label: 'K%', fmt: (v: number) => `${v?.toFixed(1)}%` },
    { key: 'bb_pct', label: 'BB%', fmt: (v: number) => `${v?.toFixed(1)}%` },
  ];

  return <DataTable cols={cols} rows={rows} />;
}

function DataTable({
  cols,
  rows,
}: {
  cols: Array<{ key: string; label: string; fmt?: (v: number) => string }>;
  rows: LeaderRow[];
}) {
  if (rows.length === 0) {
    return (
      <Card padding="lg" className="text-center">
        <p className="text-text-muted text-sm">No data available.</p>
      </Card>
    );
  }

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="px-3 py-2.5 text-left text-[10px] font-display uppercase tracking-widest text-text-muted w-6">#</th>
              {cols.map(c => (
                <th
                  key={c.key}
                  className={`px-3 py-2.5 text-[10px] font-display uppercase tracking-widest text-text-muted ${
                    c.key === 'player_name' ? 'text-left' : 'text-right'
                  }`}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-surface-light/50 transition-colors">
                <td className="px-3 py-2.5 text-text-muted font-mono tabular-nums">{i + 1}</td>
                {cols.map(c => {
                  const val = row[c.key as keyof LeaderRow];
                  const isName = c.key === 'player_name' || c.key === 'team';
                  const display = c.fmt && typeof val === 'number'
                    ? (row._tier_gated ? '—' : c.fmt(val))
                    : (val ?? '—');
                  return (
                    <td
                      key={c.key}
                      className={`px-3 py-2.5 ${isName ? 'text-left text-text-secondary' : 'text-right font-mono tabular-nums text-text-primary'}`}
                    >
                      {String(display)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function LeaderboardSkeleton() {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="divide-y divide-border-subtle">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="px-4 py-3 flex items-center gap-4">
            <div className="h-3 w-5 bg-surface-light rounded animate-pulse" />
            <div className="h-3 flex-1 max-w-[180px] bg-surface-medium rounded animate-pulse" />
            <div className="h-3 w-12 bg-surface-light rounded animate-pulse" />
            <div className="h-3 w-10 bg-surface-light rounded animate-pulse hidden sm:block" />
            <div className="h-3 w-10 bg-surface-light rounded animate-pulse hidden md:block" />
          </div>
        ))}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Calculator Tab
// ---------------------------------------------------------------------------

type CalcMode = 'batting' | 'pitching';

interface BattingInputs {
  pa: string; ab: string; h: string;
  singles: string; doubles: string; triples: string; hr: string;
  bb: string; hbp: string; sf: string; k: string;
}

interface PitchingInputs {
  ip: string; h: string; er: string;
  hr: string; bb: string; hbp: string; k: string; ibb: string;
}

function CalculatorTab() {
  const [mode, setMode] = useState<CalcMode>('batting');
  const [battingInputs, setBattingInputs] = useState<BattingInputs>({
    pa: '', ab: '', h: '', singles: '', doubles: '', triples: '', hr: '',
    bb: '', hbp: '', sf: '', k: '',
  });
  const [pitchingInputs, setPitchingInputs] = useState<PitchingInputs>({
    ip: '', h: '', er: '', hr: '', bb: '', hbp: '', k: '', ibb: '',
  });
  const [battingResult, setBattingResult] = useState<Record<string, string> | null>(null);
  const [pitchingResult, setPitchingResult] = useState<Record<string, string> | null>(null);

  const n = (s: string) => parseFloat(s) || 0;

  const calculateBatting = useCallback(() => {
    const pa = n(battingInputs.pa);
    const ab = n(battingInputs.ab);
    const h = n(battingInputs.h);
    const hr = n(battingInputs.hr);
    const bb = n(battingInputs.bb);
    const hbp = n(battingInputs.hbp);
    const sf = n(battingInputs.sf);
    const k = n(battingInputs.k);
    const singles = n(battingInputs.singles) || (h - n(battingInputs.doubles) - n(battingInputs.triples) - hr);
    const doubles = n(battingInputs.doubles);
    const triples = n(battingInputs.triples);

    // Linear weights (college-derived from BSI savant compute)
    const wBB = 0.69, wHBP = 0.72, w1B = 0.89, w2B = 1.27, w3B = 1.62, wHR = 2.10;
    const woba = pa > 0
      ? (bb * wBB + hbp * wHBP + singles * w1B + doubles * w2B + triples * w3B + hr * wHR) / pa
      : 0;

    const avg = ab > 0 ? h / ab : 0;
    const obp = pa > 0 ? (h + bb + hbp) / pa : 0;
    const slg = ab > 0 ? (singles + 2 * doubles + 3 * triples + 4 * hr) / ab : 0;
    const iso = slg - avg;
    const babipDenom = ab - k - hr + sf;
    const babip = babipDenom > 0 ? (h - hr) / babipDenom : 0;
    const kPct = pa > 0 ? (k / pa) * 100 : 0;
    const bbPct = pa > 0 ? (bb / pa) * 100 : 0;

    setBattingResult({
      wOBA: woba.toFixed(3),
      AVG: avg.toFixed(3),
      OBP: obp.toFixed(3),
      SLG: slg.toFixed(3),
      OPS: (obp + slg).toFixed(3),
      ISO: iso.toFixed(3),
      BABIP: babip.toFixed(3),
      'K%': `${kPct.toFixed(1)}%`,
      'BB%': `${bbPct.toFixed(1)}%`,
    });
  }, [battingInputs]);

  const calculatePitching = useCallback(() => {
    const ip = n(pitchingInputs.ip);
    const h = n(pitchingInputs.h);
    const er = n(pitchingInputs.er);
    const hr = n(pitchingInputs.hr);
    const bb = n(pitchingInputs.bb);
    const hbp = n(pitchingInputs.hbp);
    const k = n(pitchingInputs.k);
    const ibb = n(pitchingInputs.ibb);

    const fipC = 3.80; // College FIP constant (BSI savant default)
    const era = ip > 0 ? (er / ip) * 9 : 0;
    const fip = ip > 0 ? ((13 * hr + 3 * (bb + hbp - ibb) - 2 * k) / ip) + fipC : 0;
    const whip = ip > 0 ? (bb + h) / ip : 0;
    const k9 = ip > 0 ? (k / ip) * 9 : 0;
    const bb9 = ip > 0 ? (bb / ip) * 9 : 0;
    const hr9 = ip > 0 ? (hr / ip) * 9 : 0;

    setPitchingResult({
      ERA: era.toFixed(2),
      FIP: fip.toFixed(2),
      WHIP: whip.toFixed(2),
      'K/9': k9.toFixed(1),
      'BB/9': bb9.toFixed(1),
      'HR/9': hr9.toFixed(2),
    });
  }, [pitchingInputs]);

  const battingFields: Array<{ key: keyof BattingInputs; label: string; hint?: string }> = [
    { key: 'pa', label: 'PA', hint: 'Plate appearances' },
    { key: 'ab', label: 'AB', hint: 'At-bats' },
    { key: 'h', label: 'H', hint: 'Total hits' },
    { key: 'singles', label: '1B', hint: 'Singles (or auto-computed)' },
    { key: 'doubles', label: '2B' },
    { key: 'triples', label: '3B' },
    { key: 'hr', label: 'HR' },
    { key: 'bb', label: 'BB', hint: 'Unintentional walks' },
    { key: 'hbp', label: 'HBP' },
    { key: 'sf', label: 'SF', hint: 'Sacrifice flies' },
    { key: 'k', label: 'K', hint: 'Strikeouts' },
  ];

  const pitchingFields: Array<{ key: keyof PitchingInputs; label: string; hint?: string }> = [
    { key: 'ip', label: 'IP', hint: 'Innings pitched (e.g. 45.2)' },
    { key: 'h', label: 'H', hint: 'Hits allowed' },
    { key: 'er', label: 'ER', hint: 'Earned runs' },
    { key: 'hr', label: 'HR', hint: 'Home runs allowed' },
    { key: 'bb', label: 'BB', hint: 'Walks' },
    { key: 'hbp', label: 'HBP' },
    { key: 'k', label: 'K', hint: 'Strikeouts' },
    { key: 'ibb', label: 'IBB', hint: 'Intentional walks' },
  ];

  return (
    <div className="space-y-6">
      <Card padding="md" className="border-border-subtle">
        <p className="text-[10px] font-mono text-text-muted">
          Weights: wBB=0.69 · wHBP=0.72 · w1B=0.89 · w2B=1.27 · w3B=1.62 · wHR=2.10 · FIP constant=3.80
          (college-derived via BSI Savant Compute).
        </p>
      </Card>

      <div className="flex items-center gap-3">
        {(['batting', 'pitching'] as const).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-2 rounded-lg text-xs font-display uppercase tracking-wider transition-colors border ${
              mode === m
                ? 'border-burnt-orange text-burnt-orange bg-burnt-orange/5'
                : 'border-border text-text-muted hover:border-border-strong'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {mode === 'batting' && (
        <div className="space-y-5">
          <Card padding="md">
            <p className="text-xs font-display uppercase tracking-widest text-text-muted mb-4">Inputs</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {battingFields.map(f => (
                <div key={f.key}>
                  <label className="text-[10px] font-mono text-text-muted block mb-1">
                    {f.label}{f.hint ? ` (${f.hint})` : ''}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={battingInputs[f.key]}
                    onChange={e => setBattingInputs(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full bg-surface-light border border-border rounded px-2.5 py-1.5 text-sm font-mono text-text-primary focus:outline-none focus:border-burnt-orange/50 transition-colors"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={calculateBatting}
                className="px-4 py-2 bg-burnt-orange hover:bg-ember text-white text-xs font-display uppercase tracking-wider rounded-lg transition-colors"
              >
                Calculate
              </button>
              <button
                onClick={() => { setBattingInputs({ pa: '', ab: '', h: '', singles: '', doubles: '', triples: '', hr: '', bb: '', hbp: '', sf: '', k: '' }); setBattingResult(null); }}
                className="px-4 py-2 border border-border text-text-muted text-xs font-display uppercase tracking-wider rounded-lg hover:border-border-strong transition-colors"
              >
                Clear
              </button>
            </div>
          </Card>

          {battingResult && (
            <Card padding="md" className="border-burnt-orange/20 bg-burnt-orange/5">
              <p className="text-xs font-display uppercase tracking-widest text-burnt-orange mb-3">Results</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {Object.entries(battingResult).map(([k, v]) => (
                  <div key={k}>
                    <p className="text-[10px] font-mono text-text-muted mb-0.5">{k}</p>
                    <p className="text-lg font-mono font-bold tabular-nums text-text-primary">{v}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {mode === 'pitching' && (
        <div className="space-y-5">
          <Card padding="md">
            <p className="text-xs font-display uppercase tracking-widest text-text-muted mb-4">Inputs</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {pitchingFields.map(f => (
                <div key={f.key}>
                  <label className="text-[10px] font-mono text-text-muted block mb-1">
                    {f.label}{f.hint ? ` (${f.hint})` : ''}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={pitchingInputs[f.key]}
                    onChange={e => setPitchingInputs(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full bg-surface-light border border-border rounded px-2.5 py-1.5 text-sm font-mono text-text-primary focus:outline-none focus:border-burnt-orange/50 transition-colors"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={calculatePitching}
                className="px-4 py-2 bg-burnt-orange hover:bg-ember text-white text-xs font-display uppercase tracking-wider rounded-lg transition-colors"
              >
                Calculate
              </button>
              <button
                onClick={() => { setPitchingInputs({ ip: '', h: '', er: '', hr: '', bb: '', hbp: '', k: '', ibb: '' }); setPitchingResult(null); }}
                className="px-4 py-2 border border-border text-text-muted text-xs font-display uppercase tracking-wider rounded-lg hover:border-border-strong transition-colors"
              >
                Clear
              </button>
            </div>
          </Card>

          {pitchingResult && (
            <Card padding="md" className="border-burnt-orange/20 bg-burnt-orange/5">
              <p className="text-xs font-display uppercase tracking-widest text-burnt-orange mb-3">Results</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {Object.entries(pitchingResult).map(([k, v]) => (
                  <div key={k}>
                    <p className="text-[10px] font-mono text-text-muted mb-0.5">{k}</p>
                    <p className="text-lg font-mono font-bold tabular-nums text-text-primary">{v}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// API Explorer Tab
// ---------------------------------------------------------------------------

function ApiExplorerTab() {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  const healthCurl = `curl https://sabermetrics.blazesportsintel.com/health`;
  const initCurl = `curl -X POST https://sabermetrics.blazesportsintel.com/mcp \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <YOUR_KEY>" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}'`;
  const scoreboardCurl = `curl -X POST https://sabermetrics.blazesportsintel.com/mcp \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <YOUR_KEY>" \\
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"get_college_baseball_scoreboard","arguments":{}}}'`;

  return (
    <div className="space-y-6">
      {/* Endpoint info */}
      <Card padding="md">
        <p className="text-xs font-display uppercase tracking-widest text-text-muted mb-4">Endpoint</p>
        <div className="space-y-2 text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="text-text-muted w-12 shrink-0">GET</span>
            <span className="text-text-primary">sabermetrics.blazesportsintel.com/health</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-text-muted w-12 shrink-0">POST</span>
            <span className="text-text-primary">sabermetrics.blazesportsintel.com/mcp</span>
            <span className="text-text-muted">JSON-RPC 2.0 · Bearer auth</span>
          </div>
        </div>
      </Card>

      {/* Quick commands */}
      <div className="space-y-3">
        <p className="text-xs font-display uppercase tracking-widest text-text-muted">Quick Commands</p>
        {[
          { label: 'Health check', curl: healthCurl, key: 'health' },
          { label: 'Initialize', curl: initCurl, key: 'init' },
          { label: 'Get scoreboard', curl: scoreboardCurl, key: 'scores' },
        ].map(({ label, curl, key }) => (
          <Card key={key} padding="none" className="overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border-subtle">
              <span className="text-[10px] font-mono text-text-muted">{label}</span>
              <button
                onClick={() => copy(curl, key)}
                className="text-[10px] font-mono text-burnt-orange hover:text-ember transition-colors"
              >
                {copied === key ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="px-4 py-3 text-[10px] font-mono text-text-tertiary overflow-x-auto leading-relaxed">
              {curl}
            </pre>
          </Card>
        ))}
      </div>

      {/* Tool list */}
      <div className="space-y-3">
        <p className="text-xs font-display uppercase tracking-widest text-text-muted">
          Available Tools ({MCP_TOOLS.length})
        </p>
        <div className="space-y-2">
          {MCP_TOOLS.map(tool => (
            <Card key={tool.name} padding="md" className="border-border-subtle">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-burnt-orange mb-1">{tool.name}</p>
                  <p className="text-xs text-text-secondary leading-relaxed">{tool.description}</p>
                  {tool.params.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {tool.params.map(p => (
                        <span key={p} className="text-[10px] font-mono text-text-muted bg-surface-light px-2 py-0.5 rounded">
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Claude.ai connector note */}
      <Card padding="md" className="border-border-subtle">
        <p className="text-xs font-display uppercase tracking-widest text-text-muted mb-3">Claude.ai Connector</p>
        <div className="space-y-1.5 text-xs font-mono text-text-secondary">
          <p>Settings → Connectors → Add custom connector</p>
          <p>Server URL: <span className="text-burnt-orange">https://sabermetrics.blazesportsintel.com/mcp</span></p>
          <p>Header: <span className="text-text-primary">Authorization: Bearer &lt;BSI_API_KEY&gt;</span></p>
        </div>
      </Card>
    </div>
  );
}
