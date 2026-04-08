'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';

interface ConferenceData {
  conference: string;
  season: number;
  strength_index: number;
  run_environment: number;
  avg_era: number;
  avg_ops: number;
  avg_woba: number;
  inter_conf_win_pct: number;
  rpi_avg: number;
  is_power: number;
}

const COMPARE_METRICS: {
  key: keyof ConferenceData;
  label: string;
  description: string;
  higherBetter: boolean;
  format: (v: number) => string;
}[] = [
  {
    key: 'strength_index',
    label: 'Strength Index',
    description: 'Composite ranking score combining win%, run environment, and inter-conference performance',
    higherBetter: true,
    format: (v) => v.toFixed(1),
  },
  {
    key: 'inter_conf_win_pct',
    label: 'Inter-Conference Win%',
    description: 'Win percentage against teams outside the conference',
    higherBetter: true,
    format: (v) => (v * 100).toFixed(1) + '%',
  },
  {
    key: 'avg_woba',
    label: 'Avg wOBA',
    description: 'Conference-wide average weighted on-base average',
    higherBetter: true,
    format: (v) => v.toFixed(3),
  },
  {
    key: 'avg_ops',
    label: 'Avg OPS',
    description: 'Conference-wide average on-base plus slugging',
    higherBetter: true,
    format: (v) => v.toFixed(3),
  },
  {
    key: 'avg_era',
    label: 'Avg ERA',
    description: 'Conference-wide average earned run average',
    higherBetter: false,
    format: (v) => v.toFixed(2),
  },
  {
    key: 'run_environment',
    label: 'Run Environment',
    description: 'Average runs scored per game across all conference matchups',
    higherBetter: true,
    format: (v) => v.toFixed(2),
  },
];

function CompareBar({
  leftVal,
  rightVal,
  higherBetter,
  format,
}: {
  leftVal: number;
  rightVal: number;
  higherBetter: boolean;
  format: (v: number) => string;
}) {
  const total = leftVal + rightVal;
  const leftPct = total > 0 ? (leftVal / total) * 100 : 50;
  const leftWins = higherBetter ? leftVal > rightVal : leftVal < rightVal;
  const rightWins = higherBetter ? rightVal > leftVal : rightVal < leftVal;
  const tied = Math.abs(leftVal - rightVal) < 0.001;

  return (
    <div className="flex items-center gap-3 w-full">
      <span
        className="font-mono text-sm w-16 text-right tabular-nums"
        style={{
          color: tied
            ? 'var(--bsi-dust, #C4B8A5)'
            : leftWins
              ? 'var(--bsi-bone, #F5F2EB)'
              : 'var(--bsi-dust, #C4B8A5)',
          fontWeight: leftWins ? 700 : 400,
        }}
      >
        {format(leftVal)}
      </span>
      <div className="flex-1 h-2 flex overflow-hidden bg-surface-press-box">
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${leftPct}%`,
            background: leftWins ? 'var(--bsi-primary, #BF5700)' : 'var(--bsi-dust, #C4B8A5)',
            opacity: leftWins ? 1 : 0.3,
          }}
        />
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${100 - leftPct}%`,
            background: rightWins ? 'var(--heritage-columbia-blue, #4B9CD3)' : 'var(--bsi-dust, #C4B8A5)',
            opacity: rightWins ? 1 : 0.3,
          }}
        />
      </div>
      <span
        className="font-mono text-sm w-16 tabular-nums"
        style={{
          color: tied
            ? 'var(--bsi-dust, #C4B8A5)'
            : rightWins
              ? 'var(--bsi-bone, #F5F2EB)'
              : 'var(--bsi-dust, #C4B8A5)',
          fontWeight: rightWins ? 700 : 400,
        }}
      >
        {format(rightVal)}
      </span>
    </div>
  );
}

