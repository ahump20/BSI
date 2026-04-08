'use client';

import { useState, useEffect, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Types (mirrors handler output)
// ---------------------------------------------------------------------------

type FreshnessStatus = 'fresh' | 'stale' | 'degraded' | 'missing' | 'off-season';

interface DataSource {
  name: string;
  category: string;
  sport: string;
  status: FreshnessStatus;
  fetchedAt: string | null;
  ageMinutes: number | null;
  itemCount: number | null;
  source: string;
  degraded?: boolean;
  note?: string;
}

interface D1TableCheck {
  name: string;
  table: string;
  rows: number;
  lastComputed: string | null;
  ageHours: number | null;
  status: FreshnessStatus;
}

interface FreshnessReport {
  timestamp: string;
  summary: { fresh: number; stale: number; degraded: number; missing: number; total: number };
  liveEndpoints: DataSource[];
  d1Tables: D1TableCheck[];
}

// ---------------------------------------------------------------------------
// Status visual mapping
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<FreshnessStatus, { label: string; color: string; bg: string }> = {
  fresh:      { label: 'FRESH',     color: 'var(--bsi-teal, #00B2A9)',    bg: 'rgba(0,178,169,0.12)' },
  stale:      { label: 'STALE',     color: 'var(--heritage-oiler-red, #C41E3A)', bg: 'rgba(196,30,58,0.12)' },
  degraded:   { label: 'DEGRADED',  color: '#F59E0B',                     bg: 'rgba(245,158,11,0.12)' },
  missing:    { label: 'MISSING',   color: 'var(--bsi-dust)',             bg: 'rgba(196,184,165,0.08)' },
  'off-season': { label: 'OFF-SEASON', color: 'var(--bsi-dust)',          bg: 'rgba(196,184,165,0.08)' },
};

function StatusPill({ status }: { status: FreshnessStatus }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.missing;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] rounded-sm"
      style={{ color: cfg.color, background: cfg.bg, fontFamily: 'var(--bsi-font-data)' }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: cfg.color }}
      />
      {cfg.label}
    </span>
  );
}

