'use client';

import { useState } from 'react';

interface GameRecapToolbarProps {
  onOpenAI: () => void;
  onOpenPodcast: () => void;
  articleUrl: string;
}

export function GameRecapToolbar({ onOpenAI, onOpenPodcast, articleUrl }: GameRecapToolbarProps) {
  const [shareCopied, setShareCopied] = useState(false);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(articleUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      /* noop */
    }
  };

  return (
    <div className="sticky top-0 z-40 backdrop-blur-md bg-[#0D0D0D]/80 border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-1 sm:gap-2">
            {/* AI Analysis */}
            <button
              onClick={onOpenAI}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-white/60 hover:text-[#BF5700] hover:bg-[#BF5700]/10 text-xs sm:text-sm font-mono uppercase tracking-wider transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
              </svg>
              <span className="hidden sm:inline">AI Analysis</span>
              <span className="sm:hidden">AI</span>
            </button>

            {/* Podcast */}
            <button
              onClick={onOpenPodcast}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-white/60 hover:text-[#BF5700] hover:bg-[#BF5700]/10 text-xs sm:text-sm font-mono uppercase tracking-wider transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <span className="hidden sm:inline">Podcast</span>
            </button>
          </div>

          {/* Share */}
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-white/60 hover:text-[#BF5700] hover:bg-[#BF5700]/10 text-xs sm:text-sm font-mono uppercase tracking-wider transition-all"
          >
            {shareCopied ? (
              <>
                <svg className="w-4 h-4 text-[#BF5700]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-[#BF5700]">Copied</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.54a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L5.76 8.688" />
                </svg>
                <span className="hidden sm:inline">Share</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