export default function ConferenceComparisonPage() {
  const [conferences, setConferences] = useState<ConferenceData[]>([]);
  const [leftConf, setLeftConf] = useState('SEC');
  const [rightConf, setRightConf] = useState('Big 12');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/savant/conference-strength');
        if (!res.ok) throw new Error(`${res.status}`);
        const json = (await res.json()) as { data?: ConferenceData[] };
        setConferences(json.data ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const confNames = useMemo(
    () => conferences.map((c) => c.conference).sort(),
    [conferences]
  );
  const leftData = useMemo(
    () => conferences.find((c) => c.conference === leftConf),
    [conferences, leftConf]
  );
  const rightData = useMemo(
    () => conferences.find((c) => c.conference === rightConf),
    [conferences, rightConf]
  );

  return (
    <div className="min-h-screen bg-surface-scoreboard">
      <Container>
        <div className="py-10 sm:py-14 max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/college-baseball/savant"
              className="font-mono text-xs uppercase tracking-widest mb-3 inline-block hover:underline"
              style={{ color: 'var(--heritage-columbia-blue, #4B9CD3)' }}
            >
              &larr; Savant Explorer
            </Link>
            <h1
              className="font-oswald uppercase text-2xl sm:text-3xl md:text-4xl font-bold tracking-wide mb-2"
              style={{ color: 'var(--bsi-bone, #F5F2EB)' }}
            >
              Conference Comparison
            </h1>
            <p
              className="font-cormorant text-base"
              style={{ color: 'var(--bsi-dust, #C4B8A5)', lineHeight: 1.7 }}
            >
              Side-by-side conference metrics. Strength index, hitting, pitching,
              inter-conference record.
            </p>
          </div>

          {/* Selectors */}
          {!loading && !error && confNames.length > 0 && (
            <div className="flex items-center gap-4 mb-8">
              <select
                value={leftConf}
                onChange={(e) => setLeftConf(e.target.value)}
                className="font-oswald uppercase text-sm tracking-wider px-3 py-2 appearance-none cursor-pointer"
                style={{
                  background: 'var(--surface-dugout, #161616)',
                  color: 'var(--bsi-bone, #F5F2EB)',
                  border: '1px solid var(--bsi-primary, #BF5700)',
                }}
                aria-label="Left conference"
              >
                {confNames.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <span
                className="font-oswald uppercase text-sm tracking-widest"
                style={{ color: 'var(--bsi-dust, #C4B8A5)' }}
              >
                vs
              </span>

              <select
                value={rightConf}
                onChange={(e) => setRightConf(e.target.value)}
                className="font-oswald uppercase text-sm tracking-wider px-3 py-2 appearance-none cursor-pointer"
                style={{
                  background: 'var(--surface-dugout, #161616)',
                  color: 'var(--bsi-bone, #F5F2EB)',
                  border: '1px solid var(--heritage-columbia-blue, #4B9CD3)',
                }}
                aria-label="Right conference"
              >
                {confNames.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 bsi-shimmer bg-surface-dugout"
                />
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              className="heritage-card p-6 text-center bg-surface-dugout"
            >
              <p className="font-cormorant" style={{ color: 'var(--bsi-dust, #C4B8A5)' }}>
                Unable to load conference data. {error}
              </p>
            </div>
          )}

          {/* Comparison */}
          {!loading && !error && leftData && rightData && (
            <div
              className="heritage-card overflow-hidden"
              style={{
                background: 'var(--surface-dugout, #161616)',
                border: '1px solid var(--border-vintage, rgba(140,98,57,0.3))',
              }}
            >
              {/* Header row */}
              <div
                className="flex items-center justify-between px-6 py-3"
                style={{ borderBottom: '1px solid var(--border-vintage, rgba(140,98,57,0.3))' }}
              >
                <span
                  className="font-oswald uppercase text-sm tracking-wider font-bold"
                  style={{ color: 'var(--bsi-primary, #BF5700)' }}
                >
                  {leftConf}
                </span>
                <span
                  className="font-mono text-[10px] uppercase tracking-widest"
                  style={{ color: 'var(--bsi-dust, #C4B8A5)' }}
                >
                  2026 Season
                </span>
                <span
                  className="font-oswald uppercase text-sm tracking-wider font-bold"
                  style={{ color: 'var(--heritage-columbia-blue, #4B9CD3)' }}
                >
                  {rightConf}
                </span>
              </div>

              {/* Metric rows */}
              {COMPARE_METRICS.map((m) => {
                const lv = leftData[m.key] as number;
                const rv = rightData[m.key] as number;
                return (
                  <div
                    key={m.key}
                    className="px-6 py-4"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="font-oswald uppercase text-xs tracking-wider"
                        style={{ color: 'var(--bsi-bone, #F5F2EB)' }}
                      >
                        {m.label}
                      </span>
                    </div>
                    <CompareBar
                      leftVal={lv}
                      rightVal={rv}
                      higherBetter={m.higherBetter}
                      format={m.format}
                    />
                    <p
                      className="font-cormorant text-xs mt-1"
                      style={{ color: 'var(--bsi-dust, #C4B8A5)', opacity: 0.7 }}
                    >
                      {m.description}
                    </p>
                  </div>
                );
              })}

              {/* Power conference badge */}
              <div className="px-6 py-3 flex items-center justify-between">
                <span
                  className="font-mono text-[10px] uppercase"
                  style={{
                    color: leftData.is_power
                      ? 'var(--bsi-primary, #BF5700)'
                      : 'var(--bsi-dust, #C4B8A5)',
                  }}
                >
                  {leftData.is_power ? 'Power Conference' : 'Mid-Major'}
                </span>
                <span
                  className="font-mono text-[10px] uppercase"
                  style={{
                    color: rightData.is_power
                      ? 'var(--heritage-columbia-blue, #4B9CD3)'
                      : 'var(--bsi-dust, #C4B8A5)',
                  }}
                >
                  {rightData.is_power ? 'Power Conference' : 'Mid-Major'}
                </span>
              </div>
            </div>
          )}

          {/* No data for selection */}
          {!loading && !error && (!leftData || !rightData) && (
            <div
              className="heritage-card p-6 text-center bg-surface-dugout"
            >
              <p className="font-cormorant" style={{ color: 'var(--bsi-dust, #C4B8A5)' }}>
                Conference data not available for the selected comparison.
              </p>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
