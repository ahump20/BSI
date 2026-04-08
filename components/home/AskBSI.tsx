'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';

// ─── Example prompts — cover routing, stats, teams, and multi-sport ──────────

const EXAMPLE_PROMPTS = [
  "Who's winning right now?",
  'Best hitters in the SEC',
  'Is Texas ranked this week?',
  'When does LSU play next?',
  "What's the portal tracker?",
];

const MAX_FREE_QUESTIONS = 5;
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

// ─── Link parsing — turns [[text|/path]] into clickable elements ─────────────

interface TextSegment {
  type: 'text' | 'link';
  content: string;
  href?: string;
}

function parseResponse(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  const linkPattern = /\[\[([^|]+)\|([^\]]+)\]\]/g;
  let lastIndex = 0;
  let match;

  while ((match = linkPattern.exec(text)) !== null) {
    // Text before this link
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    // The link itself
    segments.push({ type: 'link', content: match[1], href: match[2] });
    lastIndex = match.index + match[0].length;
  }

  // Remaining text after last link
  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return segments;
}

// ─── Extract all links from response for the action strip ────────────────────

function extractLinks(text: string): Array<{ label: string; href: string }> {
  const links: Array<{ label: string; href: string }> = [];
  const seen = new Set<string>();
  const linkPattern = /\[\[([^|]+)\|([^\]]+)\]\]/g;
  let match;

  while ((match = linkPattern.exec(text)) !== null) {
    if (!seen.has(match[2])) {
      seen.add(match[2]);
      links.push({ label: match[1], href: match[2] });
    }
  }

  return links;
}

// ─── Rendered response with inline links ─────────────────────────────────────

function ResponseBody({ text, isStreaming }: { text: string; isStreaming: boolean }) {
  const segments = parseResponse(text);

  return (
    <p className="text-sm leading-relaxed font-serif text-bsi-bone">
      {segments.map((seg, i) =>
        seg.type === 'link' ? (
          <Link
            key={i}
            href={seg.href!}
            className="underline underline-offset-2 transition-colors font-semibold"
            style={{ color: 'var(--heritage-columbia-blue)', textDecorationColor: 'rgba(75, 156, 211, 0.3)' }}
          >
            {seg.content}
          </Link>
        ) : (
          <span key={i}>{seg.content}</span>
        )
      )}
      {isStreaming && (
        <span className="inline-block w-1.5 h-4 bg-burnt-orange/60 ml-0.5 animate-pulse" />
      )}
    </p>
  );
}

// ─── Action strip — quick-nav cards from response links ──────────────────────

function ActionStrip({ links }: { links: Array<{ label: string; href: string }> }) {
  if (links.length === 0) return null;

  return (
    <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border-vintage)' }}>
      <p className="text-[9px] uppercase tracking-[0.15em] mb-2" style={{ color: 'var(--heritage-bronze)', fontFamily: 'var(--bsi-font-data)' }}>
        Go to
      </p>
      <div className="flex flex-wrap gap-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 transition-all duration-200 font-semibold heritage-stamp"
            style={{ color: 'var(--heritage-columbia-blue)', borderColor: 'rgba(75, 156, 211, 0.3)' }}
          >
            <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 3l5 5-5 5" />
            </svg>
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

interface AskBSIProps {
  embedded?: boolean;
  initialQuestion?: string;
}

export function AskBSI({ embedded = false, initialQuestion }: AskBSIProps) {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const initialFired = useRef(false);
  const usageCount = typeof window !== 'undefined' ? getAskCount() : 0;

  const askQuestion = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed || streaming) return;

    // Rate limit check (free tier)
    const count = getAskCount();
    if (count >= MAX_FREE_QUESTIONS) {
      setError(`You've used your ${MAX_FREE_QUESTIONS} free questions. Refresh the page or sign up for unlimited access.`);
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
      setError(err instanceof Error ? err.message : 'Couldn\'t get a response — try again in a moment.');
    } finally {
      setStreaming(false);
    }
  }, [streaming]);

  // Auto-submit if an initial question was passed (e.g. from homepage redirect)
  useEffect(() => {
    if (initialQuestion && !initialFired.current) {
      initialFired.current = true;
      setQuestion(initialQuestion);
      askQuestion(initialQuestion);
    }
  }, [initialQuestion, askQuestion]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    askQuestion(question);
  };

  const responseLinks = response ? extractLinks(response) : [];

  const panel = (
    <div
      data-home-ask={embedded ? 'embedded' : 'standalone'}
      className={`heritage-card p-5 sm:p-6 ${embedded ? 'h-full' : ''}`}
      style={{ borderLeftWidth: '2px', borderLeftColor: 'var(--heritage-bronze)' }}
    >
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 flex items-center justify-center shrink-0" style={{ border: '1px solid var(--border-vintage)', borderRadius: '2px', background: 'rgba(191, 87, 0, 0.08)' }}>
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-burnt-orange" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                <path d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
              </svg>
            </div>
            <div>
              <h3 className="font-display text-sm font-bold uppercase tracking-wide text-[var(--bsi-bone)]">
                Ask BSI
              </h3>
              <span className="heritage-stamp" style={{ padding: '1px 6px', fontSize: '8px' }}>
                Concierge
              </span>
            </div>
          </div>

          {/* Example chips — heritage stamp pills */}
          <div className="flex flex-wrap gap-2 mb-4">
            {EXAMPLE_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => askQuestion(prompt)}
                disabled={streaming}
                className="text-[11px] px-3 py-1.5 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  borderRadius: '2px',
                  border: '1px solid var(--border-vintage)',
                  background: 'transparent',
                  color: 'var(--bsi-dust)',
                  fontFamily: 'var(--bsi-font-data)',
                }}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input — dark with thin heritage-bronze bottom border */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask about any sport, stat, team, or feature..."
              disabled={streaming}
              className="flex-1 px-4 py-2.5 text-sm transition-all disabled:opacity-50 focus:outline-none"
              style={{
                borderRadius: '2px',
                border: 'none',
                borderBottom: '1px solid var(--border-vintage)',
                background: 'rgba(255,255,255,0.02)',
                color: 'var(--bsi-bone)',
                fontFamily: 'var(--bsi-font-data)',
              }}
            />
            <button
              type="submit"
              disabled={streaming || !question.trim()}
              className="btn-heritage-fill shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ padding: '0.625rem 1rem' }}
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
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-vintage)' }}>
              {error ? (
                <p className="text-sm" style={{ color: 'var(--heritage-oiler-red)' }}>{error}</p>
              ) : (
                <>
                  <ResponseBody text={response} isStreaming={streaming} />
                  {!streaming && <ActionStrip links={responseLinks} />}
                </>
              )}
            </div>
          )}

          {/* Usage counter — heritage stamp */}
          <div className="mt-3 flex justify-end">
            <span className="heritage-stamp" style={{ padding: '1px 6px', fontSize: '8px', color: 'var(--bsi-dust)' }}>
              {MAX_FREE_QUESTIONS - usageCount} / {MAX_FREE_QUESTIONS} remaining
            </span>
          </div>
    </div>
  );

  if (embedded) return panel;

  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">{panel}</div>
    </section>
  );
}
