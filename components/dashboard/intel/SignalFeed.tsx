'use client';

import { Sparkles, Pin, PinOff } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
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
    <Card variant="default" padding="none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle size="sm" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" style={{ color: 'var(--bsi-ember, #FF6B35)' }} />
            Signals
          </CardTitle>
          <Badge variant="outline" className="text-[10px] font-mono">
            {signals.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <ScrollArea maxHeight="380px">
          <div className="space-y-2 pr-2">
            {signals.length === 0 ? (
              <p className="py-6 text-center text-sm text-white/30">No signals for this filter.</p>
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
      </CardContent>
    </Card>
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
      className="group rounded-lg border bg-white/[0.03] p-3 transition-all hover:bg-white/[0.05]"
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
              className="inline-block rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider"
              style={{
                color: accent,
                background: `color-mix(in srgb, ${accent} 12%, transparent)`,
              }}
            >
              {signal.sport.toUpperCase()}
            </span>
            <span
              className="font-mono text-[10px] uppercase tracking-wider"
              style={{ color: PRIORITY_ACCENT[signal.priority] }}
            >
              {signal.type}
            </span>
            <span className="font-mono text-[10px] text-white/25">{signal.timestamp}</span>
          </div>

          {/* Signal text */}
          <p className="text-[12px] leading-snug text-white/60">{signal.text}</p>

          {/* Evidence */}
          {signal.evidence && signal.evidence.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {signal.evidence.map((e) => (
                <span
                  key={e.label}
                  className="inline-flex gap-1 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px]"
                >
                  <span className="text-white/40">{e.label}:</span>
                  <span className="text-white/70">{e.value}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Pin button */}
        <button
          onClick={onTogglePin}
          className="shrink-0 p-1 opacity-40 transition-opacity group-hover:opacity-80"
          style={{ color: pinned ? 'var(--bsi-ember, #FF6B35)' : 'white' }}
          title={pinned ? 'Unpin' : 'Pin to briefing'}
        >
          {pinned ? <Pin className="h-4 w-4" /> : <PinOff className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
