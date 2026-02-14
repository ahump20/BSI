'use client';

import { useState } from 'react';

interface AIAnalysisPanelProps {
  isOpen: boolean;
  onClose: () => void;
  gameContext: string;
}

const PROMPTS = [
  {
    id: 'matchup',
    label: 'Matchup Breakdown',
    description: 'Pitching vs batting analysis',
    prompt: 'Break down the pitching vs batting matchup in this game. Analyze Riojas\'s dominance, the Texas lineup approach, and why UC Davis couldn\'t sustain offense.',
  },
  {
    id: 'portal',
    label: 'Transfer Portal Report Card',
    description: 'Grade each portal addition\'s debut',
    prompt: 'Grade every transfer portal addition\'s debut performance: Ashton Larson (Wake Forest), Temo Becerra (Stanford), and any other portal arrivals. Include statistical context and what their performances suggest for the season.',
  },
  {
    id: 'omaha',
    label: 'Omaha Implications',
    description: 'What this means for the CWS path',
    prompt: 'Analyze what this opening-night performance tells us about Texas\'s College World Series chances. Consider pitching depth, offensive balance, freshman contributions, and areas of concern.',
  },
];

export function AIAnalysisPanel({ isOpen, onClose, gameContext }: AIAnalysisPanelProps) {
  const [selectedModel, setSelectedModel] = useState<'claude' | 'gemini'>('claude');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');

  const handlePrompt = async (prompt: string) => {
    setLoading(true);
    setError('');
    setResponse('');

    try {
      const res = await fetch('/api/ai/game-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: selectedModel, prompt, gameContext }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error || 'Analysis request failed');
      }

      const data = (await res.json()) as { analysis: string };
      setResponse(data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (response) {
      await navigator.clipboard.writeText(response);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={onClose} />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-[480px] bg-[#0D0D0D] border-l border-white/10 z-50 flex flex-col overflow-hidden animate-[slideInRight_0.3s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide text-white">
            AI Game Analysis
          </h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Model Toggle */}
        <div className="px-6 py-3 border-b border-white/5">
          <div className="flex gap-1 p-1 rounded-lg bg-white/5">
            <button
              onClick={() => setSelectedModel('claude')}
              className={`flex-1 py-2 px-3 rounded-md text-xs font-mono uppercase tracking-wider transition-all ${
                selectedModel === 'claude'
                  ? 'bg-[#BF5700] text-white'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              Claude
            </button>
            <button
              onClick={() => setSelectedModel('gemini')}
              className={`flex-1 py-2 px-3 rounded-md text-xs font-mono uppercase tracking-wider transition-all ${
                selectedModel === 'gemini'
                  ? 'bg-[#BF5700] text-white'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              Gemini
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {!response && !loading && (
            <>
              <p className="text-white/30 text-xs font-mono uppercase tracking-wider mb-3">
                Choose an analysis
              </p>

              {PROMPTS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handlePrompt(p.prompt)}
                  className="w-full text-left p-4 rounded-lg border border-white/10 hover:border-[#BF5700]/40 bg-white/[0.02] hover:bg-[#BF5700]/5 transition-all group"
                >
                  <div className="font-display text-sm font-bold uppercase tracking-wide text-white group-hover:text-[#BF5700] transition-colors">
                    {p.label}
                  </div>
                  <div className="text-white/30 text-xs mt-1">{p.description}</div>
                </button>
              ))}

              <div className="pt-2">
                <p className="text-white/30 text-xs font-mono uppercase tracking-wider mb-2">
                  Or ask anything
                </p>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Ask about this game..."
                  className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:border-[#BF5700]/40 focus:outline-none resize-none"
                  rows={3}
                />
                <button
                  onClick={() => customPrompt.trim() && handlePrompt(customPrompt)}
                  disabled={!customPrompt.trim()}
                  className="mt-2 w-full py-2 px-4 rounded-lg bg-white/5 hover:bg-[#BF5700]/20 text-white/60 hover:text-white text-sm font-display uppercase tracking-wider transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Analyze
                </button>
              </div>
            </>
          )}

          {loading && (
            <div className="space-y-3 py-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-2 rounded-full bg-[#BF5700] animate-pulse" />
                <span className="text-white/40 text-xs font-mono uppercase tracking-wider">
                  {selectedModel === 'claude' ? 'Claude' : 'Gemini'} is analyzing...
                </span>
              </div>
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-4 rounded bg-white/5 animate-pulse"
                  style={{ width: `${70 + Math.random() * 30}%`, animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          )}

          {error && (
            <div className="py-8 text-center">
              <p className="text-red-400/80 text-sm mb-4">{error}</p>
              <button
                onClick={() => { setError(''); setResponse(''); }}
                className="px-4 py-2 rounded-lg border border-white/10 text-white/40 hover:text-white text-sm transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {response && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-white/30 text-xs font-mono uppercase tracking-wider">
                  {selectedModel === 'claude' ? 'Claude' : 'Gemini'} Analysis
                </span>
                <button
                  onClick={handleCopy}
                  className="text-white/30 hover:text-[#BF5700] text-xs transition-colors flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </button>
              </div>
              <div className="prose prose-invert prose-sm max-w-none text-white/70 leading-relaxed whitespace-pre-wrap font-serif">
                {response}
              </div>
              <button
                onClick={() => { setResponse(''); setError(''); }}
                className="mt-6 w-full py-2 px-4 rounded-lg border border-white/10 text-white/40 hover:text-white text-sm font-display uppercase tracking-wider transition-colors"
              >
                New Analysis
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