function formatAge(minutes: number | null): string {
  if (minutes == null) return '—';
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function formatD1Age(hours: number | null): string {
  if (hours == null) return '—';
  if (hours < 1) return '<1h ago';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

// ---------------------------------------------------------------------------
// Summary Bar
// ---------------------------------------------------------------------------

function SummaryBar({ summary }: { summary: FreshnessReport['summary'] }) {
  const pct = summary.total > 0 ? Math.round((summary.fresh / summary.total) * 100) : 0;
  return (
    <div className="heritage-card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="heritage-stamp">System Health</span>
          <p
            className="mt-2 text-3xl font-bold"
            style={{ fontFamily: 'var(--bsi-font-display-hero)', color: pct >= 80 ? 'var(--bsi-teal, #00B2A9)' : pct >= 50 ? '#F59E0B' : 'var(--heritage-oiler-red)' }}
          >
            {pct}%
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--bsi-dust)', fontFamily: 'var(--bsi-font-data)' }}>
            {summary.fresh} of {summary.total} sources fresh
          </p>
        </div>
        <div className="flex gap-3">
          {(['fresh', 'degraded', 'stale', 'missing'] as const).map((s) => (
            <div key={s} className="text-center">
              <p className="text-lg font-bold" style={{ color: STATUS_CONFIG[s].color, fontFamily: 'var(--bsi-font-display)' }}>
                {summary[s]}
              </p>
              <p className="text-[9px] uppercase tracking-[0.15em]" style={{ color: 'var(--bsi-dust)', fontFamily: 'var(--bsi-font-data)' }}>
                {s}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Health bar */}
      <div className="h-2 rounded-full overflow-hidden flex" style={{ background: 'rgba(255,255,255,0.05)' }}>
        {summary.fresh > 0 && (
          <div style={{ width: `${(summary.fresh / summary.total) * 100}%`, background: STATUS_CONFIG.fresh.color }} />
        )}
        {summary.degraded > 0 && (
          <div style={{ width: `${(summary.degraded / summary.total) * 100}%`, background: STATUS_CONFIG.degraded.color }} />
        )}
        {summary.stale > 0 && (
          <div style={{ width: `${(summary.stale / summary.total) * 100}%`, background: STATUS_CONFIG.stale.color }} />
        )}
        {summary.missing > 0 && (
          <div style={{ width: `${(summary.missing / summary.total) * 100}%`, background: STATUS_CONFIG.missing.color }} />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Live Endpoint Table
// ---------------------------------------------------------------------------

function LiveEndpointTable({ endpoints }: { endpoints: DataSource[] }) {
  return (
    <div className="heritage-card overflow-hidden">
      <div className="px-5 py-3 bg-surface-press-box">
        <span className="heritage-stamp">Live Data Pipelines</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-vintage)' }}>
              {['Source', 'Sport', 'Status', 'Age', 'Items', 'Provider'].map((h) => (
                <th
                  key={h}
                  className="px-4 py-2.5 text-left text-[10px] uppercase tracking-[0.15em] font-semibold"
                  style={{ color: 'var(--bsi-dust)', fontFamily: 'var(--bsi-font-data)' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {endpoints.map((ep) => (
              <tr
                key={ep.name}
                className="transition-colors hover:bg-[rgba(255,255,255,0.02)]"
                style={{ borderBottom: '1px solid rgba(140,98,57,0.12)' }}
              >
                <td className="px-4 py-2.5 font-semibold text-bsi-bone">
                  {ep.name}
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className="text-[10px] uppercase tracking-[0.12em] font-semibold"
                    style={{ color: 'var(--heritage-columbia-blue)', fontFamily: 'var(--bsi-font-data)' }}
                  >
                    {ep.sport}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <StatusPill status={ep.status} />
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-bsi-dust">
                  {formatAge(ep.ageMinutes)}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-bsi-bone">
                  {ep.itemCount ?? '—'}
                </td>
                <td className="px-4 py-2.5 text-xs text-bsi-dust">
                  {ep.source}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// D1 Table
// ---------------------------------------------------------------------------

function D1TableSection({ tables }: { tables: D1TableCheck[] }) {
  return (
    <div className="heritage-card overflow-hidden">
      <div className="px-5 py-3 bg-surface-press-box">
        <span className="heritage-stamp">Sabermetrics (Long-Term Memory)</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-vintage)' }}>
              {['Table', 'Status', 'Rows', 'Last Computed', 'Age'].map((h) => (
                <th
                  key={h}
                  className="px-4 py-2.5 text-left text-[10px] uppercase tracking-[0.15em] font-semibold"
                  style={{ color: 'var(--bsi-dust)', fontFamily: 'var(--bsi-font-data)' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tables.map((t) => (
              <tr
                key={t.table}
                className="transition-colors hover:bg-[rgba(255,255,255,0.02)]"
                style={{ borderBottom: '1px solid rgba(140,98,57,0.12)' }}
              >
                <td className="px-4 py-2.5 font-semibold text-bsi-bone">
                  {t.name}
                </td>
                <td className="px-4 py-2.5">
                  <StatusPill status={t.status} />
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-bsi-bone">
                  {t.rows.toLocaleString()}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-bsi-dust">
                  {t.lastComputed || '—'}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-bsi-dust">
                  {formatD1Age(t.ageHours)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function getAdminKey(): string | null {
  // Check URL param first, then localStorage
  if (typeof window === 'undefined') return null;
  const url = new URL(window.location.href);
  const urlKey = url.searchParams.get('key');
  if (urlKey) {
    localStorage.setItem('bsi_admin_key', urlKey);
    // Clean the key from URL for safety
    url.searchParams.delete('key');
    window.history.replaceState({}, '', url.toString());
    return urlKey;
  }
  return localStorage.getItem('bsi_admin_key');
}

export default function FreshnessClient() {
  const [report, setReport] = useState<FreshnessReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<string>('');
  const [needsAuth, setNeedsAuth] = useState(false);
  const [keyInput, setKeyInput] = useState('');

  const fetchReport = useCallback(async () => {
    const adminKey = getAdminKey();
    if (!adminKey) {
      setNeedsAuth(true);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/freshness', {
        headers: { 'X-Admin-Key': adminKey },
      });
      if (res.status === 401) {
        localStorage.removeItem('bsi_admin_key');
        setNeedsAuth(true);
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json() as FreshnessReport;
      setReport(data);
      setError(null);
      setNeedsAuth(false);
      setLastRefresh(new Date().toLocaleTimeString('en-US', { timeZone: 'America/Chicago' }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) return;
    localStorage.setItem('bsi_admin_key', keyInput.trim());
    setNeedsAuth(false);
    setLoading(true);
    setKeyInput('');
    fetchReport();
  };

  useEffect(() => {
    fetchReport();
    const interval = setInterval(fetchReport, 60_000); // auto-refresh every 60s
    return () => clearInterval(interval);
  }, [fetchReport]);

  return (
    <>
      <div className="min-h-screen bg-surface-scoreboard">
        {/* Header */}
        <header className="px-4 sm:px-6 lg:px-8 pt-6 pb-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div>
              <span className="heritage-stamp">Admin</span>
              <h1
                className="mt-2 font-display text-3xl sm:text-4xl font-bold uppercase tracking-wider text-bsi-bone"
              >
                Data Freshness
              </h1>
              <p className="mt-1 text-xs" style={{ color: 'var(--bsi-dust)', fontFamily: 'var(--bsi-font-data)' }}>
                Self-watching infrastructure — auto-refreshes every 60s
              </p>
            </div>
            <div className="text-right">
              <button
                onClick={fetchReport}
                disabled={loading}
                className="btn-heritage text-xs disabled:opacity-50"
              >
                {loading ? 'Checking\u2026' : 'Refresh'}
              </button>
              {lastRefresh && (
                <p className="mt-1 text-[10px]" style={{ color: 'var(--bsi-dust)', fontFamily: 'var(--bsi-font-data)' }}>
                  Last check: {lastRefresh} CT
                </p>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="px-4 sm:px-6 lg:px-8 pb-16">
          <div className="max-w-5xl mx-auto space-y-6">
            {needsAuth && (
              <div className="heritage-card p-6">
                <span className="heritage-stamp">Authentication Required</span>
                <p className="mt-3 text-sm text-bsi-dust">
                  Enter admin key or add <code style={{ color: 'var(--heritage-columbia-blue)' }}>?key=</code> to the URL.
                </p>
                <form onSubmit={handleKeySubmit} className="mt-4 flex gap-3">
                  <input
                    type="password"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="Admin key"
                    className="flex-1 px-3 py-2 rounded text-sm"
                    style={{
                      background: 'var(--surface-press-box)',
                      border: '1px solid var(--border-vintage)',
                      color: 'var(--bsi-bone)',
                      fontFamily: 'var(--bsi-font-data)',
                    }}
                  />
                  <button type="submit" className="btn-heritage-fill text-xs">
                    Authenticate
                  </button>
                </form>
              </div>
            )}

            {error && (
              <div className="heritage-card p-4" style={{ borderLeft: '3px solid var(--heritage-oiler-red)' }}>
                <p className="text-sm" style={{ color: 'var(--heritage-oiler-red)' }}>
                  Failed to load freshness data: {error}
                </p>
              </div>
            )}

            {loading && !report && !needsAuth && (
              <div className="heritage-card p-8 text-center">
                <div className="w-6 h-6 mx-auto border-2 border-burnt-orange/30 border-t-burnt-orange rounded-full animate-spin" />
                <p className="mt-3 text-sm text-bsi-dust">
                  Checking all data sources\u2026
                </p>
              </div>
            )}

            {report && (
              <>
                <SummaryBar summary={report.summary} />
                <LiveEndpointTable endpoints={report.liveEndpoints} />
                <D1TableSection tables={report.d1Tables} />
              </>
            )}
          </div>
        </main>

      </div>
    </>
  );
}
