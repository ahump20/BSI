'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSportData } from '@/lib/hooks/useSportData';
import { teamMetadata } from '@/lib/data/team-metadata';
import { normalizeTeamName } from '@/lib/utils/format';

/* ── Types ──────────────────────────────────────────────────────────── */

interface ConferencePowerStripProps {
  conferenceId: string;
  conferenceName: string;
  maxTeams?: number;
  className?: string;
}

type PowerTier = 'top' | 'mid' | 'field';

interface TeamBlock {
  id: string;
  name: string;
  shortName: string;
  abbreviation: string;
  wins: number;
  losses: number;
  winPct: number;
  compositeScore: number;
  conferenceRank: number;
  tier: PowerTier;
}

/** Response shape from /api/college-baseball/standings */
interface StandingsResponse {
  success: boolean;
  data: StandingsEntry[];
  meta?: {
    source?: string;
    fetched_at?: string;
    timezone?: string;
  };
}

/**
 * Standings entry — supports both the ESPN-transformed shape
 * (team.id, team.name, overallRecord) and the Highlightly shape
 * (team_name, overall_wins, overall_losses).
 */
interface StandingsEntry {
  rank?: number;
  team?: {
    id?: string;
    name?: string;
    shortName?: string;
  };
  team_name?: string;
  overallRecord?: { wins: number; losses: number };
  overall_wins?: number;
  overall_losses?: number;
  winPct?: number;
  conferenceRecord?: { wins: number; losses: number; pct?: number };
  conference_wins?: number;
  conference_losses?: number;
  [key: string]: unknown;
}

/* ── Helpers ─────────────────────────────────────────────────────────── */

const MIN_BLOCK_WIDTH_PX = 40;

function findTeamMeta(name: string): { slug: string; abbreviation: string } | null {
  const n = normalizeTeamName(name);
  for (const [slug, meta] of Object.entries(teamMetadata)) {
    if (
      normalizeTeamName(meta.name) === n ||
      normalizeTeamName(meta.shortName) === n ||
      normalizeTeamName(meta.abbreviation) === n
    ) {
      return { slug, abbreviation: meta.abbreviation };
    }
  }
  // Partial match fallback
  for (const [slug, meta] of Object.entries(teamMetadata)) {
    if (normalizeTeamName(meta.name).includes(n) || n.includes(normalizeTeamName(meta.shortName))) {
      return { slug, abbreviation: meta.abbreviation };
    }
  }
  return null;
}

function assignTier(rank: number, total: number): PowerTier {
  const topCutoff = Math.max(1, Math.ceil(total * 0.25));
  const midCutoff = Math.max(2, Math.ceil(total * 0.5));
  if (rank <= topCutoff) return 'top';
  if (rank <= midCutoff) return 'mid';
  return 'field';
}

function formatWinPct(pct: number): string {
  return pct >= 1 ? pct.toFixed(0) : `.${(pct * 1000).toFixed(0).padStart(3, '0')}`;
}

function formatRelativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/* ── Tier color mapping ──────────────────────────────────────────────── */

const TIER_STYLES: Record<PowerTier, { bg: string; label: string }> = {
  top: {
    bg: 'var(--bsi-primary)',
    label: 'Top Tier',
  },
  mid: {
    bg: 'rgba(140, 98, 57, 0.6)',
    label: 'Mid Tier',
  },
  field: {
    bg: 'rgba(255, 255, 255, 0.08)',
    label: 'Field',
  },
};

/* ── Component ───────────────────────────────────────────────────────── */

