'use client';

import { Sparkles, Pin, PinOff } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { ScrollArea } from '@/components/ui/ScrollArea';
import type { IntelSignal } from '@/lib/intel/types';
import { SPORT_ACCENT, PRIORITY_ACCENT } from '@/lib/intel/types';

interface SignalFeedProps {
  signals: IntelSignal[];
  isPinned: (id: string) => boolean;
  onTogglePin: (id: string) => void;
}

export function SignalFeed({ signals, isPinned, onTogglePin }: SignalFeedProps) {
  return (
    <div className="intel-panel">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-0">
        <div className="intel-section-label">
          <Sparkles className="h-4 w-4" style={{ color: 'var(--bsi-accent)' }} />
          Signals
        </div>
        <Badge variant="outline" className="text-[10px]" style={{ fontFamily: 'var(--intel-mono)' }}>
          {signals.length}
        </Badge>
      </div>

      <hr className="intel-rule mx-4 mt-3" />

      <div className="px-4 pb-4 pt-3">
        <ScrollArea maxHeight="380px">
          <div className="space-y-2 pr-2">
            {signals.length === 0 ? (
              <p className="py-6 text-center text-sm" style={{ color: 'var(--intel-text-caption)' }}>No signals for this filter.</p>
            ) : (
              signals.map((s) => (
                <SignalCard
                  key={s.id}
                  signal={s}
                  pinned={isPinned(s.id)}
                  onTogglePin={() => onTogglePin(s.id)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

function SignalCard({
  signal,
  pinned,
  onTogglePin,
}: {
  signal: IntelSignal;
  pinned: boolean;
  onTogglePin: () => void;
}) {
  const accent = SPORT_ACCENT[signal.sport];

  return (
    <div
      className="group intel-panel-elevated p-3 transition-all hover:bg-[var(--intel-bg-elevated)]"
      style={{
        borderColor: `color-mix(in srgb, ${accent} 15%, transparent)`,
        borderLeftWidth: '3px',
        borderLeftColor: PRIORITY_ACCENT[signal.priority],
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {/* Badges row */}
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="intel-sport-tag"
              style={{
                color: accent,
                background: `color-mix(in srgb, ${accent} 12%, transparent)`,
              }}
            >
              {signal.sport.toUpperCase()}
            </span>
            <span
              className="text-[10px] uppercase tracking-wider"
              style={{ fontFamily: 'var(--intel-mono)', color: PRIORITY_ACCENT[signal.priority] }}
            >
              {signal.type}
            </span>
            <span className="intel-caption">{signal.timestamp}</span>
          </div>

          {/* Signal text */}
          <p className="text-[12px] leading-snug" style={{ color: 'var(--intel-text-body)' }}>{signal.text}</p>

          {/* Evidence */}
          {signal.evidence && signal.evidence.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {signal.evidence.map((e) => (
                <span
                  key={e.label}
                  className="inline-flex gap-1 px-1.5 py-0.5 text-[10px]"
                  style={{
                    fontFamily: 'var(--intel-mono)',
                    background: 'var(--intel-bg-primary)',
                    border: '1px solid var(--intel-border-rule)',
                    borderRadius: '1px',
                  }}
                >
                  <span style={{ color: 'var(--intel-text-caption)' }}>{e.label}:</span>
                  <span style={{ color: 'var(--intel-text-data)' }}>{e.value}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Pin button */}
        <button
          onClick={onTogglePin}
          className="shrink-0 p-1 opacity-40 transition-opacity group-hover:opacity-80"
          style={{ color: pinned ? 'var(--bsi-accent)' : 'white' }}
          title={pinned ? 'Unpin' : 'Pin to briefing'}
        >
          {pinned ? <Pin className="h-4 w-4" /> : <PinOff className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
