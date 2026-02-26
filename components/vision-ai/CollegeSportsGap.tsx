'use client';

/**
 * Side-by-side comparison of pro vs college tracking infrastructure.
 * Highlights the coverage gap that represents BSI's strategic position.
 */

interface TrackingRow {
  category: string;
  pro: { level: 'full' | 'partial' | 'none'; detail: string };
  college: { level: 'full' | 'partial' | 'none'; detail: string };
}

const TRACKING_DATA: TrackingRow[] = [
  {
    category: 'Optical Player Tracking',
    pro: { level: 'full', detail: 'Hawk-Eye (MLB/NBA), NFL standardizing' },
    college: { level: 'none', detail: 'No league-wide system' },
  },
  {
    category: 'Ball Tracking',
    pro: { level: 'full', detail: 'Every pitch, shot, and ball tracked in real-time' },
    college: { level: 'partial', detail: 'Rapsodo/TrackMan at select programs' },
  },
  {
    category: 'Biomechanics',
    pro: { level: 'full', detail: 'KinaTrax at all 30 MLB parks, NFL body suits' },
    college: { level: 'partial', detail: 'KinaTrax at 7 NCAA programs (~$500K/install)' },
  },
  {
    category: 'GPS/Wearable',
    pro: { level: 'full', detail: 'Catapult/STATSports universal in NFL' },
    college: { level: 'full', detail: 'Catapult dominant across SEC, Power 4' },
  },
  {
    category: 'Automated Cameras',
    pro: { level: 'full', detail: 'All venues — broadcast + analytics feeds' },
    college: { level: 'partial', detail: 'Pixellot at some programs for streaming' },
  },
  {
    category: 'Play Recognition AI',
    pro: { level: 'full', detail: 'Sportlogiq, Second Spectrum — every play tagged' },
    college: { level: 'partial', detail: 'Hudl IQ emerging, Synergy ~90% of D1 baseball' },
  },
  {
    category: 'Broadcast-Derived Tracking',
    pro: { level: 'full', detail: 'SkillCorner processes all broadcast feeds' },
    college: { level: 'none', detail: 'Just starting — limited coverage' },
  },
  {
    category: 'Real-Time Data Feed',
    pro: { level: 'full', detail: 'Sub-second latency for all tracking data' },
    college: { level: 'none', detail: 'No standardized real-time feed' },
  },
];

const levelConfig = {
  full: { bar: 'w-full', color: 'bg-green-500', label: 'Full' },
  partial: { bar: 'w-1/2', color: 'bg-yellow-500', label: 'Partial' },
  none: { bar: 'w-[8%]', color: 'bg-surface', label: 'Gap' },
} as const;

export function CollegeSportsGap({ className = '' }: { className?: string }) {
  const proFull = TRACKING_DATA.filter((r) => r.pro.level === 'full').length;
  const collegeFull = TRACKING_DATA.filter((r) => r.college.level === 'full').length;
  const collegeNone = TRACKING_DATA.filter((r) => r.college.level === 'none').length;

  return (
    <div className={className} role="region" aria-label="Pro vs college tracking infrastructure comparison">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-6" role="group" aria-label="Coverage summary">
        <div className="text-center p-3 bg-green-500/5 rounded-lg border border-green-500/10">
          <p className="text-2xl font-bold font-mono text-green-400">{proFull}/{TRACKING_DATA.length}</p>
          <p className="text-[10px] text-text-tertiary uppercase tracking-wider mt-1">Pro: Full Coverage</p>
        </div>
        <div className="text-center p-3 bg-yellow-500/5 rounded-lg border border-yellow-500/10">
          <p className="text-2xl font-bold font-mono text-yellow-400">{collegeFull}/{TRACKING_DATA.length}</p>
          <p className="text-[10px] text-text-tertiary uppercase tracking-wider mt-1">College: Full</p>
        </div>
        <div className="text-center p-3 bg-burnt-orange/5 rounded-lg border border-burnt-orange/10">
          <p className="text-2xl font-bold font-mono text-burnt-orange">{collegeNone}</p>
          <p className="text-[10px] text-text-tertiary uppercase tracking-wider mt-1">Critical Gaps</p>
        </div>
      </div>

      {/* Comparison table */}
      <div className="space-y-3">
        {TRACKING_DATA.map((row) => (
          <div key={row.category} className="bg-white/[0.02] rounded-lg p-4 border border-border-subtle hover:border-border transition-colors">
            <div className="text-text-primary font-semibold text-sm mb-3">{row.category}</div>
            <div className="grid grid-cols-2 gap-4">
              {/* Pro */}
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-text-muted font-semibold w-10">Pro</span>
                  <div className="flex-1 h-1.5 bg-surface-light rounded-full overflow-hidden">
                    <div className={`h-full ${levelConfig[row.pro.level].color} ${levelConfig[row.pro.level].bar} rounded-full transition-all`} />
                  </div>
                  <span className={`text-[9px] font-mono ${
                    row.pro.level === 'full' ? 'text-green-400' : row.pro.level === 'partial' ? 'text-yellow-400' : 'text-text-muted'
                  }`}>
                    {levelConfig[row.pro.level].label}
                  </span>
                </div>
                <p className="text-text-tertiary text-[11px] leading-relaxed pl-12">{row.pro.detail}</p>
              </div>

              {/* College */}
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-text-muted font-semibold w-10">Coll</span>
                  <div className="flex-1 h-1.5 bg-surface-light rounded-full overflow-hidden">
                    <div className={`h-full ${levelConfig[row.college.level].color} ${levelConfig[row.college.level].bar} rounded-full transition-all`} />
                  </div>
                  <span className={`text-[9px] font-mono ${
                    row.college.level === 'full' ? 'text-green-400' : row.college.level === 'partial' ? 'text-yellow-400' : 'text-text-muted'
                  }`}>
                    {levelConfig[row.college.level].label}
                  </span>
                </div>
                <p className="text-text-tertiary text-[11px] leading-relaxed pl-12">{row.college.detail}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* BSI editorial take */}
      <div className="mt-6 bg-burnt-orange/5 border border-burnt-orange/15 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-1 h-4 bg-burnt-orange rounded-full" />
          <span className="text-burnt-orange text-xs font-semibold uppercase tracking-wider">BSI Take</span>
        </div>
        <p className="text-text-secondary text-sm leading-relaxed">
          Pro leagues have near-complete tracking coverage. College sports — BSI&apos;s flagship territory —
          have massive gaps in optical tracking, biomechanics, and real-time data. The programs investing
          now (Rapsodo at mid-tier, KinaTrax at elite) are gaining a measurable scouting and development
          advantage. This gap is closing, but the window for first-mover coverage is still open.
        </p>
      </div>
    </div>
  );
}
