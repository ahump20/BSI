'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { useSportData } from '@/lib/hooks/useSportData';
import { fmt3 } from '@/lib/utils/format';

// ─── Types ─────────────────────────────────────────────────────────────────

interface AllHitter {
  espn_id: string;
  name: string;
  position: string;
  games: number;
  ab: number;
  pa: number;
  babip: number;
  iso: number;
  kpct: number;
  bbpct: number;
  woba: number;
  wrc_plus: number;
}

interface AllPitcher {
  espn_id: string;
  name: string;
  position: string;
  games: number;
  ip: number;
  fip: number;
  k9: number;
  bb9: number;
}

interface TeamSabermetrics {
  teamId: string;
  season: number;
  batting: {
    woba: number;
    wrc_plus: number;
    babip: number;
    iso: number;
    k_pct: number;
    bb_pct: number;
    top_hitters: SaberHitter[];
  };
  pitching: {
    fip: number;
    k_per_9: number;
    bb_per_9: number;
    top_pitchers: SaberPitcher[];
  };
  league: {
    woba: number;
    fip: number;
    babip: number;
    k_pct: number;
    bb_pct: number;
  };
  all_hitters?: AllHitter[];
  all_pitchers?: AllPitcher[];
  meta?: { source?: string; fetched_at?: string };
}

interface SaberHitter {
  name: string;
  wrc_plus: number;
  woba: number;
  babip: number;
  iso: number;
  pa: number;
}

interface SaberPitcher {
  name: string;
  fip: number;
  k_per_9: number;
  bb_per_9: number;
  ip: number;
}

// ─── Stat Bar ──────────────────────────────────────────────────────────────

