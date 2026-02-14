'use client';

import { useState, useEffect } from 'react';

interface NotebookLMExportProps {
  articleText: string;
  className?: string;
}

export function NotebookLMExport({ articleText, className = '' }: NotebookLMExportProps) {
  const [step, setStep] = useState<'idle' | 'copied' | 'opened'>('idle');

  useEffect(() => {
    if (step === 'opened') {
      const timer = setTimeout(() => setStep('idle'), 10000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleExport = async () => {
    try {
      await navigator.clipboard.writeText(articleText);
      setStep('copied');
      setTimeout(() => {
        window.open('https://notebooklm.google.com/', '_blank');
        setStep('opened');
      }, 500);
    } catch {
      // Clipboard unavailable
    }
  };

  return (
    <div className={`text-center ${className}`}>
      {step === 'idle' && (
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#BF5700] hover:bg-[#FF6B35] text-white font-display uppercase tracking-wider text-sm rounded transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          Turn This Recap Into a Podcast
        </button>
      )}
      {step === 'copied' && (
        <p className="font-mono text-sm text-[#BF5700] animate-pulse">
          Copying article text...
        </p>
      )}
      {step === 'opened' && (
        <div className="space-y-2">
          <p className="font-mono text-sm text-[#BF5700]">
            Article copied to clipboard
          </p>
          <p className="text-white/60 text-sm">
            Paste into NotebookLM, then click <strong className="text-white/80">Generate Audio Overview</strong>
          </p>
        </div>
      )}
    </div>
  );
}