export function ConferencePowerStrip({
  conferenceId,
  conferenceName,
  maxTeams,
  className = '',
}: ConferencePowerStripProps): React.ReactNode {
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    prefersReducedMotion.current =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const handleBlockEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    el.style.borderTopColor = 'var(--bsi-primary)';
    if (!prefersReducedMotion.current) {
      el.style.transform = 'scaleY(1.03)';
    }
  }, []);

  const handleBlockLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const isExpanded = el.getAttribute('aria-expanded') === 'true';
    el.style.borderTopColor = isExpanded ? 'var(--bsi-primary)' : 'transparent';
    el.style.transform = '';
  }, []);

  const { data, loading, error, lastUpdated } = useSportData<StandingsResponse>(
    `/api/college-baseball/standings?conference=${encodeURIComponent(conferenceId)}`
  );

  const teams = useMemo((): TeamBlock[] => {
    if (!data?.success || !Array.isArray(data.data)) return [];

    const parsed: TeamBlock[] = data.data
      .map((entry) => {
        // Normalize both data shapes
        const teamName = entry.team?.name || entry.team_name || '';
        const shortName = entry.team?.shortName || '';
        const teamId = entry.team?.id || '';
        const wins =
          entry.overallRecord?.wins ?? entry.overall_wins ?? 0;
        const losses =
          entry.overallRecord?.losses ?? entry.overall_losses ?? 0;
        const total = wins + losses;
        const winPct =
          entry.winPct ?? (total > 0 ? wins / total : 0);

        // Resolve slug + abbreviation from metadata
        const meta = findTeamMeta(teamName) || findTeamMeta(shortName);
        const slug = meta?.slug || teamId || normalizeTeamName(teamName);
        const abbr = meta?.abbreviation || shortName.slice(0, 4).toUpperCase() || teamName.slice(0, 4).toUpperCase();

        const compositeScore = winPct * 100;

        return {
          id: slug,
          name: teamName,
          shortName: shortName || teamName,
          abbreviation: abbr,
          wins,
          losses,
          winPct,
          compositeScore,
          conferenceRank: 0,
          tier: 'field' as PowerTier,
        };
      })
      .filter((t) => t.name.length > 0)
      .sort((a, b) => b.compositeScore - a.compositeScore);

    // Assign ranks and tiers
    const total = parsed.length;
    parsed.forEach((team, i) => {
      team.conferenceRank = i + 1;
      team.tier = assignTier(i + 1, total);
    });

    return maxTeams ? parsed.slice(0, maxTeams) : parsed;
  }, [data, maxTeams]);

  const maxScore = useMemo(
    () => Math.max(...teams.map((t) => t.compositeScore), 1),
    [teams]
  );

  const source = data?.meta?.source || 'ESPN';
  const fetchedAt = data?.meta?.fetched_at || '';

  const handleToggle = useCallback((teamId: string) => {
    setExpandedTeamId((prev) => (prev === teamId ? null : teamId));
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, teamId: string) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleToggle(teamId);
      }
    },
    [handleToggle]
  );

  /* ── Loading state ─────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="heritage-stamp mb-4">Conference Power</div>
        <div
          className="rounded-sm p-4 bg-surface-scoreboard"
        >
          {/* Desktop skeleton */}
          <div className="hidden md:flex gap-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="skeleton h-12"
                style={{ flex: `${8 - i} 1 0%`, minWidth: MIN_BLOCK_WIDTH_PX }}
              />
            ))}
          </div>
          {/* Mobile skeleton */}
          <div className="md:hidden space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-10 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── Error state ───────────────────────────────────────────────── */
  if (error || teams.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="heritage-stamp mb-4">Conference Power</div>
        <div
          className="rounded-sm p-6 text-center"
          style={{
            background: 'var(--surface-scoreboard)',
            border: '1px solid var(--border-vintage)',
            color: 'var(--bsi-dust)',
          }}
        >
          <p style={{ fontFamily: 'var(--bsi-font-body)' }}>
            {error
              ? 'Unable to load standings data. Try again shortly.'
              : `No standings data available for the ${conferenceName}.`}
          </p>
        </div>
      </div>
    );
  }

  /* ── Rendered strip ────────────────────────────────────────────── */
  return (
    <div className={`${className}`}>
      {/* Section heading */}
      <div className="flex items-center justify-between mb-4">
        <div className="heritage-stamp">{conferenceName} Power</div>
        <div className="flex items-center gap-3">
          {TIER_LABELS.map(({ tier, label }) => (
            <div key={tier} className="flex items-center gap-1.5">
              <span
                className="inline-block w-2.5 h-2.5 rounded-sm"
                style={{ background: TIER_STYLES[tier].bg }}
              />
              <span
                className="text-[10px] uppercase tracking-wider"
                style={{
                  fontFamily: 'var(--bsi-font-display)',
                  color: 'var(--bsi-dust)',
                }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        className="rounded-sm overflow-hidden"
        style={{
          background: 'var(--surface-scoreboard)',
          border: '1px solid var(--border-vintage)',
        }}
      >
        {/* ── Desktop: horizontal proportional strip ────────────── */}
        <div className="hidden md:block">
          <div className="flex" role="list" aria-label={`${conferenceName} power rankings`}>
            {teams.map((team) => {
              const isExpanded = expandedTeamId === team.id;
              return (
                <div
                  key={team.id}
                  role="listitem"
                  style={{
                    flexBasis: `${(team.compositeScore / maxScore) * 100}%`,
                    flexGrow: 0,
                    flexShrink: 0,
                    minWidth: MIN_BLOCK_WIDTH_PX,
                  }}
                >
                  <div
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                    aria-controls={`detail-${team.id}`}
                    className="cursor-pointer select-none"
                    style={{
                      background: TIER_STYLES[team.tier].bg,
                      borderTop: isExpanded
                        ? '2px solid var(--bsi-primary)'
                        : '2px solid transparent',
                      padding: '10px 4px',
                      textAlign: 'center',
                      transition: 'border-color 200ms ease, transform 200ms ease',
                    }}
                    onClick={() => handleToggle(team.id)}
                    onKeyDown={(e) => handleKeyDown(e, team.id)}
                    onMouseEnter={handleBlockEnter}
                    onMouseLeave={handleBlockLeave}
                  >
                    <span
                      className="block text-xs font-bold uppercase tracking-wide truncate"
                      style={{
                        fontFamily: 'var(--bsi-font-display)',
                        color: 'var(--bsi-bone)',
                      }}
                    >
                      {team.abbreviation}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop expanded detail panel */}
          {expandedTeamId && (
            <DesktopDetailPanel
              team={teams.find((t) => t.id === expandedTeamId)!}
            />
          )}
        </div>

        {/* ── Mobile: vertical ranked list ──────────────────────── */}
        <div className="md:hidden" role="list" aria-label={`${conferenceName} power rankings`}>
          {teams.map((team) => {
            const isExpanded = expandedTeamId === team.id;
            return (
              <div key={team.id} role="listitem">
                <div
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                  aria-controls={`detail-mobile-${team.id}`}
                  className="flex items-center gap-3 px-3 py-2.5 cursor-pointer select-none"
                  style={{
                    borderBottom: '1px solid var(--border-vintage)',
                    borderLeft: isExpanded
                      ? '2px solid var(--bsi-primary)'
                      : '2px solid transparent',
                    transition: 'border-color 200ms ease',
                  }}
                  onClick={() => handleToggle(team.id)}
                  onKeyDown={(e) => handleKeyDown(e, team.id)}
                >
                  {/* Rank */}
                  <span
                    className="text-xs font-bold w-5 text-right shrink-0"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--bsi-dust)',
                    }}
                  >
                    {team.conferenceRank}
                  </span>

                  {/* Name + bar */}
                  <div className="flex-1 min-w-0">
                    <span
                      className="block text-xs font-bold uppercase tracking-wide truncate"
                      style={{
                        fontFamily: 'var(--bsi-font-display)',
                        color: 'var(--bsi-bone)',
                      }}
                    >
                      {team.abbreviation}
                      <span
                        className="ml-2 font-normal normal-case tracking-normal"
                        style={{
                          fontFamily: 'var(--bsi-font-body)',
                          color: 'var(--bsi-dust)',
                          fontSize: '11px',
                        }}
                      >
                        {team.wins}-{team.losses}
                      </span>
                    </span>

                    {/* Strength bar */}
                    <div
                      className="mt-1 h-1.5 rounded-sm"
                      style={{ background: 'rgba(255,255,255,0.05)' }}
                    >
                      <div
                        className="h-full rounded-sm"
                        style={{
                          width: `${(team.compositeScore / maxScore) * 100}%`,
                          background: TIER_STYLES[team.tier].bg,
                          transition: 'width 400ms ease-out',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Mobile expanded detail */}
                {isExpanded && (
                  <MobileDetailPanel team={team} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Trust cues: source + freshness */}
      <div
        className="flex items-center justify-between mt-3 px-1"
        style={{ color: 'var(--bsi-text-dim)' }}
      >
        <span className="heritage-stamp" style={{ fontSize: '9px', padding: '2px 6px' }}>
          Source: {source.includes('highlightly') ? 'Highlightly' : 'ESPN'}
        </span>
        {fetchedAt && (
          <span
            className="text-[10px] font-mono"
          >
            Updated {formatRelativeTime(fetchedAt)} CT
          </span>
        )}
        {!fetchedAt && lastUpdated && (
          <span
            className="text-[10px] font-mono"
          >
            Updated {formatRelativeTime(lastUpdated.toISOString())} CT
          </span>
        )}
      </div>

    </div>
  );
}

/* ── Tier legend data ────────────────────────────────────────────────── */

const TIER_LABELS: Array<{ tier: PowerTier; label: string }> = [
  { tier: 'top', label: 'Top' },
  { tier: 'mid', label: 'Mid' },
  { tier: 'field', label: 'Field' },
];

/* ── Detail panels ───────────────────────────────────────────────────── */

function DesktopDetailPanel({ team }: { team: TeamBlock }): React.ReactNode {
  const pctDisplay =
    team.winPct >= 1
      ? `${team.winPct.toFixed(0)}%`
      : formatWinPct(team.winPct);

  return (
    <div
      id={`detail-${team.id}`}
      className="px-4 py-3"
      style={{
        background: 'var(--surface-dugout)',
        borderTop: '1px solid var(--border-vintage)',
      }}
    >
      <div className="flex items-center justify-between">
        <Link
          href={`/college-baseball/teams/${team.id}`}
          className="text-sm font-bold uppercase tracking-wide hover:underline"
          style={{
            fontFamily: 'var(--bsi-font-display)',
            color: 'var(--heritage-columbia-blue)',
          }}
        >
          {team.name}
        </Link>
        <div className="flex items-center gap-6">
          <StatCell label="Record" value={`${team.wins}-${team.losses}`} />
          <StatCell label="Win %" value={pctDisplay} />
          <StatCell label="Conf. Rank" value={`#${team.conferenceRank}`} />
        </div>
      </div>
    </div>
  );
}

function MobileDetailPanel({ team }: { team: TeamBlock }): React.ReactNode {
  const pctDisplay =
    team.winPct >= 1
      ? `${team.winPct.toFixed(0)}%`
      : formatWinPct(team.winPct);

  return (
    <div
      id={`detail-mobile-${team.id}`}
      className="px-4 py-3"
      style={{
        background: 'var(--surface-dugout)',
        borderBottom: '1px solid var(--border-vintage)',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <Link
          href={`/college-baseball/teams/${team.id}`}
          className="text-sm font-bold uppercase tracking-wide hover:underline"
          style={{
            fontFamily: 'var(--bsi-font-display)',
            color: 'var(--heritage-columbia-blue)',
          }}
        >
          {team.name}
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <StatCell label="Record" value={`${team.wins}-${team.losses}`} />
        <StatCell label="Win %" value={pctDisplay} />
        <StatCell label="Rank" value={`#${team.conferenceRank}`} />
      </div>
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string }): React.ReactNode {
  return (
    <div className="text-center">
      <span
        className="block text-[10px] uppercase tracking-widest"
        style={{
          fontFamily: 'var(--bsi-font-display)',
          color: 'var(--bsi-dust)',
        }}
      >
        {label}
      </span>
      <span
        className="block text-sm font-bold"
        style={{
          fontFamily: 'var(--font-mono)',
          color: 'var(--bsi-bone)',
        }}
      >
        {value}
      </span>
    </div>
  );
}
