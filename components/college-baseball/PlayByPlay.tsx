'use client';

import { useEffect, useRef } from 'react';

/* ────────────────────────────────────────────────────────────
   PlayByPlay Component
   Scrollable feed of play-by-play events with auto-scroll
   ──────────────────────────────────────────────────────────── */

interface Play {
  inning: number;
  topBottom: 'top' | 'bottom';
  description: string;
  timestamp: string;
}

interface PlayByPlayProps {
  plays: Play[];
}

export function PlayByPlay({ plays }: PlayByPlayProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  /* Auto-scroll to the latest event when plays update */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [plays]);

  if (!plays || plays.length === 0) {
    return (
      <div className="rounded-lg border border-white/10 bg-charcoal p-6 text-center">
        <p className="font-mono text-sm text-white/40">No plays recorded yet.</p>
      </div>
    );
  }

  /* Group plays by inning + half for visual separators */
  let lastInningKey = '';

  return (
    <div
      ref={scrollRef}
      className="rounded-lg border border-white/10 bg-charcoal overflow-y-auto max-h-[480px] scroll-smooth"
    >
      <div className="divide-y divide-white/5">
        {plays.map((play, idx) => {
          const inningKey = `${play.inning}-${play.topBottom}`;
          const showInningMarker = inningKey !== lastInningKey;
          lastInningKey = inningKey;

          return (
            <div key={`play-${idx}-${play.timestamp}`}>
              {/* Inning marker */}
              {showInningMarker && (
                <div className="sticky top-0 z-10 bg-midnight/90 backdrop-blur-sm px-4 py-2 border-b border-white/10">
                  <span className="font-display text-xs uppercase tracking-wider text-burnt-orange">
                    {play.topBottom === 'top' ? 'Top' : 'Bottom'} {play.inning}
                    {getOrdinalSuffix(play.inning)}
                  </span>
                </div>
              )}

              {/* Play entry */}
              <div className="px-4 py-3 flex items-start gap-3 hover:bg-white/[0.02] transition-colors">
                {/* Inning indicator pip */}
                <div className="mt-1.5 flex-shrink-0">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      play.topBottom === 'top'
                        ? 'bg-burnt-orange/60'
                        : 'bg-blue-400/60'
                    }`}
                  />
                </div>

                {/* Description */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/90 leading-relaxed">
                    {play.description}
                  </p>
                </div>

                {/* Timestamp */}
                <span className="flex-shrink-0 font-mono text-[10px] text-white/30 mt-0.5">
                  {formatTimestamp(play.timestamp)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Helpers ──────────────────────────────────────────────────── */

function getOrdinalSuffix(n: number): string {
  const remainder = n % 10;
  const remainder100 = n % 100;
  if (remainder100 >= 11 && remainder100 <= 13) return 'th';
  if (remainder === 1) return 'st';
  if (remainder === 2) return 'nd';
  if (remainder === 3) return 'rd';
  return 'th';
}

function formatTimestamp(ts: string): string {
  try {
    const date = new Date(ts);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/Chicago',
    });
  } catch {
    return ts;
  }
}
