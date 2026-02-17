'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Badge } from '@/components/ui/Badge';

// =============================================================================
// Types
// =============================================================================

export interface Play {
  id: string;
  inning: number;
  halfInning: 'top' | 'bottom';
  description: string;
  result?: string;
  isScoring: boolean;
  runsScored: number;
  scoreAfter: { away: number; home: number };
}

export interface PlayByPlayProps {
  plays: Play[];
  isLive?: boolean;
  currentInning?: number;
  awayAbbr?: string;
  homeAbbr?: string;
}

// =============================================================================
// Helpers
// =============================================================================

function playIcon(play: Play): string {
  if (play.isScoring) return '\u26BE'; // baseball
  const desc = (play.description + ' ' + (play.result ?? '')).toLowerCase();
  if (desc.includes('home run') || desc.includes('homer')) return '\u{1F4A5}'; // collision
  if (desc.includes('strikeout') || desc.includes('struck out')) return '\u{1F4A8}'; // dash
  if (desc.includes('walk') || desc.includes('base on balls')) return '\u{1F6B6}'; // person walking
  if (desc.includes('double play')) return '\u{1F501}'; // repeat
  if (desc.includes('error')) return '\u274C'; // cross mark
  if (desc.includes('stolen base') || desc.includes('stole')) return '\u{1F3C3}'; // runner
  if (desc.includes('single') || desc.includes('double') || desc.includes('triple')) return '\u{1F3AF}'; // target
  return '\u25CF'; // bullet
}

function inningLabel(inning: number, half: 'top' | 'bottom'): string {
  const ordinal =
    inning === 1 ? '1st' :
    inning === 2 ? '2nd' :
    inning === 3 ? '3rd' :
    `${inning}th`;
  return `${half === 'top' ? 'Top' : 'Bottom'} ${ordinal}`;
}

// =============================================================================
// Component
// =============================================================================

export default function PlayByPlay({
  plays,
  isLive = false,
  currentInning,
  awayAbbr,
  homeAbbr,
}: PlayByPlayProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const [filter, setFilter] = useState<'all' | 'scoring'>('all');
  const prevPlayCountRef = useRef(plays.length);

  // Group plays by inning half
  const groupedPlays = useMemo(() => {
    const filtered = filter === 'scoring' ? plays.filter((p) => p.isScoring) : plays;
    const groups: Array<{ key: string; inning: number; half: 'top' | 'bottom'; plays: Play[] }> = [];
    let currentGroup: typeof groups[0] | null = null;

    for (const play of filtered) {
      const key = `${play.halfInning}-${play.inning}`;
      if (!currentGroup || currentGroup.key !== key) {
        currentGroup = { key, inning: play.inning, half: play.halfInning, plays: [] };
        groups.push(currentGroup);
      }
      currentGroup.plays.push(play);
    }

    return groups;
  }, [plays, filter]);

  // Detect user scroll-up to disable auto-scroll
  const handleScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    // User is "scrolled up" if more than 80px from bottom
    const atBottom = scrollHeight - scrollTop - clientHeight < 80;
    setUserScrolledUp(!atBottom);
  }, []);

  // Auto-scroll to bottom on new plays (only when live and user hasn't scrolled up)
  useEffect(() => {
    if (!isLive || userScrolledUp) return;
    if (plays.length > prevPlayCountRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevPlayCountRef.current = plays.length;
  }, [plays.length, isLive, userScrolledUp]);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    setUserScrolledUp(false);
  }, []);

  if (plays.length === 0) {
    return (
      <div className="bg-graphite rounded-lg border border-border-subtle p-8 text-center">
        <p className="text-text-secondary">No play-by-play data available yet.</p>
        <p className="text-text-tertiary text-sm mt-2">
          When the game gets going, every at-bat shows up here.
        </p>
      </div>
    );
  }

  const scoringCount = plays.filter((p) => p.isScoring).length;

  return (
    <div className="bg-midnight rounded-lg border border-border-subtle overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-charcoal">
        <div className="flex items-center gap-3">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-bone">
            Play-by-Play
          </h3>
          {isLive && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
              <span className="text-success text-xs font-semibold">LIVE</span>
            </div>
          )}
        </div>

        {/* Filter */}
        <div className="flex gap-1.5">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              filter === 'all'
                ? 'bg-burnt-orange text-white'
                : 'bg-graphite text-text-secondary hover:bg-white/10'
            }`}
          >
            All ({plays.length})
          </button>
          <button
            onClick={() => setFilter('scoring')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              filter === 'scoring'
                ? 'bg-burnt-orange text-white'
                : 'bg-graphite text-text-secondary hover:bg-white/10'
            }`}
          >
            Scoring ({scoringCount})
          </button>
        </div>
      </div>

      {/* Scrollable feed */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="max-h-[600px] overflow-y-auto"
      >
        {groupedPlays.map((group) => {
          const isCurrent =
            isLive &&
            currentInning != null &&
            group.inning === currentInning;

          return (
            <div key={group.key}>
              {/* Inning header */}
              <div
                className={`sticky top-0 z-10 px-4 py-2 border-b border-border-subtle ${
                  isCurrent ? 'bg-burnt-orange/20' : 'bg-charcoal/80 backdrop-blur-sm'
                }`}
              >
                <span className="font-display text-xs font-semibold uppercase tracking-wide text-burnt-orange">
                  {inningLabel(group.inning, group.half)}
                </span>
              </div>

              {/* Play entries */}
              {group.plays.map((play) => (
                <div
                  key={play.id}
                  className={`px-4 py-3 border-b border-border-subtle transition-colors ${
                    play.isScoring
                      ? 'bg-burnt-orange/5 border-l-4 border-l-burnt-orange'
                      : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <span className="text-base mt-0.5 flex-shrink-0 w-6 text-center" aria-hidden="true">
                      {playIcon(play)}
                    </span>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-relaxed ${play.isScoring ? 'text-white font-medium' : 'text-text-secondary'}`}>
                        {play.description}
                      </p>

                      {play.isScoring && (
                        <div className="mt-1.5 flex items-center gap-2">
                          <Badge variant="primary" size="sm">
                            +{play.runsScored} Run{play.runsScored > 1 ? 's' : ''}
                          </Badge>
                          <span className="text-xs text-text-tertiary font-mono">
                            {awayAbbr ?? 'AWY'} {play.scoreAfter.away} - {homeAbbr ?? 'HME'} {play.scoreAfter.home}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })}

        {/* Bottom anchor for auto-scroll */}
        <div ref={bottomRef} />
      </div>

      {/* Scroll-to-bottom button when user scrolled up during live game */}
      {isLive && userScrolledUp && (
        <div className="sticky bottom-0 px-4 py-2 bg-gradient-to-t from-midnight to-transparent">
          <button
            onClick={scrollToBottom}
            className="w-full py-2 bg-burnt-orange/90 hover:bg-burnt-orange text-white text-xs font-semibold rounded transition-colors flex items-center justify-center gap-1.5"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
            Jump to latest
          </button>
        </div>
      )}
    </div>
  );
}
