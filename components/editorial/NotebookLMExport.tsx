'use client';

import { useState } from 'react';
import { X, Copy, Check, ExternalLink } from 'lucide-react';

interface NotebookLMExportProps {
  isOpen: boolean;
  onClose: () => void;
  gameTitle: string;
  recapText: string;
}

export function NotebookLMExport({ isOpen, onClose, gameTitle, recapText }: NotebookLMExportProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(recapText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = recapText;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  }

  function handleOpenNotebookLM() {
    window.open('https://notebooklm.google.com', '_blank');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-[#0D0D0D] border border-white/10 rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">Generate Podcast</h3>
          <button
            onClick={onClose}
            className="p-1 text-white/40 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-6">
          <p className="text-sm text-white/60 leading-relaxed">
            Turn this game recap into an AI-generated podcast with Google NotebookLM.
            Copy the recap text below, then paste it as a source in NotebookLM.
          </p>

          {/* Preview */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 max-h-32 overflow-y-auto">
            <p className="text-xs text-white/40 font-mono leading-relaxed line-clamp-4">
              {recapText.slice(0, 300)}...
            </p>
          </div>

          {/* Step 1: Copy */}
          <button
            onClick={handleCopy}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all ${
              copied
                ? 'bg-green-600/20 text-green-400 border border-green-500/30'
                : 'bg-[#BF5700]/20 text-[#BF5700] border border-[#BF5700]/30 hover:bg-[#BF5700]/30'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied to Clipboard
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Step 1: Copy Recap Text
              </>
            )}
          </button>

          {/* Step 2: Open NotebookLM */}
          <button
            onClick={handleOpenNotebookLM}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            Step 2: Open NotebookLM
          </button>

          <p className="text-xs text-white/30 text-center">
            Paste the recap as a source in NotebookLM, then click &ldquo;Audio Overview&rdquo; to generate your podcast.
          </p>
        </div>
      </div>
    </div>
  );
}
