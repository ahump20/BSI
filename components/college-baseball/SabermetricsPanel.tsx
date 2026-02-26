'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { useSportData } from '@/lib/hooks/useSportData';

// ─── Types ─────────────────────────────────────────────────────────────────

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
        <span className={`font-mono font-semibold ${aboveAvg ? 'text-green-400' : 'text-text-primary'}`}>
          {format(value)}
        </span>
      </div>
      <div className="relative h-2 bg-surface-light rounded-full overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all ${
            aboveAvg ? 'bg-green-500/60' : 'bg-surface-medium'
          }`}
          style={{ width: `${pct}%` }}
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

export function SabermetricsPanel({ teamId, espnId, accent = '#BF5700' }: SabermetricsPanelProps) {
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
          <div key={i} className="h-24 bg-surface-light rounded-lg animate-pulse" />
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

  const fmt3 = (n: number) => n.toFixed(3).replace(/^0/, '');
  const fmt1 = (n: number) => n.toFixed(1);
  const fmt2 = (n: number) => n.toFixed(2);
  const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;

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

            {/* Top Hitters by wRC+ */}
            {data.batting.top_hitters.length > 0 && (
              <div className="mt-6 pt-4 border-t border-border-subtle">
                <h4 className="text-xs uppercase tracking-wider text-text-muted mb-3">Top Hitters by wRC+</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-text-muted text-xs uppercase tracking-wider">
                        <th className="text-left py-2">Player</th>
                        <th className="text-right py-2">wRC+</th>
                        <th className="text-right py-2">wOBA</th>
                        <th className="text-right py-2">BABIP</th>
                        <th className="text-right py-2">ISO</th>
                        <th className="text-right py-2">PA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.batting.top_hitters.map((h) => (
                        <tr key={h.name} className="border-t border-border-subtle">
                          <td className="py-2 text-text-primary font-medium">{h.name}</td>
                          <td className="py-2 text-right font-mono" style={{ color: h.wrc_plus >= 100 ? accent : undefined }}>
                            {Math.round(h.wrc_plus)}
                          </td>
                          <td className="py-2 text-right font-mono text-text-secondary">{fmt3(h.woba)}</td>
                          <td className="py-2 text-right font-mono text-text-secondary">{fmt3(h.babip)}</td>
                          <td className="py-2 text-right font-mono text-text-secondary">{fmt3(h.iso)}</td>
                          <td className="py-2 text-right font-mono text-text-muted">{h.pa}</td>
                        </tr>
                      ))}
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

            {/* Top Pitchers by FIP */}
            {data.pitching.top_pitchers.length > 0 && (
              <div className="mt-6 pt-4 border-t border-border-subtle">
                <h4 className="text-xs uppercase tracking-wider text-text-muted mb-3">Top Pitchers by FIP</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-text-muted text-xs uppercase tracking-wider">
                        <th className="text-left py-2">Player</th>
                        <th className="text-right py-2">FIP</th>
                        <th className="text-right py-2">K/9</th>
                        <th className="text-right py-2">BB/9</th>
                        <th className="text-right py-2">IP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.pitching.top_pitchers.map((p) => (
                        <tr key={p.name} className="border-t border-border-subtle">
                          <td className="py-2 text-text-primary font-medium">{p.name}</td>
                          <td className="py-2 text-right font-mono" style={{ color: p.fip <= data.league.fip ? accent : undefined }}>
                            {fmt2(p.fip)}
                          </td>
                          <td className="py-2 text-right font-mono text-text-secondary">{fmt1(p.k_per_9)}</td>
                          <td className="py-2 text-right font-mono text-text-secondary">{fmt1(p.bb_per_9)}</td>
                          <td className="py-2 text-right font-mono text-text-muted">{fmt1(p.ip)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attribution */}
        <div className="text-xs text-text-muted text-center">
          BSI Sabermetrics — computed from D1 box scores · Min. 20 PA / 15 IP
        </div>
      </div>
    </ScrollReveal>
  );
}
