'use client';

// =============================================================================
// Types
// =============================================================================

interface PitcherInfo {
  name: string;
  team: string;
  stats: {
    era?: number;
    wins?: number;
    losses?: number;
    strikeouts?: number;
    ip?: number;
  };
}

interface BatterInfo {
  name: string;
  team: string;
  stats: {
    avg?: number;
    hr?: number;
    rbi?: number;
    hits?: number;
    ab?: number;
  };
}

export interface MatchupCardProps {
  pitcher?: PitcherInfo;
  batter?: BatterInfo;
  isLive?: boolean;
}

// =============================================================================
// Helpers
// =============================================================================

function formatAvg(avg?: number): string {
  if (avg == null) return '---';
  return avg.toFixed(3).replace(/^0/, '');
}

function formatEra(era?: number): string {
  if (era == null) return '-.--';
  return era.toFixed(2);
}

// =============================================================================
// Component
// =============================================================================

export default function MatchupCard({ pitcher, batter, isLive }: MatchupCardProps) {
  if (!pitcher && !batter) return null;

  return (
    <div className="bg-midnight rounded-lg border border-border-subtle overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border-subtle bg-charcoal">
        <h3 className="font-display text-xs font-semibold uppercase tracking-wide text-bone">
          {isLive ? 'Current Matchup' : 'Matchup'}
        </h3>
        {isLive && (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span className="text-success text-xs font-semibold">LIVE</span>
          </div>
        )}
      </div>

      {/* Matchup body */}
      <div className="flex items-stretch">
        {/* Pitcher side */}
        <div className="flex-1 p-4">
          {pitcher ? (
            <div className="text-center">
              {/* Pitcher icon */}
              <div className="w-14 h-14 bg-charcoal rounded-full flex items-center justify-center mx-auto mb-3">
                <svg viewBox="0 0 24 24" className="w-7 h-7 text-burnt-orange" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="7" r="4" />
                  <path d="M5.5 21c0-4.5 3-7 6.5-7s6.5 2.5 6.5 7" />
                  <path d="M15 3c1 1.5 2 3 1 5" strokeLinecap="round" />
                </svg>
              </div>

              <p className="font-display text-sm font-semibold uppercase text-text-primary">
                {pitcher.name}
              </p>
              <p className="text-text-tertiary text-xs mt-0.5">{pitcher.team}</p>

              {/* Stats */}
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                <div className="text-right text-text-tertiary">ERA</div>
                <div className="text-left text-bone font-mono">{formatEra(pitcher.stats.era)}</div>
                {pitcher.stats.wins != null && pitcher.stats.losses != null && (
                  <>
                    <div className="text-right text-text-tertiary">W-L</div>
                    <div className="text-left text-bone font-mono">
                      {pitcher.stats.wins}-{pitcher.stats.losses}
                    </div>
                  </>
                )}
                {pitcher.stats.strikeouts != null && (
                  <>
                    <div className="text-right text-text-tertiary">K</div>
                    <div className="text-left text-bone font-mono">{pitcher.stats.strikeouts}</div>
                  </>
                )}
                {pitcher.stats.ip != null && (
                  <>
                    <div className="text-right text-text-tertiary">IP</div>
                    <div className="text-left text-bone font-mono">{pitcher.stats.ip}</div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-text-tertiary text-sm">Pitcher TBD</p>
            </div>
          )}
        </div>

        {/* VS divider */}
        <div className="flex items-center">
          <div className="w-10 h-10 bg-burnt-orange/20 border border-burnt-orange/40 rounded-full flex items-center justify-center">
            <span className="font-display text-xs font-bold text-burnt-orange uppercase">VS</span>
          </div>
        </div>

        {/* Batter side */}
        <div className="flex-1 p-4">
          {batter ? (
            <div className="text-center">
              {/* Batter icon */}
              <div className="w-14 h-14 bg-charcoal rounded-full flex items-center justify-center mx-auto mb-3">
                <svg viewBox="0 0 24 24" className="w-7 h-7 text-burnt-orange" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="7" r="4" />
                  <path d="M5.5 21c0-4.5 3-7 6.5-7s6.5 2.5 6.5 7" />
                  <path d="M16 4l3-2" strokeLinecap="round" strokeWidth="2" />
                </svg>
              </div>

              <p className="font-display text-sm font-semibold uppercase text-text-primary">
                {batter.name}
              </p>
              <p className="text-text-tertiary text-xs mt-0.5">{batter.team}</p>

              {/* Stats */}
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                <div className="text-right text-text-tertiary">AVG</div>
                <div className="text-left text-bone font-mono">{formatAvg(batter.stats.avg)}</div>
                {batter.stats.hr != null && (
                  <>
                    <div className="text-right text-text-tertiary">HR</div>
                    <div className="text-left text-bone font-mono">{batter.stats.hr}</div>
                  </>
                )}
                {batter.stats.rbi != null && (
                  <>
                    <div className="text-right text-text-tertiary">RBI</div>
                    <div className="text-left text-bone font-mono">{batter.stats.rbi}</div>
                  </>
                )}
                {batter.stats.hits != null && batter.stats.ab != null && (
                  <>
                    <div className="text-right text-text-tertiary">H/AB</div>
                    <div className="text-left text-bone font-mono">
                      {batter.stats.hits}/{batter.stats.ab}
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-text-tertiary text-sm">Batter TBD</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
