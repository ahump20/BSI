'use client';

import { useCallback, useState } from 'react';

/**
 * Estimate reading time at ~200 WPM.
 */
export function estimateReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

interface ArticleMetaProps {
  /** Reading time in minutes */
  readingTime: number;
  /** Title for share (optional — defaults to document.title) */
  shareTitle?: string;
  /** URL for share (optional — defaults to current page) */
  shareUrl?: string;
}

/**
 * Inline reading time + share button for editorial pages.
 * Uses Web Share API where available, clipboard fallback elsewhere.
 */
export function ArticleMeta({ readingTime, shareTitle, shareUrl }: ArticleMetaProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    const url = shareUrl || (typeof window !== 'undefined' ? window.location.href : '');
    const title = shareTitle || (typeof document !== 'undefined' ? document.title : '');

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // User cancelled or not supported — fall through to clipboard
      }
    }

    // Clipboard fallback
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Clipboard failed silently
      }
    }
  }, [shareTitle, shareUrl]);

  return (
    <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--bsi-dust)', fontFamily: 'var(--bsi-font-data)' }}>
      <span className="flex items-center gap-1.5">
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        {readingTime} min read
      </span>
      <button
        onClick={handleShare}
        className="flex items-center gap-1.5 hover:text-[var(--bsi-primary)] transition-colors"
        aria-label="Share this article"
      >
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
        {copied ? 'Copied!' : 'Share'}
      </button>
    </div>
  );
}
