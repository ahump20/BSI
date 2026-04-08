'use client';

import { useState, useCallback } from 'react';
import { ScrollReveal } from '@/components/cinematic';
import { formatTimestamp } from '@/lib/utils/timezone';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ScoutingGrades {
  overall: number;
  hit: number | null;
  power: number | null;
  speed: number | null;
  discipline: number | null;
  stuff: number | null;
  command: number | null;
  durability: number | null;
}

interface ScoutingReportData {
  playerId: string;
  playerName: string;
  team: string;
  position: string;
  generatedAt: string;
  summary: string;
  grades: ScoutingGrades;
  strengths: string[];
  weaknesses: string[];
  projection: string;
  comparables: string[];
  keyStats: Record<string, string | number>;
  fullNarrative: string;
}

interface ScoutingReportResponse {
  report?: ScoutingReportData;
  preview?: boolean;
  message?: string;
  teaser?: {
    sections: string[];
    cta: string;
  };
  meta?: {
    source: string;
    fetched_at: string;
    timezone: string;
    model?: string;
    cached?: boolean;
  };
  error?: string;
}

interface ScoutingReportProps {
  playerId: string;
  className?: string;
}

// ---------------------------------------------------------------------------
// Grade rendering
// ---------------------------------------------------------------------------

function gradeColor(grade: number): string {
  if (grade >= 70) return '#c0392b'; // Elite — red
  if (grade >= 60) return '#e67e22'; // Plus — orange
  if (grade >= 50) return '#aaaaaa'; // Average — neutral
  if (grade >= 40) return '#5b9bd5'; // Below avg — blue
  return '#1a5276'; // Well below — deep blue
}

function gradeLabel(grade: number): string {
  if (grade >= 70) return 'Plus-Plus';
  if (grade >= 60) return 'Plus';
  if (grade >= 55) return 'Above Avg';
  if (grade >= 45) return 'Average';
  if (grade >= 40) return 'Below Avg';
  return 'Well Below';
}

