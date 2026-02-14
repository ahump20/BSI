'use client';

import { useState } from 'react';
import { Brain, Headphones, Share2 } from 'lucide-react';
import { AIAnalysisPanel } from './AIAnalysisPanel';
import { NotebookLMExport } from './NotebookLMExport';

interface GameRecapToolbarProps {
  gameId: string;
  gameTitle: string;
  gameContext: string;
  recapText: string;
}

export function GameRecapToolbar({ gameId, gameTitle, gameContext, recapText }: GameRecapToolbarProps) {
  const [showAI, setShowAI] = useState(false);
  const [showPodcast, setShowPodcast] = useState(false);

  async function handleShare() {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const shareData = { title: gameTitle, url };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled share — no action needed
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        // Clipboard fallback
      }
    }
  }

  return (
    <>
      <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            <span className="text-sm font-medium text-white/60 truncate mr-4">{gameTitle}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowAI(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/60 hover:text-[#BF5700] hover:bg-[#BF5700]/10 transition-all"
              >
                <Brain className="w-4 h-4" />
                <span className="hidden sm:inline">AI Analysis</span>
              </button>
              <button
                onClick={() => setShowPodcast(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/60 hover:text-[#BF5700] hover:bg-[#BF5700]/10 transition-all"
              >
                <Headphones className="w-4 h-4" />
                <span className="hidden sm:inline">Podcast</span>
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/60 hover:text-[#BF5700] hover:bg-[#BF5700]/10 transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <AIAnalysisPanel isOpen={showAI} onClose={() => setShowAI(false)} gameContext={gameContext} />
      <NotebookLMExport isOpen={showPodcast} onClose={() => setShowPodcast(false)} gameTitle={gameTitle} recapText={recapText} />
    </>
  );
}
