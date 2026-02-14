'use client';

import { useState } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';

interface AIAnalysisPanelProps {
  isOpen: boolean;
  onClose: () => void;
  gameContext: string;
}

type Provider = 'claude' | 'gemini';

const PROMPT_PRESETS = [
  { label: 'Key Takeaways', prompt: 'What are the 3-4 most important takeaways from this game?' },
  { label: 'Player Spotlight', prompt: 'Break down the standout individual performances in this game with statistical context.' },
  { label: 'Scouting Report', prompt: 'Write a professional scouting report on the key players based on this game data.' },
  { label: 'Season Outlook', prompt: 'Based on this opening game performance, what does this suggest about the team\'s 2026 season prospects?' },
];

export function AIAnalysisPanel({ isOpen, onClose, gameContext }: AIAnalysisPanelProps) {
  const [provider, setProvider] = useState<Provider>('claude');
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activePrompt, setActivePrompt] = useState('');

  async function handleAnalyze(prompt: string) {
    setActivePrompt(prompt);
    setLoading(true);
    setError('');
    setAnalysis('');

    try {
      const response = await fetch('/api/ai/game-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, prompt, gameContext }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || `Request failed (${response.status})`);
      }

      const data = (await response.json()) as { analysis: string };
      setAnalysis(data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis request failed');
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#0D0D0D] border-l border-white/10 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#BF5700]" />
            <h3 className="text-lg font-semibold text-white">AI Analysis</h3>
          </div>
          <button onClick={onClose} className="p-1 text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Provider Toggle */}
        <div className="px-6 py-3 border-b border-white/10 shrink-0">
          <div className="flex gap-1 bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setProvider('claude')}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                provider === 'claude'
                  ? 'bg-[#BF5700]/20 text-[#BF5700] border border-[#BF5700]/30'
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              Claude
            </button>
            <button
              onClick={() => setProvider('gemini')}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                provider === 'gemini'
                  ? 'bg-[#BF5700]/20 text-[#BF5700] border border-[#BF5700]/30'
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              Gemini
            </button>
          </div>
        </div>

        {/* Prompt Presets */}
        <div className="px-6 py-4 border-b border-white/10 shrink-0">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Analysis Type</p>
          <div className="grid grid-cols-2 gap-2">
            {PROMPT_PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handleAnalyze(preset.prompt)}
                disabled={loading}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                  activePrompt === preset.prompt
                    ? 'bg-[#BF5700]/20 text-[#BF5700] border-[#BF5700]/30'
                    : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white/80'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Response Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-6 h-6 text-[#BF5700] animate-spin" />
              <p className="text-sm text-white/40">Analyzing with {provider === 'claude' ? 'Claude' : 'Gemini'}...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-600/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {analysis && !loading && (
            <div className="prose prose-invert prose-sm max-w-none">
              <div className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
                {analysis}
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs text-white/30">
                  Powered by {provider === 'claude' ? 'Claude (Anthropic)' : 'Gemini (Google)'}
                </p>
              </div>
            </div>
          )}

          {!loading && !error && !analysis && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Sparkles className="w-8 h-8 text-white/20 mb-3" />
              <p className="text-sm text-white/40">Select an analysis type above to get AI-powered insights on this game.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
