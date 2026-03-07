'use client';

import { useState, useRef, useCallback } from 'react';

const EXAMPLE_PROMPTS = [
  'Who leads the SEC in OBP?',
  'Best pitching staff in the Big 12?',
  'Is Texas a CWS contender?',
];

const MAX_FREE_QUESTIONS = 3;
const STORAGE_KEY = 'bsi-ask-count';

function getAskCount(): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
}

function incrementAskCount(): number {
  const count = getAskCount() + 1;
  localStorage.setItem(STORAGE_KEY, String(count));
  return count;
}

export function AskBSI() {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const askQuestion = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed || streaming) return;

    // Rate limit check (free tier)
    const count = getAskCount();
    if (count >= MAX_FREE_QUESTIONS) {
      setError(`You've used your ${MAX_FREE_QUESTIONS} free questions this session. Sign up for unlimited access.`);
      return;
    }

    setQuestion(trimmed);
    setResponse('');
    setError('');
    setStreaming(true);

    abortRef.current = new AbortController();

    try {
      const res = await fetch('/api/intelligence/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: trimmed }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error((errBody as { error?: string }).error || `Error ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.text && !parsed.done) {
              accumulated += parsed.text;
              setResponse(accumulated);
            }
            if (parsed.done) {
              if (parsed.text && !accumulated) {
                // Cached response — full text in one shot
                setResponse(parsed.text);
              }
            }
          } catch {
            // Skip malformed SSE
          }
        }
      }

      incrementAskCount();
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setStreaming(false);
    }
  }, [streaming]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    askQuestion(question);
  };

  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="rounded-xl bg-[rgba(26,26,26,0.6)] border border-[rgba(245,240,235,0.06)] p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-burnt-orange/15 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-burnt-orange" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                <path d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
              </svg>
            </div>
            <div>
              <h3 className="font-display text-sm font-bold uppercase tracking-wide text-text-primary">
                Ask BSI
              </h3>
              <p className="text-[10px] text-text-muted uppercase tracking-wider">
                AI-powered college baseball analysis
              </p>
            </div>
          </div>

          {/* Example chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            {EXAMPLE_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => askQuestion(prompt)}
                disabled={streaming}
                className="text-[11px] px-3 py-1.5 rounded-full bg-[rgba(255,255,255,0.03)] border border-[rgba(245,240,235,0.06)]
                  text-text-secondary hover:text-burnt-orange hover:border-burnt-orange/30
                  transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask anything about college baseball..."
              disabled={streaming}
              className="flex-1 px-4 py-2.5 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(245,240,235,0.06)]
                text-sm text-text-primary placeholder:text-text-muted
                focus:outline-none focus:border-burnt-orange/40 focus:ring-1 focus:ring-burnt-orange/20
                transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={streaming || !question.trim()}
              className="px-4 py-2.5 rounded-lg bg-burnt-orange text-white text-xs font-semibold uppercase tracking-wider
                hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              {streaming ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  Thinking
                </span>
              ) : (
                'Ask'
              )}
            </button>
          </form>

          {/* Response area */}
          {(response || error) && (
            <div className="mt-4 pt-4 border-t border-[rgba(245,240,235,0.04)]">
              {error ? (
                <p className="text-sm text-red-400">{error}</p>
              ) : (
                <div className="text-sm leading-relaxed text-text-secondary font-serif">
                  {response}
                  {streaming && (
                    <span className="inline-block w-1.5 h-4 bg-burnt-orange/60 ml-0.5 animate-pulse" />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
