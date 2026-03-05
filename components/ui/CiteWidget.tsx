'use client';

import { useState } from 'react';

interface CiteWidgetProps {
  title: string;
  path: string;
  /** ISO date string, e.g. '2026-02-17' */
  date?: string;
  author?: string;
}

type Format = 'apa' | 'bibtex';

function formatApa(title: string, author: string, date: string, url: string): string {
  const year = date.slice(0, 4);
  const month = new Date(date + 'T12:00:00').toLocaleString('en-US', { month: 'long' });
  const day = new Date(date + 'T12:00:00').getDate();
  return `${author}. (${year}, ${month} ${day}). ${title}. Blaze Sports Intel. ${url}`;
}

function formatBibtex(title: string, author: string, date: string, url: string): string {
  const year = date.slice(0, 4);
  const key = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `@misc{bsi-${key},
  author = {${author}},
  title = {${title}},
  year = {${year}},
  url = {${url}},
  note = {Blaze Sports Intel}
}`;
}

/**
 * CiteWidget — generates APA or BibTeX citation with copy-to-clipboard.
 * Used on model/methodology pages for academic discoverability.
 */
export function CiteWidget({ title, path, date = '2026-02-17', author = 'Austin Humphrey' }: CiteWidgetProps) {
  const [format, setFormat] = useState<Format>('apa');
  const [copied, setCopied] = useState(false);

  const url = `https://blazesportsintel.com${path}`;
  const text = format === 'apa'
    ? formatApa(title, author, date, url)
    : formatBibtex(title, author, date, url);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard API unavailable — select the text so user can Cmd+C / Ctrl+C
      const pre = document.querySelector<HTMLPreElement>('[data-cite-text]');
      if (pre) {
        const range = document.createRange();
        range.selectNodeContents(pre);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-surface-light border border-border-subtle rounded-xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Cite this page</span>
        <div className="flex gap-1">
          {(['apa', 'bibtex'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              aria-pressed={format === f}
              className={`px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wider border transition-all ${
                format === f
                  ? 'bg-burnt-orange/20 text-burnt-orange border-burnt-orange/30'
                  : 'bg-surface-light text-text-muted border-border hover:text-text-secondary'
              }`}
            >
              {f === 'apa' ? 'APA' : 'BibTeX'}
            </button>
          ))}
        </div>
      </div>
      <pre data-cite-text className="text-xs text-text-muted bg-surface-light rounded-lg p-3 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
        {text}
      </pre>
      <button
        onClick={handleCopy}
        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-light border border-border text-text-muted hover:text-text-secondary hover:border-border-strong transition-all"
      >
        {copied ? (
          <>
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            Copied
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
            Copy citation
          </>
        )}
      </button>
    </div>
  );
}
