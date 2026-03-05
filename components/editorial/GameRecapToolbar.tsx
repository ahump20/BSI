'use client';

import { useState } from 'react';

interface GameRecapToolbarProps {
  onOpenAI: () => void;
  articleText: string;
  articleUrl: string;
}

export function GameRecapToolbar({ onOpenAI, articleText, articleUrl }: GameRecapToolbarProps) {
  const [podcastCopied, setPodcastCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const handlePodcast = async () => {
    try {
      await navigator.clipboard.writeText(articleText);
      setPodcastCopied(true);
      window.open('https://notebooklm.google.com/', '_blank');
      setTimeout(() => setPodcastCopied(false), 8000);
    } catch {
      // Clipboard API not available
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(articleUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 3000);
    } catch {
      // Clipboard API not available
    }
  };

  return (
    <div className="sticky top-0 z-40 backdrop-blur-md bg-background-primary/80 border-b border-border">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <span className="hidden sm:block font-mono text-[10px] uppercase tracking-widest text-burnt-orange">
          Game Recap
        </span>
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          <button
            onClick={onOpenAI}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-text-secondary hover:text-burnt-orange border border-border hover:border-burnt-orange/30 rounded transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            AI Analysis
          </button>
          <button
            onClick={handlePodcast}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-text-secondary hover:text-burnt-orange border border-border hover:border-burnt-orange/30 rounded transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            {podcastCopied ? 'Copied — Paste in NotebookLM' : 'Podcast'}
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-text-secondary hover:text-burnt-orange border border-border hover:border-burnt-orange/30 rounded transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            {shareCopied ? 'Copied!' : 'Share'}
          </button>
        </div>
      </div>
    </div>
  );
}