function StatBar({ label, value, leagueAvg, format, higher }: {
  label: string;
  value: number;
  leagueAvg: number;
  format: (n: number) => string;
  higher: 'better' | 'worse';
}) {
  const diff = value - leagueAvg;
  const aboveAvg = higher === 'better' ? diff > 0 : diff < 0;
  const pct = leagueAvg > 0 ? Math.min((value / (leagueAvg * 2)) * 100, 100) : 50;
  const avgPct = 50;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-text-secondary">{label}</span>
        <span className={`font-mono font-semibold ${aboveAvg ? 'text-[var(--bsi-success)]' : 'text-text-primary'}`}>
          {format(value)}
        </span>
      </div>
      <div className="relative h-2 bg-surface-light rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: aboveAvg ? 'var(--bsi-primary)' : 'var(--bsi-dust, #C4B8A5)' }}
        />
        <div
          className="absolute inset-y-0 w-0.5 bg-text-muted"
          style={{ left: `${avgPct}%` }}
          title={`League avg: ${format(leagueAvg)}`}
        />
      </div>
      <div className="text-[10px] text-text-muted">
        League avg: {format(leagueAvg)}
      </div>
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────

interface SabermetricsPanelProps {
  teamId: string;
  espnId?: string;
  accent?: string;
}

export function SabermetricsPanel({ teamId, espnId, accent = 'var(--bsi-primary)' }: SabermetricsPanelProps) {
  const [showAllHitters, setShowAllHitters] = useState(false);
  const [showAllPitchers, setShowAllPitchers] = useState(false);

  // D1 stores ESPN numeric IDs; prefer espnId when available
  const lookupId = espnId || teamId;
  const { data, loading, error } = useSportData<TeamSabermetrics>(
    `/api/college-baseball/teams/${lookupId}/sabermetrics`,
    { timeout: 10000 },
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-surface-light rounded-sm animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card padding="lg" className="text-center">
        <p className="text-text-muted">Advanced stats unavailable — data requires minimum plate appearances and innings pitched.</p>
      </Card>
    );
  }

  const fmt1 = (n: number) => n.toFixed(1);
  const fmt2 = (n: number) => n.toFixed(2);
  const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;

  // Sort full roster arrays
  const sortedHitters = data.all_hitters
    ? [...data.all_hitters].sort((a, b) => b.wrc_plus - a.wrc_plus)
    : [];
  const sortedPitchers = data.all_pitchers
    ? [...data.all_pitchers].sort((a, b) => a.fip - b.fip)
    : [];

  const displayHitters = showAllHitters ? sortedHitters : sortedHitters.slice(0, 5);
  const displayPitchers = showAllPitchers ? sortedPitchers : sortedPitchers.slice(0, 5);

  return (
    <ScrollReveal direction="up">
      <div className="space-y-6">
        {/* Team Batting Metrics */}
        <Card variant="default" padding="lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <span>Batting Intelligence</span>
              <Badge variant="accent" size="sm">BSI Computed</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <StatBar label="wOBA" value={data.batting.woba} leagueAvg={data.league.woba} format={fmt3} higher="better" />
              <StatBar label="wRC+" value={data.batting.wrc_plus} leagueAvg={100} format={(n) => Math.round(n).toString()} higher="better" />
              <StatBar label="BABIP" value={data.batting.babip} leagueAvg={data.league.babip} format={fmt3} higher="better" />
              <StatBar label="ISO" value={data.batting.iso} leagueAvg={0.140} format={fmt3} higher="better" />
              <StatBar label="K%" value={data.batting.k_pct} leagueAvg={data.league.k_pct} format={fmtPct} higher="worse" />
              <StatBar label="BB%" value={data.batting.bb_pct} leagueAvg={data.league.bb_pct} format={fmtPct} higher="better" />
            </div>

            {/* Hitters Table — top 5 or full roster */}
            {displayHitters.length > 0 && (
              <div className="mt-6 pt-4 border-t border-border-subtle">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs uppercase tracking-wider text-text-muted">
                    {showAllHitters ? 'Full Roster' : 'Top Hitters'} by wRC+
                  </h4>
                  {sortedHitters.length > 5 && (
                    <button
                      onClick={() => setShowAllHitters(!showAllHitters)}
                      className="text-xs text-burnt-orange hover:text-ember transition-colors"
                    >
                      {showAllHitters ? `Show top 5` : `Show all ${sortedHitters.length} players`}
                    </button>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-text-muted text-xs uppercase tracking-wider">
                        <th className="text-left py-2">Player</th>
                        {showAllHitters && <th className="text-left py-2">Pos</th>}
                        <th className="text-right py-2">wRC+</th>
                        <th className="text-right py-2">wOBA</th>
                        <th className="text-right py-2">BABIP</th>
                        <th className="text-right py-2">ISO</th>
                        {showAllHitters && <th className="text-right py-2">K%</th>}
                        {showAllHitters && <th className="text-right py-2">BB%</th>}
                        <th className="text-right py-2">PA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayHitters.map((h) => {
                        const hitter = h as AllHitter & SaberHitter;
                        const name = hitter.name;
                        const wrcPlus = hitter.wrc_plus;
                        const woba = hitter.woba;
                        const babip = hitter.babip;
                        const iso = hitter.iso;
                        const pa = hitter.pa;

                        return (
                          <tr key={name} className="border-t border-border-subtle">
                            <td className="py-2 text-text-primary font-medium">{name}</td>
                            {showAllHitters && (
                              <td className="py-2 text-text-muted text-xs">{hitter.position || '—'}</td>
                            )}
                            <td className="py-2 text-right font-mono" style={{ color: wrcPlus >= 100 ? accent : undefined }}>
                              {Math.round(wrcPlus)}
                            </td>
                            <td className="py-2 text-right font-mono text-text-secondary">{fmt3(woba)}</td>
                            <td className="py-2 text-right font-mono text-text-secondary">{fmt3(babip)}</td>
                            <td className="py-2 text-right font-mono text-text-secondary">{fmt3(iso)}</td>
                            {showAllHitters && (
                              <td className="py-2 text-right font-mono text-text-secondary">
                                {hitter.kpct !== undefined ? fmtPct(hitter.kpct) : '—'}
                              </td>
                            )}
                            {showAllHitters && (
                              <td className="py-2 text-right font-mono text-text-secondary">
                                {hitter.bbpct !== undefined ? fmtPct(hitter.bbpct) : '—'}
                              </td>
                            )}
                            <td className="py-2 text-right font-mono text-text-muted">{pa}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Pitching Metrics */}
        <Card variant="default" padding="lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <span>Pitching Intelligence</span>
              <Badge variant="accent" size="sm">BSI Computed</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatBar label="FIP" value={data.pitching.fip} leagueAvg={data.league.fip} format={fmt2} higher="worse" />
              <StatBar label="K/9" value={data.pitching.k_per_9} leagueAvg={7.5} format={fmt1} higher="better" />
              <StatBar label="BB/9" value={data.pitching.bb_per_9} leagueAvg={3.5} format={fmt1} higher="worse" />
            </div>

            {/* Pitchers Table — top 5 or full roster */}
            {displayPitchers.length > 0 && (
              <div className="mt-6 pt-4 border-t border-border-subtle">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs uppercase tracking-wider text-text-muted">
                    {showAllPitchers ? 'Full Staff' : 'Top Pitchers'} by FIP
                  </h4>
                  {sortedPitchers.length > 5 && (
                    <button
                      onClick={() => setShowAllPitchers(!showAllPitchers)}
                      className="text-xs text-burnt-orange hover:text-ember transition-colors"
                    >
                      {showAllPitchers ? `Show top 5` : `Show all ${sortedPitchers.length} pitchers`}
                    </button>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-text-muted text-xs uppercase tracking-wider">
                        <th className="text-left py-2">Player</th>
                        {showAllPitchers && <th className="text-left py-2">Pos</th>}
                        <th className="text-right py-2">FIP</th>
                        <th className="text-right py-2">K/9</th>
                        <th className="text-right py-2">BB/9</th>
                        <th className="text-right py-2">IP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayPitchers.map((p) => {
                        const pitcher = p as AllPitcher & SaberPitcher;
                        const name = pitcher.name;
                        const fip = pitcher.fip;
                        const k9 = pitcher.k9 ?? pitcher.k_per_9;
                        const bb9 = pitcher.bb9 ?? pitcher.bb_per_9;
                        const ip = pitcher.ip;

                        return (
                          <tr key={name} className="border-t border-border-subtle">
                            <td className="py-2 text-text-primary font-medium">{name}</td>
                            {showAllPitchers && (
                              <td className="py-2 text-text-muted text-xs">{pitcher.position || '—'}</td>
                            )}
                            <td className="py-2 text-right font-mono" style={{ color: fip <= data.league.fip ? accent : undefined }}>
                              {fmt2(fip)}
                            </td>
                            <td className="py-2 text-right font-mono text-text-secondary">{fmt1(k9)}</td>
                            <td className="py-2 text-right font-mono text-text-secondary">{fmt1(bb9)}</td>
                            <td className="py-2 text-right font-mono text-text-muted">{fmt1(ip)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Data Source Attribution */}
        <div className="flex flex-col items-center gap-2">
          <div className="text-xs text-text-muted text-center">
            BSI Sabermetrics — computed from D1 box scores · Min. 20 PA / 15 IP
          </div>
          {data.meta?.fetched_at && (
            <DataSourceBadge
              source={data.meta.source || 'BSI'}
              timestamp={new Date(data.meta.fetched_at).toLocaleString('en-US', {
                timeZone: 'America/Chicago',
                month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
              }) + ' CT'}
            />
          )}
        </div>
      </div>
    </ScrollReveal>
  );
}
