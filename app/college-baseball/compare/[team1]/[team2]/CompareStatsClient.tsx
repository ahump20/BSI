'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DataFreshnessIndicator } from '@/components/ui/DataFreshnessIndicator';

interface TeamSabermetrics {
  team: string;
  batting: {
    count: number;
    avgWoba: number;
    avgWrcPlus: number;
    avgOpsPlus: number;
    avgObp: number;
    avgSlg: number;
  };
  pitching: {
    count: number;
    avgFip: number;
    avgEraMinus: number;
    avgKpct: number;
    avgBbpct: number;
  };
}

interface SavantResponse {
  team: Record<string, unknown>;
  hitters?: Array<{ woba?: number; wrc_plus?: number; ops_plus?: number; obp?: number; slg?: number }>;
  pitchers?: Array<{ fip?: number; era_minus?: number; k_pct?: number; bb_pct?: number }>;
  meta?: { source?: string; fetched_at?: string };
}

function avg(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

function parseSavant(data: SavantResponse): TeamSabermetrics | null {
  const hitters = data.hitters || [];
  const pitchers = data.pitchers || [];
  if (hitters.length === 0 && pitchers.length === 0) return null;

  return {
    team: '',
    batting: {
      count: hitters.length,
      avgWoba: parseFloat(avg(hitters.map(h => h.woba ?? 0).filter(v => v > 0)).toFixed(3)),
      avgWrcPlus: Math.round(avg(hitters.map(h => h.wrc_plus ?? 0).filter(v => v > 0))),
      avgOpsPlus: Math.round(avg(hitters.map(h => h.ops_plus ?? 0).filter(v => v > 0))),
      avgObp: parseFloat(avg(hitters.map(h => h.obp ?? 0).filter(v => v > 0)).toFixed(3)),
      avgSlg: parseFloat(avg(hitters.map(h => h.slg ?? 0).filter(v => v > 0)).toFixed(3)),
    },
    pitching: {
      count: pitchers.length,
      avgFip: parseFloat(avg(pitchers.map(p => p.fip ?? 0).filter(v => v > 0)).toFixed(2)),
      avgEraMinus: Math.round(avg(pitchers.map(p => p.era_minus ?? 0).filter(v => v > 0))),
      avgKpct: parseFloat(avg(pitchers.map(p => p.k_pct ?? 0).filter(v => v > 0)).toFixed(1)),
      avgBbpct: parseFloat(avg(pitchers.map(p => p.bb_pct ?? 0).filter(v => v > 0)).toFixed(1)),
    },
  };
}

interface StatRowProps {
  label: string;
  valueA: string | number;
  valueB: string | number;
  higher?: 'a' | 'b' | 'tie';
  inverse?: boolean;
  description?: string;
}

function StatRow({ label, valueA, valueB, higher, inverse, description }: StatRowProps) {
  const numA = typeof valueA === 'number' ? valueA : parseFloat(String(valueA));
  const numB = typeof valueB === 'number' ? valueB : parseFloat(String(valueB));
  const actualHigher = higher || (numA === numB ? 'tie' : inverse ? (numA < numB ? 'a' : 'b') : (numA > numB ? 'a' : 'b'));

  return (
    <div className="flex items-center justify-between py-3 border-b border-[var(--border-vintage)] last:border-0">
      <div className={`text-right w-20 font-mono text-sm ${actualHigher === 'a' ? 'text-success font-bold' : 'text-[var(--bsi-dust)]'}`}>
        {valueA || '-'}
      </div>
      <div className="flex-1 text-center px-2">
        <span className="text-xs text-[rgba(196,184,165,0.5)] uppercase tracking-wide">{label}</span>
        {description && <p className="text-[10px] text-[rgba(196,184,165,0.5)] mt-0.5">{description}</p>}
      </div>
      <div className={`text-left w-20 font-mono text-sm ${actualHigher === 'b' ? 'text-success font-bold' : 'text-[var(--bsi-dust)]'}`}>
        {valueB || '-'}
      </div>
    </div>
  );
}

interface CompareStatsClientProps {
  team1Slug: string;
  team2Slug: string;
  team1Name: string;
  team2Name: string;
}

export default function CompareStatsClient({ team1Slug, team2Slug, team1Name, team2Name }: CompareStatsClientProps) {
  const [stats1, setStats1] = useState<TeamSabermetrics | null>(null);
  const [stats2, setStats2] = useState<TeamSabermetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchedAt, setFetchedAt] = useState<string | undefined>();

  useEffect(() => {
    const apiKey = typeof window !== 'undefined' ? localStorage.getItem('bsi-api-key') ?? '' : '';
    const headers: HeadersInit = apiKey ? { 'X-BSI-Key': apiKey } : {};

    Promise.all([
      fetch(`/api/college-baseball/teams/${team1Slug}/sabermetrics`, { headers }).then(r => r.ok ? r.json() as Promise<SavantResponse> : null),
      fetch(`/api/college-baseball/teams/${team2Slug}/sabermetrics`, { headers }).then(r => r.ok ? r.json() as Promise<SavantResponse> : null),
    ])
      .then(([data1, data2]) => {
        if (data1) setStats1(parseSavant(data1));
        if (data2) setStats2(parseSavant(data2));
        setFetchedAt(new Date().toISOString());
      })
      .catch(() => {
        // Stats unavailable — section won't render
      })
      .finally(() => setLoading(false));
  }, [team1Slug, team2Slug]);

  if (loading) {
    return (
      <Card variant="default" padding="lg" className="mt-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-[var(--surface-dugout)] rounded-sm w-48 mx-auto" />
          <div className="h-4 bg-[var(--surface-dugout)] rounded-sm w-32 mx-auto" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 bg-[var(--surface-dugout)] rounded-sm" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (!stats1 && !stats2) {
    return (
      <Card variant="default" padding="lg" className="mt-8 text-center">
        <Badge variant="secondary" className="mb-3">BSI Savant</Badge>
        <p className="text-[var(--bsi-dust)] text-sm">
          Advanced analytics aren't available for these teams yet.
          Check back as the season progresses.
        </p>
      </Card>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="text-center mb-4">
        <Badge variant="primary" className="mb-2">Live Analytics</Badge>
        <h2 className="font-display text-xl font-bold uppercase tracking-wide text-[var(--bsi-bone)]">
          BSI Savant Comparison
        </h2>
        <p className="text-[rgba(196,184,165,0.5)] text-sm mt-1">
          Advanced sabermetrics computed from 2026 season data
        </p>
      </div>

      {/* Team headers */}
      <div className="flex items-center justify-between px-4">
        <span className="font-display font-bold text-[var(--bsi-primary)] uppercase text-sm">{team1Name}</span>
        <span className="text-[rgba(196,184,165,0.5)] text-xs">vs</span>
        <span className="font-display font-bold text-[var(--bsi-primary)] uppercase text-sm">{team2Name}</span>
      </div>

      {/* Batting Comparison */}
      <Card variant="default" padding="md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Batting
            <span className="text-[rgba(196,184,165,0.5)] text-xs font-normal">
              ({stats1?.batting.count || 0} vs {stats2?.batting.count || 0} qualifiers)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StatRow
            label="wOBA"
            description="Weighted On-Base Average"
            valueA={stats1?.batting.avgWoba ?? '-'}
            valueB={stats2?.batting.avgWoba ?? '-'}
          />
          <StatRow
            label="wRC+"
            description="Weighted Runs Created Plus (100 = league avg)"
            valueA={stats1?.batting.avgWrcPlus ?? '-'}
            valueB={stats2?.batting.avgWrcPlus ?? '-'}
          />
          <StatRow
            label="OPS+"
            description="On-Base Plus Slugging Plus (100 = league avg)"
            valueA={stats1?.batting.avgOpsPlus ?? '-'}
            valueB={stats2?.batting.avgOpsPlus ?? '-'}
          />
          <StatRow
            label="OBP"
            description="On-Base Percentage"
            valueA={stats1?.batting.avgObp ?? '-'}
            valueB={stats2?.batting.avgObp ?? '-'}
          />
          <StatRow
            label="SLG"
            description="Slugging Percentage"
            valueA={stats1?.batting.avgSlg ?? '-'}
            valueB={stats2?.batting.avgSlg ?? '-'}
          />
        </CardContent>
      </Card>

      {/* Pitching Comparison */}
      <Card variant="default" padding="md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Pitching
            <span className="text-[rgba(196,184,165,0.5)] text-xs font-normal">
              ({stats1?.pitching.count || 0} vs {stats2?.pitching.count || 0} qualifiers)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StatRow
            label="FIP"
            description="Fielding Independent Pitching (lower = better)"
            valueA={stats1?.pitching.avgFip ?? '-'}
            valueB={stats2?.pitching.avgFip ?? '-'}
            inverse
          />
          <StatRow
            label="ERA-"
            description="ERA Minus (100 = league avg, lower = better)"
            valueA={stats1?.pitching.avgEraMinus ?? '-'}
            valueB={stats2?.pitching.avgEraMinus ?? '-'}
            inverse
          />
          <StatRow
            label="K%"
            description="Strikeout Rate (higher = better)"
            valueA={stats1?.pitching.avgKpct ? `${stats1.pitching.avgKpct}%` : '-'}
            valueB={stats2?.pitching.avgKpct ? `${stats2.pitching.avgKpct}%` : '-'}
          />
          <StatRow
            label="BB%"
            description="Walk Rate (lower = better)"
            valueA={stats1?.pitching.avgBbpct ? `${stats1.pitching.avgBbpct}%` : '-'}
            valueB={stats2?.pitching.avgBbpct ? `${stats2.pitching.avgBbpct}%` : '-'}
            inverse
          />
        </CardContent>
      </Card>

      {fetchedAt && (
        <DataFreshnessIndicator
          lastUpdated={new Date(fetchedAt)}
          source="BSI Savant"
          refreshInterval={21600}
        />
      )}
    </div>
  );
}
