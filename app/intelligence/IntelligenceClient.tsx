'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';

const PROMPTS = [
  {
    label: 'Transfer Portal',
    description: 'College baseball transfer ecosystem',
    question: "Analyze the strategic dynamics of the college baseball transfer portal. What separates programs that use it as a competitive advantage from those that use it as a crutch? Name specific program archetypes.",
  },
  {
    label: 'Big 12 Hoops',
    description: 'Conference title race dynamics',
    question: "Break down the Big 12 basketball title race. What metrics actually predict late-season performance in this conference, and which storylines is mainstream media getting wrong?",
  },
  {
    label: 'MLB Prospects',
    description: 'Scouting metric weighting',
    question: "How should scouts weight exit velocity versus barrel rate versus xwOBA when projecting a high school hitter's major league ceiling? Walk through the tension between tools and production.",
  },
  {
    label: 'NFL Combine',
    description: 'Athletic testing vs. production',
    question: "Which NFL combine metrics have the strongest correlation to on-field production by position, and where does the league consistently overweight athleticism over football IQ? Be specific by position.",
  },
];

// Only the last FRESH_WINDOW chars get individual spans with the color-fade transition.
// Everything before that is a single stable text node — O(15) renders regardless of output length.
const FRESH_WINDOW = 15;

// Parse minimal markdown into React nodes for the stable output region.
// Handles **bold**, *italic*, and \n line breaks.
function renderMarkdown(text: string): React.ReactNode[] {
  const segments = text.split(/(\*\*[^*]+\*\*|\*[^*\n]+\*|\n)/g);
  return segments.map((seg, i) => {
    if (seg === '\n') return <br key={i} />;
    if (seg.startsWith('**') && seg.endsWith('**') && seg.length > 4)
      return <strong key={i}>{seg.slice(2, -2)}</strong>;
    if (seg.startsWith('*') && seg.endsWith('*') && seg.length > 2)
      return <em key={i}>{seg.slice(1, -1)}</em>;
    return seg || null;
  });
}

interface Metrics {
  timeToFirstToken: number | null;
  charsPerSec: number | null;
  totalChars: number;
  elapsed: number | null;
}

const EMPTY_METRICS: Metrics = {
  timeToFirstToken: null,
  charsPerSec: null,
  totalChars: 0,
  elapsed: null,
};