function GradeBar({ label, grade }: { label: string; grade: number }) {
  const pct = ((grade - 20) / 60) * 100; // 20-80 scale → 0-100%
  const color = gradeColor(grade);

  return (
    <div className="flex items-center gap-3">
      <span
        className="text-[10px] uppercase tracking-wider w-20 shrink-0 font-display text-bsi-dust"
      >
        {label}
      </span>
      <div
        className="flex-1 h-1.5 rounded-sm overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      >
        <div
          className="h-full rounded-sm transition-all duration-700"
          style={{ width: `${Math.max(pct, 3)}%`, backgroundColor: color }}
        />
      </div>
      <span
        className="text-xs w-8 text-right font-semibold font-mono"
        style={{ color }}
      >
        {grade}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-sections
// ---------------------------------------------------------------------------

function GradesSection({ grades, isHitter }: { grades: ScoutingGrades; isHitter: boolean }) {
  const items: { label: string; grade: number }[] = [];

  if (isHitter) {
    if (grades.hit != null) items.push({ label: 'Hit', grade: grades.hit });
    if (grades.power != null) items.push({ label: 'Power', grade: grades.power });
    if (grades.speed != null) items.push({ label: 'Speed', grade: grades.speed });
    if (grades.discipline != null) items.push({ label: 'Discipline', grade: grades.discipline });
  } else {
    if (grades.stuff != null) items.push({ label: 'Stuff', grade: grades.stuff });
    if (grades.command != null) items.push({ label: 'Command', grade: grades.command });
    if (grades.durability != null) items.push({ label: 'Durability', grade: grades.durability });
  }

  return (
    <div>
      {/* Overall grade — prominent */}
      <div className="flex items-center gap-3 mb-4">
        <span
          className="text-[10px] uppercase tracking-wider font-display text-bsi-dust"
        >
          Overall
        </span>
        <span
          className="text-2xl font-bold font-mono"
          style={{ color: gradeColor(grades.overall) }}
        >
          {grades.overall}
        </span>
        <span
          className="text-xs uppercase tracking-wider"
          style={{ color: gradeColor(grades.overall) }}
        >
          {gradeLabel(grades.overall)}
        </span>
      </div>

      {/* Individual tool grades */}
      <div className="space-y-2">
        {items.map((item) => (
          <GradeBar key={item.label} label={item.label} grade={item.grade} />
        ))}
      </div>
    </div>
  );
}

function KeyStatsGrid({ stats }: { stats: Record<string, string | number> }) {
  const entries = Object.entries(stats);
  if (entries.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {entries.map(([label, value]) => (
        <div
          key={label}
          className="text-center p-2 rounded-sm"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        >
          <p
            className="text-[10px] uppercase tracking-wider mb-1 font-display text-bsi-dust"
          >
            {label}
          </p>
          <p
            className="text-sm font-semibold font-mono text-bsi-bone"
          >
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Preview teaser for free-tier users
// ---------------------------------------------------------------------------

function ReportTeaser({ teaser }: { teaser: { sections: string[]; cta: string } }) {
  return (
    <div className="heritage-card">
      <div
        className="px-5 py-3 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--border-vintage)' }}
      >
        <h3
          className="text-sm uppercase tracking-wider font-bold font-display text-bsi-bone"
        >
          AI Scouting Report
        </h3>
        <span className="heritage-stamp">Pro</span>
      </div>
      <div className="p-5">
        <p className="text-sm mb-4 text-bsi-dust">
          Unlock narrative scouting reports powered by AI analysis of player statistics,
          advanced metrics, and game log trends.
        </p>
        <div className="space-y-2 mb-4">
          {teaser.sections.map((section) => (
            <div key={section} className="flex items-center gap-2">
              <span
                className="w-1.5 h-1.5 rounded-sm"
                style={{ background: 'var(--bsi-primary)' }}
              />
              <span className="text-xs text-bsi-dust">
                {section}
              </span>
            </div>
          ))}
        </div>
        <a
          href="/pricing"
          className="btn-heritage-fill text-xs inline-block"
        >
          {teaser.cta}
        </a>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ScoutingReport({ playerId, className = '' }: ScoutingReportProps) {
  const [data, setData] = useState<ScoutingReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/college-baseball/players/${playerId}/scouting-report`, {
        signal: AbortSignal.timeout(30000), // LLM generation can take time
      });
      const json = (await res.json()) as ScoutingReportResponse;

      if (!res.ok) {
        setError(json.error ?? 'Failed to generate scouting report');
        return;
      }

      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  // Not yet requested — show the trigger button
  if (!data && !loading && !error) {
    return (
      <ScrollReveal direction="up">
        <div className={`heritage-card ${className}`}>
          <div
            className="px-5 py-3 flex items-center justify-between"
            style={{ borderBottom: '1px solid var(--border-vintage)' }}
          >
            <h3
              className="text-sm uppercase tracking-wider font-bold font-display text-bsi-bone"
            >
              AI Scouting Report
            </h3>
            <span className="heritage-stamp">BSI Intelligence</span>
          </div>
          <div className="p-5 text-center">
            <p className="text-sm mb-4 text-bsi-dust">
              Generate a narrative scouting report with scout grades, strengths,
              weaknesses, projection, and comparables — powered by AI analysis of this
              player&apos;s full statistical profile.
            </p>
            <button
              onClick={fetchReport}
              className="btn-heritage-fill text-sm"
            >
              Generate Scouting Report
            </button>
          </div>
        </div>
      </ScrollReveal>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className={`heritage-card ${className}`}>
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{ borderBottom: '1px solid var(--border-vintage)' }}
        >
          <h3
            className="text-sm uppercase tracking-wider font-bold font-display text-bsi-bone"
          >
            AI Scouting Report
          </h3>
          <span className="heritage-stamp">Generating</span>
        </div>
        <div className="p-5 flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--bsi-primary)', borderTopColor: 'transparent' }} />
            <p className="text-xs text-bsi-dust">
              Analyzing stats, sabermetrics, and game log trends...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`heritage-card ${className}`}>
        <div
          className="px-5 py-3"
          style={{ borderBottom: '1px solid var(--border-vintage)' }}
        >
          <h3
            className="text-sm uppercase tracking-wider font-bold font-display text-bsi-bone"
          >
            AI Scouting Report
          </h3>
        </div>
        <div className="p-5 text-center">
          <p className="text-sm mb-3 text-bsi-dust">{error}</p>
          <button onClick={fetchReport} className="btn-heritage text-xs">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Preview teaser for free-tier
  if (data?.preview && data.teaser) {
    return (
      <ScrollReveal direction="up">
        <div className={className}>
          <ReportTeaser teaser={data.teaser} />
        </div>
      </ScrollReveal>
    );
  }

  // Full report
  const report = data?.report;
  if (!report) return null;

  const isHitter = report.grades.hit != null;
  const narrativeParagraphs = report.fullNarrative.split('\n').filter((p) => p.trim());

  return (
    <ScrollReveal direction="up">
      <div className={`heritage-card ${className}`}>
        {/* Header */}
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{ borderBottom: '1px solid var(--border-vintage)' }}
        >
          <div>
            <h3
              className="text-sm uppercase tracking-wider font-bold font-display text-bsi-bone"
            >
              AI Scouting Report
            </h3>
            <p className="text-[11px] mt-0.5 text-bsi-dust">
              {report.playerName} &middot; {report.team} &middot; {report.position}
            </p>
          </div>
          <span className="heritage-stamp">BSI Intelligence</span>
        </div>

        {/* Summary */}
        <div className="px-5 py-4 border-b border-border-vintage">
          <p
            className="text-sm leading-relaxed"
            style={{ fontFamily: 'var(--bsi-font-body)', color: 'var(--bsi-bone)' }}
          >
            {report.summary}
          </p>
        </div>

        {/* Two-column: Grades + Key Stats */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-0"
          style={{ borderBottom: '1px solid var(--border-vintage)' }}
        >
          {/* Grades */}
          <div className="p-5" style={{ borderRight: '1px solid var(--border-vintage)' }}>
            <p
              className="text-[10px] uppercase tracking-wider mb-3 font-display text-bsi-primary"
            >
              Scout Grades (20-80 Scale)
            </p>
            <GradesSection grades={report.grades} isHitter={isHitter} />
          </div>

          {/* Key Stats */}
          <div className="p-5">
            <p
              className="text-[10px] uppercase tracking-wider mb-3 font-display text-bsi-primary"
            >
              Key Numbers
            </p>
            <KeyStatsGrid stats={report.keyStats} />
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-0"
          style={{ borderBottom: '1px solid var(--border-vintage)' }}
        >
          <div className="p-5" style={{ borderRight: '1px solid var(--border-vintage)' }}>
            <p
              className="text-[10px] uppercase tracking-wider mb-2 font-display text-bsi-primary"
            >
              Strengths
            </p>
            <ul className="space-y-1.5">
              {report.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-sm mt-1.5 shrink-0" style={{ background: '#27ae60' }} />
                  <span className="text-xs leading-relaxed text-bsi-bone">{s}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="p-5">
            <p
              className="text-[10px] uppercase tracking-wider mb-2 font-display text-bsi-primary"
            >
              Weaknesses
            </p>
            <ul className="space-y-1.5">
              {report.weaknesses.map((w, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-sm mt-1.5 shrink-0" style={{ background: '#c0392b' }} />
                  <span className="text-xs leading-relaxed text-bsi-bone">{w}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Projection */}
        <div className="px-5 py-4 border-b border-border-vintage">
          <p
            className="text-[10px] uppercase tracking-wider mb-2 font-display text-bsi-primary"
          >
            Projection
          </p>
          <p
            className="text-sm leading-relaxed"
            style={{ fontFamily: 'var(--bsi-font-body)', color: 'var(--bsi-bone)' }}
          >
            {report.projection}
          </p>
        </div>

        {/* Comparables */}
        {report.comparables.length > 0 && (
          <div className="px-5 py-4 border-b border-border-vintage">
            <p
              className="text-[10px] uppercase tracking-wider mb-2 font-display text-bsi-primary"
            >
              Comparables
            </p>
            <ul className="space-y-1.5">
              {report.comparables.map((comp, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-sm mt-1.5 shrink-0" style={{ background: 'var(--heritage-columbia-blue)' }} />
                  <span className="text-xs leading-relaxed text-bsi-bone">{comp}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Full Narrative — collapsible */}
        <div className="px-5 py-4 border-b border-border-vintage">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 mb-2 group"
          >
            <p
              className="text-[10px] uppercase tracking-wider font-display text-bsi-primary"
            >
              Full Narrative Report
            </p>
            <span
              className="text-xs transition-transform duration-200"
              style={{
                color: 'var(--bsi-dust)',
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            >
              ▾
            </span>
          </button>

          {expanded && (
            <div className="space-y-3 mt-3">
              {narrativeParagraphs.map((paragraph, i) => (
                <p
                  key={i}
                  className="text-sm leading-relaxed"
                  style={{ fontFamily: 'var(--bsi-font-body)', color: 'var(--bsi-bone)' }}
                >
                  {paragraph}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Trust footer */}
        <div
          className="px-5 py-3 flex items-center justify-between bg-surface-press-box"
        >
          <span className="text-[10px] text-bsi-dust">
            {data?.meta?.source ?? 'BSI'} &middot; {data?.meta?.model ?? 'AI'}
            {data?.meta?.cached ? ' · Cached' : ''}
          </span>
          <span className="text-[10px] text-bsi-dust">
            {data?.meta?.fetched_at ? formatTimestamp(data.meta.fetched_at) : ''}
          </span>
        </div>
      </div>
    </ScrollReveal>
  );
}
