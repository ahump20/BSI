'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { streamAnalysis, type Sport, type AnalysisType } from '@/lib/bsi-stream-client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface GameContext {
  sport: Sport;
  homeTeam: string;
  awayTeam: string;
  score?: string;
  inning?: string;
  outs?: number;
  pitcher?: string;
  pitchCount?: number;
  recentPlays?: string;
  gameId?: string;
}

interface IntelStreamProps {
  /** Pre-populated game context sent to the worker. */
  context?: GameContext;
  /** If provided, fires automatically on mount. Otherwise renders an input field. */
  initialQuestion?: string;
  analysisType?: AnalysisType;
  /** Optional label shown above the stream panel. */
  label?: string;
}

type Status = 'idle' | 'streaming' | 'done' | 'error';

// ─── Suggested prompts by analysis type ──────────────────────────────────────

const SUGGESTIONS: Record<AnalysisType, string[]> = {
  live:     ['What does this pitcher need to do right now?', 'Break down this at-bat situation.', 'How is the bullpen holding up?'],
  postgame: ['What decided this game?', 'Who was the most important player tonight?', 'What do these numbers mean for the rest of the season?'],
  pregame:  ['What matchup should I watch?', 'Who has the pitching advantage?', 'What scheme wrinkle matters most?'],
  stat:     ['What does this number actually mean?', 'How does this compare to the conference average?', 'Is this sustainable?'],
};

// ─── Component ────────────────────────────────────────────────────────────────

export function IntelStream({
  context,
  initialQuestion,
  analysisType = 'live',
  label,
}: IntelStreamProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [output, setOutput] = useState('');
  const [question, setQuestion] = useState(initialQuestion ?? '');
  const [meta, setMeta] = useState<{ ttftMs: number | null; cached: boolean } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const abortRef = useRef<(() => void) | null>(null);

  const fire = useCallback((q: string) => {
    if (!q.trim() || status === 'streaming') return;

    // Abort any in-flight stream
    abortRef.current?.();

    setOutput('');
    setMeta(null);
    setErrorMsg('');
    setStatus('streaming');

    abortRef.current = streamAnalysis({
      question: q.trim(),
      context,
      analysisType,
      onToken: (text) => setOutput((prev) => prev + text),
      onDone: (m) => {
        setMeta(m);
        setStatus('done');
      },
      onError: (err) => {
        setErrorMsg(err.message);
        setStatus('error');
      },
    });
  }, [context, analysisType, status]);

  // Auto-fire if question pre-populated
  useEffect(() => {
    if (initialQuestion) fire(initialQuestion);
    // Cleanup on unmount
    return () => { abortRef.current?.(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fire(question);
  };

  const handleSuggestion = (s: string) => {
    setQuestion(s);
    fire(s);
  };

  const isStreaming = status === 'streaming';
  const hasOutput = output.length > 0;

  return (
    <div className="rounded-xl border border-border-subtle bg-surface-light overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-burnt-orange" />
          <span className="font-display text-xs font-semibold uppercase tracking-widest text-text-secondary">
            {label ?? 'BSI Intelligence'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {meta && (
            <>
              {meta.cached && (
                <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">Cached</span>
              )}
              {meta.ttftMs !== null && !meta.cached && (
                <span className="text-[10px] font-mono text-text-muted">{meta.ttftMs}ms</span>
              )}
            </>
          )}
          {isStreaming && (
            <span className="text-[10px] font-mono text-burnt-orange animate-pulse">streaming</span>
          )}
        </div>
      </div>

      {/* Output panel — only shown once streaming begins */}
      {hasOutput && (
        <div className="px-4 pt-4 pb-3">
          <p className="text-sm text-text-secondary leading-relaxed font-serif">
            {output}
            {isStreaming && (
              <span className="inline-block w-0.5 h-3.5 bg-burnt-orange ml-0.5 align-middle animate-pulse" />
            )}
          </p>
        </div>
      )}

      {/* Error state */}
      {status === 'error' && (
        <div className="px-4 py-3">
          <p className="text-xs text-red-400/70">{errorMsg}</p>
        </div>
      )}

      {/* Input */}
      {!initialQuestion && (
        <div className="px-4 pb-4 pt-3 space-y-3">
          {/* Suggestions — show only when idle and no output */}
          {status === 'idle' && (
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS[analysisType].map((s) => (
                <button
                  key={s}
                  onClick={() => handleSuggestion(s)}
                  className="text-[11px] text-text-muted border border-border-subtle rounded-full px-3 py-1 hover:text-text-secondary hover:border-border-strong transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask about this game…"
              aria-label="Ask a question about this game"
              disabled={isStreaming}
              className="flex-1 bg-surface-light border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-burnt-orange/50 disabled:opacity-40 transition-colors"
            />
            <button
              type="submit"
              disabled={isStreaming || !question.trim()}
              className="px-4 py-2 rounded-lg bg-burnt-orange text-white text-xs font-display font-bold uppercase tracking-wider hover:bg-ember disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              {isStreaming ? '…' : 'Ask'}
            </button>
          </form>
        </div>
      )}

      {/* Re-ask button when done with a pre-seeded question */}
      {initialQuestion && status === 'done' && (
        <div className="px-4 pb-3 pt-1">
          <button
            onClick={() => fire(initialQuestion)}
            className="text-[11px] text-text-muted hover:text-text-muted transition-colors"
          >
            Refresh analysis ↻
          </button>
        </div>
      )}
    </div>
  );
}