export function IntelligenceClient() {
  const [selectedPrompt, setSelectedPrompt] = useState(0);
  const [isStreaming, setIsStreaming] = useState(false);
  const [stableText, setStableText] = useState('');
  const [freshChars, setFreshChars] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<Metrics>(EMPTY_METRICS);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [cacheStatus, setCacheStatus] = useState<'HIT' | 'MISS' | null>(null);

  // Refs hold values that don't need to trigger renders
  const fullTextRef = useRef('');
  const startTimeRef = useRef(0);
  const firstTokenTimeRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const metricsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (metricsIntervalRef.current) clearInterval(metricsIntervalRef.current);
    };
  }, []);

  const appendText = useCallback((chunk: string) => {
    if (firstTokenTimeRef.current === null) {
      firstTokenTimeRef.current = performance.now() - startTimeRef.current;
    }

    const full = (fullTextRef.current += chunk);

    if (full.length <= FRESH_WINDOW) {
      setStableText('');
      setFreshChars(full.split(''));
    } else {
      setStableText(full.slice(0, -FRESH_WINDOW));
      setFreshChars(full.slice(-FRESH_WINDOW).split(''));
    }
  }, []);

  const snapshotMetrics = useCallback(() => {
    const elapsed = performance.now() - startTimeRef.current;
    const total = fullTextRef.current.length;
    setMetrics({
      timeToFirstToken: firstTokenTimeRef.current,
      charsPerSec: elapsed > 0 ? Math.round((total / elapsed) * 1000) : 0,
      totalChars: total,
      elapsed: Math.round(elapsed),
    });
  }, []);

  const stream = useCallback(async () => {
    if (isStreaming) {
      abortRef.current?.abort();
      return;
    }

    // Reset
    fullTextRef.current = '';
    firstTokenTimeRef.current = null;
    setStableText('');
    setFreshChars([]);
    setError(null);
    setMetrics(EMPTY_METRICS);
    setCacheStatus(null);
    setIsStreaming(true);

    const abort = new AbortController();
    abortRef.current = abort;
    startTimeRef.current = performance.now();

    metricsIntervalRef.current = setInterval(snapshotMetrics, 120);

    try {
      const response = await fetch('/api/intelligence/v1/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: PROMPTS[selectedPrompt].question,
          analysisType: 'pregame',
        }),
        signal: abort.signal,
      });

      if (response.status === 429) {
        throw new Error('Rate limited — try again in 60s');
      }
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`API error ${response.status}: ${text}`);
      }

      setCacheStatus((response.headers.get('X-BSI-Cache') as 'HIT' | 'MISS') ?? null);

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (!data || data === '[DONE]') continue;

          try {
            // bsi-intelligence-stream sends { text: string } or { done: true }
            const parsed = JSON.parse(data) as { text?: string; done?: boolean; cached?: boolean };
            if (parsed.text) appendText(parsed.text);
          } catch {
            // malformed SSE chunk — skip
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      if (metricsIntervalRef.current) clearInterval(metricsIntervalRef.current);
      snapshotMetrics();
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [isStreaming, selectedPrompt, appendText, snapshotMetrics]);

  const hasOutput = stableText.length > 0 || freshChars.length > 0;
  const hasMetrics = metrics.totalChars > 0 || isStreaming;

  return (
    <>
      <style>{`
        @keyframes scan-line {
          0%   { top: -1px; opacity: 0.7; }
          80%  { opacity: 0.3; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes cursor-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        @keyframes stagger-fade-up {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .prompt-btn {
          animation: stagger-fade-up 0.35s ease both;
        }
        .scan-line {
          animation: scan-line 1.4s linear infinite;
        }
        .cursor {
          animation: cursor-blink 1s step-end infinite;
        }
        .fresh-char {
          transition: color 1.4s ease;
        }
      `}</style>

      <main
        className="min-h-screen px-4 py-12 md:py-20"
        style={{ backgroundColor: '#0A0A0A' }}
      >
        <div className="max-w-3xl mx-auto">

          {/* Header */}
          <div className="mb-10">
            <p
              className="text-xs tracking-[0.25em] uppercase mb-3"
              style={{ color: '#BF5700', fontFamily: 'var(--font-mono)' }}
            >
              BSI Intelligence · Claude Sonnet 4
            </p>
            <h1
              className="text-4xl md:text-5xl uppercase mb-4 text-white"
              style={{ fontFamily: 'var(--font-oswald)', letterSpacing: '0.05em' }}
            >
              Streaming Analysis
            </h1>
            <p
              className="text-sm text-gray-400 leading-relaxed max-w-xl"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Claude Sonnet 4 generating sports analysis in real time via BSI&apos;s
              Cloudflare edge network. Select a topic, watch the analysis build.
            </p>
          </div>

          {/* Divider */}
          <div
            className="mb-8 h-px"
            style={{
              background: 'linear-gradient(90deg, #BF5700, transparent)',
              boxShadow: '0 0 8px #BF570040',
            }}
          />

          {/* Prompt Selector */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
            {PROMPTS.map((p, i) => {
              const active = selectedPrompt === i;
              return (
                <button
                  key={p.label}
                  onClick={() => setSelectedPrompt(i)}
                  disabled={isStreaming}
                  className="prompt-btn text-left px-3 py-3 border text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    animationDelay: mounted ? `${i * 75}ms` : '0ms',
                    fontFamily: 'var(--font-mono)',
                    borderColor: active ? '#BF5700' : '#2a2a2a',
                    backgroundColor: active ? '#BF570015' : 'transparent',
                  }}
                >
                  <div
                    className="font-semibold mb-0.5 text-[11px]"
                    style={{ color: active ? '#FF6B35' : '#ccc' }}
                  >
                    {p.label}
                  </div>
                  <div className="text-[10px] leading-tight" style={{ color: active ? '#BF5700' : '#555' }}>
                    {p.description}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Stream / Stop Button */}
          <button
            onClick={stream}
            className="w-full py-3 mb-8 text-sm uppercase tracking-widest font-semibold transition-all"
            style={{
              fontFamily: 'var(--font-oswald)',
              letterSpacing: '0.2em',
              backgroundColor: isStreaming ? 'transparent' : '#BF5700',
              color: isStreaming ? '#BF5700' : '#fff',
              border: isStreaming ? '1px solid #BF5700' : '1px solid transparent',
            }}
          >
            {isStreaming ? '◼  STOP' : '▶  STREAM'}
          </button>

          {/* Metrics */}
          {hasMetrics && (
            <div
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 border"
              style={{ borderColor: '#1a1a1a' }}
            >
              <div>
                <div
                  className="text-[9px] uppercase tracking-widest mb-1"
                  style={{ color: '#555', fontFamily: 'var(--font-mono)' }}
                >
                  First Token
                </div>
                <div
                  className="text-xl font-semibold"
                  style={{ color: '#BF5700', fontFamily: 'var(--font-mono)' }}
                >
                  {metrics.timeToFirstToken !== null
                    ? `${metrics.timeToFirstToken.toFixed(0)}ms`
                    : '—'}
                </div>
              </div>
              <div>
                <div
                  className="text-[9px] uppercase tracking-widest mb-1"
                  style={{ color: '#555', fontFamily: 'var(--font-mono)' }}
                >
                  Chars / Sec
                </div>
                <div
                  className="text-xl font-semibold"
                  style={{ color: '#BF5700', fontFamily: 'var(--font-mono)' }}
                >
                  {metrics.charsPerSec ?? '—'}
                </div>
              </div>
              <div>
                <div
                  className="text-[9px] uppercase tracking-widest mb-1"
                  style={{ color: '#555', fontFamily: 'var(--font-mono)' }}
                >
                  Total Chars
                </div>
                <div
                  className="text-xl font-semibold"
                  style={{ color: '#BF5700', fontFamily: 'var(--font-mono)' }}
                >
                  {metrics.totalChars}
                </div>
              </div>
              <div>
                <div
                  className="text-[9px] uppercase tracking-widest mb-1"
                  style={{ color: '#555', fontFamily: 'var(--font-mono)' }}
                >
                  Cache
                </div>
                <div
                  className="text-xl font-semibold"
                  style={{
                    color: cacheStatus === 'HIT' ? '#22c55e' : cacheStatus === 'MISS' ? '#BF5700' : '#444',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {cacheStatus ?? (isStreaming ? '…' : '—')}
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              className="mb-6 p-3 border text-xs"
              style={{ borderColor: '#7f1d1d', color: '#fca5a5', fontFamily: 'var(--font-mono)' }}
            >
              ✗ {error}
            </div>
          )}

          {/* Output Area */}
          {hasOutput && (
            <>
              <div
                className="h-px mb-3"
                style={{
                  background: 'linear-gradient(90deg, transparent, #BF5700, transparent)',
                  boxShadow: '0 0 8px #BF570040',
                }}
              />

              <div
                className="relative overflow-hidden p-6 border"
                style={{ backgroundColor: '#080808', borderColor: '#1a1a1a', minHeight: '160px' }}
              >
                {/* Scan line — only visible while streaming */}
                {isStreaming && (
                  <div
                    className="scan-line absolute left-0 right-0 h-px pointer-events-none"
                    style={{ backgroundColor: '#BF5700' }}
                  />
                )}

                {/* Text output */}
                <p
                  className="text-base leading-relaxed"
                  style={{ fontFamily: 'var(--font-playfair)', color: '#d4d4d4', fontSize: '1.05rem' }}
                >
                  {/* Stable region — markdown-parsed React nodes */}
                  {renderMarkdown(stableText)}

                  {/* Fresh region — last 15 chars with color transition, newest = most orange */}
                  {freshChars.map((char, i) => {
                    const ratio = i / Math.max(FRESH_WINDOW - 1, 1);
                    // Oldest char (i=0): near normal text gray. Newest (i=14): ember orange.
                    const h = Math.round(ratio * 22);
                    const s = Math.round(ratio * 90);
                    const l = Math.round(83 - ratio * 25);
                    return (
                      <span
                        key={stableText.length + i}
                        className="fresh-char"
                        style={{ color: `hsl(${h}, ${s}%, ${l}%)` }}
                      >
                        {char}
                      </span>
                    );
                  })}

                  {/* Terminal cursor */}
                  {isStreaming && (
                    <span
                      className="cursor inline-block w-0.5 h-[1em] align-text-bottom ml-px"
                      style={{ backgroundColor: '#BF5700' }}
                    />
                  )}
                </p>
              </div>

              <div
                className="h-px mt-3"
                style={{
                  background: 'linear-gradient(90deg, transparent, #BF5700, transparent)',
                  boxShadow: '0 0 8px #BF570040',
                }}
              />
            </>
          )}

          {/* Empty state */}
          {!hasOutput && !isStreaming && !error && (
            <div
              className="text-center py-16 text-xs uppercase tracking-widest"
              style={{ color: '#333', fontFamily: 'var(--font-mono)' }}
            >
              Select a topic · press stream
            </div>
          )}

          {/* Footer */}
          <p
            className="mt-12 text-center text-[10px]"
            style={{ color: '#2a2a2a', fontFamily: 'var(--font-mono)' }}
          >
            Claude Sonnet 4 · bsi-intelligence-stream · Cloudflare Edge
          </p>
        </div>
      </main>
    </>
  );
}
