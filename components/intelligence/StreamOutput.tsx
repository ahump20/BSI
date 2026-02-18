'use client';

import React from 'react';

// Only the last FRESH_WINDOW chars get individual color-fade spans.
// Everything before is a single stable text node — O(1) React diff regardless of output length.
export const FRESH_WINDOW = 15;

// Parse minimal markdown into React nodes.
// Handles **bold**, *italic*, and \n line breaks.
export function renderMarkdown(text: string): React.ReactNode[] {
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

export interface StreamOutputProps {
  stableText: string;
  freshChars: string[];
  isStreaming: boolean;
  /** Font size override — defaults to 1.05rem */
  fontSize?: string;
  /** Minimum height of the output box */
  minHeight?: string;
}

export function StreamOutput({
  stableText,
  freshChars,
  isStreaming,
  fontSize = '1.05rem',
  minHeight = '160px',
}: StreamOutputProps) {
  return (
    <>
      <style>{`
        @keyframes bsi-scan-line {
          0%   { top: -1px; opacity: 0.7; }
          80%  { opacity: 0.3; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes bsi-cursor-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        .bsi-scan-line   { animation: bsi-scan-line 1.4s linear infinite; }
        .bsi-cursor      { animation: bsi-cursor-blink 1s step-end infinite; }
        .bsi-fresh-char  { transition: color 1.4s ease; }
      `}</style>

      <div
        className="h-px mb-3"
        style={{
          background: 'linear-gradient(90deg, transparent, #BF5700, transparent)',
          boxShadow: '0 0 8px #BF570040',
        }}
      />

      <div
        className="relative overflow-hidden p-6 border"
        style={{ backgroundColor: '#080808', borderColor: '#1a1a1a', minHeight }}
      >
        {/* Scan line — only visible while streaming */}
        {isStreaming && (
          <div
            className="bsi-scan-line absolute left-0 right-0 h-px pointer-events-none"
            style={{ backgroundColor: '#BF5700' }}
          />
        )}

        <p
          className="leading-relaxed"
          style={{ fontFamily: 'var(--font-playfair)', color: '#d4d4d4', fontSize }}
        >
          {/* Stable region — markdown-parsed, single React node after the fresh window */}
          {renderMarkdown(stableText)}

          {/* Fresh region — last FRESH_WINDOW chars with color transition; newest = most orange */}
          {freshChars.map((char, i) => {
            const ratio = i / Math.max(FRESH_WINDOW - 1, 1);
            const h = Math.round(ratio * 22);
            const s = Math.round(ratio * 90);
            const l = Math.round(83 - ratio * 25);
            return (
              <span
                key={stableText.length + i}
                className="bsi-fresh-char"
                style={{ color: `hsl(${h}, ${s}%, ${l}%)` }}
              >
                {char}
              </span>
            );
          })}

          {/* Terminal cursor */}
          {isStreaming && (
            <span
              className="bsi-cursor inline-block w-0.5 h-[1em] align-text-bottom ml-px"
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
  );
}
