'use client';

import { useState, useEffect } from 'react';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface IntelStreamCardProps {
  homeTeam: string;
  awayTeam: string;
  sport: string;
  gameId?: string;
  analysisType: 'live' | 'pregame' | 'postgame';
  // Optional live context forwarded to the worker
  score?: string;
  inning?: string;
  outs?: number;
  pitcher?: string;
  pitchCount?: number;
  recentPlays?: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function buildQuestion(analysisType: string, awayTeam: string, homeTeam: string): string {
  if (analysisType === 'pregame') return `What gives ${awayTeam} or ${homeTeam} the edge in this matchup?`;
  if (analysisType === 'live')    return `What's the critical situation to watch right now?`;
  return `What ultimately decided this game and who were the key figures?`;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function IntelStreamCard({
  homeTeam,
  awayTeam,
  sport,
  gameId,
  analysisType,
  score,
  inning,
  outs,
  pitcher,
  pitchCount,
  recentPlays,
}: IntelStreamCardProps) {
  const [text, setText]           = useState('');
  const [streaming, setStreaming] = useState(true);
  const [failed, setFailed]       = useState(false);

  const question = buildQuestion(analysisType, awayTeam, homeTeam);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    async function stream() {
      try {
        const context: Record<string, unknown> = { sport, homeTeam, awayTeam, gameId };
        if (score !== undefined)      context.score      = score;
        if (inning !== undefined)     context.inning     = inning;
        if (outs !== undefined)       context.outs       = outs;
        if (pitcher !== undefined)    context.pitcher    = pitcher;
        if (pitchCount !== undefined) context.pitchCount = pitchCount;
        if (recentPlays !== undefined) context.recentPlays = recentPlays;

        const res = await fetch('/api/intelligence/v1/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question, context, analysisType }),
          signal: controller.signal,
        });

        // Clear the connection timeout once we get a response — streaming can take longer
        clearTimeout(timeout);

        if (!res.ok || !res.body) {
          setFailed(true); setStreaming(false);
          return;
        }

        const reader  = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';

         
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split('\n');
          buf = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const d = JSON.parse(line.slice(6)) as { text?: string; done?: boolean };
              if (d.text) setText((p) => p + d.text);
              if (d.done) setStreaming(false);
            } catch {
              // malformed chunk — skip
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setFailed(true); setStreaming(false);
        }
      }
    }

    stream();
    return () => { controller.abort(); clearTimeout(timeout); };
  }, [gameId, analysisType]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Shared keyframes injected once ────────────────────────────────────────

  const keyframes = `
    @keyframes bsiIntelFadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes bsiCursorBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
  `;

  const cardStyle: React.CSSProperties = {
    backgroundColor: '#0D0D0D',
    border: '1px solid rgba(191,87,0,0.2)',
    borderRadius: '2px',
    overflow: 'hidden',
    opacity: 0,
    animation: 'bsiIntelFadeIn 0.4s ease-out 0.1s forwards',
  };

  const headerBorderStyle: React.CSSProperties = {
    borderBottom: '1px solid rgba(191,87,0,0.15)',
  };

  // ─── Loading skeleton ───────────────────────────────────────────────────────

  if (streaming && text.length === 0 && !failed) {
    return (
      <div style={cardStyle}>
        <style>{keyframes}</style>
        <div className="flex items-center gap-2 px-4 py-3" style={headerBorderStyle}>
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--bsi-primary)] animate-pulse" />
          <span className="font-display text-[10px] font-semibold uppercase tracking-widest text-[rgba(196,184,165,0.5)]">
            BLAZE INTEL
          </span>
        </div>
        <div className="px-4 py-5 space-y-3">
          <div className="h-3 rounded-sm animate-pulse bg-[var(--surface-dugout)]" style={{ width: '91.666%' }} />
          <div className="h-3 rounded-sm animate-pulse bg-[var(--surface-dugout)]" style={{ width: '75%' }} />
          <div className="h-3 rounded-sm animate-pulse bg-[var(--surface-dugout)]" style={{ width: '83.333%' }} />
        </div>
      </div>
    );
  }

  // ─── Error state ────────────────────────────────────────────────────────────

  if (failed) {
    return (
      <div style={{ ...cardStyle, opacity: 1, animation: 'none' }}>
        <style>{keyframes}</style>
        <div className="flex items-center gap-2 px-4 py-3" style={headerBorderStyle}>
          <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary" />
          <span className="font-display text-[10px] font-semibold uppercase tracking-widest text-[rgba(196,184,165,0.5)]">
            BLAZE INTEL
          </span>
        </div>
        <p className="px-4 py-5 text-[rgba(196,184,165,0.5)] text-sm">Analysis unavailable.</p>
      </div>
    );
  }

  // ─── Streaming / done ───────────────────────────────────────────────────────

  return (
    <div style={cardStyle}>
      <style>{keyframes}</style>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={headerBorderStyle}>
        <div className="flex items-center gap-2">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: '#BF5700',
              opacity: streaming ? 1 : 0.35,
              transition: 'opacity 0.4s ease',
              animation: streaming ? 'pulse 1.4s cubic-bezier(0.4,0,0.6,1) infinite' : 'none',
            }}
          />
          <span className="font-display text-[10px] font-semibold uppercase tracking-widest text-[rgba(196,184,165,0.5)]">
            BLAZE INTEL
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-4">
        <p
          className="font-serif leading-7"
          style={{ fontSize: '15px', color: 'rgba(247,247,245,0.85)' }}
        >
          {text}
          {streaming && (
            <span
              className="inline-block ml-px font-mono"
              style={{
                color: '#BF5700',
                animation: 'bsiCursorBlink 0.8s step-end infinite',
              }}
            >
              |
            </span>
          )}
        </p>
      </div>

      {/* Footer — visible only when stream is complete */}
      {!streaming && (
        <div className="px-4 pb-3 flex justify-end">
          <span className="font-mono text-[10px] text-[rgba(196,184,165,0.5)]">
            BSI · Powered by Claude
          </span>
        </div>
      )}
    </div>
  );
}
