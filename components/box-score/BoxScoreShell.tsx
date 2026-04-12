'use client';

import { useState, type ReactNode } from 'react';

/**
 * Heritage-styled decorative frame every box-score page wraps its children
 * with. Renders the dugout card surface, press-box header band, a box-score
 * heritage stamp, and (optionally) the segmented team filter.
 *
 * State is lifted to the shell via render-prop so tables can respond to
 * the filter without each sport managing its own toggle.
 */

export type TeamFilter = 'both' | 'away' | 'home';

interface BoxScoreShellProps {
  title?: string;
  subtitle?: string;
  awayAbbreviation?: string;
  homeAbbreviation?: string;
  /** When true, render the segmented Both / Away / Home toggle. */
  showTeamToggle?: boolean;
  /** Initial filter. Default: 'both'. */
  initialFilter?: TeamFilter;
  children: (ctx: { teamFilter: TeamFilter }) => ReactNode;
}

function TeamToggle({
  filter,
  onChange,
  awayAbbreviation,
  homeAbbreviation,
}: {
  filter: TeamFilter;
  onChange: (next: TeamFilter) => void;
  awayAbbreviation?: string;
  homeAbbreviation?: string;
}) {
  const options: Array<{ key: TeamFilter; label: string }> = [
    { key: 'both', label: 'Both' },
    { key: 'away', label: awayAbbreviation?.trim() || 'Away' },
    { key: 'home', label: homeAbbreviation?.trim() || 'Home' },
  ];

  return (
    <div
      role="tablist"
      aria-label="Team filter"
      className="inline-flex items-center gap-0 rounded-sm border border-border-vintage bg-surface-dugout p-0.5"
    >
      {options.map((opt) => {
        const active = filter === opt.key;
        return (
          <button
            key={opt.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.key)}
            className={`px-3 py-1.5 text-[0.7rem] font-display uppercase tracking-[0.2em] transition-colors ${
              active
                ? 'bg-bsi-primary text-white'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function BoxScoreShell({
  title = 'Box Score',
  subtitle,
  awayAbbreviation,
  homeAbbreviation,
  showTeamToggle = false,
  initialFilter = 'both',
  children,
}: BoxScoreShellProps) {
  const [teamFilter, setTeamFilter] = useState<TeamFilter>(initialFilter);

  return (
    <section className="heritage-card corner-marks relative overflow-hidden">
      {/* Press-box header band */}
      <header className="surface-lifted border-b border-border-vintage px-4 md:px-6 py-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="heritage-stamp">{title}</span>
          {subtitle && (
            <span className="text-text-tertiary text-xs uppercase tracking-wider">
              {subtitle}
            </span>
          )}
        </div>
        {showTeamToggle && (
          <TeamToggle
            filter={teamFilter}
            onChange={setTeamFilter}
            awayAbbreviation={awayAbbreviation}
            homeAbbreviation={homeAbbreviation}
          />
        )}
      </header>

      {/* Body */}
      <div className="px-3 md:px-5 py-4 md:py-6">
        {children({ teamFilter })}
      </div>
    </section>
  );
}
