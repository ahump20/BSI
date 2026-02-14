'use client';

import { useState } from 'react';

interface NotebookLMExportProps {
  articleText: string;
  className?: string;
}

export function NotebookLMExport({ articleText, className = '' }: NotebookLMExportProps) {
  const [step, setStep] = useState<'idle' | 'copied' | 'opened'>('idle');

  const handleExport = async () => {
    try {
      await navigator.clipboard.writeText(articleText);
      setStep('copied');
      setTimeout(() => {
        window.open('https://notebooklm.google.com/', '_blank');
        setStep('opened');
      }, 300);
      setTimeout(() => setStep('idle'), 10000);
    } catch {
      setStep('idle');
    }
  };

  if (step === 'opened') {
    return (
      <div className={className}>
        <div className="flex items-center gap-3 px-6 py-4 rounded-lg border border-[#BF5700]/30 bg-[#BF5700]/10">
          <svg className="w-5 h-5 text-[#BF5700] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-sm text-white/70">
            <span className="text-white font-semibold">Article copied!</span>{' '}
            Paste into NotebookLM &rarr; Click &ldquo;Generate Audio Overview&rdquo;
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <button
        onClick={handleExport}
        className="group flex items-center gap-3 px-6 py-3 rounded-lg bg-[#BF5700] hover:bg-[#FF6B35] text-white font-display uppercase tracking-wider text-sm transition-all duration-200 hover:shadow-[0_0_20px_rgba(191,87,0,0.3)]"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
        <span>Turn Into Podcast</span>
        <svg className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </button>
    </div>
  );
}
