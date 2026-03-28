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

  // Auto-fire if question pre-populated (capture initial value to avoid re-firing)
  const initialQuestionRef = useRef(initialQuestion);
  useEffect(() => {
    if (initialQuestionRef.current) fire(initialQuestionRef.current);
    return () => { abortRef.current?.(); };
  }, [fire]);

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
    <div className="rounded-sm border border-[var(--border-vintage)] bg-[var(--surface-press-box)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-vintage)]">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--bsi-primary)]" />
          <span className="font-display text-xs font-semibold uppercase tracking-widest text-[var(--bsi-dust)]">
            {label ?? 'BSI Intelligence'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {meta && (
            <>
              {meta.cached && (
                <span className="text-[10px] font-mono text-[rgba(196,184,165,0.35)] uppercase tracking-wider">Cached</span>
              )}
              {meta.ttftMs !== null && !meta.cached && (
                <span className="text-[10px] font-mono text-[rgba(196,184,165,0.35)]">{meta.ttftMs}ms</span>
              )}
            </>
          )}
          {isStreaming && (
            <span className="text-[10px] font-mono text-[var(--bsi-primary)] animate-pulse">streaming</span>
          )}
        </div>
      </div>

      {/* Output panel — only shown once streaming begins */}
      {hasOutput && (
        <div className="px-4 pt-4 pb-3">
          <p className="text-sm text-[var(--bsi-dust)] leading-relaxed font-serif">
            {output}
            {isStreaming && (
              <span className="inline-block w-0.5 h-3.5 bg-[var(--bsi-primary)] ml-0.5 align-middle animate-pulse" />
            )}
          </p>
        </div>
      )}

      {/* Error state */}
      {status === 'error' && (
        <div className="px-4 py-3">
          <p className="text-xs text-[var(--bsi-danger)]/70">{errorMsg}</p>
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
                  className="text-[11px] text-[rgba(196,184,165,0.35)] border border-[var(--border-vintage)] rounded-sm px-3 py-1 hover:text-[var(--bsi-dust)] hover:border-[rgba(140,98,57,0.5)] transition-colors"
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
              className="flex-1 bg-[var(--surface-press-box)] border border-[var(--border-vintage)] rounded-sm px-3 py-2 text-sm text-[var(--bsi-bone)] placeholder:text-[rgba(196,184,165,0.35)] focus:outline-none focus:border-[var(--bsi-primary)]/50 disabled:opacity-40 transition-colors"
            />
            <button
              type="submit"
              disabled={isStreaming || !question.trim()}
              className="px-4 py-2 rounded-sm bg-[var(--bsi-primary)] text-white text-xs font-display font-bold uppercase tracking-wider hover:bg-ember disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
            className="text-[11px] text-[rgba(196,184,165,0.35)] hover:text-[rgba(196,184,165,0.35)] transition-colors"
          >
            Refresh analysis ↻
          </button>
        </div>
      )}
    </div>
  );
}
